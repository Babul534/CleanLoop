import User from '../models/User.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Citizen Registration
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Basic field presence and type validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must be at least 2 characters long'
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot exceed 100 characters'
      });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // 2. Password strength validation
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message
      });
    }

    // 3. Duplicate email verification
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // 4. Secure password hashing
    const hashedPassword = await hashPassword(password);

    // 5. Enforce immutable citizen role (mitigates privilege escalation)
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword,
      phone: phone && typeof phone === 'string' ? phone.trim() : null,
      role: 'user', // Public registration is ALWAYS 'user'
      accountStatus: 'active'
    });

    // 6. Generate signed JWT token
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('[Registration Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during registration. Please try again.'
    });
  }
};

/**
 * User Login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and explicitly select passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      // Constant-time/generic error prevents account enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify bcrypt password hash
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check account status
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact municipal administration.'
      });
    }

    // Generate token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login. Please try again.'
    });
  }
};

/**
 * Get Current Authenticated User Profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is guaranteed by verifyToken middleware
    const user = req.user;

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        phone: user.phone || null,
        availability: user.role === 'collector' ? user.availability : undefined,
        serviceAreas: user.role === 'collector' ? user.serviceAreas : undefined
      }
    });
  } catch (error) {
    console.error('[Get Current User Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile'
    });
  }
};

export default {
  register,
  login,
  getCurrentUser
};

