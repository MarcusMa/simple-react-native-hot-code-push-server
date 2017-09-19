/*!
 * BusinessManager
 * Copyright(c) 2009-2017 Marcus Ma
 * E-mail:maji1991@sina.com
 * GitHub : https://github.com/MarcusMa
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

const Log = require('../utils/Log');
const BusinessInfo = require("../entity/BusinessInfo");
const TAG = "BusinessManager";

function BusinessManager() {
    this.businessMap = [];
}

/**
 * Init, not used now.
 */
BusinessManager.prototype.init = function () {
    //init
}


BusinessManager.prototype.getBusinessInfoSize = function(){
    if (this.businessMap instanceof Array) {
        // do nothing
    }
    else{
        Log.e(TAG, "businessMap cannot be null, just reset it");
        this.businessMap = [];
    }
    return this.businessMap.length;
}

/**
 * Add a BusinessInfo the set.
 */
BusinessManager.prototype.add = function (business) {
    if (business instanceof BusinessInfo) {
        if (this.businessMap instanceof Array) {
            // do nothing
        }
        else{
            Log.e(TAG, "businessMap cannot be null, just reset it");
            this.businessMap = [];
        }
        var isExist = false;
        this.businessMap.forEach(function (tmp) {
            if (tmp.businessId === business.businessId) {
                isExist = true;
            }
        });
        if (!isExist) {
            Log.i(TAG, "Add new BusinessInfo with businessId=" + business.businessId);
            this.businessMap.push(business);
        } else {
            Log.w(TAG, "Try to add an exist BusinessInfo with businessId=" + business.businessId);
        }
    }
};

/**
 * Get the BusinessInfo using businessId prop.
 */
BusinessManager.prototype.getBusinessInfoById = function (queryId) {
    var ret = null;
    if (this.businessMap instanceof Array) {
        // do nothing
    }
    else{
        Log.e(TAG, "businessMap cannot be null, just reset it");
        this.businessMap = [];
    }

    this.businessMap.forEach(function (tmp) {
        Log.d(TAG,"get local id=" + tmp.businessId + ", and query id=" + queryId);
        if (tmp.businessId === queryId) {
            ret = tmp;
        }
    });
    if(null === ret){
        Log.w(TAG, "Can not find the BusinessInfo with id=" + queryId);
    }
    return ret;
};

/**
 * Get the BusinessInfo using businessTag prop.
 */
BusinessManager.prototype.getBusinessInfoByTag = function (queryTag) {
    var ret = null;
    if (this.businessMap instanceof Array) {
        // do nothing
    }
    else{
        Log.e(TAG, "businessMap cannot be null, just reset it");
        this.businessMap = [];
    }
    this.businessMap.forEach(function (tmp) {
        Log.d(TAG,"get local id=" + tmp.businessTag + ", and query id " + queryTag);
        if (tmp.businessTag === queryTag) {
            ret = tmp;
        }
    });
    if(null === ret){
        Log.w(TAG, "Can not find the BusinessInfo with tag=" + queryTag);
    }
    return ret;
};

module.exports = BusinessManager;