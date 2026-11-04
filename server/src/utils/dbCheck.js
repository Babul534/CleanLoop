import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables reliably from server/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

/**
 * CleanLoop Database Connectivity Checker
 * Validates MongoDB Atlas connection without exposing credentials.
 */
const runDbCheck = async () => {
  const uri = process.env.MONGODB_URI;

  console.log('----------------------------------------------------');
  console.log(' CleanLoop MongoDB Atlas Connectivity Verification');
  console.log('----------------------------------------------------');

  if (!uri || !uri.trim()) {
    console.warn('[Status] MONGODB_URI is not defined in server/.env');
    console.log('\nSetup Instructions:');
    console.log(' 1. Copy server/.env.example to server/.env');
    console.log(' 2. Define MONGODB_URI with your MongoDB Atlas cluster URI:');
    console.log('    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>');
    console.log(' 3. Ensure your Atlas Network Access allows connections from your current IP.');
    console.log('----------------------------------------------------');
    process.exit(1);
  }

  // Mask credentials for display
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log(`[Target] Connecting to: ${maskedUri}`);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Quick timeout for check
    });

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      console.log('[Result] SUCCESS: Connected to MongoDB Atlas!');
      console.log(`[Host]   ${conn.connection.host}`);
      console.log(`[DB]     ${conn.connection.name}`);
      console.log('[Status] Connection verified & operational.');
    } else {
      console.error('[Result] FAILED: ReadyState did not reach 1 (connected).');
    }

    await mongoose.connection.close();
    console.log('[Cleanup] Connection closed cleanly.');
    console.log('----------------------------------------------------');
    process.exit(isConnected ? 0 : 1);
  } catch (error) {
    console.error('\n[Result] FAILED: Unable to connect to MongoDB Atlas.');
    console.error(`[Error]  ${error.message}`);
    console.log('\nTroubleshooting Checklist:');
    console.log(' - Verify username and password in MONGODB_URI.');
    console.log(' - Check MongoDB Atlas IP Access List (Whitelist your current IP or allow 0.0.0.0/0).');
    console.log(' - Ensure database user has readWrite permissions.');
    console.log('----------------------------------------------------');
    process.exit(1);
  }
};

runDbCheck();

