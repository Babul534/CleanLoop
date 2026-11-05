import mongoose from 'mongoose';
import Assignment from '../models/Assignment.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteCloudinaryAsset
} from '../config/cloudinary.js';
import {
  createNotification,
  notifyStatusChanged
} from '../services/notificationService.js';

/**
 * CleanLoop Waste Collector Controller
 * Manages field task acceptance, in-progress tracking, photographic completion evidence submission,
 * and collector availability status with strict tenancy and security validation.
 */

// -----------------------------------------------------------------------------
// 1. COLLECTOR DASHBOARD AGGREGATE METRICS
// -----------------------------------------------------------------------------

export const getCollectorDashboardStats = async (req, res) => {
  try {
    const collectorId = req.user._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Parallel count queries across real MongoDB records
    const [
      totalAssigned,
      newAssignments,
      accepted,
      inProgress,
      submittedForVerification,
      completed,
      todayCompleted
    ] = await Promise.all([
      // Total assigned excluding cancelled/reassigned
      Assignment.countDocuments({
        collector: collectorId,
        status: { $nin: ['cancelled', 'reassigned'] }
      }),
      // New assignments awaiting acceptance
      Assignment.countDocuments({
        collector: collectorId,
        status: 'assigned'
      }),
      // Accepted tasks awaiting commencement
      Assignment.countDocuments({
        collector: collectorId,
        status: 'accepted'
      }),
      // Tasks currently in progress
      Assignment.countDocuments({
        collector: collectorId,
        status: 'in_progress'
      }),
      // Tasks submitted for supervisory audit
      Assignment.countDocuments({
        collector: collectorId,
        status: 'submitted_for_verification'
      }),
      // Completed verified tasks (do not count rejected or cancelled)
      Assignment.countDocuments({
        collector: collectorId,
        status: 'verified'
      }),
      // Today's completed tasks
      Assignment.countDocuments({
        collector: collectorId,
        status: 'verified',
        verifiedAt: { $gte: startOfToday }
      })
    ]);

    // Feed items
    const [
      newAssignmentsList,
      currentActiveTask,
      upcomingTasks,
      recentCompletedTasks
    ] = await Promise.all([
      // New assignments awaiting acceptance
      Assignment.find({ collector: collectorId, status: 'assigned' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
          path: 'complaint',
          select: 'complaintCode category priority reportedPriority location description createdAt images'
        })
        .lean(),

      // Current active task (in_progress first, or accepted if none)
      Assignment.findOne({
        collector: collectorId,
        status: { $in: ['in_progress', 'accepted'] }
      })
        .sort({ status: 1, startedAt: -1, acceptedAt: -1, createdAt: -1 }) // 'in_progress' precedes 'accepted' alphabetically or sort
        .populate({
          path: 'complaint',
          select: 'complaintCode category priority reportedPriority location description images createdAt'
        })
        .lean(),

      // Upcoming accepted work
      Assignment.find({ collector: collectorId, status: 'accepted' })
        .sort({ acceptedAt: -1, createdAt: -1 })
        .limit(5)
        .populate({
          path: 'complaint',
          select: 'complaintCode category priority reportedPriority location description createdAt'
        })
        .lean(),

      // Recent verified completions
      Assignment.find({ collector: collectorId, status: 'verified' })
        .sort({ verifiedAt: -1, updatedAt: -1 })
        .limit(5)
        .populate({
          path: 'complaint',
          select: 'complaintCode category priority location resolvedAt'
        })
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        newAssignments,
        accepted,
        inProgress,
        submittedForVerification,
        completed,
        todayCompleted
      },
      currentActiveTask: currentActiveTask || null,
      newAssignmentsList,
      upcomingTasks,
      recentCompletedTasks,
      availability: req.user.availability || 'available'
    });
  } catch (error) {
    console.error('[Collector Dashboard Stats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate collector metrics.'
    });
  }
};

// -----------------------------------------------------------------------------
// 2. MY ASSIGNED TASKS (FILTERABLE & PAGINATED)
// -----------------------------------------------------------------------------

