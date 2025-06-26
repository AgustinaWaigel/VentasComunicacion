import path from 'path';
import { leerExcel, guardarExcel, asegurarExcel } from "../utils/excel";
import { Router, Request, Response } from 'express';

const router = Router();

const EVENTOS_FILE = path.join(__dirname, '../../data/eventos.xlsx');

// Asegurar que el archivo existe
asegurarExcel(EVENTOS_FILE);

interface Evento {
  id: number;
  nombre: string;
  fecha: string;
  descripcion?: string;
  activo: boolean;
}

// Obtener todos los eventos
router.get('/', (_req: Request, res: Response) => {
  try {
    const datos = leerExcel(EVENTOS_FILE);
    const eventos = datos.map((row: any) => ({
      id: Number(row.id) || 0,
      nombre: String(row.nombre || ''),
      fecha: String(row.fecha || ''),
      descripcion: String(row.descripcion || ''),
      activo: Boolean(row.activo)
    }));
    
    res.json(eventos);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear un nuevo evento
router.post('/', (req: Request, res: Response): void => {
  try {
    const { nombre, fecha, descripcion } = req.body;
    
    if (!nombre || !fecha) {
      res.status(400).json({ error: 'Nombre y fecha son requeridos' });
      return;
    }

    const eventos = leerExcel(EVENTOS_FILE);
    const nuevoId = eventos.length > 0 ? Math.max(...eventos.map((e: any) => Number(e.id) || 0)) + 1 : 1;
    
    const nuevoEvento: Evento = {
      id: nuevoId,
      nombre,
      fecha,
      descripcion: descripcion || '',
      activo: true
    };
    
    eventos.push(nuevoEvento);
    guardarExcel(EVENTOS_FILE, eventos);
    
    res.status(201).json(nuevoEvento);
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar un evento
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id);
    const { nombre, fecha, descripcion, activo } = req.body;
    
    const eventos = leerExcel(EVENTOS_FILE);
    const indice = eventos.findIndex((evento: any) => Number(evento.id) === id);
    
    if (indice === -1) {
      res.status(404).json({ error: 'Evento no encontrado' });
      return;
    }
    
    eventos[indice] = {
      ...eventos[indice],
      nombre: nombre || eventos[indice].nombre,
      fecha: fecha || eventos[indice].fecha,
      descripcion: descripcion !== undefined ? descripcion : eventos[indice].descripcion,
      activo: activo !== undefined ? activo : eventos[indice].activo
    };
    
    guardarExcel(EVENTOS_FILE, eventos);
    res.json(eventos[indice]);
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar un evento (marcar como inactivo)
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id);
    
    const eventos = leerExcel(EVENTOS_FILE);
    const indice = eventos.findIndex((evento: any) => Number(evento.id) === id);
    
    if (indice === -1) {
      res.status(404).json({ error: 'Evento no encontrado' });
      return;
    }
    
    eventos[indice].activo = false;
    guardarExcel(EVENTOS_FILE, eventos);
    
    res.json({ mensaje: 'Evento desactivado correctamente' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas del "Campamento Adolescentes 2025" (ventas sin evento específico)
router.get('/campamento/estadisticas', (req: Request, res: Response): void => {
  try {
    // Leer datos de ventas
    const VENTAS_FILE = path.join(__dirname, '../../data/ventas.xlsx');
    const DETALLE_FILE = path.join(__dirname, '../../data/detalle_venta.xlsx');
    
    const ventas = leerExcel(VENTAS_FILE);
    const detalles = leerExcel(DETALLE_FILE);
    
    // Filtrar ventas sin evento_id o con evento_id vacío/null
    const ventasCampamento = ventas.filter((venta: any) => 
      !venta.evento_id || venta.evento_id === '' || venta.evento_id === null || venta.evento_id === undefined
    );
    
    const totalVentas = ventasCampamento.length;
    const ingresosTotales = ventasCampamento.reduce((sum: number, venta: any) => sum + (Number(venta.total) || 0), 0);
    const gananciaTotales = ventasCampamento.reduce((sum: number, venta: any) => sum + (Number(venta.ganancia) || 0), 0);
    
    // Productos más vendidos en el campamento
    const ventasIds = ventasCampamento.map((v: any) => Number(v.id));
    const detallesCampamento = detalles.filter((detalle: any) => ventasIds.includes(Number(detalle.venta_id)));
    
    const productosVendidos: { [key: number]: { cantidad: number, subtotal: number, ganancia: number, nombre: string } } = {};
    
    for (const detalle of detallesCampamento) {
      const productoId = Number(detalle.producto_id);
      if (!productosVendidos[productoId]) {
        productosVendidos[productoId] = {
          cantidad: 0,
          subtotal: 0,
          ganancia: 0,
          nombre: detalle.nombre || `Producto ${productoId}`
        };
      }
      productosVendidos[productoId].cantidad += Number(detalle.cantidad) || 0;
      productosVendidos[productoId].subtotal += Number(detalle.subtotal) || 0;
      productosVendidos[productoId].ganancia += Number(detalle.ganancia) || 0;
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
    console.error('Error al obtener estadísticas del campamento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de un evento
router.get('/:id/estadisticas', (req: Request, res: Response): void => {
  try {
    const eventoId = Number(req.params.id);
    
    // Leer datos de ventas
    const VENTAS_FILE = path.join(__dirname, '../../data/ventas.xlsx');
    const DETALLE_FILE = path.join(__dirname, '../../data/detalle_venta.xlsx');
    
    const ventas = leerExcel(VENTAS_FILE);
    const detalles = leerExcel(DETALLE_FILE);
    
    // Filtrar ventas del evento
    const ventasEvento = ventas.filter((venta: any) => Number(venta.evento_id) === eventoId);
    
    const totalVentas = ventasEvento.length;
    const ingresosTotales = ventasEvento.reduce((sum: number, venta: any) => sum + (Number(venta.total) || 0), 0);
    const gananciaTotales = ventasEvento.reduce((sum: number, venta: any) => sum + (Number(venta.ganancia) || 0), 0);
    
    // Productos más vendidos en este evento
    const ventasIds = ventasEvento.map((v: any) => Number(v.id));
    const detallesEvento = detalles.filter((detalle: any) => ventasIds.includes(Number(detalle.venta_id)));
    
    const productosVendidos: { [key: number]: { cantidad: number, subtotal: number, ganancia: number, nombre: string } } = {};
    
    for (const detalle of detallesEvento) {
      const productoId = Number(detalle.producto_id);
      if (!productosVendidos[productoId]) {
        productosVendidos[productoId] = {
          cantidad: 0,
          subtotal: 0,
          ganancia: 0,
          nombre: detalle.nombre || `Producto ${productoId}`
        };
      }
      productosVendidos[productoId].cantidad += Number(detalle.cantidad) || 0;
      productosVendidos[productoId].subtotal += Number(detalle.subtotal) || 0;
      productosVendidos[productoId].ganancia += Number(detalle.ganancia) || 0;
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
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
