import { useEffect, useState, useRef } from "react";
import { StoreService } from "../../services/storeService";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation } from "lucide-react";

const StoreForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Cargar datos si es edición
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      StoreService.getOne(id)
        .then((res) => {
          setForm(res.data.result);
        })
        .catch((err) => {
          setError("Error al cargar la tienda: " + (err.response?.data?.message || err.message));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, isEdit]);

  // Cargar Leaflet
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    script.onload = () => setMapReady(true);
    document.body.appendChild(script);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    
    // Usar coordenadas del form o por defecto Emiliano Zapata, Morelos
    const initialLat = parseFloat(form.latitude) || 18.9167;
    const initialLng = parseFloat(form.longitude) || -99.2333;

    const map = L.map(mapRef.current).setView([initialLat, initialLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true
    }).addTo(map);

    marker.on('dragend', function() {
      const position = marker.getLatLng();
      setForm(prev => ({
        ...prev,
        latitude: position.lat.toFixed(6),
        longitude: position.lng.toFixed(6)
      }));
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      setForm(prev => ({
        ...prev,
        latitude: e.latlng.lat.toFixed(6),
        longitude: e.latlng.lng.toFixed(6)
      }));
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapReady]);

  // Actualizar marcador cuando cambien las coordenadas
  useEffect(() => {
    if (markerRef.current && form.latitude && form.longitude) {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        markerRef.current.setLatLng([lat, lng]);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
        }
      }
    }
  }, [form.latitude, form.longitude]);

  const handleCoordinateChange = (e, field) => {
    const value = e.target.value;
    if (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) {
      setForm({ ...form, [field]: value });
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
          setLoading(false);
        },
        (error) => {
          setError("No se pudo obtener la ubicación: " + error.message);
          setLoading(false);
        }
      );
    } else {
      setError("Tu navegador no soporta geolocalización");
    }
  };

  const handleSubmit = async () => {
    setError("");
    
    // Validaciones
    if (!form.name || form.name.trim().length === 0) {
      setError("El nombre de la tienda es obligatorio.");
      return;
    }
    
    if (form.name.trim().length < 3) {
      setError("El nombre de la tienda debe tener al menos 3 caracteres.");
      return;
    }
    
    if (form.name.length > 100) {
      setError("El nombre de la tienda no puede exceder 100 caracteres.");
      return;
    }
    
    if (!form.address || form.address.trim().length < 5) {
      setError("La dirección debe tener al menos 5 caracteres.");
      return;
    }
    
    if (form.address.length > 255) {
      setError("La dirección no puede exceder 255 caracteres.");
      return;
    }
    
    if (!form.latitude || !form.longitude) {
      setError("Debes seleccionar una ubicación en el mapa o ingresar las coordenadas.");
      return;
    }
    
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError("Las coordenadas deben ser números válidos.");
      return;
    }
    
    if (lat < -90 || lat > 90) {
      setError("La latitud debe estar entre -90 y 90.");
      return;
    }
    
    if (lng < -180 || lng > 180) {
      setError("La longitud debe estar entre -180 y 180.");
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEdit) {
        await StoreService.update(id, form);
      } else {
        await StoreService.create(form);
      }
      navigate("/admin/stores");
    } catch (err) {
      setError("Error al guardar la tienda: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/stores")}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            type="button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEdit ? "Editar Tienda" : "Nueva Tienda"}
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="space-y-4">
              <div>
                <label className="block mb-2">
                  <span className="font-medium text-gray-700">Nombre de la Tienda</span>
                  <input
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={loading}
                    placeholder="Ej: Tienda Centro"
                    minLength={3}
                    maxLength={100}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    Mínimo 3 caracteres ({form.name.length}/100)
                  </span>
                </label>
              </div>

              <div>
                <label className="block mb-2">
                  <span className="font-medium text-gray-700">Dirección</span>
                  <input
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                    disabled={loading}
                    minLength={5}
                    maxLength={255}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    Mínimo 5 caracteres ({form.address.length}/255)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">
                    <span className="font-medium text-gray-700">Latitud</span>
                    <input
                      className="w-full border border-gray-300 px-4 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={form.latitude}
                      onChange={(e) => handleCoordinateChange(e, "latitude")}
                      placeholder="Ingresa la latitud"
                      disabled={loading}
                    />
                  </label>
                </div>

                <div>
                  <label className="block mb-2">
                    <span className="font-medium text-gray-700">Longitud</span>
                    <input
                      className="w-full border border-gray-300 px-4 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={form.longitude}
                      onChange={(e) => handleCoordinateChange(e, "longitude")}
                      placeholder="Ingresa la longitud"
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                disabled={loading}
              >
                <Navigation className="w-5 h-5" />
                Usar mi ubicación actual
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Guardando..." : (isEdit ? "Guardar Cambios" : "Crear Tienda")}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium text-blue-900 mb-1">Cómo usar el mapa:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Haz clic en el mapa para colocar el marcador</li>
                    <li>Arrastra el marcador a la ubicación exacta</li>
                    <li>Las coordenadas se actualizan automáticamente</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Selecciona la ubicación en el mapa
            </h2>
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border-2 border-gray-200 shadow-inner"
              style={{ minHeight: '400px' }}
            >
              {!mapReady && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando mapa...</p>
                  </div>
                </div>
              )}
            </div>
            {form.latitude && form.longitude && (
              <p className="text-sm text-gray-600 mt-4">
                <strong>Coordenadas:</strong> {form.latitude}, {form.longitude}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreForm;