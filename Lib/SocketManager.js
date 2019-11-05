'use strict';
let  Config = require('../Config');
let  DAO = require('../Services').queries;
let  async = require('async');
let  NotificationManager = require('../Lib/NotificationManager');
const mongoose = require('mongoose');
const Models = require('../Models');

exports.connectSocket = (server)=> {
    if (!server.app) server.app = {};

    server.app.socketConnections = {};

    let io = require('socket.io').listen(server.listener);

    io.on('connection', function (socket) {

        if( socket.handshake.query.userId !== undefined && socket.handshake.query.userId && socket.id){

            console.log('in connection,...............',socket.handshake.query.userId  , socket.id)

            if (!socket.handshake.query.userId) socket.emit('socketErr', {
                statusCode: 400   ,
                message: 'No userId found',
                data: {}
            });

            else {

                let dataToSet ={
                    socketId :   socket.id,
                    isOnline : true,
                    lastSeen : new Date()
                };
                let userId = socket.handshake.query.userId;

                if(userId && userId!== 'null'){
                    const match1 = {
                        $match : {
                            $or:[
                                {senderId:mongoose.Types.ObjectId(userId)},
                                {receiverId:mongoose.Types.ObjectId(userId)}
                            ]
                        }
                    };

                    const group = {
                        $group : {
                            _id:'$conversationId',
                            unReadCount : {$sum : {$cond : [
                                        {$and : [
                                                {$eq :['$isRead',false]},
                                                {$ne:['$senderId',mongoose.Types.ObjectId(userId)]}]
                                        },1,0]}}
                        }
                    };

                    const match2 = {
                        $match : {
                            unReadCount : {$gte : 1}
                        }
                    };

                    DAO.aggregateData(Models.Chats,[match1,group,match2],(err,res)=>{
                        if(err) console.log("err-->>",err);
                        else if (server.app.socketConnections.hasOwnProperty(userId)) {

                            for(let key in server.app.socketConnections){
                                if (server.app.socketConnections[key] && server.app.socketConnections[key].userId && server.app.socketConnections[key].userId === userId)
                                    delete server.app.socketConnections[key];
                            }

                            server.app.socketConnections[userId].socketId = socket.id;
                            server.app.socketConnections[socket.id] = {userId: userId};

                            socket.emit('socketConnected', {
                                statusCode: 200,
                                message: 'Connected to server',
                                data: {socketId: socket.id, badgeCount : res.length}
                            });

                            DAO.findAndUpdate(Models.Users,{_id : userId},dataToSet,{lean : true},()=>{
                                console.log('server connections ifff update>>>>>>>>>>',server.app.socketConnections)
                            });

                            socket.broadcast.emit('isOnline', {isOnline : true, userId : userId});
                        }
                        else {

                            for(let key in server.app.socketConnections){
                                if (server.app.socketConnections[key] && server.app.socketConnections[key].userId && server.app.socketConnections[key].userId === userId)
                                    delete server.app.socketConnections[key];
                            }

                            server.app.socketConnections[userId] = {
                                socketId: socket.id
                            };
                            server.app.socketConnections[socket.id] = {
                                userId: userId
                            };

                            socket.emit('socketConnected', {
                                statusCode: 200,
                                message: 'Connected to server',
                                data: {socketId: socket.id,badgeCount : res.length}
                            });

                            DAO.findAndUpdate(Models.Users,{_id : userId},dataToSet,{lean : true},()=>{
                                console.log("in else update-->>>>>");
                                console.log('server connections else update>>>>>>>>>>',server.app.socketConnections)


                            });

                            socket.broadcast.emit('isOnline', {isOnline : true, userId : userId});
                        }
                    });
                }


                socket.on('sendMessage', (chatdata,socketCallback)=> {
                    console.log('in send message,.........')

                    /* expecting a json object  =>
                     {
                         senderId : ObjectId of Sender,
                         receiverId : ObjectId of Receiver,
                         message : Message String,
                         sentAt : timestamp of sending message
                     }
                     */

                    console.log("Data Come From socket in sendMessage Event-->>>>>",chatdata);


                    let dataToSave = {
                        senderId : chatdata.senderId,
                        receiverId : chatdata.receiverId,
                        sentAt : new Date(),
                        conversationId : [chatdata.senderId, chatdata.receiverId].sort().join('.')
                    };

                    if(chatdata.message) dataToSave.message = chatdata.message;
                    if(chatdata.image) dataToSave.image = chatdata.image;
                    if(chatdata.type) dataToSave.type = chatdata.type;

                    if(server.app.socketConnections && server.app.socketConnections.hasOwnProperty(chatdata.receiverId)){
                        dataToSave.isDelivered = true;
                        dataToSave.deliveredAt = new Date();
                    }

                    let sender,receiver,admin,isBlocked = false;
                    async.auto({
                        CHECK_BLOCK:(callback)=>{
                            let criteria ={
                                blockBy:{$in :[chatdata.senderId,chatdata.receiverId]}
                            };
                            DAO.getData(Models.Chats,criteria,{},{lean: true},(err,res)=>{
                                if(res.length >0) {
                                    isBlocked = true;
                                    callback()
                                }
                                else callback()
                            })
                        },
                        GET_SENDER_DETAILS : ['CHECK_BLOCK',(err,callback)=>{
                            if(!isBlocked){
                                DAO.findOne(Models.Users,{_id: chatdata.senderId},
                                    {userName : 1, isOnline : 1, lastSeen : 1, deviceToken : 1, imageUrl : 1},
                                    {lean: true},(err,res)=>{

                                        if(err) callback(err);
                                        else {
                                            if(res) sender = res;
                                            callback()
                                        }
                                    })
                            }
                            else callback()

                        }],
                        GET_RECEIVER_DETAILS :['CHECK_BLOCK', (err,callback)=>{
                            if(!isBlocked){
                                DAO.findOne(Models.Users,{_id: chatdata.receiverId},
                                    {userName : 1,isOnline : 1,lastSeen : 1, deviceToken : 1,imageUrl : 1,socketId:1},
                                    {lean: true},(err,res)=>{

                                        if(err) callback(err);
                                        else {
                                            if(res) receiver = res;
                                            callback()
                                        }

                                    })
                            }
                            else callback()

                        }],
                        SEND_MSG_FROM_SOCKET : ['GET_SENDER_DETAILS','GET_RECEIVER_DETAILS',(err,callback)=>{
                            if(!isBlocked){
                                DAO.saveData(Models.Chats,dataToSave, (err,res)=> {
                                    console.log('33333333333',err,res)
                                    if(err) callback(err);
                                    else {

                                        let dataToSend =  {
                                            senderId : {
                                                _id : sender._id,
                                                userName : sender.userName,
                                                isOnline : sender.isOnline,
                                                lastSeen :sender.lastSeen,
                                                imageUrl : sender.imageUrl
                                            },
                                            receiverId : {
                                                _id : receiver._id,
                                                userName :receiver.userName,
                                                isOnline : receiver.isOnline,
                                                lastSeen :receiver.lastSeen,
                                                imageUrl : receiver.imageUrl
                                            },
                                            sentAt : res.sentAt,
                                            message : res.message,
                                            image : res.image,
                                            conversationId : res.conversationId,
                                            type : res.type,
                                            deliveredAt : res.deliveredAt,
                                            _id : res. _id,
                                            deletedBy : res.deletedBy,
                                            isDelivered : res.isDelivered,
                                            clearBy : res.clearBy,
                                            blockBy : res.blockBy,

                                        };
                                        // socketCallback({
                                        //     message : chatdata.message,
                                        //     sentAt : chatdata.sentAt,
                                        //     statusCode: 200,
                                        //     data : dataToSend
                                        // });

                                        console.log('44444444444444444444444',  server.app.socketConnections)
                                        console.log('33333333333333',  server.app.socketConnections.hasOwnProperty(chatdata.receiverId))

                                        if(server.app.socketConnections && server.app.socketConnections.hasOwnProperty(chatdata.receiverId)) {
                                            io.to(server.app.socketConnections[chatdata.receiverId].socketId).emit("sendMessage",dataToSend);
                                        }
                                        else io.to(receiver.socketId).emit("sendMessage",dataToSend);


                                        callback(null,dataToSend);
                                    }
                                })
                            }
                            else callback()

                        }],
                        SEND_BADGE_COUNT : ['SEND_MSG_FROM_SOCKET',(err,callback)=>{
                            if(!isBlocked){
                                if(server.app.socketConnections && server.app.socketConnections.hasOwnProperty(chatdata.receiverId)){
                                    const match1 = {
                                        $match : {
                                            $or:[
                                                {senderId:mongoose.Types.ObjectId(chatdata.receiverId)},
                                                {receiverId:mongoose.Types.ObjectId(chatdata.receiverId)}
                                            ]
                                        }
                                    };

                                    const group = {
                                        $group : {
                                            _id:'$conversationId',
                                            unReadCount : {$sum : {$cond : [
                                                        {$and : [
                                                                {$eq :['$isRead',false]},
                                                                {$ne:['$senderId',mongoose.Types.ObjectId(chatdata.receiverId)]}]
                                                        },1,0]}}
                                        }
                                    };

                                    const match2 = {
                                        $match : {
                                            unReadCount : {$gte : 1}
                                        }
                                    };

                                    DAO.aggregateData(Models.Chats,[match1,group,match2],(err,res)=>{
                                        io.to(server.app.socketConnections[chatdata.receiverId].socketId).emit("getBadge", res.length || 0);
                                        callback(null,{})
                                    });
                                }
                                else callback(null,{});
                            }
                            else callback()

                        }]
                    },(err,asyncRes)=>{

                        if(err) console.log("err in receiving info of sender and receiver");
                        else {
                            if(!isBlocked){
                                let notificationData={

                                    message : chatdata.message,
                                    type : 'CHAT',
                                    senderId:chatdata.senderId,
                                    profilePic:sender.profilePic,
                                    lastSeen :sender.lastSeen,
                                    isOnline: sender.isOnline,
                                    username:sender.username,
                                    title : sender.username
                                };

                                NotificationManager.sendPushToUser(receiver.deviceToken,notificationData,(err,res)=> {

                                });

                                if(server.app.socketConnections && server.app.socketConnections.hasOwnProperty(chatdata.receiverId)) {

                                    const match = {
                                        $match : {
                                            deletedBy:{$ne:mongoose.Types.ObjectId(chatdata.receiverId)},
                                            clearBy:{$nin:[mongoose.Types.ObjectId(chatdata.receiverId)]},
                                            $or:[
                                                {senderId:mongoose.Types.ObjectId(chatdata.receiverId)},
                                                {receiverId:mongoose.Types.ObjectId(chatdata.receiverId)}
                                            ]
                                        }
                                    };
                                    const sort1 = {
                                        $sort : {
                                            _id : 1
                                        }
                                    };

                                    const group = {
                                        $group : {
                                            _id:'$conversationId',
                                            senderId : {$last : {$cond : [{$ne : ["$senderId",chatdata.receiverId]},"$senderId","$receiverId"]}},
                                            message:{$last:'$message'},
                                            sentAt:{$last:'$sentAt'},
                                            isRead : {$last : "$isRead"},
                                            type : {$last : "$type"},
                                            readAt:{$last:'$readAt'},
                                            isDelivered : {$last : "$isDelivered"},
                                            deliveredAt:{$last:'$deliveredAt'},
                                            unReadCount : {$sum : {$cond : [
                                                        {$and : [
                                                                {$eq :['$isRead',false]},
                                                                {$eq:['$receiverId',mongoose.Types.ObjectId(chatdata.receiverId)]}]
                                                        },1,0]}}
                                        }
                                    };

                                    const populate = [
                                        {
                                            path : "senderId",
                                            select : "username profilePic isOnline lastSeen",
                                            option : {lean : true},
                                            match : {}
                                        }
                                    ];

                                    const projection = {
                                        $project:{
                                            conversationId : "$_id",
                                            senderId:1,
                                            message:1,
                                            sentAt:1,
                                            type:1,
                                            isRead : 1,
                                            readAt:1,
                                            isDelivered : 1,
                                            deliveredAt:1,
                                            unReadCount : 1
                                        }
                                    };

                                    const sort = {
                                        $sort : {
                                            sentAt : -1
                                        }
                                    };

                                    DAO.aggregateDataWithPopulate(Models.Chats,[match,sort1,group,projection,sort],populate,(err,res)=>{
                                        if(err) console.log("err in chat summary");
                                        else io.to(server.app.socketConnections[chatdata.receiverId].socketId).emit("getChatSummary", res);
                                    })
                                }
                            }

                        }
                    });
                });

                socket.on('isTyping', (data)=> {

                    /* expecting a json object  =>
                     {
                         senderId : ObjectId of Sender,
                         receiverId : ObjectId of Receiver
                     }
                     */

                    //console.log("Data Come From socket in isTyping Event-->>>>>",data);

                    let criteria ={
                        blockBy:{$in :[data.senderId,data.receiverId]}
                    }
                    DAO.getData(Models.Chats,criteria,{},{lean: true},(err,res)=>{
                        if(res && res.length) {
                        }
                        else{
                            if(server.app.socketConnections && server.app.socketConnections.hasOwnProperty(data.receiverId))
                                io.to(server.app.socketConnections[data.receiverId ? data.receiverId : data.senderId].socketId).emit("isTyping", data);
                        }
                    })
                });

                socket.on('isTypingStop', (data)=> {

                    /* expecting a json object  =>
                     {
                     senderId : ObjectId of Sender,
                     receiverId : ObjectId of Receiver
                     }
                     */
                    let criteria ={
                        blockBy:{$in :[data.senderId,data.receiverId]}
                    }
                    DAO.getData(Models.Chats,criteria,{},{lean: true},(err,res)=>{
                        if(res && res.length) {
                        }
                        else{
                            if(server.app.socketConnections && server.app.socketConnections.hasOwnProperty(data.receiverId))
                                io.to(server.app.socketConnections[data.receiverId ? data.receiverId : data.senderId].socketId).emit("isTypingStop", data);
                        }
                    });
                });

                socket.on('isSeen', (data)=> {

                    /* expecting a json object  =>
                     {
                         senderId : ObjectId of Sender,
                         receiverId : ObjectId of Receiver
                     }
                     */
                    let criteria ={
                        blockBy:{$in :[data.senderId,data.receiverId]}
                    }
                    DAO.getData(Models.Chats,criteria,{},{lean: true},(err,res)=>{
                        if(res && res.length) {
                        }
                        else{
                            if(server.app.socketConnections && server.app.socketConnections.hasOwnProperty(data.receiverId)) {
                                io.to(server.app.socketConnections[data.receiverId ? data.receiverId : data.senderId].socketId).emit("isSeen", data);
                            }

                            DAO.update(Models.Chats, {
                                senderId : data.senderId,
                                receiverId : data.receiverId,
                                isRead : false,
                                isDelivered : true
                            },{$set : {isRead : true, readAt : new Date()}},{lean : true}, ()=>{});
                        }
                    });
                });

                socket.on('disconnect', ()=> {

                    console.log("Disconnect Socket main",socket.id , server.app.socketConnections[socket.id]);

                    if (server.app.socketConnections.hasOwnProperty(socket.id)) {
                        var userId = server.app.socketConnections[socket.id].userId;

                        socket.broadcast.emit('isOnline', {isOnline : false, lastSeen : new Date(), userId : userId});

                        DAO.update(Models.Users,{_id : userId},{$set : {socketId:'',isOnline : false, lastSeen : new Date()}},{lean : true},()=>{});
                    }

                    delete server.app.socketConnections[userId];
                    delete server.app.socketConnections[socket.id];

                    // for(let key in server.app.socketConnections){
                    //     if (server.app.socketConnections[key] && server.app.socketConnections[key].userId && server.app.socketConnections[key].userId === userId)
                    //         delete server.app.socketConnections[key];
                    // }

                });

                socket.on('', ()=> {
                    console.log("disconnected Socket", server.app.socketConnections[socket.id].userId);

                    if (server.app.socketConnections.hasOwnProperty(socket.id)) {
                        var userId = server.app.socketConnections[socket.id].userId;

                        socket.broadcast.emit('isOnline', {isOnline : false, lastSeen : new Date(), userId : userId});

                        DAO.update(Models.Users,{_id : userId},{$set : {socketId:'',isOnline : false, lastSeen : new Date()}},{lean : true},()=>{});
                    }

                    for (let key in server.app.socketConnections) {

                        if (server.app.socketConnections.hasOwnProperty(userId)) delete server.app.socketConnections[userId];
                        if (server.app.socketConnections.hasOwnProperty(socket.id)) delete server.app.socketConnections[socket.id]
                    }


                });

            }
        }
        else {
            socket.emit('socketErr', {
                statusCode: 400,
                message: 'No userId found',
                data: {}
            });
        }
    });

    exports.isOnline = (data)=> {
        io.emit('isOnline', {isOnline : true, userId : data._id});
    }
};

