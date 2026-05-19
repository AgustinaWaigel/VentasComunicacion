// Service Worker para notificaciones push y caché

const CACHE_NAME = 'ventas-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Instalar el Service Worker y cachear recursos
self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        // Intentar cachear URLs, pero no fallar si alguna no está disponible
        return Promise.allSettled(
          urlsToCache.map(url =>
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {
                console.log(`No se pudo cachear: ${url}`);
              })
          )
        );
      })
      .catch((err) => console.log('Error al abrir cache:', err))
  );
  self.skipWaiting();
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  // Ignorar rutas de API en tiempo real
  if (event.request.url.includes('/api/pagos/webhook') ||
      event.request.url.includes('/api/notificaciones/webhook')) {
    return;
  }

  // Estrategia: Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear respuestas exitosas de GET
        if (event.request.method === 'GET' && response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si la red no funciona, intentar desde cache
        return caches.match(event.request)
          .then((response) => {
            return response || new Response('Offline - No hay contenido en caché', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('Push notification recibida:', event);

  if (!event.data) {
    console.log('Push recibido sin datos');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch {
    notificationData = {
      title: 'Nueva Notificación',
      options: {
        body: event.data.text(),
      },
    };
  }

  const { title, options } = notificationData;

  event.waitUntil(
    self.registration.showNotification(title, {
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/badge-72x72.png',
      tag: options.tag || 'default',
      body: options.body || '',
      vibrate: options.vibrate || [200, 100, 200],
      requireInteraction: options.requireInteraction || false,
      actions: [
        {
          action: 'open',
          title: 'Abrir',
        },
        {
          action: 'close',
          title: 'Cerrar',
        },
      ],
      ...options,
    })
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Abrir la app cuando hagas click en la notificación
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, focusarla
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('Notificación cerrada:', event.notification.tag);
});

// Sincronización en segundo plano (cuando regrese la conexión)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(
      fetch('/api/sync')
        .then(() => console.log('Sincronización completada'))
        .catch(() => console.log('Error en sincronización'))
    );
  }
});
