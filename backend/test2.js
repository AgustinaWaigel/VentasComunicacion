require('dotenv').config();
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
prisma.usuario.findFirst().then(console.log).catch(console.error).finally(()=>prisma.$disconnect());
