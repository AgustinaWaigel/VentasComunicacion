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
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const router = (0, express_1.Router)();
// Obtener todos los eventos
router.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventos = yield prismaClient_1.default.evento.findMany({ orderBy: { id: 'desc' } });
        res.json(eventos);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener eventos' });
    }
}));
// Crear un nuevo evento
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nombre, fecha, descripcion } = req.body;
        if (!nombre || !fecha) {
            res.status(400).json({ error: 'Nombre y fecha son requeridos' });
            return;
        }
        const nuevo = yield prismaClient_1.default.evento.create({
            data: { nombre, fecha, descripcion: descripcion || '', activo: true },
        });
        res.status(201).json(nuevo);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear evento' });
    }
}));
// Actualizar un evento
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const { nombre, fecha, descripcion, activo } = req.body;
        const actualizado = yield prismaClient_1.default.evento.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign({}, (nombre !== undefined && { nombre })), (fecha !== undefined && { fecha })), (descripcion !== undefined && { descripcion })), (activo !== undefined && { activo })),
        });
        res.json(actualizado);
    }
    catch (error) {
        res.status(404).json({ error: 'Evento no encontrado' });
    }
}));
// Eliminar un evento (marcar como inactivo)
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        yield prismaClient_1.default.evento.update({ where: { id }, data: { activo: false } });
        res.json({ mensaje: 'Evento desactivado correctamente' });
    }
    catch (error) {
        res.status(404).json({ error: 'Evento no encontrado' });
    }
}));
// Estadísticas campamento (ventas sin evento)
router.get('/campamento/estadisticas', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ventas = yield prismaClient_1.default.venta.findMany({
            where: { eventoId: null },
            include: { detalles: { include: { producto: true } } },
        });
        const totalVentas = ventas.length;
        const ingresosTotales = ventas.reduce((sum, v) => sum + v.total, 0);
        const gananciaTotales = ventas.reduce((sum, v) => sum + v.ganancia, 0);
        const conteo = {};
        for (const v of ventas) {
            for (const d of v.detalles) {
                if (!conteo[d.productoId])
                    conteo[d.productoId] = { nombre: (_b = (_a = d.producto) === null || _a === void 0 ? void 0 : _a.nombre) !== null && _b !== void 0 ? _b : 'Producto', cantidad: 0, subtotal: 0, ganancia: 0 };
                conteo[d.productoId].cantidad += d.cantidad;
                conteo[d.productoId].subtotal += d.subtotal;
                conteo[d.productoId].ganancia += d.ganancia;
            }
        }
        const topProductos = Object.entries(conteo)
            .map(([id, data]) => (Object.assign({ producto_id: Number(id) }, data)))
            .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
        res.json({ totalVentas, ingresosTotales, gananciaTotales, topProductos });
    }
    catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
// Estadísticas de un evento específico
router.get('/:id/estadisticas', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const eventoId = Number(req.params.id);
        const ventas = yield prismaClient_1.default.venta.findMany({
            where: { eventoId },
            include: { detalles: { include: { producto: true } } },
        });
        const totalVentas = ventas.length;
        const ingresosTotales = ventas.reduce((sum, v) => sum + v.total, 0);
        const gananciaTotales = ventas.reduce((sum, v) => sum + v.ganancia, 0);
        const conteo = {};
        for (const v of ventas) {
            for (const d of v.detalles) {
                if (!conteo[d.productoId])
                    conteo[d.productoId] = { nombre: (_b = (_a = d.producto) === null || _a === void 0 ? void 0 : _a.nombre) !== null && _b !== void 0 ? _b : 'Producto', cantidad: 0, subtotal: 0, ganancia: 0 };
                conteo[d.productoId].cantidad += d.cantidad;
                conteo[d.productoId].subtotal += d.subtotal;
                conteo[d.productoId].ganancia += d.ganancia;
            }
        }
        const topProductos = Object.entries(conteo)
            .map(([id, data]) => (Object.assign({ producto_id: Number(id) }, data)))
            .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
        res.json({ totalVentas, ingresosTotales, gananciaTotales, topProductos });
    }
    catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
exports.default = router;
