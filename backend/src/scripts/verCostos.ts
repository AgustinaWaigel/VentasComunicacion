/**
 * Script para ver los costos actuales de todos los productos
 * Ejecutar con: npx ts-node src/scripts/verCostos.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function verCostos() {
  console.log('📊 Costos actuales en la base de datos:\n');

  const productos = await prisma.producto.findMany({
    orderBy: { id: 'asc' },
  });

  if (productos.length === 0) {
    console.log('❌ No hay productos en la base de datos\n');
    process.exit(0);
  }

  console.log(`ID | Nombre | Precio | Costo | Stock`);
  console.log(`---|--------|--------|-------|------`);

  let costosEnCero = 0;
  for (const p of productos) {
    console.log(`${p.id} | ${p.nombre} | $${p.precio} | $${p.costo} | ${p.stock}`);
    if (p.costo === 0) costosEnCero++;
  }

  console.log(`\n⚠️  ${costosEnCero} productos tienen costo en 0\n`);
}

verCostos()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
