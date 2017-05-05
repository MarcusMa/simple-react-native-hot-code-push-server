"use strict";
const express = require('express');
const exec = require('child_process').exec;
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

/** event constants */
const EVENT_START_BSDIFF_FILES = "event_start_bsdiff_files";
const EVENT_SINGLE_FILE_BSDIFF_SUCCESS = "event_single_file_bsdiff_success";
const EVENT_SINGLE_FILE_BSDIFF_FAILED = "event_single_file_bsdiff_failed";
const EVENT_START_COMPUTE_HASHCODE = "event_start_compute_hashcode";

const app = express();
const responseJson = {
    "success": 1,
    "data": null,
    "msg": null
};

const DIST_PATH = "./public/dist";
const ORIGINSL_SOURCE_PATH = "./public/original";
const BSDIFF_ROOT_PATH = "./bsdiff-4.3";
const BSDIFF_CMD = BSDIFF_ROOT_PATH + "/bsdiff";
const ServicePort = 8888;
var patchSum = 0;

const dataManager = new BusinessManager();

/** Server Settings */
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({
    limit: '1mb'
}));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/testGet', function (req, res) {
    Log(req.query);
    Log("call testGet");
    res.send("testGet success");
});

app.post('/checkForUpdate', function (req, res) {
    Log("** checkForUpdate ***");
    Log("request body:");
    Log(JSON.stringify(req.body));
    var reqBody = req.body;
    var list = [];
    list = reqBody.localBusinessList;
    var remoteBuinessList = [];
    // 处理传入的参数
    if (list instanceof Array) {
        list.forEach(function (tmp) {
            if (dataManager.getBusinessInfoById(tmp.id)) {
                let businessInfo = dataManager.getBusinessInfoById(tmp.id);
                let tempData = {
                    id: tmp.id,
                    verifyHashCode: ""
                };
                if (businessInfo && businessInfo.existVersion(tmp.localPackageHashCode)) {
                    Log("exitVersion : " + tmp.localPackageHashCode);
                    tempData.verifyHashCode = tmp.localPackageHashCode;
                } else {
                    Log("No Such Version " + tmp.localPackageHashCode);
                    tempData.verifyHashCode = "";
                }
                // 判断是否有新版本
                let latestPatchInfo = businessInfo.getLatestPatchInfo();
                if (latestPatchInfo.hashCode == tmp.localPackageHashCode) {
                    // 无新版本
                } else {
                    tempData.latestPatch = {
                        hashCode: latestPatchInfo.hashCode,
                        downloadUrl: latestPatchInfo.getDownloadUrl()
                    };
                }
                // 加入返回报文
                remoteBuinessList.push(tempData);
            }
        });
    }

    // 处理未传入的businessId
    dataManager.businessMap.forEach(function (tmp) {
        let isExist = false;
        if (list instanceof Array) {
            for (let j = 0; j < list.length; j++) {
                if (list[j].businessId == tmp.id) {
                    isExist = true;
                    break;
                }
            }
        }
        if (!isExist) {
            let tempData = {
                id: tmp.id,
                verifyHashCode: ""
            };
            let latestPatchInfo = tmp.getLatestPatchInfo();
            tempData.latestPatch = {
                hashCode: latestPatchInfo.hashCode,
                downloadUrl: latestPatchInfo.getDownloadUrl()
            };
            remoteBuinessList.push(tempData);
        }
    });
    var resjson = responseJson;
    resjson.data = remoteBuinessList;
    resjson.msg = " Success ";
    res.send(resjson);
});

app.listen(ServicePort, () => {
    LogProjectInfo();
    Log('Server Listening at port :' + ServicePort);
    
    Log(".... Data Initilization ....");
    var localBusiness = new BusinessInfo("AAF047B7-E816-2AE0-949A-D5FB4CE40245", "myBusiness", "business");
    dataManager.add(localBusiness);

    Log(">>> clear ./dist folder");
    var clearDistCmd = "rm -rf " + DIST_PATH;
    exec(clearDistCmd, (error, stdout, stderr) => {
        if (error) {
            Log(`exec error: ${error}`);
            return;
        }
        fs.mkdir(DIST_PATH);
        myEmitter.emit(EVENT_START_BSDIFF_FILES);
    });
});

