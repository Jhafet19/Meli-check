import api from "./api";
import { networkFirstThenCache } from "./cacheService";

export const ProductService = {
  getAll: () =>
    networkFirstThenCache(
      () => api.get('/api/products/'),
      '/api/products/'
    ),
  getActives: () =>
    networkFirstThenCache(
      () => api.get("/api/products/active"),
      "/api/products/active"
    ),
  getOne: (id) =>
    networkFirstThenCache(
      () => api.get(`/api/products/${id}`),
      `/api/products/${id}`
    ),

  create: ({ name, sku, unit, price, file }) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("sku", sku);
    formData.append("unit", unit);
    formData.append("price", price);

    if (file) {
      formData.append("file", file);
    }

    return api.post("/api/products/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  update: (id, { name, sku, unit, price, file }) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("sku", sku);
    formData.append("unit", unit);
    formData.append("price", price);

    // solo mandamos file si el usuario eligió uno nuevo
    if (file) {
      formData.append("file", file);
    }

    return api.put(`/api/products/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  toggle: (id) => api.patch(`/api/products/${id}/toggle`),
};
