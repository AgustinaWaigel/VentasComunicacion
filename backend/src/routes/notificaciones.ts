import express, { Request, Response } from 'express';
import webpush from 'web-push';
import prisma from '../utils/prismaClient';

const router = express.Router();

// Configurar web-push con claves públicas/privadas desde variables de entorno
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'test-public-key';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'test-private-key';

if (vapidPublicKey && vapidPrivateKey && vapidPublicKey !== 'test-public-key') {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface Notificacion {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

// Almacenar suscripciones en memoria (en producción usar base de datos)
let subscripciones: any[] = [];

// POST /api/notificaciones/suscribir - Guardar suscripción del navegador
router.post('/suscribir', async (req: Request, res: Response) => {
  try {
    const subscription = req.body;

    if (!subscription.endpoint) {
      res.status(400).json({ error: 'Suscripción inválida' });
      return;
    }

    // Guardar en base de datos
    const suscripcion = await prisma.suscripcionPush.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    // Mantener también en memoria para el webhook
    if (!subscripciones.some(s => s.endpoint === subscription.endpoint)) {
      subscripciones.push(subscription);
    }

    res.json({ status: 'suscrito', id: suscripcion.id });
  } catch (error) {
    console.error('Error al suscribir:', error);
    res.status(500).json({ error: 'Error al suscribir a notificaciones' });
  }
});

// POST /api/notificaciones/probar - Enviar notificación de prueba (para debugging)
router.post('/probar', async (req: Request, res: Response) => {
  try {
    const notificacion: Notificacion = {
      title: '🔔 Notificación de Prueba',
      body: 'Si ves esto, las notificaciones funcionan correctamente',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
    };

    await enviarNotificacionesAAdmins(notificacion);

    res.json({ status: 'notificaciones enviadas' });
  } catch (error) {
    console.error('Error al enviar notificación de prueba:', error);
    res.status(500).json({ error: 'Error al enviar notificación' });
  }
});

// POST /api/notificaciones/desuscribir
router.post('/desuscribir', async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint requerido' });
      return;
    }

    await prisma.suscripcionPush.delete({
      where: { endpoint },
    });

    subscripciones = subscripciones.filter(s => s.endpoint !== endpoint);

    res.json({ status: 'desuscrito' });
  } catch (error) {
    console.error('Error al desuscribir:', error);
    res.status(500).json({ error: 'Error al desuscribir' });
  }
});

// Función para enviar notificaciones a todos los administradores
export async function enviarNotificacionesAAdmins(notificacion: Notificacion) {
  try {
    // Obtener todas las suscripciones de la base de datos
    const suscripciones = await prisma.suscripcionPush.findMany();

    if (suscripciones.length === 0) {
      console.log('No hay administradores suscritos para notificaciones');
      return;
    }

    const promesas = suscripciones.map(async (suscripcion) => {
      try {
        const pushSubscription = {
          endpoint: suscripcion.endpoint,
          keys: {
            auth: suscripcion.auth,
            p256dh: suscripcion.p256dh,
          },
        };

        await webpush.sendNotification(
          pushSubscription as any,
          JSON.stringify({
            title: notificacion.title,
            options: {
              body: notificacion.body,
              icon: notificacion.icon || '/icon-192x192.png',
              badge: notificacion.badge || '/badge-72x72.png',
              tag: notificacion.tag || 'default',
              requireInteraction: false,
              vibrate: [200, 100, 200],
            },
          })
        );
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Suscripción expirada, eliminarla
          await prisma.suscripcionPush.delete({
            where: { endpoint: suscripcion.endpoint },
          });
        } else {
          console.error('Error enviando notificación a:', suscripcion.endpoint, error);
        }
      }
    });

    await Promise.all(promesas);
  } catch (error) {
    console.error('Error enviando notificaciones a admins:', error);
  }
}

// Función para notificar sobre un nuevo pedido pagado
export async function notificarPedidoPagado(venta: any) {
  const notificacion: Notificacion = {
    title: '🎉 ¡Nuevo Pedido Pagado!',
    body: `Pedido #${venta.id} de $${venta.total} - Cliente: ${venta.clienteNombre}`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: `pedido-${venta.id}`,
  };

  await enviarNotificacionesAAdmins(notificacion);
}

// GET /api/notificaciones/vapid-public-key - Obtener la clave pública VAPID para el cliente
router.get('/vapid-public-key', (req: Request, res: Response) => {
  res.json({ publicKey: vapidPublicKey });
});

export default router;
