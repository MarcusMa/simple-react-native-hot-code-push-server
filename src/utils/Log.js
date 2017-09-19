/*!
 * Log
 * Copyright(c) 2009-2017 Marcus Ma
 * E-mail:maji1991@sina.com
 * GitHub : https://github.com/MarcusMa
 * MIT Licensed
 */
'use strict';
const DEFAULT_TAG = "default";

function Log(msg) {
    var time = new Date();
    console.log(time.toLocaleString() + " - " + msg);
}

Log.prototype.e = function (tag, msg) {
    printLog("error", realTag, realMsg);
};
Log.prototype.i = function (tag, msg) {
    
    printLog("info", tag, msg);
}
Log.prototype.d = function (tag, msg) {
    printLog("debug", tag, msg);
}
Log.prototype.v = function (tag, msg) {
    printLog("vebose", tag, msg);
}
Log.prototype.w = function (tag, msg) {
    printLog("warn", tag, msg);
}

function printLog(prefix, tag, msg) {
    var realTag = DEFAULT_TAG;
    var realMsg = msg;
    if(msg != undefined){
        realTag = tag;
    }
    else{
        realMsg = tag;
    }
    var time = new Date();
    console.log(time.toLocaleString() + "-[" + prefix + "]\t" + " [" + realTag + "] " + " ~ " + realMsg);
}

module.exports = new Log();
// exports.Log = Log;