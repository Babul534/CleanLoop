import mongoose from 'mongoose';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Assignment from '../models/Assignment.js';
import ActivityLog from '../models/ActivityLog.js';
import { hashPassword, validatePasswordStrength } from '../utils/password.js';
import {
  createNotification,
  notifyStatusChanged
} from '../services/notificationService.js';

const VALID_STATUSES = [
  'pending',
  'under_review',
  'assigned',
  'in_progress',
  'awaiting_verification',
  'resolved',
  'rejected',
  'reopen_requested'
];

const VALID_CATEGORIES = [
  'plastic',
  'organic',
  'construction',
  'household',
  'industrial',
  'mixed',
  'other'
];

const ACTIVE_ASSIGNMENT_STATUSES = [
  'assigned',
  'accepted',
  'in_progress',
  'submitted_for_verification'
];

/**
 * CleanLoop Administrative Controller
 * Delivers aggregate operational metrics, complaint triage & review,
 * collector lifecycle management, and assignment allocations with full audit logging.
 */

// -----------------------------------------------------------------------------
// 1. ADMIN DASHBOARD AGGREGATE METRICS
// -----------------------------------------------------------------------------

export const getAdminDashboardStats = async (req, res) => {
  try {
    // 1. Complaint Status Aggregation
    const rawComplaintCounts = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const complaintStats = {
      total: 0,
      pending: 0,
      under_review: 0,
      assigned: 0,
      in_progress: 0,
      awaiting_verification: 0,
      resolved: 0,
      rejected: 0,
      reopen_requested: 0
    };

    rawComplaintCounts.forEach((item) => {
      if (complaintStats.hasOwnProperty(item._id)) {
        complaintStats[item._id] = item.count;
      }
      complaintStats.total += item.count;
    });

    // 2. Collector Roster & Workload Stats
    const [totalCollectors, activeCollectors, availableCollectors, activeAssignmentsCount] =
      await Promise.all([
        User.countDocuments({ role: 'collector' }),
        User.countDocuments({ role: 'collector', accountStatus: 'active' }),
        User.countDocuments({
          role: 'collector',
          accountStatus: 'active',
          availability: 'available'
        }),
        Assignment.countDocuments({ status: { $in: ACTIVE_ASSIGNMENT_STATUSES } })
      ]);

    // Active collectors with 0 active assignments (idle)
    const activeCollectorIds = await User.find(
      { role: 'collector', accountStatus: 'active' },
      '_id'
    ).lean();

    const busyCollectorIds = await Assignment.distinct('collector', {
      status: { $in: ACTIVE_ASSIGNMENT_STATUSES }
    });

    const busySet = new Set(busyCollectorIds.map((id) => id.toString()));
    const idleCollectorsCount = activeCollectorIds.filter(
      (c) => !busySet.has(c._id.toString())
    ).length;

    // 3. Operational Overview Lists
    const [recentComplaints, recentlyResolved, recentActivity, urgentPendingCount] =
      await Promise.all([
        Complaint.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('user', 'name email')
          .select('complaintCode category priority status location createdAt user')
          .lean(),
        Complaint.find({ status: 'resolved' })
          .sort({ resolvedAt: -1, updatedAt: -1 })
          .limit(5)
          .populate('user', 'name')
          .select('complaintCode category priority resolvedAt location')
          .lean(),
        ActivityLog.find()
          .sort({ createdAt: -1 })
          .limit(6)
          .populate('actor', 'name role')
          .lean(),
        Complaint.countDocuments({
          priority: 'high',
          status: { $in: ['pending', 'under_review'] }
        })
      ]);

    return res.status(200).json({
      success: true,
      stats: {
        complaints: complaintStats,
        collectors: {
          total: totalCollectors,
          active: activeCollectors,
          available: availableCollectors,
          assignedWorkload: activeAssignmentsCount,
          idle: idleCollectorsCount
        },
        overview: {
          recentComplaints,
          recentlyResolved,
          recentActivity,
          attentionRequired: urgentPendingCount
        }
      }
    });
  } catch (error) {
    console.error('[Admin Dashboard Stats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate administrative dashboard metrics.'
    });
  }
};

