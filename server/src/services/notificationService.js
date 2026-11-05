import Notification from '../models/Notification.js';

/**
 * CleanLoop Notification Service
 * Reusable, resilient notification generator for citizen and operational alerts.
 * Implements deduplication and failsafe exception handling.
 */

/**
 * Creates a notification record for a user.
 * Catches any persistence error to prevent breaking the primary workflow.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.userId - Recipient user ID
 * @param {string} params.title - Short, descriptive notification header
 * @param {string} params.message - Detailed explanation or context
 * @param {string} params.type - Enum: 'complaint_update' | 'assignment' | 'resolution' | 'reopen_request' | 'reward' | 'system'
 * @param {string|mongoose.Types.ObjectId} [params.relatedComplaintId] - Optional related complaint ID
 * @returns {Promise<Notification|null>} Created notification or null if failed/deduplicated
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'complaint_update',
  relatedComplaintId = null
}) => {
  try {
    if (!userId || !title || !message) {
      console.warn('[NotificationService] Missing required parameters:', { userId, title });
      return null;
    }

    // Deduplication check: If an identical notification was sent for this user & complaint within the last 10 seconds, suppress it
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const existingRecent = await Notification.findOne({
      user: userId,
      title,
      type,
      ...(relatedComplaintId ? { relatedComplaint: relatedComplaintId } : {}),
      createdAt: { $gte: tenSecondsAgo }
    }).lean();

    if (existingRecent) {
      console.log(`[NotificationService] Suppressed duplicate notification for user ${userId}: "${title}"`);
      return null;
    }

    const notification = new Notification({
      user: userId,
      title: title.trim(),
      message: message.trim(),
      type,
      relatedComplaint: relatedComplaintId || null,
      isRead: false
    });

    await notification.save();
    return notification;
  } catch (err) {
    // Non-blocking resilience: Log warning but do not throw to caller
    console.error('[NotificationService Error]: Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Notify citizen when a complaint is initially filed
 */
export const notifyComplaintSubmitted = async (complaint, user) => {
  return createNotification({
    userId: complaint.user || user._id,
    title: 'Report Received',
    message: `Your waste report (${complaint.complaintCode}) has been registered and is queued for municipal review.`,
    type: 'system',
    relatedComplaintId: complaint._id
  });
};

/**
 * Notify citizen when status changes across the civic lifecycle
 */
export const notifyStatusChanged = async (
  complaint,
  { oldStatus, newStatus, note, rejectionReason }
) => {
  const code = complaint.complaintCode;
  let title = 'Report Status Updated';
  let message = `The status of report ${code} has transitioned to ${newStatus.replace(/_/g, ' ')}.`;
  let type = 'complaint_update';

  switch (newStatus) {
    case 'under_review':
      title = 'Report Under Review';
      message = `Your report (${code}) is now actively being reviewed by municipal sanitation dispatchers.`;
      type = 'complaint_update';
      break;

    case 'assigned':
      title = 'Sanitation Crew Assigned';
      message = `A municipal waste collection crew has been dispatched to handle report (${code}).`;
      type = 'assignment';
      break;

    case 'in_progress':
      title = 'Cleanup In Progress';
      message = `Field workers have commenced cleanup operations for report (${code}).`;
      type = 'complaint_update';
      break;

    case 'awaiting_verification':
      title = 'Awaiting Final Verification';
      message = `Sanitation crew has completed waste collection for (${code}). Final supervisory audit is underway.`;
      type = 'complaint_update';
      break;

    case 'resolved':
      title = 'Report Verified & Resolved';
      message = `Your waste report (${code}) has been verified and fully cleared. Thank you for keeping your city clean!`;
      type = 'resolution';
      break;

    case 'rejected':
      title = 'Report Rejected';
      message = rejectionReason
        ? `Your report (${code}) could not be processed. Reason: ${rejectionReason}`
        : `Your report (${code}) was reviewed and rejected. Check report details for instructions.`;
      type = 'complaint_update';
      break;

    case 'reopen_requested':
      title = 'Reopen Request Logged';
      message = `Your request to reopen complaint (${code}) has been received and is awaiting audit review.`;
      type = 'reopen_request';
      break;

    default:
      break;
  }

  if (note && newStatus !== 'rejected') {
    message += ` Note: ${note}`;
  }

  return createNotification({
    userId: complaint.user,
    title,
    message,
    type,
    relatedComplaintId: complaint._id
  });
};

/**
 * Notify citizen when Green Points are credited for a verified resolution
 */
export const notifyRewardEarned = async ({ userId, points, complaintCode, relatedComplaintId }) => {
  return createNotification({
    userId,
    title: 'Green Points Awarded!',
    message: `You earned +${points} Green Points for verified resolution of report (${complaintCode}). Thank you for keeping your community clean!`,
    type: 'reward',
    relatedComplaintId
  });
};

/**
 * Notify citizen when a new achievement badge is unlocked
 */
export const notifyBadgeUnlocked = async ({ userId, badgeTitle, badgeDescription }) => {
  return createNotification({
    userId,
    title: `Achievement Unlocked: ${badgeTitle}!`,
    message: `Congratulations! You unlocked the "${badgeTitle}" badge. ${badgeDescription}`,
    type: 'reward'
  });
};

export default {
  createNotification,
  notifyComplaintSubmitted,
  notifyStatusChanged,
  notifyRewardEarned,
  notifyBadgeUnlocked
};

