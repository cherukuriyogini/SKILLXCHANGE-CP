const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// ── Allowed Origins (shared with Socket.IO in server.js) ─────────────────────
// Build from environment variables — never hardcode production domains here.
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean); // remove undefined/empty entries

// NOTE: dotenv is intentionally NOT loaded here.
// Environment variables are loaded once by server.js before this module
// is required. Loading dotenv here again would be redundant and could
// mask missing-variable errors.

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiting — environment-aware
// Production: 100 req/10min (security)
// Development: 500 req/10min (usability during active testing)
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: isProduction ? 100 : 500,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);
app.use('/uploads', express.static('uploads'));

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS — environment-variable driven, production-safe
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-to-server, curl)
    if (!origin) return callback(null, true);

    // In development, also allow all localhost/127.0.0.1 origins
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    // In production, allow only explicitly configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true
}));

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');
const sessions = require('./routes/sessions');
const learningPath = require('./routes/learningPath');
const reports = require('./routes/reports');
const admin = require('./routes/admin');
const ai = require('./routes/ai');
const peerGroups = require('./routes/peerGroups');
const notifications = require('./routes/notifications');
const tickets = require('./routes/tickets');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/sessions', sessions);
app.use('/api/learning-path', learningPath);
app.use('/api/reports', reports);
app.use('/api/admin', admin);
app.use('/api/ai', ai);
app.use('/api/peer-groups', peerGroups);
app.use('/api/notifications', notifications);
app.use('/api/tickets', tickets);

// Root route
app.get('/', (req, res) => {
  res.send('SkillXchange API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[GlobalErrorHandler]:', err.message);
  if (err.stack) console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

module.exports = app;
module.exports.allowedOrigins = allowedOrigins;
