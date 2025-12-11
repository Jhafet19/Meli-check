import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAssignments, toggleAssignment } from "../../../services/assignmentService";
import { ArrowLeft } from "lucide-react";

const AssignmentsList = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      // Debug: Verificar token y usuario
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      console.log("🔍 DEBUG - Token existe:", !!token);
      console.log("🔍 DEBUG - Usuario:", userStr ? JSON.parse(userStr) : null);

      const res = await getAssignments();
      setAssignments(res.data.result || []);
    } catch (e) {
      console.error("❌ Error cargando asignaciones", e);
      console.error("❌ Respuesta del servidor:", e.response?.data);

      let errorMsg = "Error al cargar asignaciones: ";

      if (e.response?.status === 403) {
        errorMsg += "No tienes permisos para ver asignaciones. Asegúrate de estar logueado como ADMIN.";
      } else {
        errorMsg += e.response?.data?.message || e.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    try {
      setError("");
      await toggleAssignment(id);
      load();
    } catch (e) {
      console.error("Error al cambiar estado de asignación", e);
      setError("Error al cambiar estado: " + (e.response?.data?.message || e.message));
    }
  };

  return (
  <div className="min-h-screen bg-white p-6">
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <h1 className="text-2xl font-semibold text-gray-900">Asignaciones</h1>
        </div>

        <Link
          to="/admin/assignments/create"
          className="bg-blue-800 text-white px-5 py-2.5 rounded-lg hover:bg-blue-900 transition"
        >
          + Crear asignación
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold mb-2">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {loading && <p className="text-gray-600 text-center py-4">Cargando asignaciones...</p>}

      {/* === GRID DE CARDS === */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">

        {assignments.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-600 py-10">
            No hay asignaciones.
          </div>
        )}

        {assignments.map((a) => (
          <div
            key={a.id}
            className={`rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border ${
              a.isActive
                ? "border-blue-700 bg-blue-50/40"
                : "border-gray-300 bg-white"
            }`}
          >
            {/* Header dinámico */}
            <div
              className={`p-5 border-b ${
                a.isActive
                  ? "bg-blue-700 text-white border-blue-600"
                  : "bg-gray-200 text-gray-800 border-gray-300"
              }`}
            >
              <h2 className="text-lg font-semibold">Asignación #{a.id}</h2>

              <span
                className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${
                  a.isActive ? "bg-white/20 text-white" : "bg-gray-500 text-white"
                }`}
              >
                {a.isActive ? "● Activo" : "● Inactivo"}
              </span>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3 text-gray-800">
              <p className="text-sm">
                <span className="font-semibold">Repartidor:</span> {a.dealer?.email}
              </p>

              <p className="text-sm">
                <span className="font-semibold">Tienda:</span> {a.store?.name}
              </p>

              <p className="text-sm">
                <span className="font-semibold">Tipo:</span> {a.assignmentType?.code}
              </p>

              <p className="text-sm">
                <span className="font-semibold">Fecha inicio:</span> {a.startDate}
              </p>

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to={`/admin/assignments/${a.id}`}
                  className="text-center px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-100 transition text-sm font-medium"
                >
                  Editar
                </Link>

                <button
                  onClick={() => handleToggle(a.id)}
                  className="text-center px-4 py-2 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-200 transition text-sm font-medium"
                >
                  {a.isActive ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  </div>
);

};

export default AssignmentsList;