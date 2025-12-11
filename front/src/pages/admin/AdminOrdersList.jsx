import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OrderService } from "../../services/orderService";
import { DealerService } from "../../services/dealerService";
import { StoreService } from "../../services/storeService";
import { ArrowLeft, Filter, Package, Calendar, User, Store, DollarSign } from "lucide-react";

const AdminOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filters, setFilters] = useState({
    dealerId: "",
    storeId: "",
    status: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Cargar dealers y stores para los filtros
      const [dealersRes, storesRes] = await Promise.all([
        DealerService.getAll(),
        StoreService.getAll()
      ]);
      setDealers(dealersRes.data.result || []);
      setStores(storesRes.data.result || []);

      // Cargar todos los pedidos sin filtros
      await loadOrders({});
    } catch (err) {
      console.error("Error cargando datos iniciales:", err);
      setError("Error al cargar datos: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (filterParams) => {
    try {
      setError("");
      const response = await OrderService.filterOrders(filterParams);
      setOrders(response.data.result || []);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      setError("Error al cargar pedidos: " + (err.response?.data?.message || err.message));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const filterParams = {};
    if (filters.dealerId) filterParams.dealerId = filters.dealerId;
    if (filters.storeId) filterParams.storeId = filters.storeId;
    if (filters.status) filterParams.status = filters.status;
    if (filters.startDate) filterParams.startDate = filters.startDate;
    if (filters.endDate) filterParams.endDate = filters.endDate;

    loadOrders(filterParams);
  };

  const clearFilters = () => {
    setFilters({
      dealerId: "",
      storeId: "",
      status: "",
      startDate: "",
      endDate: ""
    });
    loadOrders({});
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
            <p className="text-sm text-gray-600">
              {orders.length} pedido{orders.length !== 1 ? "s" : ""} encontrado{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repartidor
              </label>
              <select
                name="dealerId"
                value={filters.dealerId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {dealers.map(dealer => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tienda
              </label>
              <select
                name="storeId"
                value={filters.storeId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="PENDING">Borrador</option>
                <option value="SENT">Enviado</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={applyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Lista de pedidos */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No hay pedidos
            </h2>
            <p className="text-gray-500">
              No se encontraron pedidos con los filtros seleccionados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/admin/orders/${order.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {order.internalCode}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Store className="w-4 h-4" />
                        <span>Tienda: {order.store?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>Repartidor: {order.dealer?.name || order.dealer?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Fecha: {formatDate(order.orderDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>{order.items?.length || 0} producto(s)</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(order.status?.code)}
                  </div>
                </div>

                {order.totalAmount && (
                  <div className="flex items-center gap-2 text-lg font-bold text-blue-600 pt-3 border-t border-gray-200">
                    <DollarSign className="w-5 h-5" />
                    <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
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

export default AdminOrdersList;