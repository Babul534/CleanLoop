import rateLimit from 'express-rate-limit';

/**
 * Authentication Rate Limiters
 * Mitigates credential stuffing, brute force, and automated registration attacks.
 */

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please wait 15 minutes before retrying.'
  }
});

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 account creation requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts from this IP address. Please wait 15 minutes before retrying.'
  }
});

export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 complaint submissions per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many complaint submissions from this IP address. Please wait a few minutes before reporting again.'
  }
});

export default {
  loginLimiter,
  registerLimiter,
  reportLimiter
};


