import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyAssignment, getMyAssignments } from "../../services/assignmentService";
import { VisitService } from "../../services/visitService";
import { ArrowLeft, MapPin, Calendar, QrCode, Clock, WifiOff } from "lucide-react";
import { isOnline } from "../../db/db";

const DealerAssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [error, setError] = useState("");
  const [hasActiveCheckIn, setHasActiveCheckIn] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [isOffline, setIsOffline] = useState(!isOnline());

  useEffect(() => {
    loadAssignment();
    checkActiveVisit();

    // Listener para cambios de conexión
    const handleOnline = () => {
      setIsOffline(false);
      loadAssignment();
      checkActiveVisit();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id]);

  const loadAssignment = async () => {
    try {
      setError("");
      const res = await getMyAssignment(id);
      setAssignment(res.data.result);
      setFromCache(res.fromCache || false);
    } catch (err) {
      console.error("❌ Error cargando asignación individual:", err);

      // Si falla, intentar buscarla en el cache de "my-assignments"
      try {
        console.log("🔍 Buscando asignación en cache de 'my-assignments'...");
        const myAssignmentsResponse = await getMyAssignments();
        const assignments = myAssignmentsResponse.data.result || [];

        // Buscar la asignación por ID en el array
        const foundAssignment = assignments.find(a => a.id === parseInt(id));

        if (foundAssignment) {
          console.log("✅ Asignación encontrada en cache de 'my-assignments'");
          setAssignment(foundAssignment);
          setFromCache(true);
        } else {
          console.error("❌ Asignación no encontrada en cache de 'my-assignments'");
          setError("Error al cargar asignación: " + (err.response?.data?.message || err.message));
        }
      } catch (myAssignmentsErr) {
        console.error("❌ Error al buscar en cache de 'my-assignments':", myAssignmentsErr);
        setError("Error al cargar asignación: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const checkActiveVisit = async () => {
    try {
      const res = await VisitService.getOpenVisits();
      const openVisits = res.data.result || [];
      // Verificar si hay alguna visita abierta para esta asignación
      const hasCheckIn = openVisits.some(visit =>
        visit.assignment?.id === parseInt(id) &&
        visit.status?.code === "CHECKED_IN"
      );
      setHasActiveCheckIn(hasCheckIn);
    } catch (err) {
      console.error("Error verificando visitas activas:", err);
    }
  };

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-gray-600">Cargando detalles...</p>
      </div>
    );
  }

  const store = assignment.store;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Detalles de Asignación</h1>
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

        {/* Store Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 border-blue-500">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
            <span
              className={`px-3 py-1 text-xs rounded-full ${
                assignment.assignmentType.code === "PERMANENT"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              {assignment.assignmentType.code === "PERMANENT" ? "Permanente" : "Temporal"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Dirección</p>
                <p className="text-sm text-gray-600">{store.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Coordenadas</p>
                <p className="text-sm text-gray-600">
                  {store.latitude}, {store.longitude}
                </p>
              </div>
            </div>

            {assignment.assignmentType.code === "PERMANENT" && assignment.frequencyDays && (
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Frecuencia</p>
                  <p className="text-sm text-gray-600">Cada {assignment.frequencyDays} días</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Fechas</p>
                <p className="text-sm text-gray-600">
                  Inicio: {assignment.startDate || assignment.createdAt?.substring(0, 10) || "N/A"}
                </p>
                {assignment.endDate && (
                  <p className="text-sm text-gray-600">Fin: {assignment.endDate}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button - Solo mostrar si no hay check-in activo */}
        {!hasActiveCheckIn && (
          <button
            className="w-full bg-green-600 text-white py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-green-700 transition-colors shadow-md"
            onClick={() => navigate(`/dealer/scan?storeId=${store.id}`)}
          >
            <QrCode className="w-6 h-6" />
            <span className="font-semibold text-lg">Escanear QR de esta tienda</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DealerAssignmentDetails;