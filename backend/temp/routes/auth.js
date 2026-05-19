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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';
// Login endpoint
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prismaClient_1.default.usuario.findUnique({
            where: { email }
        });
        if (!user) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, rol: user.rol }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                rol: user.rol
            }
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
}));
// Endpoint para crear el primer administrador si no existe ninguno
router.post('/setup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userCount = yield prismaClient_1.default.usuario.count();
        if (userCount > 0) {
            res.status(400).json({ error: 'El sistema ya está inicializado' });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash('admin123', 10);
        const admin = yield prismaClient_1.default.usuario.create({
            data: {
                email: 'admin@ventas.com',
                password: hashedPassword,
                rol: 'admin'
            }
        });
        res.json({ message: 'Administrador creado correctamente', email: admin.email });
    }
    catch (error) {
        console.error('Error en setup:', error);
        res.status(500).json({ error: 'Error al crear administrador' });
    }
}));
exports.default = router;
