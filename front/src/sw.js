/// <reference lib="webworker" />

// Importar Firebase primero (debe ir antes que Workbox)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ==========================================
// PARTE 1: PWA - Workbox (caché y offline)
// ==========================================

// Esta parte será inyectada por VitePWA automáticamente
// usando la estrategia injectManifest

// ==========================================
// PARTE 2: Firebase Cloud Messaging (push notifications)
// ==========================================

// Configuración de Firebase (misma que en firebase-config.js)
const firebaseConfig = {
  apiKey: "AIzaSyCQ4zmGyhXAc-xSh3nPujfeg9eEAfiPfV4",
  authDomain: "cygdp-7c00f.firebaseapp.com",
  projectId: "cygdp-7c00f",
  storageBucket: "cygdp-7c00f.firebasestorage.app",
  messagingSenderId: "966588180784",
  appId: "1:966588180784:web:1de673a345d89bfcad00f5"
};

// Inicializar Firebase en el Service Worker
console.log('🔥 [SW] Inicializando Firebase en Service Worker...');
firebase.initializeApp(firebaseConfig);

// Obtener instancia de messaging
const messaging = firebase.messaging();
console.log('✅ [SW] Firebase Messaging inicializado en Service Worker');

// Manejar notificaciones cuando la app está en BACKGROUND o CERRADA
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Notificación recibida en BACKGROUND:', payload);

  const notificationTitle = payload.notification?.title || 'MeliCheck';
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data,
    requireInteraction: true,
    tag: payload.data?.type || 'notification',
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-192x192.png'
      }
    ]
  };

  console.log('🔔 [SW] Mostrando notificación:', notificationTitle);

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clicks en las notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('🖱 [SW] Click en notificación:', event.notification.tag);

  event.notification.close();

  if (event.action === 'close') {
    console.log('❌ [SW] Usuario cerró la notificación');
    return;
  }

  // Abrir o enfocar la ventana de la app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('🪟 [SW] Enfocando ventana existente');
            return client.focus();
          }
        }

        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          console.log('🆕 [SW] Abriendo nueva ventana');
          return clients.openWindow('/');
        }
      })
  );
});

console.log('✅ [SW] Service Worker con Firebase Messaging y Workbox cargado correctamente');