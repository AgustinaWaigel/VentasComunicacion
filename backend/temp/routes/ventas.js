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
// GET /api/ventas
router.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ventas = yield prismaClient_1.default.venta.findMany({
            orderBy: { fecha: 'desc' },
            include: {
                evento: true,
                detalles: {
                    include: { producto: true },
                },
            },
        });
        const resultado = ventas.map((v) => {
            var _a, _b, _c, _d;
            return ({
                id: v.id,
                fecha: v.fecha.toISOString(),
                total: v.total,
                ganancia: v.ganancia,
                metodoPago: v.metodoPago,
                efectivo: v.efectivo,
                debe: v.debe,
                evento_id: v.eventoId,
                evento_nombre: (_b = (_a = v.evento) === null || _a === void 0 ? void 0 : _a.nombre) !== null && _b !== void 0 ? _b : 'General',
                evento_fecha: (_d = (_c = v.evento) === null || _c === void 0 ? void 0 : _c.fecha) !== null && _d !== void 0 ? _d : null,
                detalles: v.detalles.map((d) => {
                    var _a, _b;
                    return ({
                        id: d.id,
                        venta_id: d.ventaId,
                        producto_id: d.productoId,
                        cantidad: d.cantidad,
                        subtotal: d.subtotal,
                        ganancia: d.ganancia,
                        nombre: (_b = (_a = d.producto) === null || _a === void 0 ? void 0 : _a.nombre) !== null && _b !== void 0 ? _b : 'Desconocido',
                    });
                }),
            });
        });
        res.json(resultado);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener ventas' });
    }
}));
// POST /api/ventas
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { items, metodoPago, efectivo, debe, evento_id } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).send('Venta vacia o malformateada');
            return;
        }
        let total = 0;
        let gananciaTotal = 0;
        for (const item of items) {
            const prod = yield prismaClient_1.default.producto.findUnique({ where: { id: item.producto_id } });
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
        }
        const nuevaVenta = yield prismaClient_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const venta = yield tx.venta.create({
                data: {
                    total,
                    ganancia: gananciaTotal,
                    metodoPago: metodoPago !== null && metodoPago !== void 0 ? metodoPago : 'efectivo',
                    efectivo: efectivo ? Number(efectivo) : 0,
                    debe: debe !== null && debe !== void 0 ? debe : false,
                    eventoId: evento_id ? Number(evento_id) : null,
                    detalles: {
                        create: items.map((item) => ({
                            productoId: item.producto_id,
                            cantidad: item.cantidad,
                            subtotal: item.subtotal,
                            ganancia: item.ganancia,
                        })),
                    },
                },
            });
            for (const item of items) {
                yield tx.producto.update({
                    where: { id: item.producto_id },
                    data: { stock: { decrement: item.cantidad } },
                });
            }
            return venta;
        }));
        res.status(201).json({ ok: true, ventaId: nuevaVenta.id });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar la venta' });
    }
}));
// DELETE /api/ventas/:id
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'ID invalido' });
            return;
        }
        const venta = yield prismaClient_1.default.venta.findUnique({
            where: { id },
            include: { detalles: true },
        });
        if (!venta) {
            res.status(404).json({ error: 'Venta no encontrada' });
            return;
        }
        yield prismaClient_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            for (const det of venta.detalles) {
                yield tx.producto.update({
                    where: { id: det.productoId },
                    data: { stock: { increment: det.cantidad } },
                });
            }
            yield tx.venta.delete({ where: { id } });
        }));
        res.json({ mensaje: 'Venta eliminada correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar la venta' });
    }
}));
// PUT /api/ventas/:id
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'ID invalido' });
            return;
        }
        const { metodoPago, efectivo, debe } = req.body;
        const actualizada = yield prismaClient_1.default.venta.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign({}, (metodoPago !== undefined && { metodoPago })), (efectivo !== undefined && { efectivo: Number(efectivo) })), (debe !== undefined && { debe })),
        });
        res.json(actualizada);
    }
    catch (error) {
        res.status(404).json({ error: 'Venta no encontrada' });
    }
}));
// GET /api/ventas/campamento-adolescentes/estadisticas
router.get('/campamento-adolescentes/estadisticas', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                if (!conteo[d.productoId]) {
                    conteo[d.productoId] = { nombre: (_b = (_a = d.producto) === null || _a === void 0 ? void 0 : _a.nombre) !== null && _b !== void 0 ? _b : `Producto ${d.productoId}`, cantidad: 0, subtotal: 0, ganancia: 0 };
                }
                conteo[d.productoId].cantidad += d.cantidad;
                conteo[d.productoId].subtotal += d.subtotal;
                conteo[d.productoId].ganancia += d.ganancia;
            }
        }
        const topProductos = Object.entries(conteo)
            .map(([id, data]) => (Object.assign({ producto_id: Number(id) }, data)))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);
        res.json({ totalVentas, ingresosTotales, gananciaTotales, topProductos });
    }
    catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
exports.default = router;
