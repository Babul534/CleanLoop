import { isDbConnected } from '../config/db.js';

/**
 * Health Controller
 * Provides system diagnostics and API/database availability status.
 */

// GET /api/health
export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: "CleanLoop API is running",
    timestamp: new Date().toISOString(),
    service: "cleanloop-api",
    version: "1.0.0"
  });
};

// GET /api/health/db
export const getDbHealth = (req, res) => {
  if (isDbConnected()) {
    return res.status(200).json({
      success: true,
      database: "connected"
    });
  }

  return res.status(503).json({
    success: false,
    database: "disconnected",
    message: "Database is not connected"
  });
};
