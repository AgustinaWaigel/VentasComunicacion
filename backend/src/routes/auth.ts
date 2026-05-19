import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prismaClient';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Endpoint para crear el primer administrador si no existe ninguno
router.post('/setup', async (req, res) => {
  try {
    const userCount = await prisma.usuario.count();
    
    if (userCount > 0) {
      res.status(400).json({ error: 'El sistema ya está inicializado' });
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.usuario.create({
      data: {
        email: 'admin@ventas.com',
        password: hashedPassword,
        rol: 'admin'
      }
    });

    res.json({ message: 'Administrador creado correctamente', email: admin.email });
  } catch (error) {
    console.error('Error en setup:', error);
    res.status(500).json({ error: 'Error al crear administrador' });
  }
});

export default router;
