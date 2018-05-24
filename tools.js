var colors = require('colors');
var pump = require('pump');
var fs = require('fs');
const https = require('https');

function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;
    sec = (sec < 10 ? "0" : "") + sec;
    return hour + ":" + min + ":" + sec;
}
module.exports = {
    /*
    	START MINER
    */
    start: function() {
        var execFile, args;
        var parse = require('parse-spawn-args').parse
        if (global.client.indexOf("ccminer") > -1) {
            args = parse(global.chunk);
            execFile = "ccminer";
        }
        if (global.client == "claymore-eth") {
            args = "";
            execFile = "ethdcrminer64";
        }
        if (global.client == "claymore-zec") {
            args = "";
            execFile = "zecminer64";
        }
        if (global.client == "claymore-xmr") {
            args = "";
            execFile = "nsgpucnminer";
        }
        if (global.client == "ewbf-zec") {
            args = parse(global.chunk);
            execFile = "miner";
        }
        if (global.client == "bminer") {
            args = parse(global.chunk);
            execFile = "bminer";
        }
        if (global.client == "ethminer") {
            args = parse(global.chunk);
            execFile = "ethminer";
        }
        if (global.client.indexOf("sgminer") > -1) {
            var larg = "-c sgminer.conf --gpu-reorder --api-listen";
            args = parse(larg);
            execFile = "sgminer";
        }
        if (global.client == "zm-zec") {
            args = parse(global.chunk);
            execFile = "zm";
        }
        const execa = require('execa');
        try {
            if (args != "") {
                execa.shell('clients/' + global.client + '/' + execFile, args, {
                    cwd: process.cwd(),
                    detached: false,
                    stdio: "inherit"
                }).then(result => {
                    console.log("MINER => Closed");
                });
            } else {
                execa.shell('clients/' + global.client + '/' + execFile, {
                    cwd: process.cwd(),
                    detached: false,
                    stdio: "inherit"
                }).then(result => {
                    console.log("MINER => Closed");
                });
            }
        } catch (err) {
            console.log(err);
        }
    },
    /*
    	AUTO UPDATE
    */
    autoupdate: function() {
        var main = require('./start.js');
        main.boot();
    },
    /*
    	REMOTE COMMAND
    */
    remotecommand: function(command) {
        if (command !== "") {
            console.log(colors.magenta("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
            console.log(colors.red("REMOTE COMMAND: " + command));
            console.log(colors.magenta("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
            var exec = require('child_process').exec;
            if (command === "RESTARTNODE") {
                clearInterval(global.timeout);
                clearInterval(global.hwmonitor);
                var main = require('./start.js');
                main.killall();
                var sleep = require('sleep');
                sleep.sleep(2);
                main.killall();
                sleep.sleep(3);
                main.main();
            }
            if (command === "DOWNLOADWATTS") {
                var queryWatt = exec("cd " + global.path + "/bin; sudo sh " + global.path + "/bin/overclock.sh", function(error, stdout, stderr) {
                    console.log("Apply new OverClock Settings !");
                    console.log(stdout + " " + stderr);
                });
            }
            if (command === "REBOOT") {
                var queryBoot = exec("sudo reboot -f", function(error, stdout, stderr) {
                    console.log("System going to reboot now..");
                });
            }
        }
    },
    /*
    	KILL ALL RUNNING MINER
    */
    killall: function() {
        const fkill = require('fkill');
        try {
            fkill('bminer').then(() => {});
            fkill('ccminer').then(() => {});
            fkill('zecminer64').then(() => {});
            fkill('ethminer').then(() => {});
            fkill('ethdcrminer64').then(() => {});
            fkill('miner').then(() => {});
            fkill('sgminer').then(() => {});
            fkill('nsgpucnminer').then(() => {});
            fkill('zm').then(() => {});
        } catch (err) {}
    },
    /*
    	START
    */
    restart: function() {
        var main = require('./start.js');
        main.main();
    },
    /*
    	FETCH INFO
    */
    fetch: function() {
        const telNet = require('net');
        var http = require('http');
        // ETHMINER
        if (global.client.indexOf("ethminer") > -1) {
            // INTEGRATED TO THE CLIENT
            // START WITH --token ACCESKEY --worker WORKERNAME 
            global.sync = new Boolean(true);
        }
        // BMINER
        if (global.client.indexOf("bminer") > -1) {
            var options = {
                host: '127.0.0.1',
                port: 1880,
                path: '/api/status'
            };
            var req = http.get(options, function(response) {
                res_data = '';
                response.on('data', function(chunk) {
                    global.res_data += chunk;
                    global.status = new Boolean(true);
                });
                response.on('end', function() {
                    global.sync = new Boolean(true);
                });
            });
            req.on('error', function(err) {
                console.log(colors.red(getDateTime() + " MINERSTAT.COM: Package Error. " + err.message));
                global.sync = new Boolean(false);
            });
        }
        // CLAYMORE miner's
        if (global.client.indexOf("claymore") > -1) {
            var options = {
                host: '127.0.0.1',
                port: 3333,
                path: '/'
            };
            var req = http.get(options, function(response) {
                res_data = '';
                response.on('data', function(chunk) {
                    global.res_data += chunk;
                    global.status = new Boolean(true);
                });
                response.on('end', function() {
                    global.sync = new Boolean(true);
                });
            });
            req.on('error', function(err) {
                console.log(colors.red(getDateTime() + " MINERSTAT.COM: Package Error. " + err.message));
                global.sync = new Boolean(false);
            });
        }
        // CCMINER with all fork's
        if (global.client.indexOf("ccminer") > -1) {
            const ccminerClient = telNet.createConnection({
                port: 3333
            }, () => {
                ccminerClient.write("summary");
            });
            ccminerClient.on('data', (data) => {
                console.log(data.toString());
                global.res_data = data.toString();
                if (data.toString() === "") {
                    global.sync = new Boolean(false);
                } else {
                    global.sync = new Boolean(true);
                }
                ccminerClient.end();
            });
            ccminerClient.on('end', () => {});
        }
        // EWBF
        if (global.client.indexOf("ewbf") > -1) {
            const ewbfClient = telNet.createConnection({
                port: 42000
            }, () => {
                ewbfClient.write("{\"id\":2, \"method\":\"getstat\"}\n");
            });
            ewbfClient.on('data', (data) => {
                console.log(data.toString());
                global.res_data = data.toString();
                if (data.toString() === "") {
                    global.sync = new Boolean(false);
                } else {
                    global.sync = new Boolean(true);
                }
                ewbfClient.end();
            });
            ewbfClient.on('end', () => {});
        }
        // DSTM-ZEC
        if (global.client.indexOf("zm-zec") > -1) {
            const dstmClient = telNet.createConnection({
                port: 2222
            }, () => {
                dstmClient.write("{\"id\":1, \"method\":\"getstat\"}\n");
            });
            dstmClient.on('data', (data) => {
                console.log(data.toString());
                global.res_data = data.toString();
                if (data.toString() === "") {
                    global.sync = new Boolean(false);
                } else {
                    global.sync = new Boolean(true);
                }
                dstmClient.end();
            });
            dstmClient.on('end', () => {});
        }
        // SGMINER with all fork's
        if (global.client.indexOf("sgminer") > -1) {
            const sgminerClient = telNet.createConnection({
                port: 4028
            }, () => {
                sgminerClient.write("summary+pools+devs");
            });
            sgminerClient.on('data', (data) => {
                console.log(data.toString());
                global.res_data = data.toString();
                if (data.toString() === "") {
                    global.sync = new Boolean(false);
                } else {
                    global.sync = new Boolean(true);
                }
                sgminerClient.end();
            });
            sgminerClient.on('end', () => {});
        }
        // LOOP UNTIL SYNC DONE
        var _flagCheck = setInterval(function() {
            var sync = global.sync;
            if (sync.toString() === "true") { // IS HASHING?
                clearInterval(_flagCheck);
                var main = require('./start.js');
                main.callBackSync();
            }
        }, 2000); // interval set at 2000 milliseconds
    }
};