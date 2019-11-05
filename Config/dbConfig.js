
'use strict';

switch (process.env.NODE_ENV) {

    case 'dev':{
        exports.config = {
            PORT : 8000,
            dbURI : 'mongodb://username:pass@host/dbname',
            swaggerName : 'Dev APIs',
        };
        break;
    }
    case 'live':{
        exports.config = {
            PORT : 8001,
            dbURI : 'mongodb://username:pass@host/dbname',
            swaggerName : 'Live APIs',
        };
        break;
    }
}
