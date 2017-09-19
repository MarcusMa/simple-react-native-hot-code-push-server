/*!
 * Log
 * Copyright(c) 2009-2017 Marcus Ma
 * MIT Licensed
 */
'use strict';

function Log(msg) {
    var time = new Date();
    console.log(time.toLocaleString() + " - " + msg);
}

Log.prototype.e = function (tag, msg) {
    printLog("error", tag, msg);
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

function printLog(prefix, tag, msg) {
    var time = new Date();
    console.log(time.toLocaleString() + "-[" + prefix + "]\t" + " [" + tag + "] " + " ~ " + msg);
}

module.exports = new Log();
// exports.Log = Log;