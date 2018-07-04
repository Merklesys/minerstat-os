var colors = require('colors');
const chalk = require('chalk');
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

function runMiner(miner, execFile, args, plus) {
    const execa = require('execa');
    try {
    var chmodQuery = require('child_process').exec;
    var setChmod = chmodQuery("cd /home/minerstat/minerstat-os/clients/; sudo chmod -R 777 *", function(error, stdout, stderr) {

        execa.shell('clients/' + miner + '/start.bash', {
            cwd: process.cwd(),
            detached: false,
            stdio: "inherit"
        }).then(result => {
            console.log("MINER => Closed");
        });
    });
    } catch (err) {
        console.log(err);
    }
}
module.exports = {
    /*
    	START MINER
    */
    start: async function(miner, startArgs) {
        var execFile, args;
        console.log(chalk.gray.bold(getDateTime() + " STARTING MINER: " + miner));
        console.log(chalk.white(getDateTime() + " " + miner + " => " + startArgs));
        var parse = require('parse-spawn-args').parse
        var sleep = require('sleep');
        sleep.sleep(2);
        if (miner.indexOf("ccminer") > -1) {
            args = startArgs;
            execFile = "ccminer";
        }
        if (miner == "claymore-eth") {
            args = "";
            execFile = "ethdcrminer64";
        }
        if (miner == "claymore-zec") {
            args = "";
            execFile = "zecminer64";
        }
        if (miner == "claymore-xmr") {
            args = "";
            execFile = "nsgpucnminer";
        }
        if (miner == "ewbf-zec" || miner == "ewbf-zhash") {
            args = startArgs;
            execFile = "miner";
        }
        if (miner == "bminer") {
            args = startArgs;
            execFile = "bminer";
        }
        if (miner == "ethminer") {
            args = startArgs;
            execFile = "ethminer";
        }
        if (miner.indexOf("sgminer") > -1) {
            var larg = "-c sgminer.conf --gpu-reorder --api-listen";
            args = larg;
            execFile = "sgminer";
        }
        if (miner == "zm-zec") {
            args = startArgs;
            execFile = "zm";
        }
        if (miner == "cpuminer-opt") {
            args = startArgs;
            execFile = "cpuminer";
        }
        if (miner == "xmr-stak") {
            args = "";
            execFile = "xmr-stak";
        }
        // FOR SAFE RUNNING MINER NEED TO CREATE START.BASH
        var writeStream = fs.createWriteStream(global.path + "/" + "clients/" + miner + "/start.bash");
        var str = "";
        if (args == "") {
            str = "cd /home/minerstat/minerstat-os/clients/" + miner + "/; ./" + execFile + " ";
        } else {
            str = "cd /home/minerstat/minerstat-os/clients/" + miner + "/; ./" + execFile + " " + args;
        }
        writeStream.write("" + str);
        writeStream.end();
        writeStream.on('finish', function() {
            runMiner(miner, execFile, args);
        });
    },
    /*
    	AUTO UPDATE
    */
    autoupdate: function(miner, startArgs) {
        var main = require('./start.js');
        main.boot(miner, startArgs);
    },
    /*
    	REMOTE COMMAND
    */
    remotecommand: function(command) {
        if (command !== "") {
            console.log(chalk.gray.bold("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
            console.log(chalk.hex('#ff8656')("REMOTE COMMAND: " + command));
            console.log(chalk.gray.bold("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
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
            if (command === "RESTARTWATTS") {
                var queryWattRes = exec("cd " + global.path + "/bin; sudo sh " + global.path + "/bin/overclock.sh", function(error, stdout, stderr) {
                    console.log("Apply new OverClock Settings !");
                    console.log(stdout + " " + stderr);
                    clearInterval(global.timeout);
                    clearInterval(global.hwmonitor);
                    var main = require('./start.js');
                    main.killall();
                    var sleep = require('sleep');
                    sleep.sleep(2);
                    main.killall();
                    sleep.sleep(3);
                    main.main();
                });
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
            var killQuery = require('child_process').exec;
            var killQueryProc = chmodQuery("sudo lsof -t -i:42000", function(error, stdout, stderr) { });
            fkill('bminer').then(() => {});
            fkill('ccminer').then(() => {});
            fkill('cpuminer').then(() => {});
            fkill('zecminer64').then(() => {});
            fkill('ethminer').then(() => {});
            fkill('ethdcrminer64').then(() => {});
            fkill('miner').then(() => {});
            fkill('sgminer').then(() => {});
            fkill('nsgpucnminer').then(() => {});
            fkill('zm').then(() => {});
            fkill('xmr-stak').then(() => {});
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
    fetch: function(gpuMiner, isCpu, cpuMiner) {
        var gpuSyncDone = false;
        var cpuSyncDone = false;
        global.sync = false;
        global.cpuSync = false;
        const telNet = require('net');
        var http = require('http');
        // ETHMINER
        if (gpuMiner.indexOf("ethminer") > -1) {
            // INTEGRATED TO THE CLIENT
            // START WITH --token ACCESKEY --worker WORKERNAME 
            gpuSyncDone = true;
            global.sync = true;
        }
        // BMINER
        if (gpuMiner.indexOf("bminer") > -1) {
            var options = {
                host: '127.0.0.1',
                port: 1880,
                path: '/api/status'
            };
            var req = http.get(options, function(response) {
                res_data = '';
                response.on('data', function(chunk) {
                    global.res_data += chunk;
                    gpuSyncDone = true;
                    global.sync = true;
                });
                response.on('end', function() {
                    gpuSyncDone = true;
                    global.sync = true;
                });
            });
            req.on('error', function(err) {
                console.log(chalk.hex('#ff8656')(getDateTime() + " MINERSTAT.COM: Package Error. " + err.message));
                gpuSyncDone = false;
                global.sync = true;
            });
        }
        // XMR-STAK
        if (gpuMiner.indexOf("xmr-stak") > -1) {
            var options = {
                host: '127.0.0.1',
                port: 2222,
                path: 'api.json'
            };
            var req = http.get(options, function(response) {
                res_data = '';
                response.on('data', function(chunk) {
                    global.res_data += chunk;
                    gpuSyncDone = true;
                    global.sync = true;
                });
                response.on('end', function() {
                    gpuSyncDone = true;
                    global.sync = true;
                });
            });
            req.on('error', function(err) {
                console.log(chalk.hex('#ff8656')(getDateTime() + " MINERSTAT.COM: Package Error. " + err.message));
                gpuSyncDone = false;
                global.sync = true;
            });
        }
        // CLAYMORE miner's
        if (gpuMiner.indexOf("claymore") > -1) {
            var options = {
                host: '127.0.0.1',
                port: 3333,
                path: '/'
            };
            var req = http.get(options, function(response) {
                res_data = '';
                response.on('data', function(chunk) {
                    global.res_data += chunk;
                    gpuSyncDone = true;
                    global.sync = true;
                });
                response.on('end', function() {
                    gpuSyncDone = true;
                    global.sync = true;
                });
            });
            req.on('error', function(err) {
                console.log(chalk.hex('#ff8656')(getDateTime() + " MINERSTAT.COM: Package Error. " + err.message));
                gpuSyncDone = false;
                global.sync = true;
            });
        }
        // CCMINER with all fork's
        if (gpuMiner.indexOf("ccminer") > -1) {
            const ccminerClient = telNet.createConnection({
                port: 3333
            }, () => {
                ccminerClient.write("summary");
            });
            ccminerClient.on('data', (data) => {
                console.log(data.toString());
                global.res_data = data.toString();
                gpuSyncDone = true;
                global.sync = true;
                ccminerClient.end();
            });
            ccminerClient.on('error', () => {
                gpuSyncDone = false;
                global.sync = true;
            });
            ccminerClient.on('end', () => {
                global.sync = true;
            });
        }
        // EWBF
        if (gpuMiner.indexOf("ewbf") > -1) {
            const ewbfClient = telNet.createConnection({
                port: 42000
            }, () => {
                ewbfClient.write("{\"id\":2, \"method\":\"getstat\"}\n");
            });
            ewbfClient.on('data', (data) => {
                console.log(data.toString());
                global.res_data = data.toString();
                gpuSyncDone = true;
                global.sync = true;
                ewbfClient.end();
            });
            ewbfClient.on('error', () => {
                gpuSyncDone = false;
                global.sync = true;
            });
            ewbfClient.on('end', () => {
                global.sync = true;
            });
        }
        // DSTM-ZEC
        if (gpuMiner.indexOf("zm-zec") > -1) {
            const dstmClient = telNet.createConnection({
                port: 2222
            }, () => {
                dstmClient.write("{\"id\":1, \"method\":\"getstat\"}\n");
            });
            dstmClient.on('data', (data) => {
                console.log(data.toString());
                global.res_data = data.toString();
                gpuSyncDone = true;
                global.sync = true;
                dstmClient.end();
            });
            dstmClient.on('error', () => {
                gpuSyncDone = false;
                global.sync = true;
            });
            dstmClient.on('end', () => {
                global.sync = true;
            });
        }
        // SGMINER with all fork's
        if (gpuMiner.indexOf("sgminer") > -1) {
            const sgminerClient = telNet.createConnection({
                port: 4028
            }, () => {
                sgminerClient.write("summary+pools+devs");
            });
            sgminerClient.on('data', (data) => {
                console.log(data.toString());
                global.res_data = data.toString();
                gpuSyncDone = true;
                global.sync = true;
                sgminerClient.end();
            });
            sgminerClient.on('error', () => {
                gpuSyncDone = false;
                global.sync = true;
            });
            sgminerClient.on('end', () => {
                global.sync = true;
            });
        }
        // CPUMINER
        if (isCpu.toString() == "true" || isCpu.toString() == "True") {
            const cpuminerClient = telNet.createConnection({
                port: 4048
            }, () => {
                cpuminerClient.write("summary");
            });
            cpuminerClient.on('data', (data) => {
                console.log(data.toString());
                global.cpu_data = data.toString();
                cpuSyncDone = true;
                global.cpuSync = true;
                cpuminerClient.end();
            });
            cpuminerClient.on('error', () => {
                cpuSyncDone = false;
                global.cpuSync = true;
            });
            cpuminerClient.on('end', () => {
                global.cpuSync = true;
            });
        }
        // LOOP UNTIL SYNC DONE
        var _flagCheck = setInterval(function() {
            var sync = global.sync;
            var cpuSync = global.cpuSync;
            if (isCpu.toString() == "true") {
                if (sync.toString() === "true" && cpuSync.toString() === "true") { // IS HASHING?
                    clearInterval(_flagCheck);
                    var main = require('./start.js');
                    main.callBackSync(gpuSyncDone, cpuSyncDone);
                }
            } else {
                if (sync.toString() === "true") { // IS HASHING?
                    clearInterval(_flagCheck);
                    var main = require('./start.js');
                    main.callBackSync(gpuSyncDone, cpuSyncDone);
                }
            }
        }, 2000); // interval set at 2000 milliseconds
    }
};
