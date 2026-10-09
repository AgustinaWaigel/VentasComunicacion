import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import prisma from '../utils/prismaClient';
import { Prisma } from '../../generated/prisma';

const router = Router();
const UPLOADS_FOLDER = path.join(__dirname, '../../uploads');

// Asegura la carpeta en entornos donde no se versionan directorios vacios (ej. Render)
if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
}

// Configuración de almacenamiento de imágenes con multer
const storage = multer.diskStorage({
  destination: UPLOADS_FOLDER,
  filename: (_req: Request, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('La imagen no es válida'));
  },
});

// Devuelve un 400 legible cuando el archivo no es una imagen o pesa de más.
const subirImagen = (req: Request, res: Response, next: NextFunction) => {
  upload.single('imagen')(req, res, (err: unknown) => {
    if (err) { res.status(400).json({ error: 'La foto debe ser una imagen de hasta 5 MB' }); return; }
    next();
  });
};

const descartarImagen = (req: Request) => {
  if (req.file) fs.unlink(req.file.path, () => {});
};

// El stock no se usa por ahora: no se pide ni se modifica desde acá.
function leerProducto(body: any): { error: string } | { nombre: string; categoria: string; precio: number; costo: number } {
  const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';
  const categoria = typeof body?.categoria === 'string' ? body.categoria.trim() : '';
  const precio = Number(body?.precio);
  const costo = Number(body?.costo);
  if (!nombre) return { error: 'Ingresá el nombre del producto' };
  if (nombre.length > 80) return { error: 'El nombre puede tener hasta 80 caracteres' };
  if (categoria.length > 40) return { error: 'La categoría puede tener hasta 40 caracteres' };
  if (body?.precio == null || body.precio === '' || !Number.isFinite(precio) || precio <= 0) return { error: 'El precio debe ser un número mayor a cero' };
  if (body?.costo == null || body.costo === '' || !Number.isFinite(costo) || costo < 0) return { error: 'El costo debe ser un número igual o mayor a cero' };
  return { nombre, categoria, precio, costo };
}

// GET /api/productos
router.get('/', async (_req: Request, res: Response) => {
  const start = performance.now();
  try {
    const productos = await prisma.producto.findMany({ orderBy: { id: 'asc' } });
    const queried = performance.now();
    const body = JSON.stringify(productos);
    res.setHeader('Server-Timing', `db;dur=${(queried - start).toFixed(1)},serialize;dur=${(performance.now() - queried).toFixed(1)}`);
    res.setHeader('Cache-Control', 'no-store');
    res.type('json').send(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/productos/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) { res.status(404).send('Producto no encontrado'); return; }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST /api/productos (con imagen)
router.post('/', subirImagen, async (req: Request, res: Response): Promise<void> => {
  try {
    const datos = leerProducto(req.body);
    if ('error' in datos) { descartarImagen(req); res.status(400).json(datos); return; }

    const nuevo = await prisma.producto.create({
      data: { ...datos, imagen: req.file?.filename || null },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/productos/:id
router.put('/:id', subirImagen, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const datos = leerProducto(req.body);
    if (!Number.isInteger(id)) { descartarImagen(req); res.status(400).json({ error: 'ID inválido' }); return; }
    if ('error' in datos) { descartarImagen(req); res.status(400).json(datos); return; }

    const existente = await prisma.producto.findUnique({ where: { id } });
    if (!existente) { descartarImagen(req); res.status(404).json({ error: 'Producto no encontrado' }); return; }

    const actualizado = await prisma.producto.update({
      where: { id },
      data: { ...datos, imagen: req.file?.filename || existente.imagen },
    });

    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/productos/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
    await prisma.producto.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Producto no encontrado' });
        return;
      }

      if (error.code === 'P2003') {
        res.status(409).json({ error: 'No se puede eliminar: el producto tiene ventas asociadas' });
        return;
      }
    }

    console.error(error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
