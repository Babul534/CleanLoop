import mongoose from 'mongoose';
import {
  User,
  Complaint,
  Assignment,
  Notification,
  Feedback,
  PointsTransaction,
  ActivityLog
} from '../models/index.js';

/**
 * CleanLoop Schema Validation Test Suite
 * Validates Mongoose schema constraints, enums, regexes, and subdocuments
 * completely in-memory without connecting to or mutating MongoDB.
 */

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assertValidation = async (description, modelInstance, shouldPass, expectedErrorField = null) => {
  totalTests++;
  try {
    await modelInstance.validate();
    if (shouldPass) {
      passedTests++;
      console.log(`  [PASS] ${description}`);
    } else {
      failedTests++;
      console.error(`  [FAIL] ${description} -> Expected validation error on '${expectedErrorField}', but passed.`);
    }
  } catch (err) {
    if (!shouldPass) {
      if (expectedErrorField && (!err.errors || !err.errors[expectedErrorField])) {
        failedTests++;
        console.error(
          `  [FAIL] ${description} -> Got error, but not for expected field '${expectedErrorField}'. Actual:`,
          err.errors ? Object.keys(err.errors) : err.message
        );
      } else {
        passedTests++;
        console.log(`  [PASS] ${description}`);
      }
    } else {
      failedTests++;
      console.error(`  [FAIL] ${description} -> Unexpected validation error:`, err.message);
    }
  }
};

