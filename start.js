/*
	GLOBAL FUNCTION's
*/
"use strict";
global.path = __dirname;
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
global.chunkCpu;
global.watchnum = 0;
var colors = require('colors'),
    exec = require('child_process').exec,
    fs = require('fs'),
    path = require('path'),
    pump = require('pump'),
    sleep = require('sleep'),
    tools = require('./tools.js'),
    monitor = require('./monitor.js'),
    settings = require("./config.js");
const chalk = require('chalk');
/*
	CATCH ERROR's
*/
process.on('SIGINT', function() {
    var execProc = require('child_process').exec,
        childrenProc;
    console.log("Ctrl + C --> Closing running miner & minerstat");
    tools.killall();
    childrenProc = execProc("SID=$(screen -list | grep minerstat-console | cut -f1 -d'.' | sed 's/[^0-9]*//g'); screen -X -S $SID'.minerstat-console' quit;", function(error, stdout, stderr) {});
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
    var date = new Date(),
        hour = date.getHours(),
        min = date.getMinutes(),
        sec = date.getSeconds();
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;
    sec = (sec < 10 ? "0" : "") + sec;
    return hour + ":" + min + ":" + sec;
}
module.exports = {
    callBackSync: function(gpuSyncDone, cpuSyncDone) {
        // WHEN MINER INFO FETCHED, FETCH HARDWARE INFO
        if (global.gputype === "nvidia") {
            monitor.HWnvidia(gpuSyncDone, cpuSyncDone);
        }
        if (global.gputype === "amd") {
            monitor.HWamd(gpuSyncDone, cpuSyncDone);
        }
    },
    callBackHardware: function(hwdatas, gpuSyncDone, cpuSyncDone, hwPower) {
        // WHEN HARDWARE INFO FETCHED SEND BOTH RESPONSE TO THE SERVER
        var sync = global.sync,
            res_data = global.res_data,
            cpu_data = global.cpu_data,
            power_data = hwPower;
        //console.log(res_data);         //SHOW SYNC OUTPUT
        // SEND LOG TO SERVER                         
        var request = require('request');
        request.post({
            url: 'https://api.minerstat.com/v2/set_node_config.php?token=' + global.accesskey + '&worker=' + global.worker + '&miner=' + global.client.toLowerCase() + '&ver=4&cpuu=' + global.minerCpu + '&cpud=HASH' + '&os=linux&currentcpu=' + global.cpuDefault.toLowerCase() + '&hwType=' + global.minerType,
            form: {
                minerData: res_data,
                cpuData: cpu_data,
                hwData: hwdatas,
                hwPower: power_data
            }
        }, function(error, response, body) {
            console.log(chalk.gray("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
            if (error == null) {
                // Process Remote Commands
                var tools = require('./tools.js');
                tools.remotecommand(body.replace(" ", ""));
                // Display GPU Sync Status
                var sync = gpuSyncDone,
                    cpuSync = cpuSyncDone;
                if (sync.toString() === "true") {
                    global.watchnum = 0;
                    console.log(chalk.green.bold(getDateTime() + " minerstat: " + global.client + " Updated  [" + global.worker + "]"));
                } else {
                    console.log(chalk.hex('#ff9970').bold(getDateTime() + " minerstat: ERROR  [" + global.worker + "]"));
                    console.log(chalk.hex('#ff9970').bold(getDateTime() + " REASON => " + global.client + " not hashing!"));
                }
                if (global.minerCpu.toString() === "true") {
                    if (cpuSync.toString() === "true") {
                        console.log(chalk.green.bold(getDateTime() + " minerstat: " + global.cpuDefault.toLowerCase() + " Updated  [" + global.worker + "]"));
                    } else {
                        console.log(chalk.hex('#ff9970').bold(getDateTime() + " minerstat: ERROR  [" + global.worker + "]"));
                        console.log(chalk.hex('#ff9970').bold(getDateTime() + " REASON => " + global.cpuDefault.toLowerCase() + " not hashing!"));
                    }
                }
            } else {
                console.log("ERROR => " + error);
                console.log(chalk.hex('#ff9970').bold(getDateTime() + " MINERSTAT.COM: CONNECTION LOST  [" + global.worker + "]"));
            }
            console.log(chalk.gray(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
        });
    },
    boot: function(miner, startArgs) {
        var tools = require('./tools.js');
        tools.start(miner, startArgs);
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
        global.cpuSync;
        global.res_data;
        global.cpu_data;
        global.sync_num;
        global.sync = new Boolean(false);
        global.cpuSync = new Boolean(false);
        global.sync_num = 0;
        global.res_data = "";
        global.cpu_data = "";
        global.dlGpuFinished = false;
        global.dlCpuFinished = false;
        //global.watchnum = 0;
        console.log(chalk.gray(getDateTime() + " WORKER: " + global.worker));
        // GET DEFAULT CLIENT AND SEND STATUS TO THE SERVER
        sleep.sleep(1);
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
                // Poke server
                global.configtype = "simple";
                var request = require('request');
                request.get({
                    url: 'https://api.minerstat.com/v2/set_node_config.php?token=' + global.accesskey + '&worker=' + global.worker + '&miner=' + global.client.toLowerCase() + '&os=linux&ver=5&cpuu=' + global.minerCpu,
                    form: {
                        dump: "minerstatOSInit"
                    }
                }, function(error, response, body) {
                    console.log(chalk.gray("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
                    console.log(chalk.green.bold(getDateTime() + " MINERSTAT.COM: Waiting for the first sync.. (30 sec)"));
                    console.log(chalk.gray(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
                });
            } else {
                console.log("ERROR => " + error);
                clearInterval(global.timeout);
                clearInterval(global.hwmonitor);
                console.log(chalk.hex('#ff9970').bold(getDateTime() + " Waiting for connection.."));
                sleep.sleep(10);
                tools.restart();
            }
        });
        if (global.reboot === "yes") {
            var childp = require('child_process').exec,
                queries = childp("sudo reboot -f", function(error, stdout, stderr) {
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
            var gpuServerVersion,
                cpuServerVersion,
                gpuLocalVersion,
                cpuLocalVersion,
                dlGpu = false,
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
                if (isCpu.toString() == "true" || isCpu.toString() == "True") {
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
                if (isCpu.toString() == "true" || isCpu.toString() == "True") {
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
        // Function for add permissions to run files
        function applyChmod(minerName, minerType) {
            var chmodQuery = require('child_process').exec;
            try {
                var setChmod = chmodQuery("cd /home/minerstat/minerstat-os/; sudo chmod -R 777 *", function(error, stdout, stderr) {
                    console.log(minerName + " => New permissions has been applied to the downloaded files => 0777");
                    dlconf(minerName, minerType);
                });
            } catch (error) {
                console.error(error);
                var setChmod = chmodQuery("sync; cd /home/minerstat/minerstat-os/; sudo chmod -R 777 *", function(error, stdout, stderr) {
                    console.log(minerName + " => New permissions has been applied to the downloaded files => 0777");
                    dlconf(minerName, minerType);
                });
            }
        }
        // Callback downloadMiners(<#gpuMiner#>, <#isCpu#>, <#cpuMiner#>)
        function callbackVersion(dlGpu, isCpu, dlCpu, callbackType, gpuMiner, cpuMiner, gpuServerVersion, cpuServerVersion) {
            if (callbackType == "gpu") {
                if (dlGpu == true) {
                    deleteFolder('clients/' + gpuMiner.toLowerCase() + '/');
                    sleep.sleep(2);
                    downloadCore(gpuMiner.toLowerCase(), "gpu", gpuServerVersion);
                } else {
                    applyChmod(gpuMiner.toLowerCase(), "gpu");
                }
            }
            if (callbackType == "cpu") {
                if (isCpu.toString() == "true" || isCpu.toString() == "True") {
                    if (dlCpu == true) {
                        deleteFolder('clients/' + cpuMiner.toLowerCase() + '/');
                        sleep.sleep(2);
                        downloadCore(cpuMiner.toLowerCase(), "cpu", cpuServerVersion);
                    } else {
                        applyChmod(cpuMiner.toLowerCase(), "cpu");
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
            console.log(chalk.gray(getDateTime() + " Downloading: " + miner));
            download('http://static.minerstat.farm/miners/linux/' + miner + '.zip', global.path + '/').then(() => {
                const decompress = require('decompress');
                console.log(chalk.green.bold(getDateTime() + " Download complete: " + miner));
                console.log(chalk.gray(getDateTime() + " Decompressing: " + miner));
                decompress(miner + '.zip', global.path + '/clients/' + miner).then(files => {
                    console.log(chalk.green.bold(getDateTime() + " Decompressing complete: " + miner));
                    // Remove .zip
                    deleteFile(miner + ".zip");
                    // Store version  
                    try {
                        fs.writeFile('clients/' + miner + '/msVersion.txt', '' + serverVersion.trim(), function(err) {});
                    } catch (error) {}
                    // Start miner
                    applyChmod(miner, clientType);
                });
            });
        }
        //// GET CONFIG TO YOUR DEFAULT MINER
        async function dlconf(miner, clientType) {
            // MINER DEFAULT CONFIG file
            // IF START ARGS start.bash if external config then use that.
            const MINER_CONFIG_FILE = {
                "bminer": "start.bash",
                "ewbf-zec": "start.bash",
                "ewbf-zhash": "start.bash",
                "ethminer": "start.bash",
                "ccminer-alexis": "start.bash",
                "ccminer-djm34": "start.bash",
                "ccminer-krnlx": "start.bash",
                "ccminer-tpruvot": "start.bash",
                "ccminer-x16r": "start.bash",
                "z-enemy": "start.bash",
                "cryptodredge": "start.bash",
                "claymore-eth": "config.txt",
                "claymore-zec": "config.txt",
                "claymore-xmr": "config.txt",
                "trex": "config.json",
                "xmrig": "config.json",
                "xmrig-amd": "start.bash",
                "lolminer": "user_config.json",
                "phoenix-eth": "config.txt",
                "sgminer-gm": "sgminer.conf",
                "sgminer-avermore": "sgminer.conf",
                "zm-zec": "start.bash",
                "xmr-stak": "pools.txt"
            };
            global.file = "clients/" + miner + "/" + MINER_CONFIG_FILE[miner];
            needle.get('https://api.minerstat.com/v2/conf/gpu/' + global.accesskey + '/' + global.worker + '/' + miner.toLowerCase(), function(error, response) {
                if (error === null) {
                    if (clientType == "cpu") {
                        global.chunkCpu = response.body;
                    } else {
                        global.chunk = response.body;
                    }
                    if (miner != "ewbf-zec" && miner != "bminer" && miner != "xmrig-amd" && miner != "ewbf-zhash" && miner != "ethminer" && miner != "zm-zec" && miner != "z-enemy" && miner != "cryptodredge" && miner.indexOf("ccminer") === -1 && miner.indexOf("cpu") === -1) {
                        var writeStream = fs.createWriteStream(global.path + "/" + global.file);
                        // This ARRAY only need to fill if the miner using JSON config.
                        var str = response.body,
                            stringifyArray = ["sgminer", "sgminer-gm", "sgminer-avermore", "trex", "lolminer", "xmrig"];
                        if (stringifyArray.indexOf(miner) > -1) {
                            str = JSON.stringify(str);
                        }
                        writeStream.write("" + str);
                        writeStream.end();
                        writeStream.on('finish', function() {
                            //tools.killall();
                            tools.autoupdate(miner, str);
                        });
                    } else {
                        //console.log(response.body);
                        //tools.killall();
                        tools.autoupdate(miner, response.body);
                    }
                    if (clientType == "gpu") {
                        console.log(chalk.gray(getDateTime() + " ONLINE CONFIG GPU TYPE: " + global.minerType));
                        console.log(chalk.gray(getDateTime() + " LOCAL GPU TYPE: " + global.gputype));
                        console.log("*** Hardware monitor is running in the background.. ***");
                        global.dlGpuFinished = true;
                    }
                    if (clientType == "cpu") {
                        global.dlCpuFinished = true;
                    }
                } else {
                // Error (Restart)
                console.log("ERROR => " + error);
                clearInterval(global.timeout);
                clearInterval(global.hwmonitor);
                sleep.sleep(10);
                tools.restart();
                }
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