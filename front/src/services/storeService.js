import api from './api';
import { networkFirstThenCache } from './cacheService';

export const StoreService = {
  getAll: () =>
    networkFirstThenCache(
      () => api.get('/api/stores/'),
      '/api/stores/'
    ),
  getActive: () =>
    networkFirstThenCache(
      () => api.get('/api/stores/active'),
      '/api/stores/active'
    ),
  getOne: (id) =>
    networkFirstThenCache(
      () => api.get(`/api/stores/${id}`),
      `/api/stores/${id}`
    ),
  create: (data) => api.post('/api/stores/', data),
  update: (id, data) => api.put(`/api/stores/${id}`, data),
  toggle: (id) => api.patch(`/api/stores/${id}/toggle`),
  getQr: (id) => api.get(`/api/stores/${id}/qr`, { responseType: "blob" }),
};
