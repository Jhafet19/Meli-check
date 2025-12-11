import api from "./api";
import { networkFirstThenCache } from "./cacheService";

export const VisitService = {
  // Dealer endpoints con cache
  getTodayVisits: (cacheFirst = false) =>
    networkFirstThenCache(
      () => api.get("/api/visits/today"),
      "/api/visits/today",
      null,
      cacheFirst
    ),

  getOpenVisits: () =>
    networkFirstThenCache(
      () => api.get("/api/visits/open"),
      "/api/visits/open"
    ),

  getById: (id) =>
    networkFirstThenCache(
      () => api.get(`/api/visits/${id}`),
      `/api/visits/${id}`
    ),

  getVisitById: (id) =>
    networkFirstThenCache(
      () => api.get(`/api/visits/${id}`),
      `/api/visits/${id}`
    ),

  checkInByQr: (payload) =>
    api.post("/api/visits/check-in/qr", payload),

  // Admin endpoints
  getVisitsByDealer: (dealerId) =>
    api.get(`/api/visits/dealer/${dealerId}`),

  getVisitsByDealerAndDate: (dealerId, date) =>
    api.get(`/api/visits/dealer/${dealerId}/date/${date}`),

  getVisitsByStoreAndDate: (storeId, date) =>
    api.get(`/api/visits/store/${storeId}/date/${date}`),

  filterVisits: (params) => {
    const queryParams = new URLSearchParams();
    if (params.dealerId) queryParams.append('dealerId', params.dealerId);
    if (params.storeId) queryParams.append('storeId', params.storeId);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    return api.get(`/api/visits/filter?${queryParams.toString()}`);
  }
};