const mongoose = require('mongoose');
const Config = require('../Config');
const async = require('async');
const Modal = require('../Models');
mongoose.Promise = global.Promise;
let Service = require('../Services').queries;

//connect socket

//exports.connectSocket = SocketManager.connectSocket;

mongoose.connect(Config.dbConfig.config.dbURI, {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false}, function (err) {
    if (err) {
        console.log("DB Error: ", err);
        process.exit(1);
    } else {
        console.log('MongoDB Connected');
    }
});

exports.bootstrapAdmin = async function () {
    let adminData = [
        {
            email: 'rohit@homeatry.com',
            password: '897c8fde25c5cc5270cda61425eed3c8',   //qwerty
            name: 'Home eatry',
            superAdmin: true,
            "isDeleted" : false,
            "isBlocked" : false,
            roles : []

        },
        {
            email: 'admin@homeatry.com',
            password: '897c8fde25c5cc5270cda61425eed3c8',    //qwerty
            name: 'Home eatry',
            superAdmin: true,
            "isDeleted" : false,
            "isBlocked" : false,
            roles : []
        },
        {
            email: 'test@homeatry.com',
            password: '897c8fde25c5cc5270cda61425eed3c8',    //qwerty
            name: 'Home eatry',
            superAdmin: true,
            "isDeleted" : false,
            "isBlocked" : false,
            roles : []
        }
    ];
    let data = [];

    for(let key of adminData){
        let obj = {...key};
        delete key.password;
        delete key.roles;

        let update ={
            $set : key,
            $setOnInsert :{
                password:obj.password,
                roles : obj.roles,
            }
        };
        data.push(Service.findAndUpdate(Modal.Admins,{email : key.email},update,{upsert:true}));
    }
    try {
        await Promise.all(data);
    }
    catch (e) {
        throw e
    }
};


exports.bootstrapAppVersion = function (callback) {
    let appVersion1 = {
        latestIOSVersion: 1,
        criticalIOSVersion: 1,
        latestAndroidVersion: 1,
        criticalAndroidVersion: 1,
        appType: Config.APP_CONSTANTS.DATABASE.USER_TYPE.USER
    };

    async.parallel([
        function (cb) {
            insertVersionData(appVersion1.appType, appVersion1, cb)
        },
    ], function (err, done) {
        callback(err, 'Bootstrapping finished For App Version');
    })
};

function insertVersionData(appType, versionData, callback) {
    let needToCreate = true;
    async.series([
        async function (cb) {
            let criteria = {
                appType: appType
            };
            let data = await Service.getData(Modal.AppVersions, criteria, {_id: 1}, {});
                if (data && data.length > 0) {
                    needToCreate = false;
                }
                cb()
        },
        async function (cb) {
            if (needToCreate) {
                await Service.saveData(Modal.AppVersions, versionData);
                cb()
            } else {
                cb();
            }
        }], function (err, data) {
        callback(err, 'Bootstrapping finished For Admin Data')
    })
}

