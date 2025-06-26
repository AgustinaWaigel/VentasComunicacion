import path from 'path';
import { leerExcel, guardarExcel, asegurarExcel } from "../utils/excel";
import { Router, Request, Response, RequestHandler } from 'express';

const router = Router();

const VENTAS_FILE = path.join(__dirname, '../../data/ventas.xlsx');
const DETALLE_FILE = path.join(__dirname, '../../data/detalle_venta.xlsx');
const PRODUCTOS_FILE = path.join(__dirname, '../../data/productos.xlsx');

asegurarExcel(VENTAS_FILE);
asegurarExcel(DETALLE_FILE);
asegurarExcel(PRODUCTOS_FILE);

// Tipos
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  imagen?: string;
}

interface ItemVenta {
  producto_id: number;
  cantidad: number;
  subtotal: number;
  ganancia: number;
}

interface Venta {
  id: number;
  fecha: string;
  total: number;
  ganancia: number;
  metodoPago?: string; // nuevo
  efectivo?: number;   // nuevo
  debe?: boolean;      // nuevo
  evento_id?: number;  // nuevo
}

interface Detalle {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  subtotal: number;
  ganancia: number;
  nombre?: string;
}

// GET /api/ventas
router.get('/', (_req: Request, res: Response) => {
  const ventas: Venta[] = leerExcel(VENTAS_FILE);
  const detalle: Detalle[] = leerExcel(DETALLE_FILE);
  const productos: Producto[] = leerExcel(PRODUCTOS_FILE);
  
  // Cargar eventos para mostrar nombres
  const EVENTOS_FILE = path.join(__dirname, '../../data/eventos.xlsx');
  let eventos: any[] = [];
  try {
    eventos = leerExcel(EVENTOS_FILE);
  } catch (error) {
    console.log('No se pudieron cargar eventos, usando valores por defecto');
  }

  const ventasConDetalles = ventas.map(v => {
    const detalles = detalle
      .filter(d => d.venta_id === v.id)
      .map(d => {
        const producto = productos.find(p => p.id === d.producto_id);
        return { ...d, nombre: producto?.nombre || "Desconocido" };
      });

    // Asignar información del evento
    let eventoInfo = {
      evento_id: null as number | null,
      evento_nombre: "Campamento Adolescentes 2025",
      evento_fecha: "2025-01-01"
    };

    if (v.evento_id) {
      const evento = eventos.find(e => Number(e.id) === Number(v.evento_id));
      if (evento) {
        eventoInfo = {
          evento_id: v.evento_id,
          evento_nombre: evento.nombre,
          evento_fecha: evento.fecha
        };
      }
    }

    return { ...v, detalles, ...eventoInfo };
  });

  ventasConDetalles.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  res.json(ventasConDetalles);
});

// POST /api/ventas
router.post('/', (req: Request, res: Response): void => {
  const items = req.body.items as ItemVenta[];
  const { metodoPago, efectivo, debe, evento_id } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).send("Venta vacía o malformateada");
    return;
  }

  const productos: Producto[] = leerExcel(PRODUCTOS_FILE);
  const ventas: Venta[] = leerExcel(VENTAS_FILE);
  const detalle: Detalle[] = leerExcel(DETALLE_FILE);

  const fecha = new Date().toISOString();
  let total = 0;
  let gananciaTotal = 0;

  const ventaId = ventas.length > 0
    ? Math.max(...ventas.map(v => Number(v.id)).filter(id => !isNaN(id))) + 1
    : 1;

  let detalleId = detalle.length > 0
    ? Math.max(...detalle.map(d => Number(d.id)).filter(id => !isNaN(id))) + 1
    : 1;

  console.log("📥 Venta recibida:", req.body);

  for (const item of items) {
    const prod = productos.find(p => p.id === item.producto_id);

    if (!prod) {
      res.status(400).send(`Producto ID ${item.producto_id} no encontrado`);
      return;
    }

    if (item.cantidad > prod.stock) {
      res.status(400).send(`Stock insuficiente para ${prod.nombre}`);
      return;
    }

    total += item.subtotal;
    gananciaTotal += item.ganancia;
    prod.stock -= item.cantidad;

    const nuevoDetalle: Detalle = {
      id: detalleId++,
      venta_id: ventaId,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      subtotal: item.subtotal,
      ganancia: item.ganancia
    };

    detalle.push(nuevoDetalle);
  }

  ventas.push({
    id: ventaId,
    fecha,
    total,
    ganancia: gananciaTotal,
    metodoPago,
    efectivo,
    debe,
    evento_id
  });

  guardarExcel(PRODUCTOS_FILE, productos);
  guardarExcel(VENTAS_FILE, ventas);
  guardarExcel(DETALLE_FILE, detalle);

  res.status(201).json({ ok: true, ventaId });
});

