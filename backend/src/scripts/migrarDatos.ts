/**
 * Script de migración: Excel → PostgreSQL (Supabase)
 * Ejecutar con: npx ts-node src/scripts/migrarDatos.ts
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

const DATA = path.join(__dirname, '../../data');

async function migrar() {
  console.log('🚀 Iniciando migración de datos Excel → Supabase...\n');

  // ── 1. PRODUCTOS ──────────────────────────────────────────────
  const productos = leerExcel(path.join(DATA, 'productos.xlsx'));
  console.log(`📦 Migrando ${productos.length} productos...`);

  for (const p of productos) {
    await prisma.producto.upsert({
      where: { id: Number(p.id) },
      update: {},
      create: {
        id: Number(p.id),
        nombre: String(p.nombre || ''),
        categoria: String(p.categoria || ''),
        precio: Number(p.precio) || 0,
        costo: Number(p.costo) || 0,
        stock: Number(p.stock) || 0,
        imagen: p.imagen ? String(p.imagen) : null,
      },
    });
  }
  console.log('   ✅ Productos migrados\n');

  // ── 2. EVENTOS ────────────────────────────────────────────────
  const eventos = leerExcel(path.join(DATA, 'eventos.xlsx'));
  console.log(`📅 Migrando ${eventos.length} eventos...`);

  for (const e of eventos) {
    await prisma.evento.upsert({
      where: { id: Number(e.id) },
      update: {},
      create: {
        id: Number(e.id),
        nombre: String(e.nombre || ''),
        fecha: String(e.fecha || ''),
        descripcion: String(e.descripcion || ''),
        activo: Boolean(e.activo),
      },
    });
  }
  console.log('   ✅ Eventos migrados\n');

  // ── 3. VENTAS ─────────────────────────────────────────────────
  const ventas = leerExcel(path.join(DATA, 'ventas.xlsx'));
  console.log(`💰 Migrando ${ventas.length} ventas...`);

  for (const v of ventas) {
    const fecha = v.fecha ? new Date(v.fecha) : new Date();
    const eventoId = v.evento_id && Number(v.evento_id) ? Number(v.evento_id) : null;

    await prisma.venta.upsert({
      where: { id: Number(v.id) },
      update: {},
      create: {
        id: Number(v.id),
        fecha: isNaN(fecha.getTime()) ? new Date() : fecha,
        total: Number(v.total) || 0,
        ganancia: Number(v.ganancia) || 0,
        metodoPago: v.metodoPago ? String(v.metodoPago) : 'efectivo',
        efectivo: Number(v.efectivo) || 0,
        debe: Boolean(v.debe),
        eventoId,
      },
    });
  }
  console.log('   ✅ Ventas migradas\n');

  // ── 4. DETALLES DE VENTA ──────────────────────────────────────
  const detalles = leerExcel(path.join(DATA, 'detalle_venta.xlsx'));
  console.log(`🧾 Migrando ${detalles.length} detalles de venta...`);

  for (const d of detalles) {
    await prisma.detalleVenta.upsert({
      where: { id: Number(d.id) },
      update: {},
      create: {
        id: Number(d.id),
        ventaId: Number(d.venta_id),
        productoId: Number(d.producto_id),
        cantidad: Number(d.cantidad) || 0,
        subtotal: Number(d.subtotal) || 0,
        ganancia: Number(d.ganancia) || 0,
      },
    });
  }
  console.log('   ✅ Detalles migrados\n');

  // ── RESUMEN ───────────────────────────────────────────────────
  const totalProds = await prisma.producto.count();
  const totalEvts = await prisma.evento.count();
  const totalVtas = await prisma.venta.count();
  const totalDets = await prisma.detalleVenta.count();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Migración completada exitosamente!\n');
  console.log(`   Productos en DB:  ${totalProds}`);
  console.log(`   Eventos en DB:    ${totalEvts}`);
  console.log(`   Ventas en DB:     ${totalVtas}`);
  console.log(`   Detalles en DB:   ${totalDets}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

migrar()
  .catch((e) => {
    console.error('❌ Error durante la migración:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
