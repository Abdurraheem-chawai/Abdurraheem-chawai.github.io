import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust port if your server runs on a different port
});

// Request Interceptor: Attach Token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;