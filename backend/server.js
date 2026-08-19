/**
 * server.js — Application Entry Point
 *
 * STARTUP ORDER (order matters — do not rearrange):
 *   1. dotenv.config()   — load .env into process.env FIRST
 *   2. validateEnv()     — hard-fail if any required variable is missing
 *   3. connectDB()       — connect to MongoDB
 *   4. Everything else   — routes, socket.io, port binding
 *
 * Credentials are NEVER generated or rotated here.
 * All secrets must exist in .env before startup.
 */

// ── Step 1: Load environment variables BEFORE any other require reads process.env ──
require('dotenv').config();

// ── Step 2: Validate all required env vars — exits immediately if any are missing ──
const { validateEnv } = require('./config/env');
validateEnv();

// ── Step 3: Load app modules (safe — env is guaranteed to be loaded) ──
const http = require('http');
const os = require('os');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const app = require('./app');
const { allowedOrigins } = require('./app');

// Connect to database
connectDB();

const geminiService = require('./services/geminiService');

if (geminiService.isConfigured()) {
  console.log("Gemini AI Connected Successfully (Service Configured)");
} else {
  console.warn("GEMINI_API_KEY is not defined in the environment. AI features will be disabled.");
}

const server = http.createServer(app);

// Socket.io for real-time features
// Use the same allowedOrigins as Express CORS — never a wildcard in production.
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, native clients)
      if (!origin) return callback(null, true);

      // In development, allow all localhost/127.0.0.1 origins
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`Socket.IO CORS: Origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

// ── Step 4: Start background scheduled jobs (cron) ───────────────────────────
const { initScheduler } = require('./jobs/scheduler');
initScheduler(io);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Identification for notifications
  socket.on('identify', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} identified on socket ${socket.id}`);
  });

  socket.on('join_session', async ({ sessionId, userId, name, roles }) => {
    socket.join(sessionId);
    console.log(`User ${name} (${socket.id}) joined session ${sessionId}`);
    
    // Send chat history
    try {
      const SessionChat = require('./models/SessionChat');
      const history = await SessionChat.find({ sessionId }).sort({ timestamp: 1 });
      socket.emit('chat_history', history);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }

    // Get current participants in the room
    const clients = Array.from(io.sockets.adapter.rooms.get(sessionId) || []);
    const others = clients.filter(id => id !== socket.id);
    
    // Notify others in session
    socket.to(sessionId).emit('user_joined', { userId, name, socketId: socket.id, roles });
    
    if (roles && roles.includes('mentor')) {
      io.to(sessionId).emit('mentor_joined', { userId, name, socketId: socket.id });
    }

    // Tell the joiner who else is here
    socket.emit('room_users', { users: others });
  });

  // WebRTC Signaling
  socket.on('call_user', (data) => {
    // data: { offer, to, from, name }
    socket.to(data.to).emit('call_made', {
      offer: data.offer,
      socket: socket.id,
      from: data.from,
      name: data.name
    });
  });

  socket.on('make_answer', (data) => {
    // data: { answer, to }
    socket.to(data.to).emit('answer_made', {
      socket: socket.id,
      answer: data.answer
    });
  });

  socket.on('ice_candidate', (data) => {
    // data: { candidate, to }
    socket.to(data.to).emit('ice_candidate', {
      socket: socket.id,
      candidate: data.candidate
    });
  });

  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  socket.on('send_group_message', (data) => {
    io.to(data.groupId).emit('receive_group_message', data);
  });

  socket.on('send_message', async (data) => {
    // data: { sessionId, sender, text, userId }
    try {
      const SessionChat = require('./models/SessionChat');
      await SessionChat.create({
        sessionId: data.sessionId,
        sender: data.sender,
        userId: data.userId,
        text: data.text
      });
      io.to(data.sessionId).emit('receive_message', data);
    } catch (err) {
      console.error('Failed to save session message:', err);
    }
  });

  // Reaction events
  socket.on('send_reaction', (data) => {
    // data: { sessionId, userId, name, reactionType }
    socket.to(data.sessionId).emit('receive_reaction', data);
  });

  // Media state syncing
  socket.on('media_state_change', (data) => {
    // data: { sessionId, userId, isMicOn, isVideoOn }
    socket.to(data.sessionId).emit('remote_media_state', data);
  });

  // Screen share state syncing
  socket.on('screen_share_state', (data) => {
    // data: { sessionId, userId, isSharing }
    socket.to(data.sessionId).emit('remote_screen_share', data);
  });

  socket.on('end_session', ({ sessionId }) => {
    io.to(sessionId).emit('session_ended');
  });

  // Whiteboard Events
  socket.on('draw_event', (data) => {
    // data: { sessionId, x, y, prevX, prevY, color, size, tool, isEnd }
    socket.to(data.sessionId).emit('draw_event', data);
  });

  socket.on('clear_whiteboard', (data) => {
    socket.to(data.sessionId).emit('clear_whiteboard');
  });

  socket.on('mute_all_participants', (data) => {
    // Broadcast to all participants in the session except the sender
    socket.to(data.sessionId).emit('mute_participant');
  });

  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('user_left', { socketId: socket.id });
      }
    });
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    // Update user status to offline based on rooms they were in
    const rooms = Array.from(socket.rooms || []);
    const userRoom = rooms.find(r => r.startsWith('user_'));
    if (userRoom) {
      const userId = userRoom.replace('user_', '');
      try {
        const User = require('./models/User');
        await User.findByIdAndUpdate(userId, { status: 'offline' });
      } catch (err) {
        console.error('Failed to update user status on disconnect:', err.message);
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'SkillXchange API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV
  });
});

// Port configuration
const PORT = process.env.PORT || 5008;
const { execSync } = require('child_process');

/**
 * Kill any process currently occupying the given port.
 * WINDOWS ONLY — uses netstat + taskkill which are not available on Linux/macOS.
 * Guarded by os.platform() to prevent errors in Linux production environments.
 */
function killPortProcess(port) {
  if (os.platform() !== 'win32') {
    // Not Windows — skip silently. Linux/macOS hosts handle port conflicts differently.
    return false;
  }
  try {
    const result = execSync(
      `netstat -ano | findstr ":${port} " | findstr "LISTENING"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const lines = result.trim().split('\n').filter(Boolean);
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
          console.log(`✓ Freed port ${port} by killing stale PID ${pid}`);
        } catch (_) { /* PID may have already exited */ }
      }
    });
    return true;
  } catch (_) {
    return false; // no process on that port
  }
}

function startServer(retryCount = 0) {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && retryCount < 3) {
      console.warn(`⚠ Port ${PORT} in use. Auto-recovering (attempt ${retryCount + 1})...`);
      server.close();
      killPortProcess(PORT);
      setTimeout(() => {
        // Need a fresh server instance after close
        server.removeAllListeners('error');
        startServer(retryCount + 1);
      }, 1200);
    } else {
      console.error(`✗ Could not start server: ${err.message}`);
      process.exit(1);
    }
  });
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});
