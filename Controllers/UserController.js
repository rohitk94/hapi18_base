"use strict";

const Service = require('../Services').queries;
const UniversalFunctions = require('../Utils/UniversalFunction');
const Config = require('../Config');
const Modal = require('../Models');
const TokenManager = require('../Lib/TokenManager');
const NotificationManager = require('../Lib/NotificationManager');
const UploadMultipart = require('../Lib/UploadMultipart');
const _ = require('lodash');
let mongoose = require('mongoose');
const sendEmail = require('../Lib/email');
const moment = require('moment');
const request = require('request');
let under = require('underscore');
let fsExtra = require('fs-extra');
let Fs = require('fs');

/* User sign up  , check user email , phone number , username, then create user */
async function userSignUp(payloadData) {

    if (payloadData.email) {
        let query = {
            email: payloadData.email,
            isDeleted: false
        };
        let check1 = await getRequired(Modal.Users, query, {}, {lean: true});
        if (check1.length)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.ALREADY_EXIST)
    }

    if (payloadData.userName) {
        let query = {
            userName: payloadData.userName,
        };
        let check1 = await getRequired(Modal.Users, query, {}, {lean: true});
        if (check1.length)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.USERNAME_EXIST)
    }

    if (payloadData.phoneNumber) {
        let query = {
            countryCode: payloadData.countryCode,
            phoneNumber: payloadData.phoneNumber,
        };
        let check1 = await getRequired(Modal.Users, query, {}, {lean: true});
        if (check1.length)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.PHONE_ALREADY_EXIST)
    }

    // if(payloadData.profileImage){
    //     payloadData.imageUrl = await uploadImage(payloadData.profileImage)
    // }

    let register = await registerUser(payloadData);
    let finalData = await tokenUpdate(register);
    delete finalData.password;
    return finalData

}

/* function register user and save data*/
async function registerUser(payloadData) {


    return new Promise((resolve, reject) => {

        let query = {
            fullName: payloadData.fullName,
            userName: payloadData.userName,
            registrationDate: +new Date(),
        };

        if (payloadData.email) query.email = payloadData.email;

        if (payloadData.password) query.password = UniversalFunctions.CryptData(payloadData.password);

        if (payloadData.deviceToken) query.deviceToken = payloadData.deviceToken;
        if (payloadData.countryCode) query.countryCode = payloadData.countryCode;
        if (payloadData.phoneNumber) query.phoneNumber = payloadData.phoneNumber;
        if (payloadData.socialId) query.socialId = payloadData.socialId;

        query.OTP = '4444';

        if (payloadData.dob) query.dob = payloadData.dob;
        if (payloadData.gender) query.gender = payloadData.gender;

        if (payloadData.location) query.location = payloadData.location;

        if(payloadData.currency) {
            query.currency = payloadData.currency;
        }
        if(payloadData.country) query.country = payloadData.country;
        if(payloadData.code) query.code = payloadData.code;

        Service.saveData(Modal.Users, query, (err, result) => {
            if (err) reject(err);
            else {
                signupMail(result);
                resolve(result)
            }
        })
    });
}

/* user login */
async function login(payloadData) {


    let f1 = await verifyUser(payloadData);
    let f2 = await tokenUpdate(f1);
    delete f2.password;
    delete f2.deviceToken;

    let dataToSet = {};

    if (payloadData.deviceToken) dataToSet.deviceToken = payloadData.deviceToken;
    dataToSet.lastLogin = +new Date();

    dataToSet.firstTimeLogin =false;
    f2.firstTimeLogin =false;
    await updateData(Modal.Users, {_id: f1._id}, dataToSet, {});

    return f2
}

function verifyUser(payloadData) {

    return new Promise((resolve, reject) => {
        let getCriteria = {};

        if (payloadData.loginBy === 1 && payloadData.email)
            getCriteria.email = payloadData.email;
        else getCriteria.socialId = payloadData.socialId;

        let project = {
            deviceToken: 0
        };
        Service.findOne(Modal.Users, getCriteria, project, {lean: true}, (err, result) => {
            if (err) {
                reject(err);
            } else {
                if (result) {
                    if (payloadData.password && (result.password !== UniversalFunctions.CryptData(payloadData.password)))
                        reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_PASSWORD);
                    else if (result.isBlocked)
                        reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.BLOCKED);
                    else {
                        result.type = UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_TYPE.USER;
                        result.isRegister = true;
                        resolve(result)
                    }
                } else {
                    reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_REGISTER);

                }
            }
        });
    });
}

/*logout api*/
async function logout(userData) {
    let update = {
        accessToken: '',
        deviceToken: '',
    };
    await  Service.findAndUpdate(Modal.Users, {_id: userData._id},update, {});
}


async function resendOTP(payloadData) {

    let otp = Math.floor(1000 + Math.random() * 9000);

    return new Promise( (resolve, reject) => {
        let criteria = {
            countryCode: payloadData.countryCode,
            phoneNumber: payloadData.phoneNumber,
        };
        let update = {
            OTP: otp,
           //OTPcode: '4444',
        };
        Service.findAndUpdate(Modal.Users, criteria, update, {new: true, lean: true}, async (err, result) => {
            if (err) {
                reject(err)
            } else {
                if (result) {
                    //    otpMail(result,otp);
                    let data = {
                        "messages": [{"to" : payloadData.countryCode+payloadData.phoneNumber, "message": "Verification otp code for Homeatry is "+otp}],
                        "callback_url": "https://localhost"
                    }
                    await sendOtp(data);
                    resolve();

                } else reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_REGISTER)
            }
        })
    })
}


