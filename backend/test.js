const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
prisma.producto.findFirst().then(console.log).catch(console.error).finally(() => prisma.$disconnect());
