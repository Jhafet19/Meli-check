import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { OrderService } from "../../services/orderService";
import { ArrowLeft, Package, Calendar, DollarSign, FileText, Store, User, WifiOff } from "lucide-react";
import { isOnline } from "../../db/db";

const DealerOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [isOffline, setIsOffline] = useState(!isOnline());

  useEffect(() => {
    loadOrder();

    // Listener para cambios de conexión
    const handleOnline = () => {
      setIsOffline(false);
      loadOrder(); // Recargar cuando vuelve conexión
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setError("");
      const response = await OrderService.getOrderById(orderId);
      setOrder(response.data.result);
      setFromCache(response.fromCache || false);
    } catch (err) {
      console.warn("⚠️ No se pudo cargar pedido individual:", err.message);

      // Si falla, intentar buscarlo en el cache de "my-orders" como fallback
      try {
        console.log("🔍 Buscando pedido en cache de 'my-orders' como fallback...");
        const myOrdersResponse = await OrderService.getMyOrders();
        const orders = myOrdersResponse.data.result || [];

        // Buscar el pedido por ID en el array
        const foundOrder = orders.find(o => o.id === parseInt(orderId));

        if (foundOrder) {
          console.log("✅ Pedido encontrado en fallback cache");
          setOrder(foundOrder);
          setFromCache(true);
        } else {
          // No encontrado en ningún cache
          if (!isOnline()) {
            setError("No hay conexión y este pedido no está disponible offline. Conéctate para verlo.");
          } else {
            setError("No se pudo cargar el pedido: " + (err.response?.data?.message || err.message));
          }
        }
      } catch (myOrdersErr) {
        // Fallback también falló
        if (!isOnline()) {
          setError("No hay conexión y no hay datos disponibles offline. Por favor, conéctate a internet.");
        } else {
          setError("Error al cargar pedido: " + (err.response?.data?.message || err.message));
        }
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
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[statusCode] || "bg-gray-100 text-gray-800"}`}>
        {labels[statusCode] || statusCode}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/dealer/orders")}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a pedidos
          </button>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Pedido no encontrado"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/dealer/orders")}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              Detalle del Pedido
            </h1>
            <p className="text-sm text-gray-600">{order.internalCode}</p>
          </div>
          {getStatusBadge(order.status?.code)}
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

        {/* Info general */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Información General
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Store className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Tienda</p>
                <p className="font-semibold text-gray-900">{order.store?.name}</p>
                <p className="text-xs text-gray-500">{order.store?.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Fecha del pedido</p>
                <p className="font-semibold text-gray-900">{formatDate(order.orderDate)}</p>
              </div>
            </div>

            {order.sentAt && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Fecha de envío</p>
                  <p className="font-semibold text-gray-900">{formatDate(order.sentAt)}</p>
                </div>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-600 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Observaciones</p>
                  <p className="text-gray-900">{order.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Productos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-800">
              Productos ({order.items?.length || 0})
            </h2>
          </div>

          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.product?.name}
                    </h3>
                    <p className="text-sm text-gray-600">SKU: {item.product?.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Precio unitario</p>
                    <p className="font-semibold text-gray-900">
                      ${parseFloat(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-xs text-gray-600">Cantidad</p>
                    <p className="font-semibold text-gray-900">{item.quantity} {item.product?.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Subtotal</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </p>
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">Notas:</p>
                    <p className="text-sm text-gray-700">{item.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          {order.totalAmount && (
            <div className="mt-4 pt-4 border-t-2 border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total del Pedido:</span>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">
                    ${parseFloat(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón volver */}
        <button
          onClick={() => navigate("/dealer/orders")}
          className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver a Mis Pedidos
        </button>
      </div>
    </div>
  );
};

export default DealerOrderDetail;