import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAssignment } from "../../../services/assignmentService";
import { DealerService } from "../../../services/dealerService";
import { StoreService } from "../../../services/storeService";
import { ArrowLeft, UserCircle, Store, Calendar, Clock, CheckCircle } from "lucide-react";

const CreateAssignment = () => {
  const navigate = useNavigate();

  const [dealers, setDealers] = useState([]);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    dealerId: "",
    storeId: "",
    assignmentType: "PERMANENT",
    frequencyDays: "",
    startDate: "",
    isActive: true
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setError("");
        const [dealersRes, storesRes] = await Promise.all([
          DealerService.getAll(),
          StoreService.getAll()
        ]);
        setDealers(dealersRes.data.result);
        setStores(storesRes.data.result);
      } catch (err) {
        setError("Error al cargar datos: " + (err.response?.data?.message || err.message));
      }
    };
    loadData();
  }, []);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    
    // Validaciones
    if (!form.dealerId) {
      setError("Debes seleccionar un repartidor");
      return;
    }
    
    if (!form.storeId) {
      setError("Debes seleccionar una tienda");
      return;
    }
    
    if (form.assignmentType === "PERMANENT" && !form.frequencyDays) {
      setError("Debes especificar la frecuencia en días para asignaciones permanentes");
      return;
    }

    if (form.assignmentType === "PERMANENT" && form.frequencyDays < 1) {
      setError("La frecuencia debe ser al menos 1 día");
      return;
    }

    setLoading(true);
    
    try {
      await createAssignment(form);
      navigate("/admin/assignments");
    } catch (err) {
      console.error("Error creando asignación:", err);
      setError("Error al crear asignación: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/assignments")}
            className="p-3 hover:bg-white/50 rounded-full transition-all shadow-sm hover:shadow-md"
            type="button"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Nueva Asignación</h1>
            <p className="text-gray-600 mt-1">Asigna un repartidor a una tienda</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Repartidor */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <UserCircle className="w-5 h-5 text-blue-600" />
                  Repartidor
                  <span className="text-red-500">*</span>
                </label>
                <select 
                  name="dealerId" 
                  value={form.dealerId} 
                  onChange={change} 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccione un repartidor...</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} {d.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Tienda */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Store className="w-5 h-5 text-blue-600" />
                  Tienda
                  <span className="text-red-500">*</span>
                </label>
                <select 
                  name="storeId" 
                  value={form.storeId} 
                  onChange={change} 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccione una tienda...</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Asignación */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Tipo de Asignación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, assignmentType: "PERMANENT" })}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      form.assignmentType === "PERMANENT"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    disabled={loading}
                  >
                    Permanente
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, assignmentType: "TEMPORARY" })}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      form.assignmentType === "TEMPORARY"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    disabled={loading}
                  >
                    Temporal
                  </button>
                </div>
              </div>

              {/* Frecuencia (solo para permanente) */}
              {form.assignmentType === "PERMANENT" && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Frecuencia (días)
                    <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    name="frequencyDays" 
                    value={form.frequencyDays}
                    onChange={change} 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Ej: 7 (una vez por semana)"
                    min="1"
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cada cuántos días se repetirá esta asignación
                  </p>
                </div>
              )}

              {/* Fecha de Inicio */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Fecha de Inicio
                </label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={form.startDate} 
                  onChange={change} 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            
            

            {/* Actions */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate("/admin/assignments")}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando...
                  </span>
                ) : (
                  "Crear Asignación"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment;