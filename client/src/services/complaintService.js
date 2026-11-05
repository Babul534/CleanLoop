import api from './api';

/**
 * CleanLoop Complaint Service
 * Communicates with backend /api/complaints endpoints for reporting,
 * complaint listings, and real-time dashboard aggregates.
 */

/**
 * Submit a new waste complaint with photographs and geolocation
 * @param {FormData} formData
 * @returns {Promise<{success: boolean, message: string, complaint: Object}>}
 */
export const createComplaint = async (formData) => {
  // Axios will automatically set multipart/form-data with proper boundary
  const response = await api.post('/complaints', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Fetch paginated complaints submitted by the authenticated citizen
 * @param {Object} params - { page, limit, status, category, search }
 * @returns {Promise<{success: boolean, complaints: Array, pagination: Object}>}
 */
export const getMyComplaints = async (params = {}) => {
  const response = await api.get('/complaints/my', { params });
  return response.data;
};

/**
 * Fetch statistical summary of complaints for authenticated citizen
 * @returns {Promise<{success: boolean, summary: {total: number, awaitingReview: number, beingHandled: number, resolved: number, rejected: number}}>}
 */
export const getMyComplaintSummary = async () => {
  const response = await api.get('/complaints/my/summary');
  return response.data;
};

/**
 * Fetch details of a single complaint by ID
 * @param {string} id
 * @returns {Promise<{success: boolean, complaint: Object}>}
 */
export const getComplaintById = async (id) => {
  const response = await api.get(`/complaints/${id}`);
  return response.data;
};

/**
 * Update complaint status (municipal staff / testing)
 * @param {string} id
 * @param {Object} data - { status, note, rejectionReason }
 * @returns {Promise<{success: boolean, complaint: Object}>}
 */
export const updateComplaintStatus = async (id, data) => {
  const response = await api.patch(`/complaints/${id}/status`, data);
  return response.data;
};

/**
 * Fetch public impact statistics for the homepage (strictly real MongoDB data)
 * @returns {Promise<{success: boolean, stats: {totalReports: number, resolvedReports: number, inProgressReports: number, resolutionRate: number}}>}
 */
export const getPublicImpactStats = async () => {
  const response = await api.get('/complaints/public/impact');
  return response.data;
};

export default {
  createComplaint,
  getMyComplaints,
  getMyComplaintSummary,
  getComplaintById,
  updateComplaintStatus,
  getPublicImpactStats
};