/*function upload image*/
function uploadImage(image) {

    if (Array.isArray(image)) {
        return new Promise((resolve, reject) => {
            let imageData = [], len = image.length, count = 0;
            image.map((obj) => {
                UploadMultipart.uploadFilesOnS3(obj, (err, result) => {
                    count++;
                    imageData.push(result);
                    if (count === len)
                        resolve(imageData)
                })
            })
        });
    } else {
        return new Promise((resolve, reject) => {
            UploadMultipart.uploadFilesOnS3(image, (err, result) => {
                if (err) reject(err);
                else resolve(result)
            })
        });
    }
}

/*upload image api main*/
async function uploadImageUser(payloadData) {

    return await uploadImage(payloadData.image)
}

/*Update user profile*/
async function updateProfile(payloadData, userData) {

    let dataToUpdate = {};

    if (payloadData.email) {
        let query = {
            email: payloadData.email,
            isDeleted: false,
            _id: {$ne: userData._id}
        };
        let check1 = await getRequired(Modal.Users, query, {}, {});
        if (check1.length)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.ALREADY_EXIST)
    }
    if (payloadData.phoneNumber) {
        let query = {
            countryCode: payloadData.countryCode,
            phoneNumber: payloadData.phoneNumber,
            _id: {$ne: userData._id}
        };
        let check1 = await getRequired(Modal.Users, query, {}, {});
        if (check1.length)
            return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.PHONE_ALREADY_EXIST)
    }

    if (payloadData.imageUrl) {
        dataToUpdate.imageUrl = payloadData.imageUrl;
    }

    if (payloadData.countryCode) dataToUpdate.countryCode = payloadData.countryCode;
    if (payloadData.phoneNumber) dataToUpdate.phoneNumber = payloadData.phoneNumber;


    if (payloadData.fullName) dataToUpdate.fullName = payloadData.fullName;
    if (payloadData.email) dataToUpdate.email = payloadData.email;

    if (payloadData.dob) dataToUpdate.dob = payloadData.dob;
    if (payloadData.gender) dataToUpdate.gender = payloadData.gender;


    let update = await updateData(Modal.Users, {_id: userData._id}, dataToUpdate, {new: true, lean: true});
    delete update.password;
    delete update.deviceToken;
    delete update.accessToken;
    return update
}

/*change password*/
async function changePassword(payloadData, userData) {

    let modal;
    return new Promise((resolve, reject) => {

        if (payloadData.oldPassword === payloadData.newPassword) {
            reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SAME_PASSWORD)
        } else {
            let criteria = {
                _id: userData._id,
                password: UniversalFunctions.CryptData(payloadData.oldPassword)
            };
            let setQuery = {
                password: UniversalFunctions.CryptData(payloadData.newPassword)
            };
            let option = {
                new: true
            };
            if (userData.type === 'ADMIN') modal = Modal.Admins
            else if (userData.type === 'USER') modal = Modal.Users
            // else modal = Modal.Sellers

            Service.findAndUpdate(modal, criteria, setQuery, option, function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    if (result) resolve();
                    else reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INCORRECT_OLD_PASSWORD)
                }
            })
        }
    })
}

async function getUnreadCount(payloadData, userData) {

    let criteria ={
        isDeleted : false,
        isRead :false,
        userId : userData._id
    };
    let unread = await getCount(Modal.Notifications,criteria);

    return {unread : unread}
}

/*forgot password*/
async function forgotPassword(payloadData) {

    let pass = UniversalFunctions.generateRandomString();
    return new Promise((resolve, reject) => {
        let criteria = {
            email: payloadData.email,
        };
        let option = {
            lean: true
        };
        Service.getData(Modal.Users, criteria, {}, option, function (err, result) {
            if (err) {
                reject(err)
            } else {
                if (result.length) {
                    if (result[0].isBlocked === true)
                        reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.BLOCKED);
                    else {

                        sendMail({fullName: result[0].fullName, email: payloadData.email,pass:pass});
                        Service.findAndUpdate(Modal.Users, criteria, {password: UniversalFunctions.CryptData(pass)}, {}, (err) => {
                            resolve()
                        });

                    }
                } else reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL)
            }
        })
    });
}

/*update  password*/
async function updatePassword(payloadData) {
    let model;
    let criteria = {
        _id: payloadData.id,
    };
    if (payloadData.type === 1) model = Modal.Admins;
    if (payloadData.type === 2) model = Modal.Users;
    if (payloadData.type === 3) model = Modal.Sellers;

    let check = await getRequired(model, criteria, {}, {lean: true});

    if (check[0].isPasswordReset) return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.LINK_EXPIRE);
    else if (check[0].password === UniversalFunctions.CryptData(payloadData.password)) {
        return Promise.reject(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SAME_PASSWORD)
    } else {
        let time = (+new Date() - payloadData.time) / 60000;
        if (time <= 10) {
            return new Promise((resolve, reject) => {

                let dataToSet = {
                    password: UniversalFunctions.CryptData(payloadData.password),
                    isPasswordReset: true
                };
                Service.findAndUpdate(model, criteria, dataToSet, {}, function (err, result) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve()
                    }
                })
            });
        } else return Promise.reject(Config.APP_CONSTANTS.STATUS_MSG.ERROR.LINK_EXPIRE)
    }
}

