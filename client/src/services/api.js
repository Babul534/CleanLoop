import axios from 'axios';

/**
 * CleanLoop Centralized API Client
 * Configured with baseURL, request authorization interceptor,
 * 401 token invalidation handling, and cold-start tolerant timeouts.
 */

// Normalize API base URL: trim whitespace, strip trailing slashes, and ensure /api path
const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = (rawUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) {
    return 'http://localhost:5000/api';
  }
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // 30-second timeout accommodates Render free-tier cold start spin-ups
  timeout: 30000
});

// Request interceptor: attaches session JWT token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('cleanloop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: catches 401s and clears invalid session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('cleanloop_token');
      // Dispatch custom event for reactive context update
      window.dispatchEvent(new Event('cleanloop:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch health status of the CleanLoop backend API
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.warn('[CleanLoop API Service] Health check failed:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Cannot reach API server'
    };
  }
};

export default api;