// -----------------------------------------------------------------------------
// 2. COMPLAINT MANAGEMENT
// -----------------------------------------------------------------------------

export const getAdminComplaints = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { status, category, priority, search, startDate, endDate, sortBy } = req.query;

    const query = {};

    if (status && status !== 'all' && VALID_STATUSES.includes(status)) {
      query.status = status;
    }

    if (category && category !== 'all' && VALID_CATEGORIES.includes(category.toLowerCase())) {
      query.category = category.toLowerCase();
    }

    if (priority && priority !== 'all' && ['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      query.priority = priority.toLowerCase();
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      query.$or = [
        { complaintCode: { $regex: term, $options: 'i' } },
        { 'location.address.formattedAddress': { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOrder = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const totalCount = await Complaint.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const skip = (page - 1) * limit;

    const complaints = await Complaint.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email phone')
      .populate('assignedCollector', 'name phone availability')
      .lean();

    return res.status(200).json({
      success: true,
      complaints,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('[Admin Get Complaints Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative complaint list.'
    });
  }
};

export const getAdminComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint identifier.'
      });
    }

    const complaint = await Complaint.findById(id)
      .populate('user', 'name email phone createdAt')
      .populate('statusHistory.changedBy', 'name role email')
      .populate('assignedCollector', 'name email phone availability accountStatus')
      .lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    // Retrieve full assignment audit trail for this complaint
    const assignments = await Assignment.find({ complaint: id })
      .populate('collector', 'name email phone availability accountStatus')
      .populate('assignedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      complaint,
      assignments
    });
  } catch (error) {
    console.error('[Admin Get Complaint By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed complaint record.'
    });
  }
};

export const reviewComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint identifier.' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    if (complaint.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only 'pending' complaints can be moved to review. Current status: '${complaint.status}'`
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'under_review';
    complaint.statusHistory.push({
      status: 'under_review',
      previousStatus,
      changedBy: req.user._id,
      note: note ? note.trim() : 'Review initiated by municipal administrator',
      changedAt: new Date()
    });

    await complaint.save();

    // Log administrative action
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COMPLAINT_REVIEW_STARTED',
        entityType: 'Complaint',
        entityId: complaint._id,
        description: `Initiated administrative review for report ${complaint.complaintCode}`,
        metadata: { previousStatus, note }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    // Trigger citizen notification
    try {
      await notifyStatusChanged(complaint, {
        oldStatus: previousStatus,
        newStatus: 'under_review',
        note
      });
    } catch (notifErr) {
      console.warn('[Status Notification Error]:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintCode} is now under review.`,
      complaint
    });
  } catch (error) {
    console.error('[Admin Review Complaint Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update complaint to review status.'
    });
  }
};

export const rejectComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint identifier.' });
    }

    const reason = rejectionReason || note;
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A detailed rejection explanation (at least 5 characters) is required.'
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    if (complaint.status === 'resolved' || complaint.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject complaint that is already in terminal state '${complaint.status}'.`
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'rejected';
    complaint.rejectionReason = reason.trim();
    complaint.statusHistory.push({
      status: 'rejected',
      previousStatus,
      changedBy: req.user._id,
      note: reason.trim(),
      changedAt: new Date()
    });

    // Cancel any active assignment for this complaint
    await Assignment.updateMany(
      { complaint: complaint._id, status: { $in: ACTIVE_ASSIGNMENT_STATUSES } },
      { $set: { status: 'cancelled', notes: `Cancelled due to report rejection: ${reason.trim()}` } }
    );

    await complaint.save();

    // Log administrative action
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COMPLAINT_REJECTED',
        entityType: 'Complaint',
        entityId: complaint._id,
        description: `Rejected report ${complaint.complaintCode}. Reason: ${reason.trim()}`,
        metadata: { previousStatus, rejectionReason: reason.trim() }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    // Trigger citizen notification
    try {
      await notifyStatusChanged(complaint, {
        oldStatus: previousStatus,
        newStatus: 'rejected',
        rejectionReason: reason.trim()
      });
    } catch (notifErr) {
      console.warn('[Status Notification Error]:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintCode} rejected.`,
      complaint
    });
  } catch (error) {
    console.error('[Admin Reject Complaint Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process complaint rejection.'
    });
  }
};

