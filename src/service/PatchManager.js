/*!
 * PatchManager 
 * Copyright(c) 2009-2017 Marcus Ma
 * E-mail:maji1991@sina.com
 * GitHub : https://github.com/MarcusMa
 * MIT Licensed
 */
'use strict';

/**
 * Module dependencies.
 */

const exec = require('child_process').exec;
const crypto = require('crypto');
const fs = require('fs');
const Log = require('../utils/Log');
const BusinessInfo = require("../entity/BusinessInfo");
const PatchVersionInfo = require("../entity/PatchVersionInfo");
const BusinessManager = require("./BusinessManager");
const EventEmitter = require('events');
class PatchEmitter extends EventEmitter {}
const mPatchEmitter = new PatchEmitter();

const TAG = "PatchManager";
const DEFAULT_DIST_PATH = "./public/dist";
const DEFAULT_ORIGINSL_SOURCE_PATH = "./public/original";
const DEFAULT_COMMON_BUNDLE_FILE_PATH = DEFAULT_ORIGINSL_SOURCE_PATH + "/common_min.bundle";
const DEFAULT_BSDIFF_ROOT_PATH = "./bsdiff-4.3";
const DEFAULT_BSDIFF_CMD = DEFAULT_BSDIFF_ROOT_PATH + "/bsdiff";

/**
 * Defined the events during the patch process.
 */
const EVENT_START_BSDIFF_FILES = "event_start_bsdiff_files";
const EVENT_SINGLE_FILE_BSDIFF_SUCCESS = "event_single_file_bsdiff_success";
const EVENT_SINGLE_FILE_BSDIFF_FAILED = "event_single_file_bsdiff_failed";
const EVENT_START_COMPUTE_HASHCODE = "event_start_compute_hashcode";

var businessManager = null;
var distPath = DEFAULT_DIST_PATH;
var originalSourcePath = DEFAULT_ORIGINSL_SOURCE_PATH;
var commonBundleFilePath = DEFAULT_COMMON_BUNDLE_FILE_PATH;
var bsdiffRootPath = DEFAULT_BSDIFF_ROOT_PATH;
var bsdiffCmd = DEFAULT_BSDIFF_CMD;
// Record the files nums, which need to be bsdiffed.
var patchFileSize = 0;

function PatchManager() {}
PatchManager.prototype.init = _init;
PatchManager.prototype.setDistPath = _setDistPath;
PatchManager.prototype.setCommonBundleFilePath = _setCommonBundleFilePath;
PatchManager.prototype.setBsDiffRootPath = _setBsDiffRootPath;
PatchManager.prototype.setBsDiffCmd = _setBsDiffCmd;
PatchManager.prototype.startPatch = _startPatch;

/**
 * Initialized method, need a BusinessManager Object.
 * @param {BusinessManager} businessManager 
 */
function _init(manager) {
    if (manager instanceof BusinessManager) {
        businessManager = manager;
        // other init settings
    } else {
        Log.e(TAG, "Init failure, as input param is not A BusinessManager");
    }
}

/**
 * Set Dist Path for diffed files to store. 
 * @param {String} customDistPath 
 */
function _setDistPath(customDistPath) {
    distPath = customDistPath;
}
/**
 * Set the path of common js bundle file, which will be used to compared and generate patches.
 * @param {String} customCommonBundleFilePath 
 */
function _setCommonBundleFilePath(customCommonBundleFilePath) {
    commonBundleFilePath = customCommonBundleFilePath;
}

/**
 * Set the root dir path of the BSDIFF.
 * @param {String} customBsdiffRootPath 
 */
function _setBsDiffRootPath(customBsdiffRootPath) {
    bsdiffRootPath = customBsdiffRootPath;
    bsdiffCmd = bsdiffRootPath + "/bsdiff";
}

/**
 * Set the cmd path of the BSDIFF.
 * @param {String } customBsdiffCmd 
 */
