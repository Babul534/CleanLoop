import api from './api';

/**
 * CleanLoop Citizen Rewards & Leaderboard Service
 * Interacts with /api/rewards endpoints for Green Points balance,
 * ledger transaction history, achievement badges, and the civic leaderboard.
 */

export const getMyPointsSummary = async () => {
  const response = await api.get('/rewards/summary');
  return response.data;
};

export const getMyTransactionHistory = async (params = {}) => {
  const response = await api.get('/rewards/history', { params });
  return response.data;
};

export const getMyAchievements = async () => {
  const response = await api.get('/rewards/achievements');
  return response.data;
};

export const getLeaderboard = async (params = {}) => {
  const response = await api.get('/rewards/leaderboard', { params });
  return response.data;
};

export default {
  getMyPointsSummary,
  getMyTransactionHistory,
  getMyAchievements,
  getLeaderboard
};