export const updateOperationalPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint identifier.' });
    }

    if (!priority || !['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority level. Allowed values: 'low', 'medium', 'high'"
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    const previousPriority = complaint.priority;
    complaint.priority = priority.toLowerCase();
    await complaint.save();

    // Record in ActivityLog
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COMPLAINT_PRIORITY_UPDATE',
        entityType: 'Complaint',
        entityId: complaint._id,
        description: `Operational priority updated from ${previousPriority} to ${complaint.priority}`,
        metadata: { previousPriority, newPriority: complaint.priority, note }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Operational priority updated to '${complaint.priority}'.`,
      complaint
    });
  } catch (error) {
    console.error('[Admin Update Priority Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update operational priority.'
    });
  }
};

// -----------------------------------------------------------------------------
// 3. COLLECTOR MANAGEMENT
// -----------------------------------------------------------------------------

export const getCollectors = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { accountStatus, availability, search } = req.query;

    const query = { role: 'collector' };

    if (accountStatus && accountStatus !== 'all') {
      query.accountStatus = accountStatus;
    }

    if (availability && availability !== 'all') {
      query.availability = availability;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } }
      ];
    }

    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const skip = (page - 1) * limit;

    const collectors = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-passwordHash')
      .lean();

    // Enrich collectors with live active & completed assignment workloads
    const collectorIds = collectors.map((c) => c._id);

    const [activeCounts, completedCounts] = await Promise.all([
      Assignment.aggregate([
        {
          $match: {
            collector: { $in: collectorIds },
            status: { $in: ACTIVE_ASSIGNMENT_STATUSES }
          }
        },
        { $group: { _id: '$collector', count: { $sum: 1 } } }
      ]),
      Assignment.aggregate([
        {
          $match: {
            collector: { $in: collectorIds },
            status: 'verified'
          }
        },
        { $group: { _id: '$collector', count: { $sum: 1 } } }
      ])
    ]);

    const activeMap = {};
    activeCounts.forEach((a) => {
      activeMap[a._id.toString()] = a.count;
    });

    const completedMap = {};
    completedCounts.forEach((c) => {
      completedMap[c._id.toString()] = c.count;
    });

    const enrichedCollectors = collectors.map((c) => ({
      ...c,
      activeWorkload: activeMap[c._id.toString()] || 0,
      completedWorkload: completedMap[c._id.toString()] || 0
    }));

    return res.status(200).json({
      success: true,
      collectors: enrichedCollectors,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('[Admin Get Collectors Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve collectors list.'
    });
  }
};

export const createCollector = async (req, res) => {
  try {
    const { name, email, password, phone, serviceAreas } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Collector full name is required (min 2 characters).'
      });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    const emailNorm = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return res.status(400).json({ success: false, message: strength.message });
    }

    const passwordHash = await hashPassword(password);

    const parsedAreas = Array.isArray(serviceAreas)
      ? serviceAreas.map((a) => String(a).trim()).filter(Boolean)
      : typeof serviceAreas === 'string'
      ? serviceAreas.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    const newCollector = await User.create({
      name: name.trim(),
      email: emailNorm,
      passwordHash,
      phone: phone ? phone.trim() : null,
      role: 'collector',
      accountStatus: 'active',
      availability: 'available',
      serviceAreas: parsedAreas
    });

    // Audit log
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COLLECTOR_CREATED',
        entityType: 'User',
        entityId: newCollector._id,
        description: `Provisioned new collector account for ${newCollector.name} (${newCollector.email})`,
        metadata: { serviceAreas: parsedAreas }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    const responseObj = newCollector.toJSON();
    delete responseObj.passwordHash;

    return res.status(201).json({
      success: true,
      message: 'Waste collector account created successfully.',
      collector: responseObj
    });
  } catch (error) {
    console.error('[Admin Create Collector Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create waste collector account.'
    });
  }
};

export const updateCollector = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, serviceAreas } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid collector identifier.' });
    }

    const collector = await User.findOne({ _id: id, role: 'collector' });
    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector record not found.' });
    }

    if (name && typeof name === 'string') collector.name = name.trim();
    if (phone !== undefined) collector.phone = phone ? String(phone).trim() : null;
    if (serviceAreas !== undefined) {
      collector.serviceAreas = Array.isArray(serviceAreas)
        ? serviceAreas.map((a) => String(a).trim()).filter(Boolean)
        : typeof serviceAreas === 'string'
        ? serviceAreas.split(',').map((a) => a.trim()).filter(Boolean)
        : [];
    }

    await collector.save();

    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COLLECTOR_UPDATED',
        entityType: 'User',
        entityId: collector._id,
        description: `Updated profile details for collector ${collector.name}`
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Collector details updated successfully.',
      collector: collector.toJSON()
    });
  } catch (error) {
    console.error('[Admin Update Collector Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update collector record.'
    });
  }
};

export const updateCollectorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid collector identifier.' });
    }

    if (!availability || !['available', 'busy', 'unavailable'].includes(availability.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability value. Allowed: 'available', 'busy', 'unavailable'"
      });
    }

    const collector = await User.findOne({ _id: id, role: 'collector' });
    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector record not found.' });
    }

    const previousAvailability = collector.availability;
    collector.availability = availability.toLowerCase();
    await collector.save();

    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COLLECTOR_AVAILABILITY_UPDATE',
        entityType: 'User',
        entityId: collector._id,
        description: `Collector ${collector.name} availability changed from ${previousAvailability} to ${collector.availability}`
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Collector availability updated to '${collector.availability}'.`,
      collector: collector.toJSON()
    });
  } catch (error) {
    console.error('[Admin Collector Availability Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update collector availability.'
    });
  }
};

