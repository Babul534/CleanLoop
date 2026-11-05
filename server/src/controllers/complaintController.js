import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import Assignment from '../models/Assignment.js';
import ActivityLog from '../models/ActivityLog.js';
import {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteMultipleCloudinaryAssets
} from '../config/cloudinary.js';
import {
  notifyComplaintSubmitted,
  notifyStatusChanged
} from '../services/notificationService.js';
import { awardPointsForVerifiedComplaint } from '../services/rewardService.js';

const VALID_CATEGORIES = [
  'plastic',
  'organic',
  'construction',
  'household',
  'industrial',
  'mixed',
  'other'
];

const VALID_PRIORITIES = ['low', 'medium', 'high'];
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

/**
 * Citizen Complaint Reporting Controller
 * Handles image streaming to Cloudinary, GeoJSON point construction,
 * ownership filtering, and real-time MongoDB aggregate reporting summaries.
 */

/**
 * Submit a new waste complaint with photographs and geolocation
 * POST /api/complaints
 */
export const createComplaint = async (req, res) => {
  const uploadedAssets = [];

  try {
    const {
      description,
      category,
      reportedPriority,
      latitude,
      longitude,
      formattedAddress,
      landmark,
      locationSource
    } = req.body;

    // 1. Validate description
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description is required and must be at least 10 characters long.'
      });
    }

    if (description.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 1000 characters.'
      });
    }

    // 2. Validate category
    if (!category || !VALID_CATEGORIES.includes(category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // 3. Validate citizen reported priority
    const normalizedPriority = (reportedPriority || 'medium').toLowerCase();
    if (!VALID_PRIORITIES.includes(normalizedPriority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
      });
    }

    // 4. Validate coordinates [longitude, latitude]
    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);

    if (
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Valid geographic coordinates are required (latitude between -90 and 90, longitude between -180 and 180).'
      });
    }

    // 5. Verify images exist (provided by uploadMiddleware)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one photograph of the waste is required.'
      });
    }

    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'You cannot attach more than 5 photographs.'
      });
    }

    // 6. Check Cloudinary configuration
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'Cloudinary image storage service is not configured on the server. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.'
      });
    }

    // 7. Upload image buffers to Cloudinary
    try {
      for (const file of req.files) {
        const uploadResult = await uploadBufferToCloudinary(file.buffer, {
          folder: `cleanloop/complaints/${req.user._id}`,
          tags: ['cleanloop', 'complaint', category.toLowerCase()]
        });
        uploadedAssets.push(uploadResult);
      }
    } catch (uploadError) {
      // Rollback any successfully uploaded assets
      if (uploadedAssets.length > 0) {
        await deleteMultipleCloudinaryAssets(uploadedAssets.map((asset) => asset.publicId));
      }
      return res.status(502).json({
        success: false,
        message: `Failed to upload images to Cloudinary storage: ${uploadError.message}`
      });
    }

    // 8. Construct Complaint document
    // GeoJSON standard: coordinates must be [longitude, latitude]
    const newComplaint = new Complaint({
      user: req.user._id,
      description: description.trim(),
      category: category.toLowerCase(),
      reportedPriority: normalizedPriority,
      priority: 'medium', // Default operational priority governed by municipal protocol
      images: uploadedAssets,
      location: {
        type: 'Point',
        coordinates: [parsedLng, parsedLat],
        address: {
          formattedAddress: formattedAddress ? formattedAddress.trim() : '',
          landmark: landmark ? landmark.trim() : ''
        },
        source: locationSource === 'manual' ? 'manual' : 'gps'
      },
      status: 'pending',
      assignedCollector: null,
      statusHistory: [
        {
          status: 'pending',
          changedBy: req.user._id,
          note: 'Complaint submitted by citizen',
          changedAt: new Date()
        }
      ]
    });

    // 9. Save to MongoDB
    try {
      await newComplaint.save();
    } catch (dbError) {
      // Clean up Cloudinary assets if database insertion fails
      if (uploadedAssets.length > 0) {
        await deleteMultipleCloudinaryAssets(uploadedAssets.map((asset) => asset.publicId));
      }
      throw dbError;
    }

    // 10. Trigger notification to the citizen
    try {
      await notifyComplaintSubmitted(newComplaint, req.user);
    } catch (notifErr) {
      console.warn('[Create Complaint Notification Failed]:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: {
        id: newComplaint._id.toString(),
        complaintCode: newComplaint.complaintCode,
        category: newComplaint.category,
        status: newComplaint.status,
        reportedPriority: newComplaint.reportedPriority,
        priority: newComplaint.priority,
        createdAt: newComplaint.createdAt,
        images: newComplaint.images,
        location: newComplaint.location
      }
    });
  } catch (error) {
    console.error('[Create Complaint Error]:', error);
    // Safety cleanup in case of unexpected exceptions
    if (uploadedAssets.length > 0) {
      await deleteMultipleCloudinaryAssets(uploadedAssets.map((asset) => asset.publicId));
    }
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while saving the complaint. Please try again.'
    });
  }
};