/** bsDiff */
myEmitter.on(EVENT_START_BSDIFF_FILES, function () {
    Log(">>> start bsdiff patch files");
    bsdiffFilesProc(
        function () {
            myEmitter.emit(EVENT_SINGLE_FILE_BSDIFF_SUCCESS);
        },
        function () {
            myEmitter.emit(EVENT_SINGLE_FILE_BSDIFF_FAILED);
        }
    );
});

myEmitter.on(EVENT_SINGLE_FILE_BSDIFF_FAILED, function () {
    Log("error happened in bsdiff progress");
});

myEmitter.on(EVENT_SINGLE_FILE_BSDIFF_SUCCESS, function () {
    patchSum = patchSum - 1;
    if (patchSum <= 0) {
        Log("patch progress complete");
        myEmitter.emit(EVENT_START_COMPUTE_HASHCODE);
    }
});

/** HashCode */
myEmitter.on(EVENT_START_COMPUTE_HASHCODE, function () {
    Log(">>> start compute patch hashcode (sha-256)");
    var successCallback = function (filePatch, hashcode) {
        let array = filePatch.split('/');
        let fileName = array[array.length - 1];
        let infos = fileName.split('_');
        let busTag = infos[0];
        let version = infos[2];
        let business = dataManager.getBusinessInfoByTag(busTag);
        Log("businessInfo:" + JSON.stringify(business));
        setTimeout(function () {
            business.addNewVersion(version, hashcode, filePatch);
            Log("" + JSON.stringify(dataManager));
        }, 0);
    };
    var errorCallback = function () {
        Log(`>>>> error in compute hashcode `);
    };
    var dirs = fs.readdirSync(DIST_PATH);
    dirs.forEach(function (tmpDir) {
        var distBuinessDir = DIST_PATH + "/" + tmpDir;
        if (fs.statSync(distBuinessDir).isDirectory()) {
            Log(">>>> Deal Dir: " + distBuinessDir);
            var files = fs.readdirSync(distBuinessDir);
            files.forEach(function (patchName) {
                if (patchName == '.DS_Store' || patchName.substr(patchName.length - 6, 6) != '.patch') {
                    return;
                }
                patchSum++;
                // start compute hashcode of file
                computeFilesHashProc(
                    distBuinessDir + "/" + patchName,
                    successCallback,
                    errorCallback
                );
            });
        }
    });
});

