import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import Assignment from '../models/Assignment.js';
import PointsTransaction from '../models/PointsTransaction.js';
import RewardRule from '../models/RewardRule.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import rewardService, { BADGE_DEFINITIONS } from '../services/rewardService.js';
import { notifyStatusChanged } from '../services/notificationService.js';

/**
 * CleanLoop Administrative Reward Management Controller
 * Handles supervisory cleanup verification, reward rule configuration,
 * and immutable point award audit ledger.
 */

// -----------------------------------------------------------------------------
// 1. VERIFY COMPLAINT RESOLUTION & AWARD GREEN POINTS
// -----------------------------------------------------------------------------
export const verifyComplaintResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint identifier format.'
      });
    }

    const complaint = await Complaint.findById(id).populate('user', 'name email role');
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    // Critical Rule: Points must only be awarded after verified cleanup
    if (complaint.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'This complaint has already been resolved and verified.'
      });
    }

    if (complaint.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot verify or award points for a rejected complaint.'
      });
    }

    // Must be in awaiting_verification or in_progress state
    const VERIFIABLE_STATUSES = ['awaiting_verification', 'in_progress'];
    if (!VERIFIABLE_STATUSES.includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Complaint cannot be verified from '${complaint.status}' status. Task must first be submitted for verification by field crew.`
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();
    complaint.statusHistory.push({
      status: 'resolved',
      previousStatus,
      changedBy: req.user._id,
      note: note ? note.trim() : 'Administrative supervisory audit approved. Remediation verified.',
      changedAt: new Date()
    });
    await complaint.save();

    // Mark associated assignment as verified
    await Assignment.updateMany(
      {
        complaint: complaint._id,
        status: { $in: ['submitted_for_verification', 'in_progress', 'assigned', 'accepted'] }
      },
      {
        $set: {
          status: 'verified',
          verifiedAt: new Date(),
          notes: note ? `Verified by admin: ${note.trim()}` : 'Remediation verified by administrator'
        }
      }
    );

    // Award Green Points (Strictly Idempotent)
    const rewardResult = await rewardService.awardPointsForVerifiedComplaint(
      complaint._id,
      req.user._id
    );

    // Audit Log
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COMPLAINT_VERIFIED_AND_RESOLVED',
        entityType: 'Complaint',
        entityId: complaint._id,
        description: `Verified cleanup and resolved report ${complaint.complaintCode} (+${rewardResult.points} pts awarded)`,
        metadata: {
          previousStatus,
          note,
          pointsAwarded: rewardResult.points,
          alreadyAwarded: rewardResult.alreadyAwarded
        }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Warning]:', auditErr.message);
    }

    // Send Notification to Citizen
    try {
      await notifyStatusChanged(complaint, {
        oldStatus: previousStatus,
        newStatus: 'resolved',
        note: note || 'Supervisory verification passed. Green Points credited to your account!'
      });
    } catch (notifErr) {
      console.warn('[Status Notification Warning]:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Remediation verified and complaint ${complaint.complaintCode} closed. +${rewardResult.points} Green Points awarded!`,
      complaint,
      reward: rewardResult
    });
  } catch (error) {
    console.error('[Admin Verify Complaint Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify complaint resolution.'
    });
  }
};

// -----------------------------------------------------------------------------
// 2. GET REWARD RULES & ACHIEVEMENT DEFINITIONS
// -----------------------------------------------------------------------------
export const getAdminRewardRules = async (req, res) => {
  try {
    await rewardService.ensureDefaultRewardRules(req.user._id);

    const rules = await RewardRule.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    return res.status(200).json({
      success: true,
      rules,
      achievementDefinitions: BADGE_DEFINITIONS
    });
  } catch (error) {
    console.error('[Get Reward Rules Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reward rules configuration.'
    });
  }
};

