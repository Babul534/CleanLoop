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

export const runPhase7Verification = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — PHASE 7 WASTE COLLECTOR & TASK EXECUTION AUDIT');
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

    const apiCall = async (
      endpoint,
      { method = 'GET', token = null, body = null, isFormData = false } = {}
    ) => {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let reqBody;
      if (isFormData) {
        reqBody = body; // let fetch set multipart boundaries automatically
      } else {
        headers['Content-Type'] = 'application/json';
        reqBody = body ? JSON.stringify(body) : undefined;
      }

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: reqBody
      });

      let json = {};
      try {
        json = await res.json();
      } catch (_) {}

      return { status: res.status, body: json };
    };

    // 2. Setup Seed Test Accounts
    const passwordHash = await hashPassword('SecurePass2026!');
    const timestamp = Date.now();

    const adminUser = await User.create({
      name: 'Supervisor Dispatcher',
      email: `admin_p7_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'admin',
      phone: '+15557770001'
    });

    const citizenUser = await User.create({
      name: 'Civic Reporter',
      email: `citizen_p7_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'user',
      phone: '+15557770002'
    });

    const collectorAlpha = await User.create({
      name: 'Collector Alpha Lead',
      email: `collector_alpha_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'collector',
      accountStatus: 'active',
      availability: 'available',
      phone: '+15557770003',
      serviceAreas: ['Sector 4', 'Central Depot']
    });

    const collectorBeta = await User.create({
      name: 'Collector Beta Field',
      email: `collector_beta_${timestamp}@cleanloop.test`,
      passwordHash,
      role: 'collector',
      accountStatus: 'active',
      availability: 'available',
      phone: '+15557770004',
      serviceAreas: ['Sector 9']
    });

    const adminToken = generateToken(adminUser);
    const citizenToken = generateToken(citizenUser);
    const alphaToken = generateToken(collectorAlpha);
    const betaToken = generateToken(collectorBeta);

    // -------------------------------------------------------------------------
    // SECTION 1: ACCESS CONTROL & RBAC ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('1. Collector Access Control & RBAC Enforcement:');

    const resUnauth = await apiCall('/collector/dashboard');
    assertTest(
      'Auth Guard',
      'Unauthenticated request to /collector/dashboard returns 401 Unauthorized',
      resUnauth.status === 401
    );

    const resCitizen = await apiCall('/collector/dashboard', { token: citizenToken });
    assertTest(
      'Role Guard',
      'Citizen token rejected from /collector/dashboard (403 Forbidden)',
      resCitizen.status === 403
    );

    const resAdmin = await apiCall('/collector/dashboard', { token: adminToken });
    assertTest(
      'Role Guard',
      'Admin token rejected from collector workspace (403 Forbidden)',
      resAdmin.status === 403
    );

    const resAlpha = await apiCall('/collector/dashboard', { token: alphaToken });
    assertTest(
      'Collector Access',
      'Collector token successfully accesses /collector/dashboard (200 OK)',
      resAlpha.status === 200
    );

    // -------------------------------------------------------------------------
    // SECTION 2: COLLECTOR DASHBOARD METRICS & REAL MONGODB AGGREGATIONS
    // -------------------------------------------------------------------------
    console.log('\n2. Collector Dashboard Aggregated Metrics:');

    // Create a real complaint & assignment for Collector Alpha
    const complaintA = await Complaint.create({
      user: citizenUser._id,
      description: 'Heavy plastic accumulation obstructing stormwater canal.',
      category: 'plastic',
      reportedPriority: 'high',
      priority: 'high',
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', publicId: 'test/sample_a' }],
      location: {
        type: 'Point',
        coordinates: [77.21, 28.62],
        address: { formattedAddress: 'Canal Crossing Road', landmark: 'Storm Drain 4' },
        source: 'gps'
      },
      status: 'assigned',
      assignedCollector: collectorAlpha._id,
      assignedAt: new Date(),
      statusHistory: [{ status: 'assigned', changedBy: adminUser._id, note: 'Dispatched to Collector Alpha', changedAt: new Date() }]
    });

    const assignmentA = await Assignment.create({
      complaint: complaintA._id,
      collector: collectorAlpha._id,
      assignedBy: adminUser._id,
      status: 'assigned',
      assignedAt: new Date()
    });

    const resStats = await apiCall('/collector/dashboard', { token: alphaToken });
    const stats = resStats.body.stats;

    assertTest(
      'Stats Structure',
      'Dashboard stats contains totalAssigned, newAssignments, inProgress, and completed',
      stats && typeof stats.totalAssigned === 'number' && typeof stats.newAssignments === 'number'
    );

    assertTest(
      'Metrics Accuracy',
      'Stats accurately reflects assigned task count (totalAssigned >= 1, newAssignments >= 1)',
      stats.totalAssigned >= 1 && stats.newAssignments >= 1
    );

    assertTest(
      'Feed Population',
      'Dashboard includes newAssignmentsList populated with complaint metadata',
      Array.isArray(resStats.body.newAssignmentsList) &&
        resStats.body.newAssignmentsList.length >= 1 &&
        resStats.body.newAssignmentsList[0].complaint.complaintCode === complaintA.complaintCode
    );

    assertTest(
      'Availability State',
      'Dashboard reflects collector availability (available)',
      resStats.body.availability === 'available'
    );

    // -------------------------------------------------------------------------
    // SECTION 3: MY ASSIGNED TASKS & MULTI-TENANT ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n3. My Assigned Tasks Query & Tenant Isolation:');

    const resAlphaTasks = await apiCall('/collector/tasks', { token: alphaToken });
    assertTest(
      'Tasks Retrieval',
      'Collector Alpha retrieves assigned tasks list (200 OK)',
      resAlphaTasks.status === 200 && Array.isArray(resAlphaTasks.body.tasks)
    );

    assertTest(
      'Task Record Match',
      'Task list contains Alpha assigned complaint code',
      resAlphaTasks.body.tasks.some((t) => t.complaint?.complaintCode === complaintA.complaintCode)
    );

    // Collector Beta queries tasks: MUST NOT see Collector Alpha's tasks
    const resBetaTasks = await apiCall('/collector/tasks', { token: betaToken });
    assertTest(
      'Tenant Isolation',
      'Strict multi-tenant isolation: Collector Beta cannot see Collector Alpha tasks (0 tasks returned)',
      resBetaTasks.status === 200 && resBetaTasks.body.tasks.length === 0
    );

    // Filter by status=assigned
    const resFiltered = await apiCall('/collector/tasks?status=assigned', { token: alphaToken });
    assertTest(
      'Status Filter',
      'Filter by status=assigned returns matching tasks',
      resFiltered.status === 200 && resFiltered.body.tasks.every((t) => t.status === 'assigned')
    );

    // -------------------------------------------------------------------------
    // SECTION 4: TASK DETAIL & PRIVACY ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n4. Task Detail Retrieval & Cross-Collector Security:');

    // Alpha accesses own task
    const resDetailAlpha = await apiCall(`/collector/tasks/${assignmentA._id}`, { token: alphaToken });
    assertTest(
      'Detail Access',
      'Collector Alpha retrieves own task details (200 OK)',
      resDetailAlpha.status === 200 &&
        resDetailAlpha.body.task.complaint.complaintCode === complaintA.complaintCode
    );

    // Citizen personal data protection: Complaint user email must NOT be leaked
    assertTest(
      'Citizen Privacy',
      'Complaint details shielded: citizen personal email is not exposed to collector',
      !resDetailAlpha.body.task.complaint.user || typeof resDetailAlpha.body.task.complaint.user !== 'object'
    );

    // Collector Beta tries to view Alpha's task -> 403 Forbidden
    const resDetailBeta = await apiCall(`/collector/tasks/${assignmentA._id}`, { token: betaToken });
    assertTest(
      'Cross-Collector Guard',
      'Collector Beta blocked from viewing Collector Alpha task (403 Forbidden)',
      resDetailBeta.status === 403
    );

    // Nonexistent ID -> 404
    const fakeId = new mongoose.Types.ObjectId();
    const resNotFound = await apiCall(`/collector/tasks/${fakeId}`, { token: alphaToken });
    assertTest(
      'Not Found Response',
      'Nonexistent task ID returns 404 Not Found',
      resNotFound.status === 404
    );

    // -------------------------------------------------------------------------
    // SECTION 5: TASK ACCEPTANCE WORKFLOW
    // -------------------------------------------------------------------------
    console.log('\n5. Task Acceptance State Machine:');

    // Beta attempts to accept Alpha's task -> 403 Forbidden
    const resBetaAccept = await apiCall(`/collector/tasks/${assignmentA._id}/accept`, {
      method: 'PATCH',
      token: betaToken
    });
    assertTest(
      'Acceptance Tenancy Guard',
      'Collector Beta cannot accept Collector Alpha assignment (403 Forbidden)',
      resBetaAccept.status === 403
    );

    // Alpha accepts task -> 200 OK
    const resAlphaAccept = await apiCall(`/collector/tasks/${assignmentA._id}/accept`, {
      method: 'PATCH',
      token: alphaToken
    });
    assertTest(
      'Accept Task',
      'Collector Alpha accepts assignment (200 OK) with status accepted',
      resAlphaAccept.status === 200 && resAlphaAccept.body.task.status === 'accepted'
    );

    // Verification in database: acceptedAt is recorded
    const updatedAssignDoc = await Assignment.findById(assignmentA._id).lean();
    assertTest(
      'Accepted Timestamp',
      'Assignment record stores acceptedAt timestamp',
      Boolean(updatedAssignDoc.acceptedAt)
    );

    // Re-acceptance guard: cannot accept already accepted task -> 400 Bad Request
    const resRepeatAccept = await apiCall(`/collector/tasks/${assignmentA._id}/accept`, {
      method: 'PATCH',
      token: alphaToken
    });
    assertTest(
      'Re-acceptance Guard',
      'Cannot accept an assignment that is already accepted (400 Bad Request)',
      resRepeatAccept.status === 400
    );

    // -------------------------------------------------------------------------
    // SECTION 6: TASK COMMENCEMENT WORKFLOW (START WORK)
    // -------------------------------------------------------------------------
    console.log('\n6. Task Commencement (Start Work):');

    // Beta attempts to start Alpha's task -> 403 Forbidden
    const resBetaStart = await apiCall(`/collector/tasks/${assignmentA._id}/start`, {
      method: 'PATCH',
      token: betaToken
    });
    assertTest(
      'Start Tenancy Guard',
      'Collector Beta cannot start Collector Alpha task (403 Forbidden)',
      resBetaStart.status === 403
    );

    // Alpha starts work
    const resAlphaStart = await apiCall(`/collector/tasks/${assignmentA._id}/start`, {
      method: 'PATCH',
      token: alphaToken
    });
    assertTest(
      'Start Work',
      'Collector Alpha starts task (200 OK) with status in_progress',
      resAlphaStart.status === 200 && resAlphaStart.body.task.status === 'in_progress'
    );

    // Check complaint status updated to in_progress
    const complaintAfterStart = await Complaint.findById(complaintA._id).lean();
    assertTest(
      'Complaint State Updated',
      'Associated complaint transitioned to in_progress in database',
      complaintAfterStart.status === 'in_progress'
    );

    // Check collector availability set to busy
    const collectorAfterStart = await User.findById(collectorAlpha._id).lean();
    assertTest(
      'Collector Availability',
      'Collector availability updated to busy upon task commencement',
      collectorAfterStart.availability === 'busy'
    );

    // Re-start guard: cannot start already in-progress task -> 400 Bad Request
    const resRepeatStart = await apiCall(`/collector/tasks/${assignmentA._id}/start`, {
      method: 'PATCH',
      token: alphaToken
    });
    assertTest(
      'Re-start Guard',
      'Cannot start work on a task already in progress (400 Bad Request)',
      resRepeatStart.status === 400
    );

    // -------------------------------------------------------------------------
    // SECTION 7: SUBMISSION FOR VERIFICATION WITH PHOTO EVIDENCE
    // -------------------------------------------------------------------------
    console.log('\n7. Completion Evidence Submission & Verification Routing:');

    // Attempt submission without images -> 400 Bad Request
    const resSubmitNoImg = await apiCall(`/collector/tasks/${assignmentA._id}/submit`, {
      method: 'POST',
      token: alphaToken,
      body: { notes: 'Finished without photo' }
    });
    assertTest(
      'Evidence Requirement',
      'Submitting completion without photograph rejected with 400 Bad Request',
      resSubmitNoImg.status === 400
    );

    // Create genuine 1x1 PNG byte buffer
    const tinyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const formData = new FormData();
    const pngBlob = new Blob([tinyPngBuffer], { type: 'image/png' });
    formData.append('images', pngBlob, 'evidence_completion.png');
    formData.append('notes', 'Canal waterway cleared of 4 bags of plastic waste and debris.');

    const resSubmitValid = await apiCall(`/collector/tasks/${assignmentA._id}/submit`, {
      method: 'POST',
      token: alphaToken,
      body: formData,
      isFormData: true
    });

    assertTest(
      'Submit Evidence',
      'Collector submits completion evidence (200 OK) with status submitted_for_verification',
      resSubmitValid.status === 200 &&
        resSubmitValid.body.task.status === 'submitted_for_verification'
    );

    // Check completionImages stored
    assertTest(
      'Completion Evidence Stored',
      'Assignment document stores completionImages array with URL and publicId',
      Array.isArray(resSubmitValid.body.task.completionImages) &&
        resSubmitValid.body.task.completionImages.length >= 1 &&
        Boolean(resSubmitValid.body.task.completionImages[0].url)
    );

    // Verify complaint transitioned to awaiting_verification (NOT resolved)
    const complaintAfterSubmit = await Complaint.findById(complaintA._id).lean();
    assertTest(
      'Supervisory Audit State',
      'Complaint transitioned to awaiting_verification (Collectors CANNOT mark resolved)',
      complaintAfterSubmit.status === 'awaiting_verification'
    );

    // Verify collector availability restored to available
    const collectorAfterSubmit = await User.findById(collectorAlpha._id).lean();
    assertTest(
      'Availability Restored',
      'Collector availability restored to available after task completion submission',
      collectorAfterSubmit.availability === 'available'
    );

    // Re-submission guard: cannot re-submit task that is already submitted
    const resRepeatSubmit = await apiCall(`/collector/tasks/${assignmentA._id}/submit`, {
      method: 'POST',
      token: alphaToken,
      body: formData,
      isFormData: true
    });
    assertTest(
      'Re-submission Guard',
      'Cannot submit work on task already submitted for verification (400 Bad Request)',
      resRepeatSubmit.status === 400
    );

    // -------------------------------------------------------------------------
    // SECTION 8: AVAILABILITY UPDATES & AUDIT ACTIVITY LOGGING
    // -------------------------------------------------------------------------
    console.log('\n8. Availability Self-Service & Audit Trail:');

    // Collector updates availability to unavailable
    const resAvailUpdate = await apiCall('/collector/availability', {
      method: 'PATCH',
      token: alphaToken,
      body: { availability: 'unavailable' }
    });

    assertTest(
      'Update Availability',
      'Collector updates duty status to unavailable (200 OK)',
      resAvailUpdate.status === 200 && resAvailUpdate.body.availability === 'unavailable'
    );

    // Invalid availability option -> 400 Bad Request
    const resInvalidAvail = await apiCall('/collector/availability', {
      method: 'PATCH',
      token: alphaToken,
      body: { availability: 'sleeping_on_duty' }
    });
    assertTest(
      'Availability Validation',
      'Invalid availability value rejected with 400 Bad Request',
      resInvalidAvail.status === 400
    );

    // Verify ActivityLog entries for collector actions
    const auditLogs = await ActivityLog.find({
      actor: collectorAlpha._id
    }).lean();

    const loggedActions = auditLogs.map((l) => l.action);
    assertTest(
      'Audit Logging',
      'ActivityLog records ASSIGNMENT_ACCEPTED, TASK_STARTED, and TASK_SUBMITTED_FOR_VERIFICATION',
      loggedActions.includes('ASSIGNMENT_ACCEPTED') &&
        loggedActions.includes('TASK_STARTED') &&
        loggedActions.includes('TASK_SUBMITTED_FOR_VERIFICATION')
    );

    // Verify Notification generated for Citizen
    const citizenNotifs = await Notification.find({
      user: citizenUser._id,
      relatedComplaint: complaintA._id
    }).lean();

    assertTest(
      'Citizen Notification',
      'Citizen received notifications for cleanup commencement and verification audit',
      citizenNotifs.length >= 2
    );

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\nCleaning up verification records...');
    const testComplaintIds = [complaintA._id];
    const testUserIds = [adminUser._id, citizenUser._id, collectorAlpha._id, collectorBeta._id];

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

runPhase7Verification().then(() => {
  process.exit(0);
});

