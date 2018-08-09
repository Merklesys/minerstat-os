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
global.chunkCpu;
global.watchnum;
var tools = require('./tools.js');
var monitor = require('./monitor.js');
var settings = require("./config.js");
const chalk = require('chalk');
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
    console.log(chalk.gray('Installation Done!'));
    console.log(chalk.gray('Please remove your HDMI cables and press ENTER to REBOOT.'));
    console.log(chalk.gray(''));
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
    childz = execz("mstop", function(error, stdout, stderr) {});
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

function restartNode() {
   global.watchnum ++;
   if (global.watchnum == 3) {
      console.log(chalk.hex('#ff9970').bold(getDateTime() + " minerstat: Error detected  [" + global.worker + "]"));     
      console.log(chalk.hex('#ff9970').bold(getDateTime() + " minerstat: Restarting..    [" + global.worker + "]"));                  
      clearInterval(global.timeout);
      clearInterval(global.hwmonitor);
      tools.restart();
   }
   if (global.watchnum == 6) {
      console.log(chalk.hex('#ff9970').bold(getDateTime() + " minerstat: Error detected  [" + global.worker + "]"));     
      console.log(chalk.hex('#ff9970').bold(getDateTime() + " minerstat: Rebooting..     [" + global.worker + "]"));                  
      clearInterval(global.timeout);
      clearInterval(global.hwmonitor);
      var exec = require('child_process').exec;
      var queryBoot = exec("sudo reboot -f", function(error, stdout, stderr) {
      	console.log("System going to reboot now..");
      });
   }
}
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
        var sync = global.sync;
        var res_data = global.res_data;
        var cpu_data = global.cpu_data;
        var power_data = hwPower;
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
            if (error == null)  {
                // Process Remote Commands
                var tools = require('./tools.js');
                tools.remotecommand(body);
                // Display GPU Sync Status
                var sync = gpuSyncDone;
                var cpuSync = cpuSyncDone;
                if (sync.toString() === "true") {
		    global.watchnum = 0;
                    console.log(chalk.green.bold(getDateTime() + " minerstat: " + global.client + " Updated  [" + global.worker + "]"));
                } else {
		    restartNode();
                    console.log(chalk.hex('#ff9970').bold(getDateTime() + " minerstat: ERROR  [" + global.worker + "]"));
                    console.log(chalk.hex('#ff9970').bold(getDateTime() + " REASON => " + global.client + " not hashing!"));
                }
                if (global.minerCpu.toString() === "true") {
                    if (cpuSync.toString() === "true") {
                        console.log(chalk.green.bold(getDateTime() + " minerstat: " + global.cpuDefault.toLowerCase() + " Updated  [" + global.worker + "]"));
                    } else {
			//restartNode();
                        console.log(chalk.hex('#ff9970').bold(getDateTime() + " minerstat: ERROR  [" + global.worker + "]"));
                        console.log(chalk.hex('#ff9970').bold(getDateTime() + " REASON => " + global.cpuDefault.toLowerCase() + " not hashing!"));
                    }
                }
            } else {
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
	global.watchnum = 0;
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
                clearInterval(global.timeout);
                clearInterval(global.hwmonitor);
                console.log(chalk.hex('#ff9970').bold(getDateTime() + " Waiting for connection.."));
                sleep.sleep(10);
                tools.restart();
            }
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
            var setChmod = chmodQuery("cd /home/minerstat/minerstat-os/; sudo chmod -R 777 *", function(error, stdout, stderr) {
                console.log("New permissions applied to the downloaded files => 0777");
                dlconf(minerName, minerType);
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
            if (miner.indexOf("z-enemy") > -1) {
                global.file = "clients/" + miner + "/start.bash";
            }
	        if (miner.indexOf("cryptodredge") > -1) {
                global.file = "clients/" + miner + "/start.bash";
            }
            if (miner.indexOf("claymore") > -1) {
                global.file = "clients/" + miner + "/config.txt";
            }
	        if (miner.indexOf("trex") > -1) {
                global.file = "clients/" + miner + "/config.json";
            }
            if (miner.indexOf("xmrig") > -1) {
                global.file = "clients/" + miner + "/config.json";
            }
	        if (miner.indexOf("lolminer") > -1) {
                global.file = "clients/" + miner + "/user_config.json";
            }
            if (miner.indexOf("sgminer") > -1) {
                global.file = "sgminer.conf";
            }
            if (miner.indexOf("zm-zec") > -1) {
                global.file = "clients/" + miner + "/start.bash";
            }
            if (miner.indexOf("xmr-stak") > -1) {
                global.file = "clients/" + miner + "/pools.txt";
            }
            needle.get('https://api.minerstat.com/v2/conf/gpu/' + global.accesskey + '/' + global.worker + '/' + miner.toLowerCase(), function(error, response) {
                if (clientType == "cpu") {
                    global.chunkCpu = response.body;
                } else {
                    global.chunk = response.body;
                }
                if (miner != "ewbf-zec" &&  miner != "bminer" && miner != "ewbf-zhash" && miner != "ethminer" && miner != "zm-zec" && miner != "z-enemy" && miner != "cryptodredge" && miner.indexOf("ccminer") === -1 && miner.indexOf("cpu") === -1) {
                    var writeStream = fs.createWriteStream(global.path + "/" + global.file);
                    var str = response.body;
                    if (miner.indexOf("sgminer") > -1) {
                        str = JSON.stringify(str);
                    }
		    if (miner.indexOf("trex") > -1) {
                        str = JSON.stringify(str);
                    }
		    if (miner.indexOf("lolminer") > -1) {
                        str = JSON.stringify(str);
                    }
            if (miner.indexOf("xmrig") > -1) {
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
