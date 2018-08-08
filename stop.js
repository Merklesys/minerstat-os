/*
	USER => mstop
*/
"use strict";
/*
	CATCH ERROR's
*/
process.on('SIGINT', function() { });
process.on('uncaughtException', function(err) { })
process.on('unhandledRejection', (reason, p) => {});

const fkill = require('fkill');
var exec = require('child_process').exec;
try {
    fkill('cpuminer').then(() => {});
    fkill('bminer').then(() => {});
    fkill('zm').then(() => {});
    fkill('zecminer64').then(() => {});
    fkill('ethminer').then(() => {});
    fkill('ethdcrminer64').then(() => {});
    fkill('miner').then(() => {});
    fkill('sgminer').then(() => {});
    fkill('nsgpucnminer').then(() => {});
    fkill('xmr-stak').then(() => {});
    fkill('t-rex').then(() => {});
    fkill('CryptoDredge').then(() => {});
    fkill('lolMiner').then(() => {});
} catch (e) {}
var query = exec("killall node", function(error, stdout, stderr) {
    console.log("Terminated");
});