export const getCollectorTasks = async (req, res) => {
  try {
    const collectorId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { status, priority, search } = req.query;

    const query = { collector: collectorId };

    if (status && status !== 'all') {
      const normalizedStatus = status === 'completed' ? 'verified' : status;
      query.status = normalizedStatus;
    }

    const totalCount = await Assignment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const skip = (page - 1) * limit;

    let assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'complaint',
        select: 'complaintCode category priority reportedPriority location description status createdAt images'
      })
      .populate('assignedBy', 'name role')
      .lean();

    // In-memory filter for search / priority if provided
    if (priority && priority !== 'all') {
      assignments = assignments.filter(
        (a) => a.complaint && a.complaint.priority === priority.toLowerCase()
      );
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim().toLowerCase();
      assignments = assignments.filter((a) => {
        if (!a.complaint) return false;
        const code = (a.complaint.complaintCode || '').toLowerCase();
        const address = (a.complaint.location?.address?.formattedAddress || '').toLowerCase();
        const category = (a.complaint.category || '').toLowerCase();
        return code.includes(term) || address.includes(term) || category.includes(term);
      });
    }

    return res.status(200).json({
      success: true,
      tasks: assignments,
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
    console.error('[Collector Tasks Query Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve assigned tasks.'
    });
  }
};

// -----------------------------------------------------------------------------
// 3. TASK DETAIL BY ID (WITH STRICT OWNERSHIP ENFORCEMENT)
// -----------------------------------------------------------------------------

export const getCollectorTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment identifier format.'
      });
    }

    const assignment = await Assignment.findById(id)
      .populate({
        path: 'complaint',
        select: 'complaintCode category priority reportedPriority location description status images statusHistory createdAt'
      })
      .populate('assignedBy', 'name role')
      .lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Task assignment record not found.'
      });
    }

    // Strict ownership verification: Collector can only view their own tasks
    if (assignment.collector.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to view another collector’s assignment.'
      });
    }

    return res.status(200).json({
      success: true,
      task: assignment
    });
  } catch (error) {
    console.error('[Collector Task Detail Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve task details.'
    });
  }
};

// -----------------------------------------------------------------------------
// 4. ACCEPT TASK
// -----------------------------------------------------------------------------

