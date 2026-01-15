import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

console.log('🔧 API Base URL:', API_BASE_URL);
console.log('🔧 All env vars:', process.env);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only logout for authentication errors (invalid/expired token)
    // Don't logout for authorization errors (403 Forbidden)
    if (error.response?.status === 401 && 
        (error.response?.data?.message?.includes('Unauthorized') || 
         error.response?.data?.message?.includes('token') ||
         error.response?.data?.message?.includes('Invalid token'))) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
