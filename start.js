/*
	GLOBAL FUNCTION's
*/
"use strict";
global.path = __dirname;
var colors = require('colors');
var pump = require('pump');
var fs = require('fs');
let ascii_text_generator = require('ascii-text-generator');
global.timeout;
global.gputype;
global.configtype = "simple";
global.isalgo = "NO";
var tools = require('./tools.js');
var monitor = require('./monitor.js');
var settings = require("./config.js");
// THIS FUNCTION ONLY FOR MINERSTAT OS
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

function header() {
    console.log(colors.cyan("¸„.-•~¹°”ˆ˜¨¨˜ˆ”°¹~•-.„¸¸„.-•~¹°”ˆ˜¨¨˜ˆ”°¹~•-.„¸¸„.-•~¹°”ˆ˜¨¨˜ˆ”°"));
    console.log(colors.cyan("------------------------ minerstat OS ---------------------------"));
    console.log(colors.cyan("¨˜ˆ”°¹~•-.„¸¸„.-•~¹°”ˆ˜¨¨˜ˆ”°¹~•-.„¸¸„.-•~¹°”ˆ˜¨¨˜ˆ”°¹~•-.„¸¸„.-•"));
    console.log('');
    let input_text = "minerstAt";
    let text = "/*\n" + ascii_text_generator(input_text, "2") + "\n*/";
    console.log(text);
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
    boot: function() {
    var tools = require('./tools.js');
        tools.start();
    },
    main: function() {
    var tools = require('./tools.js');
    var monitor = require('./monitor.js');
        tools.killall();
        monitor.detect();
        global.sync;
        global.res_data;
        global.sync_num;
        global.sync = new Boolean(false);
        global.sync_num = 0;
        global.res_data = "";
        header();
        console.log(colors.cyan(getDateTime() + " WORKER: " + global.worker));
        // GET DEFAULT CLIENT AND SEND STATUS TO THE SERVER
        const https = require('https');
        var needle = require('needle');
        needle.get('https://minerstat.com/getresponse.php?action=getminer&token=' + global.accesskey + '&worker=' + global.worker, function(error, response) {
            if (error === null) {
                global.client = response.body;
            } else {
                clearInterval(global.timeout);
                clearInterval(global.hwmonitor);
                console.log(colors.red(getDateTime() + " Waiting for connection.."));
                tools.restart();
            }
            if (response.body === "algo") {
                global.configtype = "algo";
                global.isalgo = "YES";
                var request = require('request');
                request.get({
                    url: 'https://minerstat.com/profitswitch_api.php?token=' + global.accesskey + '&worker=' + global.worker,
                    form: {
                        mes: "kflFDKME"
                    }
                }, function(error, response, body) {
                    var json_string = response.body;
                    if (json_string.indexOf("ok") > -1) {
                        console.log(colors.magenta("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
                        console.log(colors.magenta(getDateTime() + " |ALGO| Profit Switch started"));
                        console.log(colors.magenta(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
                        var json_parse = JSON.parse(json_string);
                        global.algo_status = json_parse.response.status;
                        global.algo_bestalgo = json_parse.response.bestalgo;
                        global.algo_dualmode = json_parse.response.dualmode;
                        global.algo_client = json_parse.response.client;
                        global.client = json_parse.response.client;
                        global.algo_bestdual = json_parse.response.bestdual;
                        global.algo_revenue = json_parse.response.revenue;
                        global.algo_gputype = json_parse.response.gputype;
                        global.algo_checkdual = json_parse.response.checkdual;
                        global.algo_db = json_parse.response.db;
                        global.algo_ccalgo = json_parse.response.ccalgo;
                        dlconf();
                    }
                });
            } else {
                global.configtype = "simple";
                var request = require('request');
                request.get({
                    url: 'http://minerstat.com/control.php?worker=' + global.accesskey + '.' + global.worker + '&miner=' + response.body + '&os=linux&ver=4&cpu=NO',
                    form: {
                        mes: "kflFDKME"
                    }
                }, function(error, response, body) {
                    console.log(colors.magenta("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
                    console.log(colors.green(getDateTime() + " MINERSTAT.COM: Waiting for the first sync.. (60 sec)"));
                    console.log(colors.magenta(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
                });
                dlconf();
            }
        });
        if (global.reboot === "yes") {
            var childp = require('child_process').exec;
            var queries = childp("sudo reboot -f", function(error, stdout, stderr) {
                console.log("System going to reboot now..");
            });
        }
        if (global.reboot === "yes") {
            var childp = require('child_process').exec;
            var queries = childp("sudo reboot -f", function(error, stdout, stderr) {
                console.log("System going to reboot now..");
            });
        }
        //// GET CONFIG TO YOUR DEFAULT MINER
        function dlconf() {
            if (global.client.indexOf("bminer") > -1) {
                global.file = "clients/" + global.client + "/start.bash";
            }
            if (global.client.indexOf("ewbf") > -1) {
                global.file = "clients/" + global.client + "/start.bash";
            }
            if (global.client.indexOf("ethminer") > -1) {
                global.file = "clients/" + global.client + "/start.bash";
            }
            if (global.client.indexOf("ccminer") > -1) {
                global.file = "clients/" + global.client + "/start.bash";
            }
            if (global.client.indexOf("claymore") > -1) {
                global.file = "clients/" + global.client + "/config.txt";
            }
            if (global.client.indexOf("sgminer") > -1) {
                global.file = "sgminer.conf";
            }
            if (global.client.indexOf("zm-zec") > -1) {
                global.file = "clients/" + global.client + "/start.bash";
            }
            needle.get('https://minerstat.com/getconfig.php?action=' + global.configtype + '&token=' + global.accesskey + '&worker=' + global.worker + '&db=' + global.db + '&best=' + global.algo_bestalgo + '&bestdual=' + global.algo_bestdual + '&dualnow=' + global.algo_checkdual + '&dualon=' + global.algo_dual + '&ccalgo=' + global.algo_cc, function(error, response) {
                global.chunk = response.body;
                if (global.client != "ewbf-zec" && global.client != "ethminer" && global.client != "zm-zec" && global.client != "bminer" && global.client.indexOf("ccminer") === -1) {
                    var writeStream = fs.createWriteStream(global.path + "/" + global.file);
                    console.log(global.chunk);
                    var str = global.chunk;
                    if (global.client.indexOf("sgminer") > -1) {
                        str = JSON.stringify(str);
                    }
                    writeStream.write("" + str);
                    writeStream.end();
                    writeStream.on('finish', function() {
                        tools.killall();
                        tools.autoupdate();
                    });
                } else {
                    console.log(global.chunk);
                    tools.killall();
                    tools.autoupdate();
                }
                console.log(colors.cyan(getDateTime() + " GPU TYPE: " + global.gputype));
                console.log("*** Hardware monitor is running in the background.. ***");
            });
        }
        /*
        	CALLBACK's
         */
        function callBackSync() {
        // WHEN MINER INFO FETCHED, FETCH HARDWARE INFO
            if (global.gputype === "nvidia") {
                monitor.HWnvidia();
            }
            if (global.gputype === "amd") {
                monitor.HWamd();
            }
        }

        function callBackHardware(hwdatas) {
        // WHEN HARDWARE INFO FETCHED SEND BOTH RESPONSE TO THE SERVER
                var sync = global.sync;
                var res_data = global.res_data;
                if (sync.toString() === "true") { // IS HASHING?
                    // SEND LOG TO SERVER                         
                    var request = require('request');
                    request.post({
                        url: 'https://minerstat.com/getstat.php?token=' + global.accesskey + '&worker=' + global.worker + '&miner=' + global.client,
                        form: {
                            mes: res_data
                        }
                    }, function(error, response, body) {
                        console.log(colors.magenta("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
                        console.log(colors.green(getDateTime() + " MINERSTAT.COM: Package Sent [" + global.worker + "]"));
                        console.log(colors.magenta(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
                    });
                } else {
                    console.log(colors.magenta("•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`•.•´¯`• "));
                    console.log(colors.red(getDateTime() + " MINERSTAT.COM: Package Error  [" + global.worker + "]"));
                    console.log(colors.magenta(" .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`• .•´¯`•"));
                }          
        }
        /*
        	START LOOP 
        	Notice: If you modify this you will 'rate limited' [banned] from the sync server
        */
        (function() {
            global.timeout = setInterval(function() {
            var tools = require('./tools.js');
                global.sync_num++;
                tools.remotecommand();
                tools.fetch();
            }, 30000);
        })();
        /*
        	END LOOP
        */
    }
};
tools.restart();