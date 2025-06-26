import { Router, Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { leerExcel, guardarExcel, asegurarExcel } from "../utils/excel";

const router = Router();
const PRODUCTOS_FILE = path.join(__dirname, '../../data/productos.xlsx');
const UPLOADS_FOLDER = path.join(__dirname, '../../uploads');

// Asegura que el archivo Excel exista
asegurarExcel(PRODUCTOS_FILE);

// Configuración de almacenamiento de imágenes con multer
const storage = multer.diskStorage({
  destination: UPLOADS_FOLDER,
  filename: (_req: Request, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

interface Producto {
  id: number;
  nombre: string;
  categoria?: string;
  precio: number;
  costo: number;
  stock: number;
  imagen?: string;
}

// GET /api/productos
router.get('/', (_req: Request, res: Response) => {
  const productos: Producto[] = leerExcel(PRODUCTOS_FILE);
  res.json(productos);
});

// POST /api/productos (con imagen)
router.post('/', upload.single("imagen"), (req: Request, res: Response): void => {
  const productos: Producto[] = leerExcel(PRODUCTOS_FILE);
  const { nombre, categoria, precio, costo, stock } = req.body;
  const imagen = req.file?.filename;

  if (!nombre || precio == null || costo == null || stock == null) {
    res.status(400).json({ error: "Faltan campos requeridos" });
    return;
  }

  const nuevo: Producto = {
    id: productos.length > 0
      ? productos.map(p => Number(p.id)).reduce((max, curr) => Math.max(max, curr), 0) + 1
      : 1,
    nombre,
    categoria: categoria || '',
    precio: Number(precio),
    costo: Number(costo),
    stock: Number(stock),
    imagen,
  };

  productos.push(nuevo);
  guardarExcel(PRODUCTOS_FILE, productos);
  res.status(201).send("Producto agregado");
});

// PUT /api/productos/:id
// PUT /api/productos/:id (con posibilidad de nueva imagen)
router.put("/:id", upload.single("imagen"), (req: Request, res: Response): void => {
  const productos: Producto[] = leerExcel(PRODUCTOS_FILE);
  const id = Number(req.params.id);
  const idx = productos.findIndex((p) => p.id === id);

  if (idx === -1) {
    res.status(404).send("Producto no encontrado");
    return;
  }

  const { nombre, categoria, precio, costo, stock } = req.body;
  const imagen = req.file?.filename;

  productos[idx] = {
    ...productos[idx],
    nombre: nombre || productos[idx].nombre,
    categoria: categoria !== undefined ? categoria : productos[idx].categoria,
    precio: Number(precio),
    costo: Number(costo),
    stock: Number(stock),
    imagen: imagen || productos[idx].imagen, // conserva la anterior si no se sube nueva
  };

  guardarExcel(PRODUCTOS_FILE, productos);
  res.json({ ok: true });
});

// DELETE /api/productos/:id
router.delete("/:id", (req: Request, res: Response) => {
  const productos: Producto[] = leerExcel(PRODUCTOS_FILE);
  const id = Number(req.params.id);

  const nuevos = productos.filter((p) => p.id !== id);

  if (nuevos.length === productos.length) {
    res.status(404).send("Producto no encontrado");
    return;
  }

  guardarExcel(PRODUCTOS_FILE, nuevos);
  res.json({ ok: true });
});

// GET /api/productos/:id
router.get('/:id', (req: Request, res: Response) => {
  const productos: Producto[] = leerExcel(PRODUCTOS_FILE);
  const id = Number(req.params.id);

  const producto = productos.find(p => p.id === id);

  if (!producto) {
    res.status(404).send("Producto no encontrado");
    return;
  }

  res.json(producto);
});


export default router;