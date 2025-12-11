import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { db, getPendingCounts } from '../../db/db';
import { syncAllPendingData } from '../../services/syncService';

/**
 * Página de debug para visualizar y gestionar datos pendientes de sincronización
 */
const DealerSyncDebug = () => {
  const navigate = useNavigate();
  const [pendingVisits, setPendingVisits] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [counts, setCounts] = useState({ visits: 0, orders: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const visits = await db.pendingVisits.where('synced').equals(0).toArray();
      const orders = await db.pendingOrders.where('synced').equals(0).toArray();
      const pendingCounts = await getPendingCounts();

      setPendingVisits(visits);
      setPendingOrders(orders);
      setCounts(pendingCounts);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAllPendingData();
      alert(JSON.stringify(result, null, 2));
      await loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const deleteVisit = async (id) => {
    if (window.confirm('¿Eliminar esta visita pendiente?')) {
      await db.pendingVisits.delete(id);
      await loadData();
    }
  };

  const deleteOrder = async (id) => {
    if (window.confirm('¿Eliminar este pedido pendiente?')) {
      await db.pendingOrders.delete(id);
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">Debug Sincronización</h1>
            <p className="text-sm text-gray-600">
              Datos pendientes: {counts.total} ({counts.visits} visitas, {counts.orders} pedidos)
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing || counts.total === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>

        {/* Visitas Pendientes */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Visitas Pendientes ({pendingVisits.length})
          </h2>

          {pendingVisits.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay visitas pendientes</p>
          ) : (
            <div className="space-y-3">
              {pendingVisits.map((visit) => (
                <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">Visita Local ID: {visit.id}</p>
                      <p className="text-sm text-gray-600">Store ID: {visit.storeId}</p>
                      <p className="text-sm text-gray-600">QR: {visit.qrCode}</p>
                      <p className="text-sm text-gray-600">
                        Timestamp: {new Date(visit.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Ubicación: {visit.latitude}, {visit.longitude}
                      </p>
                      <p className="text-sm text-gray-600">
                        Intentos: {visit.syncAttempts || 0}
                      </p>
                      {visit.errorMessage && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {visit.errorMessage}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteVisit(visit.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pedidos Pendientes */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pedidos Pendientes ({pendingOrders.length})
          </h2>

          {pendingOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay pedidos pendientes</p>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">Pedido Local ID: {order.id}</p>
                      <p className="text-sm text-gray-600">
                        Visit ID: {order.visitId || '❌ NO TIENE'}
                      </p>
                      <p className="text-sm text-gray-600">Store ID: {order.storeId}</p>
                      <p className="text-sm text-gray-600">
                        Total: ${parseFloat(order.total).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Items: {order.items?.length || 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        Creado: {new Date(order.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Intentos: {order.syncAttempts || 0}
                      </p>
                      {order.errorMessage && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {order.errorMessage}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          Notas: {order.notes}
                        </p>
                      )}

                      {/* Detalle de items */}
                      {order.items && order.items.length > 0 && (
                        <div className="mt-2 bg-gray-50 rounded p-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Productos:
                          </p>
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              - {item.productName || item.name} (ID: {item.productId}) x{' '}
                              {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón para volver */}
        <button
          onClick={() => navigate('/dealer/home')}
          className="w-full mt-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default DealerSyncDebug;