import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import { hashPassword, validateAdminPasswordStrength } from '../utils/password.js';

// Load environment variables reliably from server/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * CleanLoop Secure Admin Provisioning Script
 * Strictly provisions the initial administrator account from environment variables.
 * Never logs credentials or exposes an HTTP creation endpoint.
 */
const provisionAdmin = async () => {
  console.log('====================================================');
  console.log(' CleanLoop Secure Administrator Account Provisioning');
  console.log('====================================================');

  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  // 1. Validate presence of environment variables
  if (!name || !email || !password) {
    console.error('\n[Configuration Missing]');
    console.error('Administrator bootstrap credentials must be configured in server/.env:');
    console.error('  ADMIN_NAME="Your Admin Name"');
    console.error('  ADMIN_EMAIL="admin@cleanloop.internal"');
    console.error('  ADMIN_PASSWORD="YourStrongPassword123" (min 12 characters)\n');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 2. Validate email format
  if (!emailRegex.test(normalizedEmail)) {
    console.error(`\n[Validation Error] Invalid admin email format: ${normalizedEmail}`);
    process.exit(1);
  }

  // 3. Validate password strength
  const passwordCheck = validateAdminPasswordStrength(password);
  if (!passwordCheck.isValid) {
    console.error(`\n[Validation Error] ${passwordCheck.message}`);
    process.exit(1);
  }

  try {
    // 4. Connect to database
    await connectDB();

    // 5. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`\n[Notice] An administrator account already exists for ${normalizedEmail}.`);
        console.log('[Notice] No changes were made to existing records.');
        await closeDB();
        process.exit(0);
      } else {
        console.error(
          `\n[Security Alert] Email ${normalizedEmail} is already registered with role '${existingUser.role}'.`
        );
        console.error('Refusing to overwrite existing user role.');
        await closeDB();
        process.exit(1);
      }
    }

    // 6. Hash password with bcryptjs (12 salt rounds)
    const hashedPassword = await hashPassword(password);

    // 7. Create admin account
    const adminUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: 'admin',
      accountStatus: 'active'
    });

    console.log('\n[Success] Administrator account provisioned successfully!');
    console.log(`[Account] ID    : ${adminUser._id}`);
    console.log(`[Account] Name  : ${adminUser.name}`);
    console.log(`[Account] Email : ${adminUser.email}`);
    console.log(`[Account] Role  : ${adminUser.role}`);
    console.log(`[Account] Status: ${adminUser.accountStatus}`);
    console.log('\n[Security] Password was securely hashed and zero secrets were displayed.');

    await closeDB();
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n[Provisioning Error]:', error.message);
    try {
      await closeDB();
    } catch (_) {}
    process.exit(1);
  }
};

provisionAdmin();

