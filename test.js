/*!
 * Simple Test 
 * Copyright(c) 2009-2017 Marcus Ma
 * MIT Licensed
 */
'use strict';

const express = require('express');
const Log = require('./src/utils/Log');
const BusinessInfo = require('./src/entity/BusinessInfo');
const PatchVersionIno = require('./src/entity/PatchVersionInfo');
const TAG = "test";
Log.i(TAG,"### Test BusinessInfo ");
let info = new BusinessInfo(1,2,3);
let patchVersion = new PatchVersionIno(1,'1.1.1',"234","/sdaf/sdfasdf");
let patchVersion2 = new PatchVersionIno(2,'1.1.2',"aasdf","asdfa/asdfas/asdfasd");

info.addNewPatchVersion(patchVersion);
info.addNewPatchVersion(patchVersion2);

Log.d(TAG,info.toString());

