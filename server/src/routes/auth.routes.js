import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerLimiter, register);

// POST /api/auth/login
router.post('/login', loginLimiter, login);

// GET /api/auth/me
router.get('/me', verifyToken, getCurrentUser);

export default router;

