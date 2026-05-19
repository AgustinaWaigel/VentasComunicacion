"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const productos_1 = __importDefault(require("./routes/productos"));
const ventas_1 = __importDefault(require("./routes/ventas"));
const eventos_1 = __importDefault(require("./routes/eventos"));
const auth_1 = __importDefault(require("./routes/auth"));
const prismaClient_1 = __importDefault(require("./utils/prismaClient"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
    res.send("El backend funciona correctamente 🚀");
});
// CORS explícito para evitar bloqueos en navegadores con frontend en Vercel.
const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://ventas-comu.vercel.app',
]);
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) {
        next();
        return;
    }
    let hostname = '';
    try {
        hostname = new URL(origin).hostname;
    }
    catch (_a) {
        hostname = '';
    }
    const isAllowed = allowedOrigins.has(origin) ||
        /\.vercel\.app$/.test(hostname) ||
        /\.onrender\.com$/.test(hostname) ||
        /\.netlify\.app$/.test(hostname);
    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    }
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
});
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/productos', productos_1.default);
app.use('/api/ventas', ventas_1.default);
app.use('/api/eventos', eventos_1.default);
app.use('/api/auth', auth_1.default);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Conectar Prisma y arrancar servidor
prismaClient_1.default.$connect()
    .then(() => {
    console.log('✅ Conectado a la base de datos PostgreSQL');
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
})
    .catch((err) => {
    console.error('❌ Error al conectar con la base de datos:', err);
    process.exit(1);
});