function _setBsDiffCmd(customBsdiffCmd) {
    bsdiffCmd = customBsdiffCmd;
}

/**
 * Check the Object is or not initialized, some method can be called must after initilzation.
 */
function _isInited() {
    if (null !== businessManager) {
        return true;
    }
    return false;
}

/**
 * Start bsdiff the js bundle files. 
 */
function _startPatch() {
    if (!_isInited()) {
        Log.e(TAG, "You should init the PatchManager Object firstly.");
        return;
    }
    _onClearDistDir(function () {
        mPatchEmitter.emit(EVENT_START_BSDIFF_FILES);
    }, function () {
        Log.e(TAG, "Error happened in clearing progress for dist dir.");
    })
    // or
    // _onStartBsdiffFiles(
    //     function () {
    //         mPatchEmitter.emit(EVENT_SINGLE_FILE_BSDIFF_SUCCESS);
    //     },
    //     function () {
    //         mPatchEmitter.emit(EVENT_SINGLE_FILE_BSDIFF_FAILED);
    //     }
    // );
}

/**
 * Event and Listners.
 */
mPatchEmitter.on(EVENT_START_BSDIFF_FILES, function () {
    Log.i(TAG, "Tiggle Event: Starting bsdiff jsbundle files");
    _onStartBsdiffFiles(
        function () {
            mPatchEmitter.emit(EVENT_SINGLE_FILE_BSDIFF_SUCCESS);
        },
        function () {
            mPatchEmitter.emit(EVENT_SINGLE_FILE_BSDIFF_FAILED);
        }
    );
});

mPatchEmitter.on(EVENT_SINGLE_FILE_BSDIFF_SUCCESS, function () {
    patchFileSize = patchFileSize - 1;
    /**
     * When the patchFileSize countdown to 0, mean all file has bsdiff success. 
     * Otherwise, mean some file failed during bsdiff progress.
     */
    if (patchFileSize <= 0) {
        Log.i(TAG, "Tiggle Event: Single file bsdiffed success.");
        mPatchEmitter.emit(EVENT_START_COMPUTE_HASHCODE);
    }
});

mPatchEmitter.on(EVENT_SINGLE_FILE_BSDIFF_FAILED, function () {
    Log.e(TAG, "Tiggle Event: Single file bsdiffed failed.");
});

/**
 * For compute hashcode the patch files in the dist dir.
 */
mPatchEmitter.on(EVENT_START_COMPUTE_HASHCODE, function () {
    Log.i(TAG, "Tiggle Event: Start computing hashcode of patches (using sha-256)");
    // Defined the success callback to update the info in BussinessManager object.
    var _successCallback = function (patchFileFullPath, hashcode) {
        Log.i(TAG, `HashCode SUCCESS, file: ${patchFileFullPath}, hashcode: ${hashcode} `);
        /* Patch' filename formated:
             {businessTag}_v_{version}_{others}.patch
           Example:
             business1_v_100_min.patch
        */
        var array = patchFileFullPath.split('/');
        var fileName = array[array.length - 1];
        var infos = fileName.split('_');
        var busTag = infos[0];
        var version = infos[2];
        var businessInfo = businessManager.getBusinessInfoByTag(busTag);
        if (null !== businessInfo) {
            Log.i(TAG, `Get BusinesInfo :${businessInfo.toString()}`);
            // setTimeout(function () {

            // }, 0);
            var nPatchInfo = new PatchVersionInfo(businessInfo.businessId, version, hashcode, patchFileFullPath);
            businessInfo.addNewPatchVersion(nPatchInfo);
        }
    };
    var _errorCallback = function () {
        Log.i(TAG, "Error happened in computing file hashcode");
    };

    var dirs = fs.readdirSync(distPath);
    dirs.forEach(function (tmpDir) {
        var distBuinessDir = distPath + "/" + tmpDir;
        if (fs.statSync(distBuinessDir).isDirectory()) {
            Log.i(TAG, `HashCode for Dir: ${distBuinessDir}`);
            var files = fs.readdirSync(distBuinessDir);
            files.forEach(function (patchName) {
                if (patchName == '.DS_Store' || patchName.substr(patchName.length - 6, 6) != '.patch') {
                    return;
                }
                patchFileSize++;
                // start compute hashcode of file
                _onComputeFileHashCode(
                    distBuinessDir + "/" + patchName,
                    _successCallback,
                    _errorCallback
                );
            });
        }
    });
});

