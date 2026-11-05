import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

/**
 * CleanLoop Notification Controller
 * Manages user in-app notification retrieval, unread counts, and read status updates.
 * Strictly enforces user ownership across all endpoints.
 */

/**
 * Get paginated notifications for the authenticated user
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const unreadOnly = req.query.unreadOnly === 'true';

    const filter = { user: req.user._id };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const [totalCount, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('relatedComplaint', 'complaintCode category status')
        .lean()
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
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
    console.error('[Get Notifications Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.'
    });
  }
};

/**
 * Get real-time unread notification count for the authenticated user
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('[Get Unread Count Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notification count.'
    });
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification identifier.'
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification record not found.'
      });
    }

    // Strict ownership verification: cannot mark someone else's notification as read
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: you cannot modify another user\'s notification.'
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification
    });
  } catch (error) {
    console.error('[Mark Notification Read Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification status.'
    });
  }
};

/**
 * Mark all notifications belonging to the authenticated user as read
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      updatedCount: result.modifiedCount || 0
    });
  } catch (error) {
    console.error('[Mark All Read Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read.'
    });
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
};

