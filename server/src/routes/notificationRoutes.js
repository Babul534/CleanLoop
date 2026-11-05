import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

// All notification endpoints require authenticated user
router.use(verifyToken);

// GET /api/notifications/unread-count - Unread count for badge
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', markAllNotificationsAsRead);

// GET /api/notifications - Paginated notifications
router.get('/', getNotifications);

// PATCH /api/notifications/:id/read - Mark one as read
router.patch('/:id/read', markNotificationAsRead);

export default router;

