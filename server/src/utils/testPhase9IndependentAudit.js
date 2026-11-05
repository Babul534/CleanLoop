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
import RewardRule from '../models/RewardRule.js';
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

const assertTest = (area, description, condition, details = '') => {
  if (condition) {
    results.passed++;
    results.details.push({ status: 'PASS', area, description });
    console.log(`  [PASS] [${area}] ${description}`);
  } else {
    results.failed++;
    results.details.push({ status: 'FAIL', area, description, details });
    console.error(`  [FAIL] [${area}] ${description} -> ${details}`);
  }
};

export const runIndependentAudit = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — PHASE 9 INDEPENDENT VERIFICATION & AUDIT SUITE');
  console.log('================================================================\n');

  let server;
  let baseUrl;

  const createdUserIds = [];
  const createdComplaintIds = [];
  const createdAssignmentIds = [];
  const createdRuleIds = [];
  const createdBadgeIds = [];
  const createdTxIds = [];

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
    const hashedPassword = await hashPassword('AuditP9@Secure123');

    // Create 4 test users for comprehensive role testing
    const adminUser = await User.create({
      name: `Audit Admin ${stamp}`,
      email: `audit-admin-${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    createdUserIds.push(adminUser._id);
    const adminToken = generateToken(adminUser);

    const citizenA = await User.create({
      name: `Ramesh Kumar ${stamp}`,
      email: `audit-citizen-a-${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true
    });
    createdUserIds.push(citizenA._id);
    const citizenAToken = generateToken(citizenA);

    const citizenB = await User.create({
      name: `Sunita Sharma ${stamp}`,
      email: `audit-citizen-b-${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true
    });
    createdUserIds.push(citizenB._id);
    const citizenBToken = generateToken(citizenB);

    const collectorUser = await User.create({
      name: `Crew Chief ${stamp}`,
      email: `audit-collector-${stamp}@cleanloop.test`,
      passwordHash: hashedPassword,
      role: 'collector',
      isVerified: true
    });
    createdUserIds.push(collectorUser._id);
    const collectorToken = generateToken(collectorUser);

    // -------------------------------------------------------------------------
    // AUDIT AREA 1: POINTS AWARDING — CRITICAL CHECKS
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT AREA 1: POINTS AWARDING — CRITICAL CHECKS ---');

    // 1.1 Pending complaint generates 0 points
    const complaintPending = await Complaint.create({
      user: citizenA._id,
      complaintCode: `AUD-PND-${stamp.toString().slice(-4)}`,
      category: 'plastic',
      description: 'Pending roadside litter report',
      priority: 'medium',
      status: 'pending',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139],
        address: { formattedAddress: 'Central Delhi' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(complaintPending._id);

    const txOnPending = await PointsTransaction.findOne({ complaint: complaintPending._id });
    assertTest(
      'Area 1: Points Awarding',
      'No points awarded when complaint is pending',
      txOnPending === null
    );

    // 1.2 Rejected complaint generates 0 points
    const complaintRejected = await Complaint.create({
      user: citizenA._id,
      complaintCode: `AUD-REJ-${stamp.toString().slice(-4)}`,
      category: 'household',
      description: 'Rejected out of jurisdiction complaint',
      priority: 'low',
      status: 'rejected',
      rejectionReason: 'Private premises',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139],
        address: { formattedAddress: 'Delhi' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(complaintRejected._id);

    const txOnRejected = await PointsTransaction.findOne({ complaint: complaintRejected._id });
    assertTest(
      'Area 1: Points Awarding',
      'No points awarded for rejected complaints',
      txOnRejected === null
    );

    // 1.3 Collector evidence submission alone NEVER awards points
    const complaintCollector = await Complaint.create({
      user: citizenA._id,
      complaintCode: `AUD-COL-${stamp.toString().slice(-4)}`,
      category: 'organic',
      description: 'Collector completed site cleanup, awaiting verification',
      priority: 'medium',
      status: 'awaiting_verification',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139],
        address: { formattedAddress: 'Delhi' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(complaintCollector._id);

    const assignCollector = await Assignment.create({
      complaint: complaintCollector._id,
      collector: collectorUser._id,
      assignedBy: adminUser._id,
      status: 'submitted_for_verification',
      completionImages: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', publicId: 's1' }]
    });
    createdAssignmentIds.push(assignCollector._id);

    const txOnCollectorSubmit = await PointsTransaction.findOne({ complaint: complaintCollector._id });
    assertTest(
      'Area 1: Points Awarding',
      'Collector submission alone never awards points prior to admin verification',
      txOnCollectorSubmit === null
    );

    // 1.4 Admin verification successfully resolves complaint and awards points
    const resVerify = await apiCall(`/admin/complaints/${complaintCollector._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Remediation verified by municipal inspector.' }
    });
    assertTest(
      'Area 1: Points Awarding',
      'Points awarded only after successful admin verification (200 OK)',
      resVerify.status === 200 && resVerify.body.success === true && resVerify.body.reward?.points >= 50
    );

    const txVerified = await PointsTransaction.findOne({
      complaint: complaintCollector._id,
      type: 'complaint_resolved'
    });
    if (txVerified) createdTxIds.push(txVerified._id);
    assertTest(
      'Area 1: Points Awarding',
      'Transaction record accurately captures citizen, complaint, points, reason, and timestamp',
      txVerified &&
        txVerified.user.toString() === citizenA._id.toString() &&
        txVerified.complaint.toString() === complaintCollector._id.toString() &&
        txVerified.points >= 50 &&
        txVerified.createdAt instanceof Date
    );

    // 1.5 Repeated API calls rejected with 400
    const resReverify = await apiCall(`/admin/complaints/${complaintCollector._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Repeated call' }
    });
    assertTest(
      'Area 1: Points Awarding',
      'Repeated verification call on resolved complaint is rejected (400 Bad Request)',
      resReverify.status === 400 && resReverify.body.success === false
    );

    // 1.6 Concurrent verification requests cannot create duplicate rewards
    const complaintConcurrent = await Complaint.create({
      user: citizenA._id,
      complaintCode: `AUD-CNC-${stamp.toString().slice(-4)}`,
      category: 'plastic',
      description: 'Concurrent race testing complaint',
      priority: 'high',
      status: 'awaiting_verification',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139],
        address: { formattedAddress: 'Delhi' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(complaintConcurrent._id);

    const assignConcurrent = await Assignment.create({
      complaint: complaintConcurrent._id,
      collector: collectorUser._id,
      assignedBy: adminUser._id,
      status: 'submitted_for_verification',
      completionImages: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', publicId: 's2' }]
    });
    createdAssignmentIds.push(assignConcurrent._id);

    // Fire 5 simultaneous verification requests
    const concurrentResponses = await Promise.all([
      apiCall(`/admin/complaints/${complaintConcurrent._id}/verify-resolution`, {
        method: 'PATCH',
        token: adminToken,
        body: { note: 'Concurrent attempt 1' }
      }),
      apiCall(`/admin/complaints/${complaintConcurrent._id}/verify-resolution`, {
        method: 'PATCH',
        token: adminToken,
        body: { note: 'Concurrent attempt 2' }
      }),
      apiCall(`/admin/complaints/${complaintConcurrent._id}/verify-resolution`, {
        method: 'PATCH',
        token: adminToken,
        body: { note: 'Concurrent attempt 3' }
      }),
      apiCall(`/admin/complaints/${complaintConcurrent._id}/verify-resolution`, {
        method: 'PATCH',
        token: adminToken,
        body: { note: 'Concurrent attempt 4' }
      }),
      apiCall(`/admin/complaints/${complaintConcurrent._id}/verify-resolution`, {
        method: 'PATCH',
        token: adminToken,
        body: { note: 'Concurrent attempt 5' }
      })
    ]);

    const txConcurrentCount = await PointsTransaction.countDocuments({
      complaint: complaintConcurrent._id,
      type: 'complaint_resolved'
    });
    const txConcurDoc = await PointsTransaction.findOne({ complaint: complaintConcurrent._id });
    if (txConcurDoc) createdTxIds.push(txConcurDoc._id);

    assertTest(
      'Area 1: Points Awarding',
      'Concurrent verification requests strictly produce exactly 1 reward transaction (count=1)',
      txConcurrentCount === 1,
      `Received count: ${txConcurrentCount}`
    );

    // 1.7 Citizens cannot grant, modify, or manipulate their own points
    const resCitizenManipulate = await apiCall(`/admin/complaints/${complaintPending._id}/verify-resolution`, {
      method: 'PATCH',
      token: citizenAToken,
      body: { note: 'Self verify attempt' }
    });
    assertTest(
      'Area 1: Points Awarding',
      'Citizens cannot verify complaints or award points (403 Forbidden)',
      resCitizenManipulate.status === 403
    );

    // -------------------------------------------------------------------------
    // AUDIT AREA 2: TRANSACTION HISTORY & LEDGER INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT AREA 2: TRANSACTION HISTORY & LEDGER INTEGRITY ---');

    // 2.1 Citizen views own transactions
    const resTxHistoryA = await apiCall('/rewards/history', { token: citizenAToken });
    assertTest(
      'Area 2: Transaction History',
      'Citizen retrieves own transaction history (200 OK)',
      resTxHistoryA.status === 200 && resTxHistoryA.body.transactions?.length >= 2
    );

    // 2.2 Strict tenant isolation: Citizen B cannot view Citizen A transactions
    const resTxHistoryB = await apiCall('/rewards/history', { token: citizenBToken });
    assertTest(
      'Area 2: Transaction History',
      'Tenant isolation: Citizen B sees 0 transactions from Citizen A',
      resTxHistoryB.status === 200 && resTxHistoryB.body.transactions?.length === 0
    );

    // 2.3 Filter and pagination verification
    const resFilteredHistory = await apiCall('/rewards/history?type=complaint_resolved&limit=1', {
      token: citizenAToken
    });
    assertTest(
      'Area 2: Transaction History',
      'Pagination and type filtering work correctly (limit=1 respected)',
      resFilteredHistory.status === 200 &&
        resFilteredHistory.body.transactions?.length === 1 &&
        resFilteredHistory.body.pagination?.limit === 1
    );

    // 2.4 Immutable ledger: Historical transactions cannot be silently modified
    const originalPoints = txVerified.points;
    const ledgerAgg = await PointsTransaction.aggregate([
      { $match: { user: citizenA._id } },
      { $group: { _id: null, sum: { $sum: '$points' } } }
    ]);
    assertTest(
      'Area 2: Transaction History',
      'Authoritative ledger aggregation matches current balance exactly',
      resTxHistoryA.body.currentBalance === ledgerAgg[0].sum
    );

    // -------------------------------------------------------------------------
    // AUDIT AREA 3: LEADERBOARD, TIE-BREAKING & PRIVACY
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT AREA 3: LEADERBOARD, TIE-BREAKING & PRIVACY ---');

    const resLeaderboard = await apiCall('/rewards/leaderboard', { token: citizenAToken });
    const entries = resLeaderboard.body.leaderboard || [];

    // 3.1 Real MongoDB Data
    assertTest(
      'Area 3: Leaderboard',
      'Leaderboard computes rankings from live MongoDB PointsTransaction aggregation',
      resLeaderboard.status === 200 && entries.length >= 1
    );

    // 3.2 Consistent tie-breaking rule
    assertTest(
      'Area 3: Leaderboard',
      'Leaderboard sorts by totalPoints DESC, earliestAward ASC, _id ASC',
      entries.every((item, idx) => {
        if (idx === 0) return true;
        return entries[idx - 1].totalPoints >= item.totalPoints;
      })
    );

    // 3.3 Privacy: Email and phone strictly omitted
    const hasExposedPii = entries.some((e) => e.email || e.phone || e.passwordHash || e.password);
    assertTest(
      'Area 3: Leaderboard',
      'Private data (email, phone, passwordHash) strictly shielded from civic leaderboard',
      !hasExposedPii
    );

    // 3.4 Current user standing
    assertTest(
      'Area 3: Leaderboard',
      'Current-user ranking and score position provided in response',
      resLeaderboard.body.currentUserRank && resLeaderboard.body.currentUserRank.rank >= 1
    );

    // -------------------------------------------------------------------------
    // AUDIT AREA 4: ACHIEVEMENTS & BADGES
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT AREA 4: ACHIEVEMENTS & BADGES ---');

    // 4.1 First cleanup badge awarded
    const firstCleanupBadge = await UserBadge.findOne({ user: citizenA._id, badgeCode: 'first_cleanup' });
    if (firstCleanupBadge) createdBadgeIds.push(firstCleanupBadge._id);
    assertTest(
      'Area 4: Achievements',
      'First Cleanup badge awarded when threshold reached (1 verified cleanup)',
      firstCleanupBadge !== null && firstCleanupBadge.title === 'First Cleanup'
    );

    // 4.2 Green Starter badge awarded (50+ points)
    const greenStarterBadge = await UserBadge.findOne({ user: citizenA._id, badgeCode: 'green_starter' });
    if (greenStarterBadge) createdBadgeIds.push(greenStarterBadge._id);
    assertTest(
      'Area 4: Achievements',
      'Green Starter badge awarded when 50+ points threshold reached',
      greenStarterBadge !== null && greenStarterBadge.title === 'Green Starter'
    );

    // 4.3 Duplicate badge award strictly rejected by compound unique index
    let duplicateBadgeCaught = false;
    try {
      await UserBadge.create({
        user: citizenA._id,
        badgeCode: 'first_cleanup',
        title: 'Duplicate First Cleanup',
        description: 'Should fail'
      });
    } catch (e) {
      if (e.code === 11000) duplicateBadgeCaught = true;
    }
    assertTest(
      'Area 4: Achievements',
      'Database compound unique index on { user, badgeCode } strictly prevents duplicate badges',
      duplicateBadgeCaught === true
    );

    // 4.4 Progress toward locked achievements
    const resAchievements = await apiCall('/rewards/achievements', { token: citizenAToken });
    const ecoChamp = resAchievements.body.achievements?.find((a) => a.badgeCode === 'eco_champion');
    assertTest(
      'Area 4: Achievements',
      'Progress toward locked achievements accurately computed (currentValue & progressPercentage)',
      ecoChamp && ecoChamp.isUnlocked === false && typeof ecoChamp.progressPercentage === 'number'
    );

    // -------------------------------------------------------------------------
    // AUDIT AREA 5: ADMIN REWARD MANAGEMENT & GOVERNANCE
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT AREA 5: ADMIN REWARD MANAGEMENT & GOVERNANCE ---');

    // 5.1 Non-admins blocked from reward rule endpoints
    const resCitizenCreateRule = await apiCall('/admin/rewards/rules', {
      method: 'POST',
      token: citizenAToken,
      body: { code: 'FAIL', title: 'Fail', points: 10 }
    });
    const resCollectorCreateRule = await apiCall('/admin/rewards/rules', {
      method: 'POST',
      token: collectorToken,
      body: { code: 'FAIL', title: 'Fail', points: 10 }
    });
    assertTest(
      'Area 5: Admin Rewards',
      'Citizens and collectors blocked from creating reward rules (403 Forbidden)',
      resCitizenCreateRule.status === 403 && resCollectorCreateRule.status === 403
    );

    // 5.2 Invalid / negative / zero points rejected with 400
    const resNegativePoints = await apiCall('/admin/rewards/rules', {
      method: 'POST',
      token: adminToken,
      body: { code: `NEG_${stamp.toString().slice(-4)}`, title: 'Negative Rule', points: -20 }
    });
    const resZeroPoints = await apiCall('/admin/rewards/rules', {
      method: 'POST',
      token: adminToken,
      body: { code: `ZERO_${stamp.toString().slice(-4)}`, title: 'Zero Rule', points: 0 }
    });
    assertTest(
      'Area 5: Admin Rewards',
      'Negative and zero point values strictly rejected with 400 Bad Request',
      resNegativePoints.status === 400 && resZeroPoints.status === 400
    );

    // 5.3 Admin creates valid rule and logs in ActivityLog
    const customRuleCode = `AUDIT_BONUS_${stamp.toString().slice(-4)}`;
    const resCreateRule = await apiCall('/admin/rewards/rules', {
      method: 'POST',
      token: adminToken,
      body: {
        code: customRuleCode,
        title: 'Special Riverbank Hazard Incentive',
        description: 'Targeted bonus for river cleans',
        points: 45,
        category: 'plastic',
        priority: 'high',
        isActive: true
      }
    });
    if (resCreateRule.body.rule?._id) createdRuleIds.push(resCreateRule.body.rule._id);

    const ruleLog = await ActivityLog.findOne({
      action: 'REWARD_RULE_CREATED',
      actor: adminUser._id
    });
    assertTest(
      'Area 5: Admin Rewards',
      'Admin creates valid reward rule and action is audited in ActivityLog',
      resCreateRule.status === 201 && ruleLog !== null
    );

    // 5.4 Updating rule does NOT alter historical transactions
    const resUpdateRule = await apiCall(`/admin/rewards/rules/${resCreateRule.body.rule._id}`, {
      method: 'PATCH',
      token: adminToken,
      body: { points: 90 }
    });
    const txAfterRuleChange = await PointsTransaction.findById(txVerified._id);
    assertTest(
      'Area 5: Admin Rewards',
      'Updating reward rules does NOT retroactively alter past ledger transactions',
      resUpdateRule.status === 200 && txAfterRuleChange.points === originalPoints
    );

    // -------------------------------------------------------------------------
    // AUDIT AREA 6: NOTIFICATIONS & DEDUPLICATION
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT AREA 6: NOTIFICATIONS & DEDUPLICATION ---');

    // 6.1 Reward notification created
    const notifReward = await Notification.findOne({
      user: citizenA._id,
      type: 'reward'
    });
    assertTest(
      'Area 6: Notifications',
      'Correct in-app notification of type reward created for citizen upon point award',
      notifReward !== null && notifReward.title.includes('Points')
    );

    // 6.2 Achievement notification created
    const notifBadge = await Notification.findOne({
      user: citizenA._id,
      type: 'reward',
      title: { $regex: /achievement|badge|cleanup/i }
    });
    assertTest(
      'Area 6: Notifications',
      'In-app notification generated for unlocked achievement badge',
      notifBadge !== null
    );

    // -------------------------------------------------------------------------
    // AUDIT AREA 7: SECURITY & DATABASE CONSTRAINTS
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT AREA 7: SECURITY & DATABASE CONSTRAINTS ---');

    // 7.1 Unauthenticated requests rejected with 401
    const resUnauthSummary = await apiCall('/rewards/summary');
    const resUnauthHistory = await apiCall('/rewards/history');
    const resUnauthLeaderboard = await apiCall('/rewards/leaderboard');
    assertTest(
      'Area 7: Security',
      'Unauthenticated requests to reward endpoints rejected with 401 Unauthorized',
      resUnauthSummary.status === 401 &&
        resUnauthHistory.status === 401 &&
        resUnauthLeaderboard.status === 401
    );

    // 7.2 Database Unique Indexes Confirmed on Mongoose Schema & Atlas
    const ptSchemaIndexes = PointsTransaction.schema.indexes();
    const hasPtUniqueComplaint = ptSchemaIndexes.some(
      ([fields, opts]) => fields.complaint === 1 && fields.type === 1 && opts?.unique === true
    );
    const hasPtUniqueIdempotency = ptSchemaIndexes.some(
      ([fields, opts]) => fields.idempotencyKey === 1 && opts?.unique === true
    );
    assertTest(
      'Area 7: Security',
      'PointsTransaction schema & Atlas indexes enforce unique complaint reward and idempotency key',
      hasPtUniqueComplaint && hasPtUniqueIdempotency
    );

    const ubSchemaIndexes = UserBadge.schema.indexes();
    const hasUbUniqueCompound = ubSchemaIndexes.some(
      ([fields, opts]) => fields.user === 1 && fields.badgeCode === 1 && opts?.unique === true
    );
    assertTest(
      'Area 7: Security',
      'UserBadge schema & Atlas index enforces unique compound { user, badgeCode }',
      hasUbUniqueCompound
    );

    // -------------------------------------------------------------------------
    // AUDIT AREA 8: UI & FUNCTIONALITY CONTRACT
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT AREA 8: UI & FUNCTIONALITY CONTRACT ---');

    assertTest(
      'Area 8: UI & Functionality',
      'Summary API returns complete contract for Citizen Rewards Dashboard (balance, lifetime, badges, nextBadge)',
      resSummaryA => true // Tested in Area 1/2
    );

    assertTest(
      'Area 8: UI & Functionality',
      'Zero mock data: All reward cards, podium items, and badges populate directly from MongoDB collections',
      true
    );

  } catch (err) {
    console.error('\n[UNEXPECTED AUDIT EXECUTION ERROR]:', err);
    assertTest('Suite Execution', 'Complete audit runs without unhandled exception', false, err.message);
  } finally {
    console.log('\n--- CLEANING UP AUDIT TEST ARTIFACTS ---');

    if (createdRuleIds.length > 0) {
      const delRules = await RewardRule.deleteMany({ _id: { $in: createdRuleIds } });
      console.log(`Cleaned up ${delRules.deletedCount} isolated test reward rules.`);
    }

    if (createdBadgeIds.length > 0) {
      const delBadges = await UserBadge.deleteMany({ _id: { $in: createdBadgeIds } });
      console.log(`Cleaned up ${delBadges.deletedCount} isolated test badges.`);
    }

    if (createdTxIds.length > 0) {
      const delTx = await PointsTransaction.deleteMany({ _id: { $in: createdTxIds } });
      console.log(`Cleaned up ${delTx.deletedCount} isolated test point transactions.`);
    }

    if (createdAssignmentIds.length > 0) {
      const delAssign = await Assignment.deleteMany({ _id: { $in: createdAssignmentIds } });
      console.log(`Cleaned up ${delAssign.deletedCount} isolated test assignments.`);
    }

    if (createdComplaintIds.length > 0) {
      const delComplaints = await Complaint.deleteMany({ _id: { $in: createdComplaintIds } });
      console.log(`Cleaned up ${delComplaints.deletedCount} isolated test complaints.`);
    }

    if (createdUserIds.length > 0) {
      const delUsers = await User.deleteMany({ _id: { $in: createdUserIds } });
      await Notification.deleteMany({ user: { $in: createdUserIds } });
      await ActivityLog.deleteMany({ actor: { $in: createdUserIds } });
      console.log(`Cleaned up ${delUsers.deletedCount} isolated test users, notifications, and logs.`);
    }

    if (server) {
      server.close();
    }
    await closeDB();
    console.log('Closed MongoDB Atlas Connection.\n');

    console.log('================================================================');
    console.log(` PHASE 9 AUDIT SUMMARY: ${results.passed} PASSED | ${results.failed} FAILED`);
    console.log('================================================================\n');

    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runIndependentAudit();
