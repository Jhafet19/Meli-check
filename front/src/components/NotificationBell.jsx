import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isOnline } from '../db/db';
import api from '../services/api';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [offline, setOffline] = useState(!isOnline());

  // Detectar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      // Recargar notificaciones cuando vuelve la conexión
      if (user?.id) {
        loadNotifications();
        loadUnreadCount();
      }
    };
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Cargar notificaciones al montar
  useEffect(() => {
    if (user?.id && !offline) {
      loadNotifications();
      loadUnreadCount();

      // Escuchar nuevas notificaciones
      const handleNewNotification = () => {
        console.log('📬 Nueva notificación recibida, refrescando...');
        if (!offline) {
          loadNotifications();
          loadUnreadCount();
        }
      };

      window.addEventListener('newNotification', handleNewNotification);

      // Actualizar cada 30 segundos (solo si está online)
      const interval = setInterval(() => {
        if (isOnline()) {
          loadNotifications();
          loadUnreadCount();
        }
      }, 30000);

      return () => {
        window.removeEventListener('newNotification', handleNewNotification);
        clearInterval(interval);
      };
    }
  }, [user, offline]);

  const loadNotifications = async () => {
    // No hacer nada si está offline
    if (!isOnline()) return;

    try {
      const response = await api.get(`/api/notifications/user/${user.id}`);
      if (response.data?.result) {
        setNotifications(response.data.result.slice(0, 10)); // Solo las últimas 10
      }
    } catch (error) {
      // Solo mostrar error si estamos online (para evitar spam en consola)
      if (isOnline()) {
        console.warn('⚠️ Error cargando notificaciones:', error.message);
      }
    }
  };

  const loadUnreadCount = async () => {
    // No hacer nada si está offline
    if (!isOnline()) return;

    try {
      const response = await api.get(`/api/notifications/user/${user.id}/unread/count`);
      if (response.data?.result !== undefined) {
        const newCount = response.data.result;

        // Si el contador aumentó, significa que hay nuevas notificaciones
        if (newCount > unreadCount) {
          console.log('🔔 Nuevas notificaciones detectadas! Disparando evento newNotification...');
          // Disparar evento para que AuthContext refresque los datos
          window.dispatchEvent(new CustomEvent('newNotification', {
            detail: { count: newCount }
          }));
        }

        setUnreadCount(newCount);
      }
    } catch (error) {
      // Solo mostrar error si estamos online (para evitar spam en consola)
      if (isOnline()) {
        console.warn('⚠️ Error cargando contador:', error.message);
      }
    }
  };

  const markAsRead = async (notificationId, notification) => {
    // No hacer nada si está offline
    if (!isOnline()) {
      console.warn('⚠️ Sin conexión - No se puede marcar como leída');
      return;
    }

    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      loadNotifications();
      loadUnreadCount();

      // Si la notificación es sobre una nueva asignación, refrescar datos
      if (notification?.title?.toLowerCase().includes('asignación') ||
          notification?.title?.toLowerCase().includes('asignacion') ||
          notification?.message?.toLowerCase().includes('asignación') ||
          notification?.message?.toLowerCase().includes('asignacion')) {
        console.log('🔔 Notificación de asignación detectada - Refrescando datos...');
        // Disparar evento para refrescar datos
        window.dispatchEvent(new CustomEvent('newNotification', {
          detail: { type: 'assignment', notification }
        }));
      }
    } catch (error) {
      console.warn('⚠️ Error marcando como leída:', error.message);
    }
  };

  const markAllAsRead = async () => {
    // No hacer nada si está offline
    if (!isOnline()) {
      console.warn('⚠️ Sin conexión - No se puede marcar todas como leídas');
      return;
    }

    try {
      await api.put(`/api/notifications/user/${user.id}/read-all`);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.warn('⚠️ Error marcando todas como leídas:', error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${days} días`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Botón de campana */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {showDropdown && (
        <>
          {/* Overlay para cerrar al hacer click afuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Panel de notificaciones */}
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No tienes notificaciones
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id, notification);
                      }
                    }}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;