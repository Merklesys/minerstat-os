module.exports = {
    /*
    	DETECT VIDEO CARD TYPE
    */
    detect: function() {
        var exec = require('child_process').exec,
            child;
        global.gputype = "unknown";
        child = exec("nvidia-smi -L", function(error, stdout, stderr) {
            var response = stdout;
            if (response.indexOf("GPU 0:") > -1) {
                global.gputype = "nvidia";
            }
            if (error !== null) {
                console.log('Hardware Monitor: Nvidia GPU not found');
            }
        });
        child = exec(global.path + "/bin/amdcovc", function(error, stdout, stderr) {
            var response = stdout;
            if (response.indexOf("Adapter") !== -1) {
                global.gputype = "amd";
            }
            if (error !== null) {
                console.log('Hardware Monitor: AMD GPU not found');
            }
        });
    },
    /*
    	AMDCOVC - AMD
    */
    HWamd: function(gpuSyncDone, cpuSyncDone) {
        var exec = require('child_process').exec,
            query = exec(global.path + "/bin/amdcovc", function(error, stdout, stderr) {
                var amdResponse = stdout,
                    queryPower = exec("cd " + global.path + "/bin/; sudo ./rocm-smi -P | grep 'GPU Power' | sed 's/.*://' | sed 's/W/''/g' | xargs", function(error, stdout, stderr) {
                    //console.log("Estimated GPU Consumption(s): " + stdout);
                    isfinished(amdResponse, "amd", gpuSyncDone, cpuSyncDone, stdout);
                });
            });
    },
    /*
    	NVIDIA-SMI - NVIDIA
    */
    HWnvidia: function(gpuSyncDone, cpuSyncDone) {
        var lstart = -1;
            response_start = -1,
            exec = require('child_process').exec;
        var gpunum,
            monitorObject = {};
        gpunum = exec("nvidia-smi --query-gpu=count --format=csv,noheader | tail -n1", function(error, stdout, stderr) {
            var response = stdout;
            while (lstart != (response - 1)) {
                lstart++;
                var q2 = exec("nvidia-smi -i " + lstart + " --query-gpu=name,temperature.gpu,fan.speed,power.draw --format=csv,noheader | tail -n1", function(error, stdout, stderr) {
                        
                        // Fix ID, push to Object to avoid ID floating issues.
                        var idFix = lstart;					
						                        
                        // New Array to Fixed ID
                        monitorObject[idFix] = stdout;	
                       
                        //monitorObject[lstart].push(stdout);
                        response_start++;
                        if (response_start == (response - 1)) {
                            isfinished(monitorObject, "nvidia", gpuSyncDone, cpuSyncDone, "");
                        }
                    });
            } // END WHILE
        }); // END FETCH
    } // END HWNvidia
} // END MODULE.EXPORT
function isfinished(hwdatar, typ, gpuSyncDone, cpuSyncDone, powerResponse) {
    if (typ === "nvidia") {
        // ARRAY to JSON
        var hwdatas = JSON.stringify(hwdatar);
    } else {
        var hwdatas = hwdatar,
            hwPower = powerResponse;
    }
    /*
    	MAIN FUNCTIONS
    */
    console.log("[" + typ + "] Hardware Monitor: " + hwdatas);
    /*
    	SEND DATA TO ENDPOINT
    */
    var main = require('./start.js');
    main.callBackHardware(hwdatas, gpuSyncDone, cpuSyncDone, hwPower);
}