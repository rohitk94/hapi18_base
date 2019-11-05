
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Config = require('../Config');
let SchemaTypes = mongoose.Schema.Types;

let Users = new Schema({

    fullName : {type: String,required:true, trim: true,sparse:true},
    userName: {type: String,trim: true,sparse:true,unique:true},
    countryCode: {type: String,default:'',sparse:true},
    phoneNumber: {type: String,default:'',sparse:true},
    password: {type: String,default:'',sparse:true},
    email: {type: String,default:'',sparse :true},
    socialId : {type: String,default:'',sparse :true},
    loginBy: {type:Number}, //1 - for social , 2 - normal
    gender: {type: Number,default:1}, //1- male,2-female,3-other
    imageUrl:{type:String,default:""},
    country :{type:String,default:"",sparse : true},
    currency :{type:String,default:"",sparse : true},
    accountId: {type: String,default:''},
    dob : {type: Number},
    hidePost : [{type:Schema.ObjectId,ref:"Posts",sparse:true}],
    OTP : {type: String},
    isVerified :{type:Boolean,default:false},
    isNotificationOn :{type:Boolean,default:false},
    lastSeen:{type:Date},
    firstTimeLogin :{type:Boolean,default:true},
    isBlocked:{type:Boolean,default:false},
    registrationDate: {type: Number, default:0},
    isDeleted:{type:Boolean,default:false},
    deviceToken:{type:String,trim:true,default:''},
    accessToken:{type:String,trim:true,sparse:true},
    location:{type:[Number],index:'2dsphere'}
});

module.exports = mongoose.model('Users', Users);




