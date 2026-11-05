import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import { generateToken } from './jwt.js';
import { hashPassword } from './password.js';
import { detectImageSignature, validateImageBuffer } from './fileValidation.js';
import { isCloudinaryConfigured, deleteCloudinaryAsset } from '../config/cloudinary.js';
import app from '../app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Color formatting for console test output
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assert = (condition, testName, details = '') => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${green('✓')} ${testName}`);
  } else {
    failedTests++;
    console.error(`  ${red('✗')} ${testName}`);
    if (details) console.error(`    ${red('Details:')} ${details}`);
  }
};

const runTest = async (testName, fn) => {
  try {
    await fn();
  } catch (error) {
    totalTests++;
    failedTests++;
    console.error(`  ${red('✗')} ${testName} (Threw uncaught error)`);
    console.error(`    ${red('Error:')} ${error.message}`);
  }
};

// Helper for testing HTTP requests against express server
const makeRequest = (server, options, requestBody = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;

    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {}),
        ...headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', reject);

    if (requestBody) {
      if (Buffer.isBuffer(requestBody)) {
        req.write(requestBody);
      } else if (typeof requestBody === 'string') {
        req.write(requestBody);
      } else {
        req.write(JSON.stringify(requestBody));
      }
    }
    req.end();
  });
};

// Helper to build multipart/form-data payloads with custom buffers
const buildMultipartPayload = (fields = {}, files = []) => {
  const boundary = `----CleanLoopTestBoundary${Date.now().toString(16)}`;
  const chunks = [];

  // Append form fields
  for (const [key, val] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
  }

  // Append file buffers
  for (const file of files) {
    const fieldName = file.fieldName || 'images';
    const fileName = file.fileName || 'test.jpg';
    const mimeType = file.mimeType || 'image/jpeg';
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      )
    );
    chunks.push(file.buffer);
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const fullBody = Buffer.concat(chunks);

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: fullBody
  };
};

// Dummy valid minimal image buffers
const validJpegBuffer = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01
]);

const validPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82
]);

const validWebpBuffer = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20
]);

const invalidTextBuffer = Buffer.from('This is a text file, definitely not an image!');

const runPhase4Verification = async () => {
  console.log(bold('\n==============================================================='));
  console.log(bold(' CLEANLOOP PHASE 4 — CITIZEN DASHBOARD, COMPLAINTS & GEO TESTS'));
  console.log(bold('===============================================================\n'));

  // 1. File Validation Unit Tests
  console.log(cyan('1. File Signature & Security Inspection:'));
  await runTest('Image Signature Validation', () => {
    assert(detectImageSignature(validJpegBuffer) === 'jpeg', 'detectImageSignature recognizes JPEG magic numbers');
    assert(detectImageSignature(validPngBuffer) === 'png', 'detectImageSignature recognizes PNG magic numbers');
    assert(detectImageSignature(validWebpBuffer) === 'webp', 'detectImageSignature recognizes WEBP magic numbers');
    assert(detectImageSignature(invalidTextBuffer) === null, 'detectImageSignature rejects non-image text file');

    // validateImageBuffer checks
    const validJpegCheck = validateImageBuffer(validJpegBuffer, 'photo.jpg', 'image/jpeg');
    assert(validJpegCheck.isValid === true, 'validateImageBuffer accepts genuine JPEG');

    const validPngCheck = validateImageBuffer(validPngBuffer, 'photo.png', 'image/png');
    assert(validPngCheck.isValid === true, 'validateImageBuffer accepts genuine PNG');

    const validWebpCheck = validateImageBuffer(validWebpBuffer, 'photo.webp', 'image/webp');
    assert(validWebpCheck.isValid === true, 'validateImageBuffer accepts genuine WEBP');

    const spoofedCheck = validateImageBuffer(invalidTextBuffer, 'fake.jpg', 'image/jpeg');
    assert(spoofedCheck.isValid === false, 'validateImageBuffer catches MIME-spoofed text file disguised as .jpg');

    const badExtCheck = validateImageBuffer(validJpegBuffer, 'script.exe', 'image/jpeg');
    assert(badExtCheck.isValid === false, 'validateImageBuffer rejects disallowed file extension');
  });

  // 2. Cloudinary Configuration Check
  console.log(cyan('\n2. Cloudinary Storage Configuration State:'));
  await runTest('Cloudinary Config Inspection', () => {
    const configured = isCloudinaryConfigured();
    console.log(`  ${green('ℹ')} Cloudinary configured in current environment: ${bold(configured ? 'YES' : 'NO (Unset)')}`);
    assert(typeof configured === 'boolean', 'isCloudinaryConfigured returns boolean status');
  });

  // 3. Connect to Database & Prepare Test Server
  console.log(cyan('\n3. Database & Express Server Integration:'));
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const serverPort = server.address().port;
  console.log(`  ${green('ℹ')} Live test server listening on http://127.0.0.1:${serverPort}`);

  const uniqueId = Date.now();
  const citizenA_Email = `citizen_a_${uniqueId}@cleanloop.test`;
  const citizenB_Email = `citizen_b_${uniqueId}@cleanloop.test`;
  const adminEmail = `admin_test_${uniqueId}@cleanloop.test`;

  // Create two citizens and an admin
  const citizenA = await User.create({
    name: 'Citizen Alpha',
    email: citizenA_Email,
    passwordHash: await hashPassword('CitizenPass123!'),
    role: 'user',
    accountStatus: 'active'
  });

  const citizenB = await User.create({
    name: 'Citizen Beta',
    email: citizenB_Email,
    passwordHash: await hashPassword('CitizenPass123!'),
    role: 'user',
    accountStatus: 'active'
  });

  const adminUser = await User.create({
    name: 'Admin User',
    email: adminEmail,
    passwordHash: await hashPassword('AdminPass123!'),
    role: 'admin',
    accountStatus: 'active'
  });

  const tokenA = generateToken(citizenA);
  const tokenB = generateToken(citizenB);
  const tokenAdmin = generateToken(adminUser);

  // 4. API Authorization & Validation on POST /api/complaints
  console.log(cyan('\n4. Complaint Submission API Guards (POST /api/complaints):'));
  await runTest('Complaint Creation Guards', async () => {
    // 4a. Unauthenticated access blocked
    const unauthRes = await makeRequest(server, { path: '/api/complaints', method: 'POST' });
    assert(unauthRes.status === 401, 'POST /api/complaints without token rejected with 401 Unauthorized');

    // 4b. Admin blocked from citizen reporting endpoint
    const adminRes = await makeRequest(server, {
      path: '/api/complaints',
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    assert(adminRes.status === 403, 'POST /api/complaints with Admin token rejected with 403 Forbidden (Citizen only)');

    // 4c. Missing images rejected
    const noImagesPayload = buildMultipartPayload(
      {
        description: 'Trash pile blocking the crosswalk',
        category: 'plastic',
        latitude: '28.6139',
        longitude: '77.2090'
      },
      [] // 0 images
    );

    const noImagesRes = await makeRequest(
      server,
      {
        path: '/api/complaints',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': noImagesPayload.contentType
        }
      },
      noImagesPayload.body
    );
    assert(noImagesRes.status === 400, 'POST /api/complaints without images rejected with 400 Bad Request');

    // 4d. Invalid category rejected
    const badCatPayload = buildMultipartPayload(
      {
        description: 'Trash pile blocking the crosswalk',
        category: 'invalid_category_xyz',
        latitude: '28.6139',
        longitude: '77.2090'
      },
      [{ buffer: validJpegBuffer, fileName: 'dump.jpg', mimeType: 'image/jpeg' }]
    );

    const badCatRes = await makeRequest(
      server,
      {
        path: '/api/complaints',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': badCatPayload.contentType
        }
      },
      badCatPayload.body
    );
    assert(badCatRes.status === 400, 'POST /api/complaints with invalid category rejected with 400');

    // 4e. Invalid coordinates rejected
    const badCoordsPayload = buildMultipartPayload(
      {
        description: 'Trash pile blocking the crosswalk',
        category: 'plastic',
        latitude: '999.00', // Out of bounds
        longitude: '77.2090'
      },
      [{ buffer: validJpegBuffer, fileName: 'dump.jpg', mimeType: 'image/jpeg' }]
    );

    const badCoordsRes = await makeRequest(
      server,
      {
        path: '/api/complaints',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': badCoordsPayload.contentType
        }
      },
      badCoordsPayload.body
    );
    assert(badCoordsRes.status === 400, 'POST /api/complaints with out-of-bounds latitude rejected with 400');

    // 4f. Short description rejected
    const shortDescPayload = buildMultipartPayload(
      {
        description: 'Too short', // < 10 chars
        category: 'plastic',
        latitude: '28.6139',
        longitude: '77.2090'
      },
      [{ buffer: validJpegBuffer, fileName: 'dump.jpg', mimeType: 'image/jpeg' }]
    );

    const shortDescRes = await makeRequest(
      server,
      {
        path: '/api/complaints',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': shortDescPayload.contentType
        }
      },
      shortDescPayload.body
    );
    assert(shortDescRes.status === 400, 'POST /api/complaints with short description (<10 chars) rejected with 400');

    // 4g. Long description (>1000 chars) rejected
    const longDescPayload = buildMultipartPayload(
      {
        description: 'A'.repeat(1001), // > 1000 chars
        category: 'plastic',
        latitude: '28.6139',
        longitude: '77.2090'
      },
      [{ buffer: validJpegBuffer, fileName: 'dump.jpg', mimeType: 'image/jpeg' }]
    );

    const longDescRes = await makeRequest(
      server,
      {
        path: '/api/complaints',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': longDescPayload.contentType
        }
      },
      longDescPayload.body
    );
    assert(longDescRes.status === 400, 'POST /api/complaints with long description (>1000 chars) rejected with 400');

    // 4h. Live Cloudinary image upload and full complaint submission (with tampering attempt)
    const liveUploadPayload = buildMultipartPayload(
      {
        description: 'Live test report: Overflowing street dumpster with household waste.',
        category: 'household',
        reportedPriority: 'high',
        latitude: '28.6139',
        longitude: '77.2090',
        formattedAddress: '42 Civic Avenue, Ward 3',
        landmark: 'Opposite Community Library',
        locationSource: 'gps',
        // Client attempting to tamper with forbidden fields:
        status: 'resolved',
        assignedCollector: '6aeb43a98a8549ceeec1210f'
      },
      [{ buffer: validPngBuffer, fileName: 'overflow.png', mimeType: 'image/png' }]
    );

    const liveSubmitRes = await makeRequest(
      server,
      {
        path: '/api/complaints',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': liveUploadPayload.contentType
        }
      },
      liveUploadPayload.body
    );

    if (liveSubmitRes.status !== 201) {
      console.log('DEBUG liveSubmitRes failed:', liveSubmitRes.status, liveSubmitRes.data);
    }

    assert(liveSubmitRes.status === 201, 'POST /api/complaints succeeds with 201 Created');
    assert(liveSubmitRes.data.success === true, 'Response indicates success: true');
    assert(liveSubmitRes.data.complaint.complaintCode.startsWith('CLN-'), 'Returns valid generated complaint reference code');
    assert(liveSubmitRes.data.complaint.status === 'pending', 'Status is strictly initialized to "pending" (client tampering ignored)');
    assert(Array.isArray(liveSubmitRes.data.complaint.images) && liveSubmitRes.data.complaint.images.length === 1, 'Returns uploaded image in images array');
    assert(liveSubmitRes.data.complaint.images[0].url.includes('cloudinary.com'), 'Uploaded image URL points to verified Cloudinary storage');
    assert(liveSubmitRes.data.complaint.images[0].publicId.length > 0, 'Image has valid Cloudinary publicId');

    // Clean up the created test asset from Cloudinary and DB
    if (liveSubmitRes.data?.complaint?.images?.[0]?.publicId) {
      await deleteCloudinaryAsset(liveSubmitRes.data.complaint.images[0].publicId);
    }
    if (liveSubmitRes.data?.complaint?.id) {
      await Complaint.findByIdAndDelete(liveSubmitRes.data.complaint.id);
    }
  });

  // 5. Seed Test Complaints directly in Database for Listing & Summary Verification
  console.log(cyan('\n5. Data Integrity, Aggregation & Ownership Filtering:'));
  let complaintA1, complaintA2, complaintB1;

  await runTest('Seeding Test Complaints', async () => {
    // Citizen A Complaint 1: Plastic, pending
    complaintA1 = await Complaint.create({
      user: citizenA._id,
      description: 'Extensive plastic packaging dumped along the riverbank.',
      category: 'plastic',
      reportedPriority: 'high',
      priority: 'medium',
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample1.jpg', publicId: 'sample1' }],
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139], // [lng, lat]
        address: { formattedAddress: 'Yamuna Riverbank Area, Sector 4', landmark: 'Near Bridge Pillar 12' },
        source: 'gps'
      },
      status: 'pending',
      statusHistory: [
        { status: 'pending', changedBy: citizenA._id, note: 'Complaint submitted by citizen', changedAt: new Date() }
      ]
    });

    // Citizen A Complaint 2: Construction, resolved
    complaintA2 = await Complaint.create({
      user: citizenA._id,
      description: 'Heavy construction rubble dumped on pedestrian sidewalk.',
      category: 'construction',
      reportedPriority: 'medium',
      priority: 'medium',
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg', publicId: 'sample2' }],
      location: {
        type: 'Point',
        coordinates: [77.215, 28.62],
        address: { formattedAddress: 'Connaught Outer Circle', landmark: 'Next to Block B' },
        source: 'manual'
      },
      status: 'resolved',
      statusHistory: [
        { status: 'pending', changedBy: citizenA._id, note: 'Submitted', changedAt: new Date() },
        { status: 'resolved', changedBy: adminUser._id, note: 'Resolved by field staff', changedAt: new Date() }
      ]
    });

    // Citizen B Complaint 1: Household, in_progress
    complaintB1 = await Complaint.create({
      user: citizenB._id,
      description: 'Overflowing domestic dumpster behind residential flats.',
      category: 'household',
      reportedPriority: 'low',
      priority: 'low',
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample3.jpg', publicId: 'sample3' }],
      location: {
        type: 'Point',
        coordinates: [77.23, 28.65],
        address: { formattedAddress: 'Old Delhi Market Road', landmark: 'Gate 2' },
        source: 'gps'
      },
      status: 'in_progress',
      statusHistory: [
        { status: 'pending', changedBy: citizenB._id, note: 'Submitted', changedAt: new Date() },
        { status: 'in_progress', changedBy: adminUser._id, note: 'Collector assigned', changedAt: new Date() }
      ]
    });

    assert(complaintA1.complaintCode.startsWith('CLN-'), 'Complaint A1 auto-generated unique complaintCode');
    assert(Array.isArray(complaintA1.location.coordinates), 'Coordinates stored as array');
    assert(complaintA1.location.coordinates[0] === 77.209, 'GeoJSON stored in strict [longitude, latitude] order');
  });

  // 6. Test GET /api/complaints/my/summary
  console.log(cyan('\n6. Real-Time Aggregate Summary Verification (GET /api/complaints/my/summary):'));
  await runTest('Summary Metrics', async () => {
    const summaryRes = await makeRequest(server, {
      path: '/api/complaints/my/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert(summaryRes.status === 200, 'GET /api/complaints/my/summary returns 200 OK');
    assert(summaryRes.data.success === true, 'Response indicates success: true');

    const summary = summaryRes.data.summary;
    assert(summary.total === 2, `Citizen A total complaints equals 2 (received ${summary.total})`);
    assert(summary.awaitingReview === 1, `Citizen A awaitingReview equals 1 (received ${summary.awaitingReview})`);
    assert(summary.beingHandled === 0, `Citizen A beingHandled equals 0 (received ${summary.beingHandled})`);
    assert(summary.resolved === 1, `Citizen A resolved equals 1 (received ${summary.resolved})`);

    // Verify Citizen B summary
    const summaryB_Res = await makeRequest(server, {
      path: '/api/complaints/my/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const summaryB = summaryB_Res.data.summary;
    assert(summaryB.total === 1, `Citizen B total equals 1 (received ${summaryB.total})`);
    assert(summaryB.beingHandled === 1, `Citizen B beingHandled equals 1 (received ${summaryB.beingHandled})`);
  });

  // 7. Test GET /api/complaints/my (Pagination, Filter, Ownership)
  console.log(cyan('\n7. Paginated Complaints List & Isolation (GET /api/complaints/my):'));
  await runTest('List & Ownership Isolation', async () => {
    // Citizen A list
    const listRes = await makeRequest(server, {
      path: '/api/complaints/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert(listRes.status === 200, 'GET /api/complaints/my returns 200 OK');
    assert(listRes.data.complaints.length === 2, 'Citizen A receives exactly their 2 complaints');

    // Confirm Citizen A NEVER sees Citizen B's complaint
    const containsComplaintB = listRes.data.complaints.some((c) => c._id === complaintB1._id.toString());
    assert(containsComplaintB === false, "Strict tenant isolation: Citizen A list NEVER contains Citizen B's data");

    // Filter by status=resolved
    const filterRes = await makeRequest(server, {
      path: '/api/complaints/my?status=resolved',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(filterRes.data.complaints.length === 1, 'Status filter "resolved" returns 1 matching complaint');
    assert(filterRes.data.complaints[0].category === 'construction', 'Matching complaint is construction category');

    // Filter by category=plastic
    const catFilterRes = await makeRequest(server, {
      path: '/api/complaints/my?category=plastic',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(catFilterRes.data.complaints.length === 1, 'Category filter "plastic" returns 1 matching complaint');

    // Search by code
    const searchRes = await makeRequest(server, {
      path: `/api/complaints/my?search=${complaintA1.complaintCode}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(searchRes.data.complaints.length === 1, 'Search by complaintCode returns exact record');
  });

  // 8. Test GET /api/complaints/:id (Ownership Security)
  console.log(cyan('\n8. Single Complaint Detail & Cross-User Security (GET /api/complaints/:id):'));
  await runTest('Single Complaint Ownership Security', async () => {
    // Citizen A accessing their own complaint
    const ownRes = await makeRequest(server, {
      path: `/api/complaints/${complaintA1._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(ownRes.status === 200, 'Citizen accessing own complaint succeeds with 200 OK');
    assert(ownRes.data.complaint.complaintCode === complaintA1.complaintCode, 'Returns correct complaint data');

    // Citizen A attempting to view Citizen B's complaint
    const crossRes = await makeRequest(server, {
      path: `/api/complaints/${complaintB1._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(crossRes.status === 403, 'Citizen attempting to view another user complaint is blocked with 403 Forbidden');
  });

  // 9. Teardown
  console.log(cyan('\n9. Cleaning Up Test Records:'));
  await runTest('Teardown', async () => {
    const deletedComplaints = await Complaint.deleteMany({
      user: { $in: [citizenA._id, citizenB._id, adminUser._id] }
    });
    const deletedUsers = await User.deleteMany({
      email: /@cleanloop\.test$/
    });
    console.log(`  ${green('✓')} Deleted ${deletedComplaints.deletedCount} test complaints.`);
    console.log(`  ${green('✓')} Deleted ${deletedUsers.deletedCount} test users.`);
  });

  // Close server and database
  await new Promise((resolve) => server.close(resolve));
  await closeDB();

  console.log(bold('\n==============================================================='));
  console.log(
    ` RESULTS: ${green(`${passedTests} passed`)}, ${failedTests === 0 ? green('0 failed') : red(`${failedTests} failed`)} of ${totalTests} total assertions.`
  );
  console.log(bold('===============================================================\n'));

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runPhase4Verification().catch((err) => {
  console.error('\nFatal test execution error:', err);
  process.exit(1);
});

