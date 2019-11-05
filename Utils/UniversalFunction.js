
const Boom = require('boom');
const CONFIG = require('../Config');
const Joi = require('joi');
const MD5 = require('md5');
const randomString = require("randomstring");

const sendSuccess = function (successMsg, data) {
    successMsg = successMsg || CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT.customMessage;
    if (typeof successMsg === 'object' && successMsg.hasOwnProperty('statusCode') && successMsg.hasOwnProperty('customMessage')) {
        return {statusCode:successMsg.statusCode, message: successMsg.customMessage, data: data || null};
    }else {
        return {statusCode:200, message: successMsg, data: data || null};
    }
};

const CryptData = function (stringToCrypt) {
    return MD5(MD5(stringToCrypt));
};

const sendError = function (data) {
    try {
        if (typeof data === 'object' && data.hasOwnProperty('statusCode') && data.hasOwnProperty('customMessage')) {
            let errorToSend = Boom.create(data.statusCode, data.customMessage);
            errorToSend.output.payload.responseType = data.type;
            return errorToSend;
        } else {
            let errorToSend = '';
            if (typeof data === 'object') {
                if (data.name === 'MongoError') {
                    errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DB_ERROR.customMessage;
                    if (data.code === 11000) {
                        let duplicateValue = data.errmsg && data.errmsg.substr(data.errmsg.lastIndexOf('{ : "') + 5);
                        duplicateValue = duplicateValue.replace('}','');
                        errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DUPLICATE.customMessage + " : " + duplicateValue;
                        //console.log("==================errorToSend==================",data.message)
                        if (data.message.indexOf('email_1')>-1){
                            errorToSend = CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DUPLICATE_EMAIL.customMessage;
                        }
                    }
                } else if (data.name === 'ApplicationError') {
                    errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.APP_ERROR.customMessage + ' : ';
                } else if (data.name === 'ValidationError') {
                    errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.APP_ERROR.customMessage + data.message;
                } else if (data.name === 'CastError') {
                    errorToSend += CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DB_ERROR.customMessage + CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_ID.customMessage + data.value;
                }
            } else {
                errorToSend = data
            }
            let customErrorMessage = errorToSend;
            if (typeof customErrorMessage === 'string'){
                if (errorToSend.indexOf("[") > -1) {
                    customErrorMessage = errorToSend.substr(errorToSend.indexOf("["));
                }
                customErrorMessage = customErrorMessage && customErrorMessage.replace(/"/g, '');
                customErrorMessage = customErrorMessage && customErrorMessage.replace('[', '');
                customErrorMessage = customErrorMessage && customErrorMessage.replace(']', '');
            }
            return Boom.create(400,customErrorMessage)
        }
    }
    catch (e) {

    }

};

const failActionFunction = function (request, reply, source, error) {

    console.log("..............err...........fail action.................",request.payload);
    let customErrorMessage = '';
    if (error.output.payload.message.indexOf("[") > -1) {
        customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf("["));
    } else {
        customErrorMessage = error.output.payload.message;
    }
    customErrorMessage = customErrorMessage.replace(/"/g, '');
    customErrorMessage = customErrorMessage.replace('[', '');
    customErrorMessage = customErrorMessage.replace(']', '');
    error.output.payload.message = customErrorMessage;
    delete error.output.payload.validation;
    return reply(error);
};

const authorizationHeaderObj = Joi.object({
    authorization: Joi.string().required()
}).unknown();

const generateRandomString = function () {
    return randomString.generate(5);
};

let getFileNameWithUserId = function (thumbFlag, fullFileName) {
    let prefix = CONFIG.APP_CONSTANTS.DATABASE.PROFILE_PIC_PREFIX.ORIGINAL;
    let id=Math.round(Math.random() * new Date().getTime());
    let ext = fullFileName && fullFileName.length > 0 && fullFileName.substr(fullFileName.lastIndexOf('.') || 0, fullFileName.length);
    if (thumbFlag) {
        prefix = CONFIG.APP_CONSTANTS.DATABASE.PROFILE_PIC_PREFIX.THUMB;
    }
    return prefix + id + ext;
};

module.exports = {
    failActionFunction:failActionFunction,
    sendSuccess:sendSuccess,
    sendError:sendError,
    authorizationHeaderObj:authorizationHeaderObj,
    CryptData:CryptData,
    CONFIG: CONFIG,
    generateRandomString:generateRandomString,
    getFileNameWithUserId:getFileNameWithUserId
}
