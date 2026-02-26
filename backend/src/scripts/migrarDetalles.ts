/**
 * Script para migrar solo los detalles de venta
 * Ejecutar con: npx ts-node src/scripts/migrarDetalles.ts
 */

import 'dotenv/config';
import path from 'path';
import * as XLSX from 'xlsx';
import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

function leerExcel(filePath: string): any[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

async function migrarDetalles() {
  console.log('🔄 Migrando detalles de venta...\n');

  const detalles = leerExcel(path.join(__dirname, '../../data/detalle_venta.xlsx'));
  console.log(`Total en Excel: ${detalles.length} detalles`);

  // Obtener IDs de ventas y productos que existen en la DB
  const ventasDB = await prisma.venta.findMany({ select: { id: true } });
  const productosDB = await prisma.producto.findMany({ select: { id: true } });
  const ventaIds = new Set(ventasDB.map(v => v.id));
  const productoIds = new Set(productosDB.map(p => p.id));

  console.log(`Ventas en DB: ${ventaIds.size} | Productos en DB: ${productoIds.size}\n`);

  let ok = 0;
  let saltados = 0;
  let errores = 0;

  for (const d of detalles) {
    const ventaId = Number(d.venta_id);
    const productoId = Number(d.producto_id);

    // Saltar si la venta o producto no existen
    if (!ventaIds.has(ventaId)) { saltados++; continue; }
    if (!productoIds.has(productoId)) { saltados++; continue; }

    try {
      await prisma.detalleVenta.upsert({
        where: { id: Number(d.id) },
        update: {},
        create: {
          id: Number(d.id),
          ventaId,
          productoId,
          cantidad: Number(d.cantidad) || 1,
          subtotal: Number(d.subtotal) || 0,
          ganancia: Number(d.ganancia) || 0,
        },
      });
      ok++;
    } catch (e: any) {
      errores++;
      if (errores <= 3) console.error(`  Error detalle id=${d.id}:`, e.message);
    }
  }

  const totalDB = await prisma.detalleVenta.count();

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Migrados: ${ok}`);
  console.log(`⏭️  Saltados (ref. inválida): ${saltados}`);
  console.log(`❌ Errores: ${errores}`);
  console.log(`📊 Total detalles en DB: ${totalDB}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

migrarDetalles()
  .catch(e => { console.error('Error fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
