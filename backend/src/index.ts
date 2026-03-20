import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import productosRouter from './routes/productos';
import ventasRouter from './routes/ventas';
import eventosRouter from './routes/eventos';
import prisma from './utils/prismaClient';

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("El backend funciona correctamente 🚀");
});

// Configuración CORS para desarrollo y producción
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://ventas-comu.vercel.app',
    ];
    const allowedHostPatterns = [
      /\.vercel\.app$/,
      /\.onrender\.com$/,
      /\.netlify\.app$/,
    ];

    let hostname = '';
    if (origin) {
      try {
        hostname = new URL(origin).hostname;
      } catch {
        hostname = '';
      }
    }

    const isAllowedByHost = hostname
      ? allowedHostPatterns.some((p) => p.test(hostname))
      : false;

    if (!origin || allowed.includes(origin) || isAllowedByHost) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/productos', productosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/eventos', eventosRouter);
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
