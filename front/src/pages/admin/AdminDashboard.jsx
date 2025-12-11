import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell';

const AdminDashboard = () => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
          <p className="text-gray-500">Administrador: {user?.name || user?.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-semibold">Rol:</span>
            <span className={`text-xs px-2 py-1 rounded ${
              user?.role === 'ADMIN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user?.role || 'NO DETECTADO'}
            </span>
            {user?.role !== 'ADMIN' && (
              <span className="text-xs text-red-600 ml-2">⚠ Necesitas rol ADMIN para usar esta sección</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Salir
          </button>
        </div>
      </div>

      {/* MENU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/stores" className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold text-gray-700">Tiendas</h2>
          <p className="text-gray-500 mt-2">Administrar tiendas</p>
        </Link>

        <Link to="/admin/dealers" className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold text-gray-700">Repartidores</h2>
          <p className="text-gray-500 mt-2">Gestionar repartidores</p>
        </Link>

        <Link to="/admin/products" className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold text-gray-700">Productos</h2>
          <p className="text-gray-500 mt-2">Gestionar productos</p>
        </Link>

        <Link to="/admin/assignments" className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold text-gray-700">Asignaciones</h2>
          <p className="text-gray-500 mt-2">Gestionar asignaciones</p>
        </Link>

        <Link to="/admin/visits" className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold text-gray-700">Visitas</h2>
          <p className="text-gray-500 mt-2">Ver todas las visitas</p>
        </Link>

        <Link to="/admin/orders" className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold text-gray-700">Pedidos</h2>
          <p className="text-gray-500 mt-2">Ver todos los pedidos</p>
        </Link>


      </div>
    </div>
  );
};

export default AdminDashboard;