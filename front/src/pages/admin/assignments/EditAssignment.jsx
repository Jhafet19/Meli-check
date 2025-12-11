import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAssignment, updateAssignment } from "../../../services/assignmentService";
import { ArrowLeft } from "lucide-react";

const EditAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        setError("");
        const res = await getAssignment(id);
        const a = res.data.result;

        // Convertimos fecha a formato yyyy-mm-dd
        const startDate = a.startDate ? a.startDate.substring(0, 10) : "";
        const endDate = a.endDate ? a.endDate.substring(0, 10) : "";

        setForm({
          dealerId: a.dealer.id,
          storeId: a.store.id,
          assignmentType: a.assignmentType.code,
          frequencyDays: a.frequencyDays || "",
          startDate,
          endDate,
          isActive: a.isActive
        });
      } catch (err) {
        console.error("Error cargando asignación:", err);
        setError("Error al cargar asignación: " + (err.response?.data?.message || err.message));
      }
    };
    loadAssignment();
  }, [id]);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await updateAssignment(id, form);
      navigate("/admin/assignments");
    } catch (err) {
      console.error("Error actualizando asignación:", err);
      setError("Error al actualizar asignación: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!form && !error) return <p className="p-8">Cargando asignación...</p>;

  return (
  <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-100 p-6">
    <div className="max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/assignments")}
          className="p-3 hover:bg-white/50 rounded-full transition-all shadow-sm hover:shadow-md"
          type="button"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Editar Asignación #{id}
          </h1>
          <p className="text-gray-600 mt-1">
            Modifica los datos de esta asignación
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 
                  1.414L8.586 10l-1.293 1.293a1 1 0 101.414 
                  1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 
                  10l1.293-1.293a1 1 0 00-1.414-1.414L10 
                  8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!form && !error && (
        <p className="text-gray-700 text-center">Cargando asignación...</p>
      )}

      {/* FORMULARIO */}
      {form && (
        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
        >

          {/* Tipo de Asignación */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Tipo de asignación
            </label>
            <select
              name="assignmentType"
              value={form.assignmentType}
              onChange={change}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="PERMANENT">Permanente</option>
              <option value="TEMPORARY">Temporal</option>
            </select>
          </div>

          {/* Frecuencia */}
          {form.assignmentType === "PERMANENT" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Frecuencia (días)
              </label>
              <input
                type="number"
                name="frequencyDays"
                value={form.frequencyDays}
                onChange={change}
                min="1"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Fecha Inicio */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Fecha de inicio
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={change}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Fecha Fin TEMPORAL */}
          {form.assignmentType === "TEMPORARY" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Fecha de fin
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={change}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Estado */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Estado
            </label>
            <select
              name="isActive"
              value={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.value === "true" })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/admin/assignments")}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg
              hover:bg-gray-50 font-medium transition-all"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600
              text-white rounded-lg hover:from-blue-700 hover:to-indigo-700
              font-medium shadow-md hover:shadow-lg transition-all"
            >
              {loading ? "Actualizando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
);

};

export default EditAssignment;