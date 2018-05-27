/*
	GLOBAL FUNCTION's
*/
"use strict";
global.path = __dirname;
var colors = require('colors');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var pump = require('pump');
var sleep = require('sleep');
global.timeout;
global.gputype;
global.configtype = "simple";
global.isalgo = "NO";
global.cpuDefault;
global.minerType;
global.minerOverclock;
global.minerCpu;
global.dlGpuFinished;
global.dlCpuFinished;
var tools = require('./tools.js');
var monitor = require('./monitor.js');
var settings = require("./config.js");
// CONFIG PROTECTION
if (global.accesskey === "CHANGEIT" || global.accesskey === "") {
    var readlineSync = require('readline-sync');
    console.log("-*- If you see Segmentation fault error:");
    console.log("Type");
    console.log("(¯`·.¸¸.·´¯`·.¸¸.-> sudo node start");
    console.log("");
    console.log("After fill in your details");
    var qtoken = readlineSync.question("Please enter my.minerstat.com AccessKey: ");
    var qworker = readlineSync.question('Please enter my.minerstat.com Worker: ');
    var fstream = require('fs');
    var stream = fstream.createWriteStream("/media/storage/config.js");
    stream.once('open', function(fd) {
        stream.write("global.accesskey = '" + qtoken + "';\n");
        stream.write("global.worker = '" + qworker + "';\n");
        stream.write("global.path = __dirname;");
        stream.end();
    });
    global.accesskey = qtoken;
    global.worker = qworker;
    global.reboot = "yes";
    console.log(colors.cyan('Installation Done!'));
    console.log(colors.cyan('Please remove your HDMI cables and press ENTER to REBOOT.'));
    console.log(colors.cyan(''));
    var rreboot = readlineSync.question('Press Enter to REBOOT the System');
}
/*
	CATCH ERROR's
*/
process.on('SIGINT', function() {
    console.log("Ctrl + C --> Closing running miner & minerstat");
    tools.killall();
    var childz;
    var execz = require('child_process').exec;
    childz = execz("minestat-stop", function(error, stdout, stderr) {});
    process.exit();
});
process.on('uncaughtException', function(err) {
    console.log(err);
    var log = err + "";
    if (log.indexOf("ECONNREFUSED") > -1) {
        clearInterval(global.timeout);
        clearInterval(global.hwmonitor);
        tools.restart();
    }
})
process.on('unhandledRejection', (reason, p) => {});

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
    callBackSync: function() {
        // WHEN MINER INFO FETCHED, FETCH HARDWARE INFO
        if (global.gputype === "nvidia") {
            monitor.HWnvidia();
        }
        if (global.gputype === "amd") {
            monitor.HWamd();
        }
    },
    callBackHardware: function(hwdatas) {
        // WHEN HARDWARE INFO FETCHED SEND BOTH RESPONSE TO THE SERVER
        var sync = global.sync;
        var res_data = global.res_data;
        //console.log(res_data);         //SHOW SYNC OUTPUT
        // SEND LOG TO SERVER                         
        var request = require('request');
        request.post({
            url: 'https://api.minerstat.com/v2/set_node_config.php?token=' + global.accesskey + '&worker=' + global.worker + '&miner=' + global.client.toLowerCase() + '&ver=4&cpuu=' + global.minerCpu + '&cpud=HASH' + '&os=linux&currentcpu=' + global.cpuDefault.toLowerCase() + '&hwType=' + global.minerType,
            form: {
                minerData: res_data,
                hwData: hwdatas
            }
        }, function(error, response, body) {
            if (error == null)  {
                // Process Remote Commands
                var tools = require('./tools.js');
                tools.remotecommand(body);
                // Display Sync Status
                var sync = global.sync;
                if (sync.toString() === "true") {
                    console.log(colors.magenta("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
                    console.log(colors.green(getDateTime() + " MINERSTAT.COM: Package Sent [" + global.worker + "]"));
                    console.log(colors.magenta(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
                } else {
                    console.log(colors.red("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
                    console.log(colors.red(getDateTime() + " MINERSTAT.COM: Package Error  [" + global.worker + "]"));
                    console.log(colors.red(getDateTime() + " REASON => " + global.client + " not hashing!"));
                    console.log(colors.red(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
                }
            } else {
                console.log(colors.red("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
                console.log(colors.red(getDateTime() + " MINERSTAT.COM: CONNECTION LOST  [" + global.worker + "]"));
                console.log(colors.red(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
            }
        });
    },
    boot: function(miner) {
        var tools = require('./tools.js');
        tools.start(miner);
    },
    killall: function() {
        var tools = require('./tools.js');
        tools.killall();
    },
    main: function() {
        var tools = require('./tools.js');
        var monitor = require('./monitor.js');
        //tools.killall();
        monitor.detect();
        global.sync;
        global.res_data;
        global.sync_num;
        global.sync = new Boolean(false);
        global.sync_num = 0;
        global.res_data = "";
        global.dlGpuFinished = false;
        global.dlCpuFinished = false;
        console.log(colors.cyan(getDateTime() + " WORKER: " + global.worker));
        // GET DEFAULT CLIENT AND SEND STATUS TO THE SERVER
        const https = require('https');
        var needle = require('needle');
        needle.get('https://api.minerstat.com/v2/node/gpu/' + global.accesskey + '/' + global.worker, function(error, response) {
            if (error === null) {
                console.log(response.body);
                global.client = response.body.default;
                global.cpuDefault = response.body.cpuDefault;
                global.minerType = response.body.type;
                global.minerOverclock = response.body.overclock;
                global.minerCpu = response.body.cpu;
                // Download miner if needed
                downloadMiners(response.body.default, response.body.cpu, response.body.cpuDefault);
            } else {
                clearInterval(global.timeout);
                clearInterval(global.hwmonitor);
                console.log(colors.red(getDateTime() + " Waiting for connection.."));
                tools.restart();
            }
            global.configtype = "simple";
            var request = require('request');
            request.get({
                url: 'https://api.minerstat.com/v2/set_node_config.php?token=' + global.accesskey + '&worker=' + global.worker + '&miner=' + global.client.toLowerCase() + '&os=linux&ver=4&cpu=NO',
                form: {
                    dump: "minerstatOSInit"
                }
            }, function(error, response, body) {
                console.log(colors.magenta("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
                console.log(colors.green(getDateTime() + " MINERSTAT.COM: Waiting for the first sync.. (30 sec)"));
                console.log(colors.magenta(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
            });
        });
        if (global.reboot === "yes") {
            var childp = require('child_process').exec;
            var queries = childp("sudo reboot -f", function(error, stdout, stderr) {
                console.log("System going to reboot now..");
            });
        }
        // Remove directory recursively
        function deleteFolder(dir_path) {
            if (fs.existsSync(dir_path)) {
                fs.readdirSync(dir_path).forEach(function(entry) {
                    var entry_path = path.join(dir_path, entry);
                    if (fs.lstatSync(entry_path).isDirectory()) {
                        deleteFolder(entry_path);
                    } else {
                        fs.unlinkSync(entry_path);
                    }
                });
                fs.rmdirSync(dir_path);
            }
        }
        //// DOWNLOAD LATEST STABLE VERSION AVAILABLE FROM SELECTED minerCpu
        async function downloadMiners(gpuMiner, isCpu, cpuMiner) {
            var gpuServerVersion, cpuServerVersion, gpuLocalVersion, cpuLocalVersion, dlGpu, dlCpu;
            dlGpu = false;
            dlCpu = false;
            // Create clients folder if not exist
            var dir = 'clients';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            // Fetch Server Version
            var request = require('request');
            request.get({
                url: 'https://static.minerstat.farm/miners/linux/version.json'
            }, function(error, response, body) {
                var parseData = JSON.parse(body);
                gpuServerVersion = parseData[gpuMiner.toLowerCase()];
                if (isCpu.toString() == "true") {
                    cpuServerVersion = parseData[cpuMiner.toLowerCase()];
                }
                // main Miner Check's
                var dir = 'clients/' + gpuMiner.toLowerCase() + '/msVersion.txt';
                if (fs.existsSync(dir)) {
                    fs.readFile(dir, 'utf8', function(err, data) {
                        if (err) {
                            gpuLocalVersion = "0";
                        }
                        gpuLocalVersion = data;
                        if (gpuLocalVersion == undefined) {
                            gpuLocalVersion = "0";
                        }
                        if (gpuServerVersion == gpuLocalVersion) {
                            dlGpu = false;
                        } else {
                            dlGpu = true;
                        }
                        // Callback
                        callbackVersion(dlGpu, false, false, "gpu", gpuMiner, cpuMiner, gpuServerVersion, cpuServerVersion);
                    });
                } else {
                    dlGpu = true;
                    // Callback
                    callbackVersion(dlGpu, false, false, "gpu", gpuMiner, cpuMiner, gpuServerVersion, cpuServerVersion);
                }
                // cpu Miner Check's
                if (isCpu.toString() == "true") {
                    var dir = 'clients/' + cpuMiner.toLowerCase() + '/msVersion.txt';
                    if (fs.existsSync(dir)) {
                        fs.readFile(dir, 'utf8', function(err, data) {
                            if (err) {
                                cpuLocalVersion = "0";
                            }
                            cpuLocalVersion = data;
                            if (cpuLocalVersion == undefined) {
                                cpuLocalVersion = "0";
                            }
                            if (cpuServerVersion == cpuLocalVersion) {
                                dlCpu = false;
                            } else {
                                dlCpu = true;
                            }
                            // Callback
                            callbackVersion(false, true, dlCpu, "cpu", gpuMiner, cpuMiner, gpuServerVersion, cpuServerVersion);
                        });
                    } else {
                        dlCpu = true;
                        // Callback
                        callbackVersion(false, true, dlCpu, "cpu", gpuMiner, cpuMiner, gpuServerVersion, cpuServerVersion);
                    }
                }
            });
        }
        // Callback downloadMiners(<#gpuMiner#>, <#isCpu#>, <#cpuMiner#>)
        function callbackVersion(dlGpu, isCpu, dlCpu, callbackType, gpuMiner, cpuMiner, gpuServerVersion, cpuServerVersion) {
            if (callbackType == "gpu") {
                if (dlGpu == true) {
                    deleteFolder('clients/' + gpuMiner.toLowerCase() + '/');
                    sleep.sleep(2);
                    downloadCore(gpuMiner.toLowerCase(), "gpu", gpuServerVersion);
                } else {
                    dlconf(gpuMiner.toLowerCase(), "gpu");
                }
            }
            if (callbackType == "cpu") {
                if (isCpu.toString() == "true") {
                    if (dlCpu == true) {
                        deleteFolder('clients/' + cpuMiner.toLowerCase() + '/');
                        sleep.sleep(2);
                        downloadCore(cpuMiner.toLowerCase(), "cpu", cpuServerVersion);
                    } else {
                        dlconf(cpuMiner.toLowerCase(), "cpu");
                    }
                }
            }
        }
        // Function for deleting file's
        function deleteFile(file) {
            fs.unlink(file, function(err) {
                if (err) {
                    console.error(err.toString());
                } else {
                    //console.warn(file + ' deleted');
                }
            });
        }
        // Download latest package from the static server
        async function downloadCore(miner, clientType, serverVersion) {
            var miner = miner;
            const download = require('download');
            console.log(colors.cyan(getDateTime() + " Downloading: " + miner));
            download('http://static.minerstat.farm/miners/linux/' + miner + '.zip', global.path + '/').then(() => {
                const decompress = require('decompress');
                console.log(colors.green(getDateTime() + " Download complete: " + miner));
                console.log(colors.cyan(getDateTime() + " Decompressing: " + miner));
                decompress(miner + '.zip', global.path + '/clients/' + miner).then(files => {
                    console.log(colors.green(getDateTime() + " Decompressing complete: " + miner));
                    // Remove .zip
                    deleteFile(miner + ".zip");
                    // Store version  
                    try {
                        fs.writeFile('clients/' + miner + '/msVersion.txt', '' + serverVersion.trim(), function(err) {});
                    } catch (error) {}
                    // Start miner
                    dlconf(miner, clientType);
                });
            });
        }
        //// GET CONFIG TO YOUR DEFAULT MINER
        function dlconf(miner, clientType) {
            if (miner.indexOf("bminer") > -1) {
                global.file = "clients/" + miner + "/start.bash";
            }
            if (miner.indexOf("ewbf") > -1) {
                global.file = "clients/" + miner + "/start.bash";
            }
            if (miner.indexOf("ethminer") > -1) {
                global.file = "clients/" + miner + "/start.bash";
            }
            if (miner.indexOf("ccminer") > -1) {
                global.file = "clients/" + miner + "/start.bash";
            }
            if (miner.indexOf("claymore") > -1) {
                global.file = "clients/" + miner + "/config.txt";
            }
            if (miner.indexOf("sgminer") > -1) {
                global.file = "sgminer.conf";
            }
            if (miner.indexOf("zm-zec") > -1) {
                global.file = "clients/" + miner + "/start.bash";
            }
            needle.get('https://api.minerstat.com/v2/conf/gpu/' + global.accesskey + '/' + global.worker + '/' + miner.toLowerCase(), function(error, response) {
                global.chunk = response.body;
                if (miner != "ewbf-zec" && miner != "ethminer" && miner != "zm-zec" && miner != "bminer" && miner.indexOf("ccminer") === -1) {
                    var writeStream = fs.createWriteStream(global.path + "/" + global.file);
                    console.log(global.chunk);
                    var str = global.chunk;
                    if (miner.indexOf("sgminer") > -1) {
                        str = JSON.stringify(str);
                    }
                    writeStream.write("" + str);
                    writeStream.end();
                    writeStream.on('finish', function() {
                        //tools.killall();
                        tools.autoupdate(miner);
                    });
                } else {
                    console.log(global.chunk);
                    //tools.killall();
                    tools.autoupdate(miner);
                }
                if (clientType == "gpu") {
                    global.dlGpuFinished = true;
                }
                if (clientType == "cpu") {
                    global.dlCpuFinished = true;
                }
                console.log(colors.magenta(getDateTime() + " ONLINE CONFIG GPU TYPE: " + global.minerType));
                console.log(colors.magenta(getDateTime() + " LOCAL GPU TYPE: " + global.gputype));
                console.log("*** Hardware monitor is running in the background.. ***");
            });
        }
        /*
        	START LOOP 
        	Notice: If you modify this you will 'rate limited' [banned] from the sync server
        */
        (function() {
            global.timeout = setInterval(function() {
                // Start sync after compressing has been finished
                if (global.dlGpuFinished == true) {
                    var tools = require('./tools.js');
                    global.sync_num++;
                    tools.fetch(global.client, global.minerCpu, global.cpuDefault);
                }
            }, 30000);
        })();
        /*
        	END LOOP
        */
    }
};
tools.restart();