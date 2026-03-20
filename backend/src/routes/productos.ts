import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import prisma from '../utils/prismaClient';

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

const upload = multer({ storage });

// GET /api/productos
router.get('/', async (_req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({ orderBy: { id: 'asc' } });
    res.json(productos);
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
router.post('/', upload.single('imagen'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, categoria, precio, costo, stock } = req.body;
    const imagen = req.file?.filename;

    if (!nombre || precio == null || costo == null || stock == null) {
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
    }

    const nuevo = await prisma.producto.create({
      data: {
        nombre,
        categoria: categoria || '',
        precio: Number(precio),
        costo: Number(costo),
        stock: Number(stock),
        imagen: imagen || null,
      },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/productos/:id
router.put('/:id', upload.single('imagen'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { nombre, categoria, precio, costo, stock } = req.body;
    const imagen = req.file?.filename;

    const existente = await prisma.producto.findUnique({ where: { id } });
    if (!existente) { res.status(404).send('Producto no encontrado'); return; }

    const actualizado = await prisma.producto.update({
      where: { id },
      data: {
        nombre: nombre || existente.nombre,
        categoria: categoria !== undefined ? categoria : existente.categoria,
        precio: Number(precio),
        costo: Number(costo),
        stock: Number(stock),
        imagen: imagen || existente.imagen,
      },
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
    await prisma.producto.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

export default router;