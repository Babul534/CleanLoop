import mongoose from 'mongoose';
import PointsTransaction from '../models/PointsTransaction.js';
import RewardRule from '../models/RewardRule.js';
import UserBadge from '../models/UserBadge.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import {
  notifyRewardEarned,
  notifyBadgeUnlocked
} from './notificationService.js';

/**
 * CleanLoop Reward & Achievement Engine
 * Authoritative ledger operations, points calculation, dynamic leaderboard,
 * and duplicate-immune badge unlocking.
 */

// Canonical Achievement Definitions
export const BADGE_DEFINITIONS = [
  {
    badgeCode: 'first_cleanup',
    title: 'First Cleanup',
    description: 'Verified your very first municipal waste clearance report.',
    icon: 'sparkles',
    targetType: 'cleanups',
    targetValue: 1
  },
  {
    badgeCode: 'green_starter',
    title: 'Green Starter',
    description: 'Accumulated 50+ Green Points from civic environmental action.',
    icon: 'leaf',
    targetType: 'points',
    targetValue: 50
  },
  {
    badgeCode: 'eco_champion',
    title: 'Eco Champion',
    description: 'Successfully reported and resolved 3+ verified civic cleanup sites.',
    icon: 'award',
    targetType: 'cleanups',
    targetValue: 3
  },
  {
    badgeCode: 'community_guardian',
    title: 'Community Guardian',
    description: 'Earned 200+ Green Points and helped remediate 5+ waste reports.',
    icon: 'shield-check',
    targetType: 'points',
    targetValue: 200
  },
  {
    badgeCode: 'civic_pioneer',
    title: 'Civic Pioneer',
    description: 'Top-tier environmental advocate with 500+ lifetime Green Points.',
    icon: 'trophy',
    targetType: 'points',
    targetValue: 500
  }
];

/**
 * Initializes default reward rules if none exist in the database
 */
export const ensureDefaultRewardRules = async (adminId = null) => {
  const count = await RewardRule.countDocuments();
  if (count > 0) return;

  const defaultRules = [
    {
      code: 'DEFAULT_VERIFIED_CLEANUP',
      title: 'Standard Verified Cleanup',
      description: 'Base reward granted to citizen upon administrative verification of cleanup',
      points: 50,
      category: 'all',
      priority: 'all',
      isActive: true,
      createdBy: adminId
    },
    {
      code: 'HIGH_PRIORITY_BONUS',
      title: 'High Priority Hazard Clearance',
      description: 'Additional incentive for resolving high-priority or hazardous reports',
      points: 25,
      category: 'all',
      priority: 'high',
      isActive: true,
      createdBy: adminId
    }
  ];

  await RewardRule.insertMany(defaultRules);
  console.log('[RewardEngine] Initialized default reward configuration rules.');
};

/**
 * Calculates total points for a verified complaint based on active reward rules
 */
export const calculatePointsForComplaint = async (complaint) => {
  await ensureDefaultRewardRules();

  const rules = await RewardRule.find({ isActive: true }).lean();
  let totalPoints = 50; // Guaranteed minimum base reward
  const appliedRules = [];

  for (const rule of rules) {
    let matchesCategory = rule.category === 'all' || rule.category === complaint.category;
    let matchesPriority = rule.priority === 'all' || rule.priority === complaint.priority;

    if (matchesCategory && matchesPriority) {
      if (rule.code === 'DEFAULT_VERIFIED_CLEANUP') {
        totalPoints = rule.points;
        appliedRules.push(rule.title);
      } else if (rule.priority === 'high' && complaint.priority === 'high') {
        totalPoints += rule.points;
        appliedRules.push(rule.title);
      }
    }
  }

  return {
    totalPoints,
    appliedRules: appliedRules.length > 0 ? appliedRules : ['Verified Civic Cleanup']
  };
};

/**
 * Evaluates and awards badges for a citizen based on real database records.
 * Compound unique index on UserBadge { user, badgeCode } prevents duplicate awards.
 */
