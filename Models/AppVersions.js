
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Config = require('../Config');

let AppVersions = new Schema({
    latestIOSVersion : {type: Number, required:true},
    latestAndroidVersion : {type: Number, required:true},
    criticalAndroidVersion : {type: Number, required:true},
    criticalIOSVersion : {type: Number, required:true},
    appType : {type :String,default:Config.APP_CONSTANTS.DATABASE.USER_TYPE.USER,unique:true},
    timeStamp: {type: Date, default: Date.now}
});


module.exports = mongoose.model('AppVersions', AppVersions);