export const toggleCollectorActivation = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus, forceReassign } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid collector identifier.' });
    }

    if (!accountStatus || !['active', 'suspended'].includes(accountStatus.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid accountStatus. Allowed: 'active', 'suspended'"
      });
    }

    const collector = await User.findOne({ _id: id, role: 'collector' });
    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector record not found.' });
    }

    const targetStatus = accountStatus.toLowerCase();

    // Safety rule before deactivating collector: Check for active workload
    if (targetStatus === 'suspended') {
      const activeCount = await Assignment.countDocuments({
        collector: collector._id,
        status: { $in: ACTIVE_ASSIGNMENT_STATUSES }
      });

      if (activeCount > 0 && forceReassign !== true) {
        return res.status(400).json({
          success: false,
          activeWorkload: activeCount,
          message: `Cannot suspend collector with ${activeCount} active task assignment(s). Please reassign their work first before deactivating.`
        });
      }
    }

    const previousStatus = collector.accountStatus;
    collector.accountStatus = targetStatus;
    await collector.save();

    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: targetStatus === 'active' ? 'COLLECTOR_ACTIVATED' : 'COLLECTOR_DEACTIVATED',
        entityType: 'User',
        entityId: collector._id,
        description: `Collector ${collector.name} status changed from ${previousStatus} to ${targetStatus}`
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Collector ${collector.name} is now ${targetStatus}.`,
      collector: collector.toJSON()
    });
  } catch (error) {
    console.error('[Admin Toggle Activation Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update collector activation status.'
    });
  }
};

// -----------------------------------------------------------------------------
// 4. ASSIGNMENT MANAGEMENT
// -----------------------------------------------------------------------------

export const getAssignments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { status, collectorId, complaintId } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (collectorId && mongoose.Types.ObjectId.isValid(collectorId)) {
      query.collector = collectorId;
    }

    if (complaintId && mongoose.Types.ObjectId.isValid(complaintId)) {
      query.complaint = complaintId;
    }

    const totalCount = await Assignment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const skip = (page - 1) * limit;

    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('complaint', 'complaintCode category priority status location createdAt')
      .populate('collector', 'name email phone availability accountStatus')
      .populate('assignedBy', 'name role')
      .lean();

    return res.status(200).json({
      success: true,
      assignments,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('[Admin Get Assignments Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve task assignments.'
    });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const { complaintId, collectorId, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId) || !mongoose.Types.ObjectId.isValid(collectorId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid complaintId and collectorId are required.'
      });
    }

    // 1. Validate Complaint Eligibility
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    if (complaint.status === 'resolved' || complaint.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign collector to a complaint in terminal state '${complaint.status}'.`
      });
    }

    // 2. Validate Collector Eligibility
    const collector = await User.findOne({ _id: collectorId, role: 'collector' });
    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector record not found.' });
    }

    if (collector.accountStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign task to a ${collector.accountStatus} collector.`
      });
    }

    // 3. Prevent Duplicate Active Assignment on the same complaint
    const existingActiveAssignment = await Assignment.findOne({
      complaint: complaint._id,
      status: { $in: ACTIVE_ASSIGNMENT_STATUSES }
    });

    if (existingActiveAssignment) {
      return res.status(400).json({
        success: false,
        message:
          'An active assignment already exists for this complaint. Please use the reassign action instead.'
      });
    }

    // 4. Create New Assignment
    const assignment = new Assignment({
      complaint: complaint._id,
      collector: collector._id,
      assignedBy: req.user._id,
      status: 'assigned',
      assignedAt: new Date(),
      notes: notes ? notes.trim() : null
    });
    await assignment.save();

    // 5. Update Complaint Status & History
    const previousStatus = complaint.status;
    complaint.status = 'assigned';
    complaint.assignedCollector = collector._id;
    complaint.assignedAt = new Date();
    complaint.statusHistory.push({
      status: 'assigned',
      previousStatus,
      changedBy: req.user._id,
      note: notes ? notes.trim() : `Dispatched to collector ${collector.name}`,
      changedAt: new Date()
    });
    await complaint.save();

    // 6. Audit Log
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COLLECTOR_ASSIGNED',
        entityType: 'Assignment',
        entityId: assignment._id,
        description: `Assigned complaint ${complaint.complaintCode} to collector ${collector.name}`,
        metadata: { complaintId: complaint._id, collectorId: collector._id, notes }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    // 7. Trigger Notifications
    // Citizen Alert
    try {
      await notifyStatusChanged(complaint, {
        oldStatus: previousStatus,
        newStatus: 'assigned',
        note: notes
      });
    } catch (notifErr) {
      console.warn('[Notification Error]:', notifErr.message);
    }

    // Collector Alert
    try {
      await createNotification({
        userId: collector._id,
        title: 'New Dispatch Assignment',
        message: `You have been assigned to waste cleanup report (${complaint.complaintCode}). Check your route schedule.`,
        type: 'assignment',
        relatedComplaintId: complaint._id
      });
    } catch (collectorNotifErr) {
      console.warn('[Collector Notification Error]:', collectorNotifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Collector ${collector.name} assigned to report ${complaint.complaintCode}.`,
      assignment
    });
  } catch (error) {
    console.error('[Admin Create Assignment Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create collector assignment.'
    });
  }
};

