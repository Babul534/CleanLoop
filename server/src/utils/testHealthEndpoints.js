import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables reliably from server/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';

const PORT = 5001;

const testEndpoints = async () => {
  console.log('--- Testing CleanLoop Endpoints with Live MongoDB Atlas ---');
  try {
    await connectDB();
    const server = app.listen(PORT, async () => {
      try {
        // 1. GET /api/health
        const resHealth = await fetch(`http://localhost:${PORT}/api/health`);
        const dataHealth = await resHealth.json();
        console.log(`[TEST 1] GET /api/health -> Status: ${resHealth.status}`);
        console.log('Response:', JSON.stringify(dataHealth, null, 2));

        // 2. GET /api/health/db
        const resDb = await fetch(`http://localhost:${PORT}/api/health/db`);
        const dataDb = await resDb.json();
        console.log(`\n[TEST 2] GET /api/health/db -> Status: ${resDb.status}`);
        console.log('Response:', JSON.stringify(dataDb, null, 2));

        const pass = resHealth.status === 200 && resDb.status === 200 && dataDb.database === 'connected';
        console.log(`\nVerification Result: ${pass ? 'ALL HEALTH CHECKS PASSED' : 'FAILED'}`);
      } catch (err) {
        console.error('API request error:', err.message);
      } finally {
        server.close(async () => {
          await closeDB();
        });
      }
    });
  } catch (err) {
    console.error('DB Connection error:', err.message);
    process.exit(1);
  }
};

testEndpoints();
