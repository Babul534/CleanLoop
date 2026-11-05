import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import mongoose from 'mongoose';
import express from 'express';

// Resolve directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, closeDB } from '../config/db.js';

import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import apiRouter from '../routes/api.routes.js';
import { generateToken } from './jwt.js';
import { hashPassword } from './password.js';
import {
  createNotification,
  notifyComplaintSubmitted,
  notifyStatusChanged
} from '../services/notificationService.js';

// Setup express test app
const app = express();
app.use(express.json());
app.use('/api', apiRouter);

const results = {
  passed: 0,
  failed: 0,
  details: []
};

const assertTest = (category, description, condition, details = '') => {
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

export const runPhase5Verification = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — PHASE 5 TRACKING & NOTIFICATIONS VERIFICATION');
  console.log('================================================================\n');

  let server;
  let baseUrl;

  try {
    // 1. Connect DB
    await connectDB();
    console.log('Connected to MongoDB Atlas\n');

    // Start ephemeral HTTP server
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });

    // Helper fetch wrapper
    const apiCall = async (endpoint, { method = 'GET', token = null, body = null } = {}) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      let json = {};
      try {
        json = await res.json();
      } catch (_) {}

      return { status: res.status, body: json };
    };

    // 2. Setup Test Users
    const passwordHash = await hashPassword('CivicSecure2026!');
    const timestamp = Date.now();

    const citizenA = await User.create({
      name: 'Citizen A Auditor',
      email: `citizen_a_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'user',
      phone: '+15550001111'
    });

    const citizenB = await User.create({
      name: 'Citizen B Competitor',
      email: `citizen_b_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'user',
      phone: '+15550002222'
    });

    const adminStaff = await User.create({
      name: 'Admin Dispatcher',
      email: `admin_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'admin',
      phone: '+15550003333'
    });

    const tokenA = generateToken(citizenA);
    const tokenB = generateToken(citizenB);
    const tokenAdmin = generateToken(adminStaff);

    // -------------------------------------------------------------------------
    // SECTION 1: COMPLAINT SUBMISSION & INITIAL NOTIFICATION
    // -------------------------------------------------------------------------
    console.log('1. Complaint Submission & Initial Status History:');

    const complaintA = await Complaint.create({
      user: citizenA._id,
      description: 'Massive organic waste pile blocking stormwater drain near block 7.',
      category: 'organic',
      reportedPriority: 'high',
      priority: 'high',
      images: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          publicId: 'cleanloop/complaints/sample1'
        }
      ],
      location: {
        type: 'Point',
        coordinates: [77.21, 28.61],
        address: { formattedAddress: 'Block 7 Stormwater Drain' },
        source: 'gps'
      },
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedBy: citizenA._id,
          note: 'Complaint submitted by citizen',
          changedAt: new Date()
        }
      ]
    });

    assertTest(
      'Complaint Model',
      'Complaint created with initial status pending',
      complaintA.status === 'pending'
    );
    assertTest(
      'Status History',
      'Initial status history contains 1 record with pending status',
      complaintA.statusHistory.length === 1 && complaintA.statusHistory[0].status === 'pending'
    );
    assertTest(
      'Complaint Code',
      'Complaint code starts with CLN-',
      complaintA.complaintCode.startsWith('CLN-')
    );

    // Trigger submission notification
    const subNotif = await notifyComplaintSubmitted(complaintA, citizenA);
    assertTest(
      'Submission Notification',
      'notifyComplaintSubmitted creates notification for Citizen A',
      Boolean(subNotif && subNotif.user.toString() === citizenA._id.toString())
    );

    // -------------------------------------------------------------------------
    // SECTION 2: NOTIFICATIONS API & MULTI-TENANT ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n2. Notifications API & Isolation:');

    // Citizen A gets unread count
    const resCountA = await apiCall('/notifications/unread-count', { token: tokenA });
    assertTest(
      'Unread Count',
      'Citizen A unread count is 1',
      resCountA.status === 200 && resCountA.body.count === 1,
      JSON.stringify(resCountA.body)
    );

    // Citizen B gets unread count (should be 0)
    const resCountB = await apiCall('/notifications/unread-count', { token: tokenB });
    assertTest(
      'Unread Isolation',
      'Citizen B unread count is 0',
      resCountB.status === 200 && resCountB.body.count === 0
    );

    // Citizen A gets notifications list
    const resListA = await apiCall('/notifications', { token: tokenA });
    assertTest(
      'Notifications List',
      'Citizen A retrieves paginated notifications list',
      resListA.status === 200 &&
        resListA.body.notifications.length === 1 &&
        resListA.body.pagination.totalCount === 1
    );

    // Citizen B gets notifications list (should be empty)
    const resListB = await apiCall('/notifications', { token: tokenB });
    assertTest(
      'List Isolation',
      'Citizen B receives empty notification list',
      resListB.status === 200 && resListB.body.notifications.length === 0
    );

    // Cross-user modification forbidden: Citizen B attempts to mark Citizen A's notification as read
    const notifId = subNotif._id.toString();
    const resHackB = await apiCall(`/notifications/${notifId}/read`, {
      method: 'PATCH',
      token: tokenB
    });

    assertTest(
      'Access Control',
      'Citizen B cannot mark Citizen A notification as read (403 Forbidden)',
      resHackB.status === 403
    );

    // Citizen A marks own notification as read
    const resReadA = await apiCall(`/notifications/${notifId}/read`, {
      method: 'PATCH',
      token: tokenA
    });

    assertTest(
      'Mark as Read',
      'Citizen A marks notification as read (200 OK, isRead=true)',
      resReadA.status === 200 && resReadA.body.notification.isRead === true
    );

    // Check count after read
    const resCountAAfter = await apiCall('/notifications/unread-count', { token: tokenA });
    assertTest(
      'Unread Count Update',
      'Citizen A unread count drops to 0 after mark-read',
      resCountAAfter.status === 200 && resCountAAfter.body.count === 0
    );

    // Mark all as read test
    await createNotification({
      userId: citizenA._id,
      title: 'Bulk Alert 1',
      message: 'Test alert 1',
      type: 'system'
    });
    await createNotification({
      userId: citizenA._id,
      title: 'Bulk Alert 2',
      message: 'Test alert 2',
      type: 'system'
    });

    const resReadAll = await apiCall('/notifications/read-all', {
      method: 'PATCH',
      token: tokenA
    });

    assertTest(
      'Mark All As Read',
      'Citizen A marks all notifications as read (updatedCount >= 2)',
      resReadAll.status === 200 && resReadAll.body.updatedCount >= 2
    );

    // Deduplication test
    const dup1 = await createNotification({
      userId: citizenA._id,
      title: 'Dedup Alert',
      message: 'Testing deduplication rule',
      type: 'system'
    });
    const dup2 = await createNotification({
      userId: citizenA._id,
      title: 'Dedup Alert',
      message: 'Testing deduplication rule',
      type: 'system'
    });

    assertTest(
      'Deduplication',
      'Duplicate notification within threshold is suppressed (returns null)',
      Boolean(dup1) && dup2 === null
    );

    // -------------------------------------------------------------------------
    // SECTION 3: COMPLAINT STATUS TRANSITIONS & TIMELINE VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n3. Status Transition Workflow & History:');

    // Citizen cannot change status
    const resCitizenChange = await apiCall(`/complaints/${complaintA._id}/status`, {
      method: 'PATCH',
      token: tokenA,
      body: { status: 'under_review' }
    });

    assertTest(
      'Role Guard',
      'Citizen cannot update complaint status (403 Forbidden)',
      resCitizenChange.status === 403
    );

    // Invalid transition: pending directly to resolved is forbidden
    const resInvalidTransition = await apiCall(`/complaints/${complaintA._id}/status`, {
      method: 'PATCH',
      token: tokenAdmin,
      body: { status: 'resolved' }
    });

    assertTest(
      'Transition Guard',
      'Skipping workflow stages (pending -> resolved) rejected with 400 Bad Request',
      resInvalidTransition.status === 400
    );

    // Step 1: pending -> under_review
    const resStep1 = await apiCall(`/complaints/${complaintA._id}/status`, {
      method: 'PATCH',
      token: tokenAdmin,
      body: { status: 'under_review', note: 'Dispatcher verified coordinates and visual evidence.' }
    });

    assertTest(
      'Status Transition',
      'Admin transitions complaint: pending -> under_review (200 OK)',
      resStep1.status === 200 && resStep1.body.complaint.status === 'under_review'
    );

    // Step 2: under_review -> assigned
    const resStep2 = await apiCall(`/complaints/${complaintA._id}/status`, {
      method: 'PATCH',
      token: tokenAdmin,
      body: { status: 'assigned', note: 'Dispatched to Zone 4 sanitation squad.' }
    });

    assertTest(
      'Status Transition',
      'Admin transitions complaint: under_review -> assigned (200 OK)',
      resStep2.status === 200 && resStep2.body.complaint.status === 'assigned'
    );

    // Step 3: assigned -> in_progress
    const resStep3 = await apiCall(`/complaints/${complaintA._id}/status`, {
      method: 'PATCH',
      token: tokenAdmin,
      body: { status: 'in_progress', note: 'Crew arrived with dump truck and tools.' }
    });

    assertTest(
      'Status Transition',
      'Admin transitions complaint: assigned -> in_progress (200 OK)',
      resStep3.status === 200 && resStep3.body.complaint.status === 'in_progress'
    );

    // Step 4: in_progress -> awaiting_verification
    const resStep4 = await apiCall(`/complaints/${complaintA._id}/status`, {
      method: 'PATCH',
      token: tokenAdmin,
      body: { status: 'awaiting_verification', note: 'Organic waste cleared; awaiting supervisor audit.' }
    });

    assertTest(
      'Status Transition',
      'Admin transitions complaint: in_progress -> awaiting_verification (200 OK)',
      resStep4.status === 200 && resStep4.body.complaint.status === 'awaiting_verification'
    );

    // Step 5: awaiting_verification -> resolved
    const resStep5 = await apiCall(`/complaints/${complaintA._id}/status`, {
      method: 'PATCH',
      token: tokenAdmin,
      body: { status: 'resolved', note: 'Supervisor verified drain clearance and sanitized area.' }
    });

    assertTest(
      'Status Transition',
      'Admin transitions complaint: awaiting_verification -> resolved (200 OK)',
      resStep5.status === 200 && resStep5.body.complaint.status === 'resolved'
    );

    assertTest(
      'Resolution Metadata',
      'resolvedAt date is recorded on complaint',
      Boolean(resStep5.body.complaint.resolvedAt)
    );

    // Check statusHistory progression
    const updatedComplaintA = await Complaint.findById(complaintA._id).lean();
    assertTest(
      'Status History Length',
      'Status history recorded all 6 chronological steps',
      updatedComplaintA.statusHistory.length === 6
    );

    const lastHistoryItem = updatedComplaintA.statusHistory[updatedComplaintA.statusHistory.length - 1];
    assertTest(
      'Status History Details',
      'Last history item records status, previousStatus, changedBy, note, changedAt',
      lastHistoryItem.status === 'resolved' &&
        lastHistoryItem.previousStatus === 'awaiting_verification' &&
        Boolean(lastHistoryItem.changedBy) &&
        Boolean(lastHistoryItem.changedAt) &&
        Boolean(lastHistoryItem.note)
    );

    // Terminal state rejection: cannot transition resolved to in_progress
    const resStepInvalid = await apiCall(`/complaints/${complaintA._id}/status`, {
      method: 'PATCH',
      token: tokenAdmin,
      body: { status: 'in_progress' }
    });

    assertTest(
      'Terminal State Guard',
      'Resolved complaints cannot arbitrarily transition to in_progress (400 Bad Request)',
      resStepInvalid.status === 400
    );

    // -------------------------------------------------------------------------
    // SECTION 4: REJECTION FLOW & REASON RECORDING
    // -------------------------------------------------------------------------
    console.log('\n4. Rejection Workflow & Reason:');

    const complaintRejection = await Complaint.create({
      user: citizenA._id,
      description: 'Litter on private residential driveway behind gate.',
      category: 'household',
      reportedPriority: 'low',
      images: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample_reject.jpg',
          publicId: 'cleanloop/complaints/sample_reject'
        }
      ],
      location: {
        type: 'Point',
        coordinates: [77.22, 28.62],
        address: { formattedAddress: 'Private Driveway 12' },
        source: 'manual'
      },
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedBy: citizenA._id,
          note: 'Submitted by citizen',
          changedAt: new Date()
        }
      ]
    });

    // Rejection without reason is rejected
    const resRejectNoReason = await apiCall(`/complaints/${complaintRejection._id}/status`, {
      method: 'PATCH',
      token: tokenAdmin,
      body: { status: 'rejected' }
    });

    assertTest(
      'Rejection Reason Guard',
      'Rejection without explanation rejected with 400 Bad Request',
      resRejectNoReason.status === 400
    );

    // Rejection with reason
    const rejectionNote = 'Private residential property outside municipal jurisdiction.';
    const resRejectSuccess = await apiCall(`/complaints/${complaintRejection._id}/status`, {
      method: 'PATCH',
      token: tokenAdmin,
      body: { status: 'rejected', rejectionReason: rejectionNote }
    });

    assertTest(
      'Rejection Transition',
      'Rejection with explanation succeeds (200 OK)',
      resRejectSuccess.status === 200 && resRejectSuccess.body.complaint.status === 'rejected'
    );
    assertTest(
      'Rejection Reason Stored',
      'Complaint document stores rejectionReason string',
      resRejectSuccess.body.complaint.rejectionReason === rejectionNote
    );

    // Check citizen notification for rejection
    const rejectNotif = await Notification.findOne({
      user: citizenA._id,
      relatedComplaint: complaintRejection._id,
      title: 'Report Rejected'
    }).lean();

    assertTest(
      'Rejection Notification',
      'Citizen received rejection notification containing the reason',
      Boolean(rejectNotif && rejectNotif.message.includes(rejectionNote))
    );

    // -------------------------------------------------------------------------
    // SECTION 5: COMPLAINT DETAIL ENDPOINT & SECURITY AUDIT
    // -------------------------------------------------------------------------
    console.log('\n5. Complaint Detail Endpoint (/api/complaints/:id):');

    // Citizen A gets own complaint detail
    const resDetailA = await apiCall(`/complaints/${complaintA._id}`, { token: tokenA });

    assertTest(
      'Owner Access',
      'Citizen A accesses own complaint detail (200 OK)',
      resDetailA.status === 200 &&
        resDetailA.body.complaint.complaintCode === complaintA.complaintCode &&
        resDetailA.body.complaint.status === 'resolved' &&
        resDetailA.body.complaint.statusHistory.length === 6
    );

    // Citizen B tries to access Citizen A's complaint
    const resDetailB = await apiCall(`/complaints/${complaintA._id}`, { token: tokenB });

    assertTest(
      'Ownership Enforcement',
      'Citizen B forbidden from accessing Citizen A complaint (403 Forbidden)',
      resDetailB.status === 403
    );

    // Nonexistent ID
    const randomId = new mongoose.Types.ObjectId();
    const resDetail404 = await apiCall(`/complaints/${randomId}`, { token: tokenA });

    assertTest(
      'Not Found Response',
      'Nonexistent complaint returns 404 Not Found',
      resDetail404.status === 404
    );

    // Invalid ID
    const resDetail400 = await apiCall('/complaints/invalid-id-format', { token: tokenA });

    assertTest(
      'Invalid ID Response',
      'Malformed ObjectId returns 400 Bad Request',
      resDetail400.status === 400
    );

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\nCleaning up verification records...');
    await Complaint.deleteMany({ _id: { $in: [complaintA._id, complaintRejection._id] } });
    await Notification.deleteMany({ user: { $in: [citizenA._id, citizenB._id, adminStaff._id] } });
    await ActivityLog.deleteMany({ entityId: { $in: [complaintA._id, complaintRejection._id] } });
    await User.deleteMany({ _id: { $in: [citizenA._id, citizenB._id, adminStaff._id] } });
    console.log('Cleanup completed cleanly.\n');
  } catch (err) {
    console.error('Fatal Verification Error:', err);
    results.failed++;
    results.details.push({ status: 'FATAL', category: 'Runtime', description: err.message });
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log('================================================================');
  console.log(
    ` VERIFICATION SUMMARY: ${results.passed} PASSED | ${results.failed} FAILED`
  );
  console.log('================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
};

runPhase5Verification().then(async () => {
  await closeDB();
  process.exit(0);
});