/**
 * Fetch complaints belonging to authenticated citizen
 * GET /api/complaints/my
 */
export const getMyComplaints = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { status, category, search } = req.query;

    const query = { user: req.user._id };

    if (status && status !== 'all') {
      if (VALID_STATUSES.includes(status)) {
        query.status = status;
      }
    }

    if (category && category !== 'all') {
      if (VALID_CATEGORIES.includes(category.toLowerCase())) {
        query.category = category.toLowerCase();
      }
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      query.complaintCode = { $regex: search.trim(), $options: 'i' };
    }

    const totalCount = await Complaint.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const skip = (page - 1) * limit;

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
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
    console.error('[Get My Complaints Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your complaints.'
    });
  }
};

/**
 * Fetch statistical complaint summary for authenticated citizen
 * GET /api/complaints/my/summary
 */
export const getMyComplaintSummary = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);
    const rawCounts = await Complaint.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    let total = 0;

    rawCounts.forEach((item) => {
      countMap[item._id] = item.count;
      total += item.count;
    });

    // Exact status mapping per civic requirements:
    // Awaiting Review: pending, under_review
    // Being Handled: assigned, in_progress, awaiting_verification
    // Resolved: resolved (Rejected complaints must NOT be counted as resolved)
    // Rejected: rejected
    const awaitingReview = (countMap.pending || 0) + (countMap.under_review || 0);
    const beingHandled =
      (countMap.assigned || 0) +
      (countMap.in_progress || 0) +
      (countMap.awaiting_verification || 0);
    const resolved = countMap.resolved || 0;
    const rejected = countMap.rejected || 0;

    return res.status(200).json({
      success: true,
      summary: {
        total,
        awaitingReview,
        beingHandled,
        resolved,
        rejected
      }
    });
  } catch (error) {
    console.error('[Get Complaint Summary Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate complaint summary.'
    });
  }
};

/**
 * Fetch single complaint details by ID (with ownership check)
 * GET /api/complaints/:id
 */
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint identifier.'
      });
    }

    const complaint = await Complaint.findById(id)
      .populate('user', 'name email role')
      .populate('statusHistory.changedBy', 'name role')
      .populate('assignedCollector', 'name phone availability')
      .lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    // Role-based access control: citizens can only view their own complaints
    const complaintUserId = complaint.user?._id
      ? complaint.user._id.toString()
      : complaint.user.toString();

    if (req.user.role === 'user' && complaintUserId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: you do not have permission to view this complaint.'
      });
    }

    return res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('[Get Complaint By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint details.'
    });
  }
};