export const evaluateCitizenBadges = async (userId) => {
  try {
    const [pointsData, verifiedCleanupsCount, existingBadges] = await Promise.all([
      PointsTransaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), points: { $gt: 0 } } },
        { $group: { _id: null, totalPoints: { $sum: '$points' } } }
      ]),
      Complaint.countDocuments({
        user: userId,
        status: 'resolved'
      }),
      UserBadge.find({ user: userId }).lean()
    ]);

    const totalPoints = pointsData[0]?.totalPoints || 0;
    const existingBadgeCodes = new Set(existingBadges.map((b) => b.badgeCode));
    const newlyUnlocked = [];

    for (const def of BADGE_DEFINITIONS) {
      if (existingBadgeCodes.has(def.badgeCode)) continue;

      let qualified = false;
      if (def.targetType === 'cleanups' && verifiedCleanupsCount >= def.targetValue) {
        qualified = true;
      } else if (def.targetType === 'points' && totalPoints >= def.targetValue) {
        qualified = true;
      }

      if (qualified) {
        try {
          const badge = new UserBadge({
            user: userId,
            badgeCode: def.badgeCode,
            title: def.title,
            description: def.description,
            icon: def.icon,
            earnedAt: new Date()
          });
          await badge.save();
          newlyUnlocked.push(badge);

          // Notify citizen
          await notifyBadgeUnlocked({
            userId,
            badgeTitle: def.title,
            badgeDescription: def.description
          });

          // Log in supervisory ledger
          await ActivityLog.create({
            actor: userId,
            action: 'ACHIEVEMENT_UNLOCKED',
            entityType: 'User',
            entityId: userId,
            description: `Unlocked achievement badge: ${def.title}`,
            metadata: { badgeCode: def.badgeCode, totalPoints, verifiedCleanupsCount }
          });
        } catch (badgeErr) {
          // If duplicate key error (code 11000), ignore safely
          if (badgeErr.code !== 11000) {
            console.warn('[BadgeAward Warning]:', badgeErr.message);
          }
        }
      }
    }

    return newlyUnlocked;
  } catch (err) {
    console.error('[Evaluate Citizen Badges Error]:', err);
    return [];
  }
};

/**
 * Awards Green Points for an administratively verified cleanup.
 * Strictly idempotent: prevents duplicate awards at both application and database level.
 */
export const awardPointsForVerifiedComplaint = async (complaintId, adminUserId) => {
  if (!mongoose.Types.ObjectId.isValid(complaintId)) {
    throw new Error('Invalid complaint identifier');
  }

  const complaint = await Complaint.findById(complaintId).populate('user', 'name email role');
  if (!complaint) {
    throw new Error('Complaint record not found');
  }

  if (complaint.status === 'rejected') {
    throw new Error('Cannot award Green Points for a rejected complaint');
  }

  const citizenId = complaint.user._id || complaint.user;

  // 1. Idempotency Check: Verify if points were already awarded for this complaint
  const existingTx = await PointsTransaction.findOne({
    complaint: complaint._id,
    type: 'complaint_resolved'
  });

  if (existingTx) {
    console.log(`[RewardEngine] Points already awarded for complaint ${complaint.complaintCode}. Idempotent bypass.`);
    return {
      success: true,
      alreadyAwarded: true,
      transaction: existingTx,
      points: existingTx.points
    };
  }

  // 2. Calculate points based on active rules
  const { totalPoints, appliedRules } = await calculatePointsForComplaint(complaint);
  const idempotencyKey = `complaint_resolved_${complaint._id.toString()}`;

  // 3. Persist transaction into authoritative ledger
  let transaction;
  try {
    transaction = new PointsTransaction({
      user: citizenId,
      complaint: complaint._id,
      points: totalPoints,
      type: 'complaint_resolved',
      reason: `Verified resolution of ${complaint.category} waste report (${complaint.complaintCode})`,
      idempotencyKey
    });
    await transaction.save();
  } catch (txErr) {
    // Graceful recovery on concurrent race conditions via unique index
    if (txErr.code === 11000) {
      const raceTx = await PointsTransaction.findOne({ idempotencyKey });
      return {
        success: true,
        alreadyAwarded: true,
        transaction: raceTx,
        points: raceTx?.points || totalPoints
      };
    }
    throw txErr;
  }

  // 4. Send Citizen Reward Notification
  try {
    await notifyRewardEarned({
      userId: citizenId,
      points: totalPoints,
      complaintCode: complaint.complaintCode,
      relatedComplaintId: complaint._id
    });
  } catch (notifErr) {
    console.warn('[Reward Notification Warning]:', notifErr.message);
  }

  // 5. Audit Log
  try {
    await ActivityLog.create({
      actor: adminUserId,
      action: 'POINTS_AWARDED',
      entityType: 'PointsTransaction',
      entityId: transaction._id,
      description: `Awarded ${totalPoints} Green Points to citizen for verified complaint ${complaint.complaintCode}`,
      metadata: {
        complaintId: complaint._id,
        citizenId,
        points: totalPoints,
        appliedRules
      }
    });
  } catch (auditErr) {
    console.warn('[ActivityLog Error]:', auditErr.message);
  }

  // 6. Evaluate and grant any unlocked achievement badges
  const newBadges = await evaluateCitizenBadges(citizenId);

  return {
    success: true,
    alreadyAwarded: false,
    transaction,
    points: totalPoints,
    appliedRules,
    newBadges
  };
};

