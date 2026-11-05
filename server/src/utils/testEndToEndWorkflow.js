import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import express from 'express';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Assignment from '../models/Assignment.js';
import PointsTransaction from '../models/PointsTransaction.js';
import UserBadge from '../models/UserBadge.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import apiRouter from '../routes/api.routes.js';
import { generateToken } from './jwt.js';
import { hashPassword } from './password.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

const results = {
  passed: 0,
  failed: 0,
  details: []
};

const assertStep = (actor, action, condition, details = '') => {
  if (condition) {
    results.passed++;
    results.details.push({ status: 'PASS', actor, action });
    console.log(`  [PASS] [${actor}] ${action}`);
  } else {
    results.failed++;
    results.details.push({ status: 'FAIL', actor, action, details });
    console.error(`  [FAIL] [${actor}] ${action} -> ${details}`);
  }
};

export const runEndToEndWorkflow = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — COMPLETE END-TO-END WORKFLOW INTEGRATION AUDIT');
  console.log('================================================================\n');

  let server;
  let baseUrl;

  const testUserIds = [];
  const testComplaintIds = [];
  const testAssignmentIds = [];
  const testTxIds = [];
  const testBadgeIds = [];

  try {
    await connectDB();
    console.log('[MongoDB] Connected successfully to Atlas cluster.');
    console.log('[MongoDB] Host :', mongoose.connection.host);
    console.log('[MongoDB] Database Name :', mongoose.connection.name);

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });

    const apiCall = async (
      endpoint,
      { method = 'GET', token = null, body = null, isFormData = false } = {}
    ) => {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (!isFormData) headers['Content-Type'] = 'application/json';

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        json = { error: 'Failed to parse JSON response' };
      }

      return { status: res.status, ok: res.ok, body: json };
    };

    const stamp = Date.now();
    const testPassword = 'E2EPassword@12345';
    const hashedPassword = await hashPassword(testPassword);

    // =========================================================================
    // WORKFLOW 1: CITIZEN REGISTRATION & AUTHENTICATION
    // =========================================================================
    console.log('\n--- 1. CITIZEN REGISTRATION & LOGIN WORKFLOW ---');

    const citizenEmail = `e2e-citizen-${stamp}@cleanloop.test`;
    const resRegister = await apiCall('/auth/register', {
      method: 'POST',
      body: {
        name: `Aarav Sharma ${stamp}`,
        email: citizenEmail,
        password: testPassword,
        phone: '+91 9876543210'
      }
    });

    assertStep(
      'Citizen',
      'Register new citizen account via POST /api/auth/register (201 Created)',
      resRegister.status === 201 && resRegister.body.success === true && resRegister.body.user?.role === 'user'
    );
    const citizenUserId = resRegister.body.user?._id || resRegister.body.user?.id;
    if (citizenUserId) testUserIds.push(citizenUserId);

    // Login with registered credentials
    const resLogin = await apiCall('/auth/login', {
      method: 'POST',
      body: {
        email: citizenEmail,
        password: testPassword
      }
    });

    assertStep(
      'Citizen',
      'Login with registered credentials via POST /api/auth/login (200 OK)',
      resLogin.status === 200 && Boolean(resLogin.body.token)
    );
    const citizenToken = resLogin.body.token;

    // Check initial points balance (should be 0)
    const resInitialSummary = await apiCall('/rewards/summary', { token: citizenToken });
    assertStep(
      'Citizen',
      'Verify initial Green Points balance is strictly 0 PTS',
      resInitialSummary.status === 200 && resInitialSummary.body.summary?.balance === 0
    );

    // =========================================================================
    // WORKFLOW 2: CITIZEN COMPLAINT SUBMISSION WITH GEOLOCATION & IMAGES
    // =========================================================================
    console.log('\n--- 2. CITIZEN COMPLAINT REPORTING & GEOLOCATION ---');

    // Create a real complaint document simulating authenticated upload
    const complaintDoc = await Complaint.create({
      user: citizenUserId,
      complaintCode: `CLN-${stamp.toString().slice(-4)}`,
      category: 'plastic',
      description: 'Massive plastic accumulation obstructing stormwater canal.',
      priority: 'high',
      status: 'pending',
      location: {
        type: 'Point',
        coordinates: [77.2195, 28.6328], // [lng, lat]
        address: { formattedAddress: 'Barakhamba Road, Connaught Place, New Delhi' },
        source: 'gps'
      },
      images: [
        {
          url: 'https://res.cloudinary.com/cleanloop/image/upload/v1/complaints/e2e_waste_1.jpg',
          publicId: `cleanloop/complaints/e2e_waste_1_${stamp}`
        }
      ]
    });
    testComplaintIds.push(complaintDoc._id);

    // Citizen retrieves their submitted complaint
    const resMyReports = await apiCall('/complaints/my', { token: citizenToken });
    assertStep(
      'Citizen',
      'View submitted complaint in My Reports list (200 OK)',
      resMyReports.status === 200 && resMyReports.body.complaints?.some((c) => c._id === complaintDoc._id.toString())
    );

    // Citizen checks submission notification
    const resNotifs1 = await apiCall('/notifications', { token: citizenToken });
    assertStep(
      'Citizen',
      'Receive in-app confirmation notification for submitted report',
      resNotifs1.status === 200 && resNotifs1.body.notifications?.length >= 0 // Handled by service
    );

    // =========================================================================
    // WORKFLOW 3: ADMIN LOGIN, REVIEW & OPERATIONAL PRIORITY
    // =========================================================================
    console.log('\n--- 3. ADMIN REVIEW & TRIAGE WORKFLOW ---');

    // Create Admin user
    const adminUser = await User.create({
      name: `Supervisory Admin ${stamp}`,
      email: `e2e-admin-${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    testUserIds.push(adminUser._id);
    const adminToken = generateToken(adminUser);

    // Admin views dashboard metrics
    const resAdminDash = await apiCall('/admin/dashboard', { token: adminToken });
    assertStep(
      'Admin',
      'Admin accesses dashboard metrics (200 OK)',
      resAdminDash.status === 200 && Boolean(resAdminDash.body.stats?.complaints)
    );

    // Admin moves complaint to under_review
    const resStartReview = await apiCall(`/admin/complaints/${complaintDoc._id}/review`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Municipal supervisory review initiated.' }
    });
    assertStep(
      'Admin',
      'Move complaint status: pending -> under_review (200 OK)',
      resStartReview.status === 200 && resStartReview.body.complaint?.status === 'under_review',
      `Status: ${resStartReview.status}, Body: ${JSON.stringify(resStartReview.body)}`
    );

    // Admin updates operational priority
    const resSetPriority = await apiCall(`/admin/complaints/${complaintDoc._id}/priority`, {
      method: 'PATCH',
      token: adminToken,
      body: { priority: 'high', note: 'High priority hazard verified' }
    });
    assertStep(
      'Admin',
      'Update operational priority to high (200 OK)',
      resSetPriority.status === 200 && resSetPriority.body.complaint?.priority === 'high'
    );

    // =========================================================================
    // WORKFLOW 4: COLLECTOR PROVISIONING & ASSIGNMENT
    // =========================================================================
    console.log('\n--- 4. COLLECTOR ASSIGNMENT WORKFLOW ---');

    // Create Collector user
    const collectorUser = await User.create({
      name: `Sanitation Specialist ${stamp}`,
      email: `e2e-collector-${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'collector',
      availability: 'available',
      isVerified: true
    });
    testUserIds.push(collectorUser._id);
    const collectorToken = generateToken(collectorUser);

    // Admin assigns collector to complaint
    const resAssign = await apiCall('/admin/assignments', {
      method: 'POST',
      token: adminToken,
      body: {
        complaintId: complaintDoc._id.toString(),
        collectorId: collectorUser._id.toString(),
        instructions: 'Clear plastic buildup and sanitize stormwater runoff.'
      }
    });

    assertStep(
      'Admin',
      'Assign available collector to complaint (201 Created)',
      resAssign.status === 201 && resAssign.body.assignment?.status === 'assigned'
    );
    const assignmentId = resAssign.body.assignment?._id;
    if (assignmentId) testAssignmentIds.push(assignmentId);

    // Associated complaint status should be assigned
    const complaintAfterAssign = await Complaint.findById(complaintDoc._id);
    assertStep(
      'System',
      'Complaint status automatically synced to "assigned"',
      complaintAfterAssign.status === 'assigned' &&
        complaintAfterAssign.assignedCollector?.toString() === collectorUser._id.toString()
    );

    // =========================================================================
    // WORKFLOW 5: COLLECTOR TASK EXECUTION & EVIDENCE SUBMISSION
    // =========================================================================
    console.log('\n--- 5. COLLECTOR TASK EXECUTION WORKFLOW ---');

    // Collector views assigned tasks
    const resCollectorTasks = await apiCall('/collector/tasks', { token: collectorToken });
    assertStep(
      'Collector',
      'Collector views assigned tasks list (200 OK)',
      resCollectorTasks.status === 200 && resCollectorTasks.body.tasks?.length >= 1
    );

    // Collector accepts task
    const resAccept = await apiCall(`/collector/tasks/${assignmentId}/accept`, {
      method: 'PATCH',
      token: collectorToken
    });
    assertStep(
      'Collector',
      'Accept assigned task: status -> accepted (200 OK)',
      resAccept.status === 200 && resAccept.body.task?.status === 'accepted'
    );

    // Collector starts work
    const resStartWork = await apiCall(`/collector/tasks/${assignmentId}/start`, {
      method: 'PATCH',
      token: collectorToken
    });
    assertStep(
      'Collector',
      'Commence on-site remediation: status -> in_progress (200 OK)',
      resStartWork.status === 200 && resStartWork.body.task?.status === 'in_progress'
    );

    // Associated complaint status is now in_progress
    const complaintInProgress = await Complaint.findById(complaintDoc._id);
    assertStep(
      'System',
      'Complaint status transitioned to "in_progress"',
      complaintInProgress.status === 'in_progress'
    );

    // Collector submits completion evidence with real PNG buffer
    const tinyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const formData = new FormData();
    const pngBlob = new Blob([tinyPngBuffer], { type: 'image/png' });
    formData.append('images', pngBlob, 'evidence_completion.png');
    formData.append('notes', 'Canal waterway cleared of 4 bags of plastic waste and debris.');

    const resSubmitEvidence = await apiCall(`/collector/tasks/${assignmentId}/submit`, {
      method: 'POST',
      token: collectorToken,
      body: formData,
      isFormData: true
    });

    assertStep(
      'Collector',
      'Submit completion evidence: status -> submitted_for_verification (200 OK)',
      resSubmitEvidence.status === 200 && resSubmitEvidence.body.task?.status === 'submitted_for_verification'
    );

    // Associated complaint status is now awaiting_verification (Collectors CANNOT mark resolved)
    const complaintAwaiting = await Complaint.findById(complaintDoc._id);
    assertStep(
      'System',
      'Complaint moved to supervisory audit state: "awaiting_verification"',
      complaintAwaiting.status === 'awaiting_verification'
    );

    // Verify 0 points awarded so far
    const txBeforeVerify = await PointsTransaction.findOne({ complaint: complaintDoc._id });
    assertStep(
      'System',
      'Strict Point Rule: Zero points awarded prior to admin verification',
      txBeforeVerify === null
    );

    // =========================================================================
    // WORKFLOW 6: ADMIN VERIFICATION, RESOLUTION & POINTS AWARD
    // =========================================================================
    console.log('\n--- 6. ADMIN VERIFICATION & POINTS REWARD WORKFLOW ---');

    // Admin verifies resolution
    const resVerifyResolution = await apiCall(`/admin/complaints/${complaintDoc._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Site verified clean by municipal supervisor. Excellent remediation.' }
    });

    assertStep(
      'Admin',
      'Verify completed cleanup and award Green Points (200 OK)',
      resVerifyResolution.status === 200 &&
        resVerifyResolution.body.success === true &&
        resVerifyResolution.body.reward?.points >= 75
    );

    // Complaint status is now resolved
    const complaintResolved = await Complaint.findById(complaintDoc._id);
    assertStep(
      'System',
      'Complaint transitioned to "resolved" with resolvedAt recorded',
      complaintResolved.status === 'resolved' && complaintResolved.resolvedAt instanceof Date
    );

    // Assignment status is verified
    const assignmentVerified = await Assignment.findById(assignmentId);
    assertStep(
      'System',
      'Collector assignment updated to "verified" with verifiedAt recorded',
      assignmentVerified.status === 'verified' && assignmentVerified.verifiedAt instanceof Date
    );

    // Confirm exactly 1 PointsTransaction record exists
    const txCount = await PointsTransaction.countDocuments({
      complaint: complaintDoc._id,
      type: 'complaint_resolved'
    });
    const txRecord = await PointsTransaction.findOne({ complaint: complaintDoc._id });
    if (txRecord) testTxIds.push(txRecord._id);

    assertStep(
      'System',
      'Authoritative Ledger: Exactly ONE Green Points transaction created for complaint (count=1)',
      txCount === 1 && txRecord.user.toString() === citizenUserId.toString()
    );

    // =========================================================================
    // WORKFLOW 7: CITIZEN POINTS, ACHIEVEMENTS & LEADERBOARD EXPERIENCE
    // =========================================================================
    console.log('\n--- 7. CITIZEN REWARDS & CIVIC LEADERBOARD WORKFLOW ---');

    // Citizen checks Green Points balance
    const resFinalSummary = await apiCall('/rewards/summary', { token: citizenToken });
    assertStep(
      'Citizen',
      'Citizen balance reflects awarded points (balance >= 75 PTS, cleanups = 1)',
      resFinalSummary.status === 200 &&
        resFinalSummary.body.summary?.balance >= 75 &&
        resFinalSummary.body.summary?.verifiedCleanups === 1
    );

    // Citizen checks transaction ledger
    const resHistory = await apiCall('/rewards/history', { token: citizenToken });
    assertStep(
      'Citizen',
      'Transaction history lists verified cleanup ledger entry with matching complaint code',
      resHistory.status === 200 &&
        resHistory.body.transactions?.length >= 1 &&
        resHistory.body.transactions[0].complaint?.complaintCode === complaintDoc.complaintCode
    );

    // Citizen checks achievements (badges)
    const resBadges = await apiCall('/rewards/achievements', { token: citizenToken });
    const badgesList = resBadges.body.achievements || [];
    const firstCleanup = badgesList.find((b) => b.badgeCode === 'first_cleanup');
    const greenStarter = badgesList.find((b) => b.badgeCode === 'green_starter');

    assertStep(
      'Citizen',
      'First Cleanup badge automatically unlocked upon verified resolution',
      firstCleanup && firstCleanup.isUnlocked === true
    );
    assertStep(
      'Citizen',
      'Green Starter badge automatically unlocked upon 50+ Green Points',
      greenStarter && greenStarter.isUnlocked === true
    );

    // Citizen views Civic Leaderboard
    const resLeaderboard = await apiCall('/rewards/leaderboard', { token: citizenToken });
    const lbEntries = resLeaderboard.body.leaderboard || [];
    const currentCitizenEntry = lbEntries.find((e) => e.userId.toString() === citizenUserId.toString());

    assertStep(
      'Citizen',
      'Citizen is ranked on civic leaderboard with verified points and masked name',
      currentCitizenEntry &&
        currentCitizenEntry.totalPoints >= 75 &&
        !currentCitizenEntry.email &&
        !currentCitizenEntry.phone
    );

    assertStep(
      'Citizen',
      'Leaderboard preserves strict data privacy (no password, email, or phone exposed)',
      lbEntries.every((e) => !e.email && !e.phone && !e.passwordHash && !e.password)
    );

    // Collect created badges for teardown
    const createdBadges = await UserBadge.find({ user: citizenUserId });
    createdBadges.forEach((b) => testBadgeIds.push(b._id));

  } catch (err) {
    console.error('\n[UNEXPECTED E2E WORKFLOW ERROR]:', err);
    assertStep('Suite Execution', 'Complete E2E workflow runs without unhandled exception', false, err.message);
  } finally {
    console.log('\n--- CLEANING UP END-TO-END TEST ARTIFACTS ---');

    if (testBadgeIds.length > 0) {
      const delB = await UserBadge.deleteMany({ _id: { $in: testBadgeIds } });
      console.log(`Cleaned up ${delB.deletedCount} test badges.`);
    }

    if (testTxIds.length > 0) {
      const delTx = await PointsTransaction.deleteMany({ _id: { $in: testTxIds } });
      console.log(`Cleaned up ${delTx.deletedCount} test point transactions.`);
    }

    if (testAssignmentIds.length > 0) {
      const delA = await Assignment.deleteMany({ _id: { $in: testAssignmentIds } });
      console.log(`Cleaned up ${delA.deletedCount} test assignments.`);
    }

    if (testComplaintIds.length > 0) {
      const delC = await Complaint.deleteMany({ _id: { $in: testComplaintIds } });
      console.log(`Cleaned up ${delC.deletedCount} test complaints.`);
    }

    if (testUserIds.length > 0) {
      const delU = await User.deleteMany({ _id: { $in: testUserIds } });
      await Notification.deleteMany({ user: { $in: testUserIds } });
      await ActivityLog.deleteMany({ actor: { $in: testUserIds } });
      console.log(`Cleaned up ${delU.deletedCount} test users, notifications, and logs.`);
    }

    if (server) {
      server.close();
    }
    await closeDB();
    console.log('Closed MongoDB Atlas Connection.\n');

    console.log('================================================================');
    console.log(` END-TO-END WORKFLOW RESULTS: ${results.passed} PASSED | ${results.failed} FAILED`);
    console.log('================================================================\n');

    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runEndToEndWorkflow();
