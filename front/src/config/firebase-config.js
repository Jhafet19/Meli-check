import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCQ4zmGyhXAc-xSh3nPujfeg9eEAfiPfV4",
  authDomain: "cygdp-7c00f.firebaseapp.com",
  projectId: "cygdp-7c00f",
  storageBucket: "cygdp-7c00f.firebasestorage.app",
  messagingSenderId: "966588180784",
  appId: "1:966588180784:web:1de673a345d89bfcad00f5"
};

// VAPID Key (Web Push certificate)
const VAPID_KEY = "BMtujeVKTse-GL7Y4FkAdpAo_9oKdugmQERt3-0I48El-nPUc-5C44177OTotJzzVd2mHi0CJ6ENafvflp9Zn_Q";

console.log('🔥 Inicializando Firebase...');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase App inicializada');

// Inicializar Firebase Cloud Messaging
let messaging = null;

const initializeMessaging = () => {
  try {
    console.log('🔧 [PASO 1/5] Intentando inicializar Firebase Messaging...');

    console.log('🔧 [PASO 2/5] Verificando soporte del navegador...');
    console.log('  - Service Worker support:', 'serviceWorker' in navigator);
    console.log('  - Notification support:', 'Notification' in window);
    console.log('  - Protocol:', window.location.protocol);
    console.log('  - Hostname:', window.location.hostname);

    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service Workers no soportados en este navegador');
      return null;
    }

    if (!('Notification' in window)) {
      console.error('❌ Notificaciones no soportadas en este navegador');
      return null;
    }

    console.log('🔧 [PASO 3/5] Verificando Firebase App...');
    console.log('  - Firebase App inicializada:', app ? 'SÍ' : 'NO');
    console.log('  - Firebase App name:', app?.name);
    console.log('  - Firebase Project ID:', app?.options?.projectId);

    console.log('🔧 [PASO 4/5] Llamando a getMessaging()...');
    messaging = getMessaging(app);

    console.log('🔧 [PASO 5/5] Verificando objeto messaging...');
    console.log('  - Messaging object:', messaging);
    console.log('  - Messaging app:', messaging?.app);

    console.log('✅ Firebase Messaging inicializado correctamente');
    return messaging;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Messaging:', error);
    console.error('  - Error name:', error.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);
    return null;
  }
};

// Intentar inicializar messaging
messaging = initializeMessaging();

export { messaging, VAPID_KEY, getToken, onMessage, initializeMessaging };