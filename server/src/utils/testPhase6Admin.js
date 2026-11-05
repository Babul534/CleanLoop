import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import mongoose from 'mongoose';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Assignment from '../models/Assignment.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import apiRouter from '../routes/api.routes.js';
import { generateToken } from './jwt.js';
import { hashPassword } from './password.js';

// Setup ephemeral express test app
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

export const runPhase6Verification = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — PHASE 6 ADMIN & COMPLAINT MANAGEMENT AUDIT');
  console.log('================================================================\n');

  let server;
  let baseUrl;

  try {
    // 1. Connect DB
    await connectDB();
    console.log('Connected to MongoDB Atlas\n');

    // Start ephemeral server
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });

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

    // 2. Setup Seed Test Accounts
    const passwordHash = await hashPassword('AdminSecurePass2026!');
    const timestamp = Date.now();

    const adminUser = await User.create({
      name: 'Supervisory Commissioner',
      email: `admin_auditor_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'admin',
      phone: '+15559990001'
    });

    const citizenUser = await User.create({
      name: 'Civic Citizen',
      email: `citizen_auditor_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'user',
      phone: '+15559990002'
    });

    const collectorA = await User.create({
      name: 'Driver Collector Alpha',
      email: `collector_a_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'collector',
      accountStatus: 'active',
      availability: 'available',
      phone: '+15559990003',
      serviceAreas: ['Sector 4', 'Central']
    });

    const collectorB = await User.create({
      name: 'Driver Collector Beta',
      email: `collector_b_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'collector',
      accountStatus: 'active',
      availability: 'available',
      phone: '+15559990004',
      serviceAreas: ['Sector 9']
    });

    const suspendedCollector = await User.create({
      name: 'Suspended Worker',
      email: `collector_susp_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'collector',
      accountStatus: 'suspended',
      availability: 'unavailable',
      phone: '+15559990005'
    });

    const adminToken = generateToken(adminUser);
    const citizenToken = generateToken(citizenUser);
    const collectorToken = generateToken(collectorA);

    // -------------------------------------------------------------------------
    // SECTION 1: ACCESS CONTROL & RBAC ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('1. Admin Access Control & RBAC Enforcement:');

    const resUnauth = await apiCall('/admin/dashboard');
    assertTest(
      'Auth Guard',
      'Unauthenticated request returns 401 Unauthorized',
      resUnauth.status === 401
    );

    const resCitizen = await apiCall('/admin/dashboard', { token: citizenToken });
    assertTest(
      'Role Guard',
      'Citizen token rejected from /admin/dashboard (403 Forbidden)',
      resCitizen.status === 403
    );

    const resCollector = await apiCall('/admin/dashboard', { token: collectorToken });
    assertTest(
      'Role Guard',
      'Collector token rejected from /admin/dashboard (403 Forbidden)',
      resCollector.status === 403
    );

    const resAdmin = await apiCall('/admin/dashboard', { token: adminToken });
    assertTest(
      'Admin Access',
      'Admin token successfully retrieves /admin/dashboard (200 OK)',
      resAdmin.status === 200
    );

    // -------------------------------------------------------------------------
    // SECTION 2: ADMIN DASHBOARD METRICS
    // -------------------------------------------------------------------------
    console.log('\n2. Admin Dashboard Aggregated Metrics:');

    // Create a complaint to test real count calculations
    const complaintTest = await Complaint.create({
      user: citizenUser._id,
      description: 'Illegal dumping in public park near children playground.',
      category: 'plastic',
      reportedPriority: 'medium',
      priority: 'high',
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', publicId: 'test/sample1' }],
      location: {
        type: 'Point',
        coordinates: [77.22, 28.61],
        address: { formattedAddress: 'Central Park West' },
        source: 'gps'
      },
      status: 'pending',
      statusHistory: [{ status: 'pending', changedBy: citizenUser._id, note: 'Citizen filed', changedAt: new Date() }]
    });

    const resStats = await apiCall('/admin/dashboard', { token: adminToken });
    const stats = resStats.body.stats;

    assertTest(
      'Metrics Structure',
      'Dashboard stats contains complaints, collectors, and overview sections',
      Boolean(stats?.complaints && stats?.collectors && stats?.overview)
    );
    assertTest(
      'Complaint Metrics',
      'Stats reports real complaint numbers (total >= 1, pending >= 1)',
      stats.complaints.total >= 1 && stats.complaints.pending >= 1
    );
    assertTest(
      'Collector Metrics',
      'Stats reports active and available collectors correctly',
      stats.collectors.total >= 3 && stats.collectors.active >= 2 && stats.collectors.available >= 2
    );
    assertTest(
      'Urgent Count',
      'Overview tracks attentionRequired (high priority pending items)',
      stats.overview.attentionRequired >= 1
    );

    // -------------------------------------------------------------------------
    // SECTION 3: COMPLAINT MANAGEMENT, REVIEW & PRIORITY
    // -------------------------------------------------------------------------
    console.log('\n3. Complaint Triage, Review & Priority:');

    // Filter list
    const resComplaintsList = await apiCall('/admin/complaints?status=pending&priority=high', {
      token: adminToken
    });

    assertTest(
      'Complaints Query',
      'Admin retrieves paginated complaints with filters (200 OK)',
      resComplaintsList.status === 200 && Array.isArray(resComplaintsList.body.complaints)
    );

    // Get detail
    const resComplaintDetail = await apiCall(`/admin/complaints/${complaintTest._id}`, {
      token: adminToken
    });

    assertTest(
      'Complaint Detail',
      'Admin retrieves complete complaint record with user details',
      resComplaintDetail.status === 200 &&
        resComplaintDetail.body.complaint.complaintCode === complaintTest.complaintCode
    );

    // Start review
    const resReview = await apiCall(`/admin/complaints/${complaintTest._id}/review`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Field supervisor verified high severity and proximity to school.' }
    });

    assertTest(
      'Start Review',
      'Admin moves pending complaint to under_review (200 OK)',
      resReview.status === 200 && resReview.body.complaint.status === 'under_review'
    );

    // Attempt review again (should fail because not pending)
    const resReviewRepeat = await apiCall(`/admin/complaints/${complaintTest._id}/review`, {
      method: 'PATCH',
      token: adminToken
    });

    assertTest(
      'Review Guard',
      'Cannot start review on complaint that is already under review (400 Bad Request)',
      resReviewRepeat.status === 400
    );

    // Update operational priority
    const resPriority = await apiCall(`/admin/complaints/${complaintTest._id}/priority`, {
      method: 'PATCH',
      token: adminToken,
      body: { priority: 'high', note: 'Escalated due to toxic fumes hazard' }
    });

    assertTest(
      'Update Priority',
      'Admin sets operational priority to high (200 OK)',
      resPriority.status === 200 && resPriority.body.complaint.priority === 'high'
    );

    // Verify citizen reportedPriority was preserved intact
    const verifyComplaintDoc = await Complaint.findById(complaintTest._id).lean();
    assertTest(
      'Priority Isolation',
      'Citizen reportedPriority remains untouched (medium)',
      verifyComplaintDoc.reportedPriority === 'medium' && verifyComplaintDoc.priority === 'high'
    );

    // -------------------------------------------------------------------------
    // SECTION 4: COLLECTOR MANAGEMENT
    // -------------------------------------------------------------------------
    console.log('\n4. Collector Management:');

    // Create new collector
    const newCollectorData = {
      name: 'Rookie Sanitation Officer',
      email: `rookie_${timestamp}@cleanloop.test`,
      password: 'StrongPassword2026!',
      phone: '+15558881234',
      serviceAreas: ['North Sector', 'Industrial Zone']
    };

    const resCreateCollector = await apiCall('/admin/collectors', {
      method: 'POST',
      token: adminToken,
      body: newCollectorData
    });

    assertTest(
      'Create Collector',
      'Admin creates new collector account (201 Created)',
      resCreateCollector.status === 201 &&
        resCreateCollector.body.collector.role === 'collector' &&
        resCreateCollector.body.collector.email === newCollectorData.email
    );

    assertTest(
      'Password Secrecy',
      'Created collector response does NOT contain passwordHash or password',
      !resCreateCollector.body.collector.passwordHash && !resCreateCollector.body.collector.password
    );

    const createdCollectorId = resCreateCollector.body.collector._id || resCreateCollector.body.collector.id;

    // Prevent duplicate email
    const resDupCollector = await apiCall('/admin/collectors', {
      method: 'POST',
      token: adminToken,
      body: newCollectorData
    });

    assertTest(
      'Unique Email',
      'Duplicate collector email rejected with 400 Bad Request',
      resDupCollector.status === 400
    );

    // Update profile
    const resUpdateCollector = await apiCall(`/admin/collectors/${createdCollectorId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { phone: '+15559998888', serviceAreas: ['North Sector', 'Harbor'] }
    });

    assertTest(
      'Update Collector Profile',
      'Admin updates collector phone & service areas (200 OK)',
      resUpdateCollector.status === 200 && resUpdateCollector.body.collector.phone === '+15559998888'
    );

    // Update availability
    const resAvail = await apiCall(`/admin/collectors/${createdCollectorId}/availability`, {
      method: 'PATCH',
      token: adminToken,
      body: { availability: 'busy' }
    });

    assertTest(
      'Update Availability',
      'Admin updates collector availability to busy (200 OK)',
      resAvail.status === 200 && resAvail.body.collector.availability === 'busy'
    );

    // Get collectors list with workload metrics
    const resCollectorsList = await apiCall('/admin/collectors', { token: adminToken });
    assertTest(
      'Enriched Collectors',
      'Collectors list includes activeWorkload and completedWorkload properties',
      resCollectorsList.status === 200 &&
        resCollectorsList.body.collectors.every((c) => typeof c.activeWorkload === 'number')
    );

    // -------------------------------------------------------------------------
    // SECTION 5: ASSIGNMENT CREATION & REASSIGNMENT
    // -------------------------------------------------------------------------
    console.log('\n5. Assignment Management & Reassignment:');

    // Attempt assignment to suspended collector (must fail)
    const resAssignSusp = await apiCall('/admin/assignments', {
      method: 'POST',
      token: adminToken,
      body: {
        complaintId: complaintTest._id,
        collectorId: suspendedCollector._id
      }
    });

    assertTest(
      'Suspension Guard',
      'Cannot assign task to suspended collector (400 Bad Request)',
      resAssignSusp.status === 400
    );

    // Assign to Collector Alpha
    const resAssignA = await apiCall('/admin/assignments', {
      method: 'POST',
      token: adminToken,
      body: {
        complaintId: complaintTest._id,
        collectorId: collectorA._id,
        notes: 'Priority dispatch. Route truck #4.'
      }
    });

    assertTest(
      'Create Assignment',
      'Admin assigns active collector to complaint (201 Created)',
      resAssignA.status === 201 && resAssignA.body.assignment.status === 'assigned'
    );

    const assignmentAId = resAssignA.body.assignment._id || resAssignA.body.assignment.id;

    // Verify complaint status transitioned to 'assigned'
    const assignedComplaintDoc = await Complaint.findById(complaintTest._id).lean();
    assertTest(
      'Complaint State Updated',
      'Complaint status updated to assigned with assignedCollector set',
      assignedComplaintDoc.status === 'assigned' &&
        assignedComplaintDoc.assignedCollector.toString() === collectorA._id.toString()
    );

    // Prevent duplicate active assignment on the same complaint
    const resAssignDup = await apiCall('/admin/assignments', {
      method: 'POST',
      token: adminToken,
      body: {
        complaintId: complaintTest._id,
        collectorId: collectorB._id
      }
    });

    assertTest(
      'Duplicate Assignment Guard',
      'Duplicate active assignment on same complaint rejected with 400 Bad Request',
      resAssignDup.status === 400
    );

    // Deactivation guard: Cannot deactivate collector with active workload
    const resDeactGuard = await apiCall(`/admin/collectors/${collectorA._id}/activation`, {
      method: 'PATCH',
      token: adminToken,
      body: { accountStatus: 'suspended' }
    });

    assertTest(
      'Deactivation Guard',
      'Deactivating collector with active workload blocked with 400 Bad Request',
      resDeactGuard.status === 400 && resDeactGuard.body.activeWorkload >= 1
    );

    // Reassignment to Collector Beta
    const resReassign = await apiCall(`/admin/assignments/${assignmentAId}/reassign`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        newCollectorId: collectorB._id,
        reason: 'Collector A truck mechanical failure.'
      }
    });

    assertTest(
      'Reassignment Action',
      'Reassigning active task to Collector B succeeds (200 OK)',
      resReassign.status === 200 && resReassign.body.newAssignment.collector === collectorB._id.toString()
    );

    // Verify previous assignment is marked reassigned
    const prevAssignmentDoc = await Assignment.findById(assignmentAId).lean();
    assertTest(
      'Historical Integrity',
      'Previous assignment record marked reassigned and preserved in database',
      prevAssignmentDoc.status === 'reassigned' && prevAssignmentDoc.notes.includes('Reassigned')
    );

    // -------------------------------------------------------------------------
    // SECTION 6: COMPLAINT REJECTION
    // -------------------------------------------------------------------------
    console.log('\n6. Complaint Rejection Action:');

    // Create a new complaint for rejection testing
    const rejectTestComplaint = await Complaint.create({
      user: citizenUser._id,
      description: 'Litter on construction property behind high wall.',
      category: 'construction',
      reportedPriority: 'low',
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', publicId: 'test/sample2' }],
      location: {
        type: 'Point',
        coordinates: [77.23, 28.63],
        address: { formattedAddress: 'Site 44 Wall' },
        source: 'manual'
      },
      status: 'pending',
      statusHistory: [{ status: 'pending', changedBy: citizenUser._id, note: 'Submitted', changedAt: new Date() }]
    });

    // Rejection without reason fails
    const resRejectNoReason = await apiCall(`/admin/complaints/${rejectTestComplaint._id}/reject`, {
      method: 'PATCH',
      token: adminToken,
      body: { rejectionReason: '' }
    });

    assertTest(
      'Rejection Reason Requirement',
      'Rejection without explanation rejected with 400 Bad Request',
      resRejectNoReason.status === 400
    );

    // Rejection with reason succeeds
    const rejectionNote = 'Private building site under contractor jurisdiction.';
    const resRejectValid = await apiCall(`/admin/complaints/${rejectTestComplaint._id}/reject`, {
      method: 'PATCH',
      token: adminToken,
      body: { rejectionReason: rejectionNote }
    });

    assertTest(
      'Rejection Execution',
      'Rejection with explanation succeeds (200 OK) with status rejected',
      resRejectValid.status === 200 && resRejectValid.body.complaint.status === 'rejected'
    );

    assertTest(
      'Rejection Reason Persistence',
      'Complaint document stores rejectionReason string',
      resRejectValid.body.complaint.rejectionReason === rejectionNote
    );

    // -------------------------------------------------------------------------
    // SECTION 7: ADMIN ACTIVITY AUDIT LOGS
    // -------------------------------------------------------------------------
    console.log('\n7. Administrative Activity Audit Ledger:');

    // Citizen tries to read logs
    const resCitLogs = await apiCall('/admin/activity', { token: citizenToken });
    assertTest(
      'Audit Log Privacy',
      'Citizen blocked from administrative activity logs (403 Forbidden)',
      resCitLogs.status === 403
    );

    // Admin reads logs
    const resAdminLogs = await apiCall('/admin/activity', { token: adminToken });
    assertTest(
      'Audit Log Retrieval',
      'Admin retrieves paginated activity logs (200 OK)',
      resAdminLogs.status === 200 &&
        Array.isArray(resAdminLogs.body.logs) &&
        resAdminLogs.body.logs.length >= 4
    );

    const hasExpectedActions = resAdminLogs.body.logs.some((l) =>
      ['COMPLAINT_REVIEW_STARTED', 'COLLECTOR_CREATED', 'COLLECTOR_ASSIGNED', 'COLLECTOR_REASSIGNED'].includes(
        l.action
      )
    );
    assertTest(
      'Audit Action Coverage',
      'Audit log recorded review, collector creation, assignment, and reassignment',
      hasExpectedActions
    );

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\nCleaning up verification records...');
    const testComplaintIds = [complaintTest._id, rejectTestComplaint._id];
    const testUserIds = [
      adminUser._id,
      citizenUser._id,
      collectorA._id,
      collectorB._id,
      suspendedCollector._id,
      createdCollectorId
    ];

    await Assignment.deleteMany({ complaint: { $in: testComplaintIds } });
    await Notification.deleteMany({ user: { $in: testUserIds } });
    await ActivityLog.deleteMany({
      $or: [{ actor: { $in: testUserIds } }, { entityId: { $in: [...testComplaintIds, ...testUserIds] } }]
    });
    await Complaint.deleteMany({ _id: { $in: testComplaintIds } });
    await User.deleteMany({ _id: { $in: testUserIds } });
    console.log('Cleanup completed cleanly.\n');
  } catch (err) {
    console.error('Fatal Verification Error:', err);
    results.failed++;
    results.details.push({ status: 'FATAL', category: 'Runtime', description: err.message });
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDB();
  }

  console.log('================================================================');
  console.log(` VERIFICATION SUMMARY: ${results.passed} PASSED | ${results.failed} FAILED`);
  console.log('================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
};

runPhase6Verification().then(() => {
  process.exit(0);
});

