import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OrderService } from "../../services/orderService";
import { ArrowLeft, Package, Calendar, DollarSign, FileText, WifiOff } from "lucide-react";
import { isOnline } from "../../db/db";
import { cacheArrayItems } from "../../services/cacheService";

const DealerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    loadOrders();

    // Listener para cambios de conexión
    const handleOnline = () => {
      setIsOffline(false);
      loadOrders(); // Recargar cuando vuelve conexión
    };
    const handleOffline = () => setIsOffline(true);

    // 🔄 Listener para sincronización global de datos
    const handleDataRefreshed = () => {
      console.log('🔄 Datos refrescados globalmente - Recargando pedidos...');
      loadOrders();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('dataRefreshed', handleDataRefreshed);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('dataRefreshed', handleDataRefreshed);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setError("");
      const response = await OrderService.getMyOrders();
      const ordersList = response.data.result || [];
      setOrders(ordersList);
      setFromCache(response.fromCache || false);

      // Cachear cada pedido individualmente para poder acceder offline
      if (ordersList.length > 0) {
        await cacheArrayItems(ordersList, '/api/orders');
      }
    } catch (err) {
      console.error("Error cargando pedidos:", err);

      // Mensaje más amigable para offline sin cache
      if (!isOnline() && err.message?.includes('cache')) {
        setError("No hay conexión y no se han cargado pedidos previamente. Conéctate a internet para cargar tus pedidos.");
      } else {
        setError("Error al cargar pedidos: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusCode) => {
    const styles = {
      SENT: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };

    const labels = {
      SENT: "Enviado",
      PENDING: "Borrador",
      CANCELLED: "Cancelado",
      COMPLETED: "Completado",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[statusCode] || "bg-gray-100 text-gray-800"}`}>
        {labels[statusCode] || statusCode}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/dealer/home")}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">Mis Pedidos</h1>
            <p className="text-sm text-gray-600">
              {orders.length} pedido{orders.length !== 1 ? "s" : ""} en total
            </p>
          </div>
        </div>

        {/* Indicador de modo offline */}
        {isOffline && (
          <div className="bg-orange-500 text-white px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <WifiOff className="w-5 h-5" />
            <span className="font-semibold">Modo offline - Mostrando datos guardados</span>
          </div>
        )}

        {/* Indicador de datos del cache */}
        {fromCache && !isOffline && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">ℹ️ Mostrando datos del cache local</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Lista de pedidos */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No hay pedidos
            </h2>
            <p className="text-gray-500">
              Tus pedidos enviados aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/dealer/orders/${order.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.internalCode}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tienda: {order.store?.name}
                    </p>
                  </div>
                  {getStatusBadge(order.status?.code)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Fecha: {formatDate(order.orderDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>{order.items?.length || 0} producto(s)</span>
                  </div>
                </div>

                {order.totalAmount && (
                  <div className="flex items-center gap-2 text-lg font-bold text-blue-600 pt-2 border-t border-gray-200">
                    <DollarSign className="w-5 h-5" />
                    <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
                  </div>
                )}

                {order.notes && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{order.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerOrders;