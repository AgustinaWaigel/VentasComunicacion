import express, { Request, Response } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import prisma from '../utils/prismaClient';
import { notificarPedidoPagado } from './notificaciones';

const router = express.Router();

// Configurar Mercado Pago con el access token desde variables de entorno
const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-123456789', // Reemplazar con token real
});

const preferenceClient = new Preference(mpConfig);

// POST /api/pagos/crear - Crear preferencia de pago para el carrito
router.post('/crear', async (req: Request, res: Response) => {
  try {
    const { items, clienteNombre, clienteTelefono, clienteDireccion, tipoEntrega } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'El carrito está vacío' });
      return;
    }

    if (!clienteNombre || !clienteTelefono) {
      res.status(400).json({ error: 'Faltan datos del cliente' });
      return;
    }

    // Calcular total desde items
    const total = items.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0);

    // Crear la preferencia de Mercado Pago
    const preference = await preferenceClient.create({
      body: {
        items: items.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        payer: {
          name: clienteNombre,
          phone: {
            area_code: '54', // Argentina por defecto
            number: clienteTelefono.replace(/\D/g, ''),
          },
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago-exitoso`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago-fallido`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago-pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.API_URL || 'http://localhost:5000'}/api/pagos/webhook`,
      },
    });

    // Guardar la venta en estado "pendiente_pago"
    const venta = await prisma.venta.create({
      data: {
        total: total,
        metodoPago: 'mercado_pago',
        estado: 'pendiente_pago',
        clienteNombre,
        clienteTelefono,
        clienteDireccion: clienteDireccion || null,
        tipoEntrega: tipoEntrega || 'retiro',
        mpPreferenceId: preference.id,
        detalles: {
          createMany: {
            data: items.map((item: any) => ({
              productoId: item.product_id,
              cantidad: item.quantity,
              subtotal: item.unit_price * item.quantity,
              ganancia: 0,
            })),
          },
        },
      },
    });

    res.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      ventaId: venta.id,
    });
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    res.status(500).json({ error: 'No se pudo crear el pago' });
  }
});

// POST /api/pagos/webhook - Webhook de Mercado Pago (confirmación de pago)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    // Verificar que sea un evento de pago
    if (type !== 'payment') {
      res.status(200).json({ status: 'received' });
      return;
    }

    const paymentId = data.id;

    // Obtener detalles del pago de Mercado Pago
    const paymentClient = new Payment(mpConfig);
    const payment = await paymentClient.get({
      id: paymentId,
    });

    // Verificar que el pago fue aprobado
    if (payment.status !== 'approved') {
      console.log(`Pago ${paymentId} no aprobado:`, payment.status);
      res.status(200).json({ status: 'received' });
      return;
    }

    // Buscar la venta por preferenceId
    const venta = await prisma.venta.findFirst({
      where: {
        mpPreferenceId: (payment as any).preference_id || '',
      },
    });

    if (!venta) {
      console.log('No se encontró venta para preferenceId:', ((payment as any).preference_id));
      res.status(200).json({ status: 'received' });
      return;
    }

    // Actualizar la venta a estado "preparando"
    const ventaActualizada = await prisma.venta.update({
      where: { id: venta.id },
      data: {
        estado: 'preparando',
        mpPaymentId: paymentId.toString(),
      },
      include: {
        detalles: true,
      },
    });

    // Enviar notificación a los administradores
    await notificarPedidoPagado(ventaActualizada);

    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Error en webhook de Mercado Pago:', error);
    // Siempre devolver 200 a Mercado Pago para evitar reintentos
    res.status(200).json({ status: 'received' });
  }
});

// GET /api/pagos/estado/:ventaId - Obtener estado del pedido
router.get('/estado/:ventaId', async (req: Request, res: Response) => {
  try {
    const ventaId = parseInt(req.params.ventaId);
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: { detalles: true },
    });

    if (!venta) {
      res.status(404).json({ error: 'Venta no encontrada' });
      return;
    }

    res.json({
      id: venta.id,
      estado: venta.estado,
      clienteNombre: venta.clienteNombre,
      total: venta.total,
      tipoEntrega: venta.tipoEntrega,
    });
  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({ error: 'Error al obtener estado del pedido' });
  }
});

export default router;