router.delete('/:id', (req: Request, res: Response) => {

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const ventas: Venta[] = leerExcel(VENTAS_FILE);
  const detalle: Detalle[] = leerExcel(DETALLE_FILE);
  const productos: Producto[] = leerExcel(PRODUCTOS_FILE);

  const ventaExiste = ventas.find((v) => v.id === id);
  if (!ventaExiste) {
    res.status(404).json({ error: "Venta no encontrada" });
    return;
  }

  // 1. Restaurar stock a los productos involucrados
  const detallesVenta = detalle.filter((d) => d.venta_id === id);
  for (const det of detallesVenta) {
    const producto = productos.find(p => p.id === det.producto_id);
    if (producto) {
      producto.stock += det.cantidad;
    }
  }

  // 2. Eliminar la venta y sus detalles
  const nuevasVentas = ventas.filter((v) => v.id !== id);
  const nuevosDetalles = detalle.filter((d) => d.venta_id !== id);

  // 3. Guardar los cambios
  guardarExcel(VENTAS_FILE, nuevasVentas);
  guardarExcel(DETALLE_FILE, nuevosDetalles);
  guardarExcel(PRODUCTOS_FILE, productos);

  res.status(200).json({ mensaje: "Venta eliminada correctamente" });
});

router.put('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const ventas: Venta[] = leerExcel(VENTAS_FILE);
  const ventaIndex = ventas.findIndex((v) => v.id === id);

  if (ventaIndex === -1) {
    res.status(404).json({ error: "Venta no encontrada" });
    return;
  }

  // Actualizamos solo los campos necesarios
  const datosNuevos = req.body as Partial<Venta>;

  ventas[ventaIndex] = {
    ...ventas[ventaIndex],
    ...datosNuevos,
    id, // nos aseguramos de que el ID no se sobreescriba
  };

  guardarExcel(VENTAS_FILE, ventas);

  res.status(200).json({ mensaje: "Venta actualizada correctamente" });
});

// GET /api/ventas/campamento-adolescentes/estadisticas
router.get('/campamento-adolescentes/estadisticas', (_req: Request, res: Response) => {
  try {
    const ventas: Venta[] = leerExcel(VENTAS_FILE);
    const detalle: Detalle[] = leerExcel(DETALLE_FILE);
    
    // Filtrar ventas sin evento específico (Campamento Adolescentes 2025)
    const ventasCampamento = ventas.filter((venta: any) => !venta.evento_id);
    
    const totalVentas = ventasCampamento.length;
    const ingresosTotales = ventasCampamento.reduce((sum: number, venta: any) => sum + (Number(venta.total) || 0), 0);
    const gananciaTotales = ventasCampamento.reduce((sum: number, venta: any) => sum + (Number(venta.ganancia) || 0), 0);
    
    // Productos más vendidos en Campamento Adolescentes 2025
    const ventasIds = ventasCampamento.map((v: any) => Number(v.id));
    const detallesCampamento = detalle.filter((detalle: any) => ventasIds.includes(Number(detalle.venta_id)));
    
    const productosVendidos: { [key: number]: { cantidad: number, subtotal: number, ganancia: number, nombre: string } } = {};
    
    for (const det of detallesCampamento) {
      const productoId = Number(det.producto_id);
      if (!productosVendidos[productoId]) {
        productosVendidos[productoId] = {
          cantidad: 0,
          subtotal: 0,
          ganancia: 0,
          nombre: det.nombre || `Producto ${productoId}`
        };
      }
      productosVendidos[productoId].cantidad += Number(det.cantidad) || 0;
      productosVendidos[productoId].subtotal += Number(det.subtotal) || 0;
      productosVendidos[productoId].ganancia += Number(det.ganancia) || 0;
    }
    
    const topProductos = Object.entries(productosVendidos)
      .map(([id, data]) => ({ producto_id: Number(id), ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
    
    res.json({
      totalVentas,
      ingresosTotales,
      gananciaTotales,
      topProductos
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del Campamento Adolescentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
