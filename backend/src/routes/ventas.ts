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
        costo: d.producto?.costo ?? 0,
      })),
    }));

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar ventas' });
  }
});

const METODOS_PAGO = ['efectivo', 'transferencia'];
const MAX_UNIDADES = 999;
const VIGENCIA_CLAVE = 15 * 60 * 1000;

type Respuesta = { status: number; body: unknown };
const rechazo = (error: string): Respuesta => ({ status: 400, body: { error } });

// Ventas ya creadas, por la clave que manda el navegador: si la conexión se
// corta y se reintenta, se devuelve la misma venta en vez de cargarla otra vez.
const recientes = new Map<string, { creada: number; resultado: Promise<Respuesta> }>();

async function registrarVenta(body: any): Promise<Respuesta> {
  const { items, metodoPago, efectivo, debe, evento_id } = body ?? {};
  if (!Array.isArray(items) || !items.length) return rechazo('La venta no tiene productos');
  if (items.length > 200) return rechazo('La venta tiene demasiados productos');

  const cantidades = new Map<number, number>();
  for (const item of items) {
    const id = Number(item?.producto_id);
    const cantidad = Number(item?.cantidad);
    if (!Number.isInteger(id) || id <= 0) return rechazo('Hay un producto inválido en la venta');
    if (!Number.isInteger(cantidad) || cantidad < 1) return rechazo('Las cantidades deben ser números enteros mayores a cero');
    cantidades.set(id, (cantidades.get(id) ?? 0) + cantidad);
  }
  for (const cantidad of cantidades.values()) {
    if (cantidad > MAX_UNIDADES) return rechazo(`No se pueden cargar más de ${MAX_UNIDADES} unidades de un producto`);
  }

  const metodo = metodoPago ?? 'efectivo';
  if (!METODOS_PAGO.includes(metodo)) return rechazo('El medio de pago no es válido');
  const recibido = efectivo == null || efectivo === '' ? 0 : Number(efectivo);
  if (!Number.isFinite(recibido) || recibido < 0) return rechazo('El monto recibido no es válido');
  if (debe != null && typeof debe !== 'boolean') return rechazo('El estado de deuda no es válido');

  let eventoId: number | null = null;
  if (evento_id != null && evento_id !== '') {
    eventoId = Number(evento_id);
    if (!Number.isInteger(eventoId) || eventoId <= 0) return rechazo('El evento no es válido');
    const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento) return rechazo('El evento elegido ya no existe');
  }

  const productos = await prisma.producto.findMany({ where: { id: { in: [...cantidades.keys()] } } });
  if (productos.length !== cantidades.size) return rechazo('Uno de los productos ya no existe. Actualizá la página');
  const sinPrecio = productos.find((p) => !(p.precio > 0));
  if (sinPrecio) return rechazo(`${sinPrecio.nombre} no tiene precio cargado`);

  // Los importes se calculan acá con el precio guardado, no con lo que manda el navegador.
  const detalles = productos.map((p) => {
    const cantidad = cantidades.get(p.id) ?? 0;
    return {
      productoId: p.id,
      cantidad,
      subtotal: p.precio * cantidad,
      ganancia: (p.precio - p.costo) * cantidad,
    };
  });

  const venta = await prisma.venta.create({
    data: {
      total: detalles.reduce((s, d) => s + d.subtotal, 0),
      ganancia: detalles.reduce((s, d) => s + d.ganancia, 0),
      metodoPago: metodo,
      efectivo: metodo === 'efectivo' ? recibido : 0,
      debe: debe ?? false,
      eventoId,
      detalles: { create: detalles },
    },
  });

  return { status: 201, body: { ok: true, ventaId: venta.id } };
}

// POST /api/ventas
router.post('/', async (req: Request, res: Response) => {
  try {
    const clave = typeof req.body?.clave === 'string' && req.body.clave.length <= 80 ? req.body.clave : '';
    const ahora = Date.now();
    for (const [k, v] of recientes) {
      if (ahora - v.creada > VIGENCIA_CLAVE) recientes.delete(k);
    }

    let entrada = clave ? recientes.get(clave) : undefined;
    if (!entrada) {
      entrada = { creada: ahora, resultado: registrarVenta(req.body) };
      if (clave) {
        recientes.set(clave, entrada);
        // Solo se recuerdan las ventas creadas: un rechazo se puede corregir y reenviar.
        entrada.resultado.then(
          (r) => { if (r.status !== 201) recientes.delete(clave); },
          () => { recientes.delete(clave); },
        );
      }
    }

    const { status, body } = await entrada.resultado;
    res.status(status).json(body);
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

    const venta = await prisma.venta.findUnique({ where: { id } });
    if (!venta) { res.status(404).json({ error: 'Venta no encontrada' }); return; }

    await prisma.venta.delete({ where: { id } });

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
    if (metodoPago !== undefined && !METODOS_PAGO.includes(metodoPago)) { res.status(400).json({ error: 'El medio de pago no es válido' }); return; }
    if (efectivo !== undefined && (!Number.isFinite(Number(efectivo)) || Number(efectivo) < 0)) { res.status(400).json({ error: 'El monto recibido no es válido' }); return; }
    if (debe !== undefined && typeof debe !== 'boolean') { res.status(400).json({ error: 'El estado de deuda no es válido' }); return; }
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
