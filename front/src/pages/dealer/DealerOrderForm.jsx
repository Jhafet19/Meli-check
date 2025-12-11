import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { OrderService } from "../../services/orderService";
import { ProductService } from "../../services/productService";
import { VisitService } from "../../services/visitService";
import { ArrowLeft, Plus, Trash2, Send, Save, ShoppingCart, Search, WifiOff, Wifi } from "lucide-react";
import { isOnline, db } from "../../db/db";
import { getProductsFromCache, getStoresFromCache } from "../../services/syncService";

const DealerOrderForm = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!isOnline());
  const [offlineStoreData, setOfflineStoreData] = useState(null);

  const DRAFT_KEY = `order_draft_${visitId}`;

  useEffect(() => {
    loadData();

    // Listener para cambios de conexión
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [visitId]);

  const loadData = async () => {
    try {
      setError("");

      // Verificar si es una visita offline (comienza con "offline-")
      const isOfflineVisit = visitId.startsWith('offline-');

      if (isOfflineVisit) {
        // Cargar datos desde IndexedDB
        console.log('📡 Modo offline - cargando datos desde caché local');

        const localVisitId = parseInt(visitId.replace('offline-', ''));
        const pendingVisit = await db.pendingVisits.get(localVisitId);

        if (!pendingVisit) {
          setError("No se encontró la visita offline");
          setLoading(false);
          return;
        }

        // Buscar la tienda en caché
        const cachedStores = await getStoresFromCache();
        const store = cachedStores.find(s => s.id === pendingVisit.storeId);

        if (!store) {
          setError("No se encontró la tienda en caché local");
          setLoading(false);
          return;
        }

        setOfflineStoreData(store);
        setVisit({
          id: visitId,
          store: store,
          offline: true,
          localId: localVisitId
        });

        // Cargar productos desde caché
        const cachedProducts = await getProductsFromCache();
        setProducts(cachedProducts);
        setIsOfflineMode(true);

      } else {
        // Modo online normal
        if (isOnline()) {
          // Cargar visita
          const visitRes = await VisitService.getById(visitId);
          setVisit(visitRes.data.result);

          // Cargar productos activos
          const productsRes = await ProductService.getActives();
          setProducts(productsRes.data.result || []);
        } else {
          // Sin conexión pero visitId no es offline
          setError("Sin conexión. No se pueden cargar los datos de la visita.");
          setLoading(false);
          return;
        }
      }

      // Cargar borrador desde localStorage si existe
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setOrderItems(draft.items || []);
          setNotes(draft.notes || "");
        } catch (err) {
          console.error("Error cargando borrador:", err);
        }
      }

    } catch (err) {
      console.error("Error cargando datos:", err);

      // Si falla, intentar cargar productos desde caché
      if (!isOnline()) {
        try {
          const cachedProducts = await getProductsFromCache();
          setProducts(cachedProducts);
          setError("Sin conexión. Usando catálogo offline.");
          setIsOfflineMode(true);
        } catch (cacheErr) {
          setError("Error al cargar datos: " + (err.response?.data?.message || err.message));
        }
      } else {
        setError("Error al cargar datos: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product) => {
    // Verificar si el producto ya está en el pedido
    const existingIndex = orderItems.findIndex(item => item.productId === product.id);

    if (existingIndex >= 0) {
      // Incrementar cantidad
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].subtotal = newItems[existingIndex].unitPrice * newItems[existingIndex].quantity;
      setOrderItems(newItems);
    } else {
      // Agregar nuevo producto
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          productUnit: product.unit,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
          notes: "",
        },
      ]);
    }

    setShowProductModal(false);
    setSearchTerm("");
  };

  const updateQuantity = (index, quantity) => {
    const newItems = [...orderItems];
    newItems[index].quantity = Math.max(1, parseInt(quantity) || 1);
    newItems[index].subtotal = newItems[index].unitPrice * newItems[index].quantity;
    setOrderItems(newItems);
  };

  const updateItemNotes = (index, itemNotes) => {
    const newItems = [...orderItems];
    newItems[index].notes = itemNotes;
    setOrderItems(newItems);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2);
  };

  const saveDraft = () => {
    if (orderItems.length === 0) {
      setError("Debes agregar al menos un producto al pedido");
      return;
    }

    try {
      const draft = {
        items: orderItems,
        notes: notes,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      alert("Borrador guardado localmente. Podrás editarlo y enviarlo cuando estés listo.");

    } catch (err) {
      console.error("Error guardando borrador:", err);
      setError("Error al guardar borrador");
    }
  };

  const sendOrder = async () => {
    if (orderItems.length === 0) {
      setError("Debes agregar al menos un producto al pedido");
      return;
    }

    const isOfflineVisit = visitId.startsWith('offline-');

    if (!window.confirm(`¿Estás seguro de ${isOfflineVisit || !isOnline() ? 'guardar' : 'enviar'} este pedido?`)) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Determinar storeId
      let storeId = visit?.store?.id;
      if (!storeId && offlineStoreData) {
        storeId = offlineStoreData.id;
      }

      // Si es visita offline o no hay conexión, usar el método offline
      if (isOfflineVisit || !isOnline()) {
        const result = await OrderService.createOrderOffline({
          visitId: isOfflineVisit ? null : parseInt(visitId),
          storeId: storeId,
          items: orderItems.map(item => ({
            productId: item.productId,
            name: item.productName,
            productName: item.productName,
            sku: item.productSku,
            quantity: item.quantity,
            price: item.unitPrice,
            notes: item.notes,
          })),
          notes: notes
        });

        // Eliminar borrador del localStorage
        localStorage.removeItem(DRAFT_KEY);

        if (result.offline) {
          alert("Pedido guardado offline. Se sincronizará cuando haya conexión.");
        } else {
          alert("Pedido enviado exitosamente");
        }

        navigate(`/dealer/orders`);
        return;
      }

      // Modo online normal
      const payload = {
        visitId: parseInt(visitId),
        notes: notes,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        })),
      };

      // Crear y enviar en una sola operación
      const createRes = await OrderService.createOrder(payload);
      const orderId = createRes.data.result.id;

      await OrderService.sendOrder(orderId);

      // Eliminar borrador del localStorage
      localStorage.removeItem(DRAFT_KEY);

      alert("Pedido enviado exitosamente");
      navigate(`/dealer/orders`);

    } catch (err) {
      console.error("Error enviando pedido:", err);
      setError("Error al enviar pedido: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const clearDraft = () => {
    if (window.confirm("¿Estás seguro de eliminar este borrador?")) {
      localStorage.removeItem(DRAFT_KEY);
      setOrderItems([]);
      setNotes("");
      alert("Borrador eliminado");
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-gray-600">Cargando pedido...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Indicador de estado offline/online */}
        {isOfflineMode && (
          <div className="bg-orange-500 text-white px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
            <WifiOff className="w-5 h-5" />
            <span className="font-semibold">Modo offline - El pedido se sincronizará automáticamente</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Nuevo Pedido
              {isOfflineMode && <WifiOff className="w-6 h-6 text-orange-500" />}
            </h1>
            <p className="text-sm text-gray-600">
              {visit?.store?.name}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {localStorage.getItem(DRAFT_KEY) && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
            <span>📝 Hay un borrador guardado para esta visita</span>
            <button
              onClick={clearDraft}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Eliminar borrador
            </button>
          </div>
        )}

        {/* Botón agregar producto */}
        <button
          onClick={() => setShowProductModal(true)}
          className="w-full mb-4 bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Agregar Producto
        </button>

        {/* Lista de productos en el pedido */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-800">Productos ({orderItems.length})</h2>
          </div>

          {orderItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay productos en el pedido. Haz clic en "Agregar Producto" para empezar.
            </p>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Precio Unitario</label>
                      <input
                        type="text"
                        value={`$${parseFloat(item.unitPrice).toFixed(2)}`}
                        disabled
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-gray-600">Notas del producto (opcional)</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItemNotes(index, e.target.value)}
                      placeholder="Ej: Preferencia de marca, etc."
                      className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                    />
                  </div>

                  <div className="mt-3 text-right">
                    <span className="text-sm text-gray-600">Subtotal: </span>
                    <span className="text-lg font-bold text-gray-900">
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {orderItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${calculateTotal()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Observaciones generales */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <label className="block mb-2">
            <span className="font-semibold text-gray-800">Observaciones del pedido (opcional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas generales sobre el pedido..."
              className="w-full border border-gray-300 rounded px-3 py-2 mt-2"
              rows="3"
            />
          </label>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={sendOrder}
            disabled={saving || orderItems.length === 0}
            className={`w-full ${isOfflineMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white py-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isOfflineMode ? <Save className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            <span className="font-semibold">
              {saving ? (isOfflineMode ? "Guardando..." : "Enviando...") : (isOfflineMode ? "Guardar Pedido Offline" : "Enviar Pedido")}
            </span>
          </button>

          <button
            onClick={saveDraft}
            disabled={saving || orderItems.length === 0}
            className="w-full bg-yellow-600 text-white py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span className="font-semibold">
              {saving ? "Guardando..." : "Guardar Borrador"}
            </span>
          </button>

          <button
            onClick={() => navigate(-1)}
            disabled={saving}
            className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Modal de selección de productos */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Catálogo de Productos</h2>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSearchTerm("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o SKU..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No se encontraron productos
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => addProduct(product)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          <p className="text-sm text-gray-600">Unidad: {product.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            ${parseFloat(product.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:8081${product.imageUrl}`}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded mt-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerOrderForm;