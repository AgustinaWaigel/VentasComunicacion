import { Router, Request, Response } from 'express';
import prisma from '../utils/prismaClient';

const router = Router();

const fechaValida = (fecha: unknown) =>
  typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha) && !Number.isNaN(new Date(fecha).getTime());
const nombreValido = (nombre: unknown) =>
  typeof nombre === 'string' && nombre.trim().length > 0 && nombre.trim().length <= 80;

// Obtener todos los eventos
router.get('/', async (_req: Request, res: Response) => {
  try {
    const eventos = await prisma.evento.findMany({ orderBy: { id: 'desc' } });
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// Crear un nuevo evento
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, fecha, descripcion } = req.body;
    if (!nombreValido(nombre)) { res.status(400).json({ error: 'Ingresá un nombre de hasta 80 caracteres' }); return; }
    if (!fechaValida(fecha)) { res.status(400).json({ error: 'Ingresá una fecha válida' }); return; }
    if (descripcion != null && (typeof descripcion !== 'string' || descripcion.length > 500)) { res.status(400).json({ error: 'La descripción puede tener hasta 500 caracteres' }); return; }

    const nuevo = await prisma.evento.create({
      data: { nombre: nombre.trim(), fecha, descripcion: descripcion || '', activo: true },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
});

// Actualizar un evento
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { nombre, fecha, descripcion, activo } = req.body;
    if (!Number.isInteger(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
    if (nombre !== undefined && !nombreValido(nombre)) { res.status(400).json({ error: 'Ingresá un nombre de hasta 80 caracteres' }); return; }
    if (fecha !== undefined && !fechaValida(fecha)) { res.status(400).json({ error: 'Ingresá una fecha válida' }); return; }
    if (descripcion != null && (typeof descripcion !== 'string' || descripcion.length > 500)) { res.status(400).json({ error: 'La descripción puede tener hasta 500 caracteres' }); return; }
    if (activo !== undefined && typeof activo !== 'boolean') { res.status(400).json({ error: 'El estado del evento no es válido' }); return; }

    const actualizado = await prisma.evento.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(fecha !== undefined && { fecha }),
        ...(descripcion !== undefined && { descripcion }),
        ...(activo !== undefined && { activo }),
      },
    });

    res.json(actualizado);
  } catch (error) {
    res.status(404).json({ error: 'Evento no encontrado' });
  }
});

// Eliminar un evento (marcar como inactivo)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.evento.update({ where: { id }, data: { activo: false } });
    res.json({ mensaje: 'Evento desactivado correctamente' });
  } catch (error) {
    res.status(404).json({ error: 'Evento no encontrado' });
  }
});

// Estadísticas campamento (ventas sin evento)
router.get('/campamento/estadisticas', async (_req: Request, res: Response): Promise<void> => {
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
        if (!conteo[d.productoId]) conteo[d.productoId] = { nombre: d.producto?.nombre ?? 'Producto', cantidad: 0, subtotal: 0, ganancia: 0 };
        conteo[d.productoId].cantidad += d.cantidad;
        conteo[d.productoId].subtotal += d.subtotal;
        conteo[d.productoId].ganancia += d.ganancia;
      }
    }

    const topProductos = Object.entries(conteo)
      .map(([id, data]) => ({ producto_id: Number(id), ...data }))
      .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    res.json({ totalVentas, ingresosTotales, gananciaTotales, topProductos });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estadísticas de un evento específico
router.get('/:id/estadisticas', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventoId = Number(req.params.id);
    const ventas = await prisma.venta.findMany({
      where: { eventoId },
      include: { detalles: { include: { producto: true } } },
    });

    const totalVentas = ventas.length;
    const ingresosTotales = ventas.reduce((sum, v) => sum + v.total, 0);
    const gananciaTotales = ventas.reduce((sum, v) => sum + v.ganancia, 0);

    const conteo: Record<number, { nombre: string; cantidad: number; subtotal: number; ganancia: number }> = {};
    for (const v of ventas) {
      for (const d of v.detalles) {
        if (!conteo[d.productoId]) conteo[d.productoId] = { nombre: d.producto?.nombre ?? 'Producto', cantidad: 0, subtotal: 0, ganancia: 0 };
        conteo[d.productoId].cantidad += d.cantidad;
        conteo[d.productoId].subtotal += d.subtotal;
        conteo[d.productoId].ganancia += d.ganancia;
      }
    }

    const topProductos = Object.entries(conteo)
      .map(([id, data]) => ({ producto_id: Number(id), ...data }))
      .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    res.json({ totalVentas, ingresosTotales, gananciaTotales, topProductos });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
