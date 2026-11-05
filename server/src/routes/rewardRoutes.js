import { Router } from 'express';
import {
  getMyPointsSummary,
  getMyTransactionHistory,
  getMyAchievements,
  getLeaderboard
} from '../controllers/rewardController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// 1. Citizen Points Summary & Milestone Badges
router.get('/summary', verifyToken, requireRole('user'), getMyPointsSummary);

// 2. Citizen Transaction History (Tenant-isolated ledger)
router.get('/history', verifyToken, requireRole('user'), getMyTransactionHistory);

// 3. Citizen Achievements
router.get('/achievements', verifyToken, requireRole('user'), getMyAchievements);

// 4. Civic Leaderboard (Public to authenticated participants)
router.get('/leaderboard', verifyToken, getLeaderboard);

export default router;

