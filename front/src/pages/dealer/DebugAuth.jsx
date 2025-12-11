import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const DebugAuth = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState(null);

  const testEndpoint = async () => {
    try {
      const res = await api.post("/api/visits/check-in/qr", {
        qrCode: "TEST",
        latitude: 0,
        longitude: 0
      });
      setTestResult({ success: true, data: res.data });
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🔍 Debug de Autenticación</h1>

        <div className="space-y-4">
          {/* User Info */}
          <div className="border-b pb-4">
            <h2 className="font-bold text-lg mb-2">👤 Usuario Actual</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* Token */}
          <div className="border-b pb-4">
            <h2 className="font-bold text-lg mb-2">🔑 Token JWT</h2>
            <div className="bg-gray-100 p-3 rounded text-sm break-all">
              {localStorage.getItem('token') || '❌ No hay token'}
            </div>
          </div>

          {/* User Role */}
          <div className="border-b pb-4">
            <h2 className="font-bold text-lg mb-2">👮 Rol del Usuario</h2>
            <div className="text-lg">
              {user?.rol?.roleEnum ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                  ✓ {user.rol.roleEnum}
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded">
                  ❌ Sin rol
                </span>
              )}
            </div>
          </div>

          {/* Test Endpoint */}
          <div className="pb-4">
            <h2 className="font-bold text-lg mb-2">🧪 Test Endpoint</h2>
            <button
              onClick={testEndpoint}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Probar POST /api/visits/check-in/qr
            </button>

            {testResult && (
              <div className={`mt-3 p-3 rounded ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h3 className="font-bold mb-2">
                  {testResult.success ? '✅ Éxito' : '❌ Error'}
                </h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Backend Info */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <h3 className="font-bold mb-2">ℹ Información</h3>
            <ul className="text-sm space-y-1">
              <li>• Backend URL: <code className="bg-gray-200 px-1">http://localhost:8081</code></li>
              <li>• Endpoint: <code className="bg-gray-200 px-1">POST /api/visits/check-in/qr</code></li>
              <li>• Requiere: Rol DEALER + Token JWT</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAuth;