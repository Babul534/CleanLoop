import { verifyJwtToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Validates bearer JWT, queries active database record, and attaches user to request.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required. Please sign in.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token || !token.trim()) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authorization token.'
      });
    }

    // Verify token signature and expiration
    let decoded;
    try {
      decoded = verifyJwtToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or corrupted authorization token.'
      });
    }

    // Database lookup to guarantee user still exists and role/status is current
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or has been removed.'
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended. Please contact municipal administration.'
      });
    }

    // Attach safe user document to request
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authorization error.'
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Verifies that the authenticated user possesses one of the required roles.
 * Never trusts client headers or unverified body claims.
 * @param  {...string} allowedRoles - e.g. 'admin', 'collector', 'user'
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: insufficient role permissions for this resource.'
      });
    }

    next();
  };
};

export default {
  verifyToken,
  requireRole
};

