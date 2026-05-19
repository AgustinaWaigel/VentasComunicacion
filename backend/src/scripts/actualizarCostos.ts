/**
 * Script para actualizar costos de productos
 * Ejecutar con: npx ts-node src/scripts/actualizarCostos.ts
 * 
 * Opción 1: Lee desde un Excel (costos.xlsx en la carpeta data/)
 * El Excel debe tener columnas: id, nombre, costo
 * 
 * Opción 2: Actualiza manualmente los costos definidos en el array
 */

import 'dotenv/config';
import path from 'path';
import * as XLSX from 'xlsx';
import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

// ── OPCIÓN 1: Desde Excel ──────────────────────────────────────
function leerExcelCostos(filePath: string): any[] {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } catch (error) {
    console.log('⚠️  No se encontró el archivo de costos.xlsx');
    return [];
  }
}

// ── OPCIÓN 2: Costos definidos manualmente ─────────────────────
// Edita esta sección con los costos de tus productos
const COSTOS_MANUALES: { [productoId: number]: number } = {
  // Ejemplo:
  // 1: 100,    // Producto ID 1 cuesta $100
  // 2: 150,    // Producto ID 2 cuesta $150
};

async function actualizarCostos() {
  console.log('📊 Iniciando actualización de costos...\n');

  let costos = leerExcelCostos(path.join(__dirname, '../../data', 'costos.xlsx'));
  
  // Si no hay Excel, usar los costos manuales
  if (costos.length === 0 && Object.keys(COSTOS_MANUALES).length > 0) {
    console.log('📝 Usando costos definidos manualmente...\n');
    costos = Object.entries(COSTOS_MANUALES).map(([id, costo]) => ({
      id: Number(id),
      costo: Number(costo),
    }));
  }

  if (costos.length === 0) {
    console.log('❌ No hay costos para actualizar.');
    console.log('   Crea un archivo data/costos.xlsx con columnas: id, nombre, costo');
    console.log('   O define los costos en COSTOS_MANUALES dentro del script\n');
    process.exit(1);
  }

  for (const item of costos) {
    const id = Number(item.id);
    const nuevoCosto = Number(item.costo);

    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      console.log(`⚠️  Producto ID ${id} no encontrado`);
      continue;
    }

    await prisma.producto.update({
      where: { id },
      data: { costo: nuevoCosto },
    });

    console.log(`✅ ${producto.nombre}: $${producto.costo} → $${nuevoCosto}`);
  }

  console.log('\n✨ Costos actualizados correctamente\n');
}

actualizarCostos()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
