"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const prisma_1 = require("../../generated/prisma");
const router = (0, express_1.Router)();
const UPLOADS_FOLDER = path_1.default.join(__dirname, '../../uploads');
// Asegura la carpeta en entornos donde no se versionan directorios vacios (ej. Render)
if (!fs_1.default.existsSync(UPLOADS_FOLDER)) {
    fs_1.default.mkdirSync(UPLOADS_FOLDER, { recursive: true });
}
// Configuración de almacenamiento de imágenes con multer
const storage = multer_1.default.diskStorage({
    destination: UPLOADS_FOLDER,
    filename: (_req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({ storage });
// GET /api/productos
router.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productos = yield prismaClient_1.default.producto.findMany({ orderBy: { id: 'asc' } });
        res.json(productos);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
}));
// GET /api/productos/:id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const producto = yield prismaClient_1.default.producto.findUnique({ where: { id } });
        if (!producto) {
            res.status(404).send('Producto no encontrado');
            return;
        }
        res.json(producto);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener producto' });
    }
}));
// POST /api/productos (con imagen)
router.post('/', upload.single('imagen'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { nombre, categoria, precio, costo, stock } = req.body;
        const imagen = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        if (!nombre || precio == null || costo == null || stock == null) {
            res.status(400).json({ error: 'Faltan campos requeridos' });
            return;
        }
        const nuevo = yield prismaClient_1.default.producto.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
}));
// PUT /api/productos/:id
router.put('/:id', upload.single('imagen'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = Number(req.params.id);
        const { nombre, categoria, precio, costo, stock } = req.body;
        const imagen = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        const existente = yield prismaClient_1.default.producto.findUnique({ where: { id } });
        if (!existente) {
            res.status(404).send('Producto no encontrado');
            return;
        }
        const actualizado = yield prismaClient_1.default.producto.update({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
}));
// DELETE /api/productos/:id
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        yield prismaClient_1.default.producto.delete({ where: { id } });
        res.json({ ok: true });
    }
    catch (error) {
        if (error instanceof prisma_1.Prisma.PrismaClientKnownRequestError) {
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
}));
exports.default = router;
