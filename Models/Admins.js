
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Config = require('../Config');

let Admins = new Schema({
    name: {type: String, trim: true, index: true},
    email: {type: String, trim: true, unique: true, index: true},
    accessToken: {type: String, trim: true, index: true, sparse: true,default:null},
    password: {type: String, required:true},
    passwordResetToken: {type: String, trim: true, unique: true, sparse:true},
    isPasswordReset :{type:Boolean,default:false},
    superAdmin:{type:Boolean},
    roles:{type:Array},
    isBlocked: {type: Boolean, default: false},
    isDeleted: {type: Boolean, default: false}
},{
    timestamps : true
});

module.exports = mongoose.model('Admins', Admins);




