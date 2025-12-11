import { useEffect, useState } from "react";
import { ProductService } from "../../services/productService";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ProductService.getAll();
      setProducts(res.data.result || []);
    } catch (e) {
      setError("Error al cargar productos: " + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await ProductService.getAll();
        if (isMounted) setProducts(res.data.result || []);
      } catch (e) {
        if (isMounted)
          setError("Error al cargar productos: " + (e.response?.data?.message || e.message));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => (isMounted = false);
  }, []);

  const handleToggle = async (id) => {
    try {
      setError("");
      await ProductService.toggle(id);
      await loadProducts();
    } catch (e) {
      setError("Error al cambiar estado del producto: " + (e.response?.data?.message || e.message));
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

            <h1 className="text-2xl font-semibold text-gray-900">Productos</h1>
          </div>

          <Link
            className="bg-blue-800 text-white px-5 py-2.5 rounded-lg hover:bg-blue-900 transition"
            to="/admin/products/new"
          >
            + Crear producto
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading && <p className="text-gray-600">Cargando productos...</p>}

        {/* GRID DE CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {products.map((p) => (
            <div
  key={p.id}
  className="rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-300 bg-white"
>
  {/* Header */}
  <div
    className={`p-5 border-b ${
      p.isActive
        ? "bg-blue-700 text-white border-blue-600" 
        : "bg-gray-300 text-gray-800 border-gray-400"
    }`}
  >
    <h2 className="text-lg font-semibold">{p.name}</h2>

    <span
      className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${
        p.isActive ? "bg-white/20 text-white" : "bg-gray-500 text-white"
      }`}
    >
      {p.isActive ? "● Activo" : "● Inactivo"}
    </span>
  </div>

  {/* Body */}
  <div className="p-5 space-y-3 text-gray-800">
    <p className="text-sm">
      <span className="font-semibold">SKU:</span> {p.sku}
    </p>

    <p className="text-sm">
      <span className="font-semibold">Unidad:</span> {p.unit}
    </p>

    <p className="text-sm">
      <span className="font-semibold">Precio:</span> ${p.price}
    </p>

    {/* Acciones */}
    <div className="grid grid-cols-2 gap-3 pt-2">

      <Link
        to={`/admin/products/${p.id}`}
        className="text-center px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-100 transition text-sm font-medium"
      >
        Editar
      </Link>

      <button
        onClick={() => handleToggle(p.id)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          p.isActive
            ? "border border-gray-400 text-gray-600 hover:bg-gray-200"
            : "border border-blue-400 text-blue-700 hover:bg-blue-100"
        }`}
      >
        {p.isActive ? "Desactivar" : "Activar"}
      </button>

    </div>
  </div>
</div>

          ))}

          {/* Si no hay productos */}
          {products.length === 0 && !loading && (
            <div className="text-center text-gray-600 col-span-full py-10">
              No hay productos registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
