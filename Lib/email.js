
let config = require('../Config');
let aws = require('../Config/awsS3Config');
let nodemailer = require('nodemailer');
let sesTransport = require('nodemailer-ses-transport');


exports.sendEmail = function(email, subject, content) {

    let transporter = nodemailer.createTransport(sesTransport({
        accessKeyId : aws.s3BucketCredentials.accessKeyId,
        secretAccessKey: aws.s3BucketCredentials.secretAccessKey,
        region:'us-west-2'
    }));

    return new Promise((resolve, reject) => {
        transporter.sendMail({
            from: "Homeatry homeatry@gmail.com", // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            html: content
        },(err,res)=>{
            console.log('send mail',err,res);
            resolve()
        });
    })

};
