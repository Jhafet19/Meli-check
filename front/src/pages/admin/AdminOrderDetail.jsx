import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { OrderService } from "../../services/orderService";
import { ArrowLeft, Package, Calendar, User, Store, DollarSign, MapPin, FileText, Clock } from "lucide-react";

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await OrderService.getOrderById(id);
      setOrder(response.data.result);
    } catch (err) {
      console.error("Error cargando pedido:", err);
      setError("Error al cargar pedido: " + (err.response?.data?.message || err.message));
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
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Pedido no encontrado"}
          </div>
          <button
            onClick={() => navigate("/admin/orders")}
            className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Volver
          </button>
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
            onClick={() => navigate("/admin/orders")}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">Detalle del Pedido</h1>
            <p className="text-sm text-gray-600">{order.internalCode}</p>
          </div>
          {getStatusBadge(order.status?.code)}
        </div>

        {/* Información General */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Información General</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Store className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Tienda</p>
                <p className="text-sm text-gray-600">{order.store?.name}</p>
                <p className="text-xs text-gray-500">{order.store?.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Repartidor</p>
                <p className="text-sm text-gray-600">{order.dealer?.name || order.dealer?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Fecha del Pedido</p>
                <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Creado</p>
                <p className="text-sm text-gray-600">{formatDateTime(order.createdAt)}</p>
                {order.sentAt && (
                  <>
                    <p className="text-sm font-semibold text-gray-700 mt-2">Enviado</p>
                    <p className="text-sm text-gray-600">{formatDateTime(order.sentAt)}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ubicación de la Visita */}
        {order.visit && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ubicación de la Visita</h2>

            {(order.visit.checkInLatitude && order.visit.checkInLongitude) ? (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Coordenadas de Check-in</p>
                    <p className="text-sm text-gray-600">
                      Latitud: {order.visit.checkInLatitude}, Longitud: {order.visit.checkInLongitude}
                    </p>
                    {order.visit.checkInAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(order.visit.checkInAt)}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${order.visit.checkInLatitude},${order.visit.checkInLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  <MapPin className="w-4 h-4" />
                  Ver en Google Maps
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay ubicación registrada para esta visita</p>
            )}
          </div>
        )}

        {/* Productos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Productos</h2>

          {order.items && order.items.length > 0 ? (
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={item.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{item.product?.name}</p>
                    <p className="text-sm text-gray-600">
                      Cantidad: {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <span className="text-xl font-bold text-gray-800">Total</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  ${parseFloat(order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay productos en este pedido</p>
          )}
        </div>

        {/* Notas */}
        {order.notes && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Notas</h2>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botón Volver */}
        <button
          onClick={() => navigate("/admin/orders")}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg"
        >
          Volver a Pedidos
        </button>
      </div>
    </div>
  );
};

export default AdminOrderDetail;