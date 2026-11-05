import api from './api';

/**
 * Authentication Service
 * Communicates with backend /api/auth endpoints.
 */

/**
 * Register a new citizen account
 * @param {Object} userData - { name, email, password, phone }
 * @returns {Promise<{success: boolean, token: string, user: Object}>}
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Authenticate existing user with credentials
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, token: string, user: Object}>}
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Fetch current authenticated user profile
 * @returns {Promise<{success: boolean, user: Object}>}
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export default {
  register,
  login,
  getCurrentUser
};

