"use strict";

const Service = require('../Services').queries;
const UniversalFunctions = require('../Utils/UniversalFunction');
const Config = require('../Config');
const TokenManager = require('../Lib/TokenManager');
const NotificationManager = require('../Lib/NotificationManager');
const emailFunction = require('../Lib/email');
const _ = require('lodash');
const UploadMultipart = require('../Lib/UploadMultipart');
const pushNotification = require('../Lib/pushNotification');
const Modal = require('../Models');

async function adminLogin(payloadData) {

    let f1 = await Service.findOne(Modal.Admins, {email: payloadData.email}, {}, {lean: true});
    if (!f1) return Promise.reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL);
    else {
        if (f1.password !== UniversalFunctions.CryptData(payloadData.password)) {
            return Promise.reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_PASSWORD);
        } else if (f1.isBlocked) {
            return Promise.reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.BLOCKED)
        } else {
            delete f1.password;
            let tokenData = await TokenManager.setToken({
                _id: f1._id,
                type: Config.APP_CONSTANTS.DATABASE.USER_TYPE.ADMIN
            });
            f1.accessToken = tokenData.accessToken;
            return f1
        }
    }
}


module.exports = {
    adminLogin: adminLogin,
};
