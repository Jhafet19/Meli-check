import api from './api';
import { networkFirstThenCache } from './cacheService';

const BASE = '/api/assignments';

export const getAssignments = () =>
  networkFirstThenCache(
    () => api.get(`${BASE}/`),
    `${BASE}/`
  );

export const getAssignment = (id) =>
  networkFirstThenCache(
    () => api.get(`${BASE}/${id}`),
    `${BASE}/${id}`
  );

export const getAssignmentsActive = () =>
  networkFirstThenCache(
    () => api.get(`${BASE}/active`),
    `${BASE}/active`
  );

export const createAssignment = (data) => api.post(`${BASE}/`, data);
export const updateAssignment = (id, data) => api.put(`${BASE}/${id}`, data);

export const toggleAssignment = (id) => api.patch(`${BASE}/${id}/toggle`);

export const getAssignmentsByDealer = (dealerId) =>
  networkFirstThenCache(
    () => api.get(`${BASE}/dealer/${dealerId}`),
    `${BASE}/dealer/${dealerId}`
  );

export const getAssignmentsByStore = (storeId) =>
  networkFirstThenCache(
    () => api.get(`${BASE}/store/${storeId}`),
    `${BASE}/store/${storeId}`
  );

export const getMyAssignments = () =>
  networkFirstThenCache(
    () => api.get(`${BASE}/me`),
    `${BASE}/me`
  );

export const getMyAssignment = (id) =>
  networkFirstThenCache(
    () => api.get(`${BASE}/me/${id}`),
    `${BASE}/me/${id}`
  );
