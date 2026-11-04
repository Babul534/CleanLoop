import dotenv from 'dotenv';
import app from './app.js';
import { connectDB, closeDB } from './config/db.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas first
    await connectDB();

    // Start listening only after database connection succeeds
    server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` CleanLoop Smart Waste Management API Engine`);
      console.log(` Environment : ${NODE_ENV}`);
      console.log(` Server Port : ${PORT}`);
      console.log(` Health API  : http://localhost:${PORT}/api/health`);
      console.log(` DB Health   : http://localhost:${PORT}/api/health/db`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('\n[CleanLoop Server Startup Blocked]');
    console.error('The backend server requires an active MongoDB Atlas connection to run.');
    console.error(`Reason: ${error.message}\n`);
    process.exit(1);
  }
};

startServer();

// Process signal management
const handleShutdown = async (signal) => {
  console.log(`\n[CleanLoop Server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[CleanLoop Server] HTTP listener closed.');
      await closeDB();
      console.log('[CleanLoop Server] Process exited safely.');
      process.exit(0);
    });
  } else {
    await closeDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
