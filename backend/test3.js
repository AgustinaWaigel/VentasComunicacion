"use strict";
require('dotenv').config();
const p = require('./src/utils/prismaClient').default;
p.producto.findFirst().then(console.log).catch(console.error).finally(() => p.$disconnect());
