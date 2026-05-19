import 'dotenv/config';
import express from 'express';
import path from 'path';
import productosRouter from './routes/productos';
import ventasRouter from './routes/ventas';
import eventosRouter from './routes/eventos';
import authRouter from './routes/auth';
import pagosRouter from './routes/pagos';
import notificacionesRouter from './routes/notificaciones';

import prisma from './utils/prismaClient';

const app = express();
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
  } catch {
    hostname = '';
  }

  const isAllowed =
    allowedOrigins.has(origin) ||
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/productos', productosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/auth', authRouter);
app.use('/api/pagos', pagosRouter);
app.use('/api/notificaciones', notificacionesRouter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Conectar Prisma y arrancar servidor
prisma.$connect()
  .then(() => {
    console.log('✅ Conectado a la base de datos PostgreSQL');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error('❌ Error al conectar con la base de datos:', err);
    process.exit(1);
  });
