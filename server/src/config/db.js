import mongoose from 'mongoose';

/**
 * CleanLoop Database Configuration
 * Manages connection lifecycle to MongoDB Atlas.
 */

// Connection event listeners setup (registered once)
let listenersConfigured = false;

const configureEventListeners = () => {
  if (listenersConfigured) return;

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database cluster.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Successfully reconnected to database cluster.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error occurred:', err.message);
  });

  listenersConfigured = true;
};

/**
 * Connect to MongoDB Atlas
 * @returns {Promise<mongoose.Connection>}
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    const errorMsg = [
      '====================================================================',
      '[MongoDB Config Error] MONGODB_URI environment variable is missing!',
      'To connect CleanLoop to MongoDB Atlas:',
      '  1. Open or create server/.env',
      '  2. Set MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>',
      '  3. Ensure your Atlas IP access list allows connections from your environment.',
      '===================================================================='
    ].join('\n');

    throw new Error(errorMsg);
  }

  configureEventListeners();

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully to Atlas cluster.`);
    console.log(`[MongoDB] Host : ${conn.connection.host}`);
    console.log(`[MongoDB] Database Name : ${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error('[MongoDB] Failed to connect to MongoDB Atlas.');
    console.error(`[MongoDB Error] ${error.message}`);
    throw error;
  }
};

/**
 * Check if Mongoose connection is ready and active
 * @returns {boolean}
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Safely close MongoDB connection (for tests and graceful shutdowns)
 */
export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed successfully.');
  }
};

export default connectDB;

