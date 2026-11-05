import mongoose from 'mongoose';
import PointsTransaction from '../models/PointsTransaction.js';
import rewardService from '../services/rewardService.js';

/**
 * CleanLoop Citizen Rewards Controller
 * Endpoints for citizen points balance, ledger history, achievement badges, and civic leaderboard.
 * Enforces strict multi-tenant isolation so citizens can never view private accounts of others.
 */

// -----------------------------------------------------------------------------
// 1. GET CITIZEN POINTS SUMMARY & BADGE PROGRESS
// -----------------------------------------------------------------------------
export const getMyPointsSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    // Check if any new badges qualify
    await rewardService.evaluateCitizenBadges(userId);

    const summary = await rewardService.getCitizenPointsSummary(userId);

    return res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('[Get Points Summary Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve citizen points summary.'
    });
  }
};

// -----------------------------------------------------------------------------
// 2. GET PAGINATED TRANSACTION HISTORY (TENANT ISOLATED)
// -----------------------------------------------------------------------------
export const getMyTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, type, startDate, endDate } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * pageLimit;

    // Strict tenancy query: exclusively filter by authenticated user
    const query = { user: userId };

    if (type && ['complaint_resolved', 'admin_adjustment'].includes(type)) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total, balanceAgg] = await Promise.all([
      PointsTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('complaint', 'complaintCode category priority status location.address.formattedAddress')
        .lean(),
      PointsTransaction.countDocuments(query),
      PointsTransaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, currentBalance: { $sum: '$points' } } }
      ])
    ]);

    const totalPages = Math.ceil(total / pageLimit) || 1;
    const currentBalance = balanceAgg[0]?.currentBalance || 0;

    return res.status(200).json({
      success: true,
      currentBalance,
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: pageLimit,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('[Get Transaction History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve point transaction records.'
    });
  }
};

// -----------------------------------------------------------------------------
// 3. GET CITIZEN ACHIEVEMENTS & MILESTONE PROGRESS
// -----------------------------------------------------------------------------
export const getMyAchievements = async (req, res) => {
  try {
    const userId = req.user._id;
    await rewardService.evaluateCitizenBadges(userId);
    const summary = await rewardService.getCitizenPointsSummary(userId);

    return res.status(200).json({
      success: true,
      achievements: summary.badges,
      unlockedCount: summary.unlockedBadgesCount,
      totalCount: summary.badges.length,
      nextAchievement: summary.nextBadge
    });
  } catch (error) {
    console.error('[Get Achievements Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve achievements.'
    });
  }
};

// -----------------------------------------------------------------------------
// 4. GET CIVIC LEADERBOARD (PUBLIC TO AUTHENTICATED USERS)
// -----------------------------------------------------------------------------
export const getLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user?._id || null;

    const data = await rewardService.getLeaderboard({
      page,
      limit,
      currentUserId
    });

    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('[Get Leaderboard Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate civic leaderboard.'
    });
  }
};

export default {
  getMyPointsSummary,
  getMyTransactionHistory,
  getMyAchievements,
  getLeaderboard
};