const runSchemaTests = async () => {
  console.log('====================================================');
  console.log(' CleanLoop Schema-Level Integrity Verification');
  console.log('====================================================\n');

  const validUserId = new mongoose.Types.ObjectId();
  const validComplaintId = new mongoose.Types.ObjectId();
  const validCollectorId = new mongoose.Types.ObjectId();
  const validAdminId = new mongoose.Types.ObjectId();

  // ----------------------------------------------------
  // 1. USER SCHEMA TESTS
  // ----------------------------------------------------
  console.log('1. User Schema Tests:');

  await assertValidation(
    'Accepts valid citizen user document',
    new User({
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz01234567890',
      role: 'user'
    }),
    true
  );

  await assertValidation(
    'Accepts valid collector user with availability & service areas',
    new User({
      name: 'Ramesh Kumar',
      email: 'ramesh.collector@cleanloop.internal',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz01234567890',
      role: 'collector',
      availability: 'available',
      serviceAreas: ['Ward 04', 'Central Sector']
    }),
    true
  );

  await assertValidation(
    'Rejects missing required name',
    new User({
      email: 'valid@example.com',
      passwordHash: 'hash123'
    }),
    false,
    'name'
  );

  await assertValidation(
    'Rejects invalid email format',
    new User({
      name: 'John Doe',
      email: 'not-an-email',
      passwordHash: 'hash123'
    }),
    false,
    'email'
  );

  await assertValidation(
    'Rejects invalid role enum',
    new User({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hash123',
      role: 'superhero'
    }),
    false,
    'role'
  );

  // ----------------------------------------------------
  // 2. COMPLAINT SCHEMA TESTS
  // ----------------------------------------------------
  console.log('\n2. Complaint Schema Tests:');

  await assertValidation(
    'Accepts valid complaint with GeoJSON coordinates and category',
    new Complaint({
      user: validUserId,
      description: 'Major overflow of mixed solid waste near central park entrance.',
      category: 'mixed',
      reportedPriority: 'high',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139], // [lng, lat]
        address: { formattedAddress: 'Park Gate 3, Sector 4' }
      }
    }),
    true
  );

  await assertValidation(
    'Rejects missing description',
    new Complaint({
      user: validUserId,
      category: 'plastic',
      location: { type: 'Point', coordinates: [77.2, 28.6] }
    }),
    false,
    'description'
  );

  await assertValidation(
    'Rejects invalid waste category enum',
    new Complaint({
      user: validUserId,
      description: 'Waste dump on street side.',
      category: 'radioactive_sludge',
      location: { type: 'Point', coordinates: [77.2, 28.6] }
    }),
    false,
    'category'
  );

  await assertValidation(
    'Rejects invalid priority enum',
    new Complaint({
      user: validUserId,
      description: 'Waste dump on street side.',
      category: 'plastic',
      priority: 'emergency_critical',
      location: { type: 'Point', coordinates: [77.2, 28.6] }
    }),
    false,
    'priority'
  );

  await assertValidation(
    'Rejects invalid complaint status enum',
    new Complaint({
      user: validUserId,
      description: 'Waste dump on street side.',
      category: 'plastic',
      status: 'destroyed',
      location: { type: 'Point', coordinates: [77.2, 28.6] }
    }),
    false,
    'status'
  );

  await assertValidation(
    'Rejects invalid GeoJSON coordinates (longitude > 180)',
    new Complaint({
      user: validUserId,
      description: 'Waste dump on street side.',
      category: 'plastic',
      location: {
        type: 'Point',
        coordinates: [210.5, 28.6]
      }
    }),
    false,
    'location.coordinates'
  );

  await assertValidation(
    'Rejects GeoJSON coordinates with wrong array length',
    new Complaint({
      user: validUserId,
      description: 'Waste dump on street side.',
      category: 'plastic',
      location: {
        type: 'Point',
        coordinates: [77.2]
      }
    }),
    false,
    'location.coordinates'
  );

  await assertValidation(
    'Rejects images array exceeding 5 images',
    new Complaint({
      user: validUserId,
      description: 'Waste dump on street side.',
      category: 'plastic',
      location: { type: 'Point', coordinates: [77.2, 28.6] },
      images: [
        { url: 'u1', publicId: 'p1' },
        { url: 'u2', publicId: 'p2' },
        { url: 'u3', publicId: 'p3' },
        { url: 'u4', publicId: 'p4' },
        { url: 'u5', publicId: 'p5' },
        { url: 'u6', publicId: 'p6' }
      ]
    }),
    false,
    'images'
  );

  // ----------------------------------------------------
  // 3. ASSIGNMENT SCHEMA TESTS
  // ----------------------------------------------------
  console.log('\n3. Assignment Schema Tests:');

  await assertValidation(
    'Accepts valid task assignment document',
    new Assignment({
      complaint: validComplaintId,
      collector: validCollectorId,
      assignedBy: validAdminId,
      status: 'assigned',
      notes: 'Please clear before afternoon traffic.'
    }),
    true
  );

  await assertValidation(
    'Rejects assignment without collector reference',
    new Assignment({
      complaint: validComplaintId,
      assignedBy: validAdminId,
      status: 'assigned'
    }),
    false,
    'collector'
  );

  await assertValidation(
    'Rejects invalid assignment status enum',
    new Assignment({
      complaint: validComplaintId,
      collector: validCollectorId,
      assignedBy: validAdminId,
      status: 'abandoned'
    }),
    false,
    'status'
  );

  // ----------------------------------------------------
  // 4. NOTIFICATION SCHEMA TESTS
  // ----------------------------------------------------
  console.log('\n4. Notification Schema Tests:');

  await assertValidation(
    'Accepts valid user notification',
    new Notification({
      user: validUserId,
      title: 'Cleanup Scheduled',
      message: 'A municipal collector has been assigned to your report.',
      type: 'assignment',
      relatedComplaint: validComplaintId
    }),
    true
  );

  await assertValidation(
    'Rejects notification with invalid type enum',
    new Notification({
      user: validUserId,
      title: 'Alert',
      message: 'Some alert message',
      type: 'commercial_offer'
    }),
    false,
    'type'
  );

  // ----------------------------------------------------
  // 5. FEEDBACK SCHEMA TESTS
  // ----------------------------------------------------
  console.log('\n5. Feedback Schema Tests:');

  await assertValidation(
    'Accepts valid 5-star resolution feedback',
    new Feedback({
      complaint: validComplaintId,
      user: validUserId,
      rating: 5,
      comment: 'Very fast and clean resolution, thank you!'
    }),
    true
  );

  await assertValidation(
    'Rejects feedback with rating > 5',
    new Feedback({
      complaint: validComplaintId,
      user: validUserId,
      rating: 6
    }),
    false,
    'rating'
  );

  await assertValidation(
    'Rejects feedback with non-integer rating',
    new Feedback({
      complaint: validComplaintId,
      user: validUserId,
      rating: 4.5
    }),
    false,
    'rating'
  );

  await assertValidation(
    'Rejects feedback with rating < 1',
    new Feedback({
      complaint: validComplaintId,
      user: validUserId,
      rating: 0
    }),
    false,
    'rating'
  );

  // ----------------------------------------------------
  // 6. POINTS TRANSACTION SCHEMA TESTS
  // ----------------------------------------------------
  console.log('\n6. PointsTransaction Schema Tests:');

  await assertValidation(
    'Accepts positive reward points transaction',
    new PointsTransaction({
      user: validUserId,
      complaint: validComplaintId,
      points: 25,
      type: 'complaint_resolved',
      reason: 'Verified resolution reward for incident report',
      idempotencyKey: 'REWARD-CLN-01-USER-99'
    }),
    true
  );

  await assertValidation(
    'Accepts negative administrative adjustment transaction',
    new PointsTransaction({
      user: validUserId,
      points: -10,
      type: 'admin_adjustment',
      reason: 'Administrative correction for duplicate credit'
    }),
    true
  );

  await assertValidation(
    'Rejects points transaction with 0 points',
    new PointsTransaction({
      user: validUserId,
      points: 0,
      type: 'complaint_resolved',
      reason: 'Zero point award'
    }),
    false,
    'points'
  );

  await assertValidation(
    'Rejects points transaction with decimal points',
    new PointsTransaction({
      user: validUserId,
      points: 12.5,
      type: 'complaint_resolved',
      reason: 'Fractional points'
    }),
    false,
    'points'
  );

  await assertValidation(
    'Rejects invalid points transaction type',
    new PointsTransaction({
      user: validUserId,
      points: 50,
      type: 'crypto_airdrop',
      reason: 'Invalid transaction type'
    }),
    false,
    'type'
  );

  // ----------------------------------------------------
  // 7. ACTIVITY LOG SCHEMA TESTS
  // ----------------------------------------------------
  console.log('\n7. ActivityLog Schema Tests:');

  await assertValidation(
    'Accepts valid user activity log entry',
    new ActivityLog({
      actor: validAdminId,
      action: 'ASSIGN_COLLECTOR',
      entityType: 'Assignment',
      entityId: validCollectorId,
      description: 'Admin assigned collector Ramesh to complaint #1042'
    }),
    true
  );

  await assertValidation(
    'Accepts system-automated activity log (actor=null)',
    new ActivityLog({
      actor: null,
      action: 'SYSTEM_STATUS_SYNC',
      entityType: 'Complaint',
      entityId: validComplaintId,
      description: 'Automated 48-hour SLA status check'
    }),
    true
  );

  await assertValidation(
    'Rejects activity log with invalid entityType enum',
    new ActivityLog({
      action: 'UNKNOWN_ACTION',
      entityType: 'CreditCard'
    }),
    false,
    'entityType'
  );

  // Summary
  console.log('\n====================================================');
  console.log(` Test Summary: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
};

runSchemaTests();