/**
 * Retrieves comprehensive points, contribution stats, badges, and progress for a citizen
 */
export const getCitizenPointsSummary = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [ledgerSummary, verifiedCleanupsCount, userBadges, recentTransactions] = await Promise.all([
    // Aggregate authoritative points from ledger
    PointsTransaction.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: null,
          currentBalance: { $sum: '$points' },
          totalLifetimeEarned: {
            $sum: { $cond: [{ $gt: ['$points', 0] }, '$points', 0] }
          },
          totalTransactions: { $sum: 1 }
        }
      }
    ]),
    // Verified resolved complaints count
    Complaint.countDocuments({
      user: userId,
      status: 'resolved'
    }),
    // User earned badges
    UserBadge.find({ user: userId }).sort({ earnedAt: -1 }).lean(),
    // Recent 5 transactions
    PointsTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('complaint', 'complaintCode category priority status')
      .lean()
  ]);

  const currentBalance = ledgerSummary[0]?.currentBalance || 0;
  const totalLifetimeEarned = ledgerSummary[0]?.totalLifetimeEarned || 0;
  const totalTransactions = ledgerSummary[0]?.totalTransactions || 0;

  // Compute Achievements with lock state & progress percentages
  const earnedBadgeMap = new Map(userBadges.map((b) => [b.badgeCode, b]));

  let nextBadge = null;
  const fullBadges = BADGE_DEFINITIONS.map((def) => {
    const isUnlocked = earnedBadgeMap.has(def.badgeCode);
    const earnedDoc = earnedBadgeMap.get(def.badgeCode);

    const currentVal =
      def.targetType === 'cleanups' ? verifiedCleanupsCount : totalLifetimeEarned;
    const progressPct = Math.min(
      100,
      Number(((currentVal / def.targetValue) * 100).toFixed(1))
    );

    const badgeObj = {
      badgeCode: def.badgeCode,
      title: def.title,
      description: def.description,
      icon: def.icon,
      targetType: def.targetType,
      targetValue: def.targetValue,
      currentValue: currentVal,
      progressPercentage: progressPct,
      isUnlocked,
      earnedAt: earnedDoc ? earnedDoc.earnedAt : null
    };

    if (!isUnlocked && !nextBadge) {
      nextBadge = badgeObj;
    }

    return badgeObj;
  });

  return {
    balance: currentBalance,
    lifetimeEarned: totalLifetimeEarned,
    verifiedCleanups: verifiedCleanupsCount,
    totalTransactions,
    badges: fullBadges,
    unlockedBadgesCount: userBadges.length,
    nextBadge: nextBadge || null,
    recentTransactions
  };
};

