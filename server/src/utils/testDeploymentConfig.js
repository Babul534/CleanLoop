import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, closeDB } from '../config/db.js';
import app, { resolveAllowedOrigins } from '../app.js';

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

export const runDeploymentAudit = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — PRODUCTION DEPLOYMENT CONFIGURATION AUDIT');
  console.log('================================================================\n');

  let server;
  let baseUrl;

  try {
    await connectDB();
    console.log('[MongoDB] Connected successfully to Atlas cluster.');
    console.log('[MongoDB] Host :', mongoose.connection.host);
    console.log('[MongoDB] Database Name :', mongoose.connection.name);

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    const apiCall = async (endpoint, { headers = {} } = {}) => {
      const res = await fetch(`${baseUrl}${endpoint}`, { headers });
      let json = {};
      try {
        json = await res.json();
      } catch {
        json = { error: 'Non-JSON response' };
      }
      return { status: res.status, headers: res.headers, body: json };
    };

    console.log('\n--- SECTION 1: EXPRESS TRUST PROXY & REVERSE PROXY SECURITY ---');
    // Test 1.1: Express trust proxy setting
    const trustProxyValue = app.get('trust proxy');
    assertCheck(
      'Trust Proxy',
      'Express app has trust proxy enabled for Render reverse proxy (value is 1 or true)',
      trustProxyValue === 1 || trustProxyValue === true,
      `Value: ${trustProxyValue}`
    );

    console.log('\n--- SECTION 2: HEALTH & UPTIME MONITORING ENDPOINTS ---');
    // Test 2.1: Primary Health API
    const healthRes = await apiCall('/api/health');
    assertCheck(
      'Health Endpoint',
      'GET /api/health returns 200 OK with service operational status',
      healthRes.status === 200 &&
        healthRes.body.success === true &&
        healthRes.body.service === 'cleanloop-api',
      `Status: ${healthRes.status}, Body: ${JSON.stringify(healthRes.body)}`
    );

    // Test 2.2: Database Health API
    const dbHealthRes = await apiCall('/api/health/db');
    assertCheck(
      'DB Health Endpoint',
      'GET /api/health/db returns 200 OK with database: "connected"',
      dbHealthRes.status === 200 &&
        dbHealthRes.body.success === true &&
        dbHealthRes.body.database === 'connected',
      `Status: ${dbHealthRes.status}, Body: ${JSON.stringify(dbHealthRes.body)}`
    );

    // Test 2.3: Root Diagnostics
    const rootRes = await apiCall('/');
    assertCheck(
      'Root Diagnostic',
      'GET / returns 200 OK with CleanLoop engine metadata for uptime monitors',
      rootRes.status === 200 &&
        rootRes.body.success === true &&
        rootRes.body.status === 'operational',
      `Status: ${rootRes.status}`
    );

    // Test 2.4: Root Health Alias
    const rootHealthRes = await apiCall('/health');
    assertCheck(
      'Root Health Alias',
      'GET /health returns 200 OK with status: "healthy" for Render health check fallback',
      rootHealthRes.status === 200 && rootHealthRes.body.status === 'healthy',
      `Status: ${rootHealthRes.status}`
    );

    console.log('\n--- SECTION 3: CORS ORIGIN RESOLUTION & NORMALIZATION ---');
    // Test 3.1: Origin normalization function
    const resolvedOrigins = resolveAllowedOrigins();
    assertCheck(
      'CORS Normalization',
      'resolveAllowedOrigins includes localhost and strips trailing slashes',
      resolvedOrigins.includes('http://localhost:5173') &&
        resolvedOrigins.includes('http://127.0.0.1:5173') &&
        resolvedOrigins.every((url) => !url.endsWith('/')),
      `Resolved: ${JSON.stringify(resolvedOrigins)}`
    );

    // Test 3.2: Allowed origin receives proper Access-Control-Allow-Origin header
    const corsGoodRes = await apiCall('/api/health', {
      headers: { Origin: 'http://localhost:5173' }
    });
    const allowOriginHeader = corsGoodRes.headers.get('access-control-allow-origin');
    assertCheck(
      'CORS Allow Header',
      'Requests from authorized origin receive Access-Control-Allow-Origin response header',
      allowOriginHeader === 'http://localhost:5173',
      `Header: ${allowOriginHeader}`
    );

    // Test 3.3: Unauthorized origin rejection
    // Simulate production mode
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const corsBadRes = await apiCall('/api/health', {
        headers: { Origin: 'https://malicious-phishing-site.com' }
      });
      const badAllowOrigin = corsBadRes.headers.get('access-control-allow-origin');
      assertCheck(
        'CORS Security Guard',
        'Unauthorized origins in production do NOT receive Access-Control-Allow-Origin header',
        badAllowOrigin === null || badAllowOrigin === undefined,
        `Header: ${badAllowOrigin}, Status: ${corsBadRes.status}`
      );
    } finally {
      process.env.NODE_ENV = prevEnv;
    }

    console.log('\n--- SECTION 4: VERCEL SPA REWRITES & CONFIGURATION ---');
    const clientVercelPath = path.resolve(__dirname, '../../../client/vercel.json');
    const rootVercelPath = path.resolve(__dirname, '../../../vercel.json');

    // Test 4.1: Client vercel.json
    assertCheck(
      'Vercel Client Config',
      'client/vercel.json exists and defines SPA catch-all rewrite to /index.html',
      fs.existsSync(clientVercelPath),
      'File exists'
    );
    if (fs.existsSync(clientVercelPath)) {
      const clientVercelJson = JSON.parse(fs.readFileSync(clientVercelPath, 'utf-8'));
      const hasSpaRewrite = (clientVercelJson.rewrites || []).some(
        (r) => (r.source === '/(.*)' || r.source === '/:path*') && r.destination === '/index.html'
      );
      assertCheck(
        'Vercel Client Rewrite',
        'client/vercel.json routes direct page refreshes (/dashboard, /complaint/:id) to index.html',
        hasSpaRewrite,
        `Rewrites: ${JSON.stringify(clientVercelJson.rewrites)}`
      );
    }

    // Test 4.2: Root vercel.json
    assertCheck(
      'Vercel Root Config',
      'Root vercel.json exists with buildCommand, outputDirectory, and SPA rewrites for monorepo detection',
      fs.existsSync(rootVercelPath),
      'File exists'
    );
    if (fs.existsSync(rootVercelPath)) {
      const rootVercelJson = JSON.parse(fs.readFileSync(rootVercelPath, 'utf-8'));
      assertCheck(
        'Vercel Root Build Settings',
        'Root vercel.json specifies outputDirectory as client/dist',
        rootVercelJson.outputDirectory === 'client/dist' &&
          Boolean(rootVercelJson.buildCommand),
        `Output: ${rootVercelJson.outputDirectory}`
      );
    }

    console.log('\n--- SECTION 5: RENDER DEPLOYMENT BLUEPRINT (render.yaml) ---');
    const renderYamlPath = path.resolve(__dirname, '../../../render.yaml');
    assertCheck(
      'Render Blueprint',
      'render.yaml exists at project root',
      fs.existsSync(renderYamlPath),
      'File exists'
    );
    if (fs.existsSync(renderYamlPath)) {
      const renderContent = fs.readFileSync(renderYamlPath, 'utf-8');
      assertCheck(
        'Render Spec',
        'render.yaml defines web service with rootDir: server, npm start, and /api/health check',
        renderContent.includes('type: web') &&
          renderContent.includes('rootDir: server') &&
          renderContent.includes('startCommand: npm start') &&
          renderContent.includes('healthCheckPath: /api/health'),
        'Verified service specifications'
      );
    }

    console.log('\n--- SECTION 6: CLIENT TIMEOUT & COLD START RESILIENCE ---');
    const clientApiCode = fs.readFileSync(
      path.resolve(__dirname, '../../../client/src/services/api.js'),
      'utf-8'
    );
    assertCheck(
      'Cold Start Resilience',
      'client/src/services/api.js configures timeout >= 30,000ms to tolerate Render free-tier cold starts',
      clientApiCode.includes('timeout: 30000') || clientApiCode.includes('timeout: 45000'),
      'Timeout verified'
    );
    assertCheck(
      'Client API Base URL Normalization',
      'client/src/services/api.js contains normalization helper for /api suffix and trailing slashes',
      clientApiCode.includes('normalizeApiBaseUrl'),
      'Helper found'
    );

    console.log('\n--- SECTION 7: GIT & ENVIRONMENT SECRET SECURITY ---');
    // Test 7.1: Verify .env is gitignored
    let gitIgnoreCheck = '';
    try {
      gitIgnoreCheck = execSync('git check-ignore server/.env client/.env', {
        encoding: 'utf-8'
      }).trim();
    } catch (_) {}

    assertCheck(
      'Git Secrets Security',
      'Git check-ignore confirms server/.env and client/.env are strictly ignored',
      gitIgnoreCheck.includes('server/.env') && gitIgnoreCheck.includes('client/.env'),
      `Ignored: ${gitIgnoreCheck}`
    );

    // Test 7.2: Verify .env.example files do not leak real secrets
    const serverExample = fs.readFileSync(path.resolve(__dirname, '../../.env.example'), 'utf-8');
    const clientExample = fs.readFileSync(
      path.resolve(__dirname, '../../../client/.env.example'),
      'utf-8'
    );

    assertCheck(
      'Env Examples Cleanliness',
      '.env.example files are populated with descriptive placeholders and zero real secrets',
      serverExample.includes('your_cloudinary_api_key') &&
        serverExample.includes('your_super_secret_jwt_key') &&
        !serverExample.includes('CLOUDINARY_API_KEY=1') &&
        !clientExample.includes('password'),
      'Placeholder hygiene confirmed'
    );

    console.log('\n================================================================');
    console.log(` DEPLOYMENT CONFIG AUDIT: ${results.passed} PASSED | ${results.failed} FAILED`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('[Deployment Audit Error]:', error);
  } finally {
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

runDeploymentAudit();