/*sign up template*/
function signupMail(userData) {
    let strVar = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"> <head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <title>The Networker</title> <style type="text/css"> .o_sans, .o_heading { font-family: Helvetica, Arial, sans-serif; } .o_heading { font-weight: bold; } .o_sans, .o_heading, .o_sans p, .o_sans li { margin-top: 0px; margin-bottom: 0px; } a { text-decoration: none; outline: none; } .o_underline { text-decoration: underline; } .o_linethrough { text-decoration: line-through; } .o_nowrap { white-space: nowrap; } .o_caps { text-transform: uppercase; letter-spacing: 1px; } .o_nowrap { white-space: nowrap; } .o_text-xxs { /*@editable*/ font-size: 12px; /*@editable*/ line-height: 19px; } .o_text-xs { /*@editable*/ font-size: 14px; /*@editable*/ line-height: 21px; } .o_text { /*@editable*/ font-size: 16px; /*@editable*/ line-height: 24px; } .o_text-md { /*@editable*/ font-size: 19px; /*@editable*/ line-height: 28px; } .o_text-lg { /*@editable*/ font-size: 24px; /*@editable*/ line-height: 30px; } h1.o_heading { /*@editable*/ font-size: 36px; /*@editable*/ line-height: 47px; } h2.o_heading { /*@editable*/ font-size: 30px; /*@editable*/ line-height: 39px; } h3.o_heading { /*@editable*/ font-size: 24px; /*@editable*/ line-height: 31px; } h4.o_heading { /*@editable*/ font-size: 18px; /*@editable*/ line-height: 23px; } body, .e_body { width: 100%; margin: 0px; padding: 0px; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } .o_re { font-size: 0; vertical-align: top; } .o_block { max-width: 632px; margin: 0 auto; } .o_block-lg { max-width: 800px; margin: 0 auto; } .o_block-xs { max-width: 432px; margin: 0 auto; } .o_col, .o_col_i { display: inline-block; vertical-align: top; } .o_col { width: 100%; } .o_col-1 { max-width: 100px; } .o_col-o { max-width: 132px; } .o_col-2 { max-width: 200px; } .o_col-3 { max-width: 300px; } .o_col-4 { max-width: 400px; } .o_col-oo { max-width: 468px; } .o_col-5 { max-width: 500px; } .o_col-6s { max-width: 584px; } .o_col-6 { max-width: 600px; } img { -ms-interpolation-mode: bicubic; vertical-align: middle; border: 0; line-height: 100%; height: auto; outline: none; text-decoration: none; } .o_img-full { width: 100%; } .o_inline { display: inline-block; } .o_btn { mso-padding-alt: 12px 24px; } .o_btn a { display: block; padding: 12px 24px; mso-text-raise: 3px; } .o_btn-o { mso-padding-alt: 8px 20px; } .o_btn-o a { display: block; padding: 8px 20px; mso-text-raise: 3px; } .o_btn-xs { mso-padding-alt: 7px 16px; } .o_btn-xs a { display: block; padding: 7px 16px; mso-text-raise: 3px; } .o_btn-b { mso-padding-alt: 7px 8px; } .o_btn-b a { display: block; padding: 7px 8px; font-weight: bold; } .o_btn-b span { mso-text-raise: 6px; display: inline; } .img_fix { mso-text-raise: 6px; display: inline; } .o_bg-light { /*@editable*/ background-color: #f3f3f3; } .o_bg-ultra_light { /*@editable*/ background-color: #d43e30; } .o_bg-white { /*@editable*/ background-color: #ffffff; } .o_bg-dark { /*@editable*/ background-color: #ffffff; } .o_bg-primary { /*@editable*/ background-color: #126de5; } .o_bg-success { /*@editable*/ background-color: #0ec06e; } .o_text-primary, a.o_text-primary span, a.o_text-primary strong, .o_text-primary.o_link a { /*@editable*/ color: #126de5; } .o_text-secondary, a.o_text-secondary span, a.o_text-secondary strong, .o_text-secondary.o_link a { /*@editable*/ color: #424651; } .o_text-dark, a.o_text-dark span, a.o_text-dark strong, .o_text-dark.o_link a { /*@editable*/ color: #ffffff; } .o_text-dark_light, a.o_text-dark_light span, a.o_text-dark_light strong, .o_text-dark_light.o_link a { /*@editable*/ color: #a0a3ab; } .o_text-white, a.o_text-white span, a.o_text-white strong, .o_text-white.o_link a { /*@editable*/ color: #ffffff; } .o_text-light, a.o_text-light span, a.o_text-light strong, .o_text-light.o_link a { /*@editable*/ color: #ffffff; } .o_text-success, a.o_text-success span, a.o_text-success strong, .o_text-success.o_link a { /*@editable*/ color: #0ec06e; } .o_b-primary { /*@editable*/ border: 2px solid #126de5; } .o_bb-primary { /*@editable*/ border-bottom: 1px solid #126de5; } .o_b-light { /*@editable*/ border: 1px solid #d3dce0; } .o_bb-light { /*@editable*/ border-bottom: 1px solid #d3dce0; } .o_bt-light { /*@editable*/ border-top: 1px solid #d3dce0; } .o_br-light { /*@editable*/ border-right: 4px solid #d3dce0; } .o_b-white { /*@editable*/ border: 2px solid #ffffff; } .o_bb-white { /*@editable*/ border-bottom: 1px solid #ffffff; } .o_br { border-radius: 4px; } .o_br-t { border-radius: 4px 4px 0px 0px; } .o_br-b { border-radius: 0px 0px 4px 4px; } .o_br-l { border-radius: 4px 0px 0px 4px; } .o_br-r { border-radius: 0px 4px 4px 0px; } .o_br-max { border-radius: 96px; } .o_hide, .o_hide-lg { display: none; font-size: 0; max-height: 0; width: 0; line-height: 0; overflow: hidden; mso-hide: all; visibility: hidden; } .o_center { text-align: center; } table.o_center { margin-left: auto; margin-right: auto; } .o_left { text-align: left; } table.o_left { margin-left: 0; margin-right: auto; } .o_right { text-align: right; } table.o_right { margin-left: auto; margin-right: 0; } .o_px { padding-left: 16px; padding-right: 16px; } .o_px-xs { padding-left: 8px; padding-right: 8px; } .o_px-md { padding-left: 24px; padding-right: 24px; } .o_px-lg { padding-left: 32px; padding-right: 32px; } .o_py { padding-top: 16px; padding-bottom: 16px; } .o_py-xs { padding-top: 8px; padding-bottom: 8px; } .o_py-md { padding-top: 24px; padding-bottom: 24px; } .o_py-lg { padding-top: 32px; padding-bottom: 32px; } .o_py-xl { padding-top: 64px; padding-bottom: 64px; } .o_pt-xs { padding-top: 8px; } .o_pt { padding-top: 16px; } .o_pt-md { padding-top: 24px; } .o_pt-lg { padding-top: 32px; } .o_pb-xs { padding-bottom: 8px; } .o_pb { padding-bottom: 16px; } .o_pb-md { padding-bottom: 24px; } .o_pb-lg { padding-bottom: 32px; } .o_p-icon { padding: 12px; } .o_body .o_mb-xxs { margin-bottom: 4px; } .o_body .o_mb-xs { margin-bottom: 8px; } .o_body .o_mb { margin-bottom: 16px; } .o_body .o_mb-md { margin-bottom: 24px; } .o_body .o_mb-lg { margin-bottom: 32px; } .o_body .o_mt { margin-top: 16px; } .o_body .o_mt-md { margin-top: 24px; } @media (max-width: 449px) { .o_col-full { max-width: 100% !important; } .o_col-half { max-width: 50% !important; } .o_hide-lg { display: inline-block !important; font-size: inherit !important; max-height: none !important; line-height: inherit !important; overflow: visible !important; width: auto !important; visibility: visible !important; } .o_hide-xs, .o_hide-xs.o_col_i { display: none !important; font-size: 0 !important; max-height: 0 !important; width: 0 !important; line-height: 0 !important; overflow: hidden !important; visibility: hidden !important; height: 0 !important; } .o_xs-center { text-align: center !important; } .o_xs-left { text-align: left !important; } .o_xs-right { text-align: left !important; } table.o_xs-left { margin-left: 0 !important; margin-right: auto !important; float: none !important; } table.o_xs-right { margin-left: auto !important; margin-right: 0 !important; float: none !important; } table.o_xs-center { margin-left: auto !important; margin-right: auto !important; float: none !important; } h1.o_heading { /*@editable*/ font-size: 32px !important; /*@editable*/ line-height: 41px !important; } h2.o_heading { /*@editable*/ font-size: 26px !important; /*@editable*/ line-height: 37px !important; } h3.o_heading { /*@editable*/ font-size: 20px !important; /*@editable*/ line-height: 30px !important; } .o_xs-py-md { padding-top: 24px !important; padding-bottom: 24px !important; } .o_xs-pt-xs { padding-top: 8px !important; } .o_xs-pb-xs { padding-bottom: 8px !important; } } @media screen { @font-face { font-family: 'Roboto'; font-style: normal; font-weight: 400; src: local("Roboto"), local("Roboto-Regular"), url(https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu7GxKOzY.woff2) format("woff2"); unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF; } @font-face { font-family: 'Roboto'; font-style: normal; font-weight: 400; src: local("Roboto"), local("Roboto-Regular"), url(https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2) format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; } @font-face { font-family: 'Roboto'; font-style: normal; font-weight: 700; src: local("Roboto Bold"), local("Roboto-Bold"), url(https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmWUlfChc4EsA.woff2) format("woff2"); unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF; } @font-face { font-family: 'Roboto'; font-style: normal; font-weight: 700; src: local("Roboto Bold"), local("Roboto-Bold"), url(https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmWUlfBBc4.woff2) format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; } .o_sans, .o_heading { font-family: "Roboto", sans-serif !important; } .o_heading, strong, b { font-weight: 700 !important; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; } } .mcd .o_hide, .mcd .o_hide-lg { font-size: inherit!important; max-height: none!important; width: auto!important; line-height: inherit!important; visibility: visible!important; } .mcd td.o_hide { display: block!important; font-family: "Roboto", sans-serif; font-size: 16px!important; color: #000; } .mcd span.o_hide-lg { display: inline-block!important; } .mcd .edit-image { display: inline-block; width: auto; } </style> </head> <body class="o_body o_bg-light"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs o_pt-lg o_xs-pt-xs" align="center">  <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-dark o_px o_py-md o_br-t o_sans o_text" align="center"> <p class="o_text-white o_link"><img mc:edit="heer-1" src="https://homeatrypanel.s3-us-west-2.amazonaws.com/ic_logo.png" alt="Homearty" ></p> </td> </tr> </tbody> </table>  </td> </tr> </tbody></table> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_hide" align="center" style="display: none;font-size: 0;max-height: 0;width: 0;line-height: 0;overflow: hidden;mso-hide: all;visibility: hidden;">Email Summary (Hidden)</td> </tr> </tbody> </table><table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs" align="center">  <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-ultra_light o_px-md o_py-xl o_xs-py-md o_sans o_text-md o_text-light" align="center"> <table role="presentation" cellspacing="0" cellpadding="0" border="0"> <tbody> <tr> <td class="o_sans o_text o_text-secondary o_b-primary o_px o_py o_br-max" align="center" style="font-family: Helvetica, Arial, sans-serif;margin-top: 0px;margin-bottom: 0px;font-size: 16px;line-height: 24px;color: #ffffff;border: 2px solid #ffffff;border-radius: 96px;padding-left: 16px;padding-right: 16px;padding-top: 16px;padding-bottom: 16px;"> <img src="https://img.icons8.com/carbon-copy/100/000000/ok.png"> </td> </tr> <tr> <td height="40">&nbsp; </td> <td height="40">&nbsp; </td> </tr> <tr> <td style="font-size: 8px; line-height: 8px; height: 8px;">&nbsp; </td> <td style="font-size: 8px; line-height: 8px; height: 8px;">&nbsp; </td> </tr> </tbody> </table> <div mc:edit="heicli-2"> <h2 class="o_text-dark o_mb-xxs" style="font-size: 20px;">Welcome ${userData.fullName}</h2> <p>Thanks for joining...</p> </div> </td> </tr> </tbody> </table>  </td> </tr> </tbody> </table> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs" align="center" style="background-color: #f3f3f3;padding-left: 8px;padding-right: 8px;"> <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_re o_bg-white o_px" align="center" style="font-size: 0;vertical-align: top;background-color: #ffffff;padding-left: 16px;padding-right: 16px;"> <div class="o_col o_col-full" style="display: inline-block;vertical-align: top;width: 100%;"> <div style="font-size: 32px; line-height: 32px; height: 32px;">&nbsp; </div> <div class="o_px-xs o_sans o_text-xs o_text-light o_center" style="font-family: Helvetica, Arial, sans-serif;margin-top: 0px;margin-bottom: 0px;font-size: 14px;line-height: 21px;color: #82899a;text-align: center;padding-left: 8px;padding-right: 8px;"> <div style="display: inline-block;width: 29%;vertical-align: middle;"> <img src="https://img.icons8.com/ios-filled/50/000000/food.png" height="100" alt="" style="max-width: 100px;-ms-interpolation-mode: bicubic;vertical-align: middle;border: 0;line-height: 100%;height: auto;outline: none;text-decoration: none;"> </div> <div style="display: inline-block;width: 70%;vertical-align: middle;"> <span>Make delicious Food/ create a post / get orders.</span> </div> </div> </div> <div class="o_col o_col-full" style="display: inline-block;vertical-align: top;width: 100%;"> <div style="font-size: 32px; line-height: 32px; height: 32px;">&nbsp; </div> <div class="o_px-xs o_sans o_text-xs o_text-light o_center" style="font-family: Helvetica, Arial, sans-serif;margin-top: 0px;margin-bottom: 0px;font-size: 14px;line-height: 21px;color: #82899a;text-align: center;padding-left: 8px;padding-right: 8px;"> <div style="display: inline-block;width: 29%;vertical-align: middle;"> <img src="https://img.icons8.com/ios-filled/50/000000/like.png" height="100" alt="" style="max-width: 100px;-ms-interpolation-mode: bicubic;vertical-align: middle;border: 0;line-height: 100%;height: auto;outline: none;text-decoration: none;"> </div> <div style="display: inline-block;width: 70%;vertical-align: middle;">  <span>Create a wish / what you wish to eat / let others create delicous food for you.</span> </div> </div> </div>  <div class="o_col o_col-full" style="display: inline-block;vertical-align: top;width: 100%;"> <div style="font-size: 32px; line-height: 32px; height: 32px;">&nbsp; </div> <div class="o_px-xs o_sans o_text-xs o_text-light o_center" style="font-family: Helvetica, Arial, sans-serif;margin-top: 0px;margin-bottom: 0px;font-size: 14px;line-height: 21px;color: #82899a;text-align: center;padding-left: 8px;padding-right: 8px;"> <div style="display: inline-block;width: 29%;vertical-align: middle;"> <img src="https://img.icons8.com/ios-filled/50/000000/online-payment-.png" height="100" alt="" style="max-width: 100px;-ms-interpolation-mode: bicubic;vertical-align: middle;border: 0;line-height: 100%;height: auto;outline: none;text-decoration: none;"> </div> <div style="display: inline-block;width: 70%;vertical-align: middle;"> <span>Book your order / pickup / delivery options / pay online / cash on delivery.</span> </div> </div> </div> </td> </tr> </tbody> </table>  </td> </tr> </tbody> </table> <table mc:hideable width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs" align="center">  <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-white" style="font-size: 24px; line-height: 24px; height: 24px;">&nbsp; </td> </tr> </tbody> </table>  </td> </tr> </tbody> </table> <table mc:hideable width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs" align="center">  <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-white" style="font-size: 48px; line-height: 48px; height: 48px;">&nbsp; </td> </tr> </tbody> </table>  </td> </tr> </tbody></table><table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs o_pb-lg o_xs-pb-xs" align="center"> <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-dark o_px-md o_py-lg o_bt-light o_br-b o_sans o_text-xs o_text-light" align="center"> <img src="https://homeatrypanel.s3-us-west-2.amazonaws.com/Grofdup+8.png" class="footerImg" style="display: block;margin-left: auto;margin-right: auto;height:5em;"> </td> </tr> </tbody> </table> <div class="o_hide-xs" style="font-size: 64px; line-height: 64px; height: 64px;">&nbsp; </div> </td> </tr> </tbody></table> </body></html>`;

    sendEmail.sendEmail(userData.email, 'Welcome to Homeatry!', strVar);

    let payments = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"> <head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <title>The Networker</title> <style type="text/css"> .o_sans, .o_heading { font-family: Helvetica, Arial, sans-serif; } .o_heading { font-weight: bold; } .o_sans, .o_heading, .o_sans p, .o_sans li { margin-top: 0px; margin-bottom: 0px; } a { text-decoration: none; outline: none; } .o_underline { text-decoration: underline; } .o_linethrough { text-decoration: line-through; } .o_nowrap { white-space: nowrap; } .o_caps { text-transform: uppercase; letter-spacing: 1px; } .o_nowrap { white-space: nowrap; } .o_text-xxs { /*@editable*/ font-size: 12px; /*@editable*/ line-height: 19px; } .o_text-xs { /*@editable*/ font-size: 14px; /*@editable*/ line-height: 21px; } .o_text { /*@editable*/ font-size: 16px; /*@editable*/ line-height: 24px; } .o_text-md { /*@editable*/ font-size: 19px; /*@editable*/ line-height: 28px; } .o_text-lg { /*@editable*/ font-size: 24px; /*@editable*/ line-height: 30px; } h1.o_heading { /*@editable*/ font-size: 36px; /*@editable*/ line-height: 47px; } h2.o_heading { /*@editable*/ font-size: 30px; /*@editable*/ line-height: 39px; } h3.o_heading { /*@editable*/ font-size: 24px; /*@editable*/ line-height: 31px; } h4.o_heading { /*@editable*/ font-size: 18px; /*@editable*/ line-height: 23px; } body, .e_body { width: 100%; margin: 0px; padding: 0px; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } .o_re { font-size: 0; vertical-align: top; } .o_block { max-width: 632px; margin: 0 auto; } .o_block-lg { max-width: 800px; margin: 0 auto; } .o_block-xs { max-width: 432px; margin: 0 auto; } .o_col, .o_col_i { display: inline-block; vertical-align: top; } .o_col { width: 100%; } .o_col-1 { max-width: 100px; } .o_col-o { max-width: 132px; } .o_col-2 { max-width: 200px; } .o_col-3 { max-width: 300px; } .o_col-4 { max-width: 400px; } .o_col-oo { max-width: 468px; } .o_col-5 { max-width: 500px; } .o_col-6s { max-width: 584px; } .o_col-6 { max-width: 600px; } img { -ms-interpolation-mode: bicubic; vertical-align: middle; border: 0; line-height: 100%; height: auto; outline: none; text-decoration: none; } .o_img-full { width: 100%; } .o_inline { display: inline-block; } .o_btn { mso-padding-alt: 12px 24px; } .o_btn a { display: block; padding: 12px 24px; mso-text-raise: 3px; } .o_btn-o { mso-padding-alt: 8px 20px; } .o_btn-o a { display: block; padding: 8px 20px; mso-text-raise: 3px; } .o_btn-xs { mso-padding-alt: 7px 16px; } .o_btn-xs a { display: block; padding: 7px 16px; mso-text-raise: 3px; } .o_btn-b { mso-padding-alt: 7px 8px; } .o_btn-b a { display: block; padding: 7px 8px; font-weight: bold; } .o_btn-b span { mso-text-raise: 6px; display: inline; } .img_fix { mso-text-raise: 6px; display: inline; } .o_bg-light { /*@editable*/ background-color: #f3f3f3; } .o_bg-ultra_light { /*@editable*/ background-color: #d43e30; } .o_bg-white { /*@editable*/ background-color: #ffffff; } .o_bg-dark { /*@editable*/ background-color: #ffffff; } .o_bg-primary { /*@editable*/ background-color: #126de5; } .o_bg-success { /*@editable*/ background-color: #0ec06e; } .o_text-primary, a.o_text-primary span, a.o_text-primary strong, .o_text-primary.o_link a { /*@editable*/ color: #126de5; } .o_text-secondary, a.o_text-secondary span, a.o_text-secondary strong, .o_text-secondary.o_link a { /*@editable*/ color: #424651; } .o_text-dark, a.o_text-dark span, a.o_text-dark strong, .o_text-dark.o_link a { /*@editable*/ color: #ffffff; } .o_text-dark_light, a.o_text-dark_light span, a.o_text-dark_light strong, .o_text-dark_light.o_link a { /*@editable*/ color: #a0a3ab; } .o_text-white, a.o_text-white span, a.o_text-white strong, .o_text-white.o_link a { /*@editable*/ color: #ffffff; } .o_text-light, a.o_text-light span, a.o_text-light strong, .o_text-light.o_link a { /*@editable*/ color: #ffffff; } .o_text-success, a.o_text-success span, a.o_text-success strong, .o_text-success.o_link a { /*@editable*/ color: #0ec06e; } .o_b-primary { /*@editable*/ border: 2px solid #126de5; } .o_bb-primary { /*@editable*/ border-bottom: 1px solid #126de5; } .o_b-light { /*@editable*/ border: 1px solid #d3dce0; } .o_bb-light { /*@editable*/ border-bottom: 1px solid #d3dce0; } .o_bt-light { /*@editable*/ border-top: 1px solid #d3dce0; } .o_br-light { /*@editable*/ border-right: 4px solid #d3dce0; } .o_b-white { /*@editable*/ border: 2px solid #ffffff; } .o_bb-white { /*@editable*/ border-bottom: 1px solid #ffffff; } .o_br { border-radius: 4px; } .o_br-t { border-radius: 4px 4px 0px 0px; } .o_br-b { border-radius: 0px 0px 4px 4px; } .o_br-l { border-radius: 4px 0px 0px 4px; } .o_br-r { border-radius: 0px 4px 4px 0px; } .o_br-max { border-radius: 96px; } .o_hide, .o_hide-lg { display: none; font-size: 0; max-height: 0; width: 0; line-height: 0; overflow: hidden; mso-hide: all; visibility: hidden; } .o_center { text-align: center; } table.o_center { margin-left: auto; margin-right: auto; } .o_left { text-align: left; } table.o_left { margin-left: 0; margin-right: auto; } .o_right { text-align: right; } table.o_right { margin-left: auto; margin-right: 0; } .o_px { padding-left: 16px; padding-right: 16px; } .o_px-xs { padding-left: 8px; padding-right: 8px; } .o_px-md { padding-left: 24px; padding-right: 24px; } .o_px-lg { padding-left: 32px; padding-right: 32px; } .o_py { padding-top: 16px; padding-bottom: 16px; } .o_py-xs { padding-top: 8px; padding-bottom: 8px; } .o_py-md { padding-top: 24px; padding-bottom: 24px; } .o_py-lg { padding-top: 32px; padding-bottom: 32px; } .o_py-xl { padding-top: 64px; padding-bottom: 64px; } .o_pt-xs { padding-top: 8px; } .o_pt { padding-top: 16px; } .o_pt-md { padding-top: 24px; } .o_pt-lg { padding-top: 32px; } .o_pb-xs { padding-bottom: 8px; } .o_pb { padding-bottom: 16px; } .o_pb-md { padding-bottom: 24px; } .o_pb-lg { padding-bottom: 32px; } .o_p-icon { padding: 12px; } .o_body .o_mb-xxs { margin-bottom: 4px; } .o_body .o_mb-xs { margin-bottom: 8px; } .o_body .o_mb { margin-bottom: 16px; } .o_body .o_mb-md { margin-bottom: 24px; } .o_body .o_mb-lg { margin-bottom: 32px; } .o_body .o_mt { margin-top: 16px; } .o_body .o_mt-md { margin-top: 24px; } @media (max-width: 449px) { .o_col-full { max-width: 100% !important; } .o_col-half { max-width: 50% !important; } .o_hide-lg { display: inline-block !important; font-size: inherit !important; max-height: none !important; line-height: inherit !important; overflow: visible !important; width: auto !important; visibility: visible !important; } .o_hide-xs, .o_hide-xs.o_col_i { display: none !important; font-size: 0 !important; max-height: 0 !important; width: 0 !important; line-height: 0 !important; overflow: hidden !important; visibility: hidden !important; height: 0 !important; } .o_xs-center { text-align: center !important; } .o_xs-left { text-align: left !important; } .o_xs-right { text-align: left !important; } table.o_xs-left { margin-left: 0 !important; margin-right: auto !important; float: none !important; } table.o_xs-right { margin-left: auto !important; margin-right: 0 !important; float: none !important; } table.o_xs-center { margin-left: auto !important; margin-right: auto !important; float: none !important; } h1.o_heading { /*@editable*/ font-size: 32px !important; /*@editable*/ line-height: 41px !important; } h2.o_heading { /*@editable*/ font-size: 26px !important; /*@editable*/ line-height: 37px !important; } h3.o_heading { /*@editable*/ font-size: 20px !important; /*@editable*/ line-height: 30px !important; } .o_xs-py-md { padding-top: 24px !important; padding-bottom: 24px !important; } .o_xs-pt-xs { padding-top: 8px !important; } .o_xs-pb-xs { padding-bottom: 8px !important; } } @media screen { @font-face { font-family: 'Roboto'; font-style: normal; font-weight: 400; src: local("Roboto"), local("Roboto-Regular"), url(https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu7GxKOzY.woff2) format("woff2"); unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF; } @font-face { font-family: 'Roboto'; font-style: normal; font-weight: 400; src: local("Roboto"), local("Roboto-Regular"), url(https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2) format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; } @font-face { font-family: 'Roboto'; font-style: normal; font-weight: 700; src: local("Roboto Bold"), local("Roboto-Bold"), url(https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmWUlfChc4EsA.woff2) format("woff2"); unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF; } @font-face { font-family: 'Roboto'; font-style: normal; font-weight: 700; src: local("Roboto Bold"), local("Roboto-Bold"), url(https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmWUlfBBc4.woff2) format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; } .o_sans, .o_heading { font-family: "Roboto", sans-serif !important; } .o_heading, strong, b { font-weight: 700 !important; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; } } .mcd .o_hide, .mcd .o_hide-lg { font-size: inherit!important; max-height: none!important; width: auto!important; line-height: inherit!important; visibility: visible!important; } .mcd td.o_hide { display: block!important; font-family: "Roboto", sans-serif; font-size: 16px!important; color: #000; } .mcd span.o_hide-lg { display: inline-block!important; } .mcd .edit-image { display: inline-block; width: auto; } </style> </head> <body class="o_body o_bg-light"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs o_pt-lg o_xs-pt-xs" align="center">  <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-dark o_px o_py-md o_br-t o_sans o_text" align="center"> <p class="o_text-white o_link"><img mc:edit="heer-1" src="https://homeatrypanel.s3-us-west-2.amazonaws.com/ic_logo.png" alt="Homearty" ></p> </td> </tr> </tbody> </table>  </td> </tr> </tbody></table> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_hide" align="center" style="display: none;font-size: 0;max-height: 0;width: 0;line-height: 0;overflow: hidden;mso-hide: all;visibility: hidden;">Email Summary (Hidden)</td> </tr> </tbody> </table><table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs" align="center">  <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-ultra_light o_px-md o_py-xl o_xs-py-md o_sans o_text-md o_text-light" align="center"> <table role="presentation" cellspacing="0" cellpadding="0" border="0"> <tbody> <tr> <td> <img src="https://upload.wikimedia.org/wikipedia/en/thumb/8/89/Razorpay_logo.svg/1896px-Razorpay_logo.svg.png" style="height: 3em;margin-bottom: 1em;"> </td> </tr> <tr> <td height="40">&nbsp; </td> <td height="40">&nbsp; </td> </tr> <tr> <td style="font-size: 8px; line-height: 8px; height: 8px;">&nbsp; </td> <td style="font-size: 8px; line-height: 8px; height: 8px;">&nbsp; </td> </tr> </tbody> </table> <div mc:edit="heicli-2"> <h2 class="o_text-dark o_mb-xxs" style="font-size: 20px;">Start receving payment online</h2> <p>Follow steps:-</p> </div> </td> </tr> </tbody> </table>  </td> </tr> </tbody> </table> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs" align="center" style="background-color: #f3f3f3;padding-left: 8px;padding-right: 8px;"> <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_re o_bg-white o_px" align="center" style="font-size: 0;vertical-align: top;background-color: #ffffff;padding-left: 16px;padding-right: 16px;"> <div class="o_col o_col-full" style="display: inline-block;vertical-align: top;width: 100%;"> <div style="font-size: 32px; line-height: 32px; height: 32px;">&nbsp; </div> <div class="o_px-xs o_sans o_text-xs o_text-light o_center" style="font-family: Helvetica, Arial, sans-serif;margin-top: 0px;margin-bottom: 0px;font-size: 14px;line-height: 21px;color: #82899a;text-align: center;padding-left: 0px;padding-right: 0px;"> <div style="display: inline-block;width: 90%;vertical-align: middle;"> <ul style="padding-inline-start: 0px;"> <li>First user needs to fill up form in app and enter their bank details</li> <li>Admin needs to fill these details in the razorpay route section</li> <li>After adding the details razorpay will provide the account id corresponding to the details</li> <li>These account id need to filled back into the homeatry corresponding to the user details</li> </ul> </div> </div> </div> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <table mc:hideable width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs" align="center">  <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-white" style="font-size: 24px; line-height: 24px; height: 24px;">&nbsp; </td> </tr> </tbody> </table>  </td> </tr> </tbody> </table><table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-light o_px-xs o_pb-lg o_xs-pb-xs" align="center">  <table class="o_block-xs" width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"> <tbody> <tr> <td class="o_bg-dark o_px-md o_py-lg o_bt-light o_br-b o_sans o_text-xs o_text-light" align="center"> <img src="https://homeatrypanel.s3-us-west-2.amazonaws.com/Grofdup+8.png" class="footerImg" style="display: block;margin-left: auto;margin-right: auto;height:5em;"> </td> </tr> </tbody> </table> <div class="o_hide-xs" style="font-size: 64px; line-height: 64px; height: 64px;">&nbsp; </div> </td> </tr> </tbody></table> </body></html>`
    sendEmail.sendEmail(userData.email, 'Accept payments from Homeatry!', payments)
}

