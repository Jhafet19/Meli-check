import { useState, useEffect } from "react";
import { DealerService } from "../../services/dealerService";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DealerForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    lastName: "",
    surname: "",
    phone: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      DealerService.getOne(id)
        .then((res) => {
          setForm(res.data.result);
        })
        .catch((err) => {
          setError("Error al cargar el dealer: " + (err.response?.data?.message || err.message));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Solo permite números y limita a 10 dígitos
    if (value === "" || /^\d{0,10}$/.test(value)) {
      setForm({ ...form, phone: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isEdit) {
        await DealerService.update(id, form);
      } else {
        await DealerService.create(form);
      }
      navigate("/admin/dealers");
    } catch (err) {
      setError("Error al guardar el dealer: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate("/admin/dealers")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          type="button"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Editar Dealer" : "Nuevo Dealer"}
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">

        <label className="block mb-3">
          <span className="font-medium">Nombre</span>
          <input
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            disabled={loading}
          />
        </label>

        <label className="block mb-3">
          <span className="font-medium">Apellido paterno</span>
          <input
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
            disabled={loading}
          />
        </label>

        <label className="block mb-3">
          <span className="font-medium">Apellido materno</span>
          <input
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.surname}
            onChange={(e) => setForm({ ...form, surname: e.target.value })}
            required
            disabled={loading}
          />
        </label>

        <label className="block mb-3">
          <span className="font-medium">Teléfono</span>
          <input
            type="tel"
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.phone}
            onChange={handlePhoneChange}
            placeholder="10 dígitos"
            maxLength={10}
            disabled={loading}
          />
          <span className="text-xs text-gray-500">Solo números, máximo 10 dígitos</span>
        </label>

        <label className="block mb-3">
          <span className="font-medium">Email</span>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={loading}
          />
        </label>

        {!isEdit && (
          <label className="block mb-3">
            <span className="font-medium">Contraseña</span>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded mt-1"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              disabled={loading}
            />
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <p className="font-semibold mb-1">Requisitos de contraseña:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Mínimo 8 caracteres</li>
                <li>Al menos una letra mayúscula</li>
                <li>Al menos una letra minúscula</li>
                <li>Al menos un número</li>
                <li>Al menos un carácter especial (@$!%*?&)</li>
              </ul>
            </div>
          </label>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Guardando..." : (isEdit ? "Guardar cambios" : "Crear Dealer")}
        </button>
      </form>
    </div>
  );
};

export default DealerForm;