
const Joi = require('joi');

const Controller = require('../Controllers').UserController;
const UniversalFunctions = require('../Utils/UniversalFunction');
const Config = require('../Config');

module.exports = [
    {
        method: 'POST',
        path: '/user/signUp',
        config: {
            handler: async (request ,h)=>{
                try {
                    return UniversalFunctions.sendSuccess(null, await Controller.userSignUp(request.payload))
                }
                catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: 'user signup api',
            tags: ['api', 'user'],
            validate: {
                payload: {
                    fullName : Joi.string().trim().required(),
                    userName : Joi.string().trim().required(),
                    email : Joi.string().email().lowercase(),
                    countryCode : Joi.string().description('send with +'),
                    phoneNumber : Joi.string(),
                    password : Joi.string(),
                    currency : Joi.string().required(),
                    country : Joi.string().required(),
                    code : Joi.string(),
                    dob : Joi.number().description('in miliseconds'),
                    bio : Joi.string(),
                    location : Joi.array().description('[long,lat]'),
                    gender : Joi.number().description('1-male,2- female,3-other'),
                    socialId : Joi.string(),
                    deviceToken : Joi.string().optional(),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType : 'form',
                    responses:Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: 'POST',
        path: '/api/uploadImage',
        config: {
            handler:async function (request, h) {
                try {
                    return  UniversalFunctions.sendSuccess(null,await Controller.uploadImageUser(request.payload))
                }
                catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: 'uploadImage',
            tags: ['api', 'user'],
            payload: {
                maxBytes: 100000000,
                parse: true,
                timeout:false,
                output: 'file'
            },
            validate: {
                payload: {
                    image : Joi.any().meta({swaggerType: 'file'}).description('media file'),
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType : 'form',
                    responses:Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: 'POST',
        path: '/user/logout',
        config: {
            handler:async function (request, h) {
                let userData = request.auth && request.auth.credentials && request.auth.credentials.userData;
                try {
                    return UniversalFunctions.sendSuccess(null, await Controller.logout(userData))
                }
                catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: 'logout',
            auth:'UserAuth',
            tags: ['api', 'user'],
            validate: {
               /* payload: {

                },*/
                headers: UniversalFunctions.authorizationHeaderObj,
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType : 'form',
                    responses:Config.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },

];
