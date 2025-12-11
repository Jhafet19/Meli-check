import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Package, LogOut, ShoppingBag } from "lucide-react";
import NotificationBell from "../../components/NotificationBell";

const DealerHome = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto">
        {/* HEADER */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">MeliCheck</h1>
              <p className="text-gray-500">Repartidor: {user?.name || user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={logout}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* MENU */}
        <div className="space-y-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
            onClick={() => navigate("/dealer/visits")}
          >
            <Calendar className="w-6 h-6" />
            <span className="font-semibold">Ver mis visitas de hoy</span>
          </button>

          <button
            className="bg-green-600 hover:bg-green-700 text-white w-full py-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
            onClick={() => navigate("/dealer/orders")}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="font-semibold">Mis Pedidos</span>
          </button>

          <button
            className="bg-gray-700 hover:bg-gray-800 text-white w-full py-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
            onClick={() => navigate("/dealer/assignments")}
          >
            <Package className="w-6 h-6" />
            <span className="font-semibold">Ver todas mis asignaciones</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealerHome;