import { useEffect, useState } from "react";
import { ProductService } from "../../services/productService";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    sku: "",
    unit: "",
    price: "",
    file: null,       // File
    imageUrl: null,   // para mostrar preview si viene del back
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      const loadProduct = async () => {
        try {
          setLoading(true);
          setError("");
          const res = await ProductService.getOne(id);
          const p = res.data.result;

          // Construir URL completa si la imagen es relativa
          let fullImageUrl = null;
          if (p.imageUrl) {
            if (p.imageUrl.startsWith('http')) {
              fullImageUrl = p.imageUrl;
            } else {
              // URL relativa, construir URL completa
              fullImageUrl = `http://localhost:8081${p.imageUrl.startsWith('/') ? '' : '/'}${p.imageUrl}`;
            }
          }

          setForm((prev) => ({
            ...prev,
            name: p.name || "",
            sku: p.sku || "",
            unit: p.unit || "",
            price: p.price ?? "",
            imageUrl: fullImageUrl,
            file: null, // no tenemos el archivo, solo la URL
          }));
        } catch (e) {
          console.error("Error cargando producto", e);
          setError("Error al cargar el producto: " + (e.response?.data?.message || e.message));
        } finally {
          setLoading(false);
        }
      };

      loadProduct();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));

    if (file) {
      // preview local
      const url = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const payload = {
        name: form.name,
        sku: form.sku,
        unit: form.unit,
        price: form.price,
        file: form.file,
      };

      if (isEdit) {
        await ProductService.update(id, payload);
      } else {
        await ProductService.create(payload);
      }

      navigate("/admin/products");
    } catch (error) {
      console.error("Error guardando producto", error);
      const msg =
        error.response?.data?.text ||
        error.response?.data?.message ||
        "Error al guardar el producto";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          type="button"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Editar producto" : "Nuevo producto"}
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow space-y-4"
      >
        <label className="block">
          <span className="block mb-1">Nombre</span>
          <input
            name="name"
            className="w-full border px-3 py-2 rounded"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block">
          <span className="block mb-1">SKU</span>
          <input
            name="sku"
            className="w-full border px-3 py-2 rounded"
            value={form.sku}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block">
          <span className="block mb-1">Unidad</span>
          <input
            name="unit"
            className="w-full border px-3 py-2 rounded"
            value={form.unit}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block">
          <span className="block mb-1">Precio</span>
          <input
            type="number"
            step="0.01"
            min="0"
            name="price"
            className="w-full border px-3 py-2 rounded"
            value={form.price}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block">
          <span className="block mb-1">
            Imagen {isEdit && "(opcional si quieres cambiarla)"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />
        </label>

        {form.imageUrl && (
          <div className="mt-2">
            <span className="block mb-1 text-sm text-gray-600">
              Vista previa:
            </span>
            <img
              src={form.imageUrl}
              alt="Vista previa"
              className="h-32 object-cover border rounded"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading
            ? "Guardando..."
            : isEdit
            ? "Guardar cambios"
            : "Crear producto"}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;