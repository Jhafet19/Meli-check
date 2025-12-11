import { useEffect, useState } from "react";
import { StoreService } from "../../services/storeService";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { X, ArrowLeft, Store, MapPin, QrCode, Edit, Power, Plus, Download } from "lucide-react";

const StoresList = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrModal, setQrModal] = useState({ show: false, url: null, storeName: "" });

  const loadStores = async () => {
    try {
      setError("");
      const res = await StoreService.getAll();
      setStores(res.data.result);
    } catch (err) {
      setError("Error al cargar las tiendas: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStores();
  }, []);

  const toggleStore = async (id) => {
    try {
      setError("");
      await StoreService.toggle(id);
      loadStores();
    } catch (err) {
      setError("Error al cambiar estado de tienda: " + (err.response?.data?.message || err.message));
    }
  };

  const showQR = async (id, storeName) => {
    try {
      setError("");
      const res = await StoreService.getQr(id);
      const blob = new Blob([res.data], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setQrModal({ show: true, url, storeName });
    } catch (err) {
      setError("Error al cargar QR: " + (err.response?.data?.message || err.message));
    }
  };

  const closeQRModal = () => {
    if (qrModal.url) URL.revokeObjectURL(qrModal.url);
    setQrModal({ show: false, url: null, storeName: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-2 border-gray-300 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tiendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Store className="w-6 h-6 text-gray-700" />
                Gestión de Tiendas
              </h1>
              <p className="text-gray-600 text-sm">
                {stores.length} {stores.length === 1 ? "tienda registrada" : "tiendas registradas"}
              </p>
            </div>
          </div>

          <Link
            to="create"
            className="bg-blue-800 text-white px-5 py-2.5 rounded-lg hover:bg-blue-900 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Tienda
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* No Stores */}
        {stores.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No hay tiendas registradas</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">Comienza agregando tu primera tienda.</p>

            <Link
              to="create"
              className="inline-flex items-center gap-2 bg-blue-800 text-white px-5 py-2 rounded-lg hover:bg-blue-900 transition"
            >
              <Plus className="w-4 h-4" />
              Crear Tienda
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stores.map((s) => (
              <div key={s.id} className="bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition">

                {/* Header */}
                <div className="p-5 border-b border-gray-200 bg-blue-700 rounded-xl">
                  <h3 className="text-lg font-semibold text-zinc-50">{s.name}</h3>
                  <span
                    className={`mt-2 inline-block text-xs px-3 py-1 rounded-full ${
                      s.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {s.isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-2 text-gray-900">
                    <MapPin className="w-4 h-4 text-gray-700 flex-shrink-0 mt-1" />
                    <p className="text-sm">{s.address}</p>
                  </div>

                  {s.latitude && (
                    <div className="text-xs text-gray-600 font-mono">
                      📍 {s.latitude}, {s.longitude}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => showQR(s.id, s.name)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-1 text-sm"
                    >
                      <QrCode className="w-4 h-4" />
                      Ver QR
                    </button>

                    <Link
                      to={`edit/${s.id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-1 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
                  </div>

                  <button
                    onClick={() => toggleStore(s.id)}
                    className={`w-full px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-1 ${
                      s.isActive
                        ? "border border-red-300 text-red-600 hover:bg-red-100"
                        : "border border-green-300 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    {s.isActive ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrModal.show && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeQRModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Código QR</h2>
                <p className="text-sm text-gray-700">{qrModal.storeName}</p>
              </div>

              <button onClick={closeQRModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-900" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-center bg-gray-50 p-6 rounded-lg">
                {qrModal.url && (
                  <img src={qrModal.url} alt="QR" className="max-w-full rounded-lg" />
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <a
                  href={qrModal.url}
                  download={`QR-${qrModal.storeName}.png`}
                  className="flex-1 bg-blue-800 text-white px-5 py-2.5 rounded-lg text-center hover:bg-blue-900 transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </a>

                <button
                  onClick={closeQRModal}
                  className="flex-1 border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg hover:bg-gray-100 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StoresList;
