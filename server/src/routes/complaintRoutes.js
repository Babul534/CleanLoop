import { Router } from 'express';
import {
  createComplaint,
  getMyComplaints,
  getMyComplaintSummary,
  getComplaintById,
  updateComplaintStatus,
  getPublicImpactStats
} from '../controllers/complaintController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import { handleComplaintImages } from '../middleware/uploadMiddleware.js';
import { reportLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/complaints/public/impact - Public impact metrics for homepage (no auth required)
router.get('/public/impact', getPublicImpactStats);

// POST /api/complaints - Submit complaint (citizen only, rate limited, signed image upload)
router.post(
  '/',
  verifyToken,
  requireRole('user'),
  reportLimiter,
  handleComplaintImages,
  createComplaint
);

// GET /api/complaints/my/summary - Statistical counts for logged-in citizen
// (Must be defined before /:id to prevent path collision)
router.get('/my/summary', verifyToken, requireRole('user'), getMyComplaintSummary);

// GET /api/complaints/my - Paginated list of complaints for logged-in citizen
router.get('/my', verifyToken, requireRole('user'), getMyComplaints);

// GET /api/complaints/:id - View single complaint details
router.get('/:id', verifyToken, getComplaintById);

// PATCH /api/complaints/:id/status - Update complaint status (admin/collector only)
router.patch('/:id/status', verifyToken, requireRole('admin', 'collector'), updateComplaintStatus);

export default router;