function _onClearDistDir(successCallback, errorCallback) {
    Log.i(TAG, "Clear ./dist folder");
    var clearDistCmd = "rm -rf " + distPath;
    exec(clearDistCmd, (error, stdout, stderr) => {
        if (error) {
            Log.i(TAG, `exec error: ${error}`);
            if (typeof errorCallback === 'function') {
                errorCallback();
            }
            return;
        }
        fs.mkdir(distPath);
        if (typeof successCallback === 'function') {
            successCallback();
        }
    });
}

/**
 * Main Progress for computing the hashcode of a file
 * @param {String} _filePath ,the path where the file located.
 * @param {*} _successCallback , callback function when progress success.
 * @param {*} _errorCallback , callback function when progress failed.
 */
function _onComputeFileHashCode(_filePath, _successCallback, _errorCallback) {
    Log.i(TAG, `HashCode for File: ${_filePath}`);
    var rs = fs.createReadStream(_filePath);
    var hash = crypto.createHash('sha256');
    rs.on('data', hash.update.bind(hash));
    rs.on('end', function () {
        let hashcode = hash.digest('hex');
        if (hashcode.length <= 0 && typeof _errorCallback === 'function') {
            _errorCallback();
        } else {
            _successCallback(_filePath, hashcode);
        }
    });
}

/**
 * Main progress for bsdiffing the jsBundle.
 * @param {Function} _successCallback function will be called if sucess.
 * @param {Function} _errorCallback function will be called if some error happened druing the progress.
 */
function _onStartBsdiffFiles(_successCallback, _errorCallback) {
    var dirs = fs.readdirSync(originalSourcePath);
    dirs.forEach(function (tmpDir) {
        // var distBuinessDir = distPath + "/" + tmpDir;
        // var originalBuinessDir = originalSourcePath + "/" + tmpDir;
        var distBuinessDir = `${distPath}/${tmpDir}`;
        var originalBuinessDir = `${originalSourcePath}/${tmpDir}`;

        if (fs.statSync(originalBuinessDir).isDirectory()) {
            Log.i(TAG, `Bsdiff progress in dir: ${originalBuinessDir}`);
            fs.mkdirSync(distBuinessDir); // make /dist/xxxx dir
            var files = fs.readdirSync(originalBuinessDir);

            files.forEach(function (jsBundleFileName) {

                if (jsBundleFileName == '.DS_Store') {
                    Log.w(TAG, "Find a .DS_Store file");
                    return;
                }

                (function () {
                    // var option = commonBundleFilePath + " " +
                    //     originalBuinessDir + "/" + jsBundleFileName + " " +
                    //     distBuinessDir + "/" + jsBundleFileName + ".patch";
                    // var execCmd = bsdiffCmd + " " + option;
                    var execCmd = `${bsdiffCmd} ${commonBundleFilePath} ${originalBuinessDir}/${jsBundleFileName} ${distBuinessDir}/${jsBundleFileName}.patch`;
                    Log.i(TAG, `Bsdiff cmd is : ${execCmd}`);
                    patchFileSize++;
                    exec(execCmd, (error, stdout, stderr) => {
                        if (error) {
                            Log.i(TAG, `exec error: ${error}`);
                            if (typeof _errorCallback === "function") {
                                _errorCallback();
                            }
                            return;
                        }
                        Log.i(TAG, "Bsdiff SUCCESS");
                        if (typeof _successCallback === "function") {
                            _successCallback();
                        }
                    });
                })();
            });
        }
    });
}


module.exports = PatchManager;