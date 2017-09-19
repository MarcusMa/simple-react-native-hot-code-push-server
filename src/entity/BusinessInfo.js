/*!
 * BusinessInfo
 * Copyright(c) 2009-2017 Marcus Ma
 * E-mail:maji1991@sina.com
 * GitHub : https://github.com/MarcusMa
 * MIT Licensed
 */
'use strict';

/**
 * Module dependencies.
 */
const PatchVersionInfo = require("./PatchVersionInfo");


function BusinessInfo(id, name, tag) {
    this.businessId = id;
    this.businessName = name;
    this.businessTag = tag;
    this.patchVersions = [];
}

/**
 * Check the patch verions using patch package hashcode.
 */
BusinessInfo.prototype.isPatchVersionExist = function (patchHashCode) {
    var ret = false;
    this.patchVersions.forEach(function (tmp) {
        if (tmp.hashCode === patchHashCode) {
            ret = true;
        }
    });
    return ret;
};

/**
 * Get the latest PatchVersionInfo 
 */
BusinessInfo.prototype.getLatestPatchInfo = function () {
    var ret = null;
    if (this.patchVersions.length > 0) {
        var lastIndex = 0;
        for (var i = 1; i < this.patchVersions.length; i++) {
            if (this.patchVersions[i].version > this.patchVersions[lastIndex].version) {
                lastIndex = i;
            }
        }
        ret = this.patchVersions[lastIndex];
    }
    return ret;
};

/**
 * Add a new PatchVersionInfo to the set of patchs.
 */
BusinessInfo.prototype.addNewPatchVersion = function (patchInfo) {
    if (patchInfo instanceof PatchVersionInfo) {
        // check the patch version
        var isExit = false;
        this.patchVersions.forEach(function (tmp) {
            // FIXME 
            if (tmp.version && tmp.version === patchInfo.version) {
                isExit = true;
            }
        });
        if (!isExit) {
            this.patchVersions.push(patchInfo);
        }
    }
};

BusinessInfo.prototype.toString = function () {
    var ret =  "businessId:" + this.businessId +
        ", businessName:" + this.businessName +
        ", businessTag:" + this.businessTag + 
        ", versions:[";

    this.patchVersions.forEach(function(tmp){
        if(tmp instanceof PatchVersionInfo){
            ret += "{ " + tmp.toString() +"}, ";
        }
    });
    ret += "]";
    return ret;
}

module.exports = BusinessInfo;