'use strict';

let Config = require('../Config');
let Jwt = require('jsonwebtoken');
let Modal = require('../Models');
let Service = require('../Services').queries;

let getTokenFromDB = async (userId, userType,flag,token)=>{

    let criteria = {
        _id: userId,
        accessToken :token
    },model;

    switch (userType) {
        case Config.APP_CONSTANTS.DATABASE.USER_TYPE.USER :{
           model = Modal.Users;
           break;
        }
        case Config.APP_CONSTANTS.DATABASE.USER_TYPE.ADMIN :{
           model = Modal.Admins;
            break;
        }
    }
    let data = await Service.findOne(model,criteria,{},{lean:true});
    data.userType = userType;
    return data;
};

let setTokenInDB = async (userId,userType, tokenToSave)=> {
    let criteria = {
        _id: userId
    },model;
    let setQuery = {
        accessToken : tokenToSave
    };

    switch (userType) {
        case Config.APP_CONSTANTS.DATABASE.USER_TYPE.USER :{
            model = Modal.Users;
            break;
        }
        case Config.APP_CONSTANTS.DATABASE.USER_TYPE.ADMIN :{
            model = Modal.Admins;
            break;
        }
    }
    let data = await Service.findAndUpdate(model,criteria,setQuery,{new:true,lean:true});
    data.userType = userType;
    return data;
};

let verifyToken = async (token,flag)=> {
    let decoded = await Jwt.verify(token, Config.APP_CONSTANTS.SERVER.JWT_SECRET_KEY);
    return await getTokenFromDB(decoded._id, decoded.type,flag,token);
};

let setToken = async (tokenData)=>{
    let tokenToSend = await Jwt.sign(tokenData, Config.APP_CONSTANTS.SERVER.JWT_SECRET_KEY);
    return await setTokenInDB(tokenData._id,tokenData.type, tokenToSend)
};

let decodeToken = async (token)=> {
    return await Jwt.verify(token, Config.APP_CONSTANTS.SERVER.JWT_SECRET_KEY);
};

module.exports = {
    setToken: setToken,
    verifyToken: verifyToken,
    decodeToken: decodeToken
};
