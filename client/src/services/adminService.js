import api from './api';

/**
 * CleanLoop Administrative Client Service
 * Encapsulates all backend /api/admin calls for metrics, triage, collector management,
 * and dispatch allocations.
 */

// 1. Dashboard Metrics
export const getAdminDashboardStats = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

// 2. Complaint Management
export const getAdminComplaints = async (params = {}) => {
  const response = await api.get('/admin/complaints', { params });
  return response.data;
};

export const getAdminComplaintById = async (id) => {
  const response = await api.get(`/admin/complaints/${id}`);
  return response.data;
};

export const reviewComplaint = async (id, data = {}) => {
  const response = await api.patch(`/admin/complaints/${id}/review`, data);
  return response.data;
};

export const rejectComplaint = async (id, data = {}) => {
  const response = await api.patch(`/admin/complaints/${id}/reject`, data);
  return response.data;
};

export const updateOperationalPriority = async (id, data = {}) => {
  const response = await api.patch(`/admin/complaints/${id}/priority`, data);
  return response.data;
};

// 3. Collector Management
export const getCollectors = async (params = {}) => {
  const response = await api.get('/admin/collectors', { params });
  return response.data;
};

export const createCollector = async (data) => {
  const response = await api.post('/admin/collectors', data);
  return response.data;
};

export const updateCollector = async (id, data) => {
  const response = await api.patch(`/admin/collectors/${id}`, data);
  return response.data;
};

export const updateCollectorAvailability = async (id, data) => {
  const response = await api.patch(`/admin/collectors/${id}/availability`, data);
  return response.data;
};

export const toggleCollectorActivation = async (id, data) => {
  const response = await api.patch(`/admin/collectors/${id}/activation`, data);
  return response.data;
};

// 4. Assignment Management
export const getAssignments = async (params = {}) => {
  const response = await api.get('/admin/assignments', { params });
  return response.data;
};

export const createAssignment = async (data) => {
  const response = await api.post('/admin/assignments', data);
  return response.data;
};

export const reassignAssignment = async (id, data) => {
  const response = await api.patch(`/admin/assignments/${id}/reassign`, data);
  return response.data;
};

// 5. Activity Log Audit
export const getAdminActivityLogs = async (params = {}) => {
  const response = await api.get('/admin/activity', { params });
  return response.data;
};

// 6. Spatial Map & Geographic Analytics
export const getAdminMapComplaints = async (params = {}) => {
  const response = await api.get('/admin/map/complaints', { params });
  return response.data;
};

export const getAdminMapAnalytics = async (params = {}) => {
  const response = await api.get('/admin/map/analytics', { params });
  return response.data;
};

// 7. Cleanup Verification & Reward Management
export const verifyComplaintResolution = async (id, data = {}) => {
  const response = await api.patch(`/admin/complaints/${id}/verify-resolution`, data);
  return response.data;
};

export const getAdminRewardRules = async () => {
  const response = await api.get('/admin/rewards/rules');
  return response.data;
};

export const createAdminRewardRule = async (data) => {
  const response = await api.post('/admin/rewards/rules', data);
  return response.data;
};

export const updateAdminRewardRule = async (id, data) => {
  const response = await api.patch(`/admin/rewards/rules/${id}`, data);
  return response.data;
};

export const getAdminRewardHistory = async (params = {}) => {
  const response = await api.get('/admin/rewards/history', { params });
  return response.data;
};

export const getAdminCitizenRewardInspect = async (userId) => {
  const response = await api.get(`/admin/rewards/citizens/${userId}`);
  return response.data;
};

export default {
  getAdminDashboardStats,
  getAdminComplaints,
  getAdminComplaintById,
  reviewComplaint,
  rejectComplaint,
  updateOperationalPriority,
  getCollectors,
  createCollector,
  updateCollector,
  updateCollectorAvailability,
  toggleCollectorActivation,
  getAssignments,
  createAssignment,
  reassignAssignment,
  getAdminActivityLogs,
  getAdminMapComplaints,
  getAdminMapAnalytics,
  verifyComplaintResolution,
  getAdminRewardRules,
  createAdminRewardRule,
  updateAdminRewardRule,
  getAdminRewardHistory,
  getAdminCitizenRewardInspect
};

