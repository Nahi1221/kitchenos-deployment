import axios from 'axios';

const api = axios.create({
  baseURL: (window && window.__API_BASE_URL__) || import.meta.env.VITE_API_URL || 'https://kitchenos-deployment.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;