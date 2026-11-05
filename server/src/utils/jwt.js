import jwt from 'jsonwebtoken';

/**
 * CleanLoop JWT Utility
 * Generates and validates signed JSON Web Tokens for session-based API authorization.
 */

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error(
      '[JWT Config Error] JWT_SECRET environment variable is missing in server/.env. ' +
      'Please define a strong random secret key.'
    );
  }
  return secret;
};

/**
 * Generates a signed JWT for an authenticated user.
 * Claims include ONLY minimal required claims:
 * - sub: user._id string
 * - role: user.role
 * @param {Object} user - User document or object with _id and role
 * @returns {string} Signed JWT string
 */
export const generateToken = (user) => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  const payload = {
    sub: user._id ? user._id.toString() : user.id,
    role: user.role
  };

  return jwt.sign(payload, secret, {
    expiresIn,
    algorithm: 'HS256'
  });
};

/**
 * Verifies a JWT token signature and expiration
 * @param {string} token
 * @returns {Object} Decoded payload
 */
export const verifyJwtToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
};

export default {
  generateToken,
  verifyJwtToken
};

