import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Lock, Mail } from 'lucide-react';
import { messaging, VAPID_KEY, getToken } from '../config/firebase-config';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const requestNotificationPermission = async () => {
    try {
      // Verificar si el navegador soporta notificaciones
      if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return null;
      }

      // Verificar si messaging está disponible
      if (!messaging) {
        console.log('Firebase Messaging no está disponible');
        return null;
      }

      // Solicitar permiso de notificaciones
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('Permiso de notificaciones concedido');

        // Registrar el Service Worker de Firebase
        if ('serviceWorker' in navigator) {
          try {
            console.log('📝 Registrando firebase-messaging-sw.js...');
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/'
            });
            console.log('✅ Service Worker registrado:', registration.scope);

            // Esperar a que esté activo
            await navigator.serviceWorker.ready;
            console.log('✅ Service Worker está listo');
          } catch (swError) {
            console.error('❌ Error registrando Service Worker:', swError);
          }
        }

        // Intentar obtener token FCM con manejo de errores mejorado
        try {
          const fcmToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: await navigator.serviceWorker.ready
          });

          if (fcmToken) {
            console.log('Token FCM obtenido:', fcmToken);

            // Guardar el token en el backend
            try {
              await api.post('/api/users/fcm-token', { fcmToken });
              console.log('Token FCM guardado en el servidor');
            } catch (error) {
              console.error('Error al guardar token FCM en el servidor:', error);
            }

            return fcmToken;
          } else {
            console.log('No se pudo obtener el token FCM');
            return null;
          }
        } catch (tokenError) {
          console.error('Error obteniendo token FCM:', tokenError);
          console.warn('Continuando sin notificaciones push...');
          // No bloquear el login si falla Firebase
          return null;
        }
      } else {
        console.log('Permiso de notificaciones denegado');
        return null;
      }
    } catch (error) {
      console.error('Error solicitando permiso de notificaciones:', error);
      console.warn('Continuando sin notificaciones push...');
      // No bloquear el login si falla
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Llamamos al login del AuthContext
    const result = await login(email, password);

    if (result.success) {
      console.log("✅ Login Exitoso. Rol recibido:", result.role);

      // Solicitar permiso de notificaciones después del login exitoso
      await requestNotificationPermission();

      // Normalizamos el rol para evitar errores de mayúsculas/minúsculas/espacios
      // Convertimos a String por si viene null o undefined, luego a mayúsculas y quitamos espacios
      const roleStr = String(result.role).toUpperCase().trim();

      // Validación robusta:
      // Si es "ADMIN", "ROLE_ADMIN", "ADMINISTRADOR", etc., entrará aquí.
      if (roleStr === 'ADMIN' || roleStr.includes('ADMIN')) {
        console.log("➡ Redirigiendo a Panel Administrador...");
        navigate('/admin/dashboard');
      } else {
        console.log("➡ Redirigiendo a App Repartidor...");
        navigate('/dealer/home');
      }
    } else {
      console.error("❌ Error en Login:", result.message);
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">MeliCheck</h2>
          <p className="text-gray-500 text-sm">Acceso Operaciones</p>
        </div>

        {/* Mensaje de Error Visual */}
        {error && (
          <div className="mb-4 bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-200 text-center font-medium">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="usuario@meli.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition-all 
              ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'}`}
          >
            {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Solo personal autorizado.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;