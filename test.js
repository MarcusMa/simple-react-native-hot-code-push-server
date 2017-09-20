/*!
 * Simple Test 
 * Copyright(c) 2009-2017 Marcus Ma
 * E-mail:maji1991@sina.com
 * GitHub : https://github.com/MarcusMa
 * MIT Licensed
 */
'use strict';

const express = require('express');
const Log = require('./src/utils/Log');
const BusinessInfo = require('./src/entity/BusinessInfo');
const PatchVersionIno = require('./src/entity/PatchVersionInfo');
const BusinessManager = require('./src/service/BusinessManager');
const PatchManager = require('./src/service/PatchManager');

const TAG = "test";
Log.i(TAG,"### Test BusinessInfo ");
let info = new BusinessInfo("1",2,3);
let patchVersion = new PatchVersionIno(1,'1.1.1',"234","/sdaf/sdfasdf");
let patchVersion2 = new PatchVersionIno(2,'1.1.2',"aasdf","asdfa/asdfas/asdfasd");

info.addNewPatchVersion(patchVersion);
info.addNewPatchVersion(patchVersion2);

Log.d(TAG,info.toString());

Log.i(TAG,"### Test BusinessManager ");
let manager = new BusinessManager();
manager.add(info);
let findInfo = manager.getBusinessInfoById("1");
Log.d(TAG,findInfo.toString());
let findTagInfo = manager.getBusinessInfoByTag(3);
Log.d(findTagInfo.toString());
manager.add(info);
info.businessId = "2";
manager.add(info);
Log.d(manager.getBusinessInfoSize());

Log.i(TAG,"### Test PatchManager ");

let patchManager = new PatchManager();
patchManager.startBsdiff();
patchManager.init(manager);
patchManager.startBsdiff();