// -----------------------------------------------------------------------------
// 3. CREATE REWARD RULE
// -----------------------------------------------------------------------------
export const createAdminRewardRule = async (req, res) => {
  try {
    const { code, title, description, points, category, priority, isActive } = req.body;

    if (!code || !title || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Rule code, title, and points value are required.'
      });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const parsedPoints = parseInt(points, 10);

    if (isNaN(parsedPoints) || parsedPoints < 1) {
      return res.status(400).json({
        success: false,
        message: 'Points must be an integer greater than 0.'
      });
    }

    const existingRule = await RewardRule.findOne({ code: cleanCode });
    if (existingRule) {
      return res.status(400).json({
        success: false,
        message: `A reward rule with code '${cleanCode}' already exists.`
      });
    }

    const rule = new RewardRule({
      code: cleanCode,
      title: title.trim(),
      description: description ? description.trim() : '',
      points: parsedPoints,
      category: category || 'all',
      priority: priority || 'all',
      isActive: isActive !== false,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await rule.save();

    // Log admin change
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'REWARD_RULE_CREATED',
        entityType: 'User',
        entityId: req.user._id,
        description: `Created new reward rule: ${rule.title} (${cleanCode}: ${parsedPoints} pts)`,
        metadata: { code: cleanCode, points: parsedPoints }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Reward rule '${rule.title}' created successfully.`,
      rule
    });
  } catch (error) {
    console.error('[Create Reward Rule Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create reward rule.'
    });
  }
};

// -----------------------------------------------------------------------------
// 4. UPDATE REWARD RULE
// -----------------------------------------------------------------------------
export const updateAdminRewardRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, points, isActive, category, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid rule identifier format.' });
    }

    const rule = await RewardRule.findById(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Reward rule record not found.' });
    }

    const previousState = {
      points: rule.points,
      isActive: rule.isActive,
      title: rule.title
    };

    if (title) rule.title = title.trim();
    if (description !== undefined) rule.description = description.trim();
    if (category) rule.category = category;
    if (priority) rule.priority = priority;

    if (points !== undefined) {
      const parsedPoints = parseInt(points, 10);
      if (isNaN(parsedPoints) || parsedPoints < 1) {
        return res.status(400).json({
          success: false,
          message: 'Points must be an integer greater than 0.'
        });
      }
      rule.points = parsedPoints;
    }

    if (isActive !== undefined) {
      rule.isActive = Boolean(isActive);
    }

    rule.updatedBy = req.user._id;
    await rule.save();

    // Log admin change
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'REWARD_RULE_UPDATED',
        entityType: 'User',
        entityId: req.user._id,
        description: `Updated reward rule: ${rule.title} (${rule.code})`,
        metadata: { previousState, newState: { points: rule.points, isActive: rule.isActive } }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Reward rule '${rule.title}' updated successfully.`,
      rule
    });
  } catch (error) {
    console.error('[Update Reward Rule Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update reward rule.'
    });
  }
};

// -----------------------------------------------------------------------------
// 5. GET POINT AWARD HISTORY ACROSS MUNICIPALITY
// -----------------------------------------------------------------------------
export const getAdminRewardHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, userId, complaintId } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * pageLimit;

    const query = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.user = userId;
    }

    if (complaintId && mongoose.Types.ObjectId.isValid(complaintId)) {
      query.complaint = complaintId;
    }

    if (search && search.trim()) {
      query.reason = { $regex: search.trim(), $options: 'i' };
    }

    const [transactions, total, metricsAgg] = await Promise.all([
      PointsTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('user', 'name email role accountStatus')
        .populate('complaint', 'complaintCode category priority status location.address.formattedAddress')
        .lean(),
      PointsTransaction.countDocuments(query),
      PointsTransaction.aggregate([
        {
          $group: {
            _id: null,
            totalPointsDistributed: { $sum: '$points' },
            uniqueCitizens: { $addToSet: '$user' }
          }
        }
      ])
    ]);

    const totalPages = Math.ceil(total / pageLimit) || 1;
    const totalPointsDistributed = metricsAgg[0]?.totalPointsDistributed || 0;
    const uniqueCitizensCount = metricsAgg[0]?.uniqueCitizens?.length || 0;

    return res.status(200).json({
      success: true,
      metrics: {
        totalPointsDistributed,
        uniqueCitizensRewarded: uniqueCitizensCount,
        totalTransactions: total
      },
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
    console.error('[Admin Get Reward History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve municipal point award history.'
    });
  }
};

// -----------------------------------------------------------------------------
// 6. INSPECT CITIZEN'S REWARD PROFILE
// -----------------------------------------------------------------------------
export const getAdminCitizenRewardInspect = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user identifier.' });
    }

    const citizen = await User.findById(userId).select('name email role accountStatus createdAt');
    if (!citizen) {
      return res.status(404).json({ success: false, message: 'Citizen account not found.' });
    }

    const summary = await rewardService.getCitizenPointsSummary(userId);

    return res.status(200).json({
      success: true,
      citizen,
      summary
    });
  } catch (error) {
    console.error('[Admin Inspect Citizen Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to inspect citizen rewards profile.'
    });
  }
};

export default {
  verifyComplaintResolution,
  getAdminRewardRules,
  createAdminRewardRule,
  updateAdminRewardRule,
  getAdminRewardHistory,
  getAdminCitizenRewardInspect
};

