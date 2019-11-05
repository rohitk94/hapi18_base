const Hapi = require('@hapi/hapi');
const Config = require('./Config');
const Routes = require('./Routes');
const Plugins = require('./Plugins');
const bootStrap = require('./Utils/bootStrap');
const privacyPolicy = require('./Utils/privacyPolicy');

const init = async () => {

    const server = Hapi.server({
        port: Config.dbConfig.config.PORT,
        host: 'localhost', routes: { cors: true }
    });

    // load multiple plugins
    await server.register(Plugins);

    server.route(Routes);

    server.events.on('response', (request,response) =>{
        console.log(request.info.remoteAddress + ': ' + request.method.toUpperCase() +
            ' ' + request.url.pathname + ' --> ' + request.response.statusCode );
        console.log('Request payload:', request.payload);
    });

    try {
        await server.start();
        await bootStrap.bootstrapAdmin();
      // await bootStrap.bootstrapAppVersion(err=>{});
        //bootStrap.connectSocket(server);

        console.log('Server running at:', server.info.uri);
    } catch(err) {
        console.log(err);
    }
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
