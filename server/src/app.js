import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes/api.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// -----------------------------------------------------------------------------
// 1. REVERSE PROXY & SECURITY HEADERS (Render Cloud Configuration)
// -----------------------------------------------------------------------------
// Trust the first proxy hop (Render's Envoy load balancer).
// Required for accurate client IP resolution in rate limiting and req.ip.
app.set('trust proxy', 1);

// Apply secure HTTP response headers
app.use(helmet());

// -----------------------------------------------------------------------------
// 2. CORS NORMALIZATION & ORIGIN VALIDATION
// -----------------------------------------------------------------------------
// Helper: strips trailing slashes and trims whitespace
const normalizeOrigin = (url) => (url ? url.trim().replace(/\/+$/, '') : '');

const defaultLocalOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Helper to extract and normalize all origins configured in environment variables
export const resolveAllowedOrigins = () => {
  const origins = new Set();

  // Parse CLIENT_URL (supports single or comma-separated URLs)
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach((item) => {
      const normalized = normalizeOrigin(item);
      if (normalized) origins.add(normalized);
    });
  }

  // Parse ALLOWED_ORIGINS (supports comma-separated list of additional origins)
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((item) => {
      const normalized = normalizeOrigin(item);
      if (normalized) origins.add(normalized);
    });
  }

  // Always include standard local development origins for pairing & local dev
  defaultLocalOrigins.forEach((origin) => origins.add(origin));

  return Array.from(origins);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow non-browser requests without origin (mobile clients, curl, server-to-server health checks)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);
      const allowed = resolveAllowedOrigins();

      // 2. Direct match against allowed origins list
      if (allowed.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // 3. Dynamic localhost matching in development / non-production
      if (process.env.NODE_ENV !== 'production') {
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }

      // 4. Vercel preview deployment matching if enabled (e.g. https://cleanloop-*.vercel.app)
      if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' || process.env.NODE_ENV !== 'production') {
        if (/^https:\/\/cleanloop[a-zA-Z0-9_-]*\.vercel\.app$/.test(origin)) {
          return callback(null, true);
        }
      }

      // Reject unauthorized origins cleanly
      return callback(
        new Error(`CORS policy: The origin '${origin}' is not authorized to access this API.`)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsing with strict limits to prevent memory exhaustion
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// -----------------------------------------------------------------------------
// 3. ROOT & UPTIME MONITORING ENDPOINTS
// -----------------------------------------------------------------------------
// Root service information for external load balancers and visitors
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CleanLoop Smart Waste Management API Engine',
    environment: process.env.NODE_ENV || 'development',
    status: 'operational',
    healthCheck: '/api/health'
  });
});

// Root alias for uptime monitoring services (e.g. UptimeRobot, Render health checks)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------------
// 4. PRIMARY APPLICATION ROUTES
// -----------------------------------------------------------------------------
app.use('/api', apiRoutes);

// Fallback 404 handler for unmatched routes
app.use(notFoundHandler);

// Central centralized error handler
app.use(errorHandler);

export default app;
