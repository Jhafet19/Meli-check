import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { db } from '../db/db';
import { setupAutoSync, syncAllDataToLocal, syncAllPendingData, preCacheAllDealerData } from '../services/syncService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    checkSession();

    // Configurar auto-sincronización al iniciar la app
    setupAutoSync();

    // Sincronizar datos pendientes al cargar (si hay conexión)
    if (navigator.onLine) {
      syncAllPendingData().catch(err => {
        console.error('Error en sincronización inicial:', err);
      });
    }

    // 🔄 LISTENER GLOBAL: Auto-sincronizar cuando vuelve la conexión
    const handleOnlineGlobal = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);

        // Solo auto-sincronizar para dealers
        if (userData.role === 'DEALER') {
          console.log('🌐 Conexión restaurada - Sincronizando nuevos datos del servidor...');

          try {
            // Sincronizar datos pendientes primero
            await syncAllPendingData();

            // Luego refrescar cache con datos actualizados del servidor
            await preCacheAllDealerData();

            console.log('✅ Sincronización automática completada - Datos actualizados');

            // Disparar evento personalizado para que los componentes se refresquen
            window.dispatchEvent(new CustomEvent('dataRefreshed'));
          } catch (error) {
            console.error('❌ Error en sincronización automática:', error);
          }
        }
      }
    };

    // 🔔 LISTENER GLOBAL: Auto-sincronizar cuando llega una notificación nueva
    const handleNewNotification = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);

        // Solo auto-sincronizar para dealers Y si está online
        if (userData.role === 'DEALER' && navigator.onLine) {
          console.log('🔔 Nueva notificación recibida - Refrescando datos en segundo plano...');

          try {
            // Refrescar cache con datos actualizados del servidor
            await preCacheAllDealerData();

            console.log('✅ Datos refrescados automáticamente - Nuevas visitas/asignaciones disponibles');

            // Disparar evento personalizado para que los componentes se refresquen
            window.dispatchEvent(new CustomEvent('dataRefreshed'));
          } catch (error) {
            console.error('❌ Error refrescando datos después de notificación:', error);
          }
        } else if (userData.role === 'DEALER' && !navigator.onLine) {
          console.log('📴 Nueva notificación recibida pero estás offline - Datos se sincronizarán cuando vuelvas online');
        }
      }
    };

    window.addEventListener('online', handleOnlineGlobal);
    window.addEventListener('newNotification', handleNewNotification);

    return () => {
      window.removeEventListener('online', handleOnlineGlobal);
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      console.log("🔥 RESPUESTA BACKEND:", response.data); 

      const { token, user: userDataFromBack } = response.data;

      if (!token) throw new Error("No se recibió token");

      // --- LOGICA DE DETECCIÓN DE ROL CORREGIDA ---
      let roleName = '';

      // 1. Buscamos el objeto del rol. 
      // IMPORTANTE: Tu backend manda "rol" (por getRol()) en vez de "role".
      const roleObj = userDataFromBack?.rol || userDataFromBack?.role || response.data.role;
      
      console.log("🧐 OBJETO ROL ENCONTRADO:", roleObj);

      if (roleObj) {
        if (typeof roleObj === 'string') {
          roleName = roleObj;
        } else if (typeof roleObj === 'object') {
          // 2. Buscamos el nombre del rol dentro del objeto.
          // Tu RoleEntity usa "roleEnum".
          roleName = roleObj.roleEnum || roleObj.name || roleObj.nombre || roleObj.authority;
        }
      }

      console.log("🎯 ROL STRING FINAL:", roleName);

      if (!roleName) {
        console.error("❌ ERROR CRÍTICO: No se pudo extraer el nombre del rol.");
        // Fallback temporal para que no te quedes bloqueado, pero revisa la consola
        roleName = 'DEALER'; 
      }

      const userToStore = {
        ...userDataFromBack,
        role: roleName, // Guardamos el string limpio (ADMIN o DEALER)
        token: token
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      try {
        await db.users.put({
          id: userToStore.id || email,
          name: userToStore.name || email,
          role: roleName,
          token: token
        });
      } catch (e) { console.warn(e); }

      setUser(userToStore);

      // Después de login exitoso, PRE-CACHEAR todos los datos (solo si es DEALER)
      if (roleName === 'DEALER') {
        setTimeout(async () => {
          try {
            console.log('🚀 Pre-cacheando todos los datos del dealer...');
            await preCacheAllDealerData();
            console.log('✅ Todos los datos pre-cacheados - ¡Listo para trabajar offline!');
          } catch (error) {
            console.error('❌ Error pre-cacheando datos:', error);
          }
        }, 1000); // Esperar 1 segundo después del login
      }

      return { success: true, role: roleName };

    } catch (error) {
      console.error("Login error:", error);
      const msg = error.response?.data?.message || 'Error al iniciar sesión';
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => { 
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, message: 'Usuario registrado' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Error registro';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    try { await db.users.clear(); } catch (e) {}
    setUser(null);
    window.location.href = '/login';
  };

  const value = { user, login, register, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};