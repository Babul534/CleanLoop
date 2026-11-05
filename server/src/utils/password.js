import bcrypt from 'bcryptjs';

/**
 * CleanLoop Password Utility
 * Secure password hashing, verification, and complexity validation using bcryptjs.
 */

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Validates password complexity for citizen registration:
 * - Minimum 8 characters
 * - Maximum 64 characters
 * - At least one letter
 * - At least one numeric digit
 * @param {string} password
 * @returns {{isValid: boolean, message?: string}}
 */
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (password.length > 64) {
    return { isValid: false, message: 'Password cannot exceed 64 characters' };
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain at least one letter and one number'
    };
  }

  return { isValid: true };
};

/**
 * Validates admin password strength during provisioning:
 * - Minimum 12 characters
 * - At least one letter and one number
 * @param {string} password
 * @returns {{isValid: boolean, message?: string}}
 */
export const validateAdminPasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Admin password is required' };
  }

  if (password.length < 12) {
    return { isValid: false, message: 'Admin password must be at least 12 characters long' };
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: 'Admin password must contain at least one letter and one number'
    };
  }

  return { isValid: true };
};

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds
 * @param {string} password
 * @returns {Promise<string>}
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a candidate plaintext password against a stored bcrypt hash
 * @param {string} candidatePassword
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (candidatePassword, storedHash) => {
  if (!candidatePassword || !storedHash) return false;
  return bcrypt.compare(candidatePassword, storedHash);
};

export default {
  validatePasswordStrength,
  validateAdminPasswordStrength,
  hashPassword,
  comparePassword
};