export const acceptTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment identifier.' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found.' });
    }

    if (assignment.collector.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot accept another collector’s task.'
      });
    }

    if (assignment.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept assignment with status '${assignment.status}'. Only newly assigned tasks can be accepted.`
      });
    }

    const complaint = await Complaint.findById(assignment.complaint);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Associated complaint record not found.' });
    }

    // Update assignment status
    assignment.status = 'accepted';
    assignment.acceptedAt = new Date();
    await assignment.save();

    // Record status history on complaint
    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user._id,
      note: `Task accepted by field collector ${req.user.name}`,
      changedAt: new Date()
    });
    await complaint.save();

    // Log to ActivityLog
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'ASSIGNMENT_ACCEPTED',
        entityType: 'Assignment',
        entityId: assignment._id,
        description: `Collector ${req.user.name} accepted task for report ${complaint.complaintCode}`,
        metadata: { complaintId: complaint._id }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    // Failsafe notification to supervisor
    try {
      if (assignment.assignedBy) {
        await createNotification({
          userId: assignment.assignedBy,
          title: 'Task Accepted by Field Crew',
          message: `Collector ${req.user.name} accepted remediation assignment for (${complaint.complaintCode}).`,
          type: 'assignment',
          relatedComplaintId: complaint._id
        });
      }
    } catch (notifErr) {
      console.warn('[Notification Error]:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment accepted successfully. You may now commence cleanup on site.',
      task: assignment
    });
  } catch (error) {
    console.error('[Collector Accept Task Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process task acceptance.'
    });
  }
};

// -----------------------------------------------------------------------------
// 5. START TASK
// -----------------------------------------------------------------------------

export const startTask = async (req, res) => {
  let uploadedBeforeAssets = [];
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment identifier.' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found.' });
    }

    if (assignment.collector.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot start work on another collector’s task.'
      });
    }

    if (assignment.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: `Task must be in 'accepted' state to begin work. Current status is '${assignment.status}'.`
      });
    }

    const complaint = await Complaint.findById(assignment.complaint);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Associated complaint record not found.' });
    }

    // Process optional before-photos if attached
    if (req.files && req.files.length > 0) {
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          success: false,
          message: 'Cloudinary storage service is not configured on the server.'
        });
      }

      for (const file of req.files) {
        const uploadRes = await uploadBufferToCloudinary(file.buffer, {
          folder: 'cleanloop/before-work',
          tags: ['cleanloop', 'before-work', assignment._id.toString()]
        });
        uploadedBeforeAssets.push(uploadRes);
      }
      assignment.beforeImages = uploadedBeforeAssets;
    }

    // Update assignment
    assignment.status = 'in_progress';
    assignment.startedAt = new Date();
    await assignment.save();

    // Transition complaint status to in_progress
    const previousStatus = complaint.status;
    complaint.status = 'in_progress';
    complaint.statusHistory.push({
      status: 'in_progress',
      previousStatus,
      changedBy: req.user._id,
      note: 'Field collector arrived on site and commenced cleanup operations',
      changedAt: new Date()
    });
    await complaint.save();

    // Automatically set collector availability to busy
    try {
      req.user.availability = 'busy';
      await req.user.save();
    } catch (availErr) {
      console.warn('[Collector Availability Update Warning]:', availErr.message);
    }

    // Log to ActivityLog
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'TASK_STARTED',
        entityType: 'Assignment',
        entityId: assignment._id,
        description: `Collector ${req.user.name} commenced cleanup operations for report ${complaint.complaintCode}`,
        metadata: { complaintId: complaint._id }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    // Notify citizen that cleanup is underway
    try {
      await notifyStatusChanged(complaint, {
        oldStatus: previousStatus,
        newStatus: 'in_progress',
        note: 'Field crew has arrived on site and begun waste clearance.'
      });
    } catch (notifErr) {
      console.warn('[Notification Error]:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Work commenced. Incident status updated to In Progress.',
      task: assignment
    });
  } catch (error) {
    // Rollback any before-images uploaded during this failed invocation
    if (uploadedBeforeAssets.length > 0) {
      for (const asset of uploadedBeforeAssets) {
        try {
          await deleteCloudinaryAsset(asset.publicId);
        } catch (_) {}
      }
    }

    console.error('[Collector Start Task Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record task commencement.'
    });
  }
};

// -----------------------------------------------------------------------------
// 6. SUBMIT COMPLETED WORK (WITH PHOTO EVIDENCE & SUPERVISORY ROUTING)
// -----------------------------------------------------------------------------

export const submitTaskVerification = async (req, res) => {
  let uploadedEvidenceAssets = [];
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment identifier.' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found.' });
    }

    if (assignment.collector.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot submit work for another collector’s task.'
      });
    }

    if (assignment.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Only tasks in 'in_progress' state can be submitted for verification. Current status is '${assignment.status}'.`
      });
    }

    const complaint = await Complaint.findById(assignment.complaint);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Associated complaint record not found.' });
    }

    // Photographic Evidence Validation: Must have at least 1 image
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one photo evidence of completed remediation is required.'
      });
    }

    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'You cannot upload more than 5 evidence photographs.'
      });
    }

    // Verify Cloudinary is operational
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message:
          'Cloudinary service is not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.'
      });
    }

    // Upload completion evidence photographs to Cloudinary
    for (const file of req.files) {
      const uploadRes = await uploadBufferToCloudinary(file.buffer, {
        folder: 'cleanloop/completions',
        tags: ['cleanloop', 'completion', assignment._id.toString()]
      });
      uploadedEvidenceAssets.push(uploadRes);
    }

    // Update Assignment
    assignment.status = 'submitted_for_verification';
    assignment.submittedAt = new Date();
    assignment.completionImages = uploadedEvidenceAssets;
    if (notes && typeof notes === 'string') {
      assignment.notes = notes.trim();
    }
    await assignment.save();

    // Transition Complaint: awaiting_verification
    // Note: Collectors NEVER set status directly to 'resolved'
    const previousStatus = complaint.status;
    complaint.status = 'awaiting_verification';
    complaint.statusHistory.push({
      status: 'awaiting_verification',
      previousStatus,
      changedBy: req.user._id,
      note: notes ? notes.trim() : 'Sanitation cleanup completed; evidence submitted for supervisory verification',
      changedAt: new Date()
    });
    await complaint.save();

    // Check if collector has remaining tasks in progress; if none, restore availability to available
    try {
      const remainingActive = await Assignment.countDocuments({
        collector: req.user._id,
        status: 'in_progress',
        _id: { $ne: assignment._id }
      });
      if (remainingActive === 0) {
        req.user.availability = 'available';
        await req.user.save();
      }
    } catch (availErr) {
      console.warn('[Collector Workload Availability Warning]:', availErr.message);
    }

    // Log to ActivityLog
    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'TASK_SUBMITTED_FOR_VERIFICATION',
        entityType: 'Assignment',
        entityId: assignment._id,
        description: `Collector ${req.user.name} submitted remediation evidence for report ${complaint.complaintCode}`,
        metadata: {
          complaintId: complaint._id,
          photosCount: uploadedEvidenceAssets.length,
          notes: notes ? notes.trim() : null
        }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    // Citizen Notification: Awaiting verification
    try {
      await notifyStatusChanged(complaint, {
        oldStatus: previousStatus,
        newStatus: 'awaiting_verification',
        note: notes ? notes.trim() : 'Waste pickup completed by field crew. Awaiting municipal audit approval.'
      });
    } catch (notifErr) {
      console.warn('[Citizen Notification Error]:', notifErr.message);
    }

    // Administrative Supervisor Notification: Action required
    try {
      if (assignment.assignedBy) {
        await createNotification({
          userId: assignment.assignedBy,
          title: 'Remediation Ready for Audit',
          message: `Collector ${req.user.name} submitted completion evidence for report (${complaint.complaintCode}). Verification review required.`,
          type: 'assignment',
          relatedComplaintId: complaint._id
        });
      }
    } catch (adminNotifErr) {
      console.warn('[Admin Notification Error]:', adminNotifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Work evidence submitted successfully. Task is now awaiting administrative audit.',
      task: assignment
    });
  } catch (error) {
    // Failsafe Rollback: Delete any freshly uploaded Cloudinary assets so no orphaned files remain
    if (uploadedEvidenceAssets.length > 0) {
      for (const asset of uploadedEvidenceAssets) {
        try {
          await deleteCloudinaryAsset(asset.publicId);
        } catch (cleanupErr) {
          console.warn('[Cloudinary Rollback Warning]:', cleanupErr.message);
        }
      }
    }

    console.error('[Collector Submit Verification Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit verification evidence.'
    });
  }
};

// -----------------------------------------------------------------------------
// 7. UPDATE COLLECTOR AVAILABILITY
// -----------------------------------------------------------------------------

export const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability || !['available', 'busy', 'unavailable'].includes(availability.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability value. Allowed options: 'available', 'busy', 'unavailable'."
      });
    }

    const previousAvailability = req.user.availability;
    req.user.availability = availability.toLowerCase();
    await req.user.save();

    try {
      await ActivityLog.create({
        actor: req.user._id,
        action: 'COLLECTOR_AVAILABILITY_UPDATED',
        entityType: 'User',
        entityId: req.user._id,
        description: `Collector updated availability from ${previousAvailability} to ${req.user.availability}`,
        metadata: { previousAvailability, newAvailability: req.user.availability }
      });
    } catch (auditErr) {
      console.warn('[ActivityLog Error]:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Availability status updated to '${req.user.availability}'.`,
      availability: req.user.availability
    });
  } catch (error) {
    console.error('[Collector Update Availability Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update availability status.'
    });
  }
};

export default {
  getCollectorDashboardStats,
  getCollectorTasks,
  getCollectorTaskById,
  acceptTask,
  startTask,
  submitTaskVerification,
  updateAvailability
};

