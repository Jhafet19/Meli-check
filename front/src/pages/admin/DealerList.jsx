import { useEffect, useState } from "react";
import { DealerService } from "../../services/dealerService";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DealerList = () => {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [error, setError] = useState("");

  const loadDealers = async () => {
    try {
      setError("");
      const res = await DealerService.getAll();
      setDealers(res.data.result);
    } catch (e) {
      setError("Error al cargar dealers: " + (e.response?.data?.message || e.message));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setError("");
        const res = await DealerService.getAll();
        if (isMounted) setDealers(res.data.result);
      } catch (e) {
        if (isMounted)
          setError("Error al cargar dealers: " + (e.response?.data?.message || e.message));
      }
    };

    load();
    return () => (isMounted = false);
  }, []);

  const handleToggle = async (id) => {
    try {
      setError("");
      await DealerService.toggle(id);
      await loadDealers();
    } catch (e) {
      setError("Error al cambiar estado del dealer: " + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>

            <h1 className="text-2xl font-semibold text-gray-900">Repartidores</h1>
          </div>

          <Link
            className="bg-blue-800 text-white px-5 py-2.5 rounded-lg hover:bg-blue-900 transition"
            to="/admin/dealers/new"
          >
            + Crear Dealer
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dealers.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-blue-700 rounded-xl shadow-sm hover:shadow-md transition p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {d.name} {d.lastName}
                  </h2>
                  <p className="text-gray-500 text-sm">{d.email}</p>
                </div>

                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    d.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {d.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* Phone */}
              <p className="text-sm text-gray-700 mb-4">
                <span className="font-semibold text-gray-800">Tel:</span>{" "}
                {d.phone || "N/A"}
              </p>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <Link
                  to={`/admin/dealers/${d.id}`}
                  className="flex-1 text-center border border-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium"
                >
                  Editar
                </Link>

                <button
                  onClick={() => handleToggle(d.id)}
                  className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition ${
                    d.isActive
                      ? "border border-red-300 text-red-600 hover:bg-red-100"
                      : "border border-green-300 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {d.isActive ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No dealers */}
        {dealers.length === 0 && (
          <div className="text-center mt-10 text-gray-600">
            No hay repartidores registrados.
          </div>
        )}

      </div>
    </div>
  );
};

export default DealerList;