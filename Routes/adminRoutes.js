
"use strict";

const Controller = require('../Controllers').AdminController;
const UserController = require('../Controllers').UserController;
const UniversalFunctions = require('../Utils/UniversalFunction');
const Joi = require('joi');
const Config = require('../Config');

module.exports = [
    {
        method: 'POST',
        path: '/admin/login',
        config: {
            handler: async function (request, h) {
                try {
                    return UniversalFunctions.sendSuccess(null, await Controller.adminLogin(request.payload))
                }
                catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }
            },
            description: 'admin login api',
            tags: ['api', 'admin'],
            validate: {
                payload: {
                    email:Joi.string().lowercase().required(),
                    password:Joi.string().required(),
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
        path: '/admin/changePassword',
        config: {
            handler: async function (request,h) {
                let userData = request.auth && request.auth.credentials && request.auth.credentials.userData;
                try {
                    return UniversalFunctions.sendSuccess(null, await UserController.changePassword(userData))
                }
                catch (e) {
                    console.log(e);
                    return await UniversalFunctions.sendError(e)
                }

            },
            description: 'change Password',
            auth:'AdminAuth',
            tags: ['api'],
            validate: {
                payload: {
                    oldPassword : Joi.string(),
                    newPassword : Joi.string(),
                },
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
