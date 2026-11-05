import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import { hashPassword, comparePassword, validatePasswordStrength, validateAdminPasswordStrength } from './password.js';
import { generateToken, verifyJwtToken } from './jwt.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
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

// Helper for testing HTTP endpoints against express server
const makeRequest = (server, options, requestBody = null) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
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
      req.write(typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody));
    }
    req.end();
  });
};

const runPhase3Verification = async () => {
  console.log(bold('\n==============================================================='));
  console.log(bold(' CLEANLOOP PHASE 3 — AUTHENTICATION, JWT & RBAC TEST SUITE'));
  console.log(bold('===============================================================\n'));

  // 1. Password Utilities Unit Tests
  console.log(cyan('1. Password Hashing & Policy Verification:'));
  await runTest('Password Utility Tests', async () => {
    const plain = 'StrongPassword123!';
    const hashed = await hashPassword(plain);

    assert(typeof hashed === 'string' && hashed.startsWith('$2'), 'hashPassword produces a valid bcrypt hash');
    assert(hashed.startsWith('$2a$12$') || hashed.startsWith('$2b$12$'), 'bcrypt uses exactly 12 salt rounds');

    const matches = await comparePassword(plain, hashed);
    assert(matches === true, 'comparePassword validates correct password');

    const wrongMatches = await comparePassword('WrongPassword123!', hashed);
    assert(wrongMatches === false, 'comparePassword rejects incorrect password');

    // Citizen policy checks
    assert(validatePasswordStrength('short1').isValid === false, 'Citizen policy rejects < 8 chars');
    assert(validatePasswordStrength('allletterspassword').isValid === false, 'Citizen policy rejects passwords without numbers');
    assert(validatePasswordStrength('1234567890123').isValid === false, 'Citizen policy rejects passwords without letters');
    assert(validatePasswordStrength('ValidPass1').isValid === true, 'Citizen policy accepts >=8 chars with letters & numbers');

    // Admin policy checks
    assert(validateAdminPasswordStrength('ShortAdmin1').isValid === false, 'Admin policy rejects < 12 characters');
    assert(validateAdminPasswordStrength('CleanLoopAdmin2026!').isValid === true, 'Admin policy accepts >= 12 characters');
  });

  // 2. JWT Utilities Unit Tests
  console.log(cyan('\n2. JWT Generation & Verification:'));
  let sampleToken;
  await runTest('JWT Utility Tests', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      role: 'user'
    };

    sampleToken = generateToken(mockUser);
    assert(typeof sampleToken === 'string' && sampleToken.split('.').length === 3, 'generateToken returns 3-part signed JWT');

    const decoded = verifyJwtToken(sampleToken);
    assert(decoded.sub === mockUser._id.toString(), 'JWT subject matches User ID string');
    assert(decoded.role === 'user', 'JWT contains correct role payload');

    let threwOnTamper = false;
    try {
      verifyJwtToken(sampleToken + 'tampered');
    } catch (_) {
      threwOnTamper = true;
    }
    assert(threwOnTamper, 'verifyJwtToken rejects tampered signature');
  });

  // 3. User Model Security Check
  console.log(cyan('\n3. User Model Security Constraints:'));
  await runTest('User Model Security', async () => {
    const schemaPath = User.schema.path('passwordHash');
    assert(schemaPath.options.select === false, "User schema has 'select: false' configured on passwordHash");
  });

  // 4. Live MongoDB Atlas Connection & API End-to-End Tests
  console.log(cyan('\n4. Live Integration Tests against Express Server:'));

  await connectDB();

  // Create test server for app (auth routes)
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const serverPort = server.address().port;
  console.log(`  ${green('ℹ')} Primary API test server listening on http://127.0.0.1:${serverPort}`);

  // Create isolated server for testing RBAC middleware directly
  const rbacApp = express();
  rbacApp.use(express.json());
  rbacApp.get('/test-rbac/admin-only', verifyToken, requireRole('admin'), (req, res) => {
    res.status(200).json({ success: true, message: 'Admin clearance verified' });
  });
  rbacApp.get('/test-rbac/collector-only', verifyToken, requireRole('collector'), (req, res) => {
    res.status(200).json({ success: true, message: 'Collector clearance verified' });
  });
  rbacApp.get('/test-rbac/staff', verifyToken, requireRole('admin', 'collector'), (req, res) => {
    res.status(200).json({ success: true, message: 'Municipal staff clearance verified' });
  });
  const rbacServer = http.createServer(rbacApp);
  await new Promise((resolve) => rbacServer.listen(0, '127.0.0.1', resolve));
  const rbacPort = rbacServer.address().port;
  console.log(`  ${green('ℹ')} RBAC middleware test server listening on http://127.0.0.1:${rbacPort}`);

  const uniqueId = Date.now();
  const citizenEmail = `test_citizen_${uniqueId}@cleanloop.test`;
  const citizenPassword = 'SecureCitizen123!';
  let citizenToken = '';
  let citizenId = '';

  const hackerEmail = `test_hacker_${uniqueId}@cleanloop.test`;
  const collectorEmail = `test_collector_${uniqueId}@cleanloop.test`;
  let collectorToken = '';

  // 4a. Citizen Registration Validation
  await runTest('Registration Validation', async () => {
    // Missing name
    const resNoName = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
      email: citizenEmail,
      password: citizenPassword
    });
    assert(resNoName.status === 400, 'POST /api/auth/register rejects missing name with 400');

    // Invalid email
    const resBadEmail = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Test Citizen',
      email: 'not-an-email',
      password: citizenPassword
    });
    assert(resBadEmail.status === 400, 'POST /api/auth/register rejects malformed email with 400');

    // Weak password
    const resWeakPass = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Test Citizen',
      email: citizenEmail,
      password: 'weak'
    });
    assert(resWeakPass.status === 400, 'POST /api/auth/register rejects weak password (<8 chars) with 400');

    // Valid citizen registration
    const resRegister = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Test Citizen Participant',
      email: citizenEmail,
      password: citizenPassword,
      phone: '+1 555 019 2831'
    });
    assert(resRegister.status === 201, 'POST /api/auth/register succeeds with 201 Created');
    assert(resRegister.data.success === true, 'Response indicates success: true');
    assert(typeof resRegister.data.token === 'string', 'Registration returns signed JWT token');
    assert(resRegister.data.user.role === 'user', "Registered user role defaults to 'user'");
    assert(resRegister.data.user.passwordHash === undefined, 'Registration response NEVER exposes passwordHash');

    citizenToken = resRegister.data.token;
    citizenId = resRegister.data.user.id;

    // Privilege escalation prevention
    const resEscalation = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Attempted Escalation User',
      email: hackerEmail,
      password: citizenPassword,
      role: 'admin' // Client attempts to declare admin role
    });
    assert(resEscalation.status === 201, 'Escalation attempt request returns 201');
    assert(resEscalation.data.user.role === 'user', "Privilege escalation neutralized: user role is strictly forced to 'user'");

    // Duplicate email conflict
    const resDuplicate = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Duplicate Register',
      email: citizenEmail,
      password: citizenPassword
    });
    assert(resDuplicate.status === 409, 'Duplicate email registration returns 409 Conflict');
  });

  // 4b. Login Validation
  await runTest('Login Validation', async () => {
    // Missing credentials
    const resNoCreds = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {});
    assert(resNoCreds.status === 400, 'POST /api/auth/login rejects empty payload with 400');

    // Unknown user
    const resUnknown = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: 'nonexistent_account@cleanloop.test',
      password: citizenPassword
    });
    assert(resUnknown.status === 401, 'POST /api/auth/login rejects non-existent email with 401');

    // Wrong password
    const resWrongPass = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: citizenEmail,
      password: 'IncorrectPassword999!'
    });
    assert(resWrongPass.status === 401, 'POST /api/auth/login rejects invalid password with 401');

    // Correct citizen login
    const resLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: citizenEmail,
      password: citizenPassword
    });
    assert(resLogin.status === 200, 'POST /api/auth/login succeeds with 200 OK');
    assert(typeof resLogin.data.token === 'string', 'Login returns signed JWT token');
    assert(resLogin.data.user.passwordHash === undefined, 'Login response NEVER exposes passwordHash');

    // Admin login test (using provisioned admin)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cleanloop.internal';
    const adminPassword = process.env.ADMIN_PASSWORD || 'CleanLoopAdmin2026!';
    const resAdminLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: adminEmail,
      password: adminPassword
    });
    assert(resAdminLogin.status === 200, 'Admin login succeeds with 200 OK');
    assert(resAdminLogin.data.user.role === 'admin', "Admin login returns user with role 'admin'");
    const adminToken = resAdminLogin.data.token;

    // Suspended account rejection test
    const suspendedEmail = `test_suspended_${uniqueId}@cleanloop.test`;
    const suspendedUser = await User.create({
      name: 'Suspended Citizen',
      email: suspendedEmail,
      passwordHash: await hashPassword(citizenPassword),
      role: 'user',
      accountStatus: 'suspended'
    });

    const resSuspendedLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: suspendedEmail,
      password: citizenPassword
    });
    assert(resSuspendedLogin.status === 403, 'Suspended account login is rejected with 403 Forbidden');

    // 4c. Current User Profile (/api/auth/me)
    const resMeNoToken = await makeRequest(server, { path: '/api/auth/me', method: 'GET' });
    assert(resMeNoToken.status === 401, 'GET /api/auth/me without token returns 401 Unauthorized');

    const resMeBadToken = await makeRequest(server, {
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: 'Bearer bogus.token.value' }
    });
    assert(resMeBadToken.status === 401, 'GET /api/auth/me with invalid token returns 401 Unauthorized');

    const resMeValid = await makeRequest(server, {
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(resMeValid.status === 200, 'GET /api/auth/me with valid citizen token returns 200 OK');
    assert(resMeValid.data.user.email === citizenEmail, 'Profile returns matching user email');
    assert(resMeValid.data.user.passwordHash === undefined, 'Profile response NEVER exposes passwordHash');

    // Suspended user token test
    const suspendedToken = generateToken(suspendedUser);
    const resMeSuspended = await makeRequest(server, {
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${suspendedToken}` }
    });
    assert(resMeSuspended.status === 403, 'GET /api/auth/me with suspended account token returns 403 Forbidden');

    // 4d. Role-Based Access Control (RBAC) Middleware
    console.log(cyan('\n5. Role-Based Access Control Enforcement:'));

    // Create a mock collector user
    const collectorUser = await User.create({
      name: 'Field Collector 01',
      email: collectorEmail,
      passwordHash: await hashPassword(citizenPassword),
      role: 'collector',
      accountStatus: 'active',
      availability: 'available',
      serviceAreas: ['Sector 4 Alpha', 'Downtown Zone 1']
    });
    collectorToken = generateToken(collectorUser);

    // Citizen attempting admin-only route -> 403
    const resCitizenOnAdmin = await makeRequest(rbacServer, {
      path: '/test-rbac/admin-only',
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(resCitizenOnAdmin.status === 403, 'Citizen blocked from admin-only endpoint with 403 Forbidden');

    // Admin accessing admin-only route -> 200
    const resAdminOnAdmin = await makeRequest(rbacServer, {
      path: '/test-rbac/admin-only',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminOnAdmin.status === 200, 'Admin permitted on admin-only endpoint with 200 OK');

    // Citizen attempting collector-only route -> 403
    const resCitizenOnCollector = await makeRequest(rbacServer, {
      path: '/test-rbac/collector-only',
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(resCitizenOnCollector.status === 403, 'Citizen blocked from collector-only endpoint with 403 Forbidden');

    // Collector accessing collector-only route -> 200
    const resCollectorOnCollector = await makeRequest(rbacServer, {
      path: '/test-rbac/collector-only',
      method: 'GET',
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    assert(resCollectorOnCollector.status === 200, 'Collector permitted on collector-only endpoint with 200 OK');

    // Multi-role route (admin & collector allowed)
    const resCollectorOnStaff = await makeRequest(rbacServer, {
      path: '/test-rbac/staff',
      method: 'GET',
      headers: { Authorization: `Bearer ${collectorToken}` }
    });
    assert(resCollectorOnStaff.status === 200, 'Collector permitted on multi-role staff endpoint with 200 OK');

    const resAdminOnStaff = await makeRequest(rbacServer, {
      path: '/test-rbac/staff',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminOnStaff.status === 200, 'Admin permitted on multi-role staff endpoint with 200 OK');

    const resCitizenOnStaff = await makeRequest(rbacServer, {
      path: '/test-rbac/staff',
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(resCitizenOnStaff.status === 403, 'Citizen blocked from multi-role staff endpoint with 403 Forbidden');
  });

  // 5. Cleanup Test Records
  console.log(cyan('\n6. Cleaning Up Temporary Test Records:'));
  await runTest('Cleanup', async () => {
    const deleteResult = await User.deleteMany({ email: /@cleanloop\.test$/ });
    console.log(`  ${green('✓')} Removed ${deleteResult.deletedCount} temporary test user records from database.`);
  });

  // Close servers and DB
  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve) => rbacServer.close(resolve));
  await closeDB();

  console.log(bold('\n==============================================================='));
  console.log(` RESULTS: ${green(`${passedTests} passed`)}, ${failedTests === 0 ? green('0 failed') : red(`${failedTests} failed`)} of ${totalTests} total assertions.`);
  console.log(bold('===============================================================\n'));

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runPhase3Verification().catch((err) => {
  console.error('\nFatal test execution error:', err);
  process.exit(1);
});
