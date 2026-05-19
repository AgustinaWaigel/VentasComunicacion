# 🚀 Guía de Configuración - E-commerce con Mercado Pago y PWA

Esta guía te ayudará a completar la configuración del sistema de e-commerce con pagos en línea, notificaciones push y soporte para instalación como aplicación.

## ✅ Estado de Implementación

Todos los archivos de código han sido creados. Ahora necesitas:

1. **Configurar Mercado Pago**
2. **Generar claves VAPID para notificaciones push**
3. **Aplicar cambios a la base de datos**
4. **Crear íconos para PWA**
5. **Probar el flujo completo**

---

## Paso 1: Configurar Mercado Pago

### 1.1 Obtener credenciales de prueba

1. Accede a [https://www.mercadopago.com/developers](https://www.mercadopago.com/developers)
2. Crea una cuenta o inicia sesión
3. Ve a **Credenciales** (en la sección de desarrolladores)
4. Busca tu **Access Token** de prueba (empieza con `APP_USR_TEST_`)
5. Copia el token

### 1.2 Actualizar el .env

En `backend/.env`:
```
MERCADO_PAGO_ACCESS_TOKEN="APP_USR_TEST_xxxxxxxxxxxxxxxxxxxx"
```

Reemplaza `xxxxxxxxxxxxxxxxxxxx` con tu token real.

### 1.3 Probar pagos

Para pruebas en Mercado Pago, usa estas tarjetas de prueba:
- **Tarjeta aprobada:** 4111 1111 1111 1111
- **Fecha:** 11/25
- **CVV:** 123

---

## Paso 2: Generar Claves VAPID para Web Push

### 2.1 Generar claves

1. Ve a [https://web-push-codelab.glitch.me/](https://web-push-codelab.glitch.me/)
2. Haz click en **Generate Keys**
3. Copia ambas claves (pública y privada)

### 2.2 Actualizar el .env

En `backend/.env`:
```
VAPID_PUBLIC_KEY="BC_TU_CLAVE_PUBLICA_AQUI"
VAPID_PRIVATE_KEY="TU_CLAVE_PRIVADA_AQUI"
VAPID_SUBJECT="mailto:tu-email@example.com"
```

---

## Paso 3: Aplicar Cambios a la Base de Datos

### 3.1 Verificación de Schema

El schema ya contiene todos los nuevos modelos:
- Campos extendidos en `Venta` (estado, clienteNombre, etc.)
- Nuevo modelo `SuscripcionPush`

### 3.2 Aplicar migraciones

En la carpeta del proyecto, ejecuta:

```bash
cd backend
npm run db:push
```

⚠️ **IMPORTANTE:** Si tienes problemas con Supabase (bloqueo de IP), conéctate usando datos compartidos desde tu celular.

---

## Paso 4: Crear Íconos para PWA

### 4.1 Generar íconos

Necesitas crear estos archivos PNG en la carpeta `public/`:

- `icon-72x72.png` (72x72 píxeles)
- `icon-96x96.png` (96x96 píxeles)
- `icon-128x128.png` (128x128 píxeles)
- `icon-144x144.png` (144x144 píxeles)
- `icon-152x152.png` (152x152 píxeles)
- `icon-192x192.png` (192x192 píxeles)
- `icon-384x384.png` (384x384 píxeles)
- `icon-512x512.png` (512x512 píxeles)
- `badge-72x72.png` (para notificaciones)
- `maskable-192x192.png` (versión recortada para algunos navegadores)
- `maskable-512x512.png` (versión recortada)

### 4.2 Generar rápidamente

Puedes usar herramientas online:
- [PWA Builder](https://www.pwabuilder.com/)
- [Real Favicon Generator](https://realfavicongenerator.net/)
- [Favicon-Generator](https://favicon-generator.org/)

Sube tu logo y descarga los íconos generados.

---

## Paso 5: Flujo de Prueba Completo

### 5.1 Iniciar el proyecto

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### 5.2 Flujo del Cliente

1. Abre [http://localhost:3000](http://localhost:3000)
2. Haz click en el ícono de carrito (arriba a la derecha)
3. Agrega 2-3 productos al carrito
4. Haz click en "Ir a Pagar"
5. Completa el formulario con:
   - Nombre: "Juan Pérez"
   - Teléfono: "+54 9 11 1234-5678"
   - Tipo: "Retiro en el local"
6. Haz click en "Pagar con Mercado Pago"
7. Se abrirá Mercado Pago (usa la tarjeta de prueba)
8. Después del pago, regresará a la app

### 5.3 Flujo del Administrador

1. Inicia sesión en `/login`
2. Ve a **Pedidos Web** en el menú
3. Deberías ver el pedido que creaste
4. Haz click en el pedido para expandir detalles
5. Marca el estado como "Preparando" → "Listo" → "Entregado"

### 5.4 Probar Notificaciones

1. En el panel de **Pedidos Web**, busca un botón para "Solicitar Notificaciones"
2. Autoriza las notificaciones en el navegador
3. Crea un nuevo pedido como cliente
4. El administrador debería recibir una notificación push inmediata

---

## Estructura de Archivos Creados

### Backend
```
backend/src/routes/
├── pagos.ts              # Rutas para crear pagos y webhooks
└── notificaciones.ts     # Rutas para suscripción a notificaciones
```

### Frontend
```
src/
├── context/
│   └── CartContext.tsx         # Estado global del carrito
├── components/
│   ├── CartSidebar.tsx         # Panel lateral del carrito
│   └── CartSidebar.css         # Estilos del carrito
├── pages/
│   ├── Checkout.tsx            # Página de checkout
│   └── admin/
│       └── Pedidos.tsx         # Panel de gestión de pedidos
└── utils/
    └── pushNotifications.ts    # Utility para notificaciones push

public/
├── sw.js                  # Service Worker
├── manifest.json          # Configuración PWA
└── [íconos PNG]           # Necesarios para instalar como app
```

---

## Problemas Comunes

### El webhook de Mercado Pago no funciona

**Causa:** Mercado Pago no puede acceder a tu servidor local.

**Solución:** 
1. Despliega a Vercel o Render
2. O usa ngrok para exponer tu localhost: `ngrok http 5000`
3. Actualiza la URL en Mercado Pago developers

### Las notificaciones push no funcionan

**Causa:** El navegador necesita HTTPS en producción.

**Solución:**
1. En desarrollo (localhost): Funciona sin HTTPS
2. En producción: Necesitas HTTPS

### No puedo instalar la app como PWA

**Causa:** Faltan íconos o el manifest está incompleto.

**Solución:**
1. Verifica que existan los archivos en `public/icon-*.png`
2. Revisa la consola del navegador para errores de manifest
3. Abre DevTools > Application > Manifest para verificar

---

## Checklist Final

- [ ] Obtuve token de Mercado Pago
- [ ] Generé claves VAPID
- [ ] Actualicé `.env` con las credenciales
- [ ] Ejecuté `npm run db:push` en el backend
- [ ] Creé íconos para PWA en `public/`
- [ ] Probé agregar productos al carrito
- [ ] Probé completar un pago
- [ ] Probé ver el pedido en el panel admin
- [ ] Solicité permiso de notificaciones
- [ ] Probé recibir una notificación (envía un pedido)
- [ ] Puedo instalar la app desde el navegador

---

## Next Steps (Opcional)

1. **Agregar costo de envío:** Modifica `Checkout.tsx` para agregar fee
2. **Enviar emails:** Integra SendGrid o Nodemailer
3. **Historial de notificaciones:** Guarda en BD
4. **App móvil nativa:** Usa Expo o Capacitor
5. **Analytics:** Integra Google Analytics o Mixpanel

---

## Soporte

Si necesitas ayuda:
1. Revisa los logs en `Terminal`
2. Abre DevTools (F12) para ver errores en consola
3. Verifica que todas las variables de entorno estén configuradas

¡Éxito! 🎉
