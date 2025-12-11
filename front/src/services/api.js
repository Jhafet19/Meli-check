import axios from 'axios';
const api = axios.create({
  baseURL: 'https:///back.52.3.56.173.nip.io',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;