import { Router } from 'express';
import {
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
} from '../controllers/adminController.js';
import {
  getAdminMapComplaints,
  getAdminMapAnalytics
} from '../controllers/mapAnalyticsController.js';
import {
  verifyComplaintResolution,
  getAdminRewardRules,
  createAdminRewardRule,
  updateAdminRewardRule,
  getAdminRewardHistory,
  getAdminCitizenRewardInspect
} from '../controllers/adminRewardController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Strict security: Every endpoint in this router requires authenticated admin
router.use(verifyToken, requireRole('admin'));

// 1. Dashboard Metrics
router.get('/dashboard', getAdminDashboardStats);

// 2. Complaint Triage & Review
router.get('/complaints', getAdminComplaints);
router.get('/complaints/:id', getAdminComplaintById);
router.patch('/complaints/:id/review', reviewComplaint);
router.patch('/complaints/:id/reject', rejectComplaint);
router.patch('/complaints/:id/priority', updateOperationalPriority);

// 3. Collector Management
router.get('/collectors', getCollectors);
router.post('/collectors', createCollector);
router.patch('/collectors/:id', updateCollector);
router.patch('/collectors/:id/availability', updateCollectorAvailability);
router.patch('/collectors/:id/activation', toggleCollectorActivation);

// 4. Task Allocations & Assignments
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.patch('/assignments/:id/reassign', reassignAssignment);

// 5. Activity Log Audit Ledger
router.get('/activity', getAdminActivityLogs);

// 6. Spatial Map & Geographic Analytics
router.get('/map/complaints', getAdminMapComplaints);
router.get('/map/analytics', getAdminMapAnalytics);

// 7. Cleanup Verification & Reward Management
router.patch('/complaints/:id/verify-resolution', verifyComplaintResolution);
router.get('/rewards/rules', getAdminRewardRules);
router.post('/rewards/rules', createAdminRewardRule);
router.patch('/rewards/rules/:id', updateAdminRewardRule);
router.get('/rewards/history', getAdminRewardHistory);
router.get('/rewards/citizens/:userId', getAdminCitizenRewardInspect);

export default router;

