import { useEffect } from 'react';
import { messaging, onMessage } from '../config/firebase-config';

const NotificationListener = ({ onNotificationReceived }) => {
  useEffect(() => {
    console.log('🔔 NotificationListener montado');
    console.log('🔔 Verificando messaging object:', messaging);
    console.log('🔔 Tipo de messaging:', typeof messaging);
    console.log('🔔 Messaging es null:', messaging === null);
    console.log('🔔 Messaging es undefined:', messaging === undefined);

    if (!messaging) {
      console.error('⚠ Firebase Messaging NO DISPONIBLE en NotificationListener');
      console.error('⚠ Esto significa que las notificaciones push NO funcionarán');
      console.error('⚠ Solo funcionarán las notificaciones in-app (polling)');
      console.error('⚠ Revisa los logs de firebase-config.js para ver por qué falló la inicialización');
      return;
    }

    console.log('✅ Firebase Messaging disponible, configurando listener...');

    // Escuchar notificaciones cuando la app está en foreground (abierta)
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('🎉 NOTIFICACIÓN RECIBIDA EN FOREGROUND:', payload);

      const { title, body } = payload.notification || {};
      console.log(`📬 Título: "${title}"`);
      console.log(`📝 Mensaje: "${body}"`);
      console.log(`📦 Data:, payload.data`);

      // Disparar evento para refrescar el componente de notificaciones
      if (onNotificationReceived) {
        onNotificationReceived(payload);
      }

      // Disparar evento personalizado para que NotificationBell se actualice
      window.dispatchEvent(new CustomEvent('newNotification', { detail: payload }));

      // Mostrar una notificación del navegador incluso cuando la app está abierta
      if (title && body) {
        // Verificar si hay permiso de notificaciones
        if (Notification.permission === 'granted') {
          console.log('✅ Mostrando notificación del navegador...');

          try {
            const notification = new Notification(title, {
              body: body,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              data: payload.data,
              requireInteraction: false,
              tag: payload.data?.type || 'notification'
            });

            notification.onclick = () => {
              console.log('🖱 Notificación clickeada');
              window.focus();
              notification.close();
            };

            console.log('✅ Notificación mostrada correctamente');
          } catch (error) {
            console.error('❌ Error mostrando notificación:', error);
          }
        } else {
          console.warn(`⚠ No se puede mostrar notificación. Permiso: ${Notification.permission}`);
        }

        // También log en consola para debugging
        console.log(`📬 ${title}: ${body}`);
      } else {
        console.warn('⚠ La notificación no tiene título o cuerpo:', { title, body });
      }
    });

    console.log('✅ Listener de notificaciones configurado correctamente');

    // Cleanup al desmontar el componente
    return () => {
      console.log('🔕 NotificationListener desmontado');
      unsubscribe();
    };
  }, []);

  // Este componente no renderiza nada, solo escucha notificaciones
  return null;
};

export default NotificationListener;