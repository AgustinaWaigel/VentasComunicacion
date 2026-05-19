import 'dotenv/config';
import prisma from './src/utils/prismaClient';
import bcrypt from 'bcrypt';

async function main() {
  const userCount = await prisma.usuario.count();
  
  if (userCount > 0) {
    console.log('El sistema ya tiene usuarios. No se creará el admin por defecto.');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@ventas.com',
      password: hashedPassword,
      rol: 'admin'
    }
  });

  console.log(`Administrador creado con éxito: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
