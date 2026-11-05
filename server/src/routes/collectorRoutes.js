import { Router } from 'express';
import {
  getCollectorDashboardStats,
  getCollectorTasks,
  getCollectorTaskById,
  acceptTask,
  startTask,
  submitTaskVerification,
  updateAvailability
} from '../controllers/collectorController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import {
  handleEvidenceImages,
  handleOptionalImages
} from '../middleware/uploadMiddleware.js';

const router = Router();

// Protect all collector endpoints: Requires authentication and 'collector' role
router.use(verifyToken, requireRole('collector'));

// 1. Dashboard Aggregate Metrics
router.get('/dashboard', getCollectorDashboardStats);

// 2. My Assigned Tasks Query
router.get('/tasks', getCollectorTasks);

// 3. Task Detail by Assignment ID
router.get('/tasks/:id', getCollectorTaskById);

// 4. Task State Machine Transitions
router.patch('/tasks/:id/accept', acceptTask);
router.patch('/tasks/:id/start', handleOptionalImages, startTask);
router.patch('/tasks/:id/submit', handleEvidenceImages, submitTaskVerification);
router.post('/tasks/:id/submit', handleEvidenceImages, submitTaskVerification);

// 5. Collector Self-Service Availability Control
router.patch('/availability', updateAvailability);

export default router;

