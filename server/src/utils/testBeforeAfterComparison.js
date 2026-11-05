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
import Notification from '../models/Notification.js';
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

export const runBeforeAfterAudit = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — BEFORE & AFTER PHOTO COMPARISON & VERIFICATION AUDIT');
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
    const testPassword = 'AuditCompare@123';
    const hashedPassword = await hashPassword(testPassword);

    // 1. Seed Administrator
    const adminUser = await User.create({
      name: `Admin Comp Audit ${stamp}`,
      email: `admin_compare_${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true,
      accountStatus: 'active'
    });
    testUserIds.push(adminUser._id);
    const adminToken = generateToken(adminUser);

    // 2. Seed Citizen (role: 'user')
    const citizenUser = await User.create({
      name: `Citizen Comp Audit ${stamp}`,
      email: `citizen_compare_${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true,
      accountStatus: 'active',
      greenPoints: 0,
      lifetimePoints: 0
    });
    testUserIds.push(citizenUser._id);
    const citizenToken = generateToken(citizenUser);

    // 3. Seed Waste Collector
    const collectorUser = await User.create({
      name: `Collector Comp Audit ${stamp}`,
      email: `collector_compare_${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'collector',
      isVerified: true,
      accountStatus: 'active',
      availability: 'busy'
    });
    testUserIds.push(collectorUser._id);
    const collectorToken = generateToken(collectorUser);

    // 4. Seed Complaint with Citizen BEFORE photos
    const complaintCode = `CMP-COMP-${stamp.toString().slice(-6)}`;
    const beforeImagesSeed = [
      {
        url: 'https://res.cloudinary.com/cleanloop/image/upload/v1/cleanloop/complaints/before_dump_1.jpg',
        publicId: `cleanloop/complaints/before_dump_1_${stamp}`
      },
      {
        url: 'https://res.cloudinary.com/cleanloop/image/upload/v1/cleanloop/complaints/before_dump_2.jpg',
        publicId: `cleanloop/complaints/before_dump_2_${stamp}`
      }
    ];

    const complaint = await Complaint.create({
      complaintCode,
      user: citizenUser._id,
      category: 'plastic',
      reportedPriority: 'high',
      priority: 'high',
      status: 'awaiting_verification',
      assignedCollector: collectorUser._id,
      description: 'Severe municipal plastic waste accumulation obstructing storm drainage.',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
        address: {
          formattedAddress: 'MG Road Junction, Ward 112, Bengaluru',
          street: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001'
        }
      },
      images: beforeImagesSeed,
      statusHistory: [
        {
          status: 'pending',
          changedBy: citizenUser._id,
          note: 'Initial incident reported by citizen with 2 photographs',
          changedAt: new Date(Date.now() - 3600000 * 4)
        },
        {
          status: 'under_review',
          changedBy: adminUser._id,
          note: 'Administrative assessment underway',
          changedAt: new Date(Date.now() - 3600000 * 3)
        },
        {
          status: 'assigned',
          changedBy: adminUser._id,
          note: `Dispatched to collector ${collectorUser.name}`,
          changedAt: new Date(Date.now() - 3600000 * 2)
        },
        {
          status: 'in_progress',
          changedBy: collectorUser._id,
          note: 'Field crew arrived and commenced waste remediation',
          changedAt: new Date(Date.now() - 3600000 * 1)
        },
        {
          status: 'awaiting_verification',
          changedBy: collectorUser._id,
          note: 'Remediation completed; photographic evidence submitted for supervisory verification',
          changedAt: new Date()
        }
      ]
    });
    testComplaintIds.push(complaint._id);

    // 5. Seed Assignment with Collector AFTER photos
    const afterImagesSeed = [
      {
        url: 'https://res.cloudinary.com/cleanloop/image/upload/v1/cleanloop/completions/after_clean_1.jpg',
        publicId: `cleanloop/completions/after_clean_1_${stamp}`
      },
      {
        url: 'https://res.cloudinary.com/cleanloop/image/upload/v1/cleanloop/completions/after_clean_2.jpg',
        publicId: `cleanloop/completions/after_clean_2_${stamp}`
      }
    ];

    const assignment = await Assignment.create({
      complaint: complaint._id,
      collector: collectorUser._id,
      assignedBy: adminUser._id,
      status: 'submitted_for_verification',
      assignedAt: new Date(Date.now() - 3600000 * 2),
      acceptedAt: new Date(Date.now() - 3600000 * 2 + 60000),
      startedAt: new Date(Date.now() - 3600000 * 1),
      submittedAt: new Date(),
      completionImages: afterImagesSeed,
      notes: 'Area thoroughly cleared and disinfected. 2.4 tonnes of plastic collected and dispatched to recycling centre.'
    });
    testAssignmentIds.push(assignment._id);

    console.log('\n--- SECTION 1: ROLE-BASED ACCESS CONTROL ON ADMIN DETAIL API ---');
    // Test 1.1: Unauthenticated request fails
    const unauthRes = await apiCall(`/admin/complaints/${complaint._id}`);
    assertCheck(
      'RBAC',
      'Unauthenticated request to GET /admin/complaints/:id is rejected with 401',
      unauthRes.status === 401,
      `Status: ${unauthRes.status}`
    );

    // Test 1.2: Citizen request fails with 403
    const citizenRes = await apiCall(`/admin/complaints/${complaint._id}`, { token: citizenToken });
    assertCheck(
      'RBAC',
      'Citizen request to GET /admin/complaints/:id is rejected with 403 Forbidden',
      citizenRes.status === 403,
      `Status: ${citizenRes.status}`
    );

    // Test 1.3: Collector request fails with 403
    const collectorRes = await apiCall(`/admin/complaints/${complaint._id}`, { token: collectorToken });
    assertCheck(
      'RBAC',
      'Collector request to GET /admin/complaints/:id is rejected with 403 Forbidden',
      collectorRes.status === 403,
      `Status: ${collectorRes.status}`
    );

    console.log('\n--- SECTION 2: ADMIN DETAIL FETCH & COMPARISON DATA AUDIT ---');
    // Test 2.1: Admin gets complaint and assignment data
    const adminDetailRes = await apiCall(`/admin/complaints/${complaint._id}`, { token: adminToken });
    assertCheck(
      'Admin Detail API',
      'Admin request succeeds with 200 OK',
      adminDetailRes.status === 200 && adminDetailRes.body.success === true,
      `Status: ${adminDetailRes.status}`
    );

    const fetchedComplaint = adminDetailRes.body.complaint;
    const fetchedAssignments = adminDetailRes.body.assignments;

    // Test 2.2: BEFORE photos inspection
    assertCheck(
      'BEFORE Photos',
      'Complaint contains exact citizen BEFORE images with URLs and publicIds',
      Array.isArray(fetchedComplaint.images) &&
        fetchedComplaint.images.length === 2 &&
        fetchedComplaint.images[0].url === beforeImagesSeed[0].url &&
        fetchedComplaint.images[1].url === beforeImagesSeed[1].url,
      `Found ${fetchedComplaint.images?.length} images`
    );

    // Test 2.3: Citizen metadata attached to complaint
    assertCheck(
      'BEFORE Metadata',
      'Complaint includes reporting citizen name and email',
      fetchedComplaint.user &&
        fetchedComplaint.user.name === citizenUser.name &&
        fetchedComplaint.user.email === citizenUser.email,
      `Citizen: ${JSON.stringify(fetchedComplaint.user)}`
    );

    // Test 2.4: AFTER photos inspection in assignments
    assertCheck(
      'AFTER Photos',
      'Assignments audit trail contains completion evidence uploaded by collector',
      Array.isArray(fetchedAssignments) &&
        fetchedAssignments.length > 0 &&
        Array.isArray(fetchedAssignments[0].completionImages) &&
        fetchedAssignments[0].completionImages.length === 2 &&
        fetchedAssignments[0].completionImages[0].url === afterImagesSeed[0].url,
      `Found ${fetchedAssignments[0]?.completionImages?.length} completion images`
    );

    // Test 2.5: Collector metadata & notes attached to assignment
    assertCheck(
      'AFTER Metadata',
      'Assignment contains collector identity, submission timestamp, and remediation notes',
      fetchedAssignments[0].collector &&
        fetchedAssignments[0].collector.name === collectorUser.name &&
        Boolean(fetchedAssignments[0].submittedAt) &&
        fetchedAssignments[0].notes.includes('2.4 tonnes of plastic'),
      `Collector: ${fetchedAssignments[0]?.collector?.name}, Notes: ${fetchedAssignments[0]?.notes}`
    );

    console.log('\n--- SECTION 3: PRE-VERIFICATION INTEGRITY CHECK ---');
    // Test 3.1: Citizen has 0 points before verification
    const resSummaryPre = await apiCall('/rewards/summary', { token: citizenToken });
    const preTxCount = await PointsTransaction.countDocuments({ user: citizenUser._id });
    assertCheck(
      'Pre-Verification',
      'Zero Green Points awarded to citizen prior to supervisory verification',
      resSummaryPre.status === 200 &&
        resSummaryPre.body.summary?.balance === 0 &&
        preTxCount === 0,
      `Balance: ${resSummaryPre.body.summary?.balance}, Tx count: ${preTxCount}`
    );

    // Test 3.2: Status is awaiting_verification
    assertCheck(
      'Pre-Verification',
      'Complaint status is awaiting_verification and assignment is submitted_for_verification',
      fetchedComplaint.status === 'awaiting_verification' &&
        fetchedAssignments[0].status === 'submitted_for_verification',
      `Complaint status: ${fetchedComplaint.status}, Assignment: ${fetchedAssignments[0].status}`
    );

    console.log('\n--- SECTION 4: ADMIN VERIFICATION & LIFECYCLE RESOLUTION ---');
    // Test 4.1: Admin verifies the remediation after inspecting Before & After photos
    const verifyRes = await apiCall(`/admin/complaints/${complaint._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        note: 'Before and After photographic verification approved. Complete remediation confirmed.'
      }
    });

    assertCheck(
      'Verification Action',
      'Admin verification succeeds with 200 OK and returns reward summary',
      verifyRes.status === 200 &&
        verifyRes.body.success === true &&
        verifyRes.body.reward?.points >= 50,
      `Status: ${verifyRes.status}, Reward points: ${verifyRes.body.reward?.points}`
    );

    // Test 4.2: Complaint status is updated to resolved in database
    const resolvedComplaintDoc = await Complaint.findById(complaint._id);
    assertCheck(
      'Complaint Resolution',
      'Complaint status is updated to "resolved" with valid resolvedAt timestamp',
      resolvedComplaintDoc.status === 'resolved' && Boolean(resolvedComplaintDoc.resolvedAt),
      `Status: ${resolvedComplaintDoc.status}, resolvedAt: ${resolvedComplaintDoc.resolvedAt}`
    );

    // Test 4.3: Assignment status is updated to verified in database
    const verifiedAssignmentDoc = await Assignment.findById(assignment._id);
    assertCheck(
      'Assignment Verification',
      'Assignment status is updated to "verified" with valid verifiedAt timestamp',
      verifiedAssignmentDoc.status === 'verified' && Boolean(verifiedAssignmentDoc.verifiedAt),
      `Status: ${verifiedAssignmentDoc.status}, verifiedAt: ${verifiedAssignmentDoc.verifiedAt}`
    );

    // Test 4.4: Green Points awarded to citizen ledger
    const resSummaryPost = await apiCall('/rewards/summary', { token: citizenToken });
    const postTx = await PointsTransaction.findOne({
      user: citizenUser._id,
      complaint: complaint._id,
      type: 'complaint_resolved'
    });
    if (postTx) testTxIds.push(postTx._id);

    assertCheck(
      'Green Points Ledger',
      'Citizen received Green Points recorded in immutable transaction ledger and summary',
      resSummaryPost.status === 200 &&
        resSummaryPost.body.summary?.balance >= 50 &&
        postTx !== null &&
        postTx.points >= 50 &&
        postTx.type === 'complaint_resolved',
      `Citizen balance: ${resSummaryPost.body.summary?.balance}, Tx points: ${postTx?.points}`
    );

    // Test 4.5: Citizen notification generated
    const citizenNotifs = await Notification.find({ user: citizenUser._id });
    const hasRewardNotif = citizenNotifs.some(
      (n) => n.type === 'reward' || (n.title && n.title.includes('Points'))
    );
    assertCheck(
      'Citizen Notification',
      'Citizen receives verification and point credit notification',
      hasRewardNotif,
      `Found ${citizenNotifs.length} notifications`
    );

    // Test 4.6: Re-fetching admin complaint detail confirms both before and after images remain accessible
    const postVerifyDetail = await apiCall(`/admin/complaints/${complaint._id}`, { token: adminToken });
    const postAssignments = postVerifyDetail.body.assignments || [];
    assertCheck(
      'Post-Verification Detail',
      'After verification, GET /admin/complaints/:id still returns both BEFORE and AFTER photo sets',
      postVerifyDetail.body.complaint.images.length === 2 &&
        postAssignments.length > 0 &&
        postAssignments[0].completionImages.length === 2 &&
        postAssignments[0].status === 'verified',
      `Images count: before=${postVerifyDetail.body.complaint?.images?.length}, after=${postAssignments[0]?.completionImages?.length}`
    );

    console.log('\n--- SECTION 5: IDEMPOTENCY & DUPLICATE PROTECTION ---');
    // Test 5.1: Duplicate verification call is safely rejected with 400 Bad Request
    const repeatVerifyRes = await apiCall(`/admin/complaints/${complaint._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Repeat verification attempt' }
    });

    const resSummaryRepeat = await apiCall('/rewards/summary', { token: citizenToken });
    const totalTxForComplaint = await PointsTransaction.countDocuments({
      user: citizenUser._id,
      complaint: complaint._id
    });

    assertCheck(
      'Idempotency Protection',
      'Subsequent verification attempt rejected with 400 and does not duplicate green points or transactions',
      repeatVerifyRes.status === 400 &&
        resSummaryRepeat.body.summary?.balance === resSummaryPost.body.summary?.balance &&
        totalTxForComplaint === 1,
      `Repeat status: ${repeatVerifyRes.status}, Balance: ${resSummaryRepeat.body.summary?.balance}, Transactions: ${totalTxForComplaint}`
    );

    console.log('\n================================================================');
    console.log(` AUDIT TOTALS: ${results.passed} PASSED | ${results.failed} FAILED`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('[Audit Execution Error]:', error);
  } finally {
    // Teardown test artifacts
    console.log('[Teardown] Cleaning up test records from database...');
    try {
      if (testTxIds.length > 0) {
        await PointsTransaction.deleteMany({ _id: { $in: testTxIds } });
      }
      if (testAssignmentIds.length > 0) {
        await Assignment.deleteMany({ _id: { $in: testAssignmentIds } });
      }
      if (testComplaintIds.length > 0) {
        await Complaint.deleteMany({ _id: { $in: testComplaintIds } });
        await Notification.deleteMany({ complaint: { $in: testComplaintIds } });
      }
      if (testUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: testUserIds } });
      }
    } catch (cleanupErr) {
      console.warn('[Cleanup Warning]:', cleanupErr.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDB();
    console.log('[Database] Disconnected from MongoDB.');

    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runBeforeAfterAudit();