export const reassignAssignment = async (req, res) => {
  try {
    const { id } = req.params; // Current assignment ID
    const { newCollectorId, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(newCollectorId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid assignment ID and newCollectorId are required.'
      });
    }

    const currentAssignment = await Assignment.findById(id);
    if (!currentAssignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found.' });
    }

    if (!ACTIVE_ASSIGNMENT_STATUSES.includes(currentAssignment.status)) {
      return res.status(400).json({
        success: false,
        message: `Only active assignments can be reassigned. Current assignment status: '${currentAssignment.status}'`
      });
    }

    if (currentAssignment.collector.toString() === newCollectorId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'New collector must be different from currently assigned collector.'
      });
    }

    // Validate new collector
    const newCollector = await User.findOne({ _id: newCollectorId, role: 'collector' });
    if (!newCollector) {
      return res.status(404).json({ success: false, message: 'Target collector record not found.' });
    }

    if (newCollector.accountStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot reassign to ${newCollector.accountStatus} collector.`
      });
    }

    const complaint = await Complaint.findById(currentAssignment.complaint);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Associated complaint record not found.' });
    }

    // 1. Mark previous assignment as reassigned
    currentAssignment.status = 'reassigned';
    currentAssignment.notes = currentAssignment.notes
      ? `${currentAssignment.notes} | Reassigned: ${reason || 'Workload reallocation'}`
      : `Reassigned: ${reason || 'Workload reallocation'}`;
    await currentAssignment.save();

    // 2. Create new Assignment
    const newAssignment = new Assignment({
      complaint: complaint._id,
      collector: newCollector._id,
      assignedBy: req.user._id,
      status: 'assigned',
      assignedAt: new Date(),
      notes: reason ? reason.trim() : null
    });
    await newAssignment.save();

    // 3. Update Complaint
    complaint.assignedCollector = newCollector._id;
    complaint.assignedAt = new Date();
    complaint.status = 'assigned';
    complaint.statusHistory.push({
      status: 'assigned',
      previousStatus: 'assigned',
      changedBy: req.user._id,
      note: `Reassigned to collector ${newCollector.name}${reason ? ': ' + reason.trim() : ''}`,
      changedAt: new Date()
    });
    await complaint.save();

    // 4. Audit Log
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COLLECTOR_REASSIGNED',
        entityType: 'Assignment',
        entityId: newAssignment._id,
        description: `Reassigned report ${complaint.complaintCode} to collector ${newCollector.name}`,
        metadata: { previousCollectorId: currentAssignment.collector, newCollectorId: newCollector._id, reason }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    // 5. Notify Citizen and Collector
    try {
      await notifyStatusChanged(complaint, {
        oldStatus: 'assigned',
        newStatus: 'assigned',
        note: `Reassigned to crew: ${newCollector.name}`
      });
    } catch (notifErr) {
      console.warn('[Notification Error]:', notifErr.message);
    }

    try {
      await createNotification({
        userId: newCollector._id,
        title: 'New Reassigned Task',
        message: `Task for report (${complaint.complaintCode}) has been reassigned to you.`,
        type: 'assignment',
        relatedComplaintId: complaint._id
      });
    } catch (cNotifErr) {
      console.warn('[Collector Notification Error]:', cNotifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Assignment successfully reassigned to ${newCollector.name}.`,
      newAssignment
    });
  } catch (error) {
    console.error('[Admin Reassign Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reassign task to new collector.'
    });
  }
};

// -----------------------------------------------------------------------------
// 5. ACTIVITY LOG AUDIT LEDGER
// -----------------------------------------------------------------------------

export const getAdminActivityLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const { action, entityType, startDate, endDate } = req.query;

    const query = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    if (entityType && entityType !== 'all') {
      query.entityType = entityType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const totalCount = await ActivityLog.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name role email')
      .lean();

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('[Admin Get Activity Logs Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative activity audit trail.'
    });
  }
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
  getAdminActivityLogs
};