/* Main Progress */
function computeFilesHashProc(_filePath, _successCallback, _errorCallback) {
    Log(">>>> Compute File: " + _filePath);
    let rs = fs.createReadStream(_filePath);
    let hash = crypto.createHash('sha256');
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

function bsdiffFilesProc(_successCallback, _errorCallback) {
    var commonPackageFilePath = ORIGINSL_SOURCE_PATH + "/common_min.bundle";
    var dirs = fs.readdirSync(ORIGINSL_SOURCE_PATH);
    dirs.forEach(function (tmpDir) {
        var distBuinessDir = DIST_PATH + "/" + tmpDir;
        var originalBuinessDir = ORIGINSL_SOURCE_PATH + "/" + tmpDir;
        if (fs.statSync(originalBuinessDir).isDirectory()) {
            Log(">>>> Diff With: " + originalBuinessDir);
            fs.mkdirSync(distBuinessDir); // make /dist/xxxx dir
            var files = fs.readdirSync(originalBuinessDir);

            files.forEach(function (completeBundleFile) {
                if (completeBundleFile == '.DS_Store') {
                    return;
                }
                (function () {
                    var option = commonPackageFilePath + " " +
                        originalBuinessDir + "/" + completeBundleFile + " " +
                        distBuinessDir + "/" + completeBundleFile + ".patch";
                    var execCmd = BSDIFF_CMD + " " + option;
                    Log(">>>> " + execCmd);
                    patchSum++;
                    exec(execCmd, (error, stdout, stderr) => {
                        if (error) {
                            Log(`exec error: ${error}`);
                            if (typeof _errorCallback === "function") {
                                _errorCallback();
                            }
                            return;
                        }
                        Log(">>>> bsdiff success");
                        if (typeof _successCallback === "function") {
                            _successCallback();
                        }
                    });
                })();
            });
        }
    });
}

/**
 * Manager & Service 
 **/
function BusinessManager() {
    this.businessMap = [];
}

BusinessManager.prototype.add = function (business) {
    if (business instanceof BusinessInfo) {
        let isExist = false;
        this.businessMap.forEach(function (tmp) {
            if (tmp.id === business.id) {
                isExist = true;
            }
        });
        if (!isExist) {
            Log(">>>> add new Business Id : " + business.id);
            this.businessMap.push(business);
        }
    }
};

BusinessManager.prototype.getBusinessInfoById = function (businessId) {
    let ret = null;
    if (this.businessMap instanceof Array) {
        this.businessMap.forEach(function (tmp) {
            Log("local id" + tmp.id + " search id " + businessId);
            if (tmp.id === businessId) {
                ret = tmp;
            }
        });
    }
    return ret;
};

BusinessManager.prototype.getBusinessInfoByTag = function (businessTag) {
    let ret = null;
    if (this.businessMap instanceof Array) {
        this.businessMap.forEach(function (tmp) {
            if (tmp.tag == businessTag) {
                ret = tmp;
            }
        });
    }
    return ret;
};

/**
 * Entity 
 **/
function BusinessInfo(businessId, businessName, businessTag) {
    this.id = businessId;
    this.name = businessName;
    this.tag = businessTag;
    this.versions = [];
}

function PatchVersionInfo(id, patchVersion, patchHashCode, patchFilePath) {
    this.businessId = id;
    this.version = patchVersion;
    this.hashCode = patchHashCode;
    this.filePath = patchFilePath;
}
PatchVersionInfo.prototype.getDownloadUrl = function () {
    let ret = null;
    if (this.filePath) {
        ret = this.filePath.substr(9);
    }
    return ret;
};

BusinessInfo.prototype.existVersion = function (patchHashCode) {
    let ret = false;
    this.versions.forEach(function (tmp) {
        if (tmp.hashCode === patchHashCode) {
            ret = true;
        }
    });
    return ret;
};
BusinessInfo.prototype.getLatestPatchInfo = function () {
    let ret = null;
    let lastVersionIndex = 0;
    for (let i = 0; i < this.versions.length; i++) {
        if (i > 0) {
            if (this.versions[i].version > this.versions[lastVersionIndex].version) {
                lastVersionIndex = i;
            }
        }
    }
    ret = this.versions[lastVersionIndex];
    return ret;
};

BusinessInfo.prototype.addNewVersion = function (patchVersion, patchHashCode, patchFilePath) {
    // check the patch version
    let isExit = false;
    this.versions.forEach(function (tmp) {
        if (tmp.version && tmp.version === patchVersion) {
            isExit = true;
        }
    });
    if (!isExit) {
        Log(">>>> add new business version : " + patchFilePath);
        let newPatchVersionInfo = new PatchVersionInfo(this.businessId, patchVersion, patchHashCode, patchFilePath);
        this.versions.push(newPatchVersionInfo);
    }
};

/**
 * Tools
 **/

function Log(msg) {
    var time = new Date();
    console.log(time.toLocaleString() + " " + msg);
}

function LogProjectInfo() {
    Log("##################################################################################");
    Log('# Author : Marcus Ma');
    Log('# E-mail : maji1991@sina.com');
    Log("# GitHub : https://github.com/MarcusMa")
    Log("##################################################################################");
    Log("# Demo Server for React Native Hot Code Push");
    Log("# See: https://github.com/MarcusMa/simple-react-native-hot-code-push-server");
    Log("# For Client Demo, please");
    Log("# See: https://github.com/MarcusMa/simple-react-native-hot-code-push");
    Log("##################################################################################");
}