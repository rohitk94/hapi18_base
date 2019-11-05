
const HapiSwagger = require('hapi-swagger');
const Pack = require('../package');
const Config =  require('../Config');

exports.plugin  = {
    name: 'swagger-plugin',
    register : async (server,option)=> {
        const swaggerOptions = {
            info: {
                title: 'Test API Documentation',
                version: Pack.version,
            },
        };

        await server.register([
            require('@hapi/inert'),
            require('@hapi/vision'),
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);
    }
};
