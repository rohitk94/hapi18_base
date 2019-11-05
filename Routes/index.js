
'use strict';

const userRoute = require('./userRoutes');
const adminRoutes = require('./adminRoutes');

const all = [].concat(userRoute,adminRoutes);

module.exports = all;