/*forgot password  template*/
function sendMail(data) {
    let strVar = `<!DOCTYPE html><html lang="en" style="max-width: 100%;overflow-x: hidden;"> <head>  <meta charset="utf-8" /> <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" /> <title>Hello, world!</title> </head> <body> <table width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center; font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;" > <tr style="background: #ffffff;"> <td style="padding: 16px;"> <img src="https://homeatrypanel.s3-us-west-2.amazonaws.com/ic_logo.png" alt="homearty logo" class="logo-img" /> </td> </tr> <tr style="background-color: #f7f7f7;"> <td style="height: 55vh; padding: 16px; vertical-align: baseline;"> <img src="https://img.icons8.com/color/48/000000/person-male.png" /> <p style="font-size: 24px;margin-top: 0;margin-bottom: 16px;"> Forget Password </p> <p style="font-size: 14px; font-weight: bold;margin-top: 0;margin-bottom: 16px;" > Hello, please use the below password for login. </p> <p style="font-size: 24px;margin-top: 0;margin-bottom: 16px;"> Password: ${data.pass} </p> </td> </tr> <tr style="background: #ffffff;"> <td style="padding: 16px;"> <img src="https://homeatrypanel.s3-us-west-2.amazonaws.com/Group+8.png" style="max-width: 348px;width: 100%;" /> </td> </tr> </table> </body></html>`

    sendEmail.sendEmail(data.email, 'Homeatry password reset!', strVar)
}


/*check app updation */
async function getAppVersion(payloadData) {
    let criteria = {
        appType: 'USER'
    };
    let data = await getRequired(Modal.AppVersions, criteria, {}, {});
    if (payloadData.deviceType === 'IOS') {
        if (data[0].latestIOSVersion > payloadData.appVersion)
            return ({status: 1});   //any update
        else if (data[0].criticalIOSVersion > payloadData.appVersion)
            return ({status: 2});   //force update

        else return ({status: 3});   //no update
    } else {
        if (data[0].latestAndroidVersion > payloadData.appVersion)
            return ({status: 1});
        else if (data[0].criticalAndroidVersion > payloadData.appVersion)
            return ({status: 2});

        else return ({status: 3});
    }
}


module.exports = {
    userSignUp: userSignUp,
    login: login,
    resendOTP: resendOTP,
    logout: logout,
    updateProfile: updateProfile,
    changePassword: changePassword,
    forgotPassword: forgotPassword,
    getAppVersion: getAppVersion,
    uploadImageUser: uploadImageUser,
    updatePassword: updatePassword,
    sendMail: sendMail,
};
