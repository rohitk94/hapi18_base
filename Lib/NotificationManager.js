'use strict';

let Config = require('../Config');
const FCM = require('fcm-node');
const serverKeyUser = 'AAAAHIdJKwY:APA91bF0KusTERhEH2s4F4vn0P01Fua31MtYqjfm7ChPlRO5BuDSphIsjI4hu3FPmFYlB0TqTVwxw4RXmexTpgxXoLRcHWWJMzwZpFl3t2J1SLu2pSFLvlG2v8H88JMS5G1guLrzvGYz';
const fcm = new FCM(serverKeyUser);


let sendPushToUser = (deviceToken, data, callback) => {
   // console.log("***data******",data,deviceToken);
       let message = {
           to: deviceToken,
           notification: {
                title:data.title,
                body: data.body,
                sound:"default",
                badge:0
           },
           data:data,
           priority: 'high'
       };
       if(data.imageUrl) message.notification.imageUrl= data.imageUrl;
       if(data.id) message.notification.id= data.id;
       if(data.isOnline) message.notification.isOnline = data.isOnline;
       if(data.userName) message.notification.userName = data.userName;
       if(data.lastSeen) message.notification.lastSeen = data.lastSeen;
       if(data.unreadCount) message.notification.unreadCount = data.unreadCount;
       if(data.click_action) message.notification.click_action = data.click_action;

       //console.log('messsgaeeeeeeee', message)
        fcm.send(message, function(err, result){
            if (err) {
                console.log("Something has gone wrong!",err);
                callback(null);
            } else {
                console.log("Successfully sent with response: ", result);
                callback(null);
            }
        });
};

let sendPushToAdmin = (deviceToken, data, callback) => {
    //console.log("***data******",data,deviceToken);
       let message = {
           to: deviceToken,
           notification: {
               title:data.title,
               body: data.msg,
                sound:"default",
                badge:0
           },
           data:data,
           priority: 'high'
       };
    if(data.imageUrl) message.notification.imageUrl= data.imageUrl;
    if(data.id) message.notification.id= data.id;
    if(data.isOnline) message.notification.isOnline = data.isOnline;
    if(data.userName) message.notification.userName = data.userName;
    if(data.lastSeen) message.notification.lastSeen = data.lastSeen;
    fcm.send(message, function(err, result){
            if (err) {
                console.log("Something has gone wrong!",err);
                callback(null);
            } else {
                console.log("Successfully sent with response: ", result);
                callback(null);
            }
        });
};

let sendMultiPushToUser = (deviceToken, data, callback)=>{
        let message = {
            registration_ids: deviceToken,
            notification: {
            title:data.title,
            body: data.msg,
            sound:"default",
            badge:0,
            },
            data:data,
            priority: 'high'
        };
    if(data.imageUrl) message.notification.imageUrl= data.imageUrl;
    if(data.id) message.notification.id= data.id;
    if(data.isOnline) message.notification.isOnline = data.isOnline;
    if(data.userName) message.notification.userName = data.userName;
    if(data.lastSeen) message.notification.lastSeen = data.lastSeen;
    fcm.send(message, function(err, result){
        if (err) {
            console.log("Something has gone wrong!",err);
            callback(null);
        } else {
            console.log("Successfully sent with response: ", result);
            callback(null);
        }
    });
};



module.exports = {

    sendPushToUser:sendPushToUser,
    sendMultiPushToUser:sendMultiPushToUser,
};
