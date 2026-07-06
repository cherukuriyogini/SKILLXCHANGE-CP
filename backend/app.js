const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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

// Rate Limiting — relaxed for development/active testing
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 500 // increased limit for high-frequency interactions
});
app.use('/api', limiter);
app.use('/uploads', express.static('uploads'));

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS — simplified for development reliability
app.use(cors({
  origin: (origin, callback) => {
    // In development, allow all localhost origins
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, new Error('Not allowed by CORS'));
    }
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
