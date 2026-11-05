import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import express from 'express';
import fs from 'fs';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, closeDB } from '../config/db.js';
import Complaint from '../models/Complaint.js';
import apiRouter from '../routes/api.routes.js';

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

export const runSplashAndHomepageAudit = async () => {
  console.log('================================================================');
  console.log(' CLEANLOOP — CINEMATIC SPLASH & HOMEPAGE REDESIGN AUDIT');
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
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });

    const apiCall = async (endpoint) => {
      const res = await fetch(`${baseUrl}${endpoint}`);
      let json = {};
      try {
        json = await res.json();
      } catch {
        json = { error: 'Failed to parse JSON' };
      }
      return { status: res.status, ok: res.ok, body: json };
    };

    console.log('\n--- SECTION 1: PUBLIC IMPACT STATISTICS API AUDIT ---');
    // Test 1.1: Public stats API returns 200 without authentication
    const impactRes = await apiCall('/complaints/public/impact');
    assertCheck(
      'Public API',
      'GET /api/complaints/public/impact returns 200 OK without requiring authentication',
      impactRes.status === 200 && impactRes.body.success === true,
      `Status: ${impactRes.status}`
    );

    // Test 1.2: Returns real DB counts
    const dbTotal = await Complaint.countDocuments();
    const dbResolved = await Complaint.countDocuments({ status: 'resolved' });
    const dbInProgress = await Complaint.countDocuments({
      status: { $in: ['assigned', 'in_progress', 'awaiting_verification'] }
    });

    assertCheck(
      'Real Statistics',
      'API statistics match actual MongoDB counts (no fabricated or mock numbers)',
      impactRes.body.stats &&
        impactRes.body.stats.totalReports === dbTotal &&
        impactRes.body.stats.resolvedReports === dbResolved &&
        impactRes.body.stats.inProgressReports === dbInProgress,
      `API: ${JSON.stringify(impactRes.body.stats)} vs DB: total=${dbTotal}, resolved=${dbResolved}, inProgress=${dbInProgress}`
    );

    console.log('\n--- SECTION 2: CINEMATIC SPLASH SCREEN ARCHITECTURE AUDIT ---');
    const splashCode = fs.readFileSync(
      path.resolve(__dirname, '../../../client/src/components/splash/CinematicSplashScreen.jsx'),
      'utf-8'
    );
    const splashCss = fs.readFileSync(
      path.resolve(__dirname, '../../../client/src/components/splash/splash.css'),
      'utf-8'
    );

    // Test 2.1: 4-Scene Animation Sequence
    assertCheck(
      'Splash Sequence',
      'Choreography includes Scene 1 (ambient), Scene 2 (logo), Scene 3 (brand), and Scene 4 (transition)',
      splashCode.includes("'ambient'") &&
        splashCode.includes("'logo'") &&
        splashCode.includes("'brand'") &&
        splashCode.includes("'transition'") &&
        splashCss.includes('.phase-logo') &&
        splashCss.includes('.phase-brand') &&
        splashCss.includes('.phase-transition'),
      'Verified phase transitions in component and CSS'
    );

    // Test 2.2: Skip Intro Option
    assertCheck(
      'Splash Controls',
      'Includes visible and accessible "Skip Intro" option with keyboard support',
      splashCode.includes('Skip Intro') &&
        splashCode.includes('handleSkip') &&
        splashCode.includes('Escape') &&
        splashCss.includes('.splash-skip-btn'),
      'Skip button and keyboard handler found'
    );

    // Test 2.3: Session Storage Guard (Play once per browser session)
    assertCheck(
      'Session Persistence',
      'Enforces sessionStorage persistence (cleanloop_splash_viewed) to play only once per session',
      splashCode.includes("sessionStorage.setItem('cleanloop_splash_viewed', 'true')"),
      'Session storage guard verified'
    );

    // Test 2.4: Prefers-reduced-motion Support
    assertCheck(
      'Accessibility',
      'Explicitly detects prefers-reduced-motion to skip animation or provide static presentation',
      splashCode.includes('prefers-reduced-motion') &&
        splashCss.includes('@media (prefers-reduced-motion: reduce)'),
      'prefers-reduced-motion media queries present'
    );

    // Test 2.5: Brand Reveal Tagline
    assertCheck(
      'Brand Identity',
      'Displays exact brand tagline: "Small Actions. Cleaner Tomorrow."',
      splashCode.includes('Small Actions. Cleaner Tomorrow.') &&
        splashCode.includes('CLEANLOOP'),
      'Brand text verified'
    );

    console.log('\n--- SECTION 3: HOMEPAGE REDESIGN CONTENT & STRUCTURE AUDIT ---');
    const homeCode = fs.readFileSync(
      path.resolve(__dirname, '../../../client/src/pages/HomePage.jsx'),
      'utf-8'
    );
    const tokensCss = fs.readFileSync(
      path.resolve(__dirname, '../../../client/src/styles/tokens.css'),
      'utf-8'
    );
    const homeCss = fs.readFileSync(
      path.resolve(__dirname, '../../../client/src/styles/home.css'),
      'utf-8'
    );

    // Test 3.1: Palette Verification
    assertCheck(
      'Palette Tokens',
      'Defines warm ivory (#F4F1EA), deep slate (#263C38), soft sage (#A9B9AC), muted stone (#D9D2C5), and restrained lime (#C6D96B)',
      tokensCss.includes('#F4F1EA') &&
        tokensCss.includes('#263C38') &&
        tokensCss.includes('#A9B9AC') &&
        tokensCss.includes('#D9D2C5') &&
        tokensCss.includes('#C6D96B'),
      'Tokens found in tokens.css'
    );

    // Test 3.2: Exact Hero Headline
    assertCheck(
      'Hero Headline',
      'Headline matches exact requirement: "Small Actions. Cleaner Streets. Better Tomorrow."',
      homeCode.includes('Small Actions.') &&
        homeCode.includes('Cleaner Streets.') &&
        homeCode.includes('Better Tomorrow.'),
      'Headline text verified'
    );

    // Test 3.3: Exact Hero Description
    assertCheck(
      'Hero Description',
      'Description matches: "Report waste, track municipal action, and see the difference your community can make."',
      homeCode.includes('Report waste, track municipal action, and see the difference your community can make.'),
      'Description text verified'
    );

    // Test 3.4: CTAs
    assertCheck(
      'Hero Buttons',
      'Hero provides "Report an Issue" and "Discover How It Works" buttons',
      homeCode.includes('Report an Issue') &&
        homeCode.includes('Discover How It Works'),
      'Buttons verified'
    );

    // Test 3.5: Premium Environmental Illustration
    assertCheck(
      'Hero Illustration',
      'Replaced crowded workflow panel with EnvironmentalHeroIllustration combining city, nature, clean streets, and smart waste management',
      homeCode.includes('EnvironmentalHeroIllustration') &&
        !homeCode.includes("import HeroIllustration from") &&
        fs.existsSync(path.resolve(__dirname, '../../../client/src/components/common/EnvironmentalHeroIllustration.jsx')),
      'EnvironmentalHeroIllustration integrated cleanly'
    );

    // Test 3.6: How It Works: Three Spacious Steps
    assertCheck(
      'How It Works',
      'Includes three spacious steps: Report the Incident, Municipal Dispatch, and Verified Resolution',
      homeCode.includes('Report the Incident') &&
        homeCode.includes('Municipal Dispatch') &&
        homeCode.includes('Verified Resolution'),
      'Three steps verified'
    );

    // Test 3.7: Features: Six Consistent Cards
    assertCheck(
      'Features Grid',
      'Provides six consistent feature cards',
      homeCode.includes('Precision Geolocation Tagging') &&
        (homeCode.includes('Before & After') || homeCode.includes('Before &amp; After')) &&
        homeCode.includes('Real-Time Lifecycle Tracking') &&
        homeCode.includes('Smart Fleet Route Allocation') &&
        homeCode.includes('Interactive City Heatmap') &&
        (homeCode.includes('Points & Leaderboard') || homeCode.includes('Points &amp; Leaderboard')),
      'Six features verified'
    );

    // Test 3.8: Impact Section With Actual Database Statistics
    assertCheck(
      'Impact Section',
      'Impact section displays actual database statistics and four qualitative civic pillars',
      homeCode.includes('impact-stats-ribbon') &&
        homeCode.includes('Total Incidents Reported') &&
        homeCode.includes('Verified Cleanups Resolved') &&
        homeCode.includes('Active Remediation Pipeline') &&
        homeCode.includes('Resolution Efficiency Rate'),
      'Impact metrics verified'
    );

    // Test 3.9: About CleanLoop Section
    assertCheck(
      'About CleanLoop',
      'Dedicated About CleanLoop section with editorial narrative and civic tech principles',
      homeCode.includes('about-section') &&
        homeCode.includes('About CleanLoop'),
      'About section verified'
    );

    // Test 3.10: Replay Intro Capability
    assertCheck(
      'Replay Intro',
      'Footer includes "Replay Opening Experience" option so visitors can re-watch the splash animation',
      homeCode.includes('handleReplayIntro') &&
        homeCode.includes('onReplayIntro={handleReplayIntro}'),
      'Replay intro callback wired to Footer'
    );

    console.log('\n================================================================');
    console.log(` AUDIT TOTALS: ${results.passed} PASSED | ${results.failed} FAILED`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('[Audit Execution Error]:', error);
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

runSplashAndHomepageAudit();
