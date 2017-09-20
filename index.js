/*!
 * Main
 * Copyright(c) 2009-2017 Marcus Ma
 * E-mail:maji1991@sina.com
 * GitHub : https://github.com/MarcusMa
 * MIT Licensed
 */
'use strict';

/**
 * Module dependencies.
 */
const express = require('express');
const bodyParser = require('body-parser');

/**
 * Custom module dependencies.
 */
const Log = require('./src/utils/Log');
const path = require('path');
const BusinessManager = require('./src/service/BusinessManager');
const PatchManager = require('./src/service/PatchManager');
const BusinessInfo = require('./src/entity/BusinessInfo');
const PatchVersionInfo = require('./src/entity/PatchVersionInfo');

/**
 * Constants
 */
const TAG = "RN_CODE_PUSH_SERVER";
const SERVER_PORT = 8888;

/**
 * Services
 */
var businessManager = null;
var patchManger = null;

const responseJson = {
    "success": 1,
    "data": null,
    "msg": null
};

/** Server Settings */
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({
    limit: '1mb'
}));

app.use(bodyParser.urlencoded({
    extended: true
}));

/**
 * For test the server is running successfully.
 */
app.get('/test', function (req, res) {
    Log.i(TAG, "/test with params" + req.query);
    res.send("Access successful");
});

/**
 * For check there is a new patch can be used.
 */
app.post('/checkForUpdate', function (req, res) {
    Log.i(TAG, "Call /checkForUpdate");
    Log.i(TAG, "Request body:");
    Log.i(TAG, JSON.stringify(req.body));
    var reqBody = req.body;
    var clientInfoList = [];
    clientInfoList = reqBody.localBusinessList;
    var remoteBuinessList = [];
    if (clientInfoList instanceof Array) {
        clientInfoList.forEach(function (tmp) {
            let businessInfo = businessManager.getBusinessInfoById(tmp.id);
            if (null != businessInfo) {
                let respData = {
                    id: tmp.id,
                    verifyHashCode: ""
                };
                // check the hashcode.
                if (businessInfo.isPatchVersionExist(tmp.localPackageHashCode)) {
                    Log.i(TAG, "exitVersion : " + tmp.localPackageHashCode);
                    respData.verifyHashCode = tmp.localPackageHashCode;
                } else {
                    Log.i(TAG, "No Such Version " + tmp.localPackageHashCode);
                    respData.verifyHashCode = "";
                }
                // check the new versions
                let latestPatchInfo = businessInfo.getLatestPatchInfo();
                if (latestPatchInfo.hashCode == tmp.localPackageHashCode) {
                    // no versions
                } else {
                    respData.latestPatch = {
                        hashCode: latestPatchInfo.hashCode,
                        downloadUrl: latestPatchInfo.getDownloadUrl()
                    };
                }
                // add to the response
                remoteBuinessList.push(respData);
            }
        });
    }

    // 处理未传入的businessId
    businessManager.businessMap.forEach(function (tmp) {
        let isExist = false;
        if (clientInfoList instanceof Array) {
            for (let j = 0; j < clientInfoList.length; j++) {
                if (clientInfoList[j].businessId == tmp.businessId) {
                    isExist = true;
                    break;
                }
            }
        }
        if (!isExist) {
            let respData = {
                id: tmp.id,
                verifyHashCode: ""
            };
            let latestPatchInfo = tmp.getLatestPatchInfo();
            respData.latestPatch = {
                hashCode: latestPatchInfo.hashCode,
                downloadUrl: latestPatchInfo.getDownloadUrl()
            };
            remoteBuinessList.push(respData);
        }
    });
    var respJson = responseJson;
    respJson.data = remoteBuinessList;
    respJson.msg = " Success ";
    res.send(respJson);
});

/**
 * Start the server
 */
app.listen(SERVER_PORT, () => {
    onLogProjectInfo();
    Log.i(TAG, 'Server Listening at port :' + SERVER_PORT);
    onInit();
});

function onInit() {
    Log.i(TAG, ".... Initilization ....");
    businessManager = new BusinessManager;
    patchManger = new PatchManager();
    patchManger.init(businessManager);
    /**
     * NOTICE: Add your self BusinessInfo Object Like this:
     * var bus = new BusinessInfo({businessId},{businessName},{businessTag})
     */
    var mybuss = new BusinessInfo("AAF047B7-E816-2AE0-949A-D5FB4CE40245", "myBusiness", "tag1");

    businessManager.add(mybuss);
    /**
     * NOTICE: PatchManager startPatch method must be called after your all BusinessInfos has been added to the BusinessManger Object.
     */

    patchManger.startPatch();
}

function onLogProjectInfo() {
    Log.i(TAG, "##################################################################################");
    Log.i(TAG, '# Author : Marcus Ma');
    Log.i(TAG, '# E-mail : maji1991@sina.com');
    Log.i(TAG, "# GitHub : https://github.com/MarcusMa")
    Log.i(TAG, "##################################################################################");
    Log.i(TAG, "# Demo Server for React Native Hot Code Push");
    Log.i(TAG, "# See: https://github.com/MarcusMa/simple-react-native-hot-code-push-server");
    Log.i(TAG, "# For Client Demo, please");
    Log.i(TAG, "# See: https://github.com/MarcusMa/simple-react-native-hot-code-push");
    Log.i(TAG, "##################################################################################");
}