import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import complaintRoutes from './complaintRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import collectorRoutes from './collectorRoutes.js';
import rewardRoutes from './rewardRoutes.js';

const router = Router();

// Mount sub-routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/collector', collectorRoutes);
router.use('/rewards', rewardRoutes);


export default router;

