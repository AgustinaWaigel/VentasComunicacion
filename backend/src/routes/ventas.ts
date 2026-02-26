import { Router, Request, Response } from 'express';
import prisma from '../utils/prismaClient';

const router = Router();

// GET /api/ventas
router.get('/', async (_req: Request, res: Response) => {
  try {
    const ventas = await prisma.venta.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        evento: true,
        detalles: {
          include: { producto: true },
        },
      },
    });

    const resultado = ventas.map((v) => ({
      id: v.id,
      fecha: v.fecha.toISOString(),
      total: v.total,
      ganancia: v.ganancia,
      metodoPago: v.metodoPago,
      efectivo: v.efectivo,
      debe: v.debe,
      evento_id: v.eventoId,
      evento_nombre: v.evento?.nombre ?? 'General',
      evento_fecha: v.evento?.fecha ?? null,
      detalles: v.detalles.map((d) => ({
        id: d.id,
        venta_id: d.ventaId,
        producto_id: d.productoId,
        cantidad: d.cantidad,
        subtotal: d.subtotal,
        ganancia: d.ganancia,
        nombre: d.producto?.nombre ?? 'Desconocido',
      })),
    }));

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// POST /api/ventas
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, metodoPago, efectivo, debe, evento_id } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).send('Venta vacia o malformateada');
      return;
    }

    let total = 0;
    let gananciaTotal = 0;

    for (const item of items) {
      const prod = await prisma.producto.findUnique({ where: { id: item.producto_id } });
      if (!prod) { res.status(400).send(`Producto ID ${item.producto_id} no encontrado`); return; }
      if (item.cantidad > prod.stock) { res.status(400).send(`Stock insuficiente para ${prod.nombre}`); return; }
      total += item.subtotal;
      gananciaTotal += item.ganancia;
    }

    const nuevaVenta = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          total,
          ganancia: gananciaTotal,
          metodoPago: metodoPago ?? 'efectivo',
          efectivo: efectivo ? Number(efectivo) : 0,
          debe: debe ?? false,
          eventoId: evento_id ? Number(evento_id) : null,
          detalles: {
            create: items.map((item: any) => ({
              productoId: item.producto_id,
              cantidad: item.cantidad,
              subtotal: item.subtotal,
              ganancia: item.ganancia,
            })),
          },
        },
      });

      for (const item of items) {
        await tx.producto.update({
          where: { id: item.producto_id },
          data: { stock: { decrement: item.cantidad } },
        });
      }

      return venta;
    });

    res.status(201).json({ ok: true, ventaId: nuevaVenta.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
});

// DELETE /api/ventas/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalido' }); return; }

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: { detalles: true },
    });
    if (!venta) { res.status(404).json({ error: 'Venta no encontrada' }); return; }

    await prisma.$transaction(async (tx) => {
      for (const det of venta.detalles) {
        await tx.producto.update({
          where: { id: det.productoId },
          data: { stock: { increment: det.cantidad } },
        });
      }
      await tx.venta.delete({ where: { id } });
    });

    res.json({ mensaje: 'Venta eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la venta' });
  }
});

// PUT /api/ventas/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalido' }); return; }

    const { metodoPago, efectivo, debe } = req.body;
    const actualizada = await prisma.venta.update({
      where: { id },
      data: {
        ...(metodoPago !== undefined && { metodoPago }),
        ...(efectivo !== undefined && { efectivo: Number(efectivo) }),
        ...(debe !== undefined && { debe }),
      },
    });

    res.json(actualizada);
  } catch (error) {
    res.status(404).json({ error: 'Venta no encontrada' });
  }
});

// GET /api/ventas/campamento-adolescentes/estadisticas
router.get('/campamento-adolescentes/estadisticas', async (_req: Request, res: Response) => {
  try {
    const ventas = await prisma.venta.findMany({
      where: { eventoId: null },
      include: { detalles: { include: { producto: true } } },
    });

    const totalVentas = ventas.length;
    const ingresosTotales = ventas.reduce((sum, v) => sum + v.total, 0);
    const gananciaTotales = ventas.reduce((sum, v) => sum + v.ganancia, 0);

    const conteo: Record<number, { nombre: string; cantidad: number; subtotal: number; ganancia: number }> = {};
    for (const v of ventas) {
      for (const d of v.detalles) {
        if (!conteo[d.productoId]) {
          conteo[d.productoId] = { nombre: d.producto?.nombre ?? `Producto ${d.productoId}`, cantidad: 0, subtotal: 0, ganancia: 0 };
        }
        conteo[d.productoId].cantidad += d.cantidad;
        conteo[d.productoId].subtotal += d.subtotal;
        conteo[d.productoId].ganancia += d.ganancia;
      }
    }

    const topProductos = Object.entries(conteo)
      .map(([id, data]) => ({ producto_id: Number(id), ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    res.json({ totalVentas, ingresosTotales, gananciaTotales, topProductos });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
