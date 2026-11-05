import api from './api';

/**
 * CleanLoop Notification Client Service
 * Handles in-app notification queries, unread counters, and status updates.
 */

export const getNotifications = async ({ page = 1, limit = 10, unreadOnly = false } = {}) => {
  const params = { page, limit };
  if (unreadOnly) params.unreadOnly = 'true';
  const response = await api.get('/notifications', { params });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export default {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
};

