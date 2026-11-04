/**
 * Health Controller
 * Provides system diagnostics and API availability status.
 */

export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: "CleanLoop API is running",
    timestamp: new Date().toISOString(),
    service: "cleanloop-api",
    version: "1.0.0"
  });
};
