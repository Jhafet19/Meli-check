import { useState, useEffect } from 'react';
import { messaging, VAPID_KEY, getToken, initializeMessaging } from '../config/firebase-config';

const FirebaseDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [swStatus, setSwStatus] = useState('Verificando...');
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const info = {};

    // 1. Verificar soporte del navegador
    info.serviceWorkerSupport = 'serviceWorker' in navigator;
    info.notificationSupport = 'Notification' in window;
    info.protocol = window.location.protocol;
    info.hostname = window.location.hostname;

    // 2. Verificar estado de messaging
    info.messagingAvailable = !!messaging;
    info.messagingType = typeof messaging;

    // 3. Verificar Service Workers registrados
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        info.serviceWorkersCount = registrations.length;
        info.serviceWorkers = registrations.map((reg, idx) => ({
          index: idx,
          scope: reg.scope,
          active: !!reg.active,
          installing: !!reg.installing,
          waiting: !!reg.waiting,
          updateViaCache: reg.updateViaCache,
          scriptURL: reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL
        }));

        // Verificar si firebase-messaging-sw está registrado
        const firebaseSW = registrations.find(reg =>
          reg.active?.scriptURL?.includes('firebase-messaging-sw')
        );
        info.firebaseSwRegistered = !!firebaseSW;

        setSwStatus(registrations.length > 0 ?
          `${registrations.length} Service Worker(s) registrado(s)` :
          'No hay Service Workers registrados'
        );
      } catch (error) {
        info.serviceWorkerError = error.message;
        setSwStatus('Error al verificar Service Workers');
      }
    }

    // 4. Verificar permisos de notificación
    if ('Notification' in window) {
      info.notificationPermission = Notification.permission;
    }

    // 5. Verificar VAPID Key
    info.vapidKeyConfigured = !!VAPID_KEY;
    info.vapidKeyLength = VAPID_KEY?.length;

    setDebugInfo(info);
  };

  const testFirebaseInit = async () => {
    setTestResult('Probando inicialización...');

    try {
      const msg = initializeMessaging();

      if (msg) {
        setTestResult('✅ Inicialización exitosa! Messaging object creado.');
      } else {
        setTestResult('❌ Inicialización falló. Revisa la consola para detalles.');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  const testGetToken = async () => {
    setTestResult('Intentando obtener token FCM...');

    if (!messaging) {
      setTestResult('❌ No se puede obtener token: messaging no disponible');
      return;
    }

    try {
      // Pedir permiso primero
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setTestResult('❌ Permiso de notificaciones denegado');
        return;
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      // Obtener token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        setTestResult(`✅ Token obtenido: ${token.substring(0, 20)}...`);
      } else {
        setTestResult('❌ No se pudo obtener token');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
      console.error('Error completo:', error);
    }
  };

  const unregisterAllSW = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        await registration.unregister();
      }

      setTestResult(`✅ ${registrations.length} Service Worker(s) desregistrado(s). RECARGA LA PÁGINA (F5) para que VitePWA registre el nuevo SW combinado.`);
      await runDiagnostics();
    } catch (error) {
      setTestResult(`❌ Error desregistrando: ${error.message}`);
    }
  };

  const forceReload = () => {
    window.location.reload(true);
  };

  const registerFirebaseSW = async () => {
    try {
      setTestResult('Registrando firebase-messaging-sw.js...');

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });

      await navigator.serviceWorker.ready;

      setTestResult(`✅ Firebase SW registrado en scope: ${registration.scope}`);
      await runDiagnostics();
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">🔍 Firebase Debug Console</h1>

          {/* Soporte del navegador */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Soporte del Navegador</h2>
            <div className="bg-gray-50 p-4 rounded space-y-1 text-sm font-mono">
              <p>Service Workers: {debugInfo.serviceWorkerSupport ? '✅' : '❌'}</p>
              <p>Notificaciones: {debugInfo.notificationSupport ? '✅' : '❌'}</p>
              <p>Protocolo: {debugInfo.protocol}</p>
              <p>Hostname: {debugInfo.hostname}</p>
              <p>Permiso Notificaciones: {debugInfo.notificationPermission}</p>
            </div>
          </div>

          {/* Estado de Firebase Messaging */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Estado de Firebase Messaging</h2>
            <div className="bg-gray-50 p-4 rounded space-y-1 text-sm font-mono">
              <p>Messaging disponible: {debugInfo.messagingAvailable ? '✅' : '❌'}</p>
              <p>Tipo: {debugInfo.messagingType}</p>
              <p>VAPID Key configurado: {debugInfo.vapidKeyConfigured ? '✅' : '❌'}</p>
              <p>VAPID Key length: {debugInfo.vapidKeyLength}</p>
            </div>
          </div>

          {/* Service Workers */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Service Workers ({swStatus})</h2>
            <div className="bg-gray-50 p-4 rounded space-y-2 text-sm font-mono">
              <p>Total: {debugInfo.serviceWorkersCount || 0}</p>
              <p>Firebase SW: {debugInfo.firebaseSwRegistered ? '✅' : '❌'}</p>

              {debugInfo.serviceWorkers && debugInfo.serviceWorkers.length > 0 && (
                <div className="mt-2 space-y-2">
                  {debugInfo.serviceWorkers.map((sw, idx) => (
                    <div key={idx} className="border-t pt-2">
                      <p className="font-bold">SW #{idx + 1}</p>
                      <p>Scope: {sw.scope}</p>
                      <p>Script: {sw.scriptURL}</p>
                      <p>Activo: {sw.active ? '✅' : '❌'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Acciones de prueba */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Pruebas</h2>
            <div className="space-y-2">
              <button
                onClick={testFirebaseInit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
              >
                🔄 Re-inicializar Firebase Messaging
              </button>

              <button
                onClick={testGetToken}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
              >
                🎫 Obtener Token FCM
              </button>

              <button
                onClick={registerFirebaseSW}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded w-full"
              >
                📝 Registrar Firebase Service Worker
              </button>

              <button
                onClick={unregisterAllSW}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded w-full"
              >
                🗑 Desregistrar TODOS los Service Workers
              </button>

              <button
                onClick={forceReload}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded w-full"
              >
                🔄 Recargar Página (Hard Reload)
              </button>

              <button
                onClick={runDiagnostics}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded w-full"
              >
                🔄 Refrescar Diagnósticos
              </button>
            </div>

            {testResult && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
                {testResult}
              </div>
            )}
          </div>

          {/* Logs de consola */}
          <div className="bg-gray-900 text-green-400 p-4 rounded text-xs font-mono">
            <p>💡 Revisa la consola del navegador (F12) para logs detallados</p>
            <p>💡 Los logs de firebase-config.js mostrarán el proceso de inicialización paso por paso</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseDebug;