import api from './api';

/**
 * CleanLoop Waste Collector Client Service
 * Encapsulates all backend /api/collector calls for dashboard stats, task queue,
 * task state transitions, and photographic completion evidence submission.
 */

// 1. Dashboard Aggregate Metrics
export const getCollectorDashboardStats = async () => {
  const response = await api.get('/collector/dashboard');
  return response.data;
};

// 2. My Assigned Tasks Query
export const getCollectorTasks = async (params = {}) => {
  const response = await api.get('/collector/tasks', { params });
  return response.data;
};

// 3. Task Detail by Assignment ID
export const getCollectorTaskById = async (id) => {
  const response = await api.get(`/collector/tasks/${id}`);
  return response.data;
};

// 4. Accept Assignment
export const acceptCollectorTask = async (id) => {
  const response = await api.patch(`/collector/tasks/${id}/accept`);
  return response.data;
};

// 5. Start Work on Assignment
export const startCollectorTask = async (id, formData = null) => {
  const headers = formData instanceof FormData
    ? { 'Content-Type': 'multipart/form-data' }
    : { 'Content-Type': 'application/json' };

  const response = await api.patch(`/collector/tasks/${id}/start`, formData || {}, { headers });
  return response.data;
};

// 6. Submit Remediation Evidence for Supervisory Verification
export const submitCollectorVerification = async (id, formData) => {
  const response = await api.post(`/collector/tasks/${id}/submit`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// 7. Collector Availability Control
export const updateCollectorAvailability = async (availability) => {
  const response = await api.patch('/collector/availability', { availability });
  return response.data;
};

export default {
  getCollectorDashboardStats,
  getCollectorTasks,
  getCollectorTaskById,
  acceptCollectorTask,
  startCollectorTask,
  submitCollectorVerification,
  updateCollectorAvailability
};