/**
 * Returns ranked civic leaderboard using real MongoDB aggregation
 * Strictly anonymizes display names and preserves citizen data privacy
 */
export const getLeaderboard = async ({ page = 1, limit = 20, currentUserId = null }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * pageLimit;

  // Aggregation Pipeline across PointsTransaction
  const leaderboardPipeline = [
    { $match: { points: { $gt: 0 } } },
    {
      $group: {
        _id: '$user',
        totalPoints: { $sum: '$points' },
        earliestAward: { $min: '$createdAt' },
        transactionCount: { $sum: 1 }
      }
    },
    // Join User details
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    // Filter out administrators and collectors; leaderboard is strictly for citizens
    { $match: { 'userInfo.role': 'user', 'userInfo.accountStatus': 'active' } },
    // Tie-breaking: totalPoints DESC, earliestAward ASC, _id ASC
    {
      $sort: {
        totalPoints: -1,
        earliestAward: 1,
        _id: 1
      }
    }
  ];

  const [allRanked, totalParticipantsCount] = await Promise.all([
    PointsTransaction.aggregate(leaderboardPipeline),
    PointsTransaction.aggregate([
      ...leaderboardPipeline,
      { $count: 'total' }
    ])
  ]);

  const total = totalParticipantsCount[0]?.total || 0;
  const totalPages = Math.ceil(total / pageLimit) || 1;

  // Find current user's rank
  let currentUserRank = null;
  if (currentUserId) {
    const userIndex = allRanked.findIndex(
      (entry) => entry._id.toString() === currentUserId.toString()
    );
    if (userIndex !== -1) {
      const userEntry = allRanked[userIndex];
      currentUserRank = {
        rank: userIndex + 1,
        totalPoints: userEntry.totalPoints,
        transactionCount: userEntry.transactionCount
      };
    }
  }

  // Slice for requested page
  const pageEntries = allRanked.slice(skip, skip + pageLimit);

  // Fetch highest badge for each displayed user
  const userIdsOnPage = pageEntries.map((e) => e._id);
  const badgesOnPage = await UserBadge.find({ user: { $in: userIdsOnPage } }).lean();

  const userBadgesMap = new Map();
  for (const b of badgesOnPage) {
    const uId = b.user.toString();
    if (!userBadgesMap.has(uId)) userBadgesMap.set(uId, []);
    userBadgesMap.get(uId).push(b);
  }

  const sanitizedLeaderboard = pageEntries.map((entry, index) => {
    const rank = skip + index + 1;
    const rawName = entry.userInfo.name || 'Citizen';

    // Privacy formatting: "First L." (e.g., "Arjun K.")
    const parts = rawName.trim().split(/\s+/);
    const displayName =
      parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`
        : parts[0];

    const userBadges = userBadgesMap.get(entry._id.toString()) || [];
    const highestBadge = userBadges.length > 0 ? userBadges[userBadges.length - 1].title : 'Civic Scout';

    return {
      rank,
      userId: entry._id,
      displayName,
      totalPoints: entry.totalPoints,
      verifiedCleanups: entry.transactionCount,
      badge: highestBadge,
      joinedAt: entry.userInfo.createdAt,
      isCurrentUser: currentUserId ? entry._id.toString() === currentUserId.toString() : false
    };
  });

  return {
    leaderboard: sanitizedLeaderboard,
    pagination: {
      total,
      page: pageNum,
      limit: pageLimit,
      totalPages
    },
    currentUserRank
  };
};

export default {
  BADGE_DEFINITIONS,
  ensureDefaultRewardRules,
  calculatePointsForComplaint,
  awardPointsForVerifiedComplaint,
  evaluateCitizenBadges,
  getCitizenPointsSummary,
  getLeaderboard
};

