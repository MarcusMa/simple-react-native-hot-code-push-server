/*!
 * BusinessManager
 * Copyright(c) 2009-2017 Marcus Ma
 * MIT Licensed
 */

 /**
 * Module dependencies.
 */

const Log = require('../utils/Log');
const BusinessInfo = require("../entity/BusinessInfo");

function BusinessManager() {
    this.businessMap = [];
}

BusinessManager.prototype.init = function(){

}

BusinessManager.prototype.add = function (business) {
    if (business instanceof BusinessInfo) {
        var isExist = false;
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

module.exports = BusinessManager;