/**
 * Validated Administrative Status Transitions
 * PATCH /api/complaints/:id/status
 * Restricted to municipal staff (admin / collector). Citizens are strictly forbidden.
 */
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: targetStatus, note, rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint identifier.'
      });
    }

    // Never allow citizens to modify complaint status
    if (req.user.role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: citizens cannot modify complaint statuses.'
      });
    }

    if (!targetStatus || !VALID_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid target status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    const currentStatus = complaint.status;

    if (currentStatus === targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Complaint is already in '${currentStatus}' status.`
      });
    }

    // State transition machine
    const VALID_TRANSITIONS = {
      pending: ['under_review', 'rejected'],
      under_review: ['assigned', 'rejected'],
      assigned: ['in_progress', 'under_review', 'rejected'],
      in_progress: ['awaiting_verification', 'rejected'],
      awaiting_verification: ['resolved', 'in_progress', 'rejected'],
      resolved: ['reopen_requested'],
      rejected: [],
      reopen_requested: ['under_review', 'rejected']
    };

    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed: ${
          allowedTransitions.length ? allowedTransitions.join(', ') : 'none (terminal state)'
        }`
      });
    }

    if (targetStatus === 'rejected') {
      const reason = rejectionReason || note;
      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'An explanatory rejection reason is required when rejecting a report.'
        });
      }
      complaint.rejectionReason = reason.trim();
    }

    if (targetStatus === 'resolved') {
      complaint.resolvedAt = new Date();
      try {
        await Assignment.updateMany(
          { complaint: complaint._id, status: { $in: ['submitted_for_verification', 'in_progress', 'assigned', 'accepted'] } },
          { $set: { status: 'verified', verifiedAt: new Date() } }
        );
      } catch (assignErr) {
        console.warn('[Assignment Update Error on Resolve]:', assignErr.message);
      }
    }

    const previousStatus = currentStatus;
    complaint.status = targetStatus;

    // Append to status history
    complaint.statusHistory.push({
      status: targetStatus,
      previousStatus,
      changedBy: req.user._id,
      note: note ? note.trim() : (targetStatus === 'rejected' ? complaint.rejectionReason : null),
      changedAt: new Date()
    });

    await complaint.save();

    // Award Green Points if complaint is resolved (Strictly Idempotent)
    let rewardResult = null;
    if (targetStatus === 'resolved') {
      try {
        rewardResult = await awardPointsForVerifiedComplaint(complaint._id, req.user._id);
      } catch (rewardErr) {
        console.error('[Reward Award Error on Resolve]:', rewardErr.message);
      }
    }

    // Create ActivityLog entry
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COMPLAINT_STATUS_UPDATE',
        entityType: 'Complaint',
        entityId: complaint._id,
        description: `Status transitioned from ${previousStatus} to ${targetStatus}`,
        metadata: {
          previousStatus,
          newStatus: targetStatus,
          note,
          rejectionReason: complaint.rejectionReason,
          pointsAwarded: rewardResult?.points || null
        }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    // Trigger notification to the citizen
    try {
      await notifyStatusChanged(complaint, {
        oldStatus: previousStatus,
        newStatus: targetStatus,
        note,
        rejectionReason: complaint.rejectionReason
      });
    } catch (notifErr) {
      console.warn('[Status Notification Error]:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to '${targetStatus}'.`,
      complaint,
      reward: rewardResult
    });
  } catch (error) {
    console.error('[Update Complaint Status Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update complaint status.'
    });
  }
};

/**
 * Public Impact Statistics
 * GET /api/complaints/public/impact
 * Unauthenticated aggregate statistics for homepage impact metrics (strictly real MongoDB data)
 */
export const getPublicImpactStats = async (req, res) => {
  try {
    const [totalReports, resolvedReports, inProgressReports] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({
        status: { $in: ['assigned', 'in_progress', 'awaiting_verification'] }
      })
    ]);

    const resolutionRate =
      totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 100;

    return res.status(200).json({
      success: true,
      stats: {
        totalReports,
        resolvedReports,
        inProgressReports,
        resolutionRate
      }
    });
  } catch (error) {
    console.error('[Public Impact Stats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve public impact statistics.'
    });
  }
};

export default {
  createComplaint,
  getMyComplaints,
  getMyComplaintSummary,
  getComplaintById,
  updateComplaintStatus,
  getPublicImpactStats
};

