import dotenv from 'dotenv';
import app from './app.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` CleanLoop Smart Waste Management API Engine`);
  console.log(` Environment : ${NODE_ENV}`);
  console.log(` Server Port : ${PORT}`);
  console.log(` Health API  : http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

// Process signal management
const handleShutdown = (signal) => {
  console.log(`\n[CleanLoop Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[CleanLoop Server] Closed remaining connections. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

