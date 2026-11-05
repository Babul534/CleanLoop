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

export const runPhase8Verification = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — PHASE 8 MAP ANALYTICS & SPATIAL CLUSTERING AUDIT');
  console.log('================================================================\n');

  let server;
  let baseUrl;

  // Track created test IDs for 100% clean teardown
  const createdUserIds = [];
  const createdComplaintIds = [];

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
    const hashedPassword = await hashPassword('TestP8@12345');

    // 2. Create isolated test users: admin, citizen, collector
    const adminUser = await User.create({
      name: `Test P8 Admin ${stamp}`,
      email: `p8-admin-${stamp}@cleanloop.internal`,
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    createdUserIds.push(adminUser._id);
    const adminToken = generateToken(adminUser);

    const citizenUser = await User.create({
      name: `Test P8 Citizen ${stamp}`,
      email: `p8-citizen-${stamp}@cleanloop.internal`,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true
    });
    createdUserIds.push(citizenUser._id);
    const citizenToken = generateToken(citizenUser);

    const collectorUser = await User.create({
      name: `Test P8 Collector ${stamp}`,
      email: `p8-collector-${stamp}@cleanloop.internal`,
      passwordHash: hashedPassword,
      role: 'collector',
      isVerified: true
    });
    createdUserIds.push(collectorUser._id);
    const collectorToken = generateToken(collectorUser);

    // 3. Create realistic spatial complaints across specific Delhi clusters
    // Cluster 1: Connaught Place (CP) Area (~28.6315, 77.2167)
    const c1 = await Complaint.create({
      user: citizenUser._id,
      complaintCode: `P8-CP1-${stamp.toString().slice(-4)}`,
      category: 'plastic',
      description: 'Severe accumulation of single-use plastic cups and bottles near Block B colonnade.',
      priority: 'high',
      status: 'pending',
      location: {
        type: 'Point',
        coordinates: [77.2167, 28.6315], // [lng, lat]
        address: { formattedAddress: 'Block B, Connaught Place, New Delhi', landmark: 'Near Metro Gate 2' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(c1._id);

    const c2 = await Complaint.create({
      user: citizenUser._id,
      complaintCode: `P8-CP2-${stamp.toString().slice(-4)}`,
      category: 'construction',
      description: 'Discarded commercial construction rubble and broken masonry on pavement.',
      priority: 'high',
      status: 'assigned',
      location: {
        type: 'Point',
        coordinates: [77.2172, 28.6322], // ~100m away in CP
        address: { formattedAddress: 'Outer Circle, Connaught Place, New Delhi', landmark: 'Opposite Plaza Cinema' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(c2._id);

    // Cluster 2: Karol Bagh (~28.6514, 77.1906)
    const c3 = await Complaint.create({
      user: citizenUser._id,
      complaintCode: `P8-KB1-${stamp.toString().slice(-4)}`,
      category: 'household',
      description: 'Morning collection vehicle skipped street for two consecutive days with overflowing bin bags.',
      priority: 'medium',
      status: 'in_progress',
      location: {
        type: 'Point',
        coordinates: [77.1906, 28.6514],
        address: { formattedAddress: 'Padam Singh Road, Karol Bagh, New Delhi', landmark: 'Near Gurdwara' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(c3._id);

    // Cluster 3: South Extension (~28.5670, 77.2227)
    const c4 = await Complaint.create({
      user: citizenUser._id,
      complaintCode: `P8-SE1-${stamp.toString().slice(-4)}`,
      category: 'industrial',
      description: 'Disposed chemical barrels and industrial waste runoff observed behind commercial clinic.',
      priority: 'high',
      status: 'under_review',
      location: {
        type: 'Point',
        coordinates: [77.2227, 28.5670],
        address: { formattedAddress: 'Part 1, South Extension, New Delhi', landmark: 'Near Flyover Market' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(c4._id);

    const c5 = await Complaint.create({
      user: citizenUser._id,
      complaintCode: `P8-SE2-${stamp.toString().slice(-4)}`,
      category: 'organic',
      description: 'Dry foliage and garden green waste piled along municipal roadside corridor.',
      priority: 'low',
      status: 'resolved',
      location: {
        type: 'Point',
        coordinates: [77.2235, 28.5678],
        address: { formattedAddress: 'Part 1 Ring Road, South Extension, New Delhi', landmark: 'Near Bus Stop' },
        source: 'gps'
      }
    });
    createdComplaintIds.push(c5._id);

    // Coordinate Edge Cases (inserted at raw collection level to verify API controller resilience against null or omitted location)
    const rawOmittedLocId = new mongoose.Types.ObjectId();
    await Complaint.collection.insertOne({
      _id: rawOmittedLocId,
      user: citizenUser._id,
      complaintCode: `P8-OMIT1-${stamp.toString().slice(-4)}`,
      category: 'other',
      description: 'Legacy complaint filed where location field is completely omitted.',
      priority: 'low',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    createdComplaintIds.push(rawOmittedLocId);

    const rawNullLocId = new mongoose.Types.ObjectId();
    await Complaint.collection.insertOne({
      _id: rawNullLocId,
      user: citizenUser._id,
      complaintCode: `P8-NUL1-${stamp.toString().slice(-4)}`,
      category: 'mixed',
      description: 'Complaint record where location is explicitly null.',
      priority: 'medium',
      status: 'pending',
      location: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    createdComplaintIds.push(rawNullLocId);

    console.log('Seeded 3 test users and 7 complaints (including 2 null/omitted location edge records).\n');

    // =========================================================================
    // SECTION 1: STRICT RBAC SECURITY & ROLE ACCESS CONTROL
    // =========================================================================
    console.log('--- SECTION 1: STRICT RBAC & AUTHORIZATION CHECKS ---');

    // 1.1 Unauthenticated Map Complaints
    const resNoAuthComplaints = await apiCall('/admin/map/complaints');
    assertTest(
      'RBAC',
      'Unauthenticated request to GET /admin/map/complaints is rejected (401)',
      resNoAuthComplaints.status === 401 && resNoAuthComplaints.body.success === false,
      `Status: ${resNoAuthComplaints.status}`
    );

    // 1.2 Citizen Access to Map Complaints
    const resCitizenComplaints = await apiCall('/admin/map/complaints', { token: citizenToken });
    assertTest(
      'RBAC',
      'Citizen user is blocked from GET /admin/map/complaints with 403 Forbidden',
      resCitizenComplaints.status === 403 && resCitizenComplaints.body.success === false,
      `Status: ${resCitizenComplaints.status}`
    );

    // 1.3 Collector Access to Map Complaints
    const resCollectorComplaints = await apiCall('/admin/map/complaints', { token: collectorToken });
    assertTest(
      'RBAC',
      'Sanitation collector is blocked from GET /admin/map/complaints with 403 Forbidden',
      resCollectorComplaints.status === 403 && resCollectorComplaints.body.success === false,
      `Status: ${resCollectorComplaints.status}`
    );

    // 1.4 Admin Access to Map Complaints
    const resAdminComplaints = await apiCall('/admin/map/complaints', { token: adminToken });
    assertTest(
      'RBAC',
      'Municipal Admin is authorized for GET /admin/map/complaints (200)',
      resAdminComplaints.status === 200 && resAdminComplaints.body.success === true,
      `Status: ${resAdminComplaints.status}`
    );

    // 1.5 Unauthenticated Map Analytics
    const resNoAuthAnalytics = await apiCall('/admin/map/analytics');
    assertTest(
      'RBAC',
      'Unauthenticated request to GET /admin/map/analytics is rejected (401)',
      resNoAuthAnalytics.status === 401 && resNoAuthAnalytics.body.success === false,
      `Status: ${resNoAuthAnalytics.status}`
    );

    // 1.6 Citizen Access to Map Analytics
    const resCitizenAnalytics = await apiCall('/admin/map/analytics', { token: citizenToken });
    assertTest(
      'RBAC',
      'Citizen user is blocked from GET /admin/map/analytics with 403 Forbidden',
      resCitizenAnalytics.status === 403 && resCitizenAnalytics.body.success === false,
      `Status: ${resCitizenAnalytics.status}`
    );

    // 1.7 Collector Access to Map Analytics
    const resCollectorAnalytics = await apiCall('/admin/map/analytics', { token: collectorToken });
    assertTest(
      'RBAC',
      'Sanitation collector is blocked from GET /admin/map/analytics with 403 Forbidden',
      resCollectorAnalytics.status === 403 && resCollectorAnalytics.body.success === false,
      `Status: ${resCollectorAnalytics.status}`
    );

    // 1.8 Admin Access to Map Analytics
    const resAdminAnalytics = await apiCall('/admin/map/analytics', { token: adminToken });
    assertTest(
      'RBAC',
      'Municipal Admin is authorized for GET /admin/map/analytics (200)',
      resAdminAnalytics.status === 200 && resAdminAnalytics.body.success === true,
      `Status: ${resAdminAnalytics.status}`
    );

    // =========================================================================
    // SECTION 2: SPATIAL COORDINATE SANITIZATION & BOUNDS VALIDATION
    // =========================================================================
    console.log('\n--- SECTION 2: SPATIAL COORDINATES & BOUNDS SANITIZATION ---');

    const complaintsList = resAdminComplaints.body.complaints || [];

    // 2.1 Missing or null coordinate rejection
    const hasOmittedLoc = complaintsList.some((c) => c._id === rawOmittedLocId.toString());
    const hasNullLoc = complaintsList.some((c) => c._id === rawNullLocId.toString());
    assertTest(
      'Spatial Validation',
      'Complaints with omitted or null location are safely filtered out from spatial dataset',
      !hasOmittedLoc && !hasNullLoc,
      `hasOmittedLoc: ${hasOmittedLoc}, hasNullLoc: ${hasNullLoc}`
    );

    // 2.2 Verify valid test complaints are present
    const hasC1 = complaintsList.some((c) => c._id === c1._id.toString());
    const hasC2 = complaintsList.some((c) => c._id === c2._id.toString());
    const hasC3 = complaintsList.some((c) => c._id === c3._id.toString());
    const hasC4 = complaintsList.some((c) => c._id === c4._id.toString());
    const hasC5 = complaintsList.some((c) => c._id === c5._id.toString());
    assertTest(
      'Spatial Validation',
      'All valid geographic complaints are returned in spatial dataset',
      hasC1 && hasC2 && hasC3 && hasC4 && hasC5,
      `Valid complaints found: c1=${hasC1}, c2=${hasC2}, c3=${hasC3}, c4=${hasC4}, c5=${hasC5}`
    );

    // 2.3 Normalized coordinate extraction (GeoJSON [lng, lat] -> lat & lng numbers)
    const targetC1 = complaintsList.find((c) => c._id === c1._id.toString());
    assertTest(
      'Spatial Format',
      'GeoJSON coordinates are safely converted to lat and lng numbers',
      targetC1 &&
        Math.abs(targetC1.lat - 28.6315) < 0.0001 &&
        Math.abs(targetC1.lng - 77.2167) < 0.0001 &&
        typeof targetC1.lat === 'number' &&
        typeof targetC1.lng === 'number',
      `targetC1 lat=${targetC1?.lat}, lng=${targetC1?.lng}`
    );

    // 2.4 Bounding box calculations
    const bounds = resAdminComplaints.body.bounds;
    assertTest(
      'Spatial Bounding Box',
      'Response provides valid geographical bounding box containing all points',
      bounds &&
        typeof bounds.minLat === 'number' &&
        typeof bounds.maxLat === 'number' &&
        typeof bounds.minLng === 'number' &&
        typeof bounds.maxLng === 'number' &&
        bounds.minLat <= 28.5670 &&
        bounds.maxLat >= 28.6514 &&
        bounds.minLng <= 77.1906 &&
        bounds.maxLng >= 77.2235,
      `Bounds: ${JSON.stringify(bounds)}`
    );

    // 2.5 Center point calculation
    const center = resAdminComplaints.body.center;
    assertTest(
      'Spatial Center',
      'Response provides valid computed geographical center array [lat, lng]',
      Array.isArray(center) &&
        center.length === 2 &&
        center[0] >= bounds.minLat &&
        center[0] <= bounds.maxLat &&
        center[1] >= bounds.minLng &&
        center[1] <= bounds.maxLng,
      `Center: ${JSON.stringify(center)}`
    );

    // =========================================================================
    // SECTION 3: MULTI-FILTERING (STATUS, CATEGORY, PRIORITY, DATE RANGE)
    // =========================================================================
    console.log('\n--- SECTION 3: MULTI-PARAMETRIC SPATIAL FILTERING ---');

    // 3.1 Status filter (status=pending)
    const resFilterStatus = await apiCall('/admin/map/complaints?status=pending', { token: adminToken });
    const pendingList = resFilterStatus.body.complaints || [];
    const onlyPending = pendingList.every((c) => c.status === 'pending');
    const includesC1 = pendingList.some((c) => c._id === c1._id.toString());
    const excludesC2 = !pendingList.some((c) => c._id === c2._id.toString()); // c2 is assigned
    assertTest(
      'Filtering',
      'Filtering by status=pending returns only pending complaints',
      resFilterStatus.status === 200 && onlyPending && includesC1 && excludesC2,
      `Pending count: ${pendingList.length}, includesC1: ${includesC1}, excludesC2: ${excludesC2}`
    );

    // 3.2 Category filter (category=plastic)
    const resFilterCat = await apiCall('/admin/map/complaints?category=plastic', { token: adminToken });
    const catList = resFilterCat.body.complaints || [];
    const onlyCat = catList.every((c) => c.category === 'plastic');
    const includesC1Cat = catList.some((c) => c._id === c1._id.toString());
    const excludesC3Cat = !catList.some((c) => c._id === c3._id.toString());
    assertTest(
      'Filtering',
      'Filtering by category=plastic returns only matching category reports',
      resFilterCat.status === 200 && onlyCat && includesC1Cat && excludesC3Cat,
      `Category count: ${catList.length}, includesC1: ${includesC1Cat}`
    );

    // 3.3 Priority filter (priority=high)
    const resFilterPriority = await apiCall('/admin/map/complaints?priority=high', { token: adminToken });
    const priorityList = resFilterPriority.body.complaints || [];
    const onlyHigh = priorityList.every((c) => c.priority === 'high');
    const includesHigh = priorityList.some((c) => c._id === c1._id.toString()) && priorityList.some((c) => c._id === c2._id.toString());
    const excludesLow = !priorityList.some((c) => c._id === c5._id.toString());
    assertTest(
      'Filtering',
      'Filtering by priority=high returns only high priority reports',
      resFilterPriority.status === 200 && onlyHigh && includesHigh && excludesLow,
      `High priority count: ${priorityList.length}`
    );

    // 3.4 Date range filter (dateRange/startDate=today)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const resFilterDate = await apiCall(`/admin/map/complaints?startDate=${todayMidnight.toISOString()}`, { token: adminToken });
    const dateList = resFilterDate.body.complaints || [];
    const includesFreshTest = dateList.some((c) => c._id === c1._id.toString());
    assertTest(
      'Filtering',
      'Filtering by startDate includes newly created complaint records',
      resFilterDate.status === 200 && includesFreshTest,
      `Today count: ${dateList.length}`
    );

    // 3.5 Combined multi-filters (category=industrial & priority=high)
    const resMultiFilter = await apiCall(
      '/admin/map/complaints?category=industrial&priority=high',
      { token: adminToken }
    );
    const multiList = resMultiFilter.body.complaints || [];
    const onlyTarget = multiList.length === 1 && multiList[0]._id === c4._id.toString();
    assertTest(
      'Filtering',
      'Combined multi-filtering correctly narrows down to precise matching complaint',
      resMultiFilter.status === 200 && onlyTarget,
      `Multi list length: ${multiList.length}, id: ${multiList[0]?._id}`
    );

    // =========================================================================
    // SECTION 4: HEATMAP DENSITY POINTS & SEVERITY WEIGHTS
    // =========================================================================
    console.log('\n--- SECTION 4: HEATMAP DENSITY & KERNEL WEIGHTS ---');

    const heatPoints = resAdminComplaints.body.heatPoints || [];
    assertTest(
      'Heatmap Engine',
      'Response provides formatted heatPoints array of [lat, lng, weight] tuples',
      Array.isArray(heatPoints) &&
        heatPoints.length > 0 &&
        heatPoints.every(
          (p) =>
            Array.isArray(p) &&
            p.length === 3 &&
            typeof p[0] === 'number' &&
            typeof p[1] === 'number' &&
            typeof p[2] === 'number' &&
            p[2] >= 0.0 &&
            p[2] <= 1.0
        ),
      `Total heat points: ${heatPoints.length}`
    );

    // Find heatpoint for c1 (high priority, pending) vs c5 (low priority, resolved)
    const heatP1 = heatPoints.find(
      (p) => Math.abs(p[0] - 28.6315) < 0.001 && Math.abs(p[1] - 77.2167) < 0.001
    );
    const heatP5 = heatPoints.find(
      (p) => Math.abs(p[0] - 28.5678) < 0.001 && Math.abs(p[1] - 77.2235) < 0.001
    );

    assertTest(
      'Heatmap Engine',
      'High priority urgent complaint receives high heat intensity weight (>= 0.85)',
      heatP1 && heatP1[2] >= 0.85,
      `heatP1 weight: ${heatP1 ? heatP1[2] : 'not found'}`
    );

    assertTest(
      'Heatmap Engine',
      'Low priority resolved complaint receives subdued heat intensity weight (<= 0.5)',
      heatP5 && heatP5[2] <= 0.5,
      `heatP5 weight: ${heatP5 ? heatP5[2] : 'not found'}`
    );

    // =========================================================================
    // SECTION 5: GEOGRAPHIC ANALYTICS & HOTSPOT AGGREGATION
    // =========================================================================
    console.log('\n--- SECTION 5: GEOGRAPHIC ANALYTICS & SPATIAL AGGREGATIONS ---');

    const analytics = resAdminAnalytics.body.analytics;
    assertTest(
      'Spatial Analytics',
      'GET /admin/map/analytics returns complete analytics payload structure',
      analytics &&
        Array.isArray(analytics.hotspots) &&
        Array.isArray(analytics.categoryDistribution) &&
        Array.isArray(analytics.priorityDistribution) &&
        Array.isArray(analytics.statusDistribution) &&
        analytics.metrics,
      `Keys present: ${Object.keys(analytics || {}).join(', ')}`
    );

    // 5.1 Hotspot grouping: CP cluster (c1 & c2) should group into a single hotspot
    const cpHotspot = analytics.hotspots.find(
      (h) => Math.abs(h.lat - 28.63) < 0.02 && Math.abs(h.lng - 77.21) < 0.02
    );
    assertTest(
      'Hotspot Aggregation',
      'Nearby complaints in Connaught Place group into a common spatial hotspot cell (count >= 2)',
      cpHotspot && cpHotspot.count >= 2,
      `cpHotspot count: ${cpHotspot?.count}, lat: ${cpHotspot?.lat}, lng: ${cpHotspot?.lng}`
    );

    assertTest(
      'Hotspot Aggregation',
      'Hotspot records correctly track high priority count and dominant category',
      cpHotspot &&
        cpHotspot.highPriorityCount >= 2 &&
        typeof cpHotspot.topCategory === 'string',
      `highPriorityCount: ${cpHotspot?.highPriorityCount}, topCategory: ${cpHotspot?.topCategory}`
    );

    // 5.2 Category Distribution aggregation
    const catDist = analytics.categoryDistribution;
    const hasPlastic = catDist.some((c) => c.category === 'plastic' && c.count >= 1);
    const hasIndustrial = catDist.some((c) => c.category === 'industrial' && c.count >= 1);
    assertTest(
      'Spatial Analytics',
      'Category distribution accurately aggregates complaint categories with percentages from MongoDB',
      hasPlastic && hasIndustrial && catDist.every((c) => typeof c.percentage === 'number'),
      `Categories aggregated: ${catDist.map((c) => `${c.category}:${c.count}`).join(', ')}`
    );

    // 5.3 Priority Distribution aggregation
    const priorityDist = analytics.priorityDistribution;
    const highPCount = priorityDist.find((p) => p.priority === 'high')?.count || 0;
    const medPCount = priorityDist.find((p) => p.priority === 'medium')?.count || 0;
    const lowPCount = priorityDist.find((p) => p.priority === 'low')?.count || 0;
    assertTest(
      'Spatial Analytics',
      'Priority distribution captures high, medium, and low counts across city',
      highPCount >= 3 && medPCount >= 1 && lowPCount >= 1,
      `High: ${highPCount}, Medium: ${medPCount}, Low: ${lowPCount}`
    );

    // 5.4 Summary metrics
    const metrics = analytics.metrics;
    assertTest(
      'Spatial Analytics',
      'Summary metrics correctly compute totalMappedComplaints and criticalHotspotsCount',
      metrics &&
        metrics.totalMappedComplaints >= 5 &&
        typeof metrics.criticalHotspotsCount === 'number' &&
        metrics.pendingRemediations >= 3,
      `Metrics: ${JSON.stringify(metrics)}`
    );

  } catch (err) {
    console.error('\n[UNEXPECTED TEST EXECUTION ERROR]:', err);
    assertTest('Suite Execution', 'Complete test suite runs without unhandled exception', false, err.message);
  } finally {
    // Teardown and clean up all test entities from MongoDB
    console.log('\n--- CLEANING UP TEST ARTIFACTS ---');
    if (createdComplaintIds.length > 0) {
      const delComplaints = await Complaint.deleteMany({ _id: { $in: createdComplaintIds } });
      console.log(`Cleaned up ${delComplaints.deletedCount} isolated test complaints.`);
    }

    if (createdUserIds.length > 0) {
      const delUsers = await User.deleteMany({ _id: { $in: createdUserIds } });
      console.log(`Cleaned up ${delUsers.deletedCount} isolated test users.`);
    }

    if (server) {
      server.close();
    }
    await closeDB();
    console.log('Closed MongoDB Connection.\n');

    console.log('================================================================');
    console.log(` PHASE 8 AUDIT SUMMARY: ${results.passed} PASSED | ${results.failed} FAILED`);
    console.log('================================================================\n');

    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runPhase8Verification();
