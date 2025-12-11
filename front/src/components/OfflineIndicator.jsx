import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { isOnline, getPendingCounts } from '../db/db';
import { syncAllPendingData } from '../services/syncService';

/**
 * Componente global que muestra el estado de conexión y datos pendientes
 * Se puede usar en el layout principal para que siempre esté visible
 */
const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [pendingData, setPendingData] = useState({ visits: 0, orders: 0, total: 0 });
  const [syncing, setSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Actualizar 
  // estado de conexión
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Actualizar conteo de datos pendientes
  useEffect(() => {
    const updatePendingCounts = async () => {
      try {
        const counts = await getPendingCounts();
        setPendingData(counts);
      } catch (error) {
        console.error('Error obteniendo datos pendientes:', error);
      }
    };

    updatePendingCounts();

    // Actualizar cada 10 segundos
    const interval = setInterval(updatePendingCounts, 10000);

    return () => clearInterval(interval);
  }, [isOffline]);

  // Sincronizar manualmente
  const handleSync = async () => {
    if (isOffline) {
      alert('No hay conexión a internet. La sincronización se realizará automáticamente cuando se restaure la conexión.');
      return;
    }

    setSyncing(true);
    setSyncError(null);

    try {
      const result = await syncAllPendingData();

      if (result.success) {
        alert(`✅ Sincronización exitosa!\n\n- Visitas: ${result.visits.success}\n- Pedidos: ${result.orders.success}`);
      } else {
        let errorMsg = `⚠ Sincronización parcial:\n\n`;
        errorMsg += - `Visitas exitosas: ${result.visits.success}\n`;
        if (result.visits.failed > 0) {
          errorMsg += - `Visitas fallidas: ${result.visits.failed}\n`;
        }
        errorMsg += - `Pedidos exitosos: ${result.orders.success}\n`;
        if (result.orders.failed > 0) {
          errorMsg += - `Pedidos fallidos: ${result.orders.failed}\n`;
        }
        if (result.orders.skipped > 0) {
          errorMsg += - `Pedidos omitidos: ${result.orders.skipped} (sin visita asociada)\n`;
        }

        setSyncError(errorMsg);
        alert(errorMsg);
      }

      // Actualizar conteo
      const counts = await getPendingCounts();
      setPendingData(counts);

    } catch (error) {
      console.error('Error sincronizando:', error);
      setSyncError('Error al sincronizar: ' + error.message);
      alert('Error al sincronizar: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  // Si no hay datos pendientes y estamos online, no mostrar nada
  if (!isOffline && pendingData.total === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`${
          isOffline ? 'bg-orange-500' : 'bg-blue-500'
        } text-white rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Versión compacta */}
        {!showDetails && (
          <div className="px-4 py-3 flex items-center gap-2">
            {isOffline ? (
              <WifiOff className="w-5 h-5" />
            ) : (
              <Wifi className="w-5 h-5" />
            )}
            <span className="font-semibold">
              {isOffline ? 'Offline' : 'Online'}
              {pendingData.total > 0 && ` (${pendingData.total} pendientes)`}
            </span>
          </div>
        )}

        {/* Versión expandida */}
        {showDetails && (
          <div className="px-4 py-3 min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <WifiOff className="w-5 h-5" />
                ) : (
                  <Wifi className="w-5 h-5" />
                )}
                <span className="font-bold text-lg">
                  {isOffline ? 'Modo Offline' : 'Conectado'}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(false);
                }}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {pendingData.total > 0 && (
              <>
                <div className="bg-white bg-opacity-20 rounded p-2 mb-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Visitas pendientes:</span>
                    <span className="font-semibold">{pendingData.visits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pedidos pendientes:</span>
                    <span className="font-semibold">{pendingData.orders}</span>
                  </div>
                </div>

                {!isOffline && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSync();
                    }}
                    disabled={syncing}
                    className="w-full bg-white text-blue-600 py-2 rounded flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
                  </button>
                )}

                {isOffline && (
                  <div className="flex items-start gap-2 text-xs bg-white bg-opacity-20 rounded p-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Los datos se sincronizarán automáticamente cuando se restaure la conexión.
                    </span>
                  </div>
                )}
              </>
            )}

            {pendingData.total === 0 && !isOffline && (
              <div className="text-sm text-center">
                ✅ Todos los datos sincronizados
              </div>
            )}
          </div>
        )}
      </div>

      {syncError && (
        <div className="mt-2 bg-red-500 text-white rounded-lg shadow-lg px-4 py-2 text-sm">
          {syncError}
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;