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

const assertCheck = (category, description, condition, details = '') => {
  if (condition) {
    results.passed++;
    results.details.push({ status: 'PASS', category, description });
    console.log(`  [PASS] [${category}] ${description}`);
  } else {
    results.failed++;
    results.details.push({ status: 'FAIL', category, description, details });
    console.error(`  [FAIL] [${category}] ${description} -> ${details}`);
  }
};

export const runVerificationAudit = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — VERIFIED & RESOLVED LIFECYCLE & TIMELINE AUDIT');
  console.log('================================================================\n');

  let server;
  let baseUrl;

  const testUserIds = [];
  const testComplaintIds = [];
  const testAssignmentIds = [];
  const testTxIds = [];

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
      { method = 'GET', token = null, body = null } = {}
    ) => {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['Content-Type'] = 'application/json';

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
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
    const testPassword = 'AuditVerify@123';
    const hashedPassword = await hashPassword(testPassword);

    // 1. Create Test Citizen, Admin, and Collector
    const citizen = await User.create({
      name: `Citizen DeepAudit ${stamp}`,
      email: `citizen-audit-${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true
    });
    testUserIds.push(citizen._id);
    const citizenToken = generateToken(citizen);

    const admin = await User.create({
      name: `Admin Supervisor ${stamp}`,
      email: `admin-audit-${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    testUserIds.push(admin._id);
    const adminToken = generateToken(admin);

    const collector = await User.create({
      name: `Field Crew ${stamp}`,
      email: `collector-audit-${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'collector',
      availability: 'busy',
      isVerified: true
    });
    testUserIds.push(collector._id);

    // =========================================================================
    // CASE A: BEFORE ADMIN VERIFICATION (AWAITING_VERIFICATION)
    // =========================================================================
    console.log('\n--- CASE A: BEFORE ADMIN VERIFICATION (STATE: AWAITING_VERIFICATION) ---');

    const complaint = await Complaint.create({
      user: citizen._id,
      complaintCode: `CLN-AUD-${stamp.toString().slice(-4)}`,
      category: 'plastic',
      description: 'Illegal plastic dump site along storm canal.',
      priority: 'high',
      status: 'awaiting_verification',
      statusHistory: [
        {
          status: 'pending',
          note: 'Citizen submission received.',
          changedAt: new Date(Date.now() - 3600000)
        },
        {
          status: 'assigned',
          changedBy: admin._id,
          note: `Dispatched to collector ${collector.name}`,
          changedAt: new Date(Date.now() - 2400000)
        },
        {
          status: 'in_progress',
          changedBy: collector._id,
          note: 'Field crew commenced remediation operations.',
          changedAt: new Date(Date.now() - 1200000)
        },
        {
          status: 'awaiting_verification',
          changedBy: collector._id,
          note: 'Cleanup completed with photo evidence. Pending supervisory audit.',
          changedAt: new Date(Date.now() - 600000)
        }
      ],
      location: {
        type: 'Point',
        coordinates: [77.2167, 28.6315],
        address: { formattedAddress: 'Canal Bank, New Delhi' },
        source: 'gps'
      },
      images: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample_before.jpg',
          publicId: `cleanloop/before_${stamp}`
        }
      ]
    });
    testComplaintIds.push(complaint._id);

    const assignment = await Assignment.create({
      complaint: complaint._id,
      collector: collector._id,
      assignedBy: admin._id,
      status: 'submitted_for_verification',
      assignedAt: new Date(Date.now() - 2400000),
      startedAt: new Date(Date.now() - 1200000),
      submittedAt: new Date(Date.now() - 600000),
      completionImages: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample_after.jpg',
          publicId: `cleanloop/after_${stamp}`
        }
      ]
    });
    testAssignmentIds.push(assignment._id);

    // Check Case A1: Complaint status is awaiting_verification
    const resGetBefore = await apiCall(`/complaints/${complaint._id}`, { token: citizenToken });
    assertCheck(
      'Case A: Pre-Verification',
      'GET /api/complaints/:id confirms status is awaiting_verification',
      resGetBefore.status === 200 && resGetBefore.body.complaint?.status === 'awaiting_verification'
    );

    // Check Case A2: resolvedAt is null / undefined
    assertCheck(
      'Case A: Pre-Verification',
      'Complaint resolvedAt timestamp is null prior to verification',
      !resGetBefore.body.complaint?.resolvedAt
    );

    // Check Case A3: Zero Points Transactions exist for this complaint
    const txBefore = await PointsTransaction.countDocuments({ complaint: complaint._id });
    assertCheck(
      'Case A: Pre-Verification',
      'Strict Point Rule: Exactly 0 points transactions exist for unverified complaint',
      txBefore === 0
    );

    // Check Case A4: Citizen points summary balance is 0
    const resSummaryBefore = await apiCall('/rewards/summary', { token: citizenToken });
    assertCheck(
      'Case A: Pre-Verification',
      'Citizen Green Points balance is strictly 0 PTS',
      resSummaryBefore.status === 200 && resSummaryBefore.body.summary?.balance === 0
    );

    // Check Case A5: Assignment status is submitted_for_verification
    const assignDocBefore = await Assignment.findById(assignment._id);
    assertCheck(
      'Case A: Pre-Verification',
      'Assignment status is submitted_for_verification with verifiedAt=null',
      assignDocBefore.status === 'submitted_for_verification' && !assignDocBefore.verifiedAt
    );

    // =========================================================================
    // CASE B: AFTER ADMIN VERIFICATION (VERIFIED & RESOLVED)
    // =========================================================================
    console.log('\n--- CASE B: AFTER ADMIN VERIFICATION (STATE: RESOLVED) ---');

    // Trigger Admin Verification API
    const verifyNote = 'Supervisory verification passed. Remediation confirmed.';
    const resVerify = await apiCall(`/admin/complaints/${complaint._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: verifyNote }
    });

    assertCheck(
      'Case B: Post-Verification',
      'PATCH /api/admin/complaints/:id/verify-resolution succeeds (200 OK)',
      resVerify.status === 200 && resVerify.body.success === true
    );

    // Check Case B1: Complaint status changed to resolved
    const updatedComplaint = await Complaint.findById(complaint._id);
    assertCheck(
      'Case B: Post-Verification',
      'Complaint status transitioned to "resolved"',
      updatedComplaint.status === 'resolved'
    );

    // Check Case B2: resolvedAt timestamp is recorded
    assertCheck(
      'Case B: Post-Verification',
      'Complaint resolvedAt timestamp is recorded as a valid Date',
      updatedComplaint.resolvedAt instanceof Date
    );

    // Check Case B3: Immutable status history contains resolution entry with exact admin note
    const latestHistory = updatedComplaint.statusHistory[updatedComplaint.statusHistory.length - 1];
    assertCheck(
      'Case B: Post-Verification',
      'Status history records resolution entry with admin audit note',
      latestHistory.status === 'resolved' &&
        latestHistory.previousStatus === 'awaiting_verification' &&
        latestHistory.note === verifyNote &&
        latestHistory.changedBy.toString() === admin._id.toString()
    );

    // Check Case B4: Related assignment updated to verified
    const updatedAssignment = await Assignment.findById(assignment._id);
    assertCheck(
      'Case B: Post-Verification',
      'Related assignment status updated to "verified" with verifiedAt timestamp',
      updatedAssignment.status === 'verified' && updatedAssignment.verifiedAt instanceof Date
    );

    // Check Case B5: Green Points awarded exactly once
    const txAfter = await PointsTransaction.find({ complaint: complaint._id, type: 'complaint_resolved' });
    if (txAfter.length > 0) testTxIds.push(txAfter[0]._id);

    assertCheck(
      'Case B: Post-Verification',
      'PointsTransaction ledger contains exactly 1 reward transaction',
      txAfter.length === 1 && txAfter[0].user.toString() === citizen._id.toString() && txAfter[0].points >= 75
    );

    // Check Case B6: Repeated verification attempts are rejected
    const resReverify = await apiCall(`/admin/complaints/${complaint._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Repeated verification attempt' }
    });
    assertCheck(
      'Case B: Post-Verification',
      'Repeated verification call on resolved complaint rejected with 400 Bad Request',
      resReverify.status === 400 && resReverify.body.success === false
    );

    // Confirm points transaction count remains strictly 1
    const txCountAfterReverify = await PointsTransaction.countDocuments({
      complaint: complaint._id,
      type: 'complaint_resolved'
    });
    assertCheck(
      'Case B: Post-Verification',
      'Idempotency guarantee: Points transaction count remains strictly 1 after repeat call',
      txCountAfterReverify === 1
    );

    // Check Case B7: Citizen received notifications
    const citizenNotifs = await Notification.find({ user: citizen._id }).sort({ createdAt: -1 });
    const hasStatusNotif = citizenNotifs.some(
      (n) => n.type === 'resolution' || n.title.includes('Resolved') || n.title.includes('Verified')
    );
    const hasRewardNotif = citizenNotifs.some((n) => n.type === 'reward' && n.title.includes('Points'));
    assertCheck(
      'Case B: Post-Verification',
      'Citizen received both resolution status notification and green points reward notification',
      hasStatusNotif && hasRewardNotif
    );

    // Check Case B8: Citizen points summary balance reflects awarded points
    const resSummaryAfter = await apiCall('/rewards/summary', { token: citizenToken });
    assertCheck(
      'Case B: Post-Verification',
      'Citizen rewards summary reflects balance >= 75 PTS and verifiedCleanups = 1',
      resSummaryAfter.status === 200 &&
        resSummaryAfter.body.summary?.balance >= 75 &&
        resSummaryAfter.body.summary?.verifiedCleanups === 1
    );

    // Check Case B9: Citizen detail endpoint returns resolved data for timeline consumption
    const resGetAfter = await apiCall(`/complaints/${complaint._id}`, { token: citizenToken });
    const finalComplaintData = resGetAfter.body.complaint;
    assertCheck(
      'Case B: Post-Verification',
      'Complaint detail API payload contains status="resolved", resolvedAt, and complete statusHistory',
      finalComplaintData.status === 'resolved' &&
        Boolean(finalComplaintData.resolvedAt) &&
        finalComplaintData.statusHistory.some((h) => h.status === 'resolved')
    );

  } catch (err) {
    console.error('\n[UNEXPECTED AUDIT ERROR]:', err);
    assertCheck('Suite Execution', 'Verification audit runs without unhandled exception', false, err.message);
  } finally {
    console.log('\n--- CLEANING UP VERIFICATION AUDIT ARTIFACTS ---');

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
      await UserBadge.deleteMany({ user: { $in: testUserIds } });
      console.log(`Cleaned up ${delU.deletedCount} test users, notifications, and logs.`);
    }

    if (server) {
      server.close();
    }
    await closeDB();
    console.log('Closed MongoDB Atlas Connection.\n');

    console.log('================================================================');
    console.log(` VERIFICATION AUDIT RESULTS: ${results.passed} PASSED | ${results.failed} FAILED`);
    console.log('================================================================\n');

    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runVerificationAudit();

