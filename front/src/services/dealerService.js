import api from "./api";

export const DealerService = {
  getAll: () => api.get("/api/users/dealers"),
  getOne: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post("/api/users/dealer", data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  toggle: (id) => api.patch(`/api/users/${id}/toggle`)
};
