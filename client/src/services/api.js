/**
 * API Service for CleanLoop
 * Centralized interface for backend HTTP communication.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Fetch health status of the CleanLoop backend API
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('[CleanLoop API Service] Health check failed:', error.message);
    return {
      success: false,
      message: error.message || 'Cannot reach API server'
    };
  }
};

export default {
  checkApiHealth,
  API_BASE_URL
};
