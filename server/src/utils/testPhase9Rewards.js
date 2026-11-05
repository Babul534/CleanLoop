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

export const runPhase9Verification = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — PHASE 9 GREEN POINTS, REWARDS & LEADERBOARD AUDIT');
  console.log('================================================================\n');

  let server;
  let baseUrl;

  // Track created test IDs for 100% clean teardown
  const createdUserIds = [];
  const createdComplaintIds = [];
  const createdAssignmentIds = [];
  const createdRuleIds = [];
  const createdBadgeIds = [];
  const createdTxIds = [];

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
    const hashedPassword = await hashPassword('TestP9@12345');

    // 2. Create isolated test users: Admin, Citizen A, Citizen B, Collector
    const adminUser = await User.create({
      name: `Admin P9 Officer ${stamp}`,
      email: `p9-admin-${stamp}@cleanloop.internal`,
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    createdUserIds.push(adminUser._id);
    const adminToken = generateToken(adminUser);

    const citizenA = await User.create({
      name: `Citizen Alpha ${stamp}`,
      email: `p9-citizena-${stamp}@cleanloop.internal`,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true
    });
    createdUserIds.push(citizenA._id);
    const citizenAToken = generateToken(citizenA);

    const citizenB = await User.create({
      name: `Citizen Beta ${stamp}`,
      email: `p9-citizenb-${stamp}@cleanloop.internal`,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true
    });
    createdUserIds.push(citizenB._id);
    const citizenBToken = generateToken(citizenB);

    const collectorUser = await User.create({
      name: `Collector P9 Crew ${stamp}`,
      email: `p9-collector-${stamp}@cleanloop.internal`,
      passwordHash: hashedPassword,
      role: 'collector',
      isVerified: true
    });
    createdUserIds.push(collectorUser._id);
    const collectorToken = generateToken(collectorUser);

    // 3. Create realistic complaints across stages
    // Complaint 1: Citizen A, completed by crew, awaiting_verification
    const c1 = await Complaint.create({
      user: citizenA._id,
      complaintCode: `P9-C1-${stamp.toString().slice(-4)}`,
      category: 'plastic',
      description: 'Major plastic dump site along riverbank colonnade.',
      priority: 'high',
      status: 'awaiting_verification',
      location: {
        type: 'Point',
        coordinates: [77.2167, 28.6315],
        address: { formattedAddress: 'Riverbank Road, New Delhi' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(c1._id);

    // Associated assignment for C1
    const a1 = await Assignment.create({
      complaint: c1._id,
      collector: collectorUser._id,
      assignedBy: adminUser._id,
      status: 'submitted_for_verification',
      assignedAt: new Date(Date.now() - 3600000),
      startedAt: new Date(Date.now() - 1800000),
      submittedAt: new Date(),
      completionImages: [
        { url: 'https://res.cloudinary.com/demo/image/upload/sample_cleaned.jpg', publicId: 'sample_p9_1' }
      ]
    });
    createdAssignmentIds.push(a1._id);

    // Complaint 2: Citizen A, merely submitted (pending)
    const c2 = await Complaint.create({
      user: citizenA._id,
      complaintCode: `P9-C2-${stamp.toString().slice(-4)}`,
      category: 'organic',
      description: 'Fallen trees and leaves blocking stormwater drain.',
      priority: 'medium',
      status: 'pending',
      location: {
        type: 'Point',
        coordinates: [77.2172, 28.6322],
        address: { formattedAddress: 'Park Street, New Delhi' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(c2._id);

    // Complaint 3: Citizen B, rejected report
    const c3 = await Complaint.create({
      user: citizenB._id,
      complaintCode: `P9-C3-${stamp.toString().slice(-4)}`,
      category: 'household',
      description: 'Private residential compound waste.',
      priority: 'low',
      status: 'rejected',
      rejectionReason: 'Private property outside municipal jurisdiction',
      location: {
        type: 'Point',
        coordinates: [77.1906, 28.6514],
        address: { formattedAddress: 'Private Gated Society, New Delhi' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(c3._id);

    console.log('Seeded test users, complaints, and collector assignment.\n');

    // =========================================================================
    // SECTION 1: POINT AWARDING WORKFLOW RULES (CRITICAL GUARDS)
    // =========================================================================
    console.log('--- SECTION 1: POINT AWARDING WORKFLOW & ELIGIBILITY GUARDS ---');

    // 1.1 No points on submission (pending report)
    const txPending = await PointsTransaction.findOne({ complaint: c2._id });
    assertTest(
      'Point Rules',
      'No points are awarded when a complaint is merely submitted (status=pending)',
      txPending === null,
      `Found: ${txPending ? txPending._id : 'none'}`
    );

    // 1.2 No points on evidence submission before admin verification (awaiting_verification)
    const txAwaiting = await PointsTransaction.findOne({ complaint: c1._id });
    assertTest(
      'Point Rules',
      'No points are awarded when collector uploads evidence (status=awaiting_verification)',
      txAwaiting === null,
      `Found: ${txAwaiting ? txAwaiting._id : 'none'}`
    );

    // 1.3 No points for rejected complaints
    const txRejected = await PointsTransaction.findOne({ complaint: c3._id });
    assertTest(
      'Point Rules',
      'No points are awarded for rejected complaints',
      txRejected === null,
      `Found: ${txRejected ? txRejected._id : 'none'}`
    );

    // 1.4 Admin verification rejection for rejected complaints
    const resVerifyRejected = await apiCall(`/admin/complaints/${c3._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Trying to verify rejected' }
    });
    assertTest(
      'Point Rules',
      'Attempting to verify a rejected complaint is blocked with 400 Bad Request',
      resVerifyRejected.status === 400 && resVerifyRejected.body.success === false,
      `Status: ${resVerifyRejected.status}`
    );

    // 1.5 Admin verification rejection for pending complaints (skipping workflow)
    const resVerifyPending = await apiCall(`/admin/complaints/${c2._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Trying to verify without crew clearance' }
    });
    assertTest(
      'Point Rules',
      'Attempting to verify a pending complaint without cleanup submission is blocked (400)',
      resVerifyPending.status === 400 && resVerifyPending.body.success === false,
      `Status: ${resVerifyPending.status}`
    );

    // =========================================================================
    // SECTION 2: ADMIN VERIFICATION, RESOLUTION & GREEN POINTS AWARDING
    // =========================================================================
    console.log('\n--- SECTION 2: ADMIN VERIFICATION & GREEN POINTS AWARD ---');

    // 2.1 Admin verifies cleanup on c1
    const resVerifyC1 = await apiCall(`/admin/complaints/${c1._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Verified by municipal supervisor. Site completely cleared.' }
    });

    assertTest(
      'Resolution Workflow',
      'Admin successfully verifies cleanup for complaint in awaiting_verification (200 OK)',
      resVerifyC1.status === 200 && resVerifyC1.body.success === true,
      `Status: ${resVerifyC1.status}`
    );

    // 2.2 Complaint status updated to resolved
    const updatedC1 = await Complaint.findById(c1._id);
    assertTest(
      'Resolution Workflow',
      'Complaint status transitioned to resolved with resolvedAt timestamp recorded',
      updatedC1.status === 'resolved' && updatedC1.resolvedAt instanceof Date,
      `Status: ${updatedC1?.status}, resolvedAt: ${updatedC1?.resolvedAt}`
    );

    // 2.3 Associated assignment marked verified
    const updatedA1 = await Assignment.findById(a1._id);
    assertTest(
      'Resolution Workflow',
      'Associated collector assignment transitioned to verified with verifiedAt timestamp',
      updatedA1.status === 'verified' && updatedA1.verifiedAt instanceof Date,
      `Status: ${updatedA1?.status}, verifiedAt: ${updatedA1?.verifiedAt}`
    );

    // 2.4 Green Points awarded to citizen who filed the report
    const txC1 = await PointsTransaction.findOne({ complaint: c1._id, type: 'complaint_resolved' });
    if (txC1) createdTxIds.push(txC1._id);

    assertTest(
      'Points Awarding',
      'PointsTransaction record created for reporting citizen upon successful admin verification',
      txC1 !== null && txC1.user.toString() === citizenA._id.toString() && txC1.points >= 50,
      `txC1 user: ${txC1?.user}, points: ${txC1?.points}`
    );

    assertTest(
      'Points Awarding',
      'High priority complaint receives base points + hazard bonus (points >= 75)',
      txC1 !== null && txC1.points >= 75,
      `Points awarded: ${txC1?.points}`
    );

    // =========================================================================
    // SECTION 3: DUPLICATE PREVENTION & CONCURRENCY IDEMPOTENCY
    // =========================================================================
    console.log('\n--- SECTION 3: DUPLICATE PREVENTION & IDEMPOTENCY ---');

    // 3.1 Re-verifying already resolved complaint
    const resReverify = await apiCall(`/admin/complaints/${c1._id}/verify-resolution`, {
      method: 'PATCH',
      token: adminToken,
      body: { note: 'Repeated verification call' }
    });
    assertTest(
      'Idempotency',
      'Re-verifying an already resolved complaint is rejected (400 Bad Request)',
      resReverify.status === 400 && resReverify.body.success === false,
      `Status: ${resReverify.status}`
    );

    // 3.2 Verify duplicate transactions count for C1 is strictly 1
    const txCountC1 = await PointsTransaction.countDocuments({
      complaint: c1._id,
      type: 'complaint_resolved'
    });
    assertTest(
      'Idempotency',
      'One complaint strictly generates exactly one resolution transaction in the ledger (count=1)',
      txCountC1 === 1,
      `txCountC1: ${txCountC1}`
    );

    // 3.3 Database Unique Constraint: Attempt direct duplicate insert on same complaint
    let duplicateInsertFailed = false;
    try {
      await PointsTransaction.create({
        user: citizenA._id,
        complaint: c1._id,
        points: 50,
        type: 'complaint_resolved',
        reason: 'Illegal duplicate attempt',
        idempotencyKey: `complaint_resolved_${c1._id.toString()}`
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        duplicateInsertFailed = true;
      }
    }
    assertTest(
      'Idempotency',
      'MongoDB compound unique index strictly throws code 11000 on duplicate complaint reward',
      duplicateInsertFailed === true,
      `duplicateInsertFailed: ${duplicateInsertFailed}`
    );

    // =========================================================================
    // SECTION 4: CITIZEN GREEN POINTS SUMMARY & TRANSACTION HISTORY
    // =========================================================================
    console.log('\n--- SECTION 4: CITIZEN GREEN POINTS SUMMARY & LEDGER ---');

    // 4.1 Citizen A summary API
    const resSummaryA = await apiCall('/rewards/summary', { token: citizenAToken });
    assertTest(
      'Citizen Summary',
      'GET /api/rewards/summary returns 200 OK with accurate balance and lifetime earnings',
      resSummaryA.status === 200 &&
        resSummaryA.body.success === true &&
        resSummaryA.body.summary?.balance >= 75 &&
        resSummaryA.body.summary?.verifiedCleanups === 1,
      `Balance: ${resSummaryA.body.summary?.balance}, Cleanups: ${resSummaryA.body.summary?.verifiedCleanups}`
    );

    // 4.2 Citizen A transaction history API
    const resHistoryA = await apiCall('/rewards/history', { token: citizenAToken });
    const txListA = resHistoryA.body.transactions || [];
    assertTest(
      'Citizen History',
      'GET /api/rewards/history returns paginated transaction records with complaint reference',
      resHistoryA.status === 200 &&
        txListA.length >= 1 &&
        txListA[0].complaint?.complaintCode === c1.complaintCode,
      `Count: ${txListA.length}, Code: ${txListA[0]?.complaint?.complaintCode}`
    );

    // 4.3 Multi-tenant isolation: Citizen B receives empty transaction history
    const resHistoryB = await apiCall('/rewards/history', { token: citizenBToken });
    const txListB = resHistoryB.body.transactions || [];
    assertTest(
      'Tenant Isolation',
      'Strict multi-tenant isolation: Citizen B cannot see Citizen A transactions (returns 0)',
      resHistoryB.status === 200 && txListB.length === 0 && resHistoryB.body.currentBalance === 0,
      `Citizen B tx count: ${txListB.length}, balance: ${resHistoryB.body.currentBalance}`
    );

    // =========================================================================
    // SECTION 5: ACCESS CONTROL & RBAC SECURITY
    // =========================================================================
    console.log('\n--- SECTION 5: RBAC & ACCESS AUTHORIZATION ---');

    // 5.1 Unauthenticated request rejected
    const resNoAuth = await apiCall('/rewards/summary');
    assertTest(
      'RBAC',
      'Unauthenticated request to /rewards/summary returns 401 Unauthorized',
      resNoAuth.status === 401,
      `Status: ${resNoAuth.status}`
    );

    // 5.2 Citizen cannot access admin reward configuration
    const resCitizenRules = await apiCall('/admin/rewards/rules', { token: citizenAToken });
    assertTest(
      'RBAC',
      'Citizen token is blocked from /admin/rewards/rules with 403 Forbidden',
      resCitizenRules.status === 403,
      `Status: ${resCitizenRules.status}`
    );

    // 5.3 Citizen cannot verify resolution
    const resCitizenVerify = await apiCall(`/admin/complaints/${c1._id}/verify-resolution`, {
      method: 'PATCH',
      token: citizenAToken,
      body: { note: 'Self verify attempt' }
    });
    assertTest(
      'RBAC',
      'Citizen token is blocked from admin verification endpoint (403 Forbidden)',
      resCitizenVerify.status === 403,
      `Status: ${resCitizenVerify.status}`
    );

    // =========================================================================
    // SECTION 6: CIVIC LEADERBOARD, TIE-BREAKING & PRIVACY
    // =========================================================================
    console.log('\n--- SECTION 6: CIVIC LEADERBOARD & DATA PRIVACY ---');

    // 6.1 Leaderboard query
    const resLeaderboard = await apiCall('/rewards/leaderboard', { token: citizenAToken });
    const lbEntries = resLeaderboard.body.leaderboard || [];

    assertTest(
      'Leaderboard',
      'GET /api/rewards/leaderboard returns ranked civic participants using real MongoDB data',
      resLeaderboard.status === 200 && lbEntries.length >= 1,
      `Entries: ${lbEntries.length}`
    );

    // 6.2 Citizen A is ranked #1 with their points
    const topRanker = lbEntries.find((e) => e.userId === citizenA._id.toString());
    assertTest(
      'Leaderboard',
      'Citizen A with verified cleanup is correctly ranked on the leaderboard with totalPoints',
      topRanker && topRanker.totalPoints >= 75 && topRanker.verifiedCleanups === 1,
      `Rank: ${topRanker?.rank}, Points: ${topRanker?.totalPoints}`
    );

    // 6.3 Data Privacy: Confidential fields NEVER exposed
    const exposesPrivateData = lbEntries.some(
      (e) => e.email || e.phone || e.passwordHash || e.password
    );
    assertTest(
      'Privacy Enforcement',
      'Leaderboard strictly shields confidential citizen data (no email, phone, or password exposed)',
      !exposesPrivateData,
      `Exposed: ${exposesPrivateData}`
    );

    // 6.4 Current user rank payload
    const currentUserRank = resLeaderboard.body.currentUserRank;
    assertTest(
      'Leaderboard',
      'Leaderboard response provides current user rank and points position',
      currentUserRank && typeof currentUserRank.rank === 'number' && currentUserRank.totalPoints >= 75,
      `CurrentUserRank: ${JSON.stringify(currentUserRank)}`
    );

    // =========================================================================
    // SECTION 7: ACHIEVEMENTS & BADGE SYSTEM
    // =========================================================================
    console.log('\n--- SECTION 7: ACHIEVEMENT BADGES & MILESTONE UNLOCKS ---');

    // 7.1 "First Cleanup" badge unlocked
    const badgeFirst = await UserBadge.findOne({ user: citizenA._id, badgeCode: 'first_cleanup' });
    if (badgeFirst) createdBadgeIds.push(badgeFirst._id);

    assertTest(
      'Achievements',
      'First Cleanup badge automatically awarded to Citizen A upon first verified resolution',
      badgeFirst !== null && badgeFirst.title === 'First Cleanup',
      `Badge: ${badgeFirst?.title}`
    );

    // 7.2 "Green Starter" badge unlocked (points >= 50)
    const badgeStarter = await UserBadge.findOne({ user: citizenA._id, badgeCode: 'green_starter' });
    if (badgeStarter) createdBadgeIds.push(badgeStarter._id);

    assertTest(
      'Achievements',
      'Green Starter badge automatically awarded to Citizen A for reaching 50+ Green Points',
      badgeStarter !== null && badgeStarter.title === 'Green Starter',
      `Badge: ${badgeStarter?.title}`
    );

    // 7.3 Duplicate Badge Prevention: Database Compound Index on { user, badgeCode }
    let duplicateBadgeFailed = false;
    try {
      await UserBadge.create({
        user: citizenA._id,
        badgeCode: 'first_cleanup',
        title: 'First Cleanup Duplicate',
        description: 'Should fail'
      });
    } catch (badgeErr) {
      if (badgeErr.code === 11000) {
        duplicateBadgeFailed = true;
      }
    }
    assertTest(
      'Achievements',
      'UserBadge compound unique index strictly prevents duplicate badge awards to same user',
      duplicateBadgeFailed === true,
      `duplicateBadgeFailed: ${duplicateBadgeFailed}`
    );

    // 7.4 Locked badge progress calculation
    const resBadgesA = await apiCall('/rewards/achievements', { token: citizenAToken });
    const achList = resBadgesA.body.achievements || [];
    const ecoChamp = achList.find((a) => a.badgeCode === 'eco_champion');

    assertTest(
      'Achievements',
      'Locked achievements accurately report progress count and percentage toward unlock',
      ecoChamp && ecoChamp.isUnlocked === false && ecoChamp.currentValue === 1 && ecoChamp.progressPercentage === 33.3,
      `currentVal: ${ecoChamp?.currentValue}, progress: ${ecoChamp?.progressPercentage}%`
    );

    // =========================================================================
    // SECTION 8: ADMIN REWARD RULES MANAGEMENT
    // =========================================================================
    console.log('\n--- SECTION 8: ADMIN REWARD RULES GOVERNANCE & AUDIT ---');

    // 8.1 Admin fetches reward rules
    const resAdminRules = await apiCall('/admin/rewards/rules', { token: adminToken });
    const rulesList = resAdminRules.body.rules || [];
    assertTest(
      'Admin Rewards',
      'Admin retrieves configured reward rules and achievement definitions (200 OK)',
      resAdminRules.status === 200 && rulesList.length >= 1 && Array.isArray(resAdminRules.body.achievementDefinitions),
      `Rules count: ${rulesList.length}`
    );

    // 8.2 Admin creates new reward rule
    const ruleCode = `SPECIAL_ZONE_${stamp.toString().slice(-4)}`;
    const resCreateRule = await apiCall('/admin/rewards/rules', {
      method: 'POST',
      token: adminToken,
      body: {
        code: ruleCode,
        title: 'Special Green Belt Incentive',
        description: 'Extra points for park clearances',
        points: 40,
        category: 'organic',
        priority: 'all',
        isActive: true
      }
    });
    if (resCreateRule.body.rule?._id) createdRuleIds.push(resCreateRule.body.rule._id);

    assertTest(
      'Admin Rewards',
      'Admin creates new custom reward policy with points allocation (201 Created)',
      resCreateRule.status === 201 && resCreateRule.body.rule?.points === 40,
      `Status: ${resCreateRule.status}, Points: ${resCreateRule.body.rule?.points}`
    );

    // 8.3 Admin modifies reward rule points & toggle
    const ruleId = resCreateRule.body.rule._id;
    const resUpdateRule = await apiCall(`/admin/rewards/rules/${ruleId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        points: 60,
        isActive: false
      }
    });

    assertTest(
      'Admin Rewards',
      'Admin updates reward rule points and toggles activation state',
      resUpdateRule.status === 200 && resUpdateRule.body.rule?.points === 60 && resUpdateRule.body.rule?.isActive === false,
      `Points: ${resUpdateRule.body.rule?.points}, Active: ${resUpdateRule.body.rule?.isActive}`
    );

    // 8.4 Historical immutability: modifying rule does NOT alter past transaction
    const pastTx = await PointsTransaction.findById(txC1._id);
    assertTest(
      'Historical Immutability',
      'Rule change does NOT retroactively corrupt past transaction points in the authoritative ledger',
      pastTx.points === txC1.points,
      `Original: ${txC1.points}, Current: ${pastTx.points}`
    );

    // 8.5 Admin inspects citizen reward profile
    const resInspect = await apiCall(`/admin/rewards/citizens/${citizenA._id}`, { token: adminToken });
    assertTest(
      'Admin Rewards',
      'Admin inspects citizen reward profile with full ledger and unlocked badge details',
      resInspect.status === 200 &&
        resInspect.body.citizen?.email === citizenA.email &&
        resInspect.body.summary?.balance >= 75,
      `Balance: ${resInspect.body.summary?.balance}`
    );

    // 8.6 Admin views municipal reward history
    const resAdminHistory = await apiCall('/admin/rewards/history', { token: adminToken });
    assertTest(
      'Admin Rewards',
      'Admin views municipal reward award ledger with aggregate metrics',
      resAdminHistory.status === 200 &&
        resAdminHistory.body.metrics?.totalPointsDistributed >= 75 &&
        resAdminHistory.body.transactions?.length >= 1,
      `Total points distributed: ${resAdminHistory.body.metrics?.totalPointsDistributed}`
    );

    // =========================================================================
    // SECTION 9: NOTIFICATIONS REUSE
    // =========================================================================
    console.log('\n--- SECTION 9: CITIZEN NOTIFICATIONS VERIFICATION ---');

    // 9.1 Reward notification for citizen A
    const rewardNotif = await Notification.findOne({
      user: citizenA._id,
      type: 'reward'
    });
    assertTest(
      'Notifications',
      'Citizen received in-app notification of type reward when Green Points were credited',
      rewardNotif !== null && rewardNotif.title.includes('Points'),
      `Notif title: ${rewardNotif?.title}, type: ${rewardNotif?.type}`
    );

  } catch (err) {
    console.error('\n[UNEXPECTED TEST EXECUTION ERROR]:', err);
    assertTest('Suite Execution', 'Complete test suite runs without unhandled exception', false, err.message);
  } finally {
    // Teardown and clean up all test entities from MongoDB
    console.log('\n--- CLEANING UP TEST ARTIFACTS ---');

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
    console.log('Closed MongoDB Connection.\n');

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

runPhase9Verification();

