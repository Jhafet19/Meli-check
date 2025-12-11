import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { VisitService } from "../../services/visitService";
import { QrCode, ShoppingCart, LogOut, WifiOff } from "lucide-react";
import { isOnline } from "../../db/db";

const DealerVisitDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [isOffline, setIsOffline] = useState(!isOnline());

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        // Primero intentamos cargar la visita individual
        const response = await VisitService.getVisitById(id);
        setVisit(response.data.result);
        setFromCache(response.fromCache || false);
      } catch (err) {
        console.error("❌ Error al traer visita individual:", err);

        // Si falla (porque no hay cache de la visita individual),
        // intentamos buscarla en el cache de "today"
        try {
          console.log("🔍 Buscando visita en cache de 'today'...");
          const todayResponse = await VisitService.getTodayVisits();
          const visits = todayResponse.data.result || [];

          // Buscar la visita por ID en el array
          const foundVisit = visits.find(v => v.id === parseInt(id));

          if (foundVisit) {
            console.log("✅ Visita encontrada en cache de 'today'");
            setVisit(foundVisit);
            setFromCache(true);
          } else {
            console.error("❌ Visita no encontrada en cache de 'today'");
          }
        } catch (todayErr) {
          console.error("❌ Error al buscar en cache de 'today':", todayErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVisit();

    // Listener para cambios de conexión
    const handleOnline = () => {
      setIsOffline(false);
      fetchVisit(); // Recargar cuando vuelve conexión
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id]);

  if (loading) return <div className="p-6 text-center">Cargando visita...</div>;
  if (!visit) return <div className="p-6 text-center">Visita no encontrada</div>;

  const isPlanned = visit.status?.code === "PLANNED";
  const isCheckedIn = visit.status?.code === "CHECKED_IN";

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Detalles de la Visita</h2>

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

      <div className="bg-white shadow p-4 rounded-lg">
        <p><strong>Tienda:</strong> {visit.store?.name}</p>
        <p><strong>Dirección:</strong> {visit.store?.address}</p>
        <p><strong>Fecha planeada:</strong> {visit.visitDate}</p>
        <p><strong>Estado:</strong> {visit.status?.description || visit.status?.code}</p>

        {/* Si está en PLANNED, mostrar botón de check-in */}
        {isPlanned && (
          <button
            className="bg-green-600 text-white w-full py-3 mt-4 rounded-lg flex items-center justify-center gap-2"
            onClick={() => navigate(`/dealer/scan?visitId=${id}`)}
          >
            <QrCode className="w-5 h-5" />
            Hacer Check-in (Escanear QR)
          </button>
        )}

        {/* Si está CHECKED_IN, mostrar opciones de pedido */}
        {isCheckedIn && (
          <>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">✓ Check-in realizado</p>
              {visit.checkInAt && (
                <p className="text-green-600 text-xs mt-1">
                  {new Date(visit.checkInAt).toLocaleString("es-MX")}
                </p>
              )}
            </div>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 mt-4 rounded-lg flex items-center justify-center gap-2"
              onClick={() => navigate(`/dealer/visits/${id}/order`)}
            >
              <ShoppingCart className="w-5 h-5" />
              Crear/Editar Pedido
            </button>

            <button
              className="bg-orange-600 hover:bg-orange-700 text-white w-full py-3 mt-3 rounded-lg flex items-center justify-center gap-2"
              onClick={() => {
                // TODO: Implementar checkout
                alert("Función de checkout próximamente");
              }}
            >
              <LogOut className="w-5 h-5" />
              Hacer Check-out
            </button>
          </>
        )}

        <button
          className="bg-gray-600 hover:bg-gray-700 text-white w-full py-3 mt-4 rounded-lg"
          onClick={() => navigate("/dealer/visits")}
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default DealerVisitDetails;