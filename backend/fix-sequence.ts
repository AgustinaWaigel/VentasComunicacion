import 'dotenv/config';
import prisma from './src/utils/prismaClient';

async function main() {
  try {
    console.log('Sincronizando secuencias de IDs en la base de datos...');
    
    // Producto
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Producto"', 'id'), coalesce(max(id),0) + 1, false) FROM "Producto";`);
    console.log('✅ Secuencia de Producto sincronizada');
    
    // Evento
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Evento"', 'id'), coalesce(max(id),0) + 1, false) FROM "Evento";`);
    console.log('✅ Secuencia de Evento sincronizada');
    
    // Venta
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Venta"', 'id'), coalesce(max(id),0) + 1, false) FROM "Venta";`);
    console.log('✅ Secuencia de Venta sincronizada');
    
    // DetalleVenta
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"DetalleVenta"', 'id'), coalesce(max(id),0) + 1, false) FROM "DetalleVenta";`);
    console.log('✅ Secuencia de DetalleVenta sincronizada');
    
    console.log('Todas las secuencias fueron actualizadas exitosamente.');
  } catch (error) {
    console.error('Error al sincronizar secuencias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
