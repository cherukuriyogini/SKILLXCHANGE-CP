const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: [true, 'Please add a topic']
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Please add a scheduled time']
  },
  duration: {
    type: Number,
    default: 60 // minutes
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'completed', 'cancelled', 'no-show', 'ai-substitute'],
    default: 'requested'
  },
  notes: {
    type: String,
    default: ''
  },
  feedback: {
    type: String,
    default: ''
  },
  aiSummary: {
    type: String,
    default: ''
  },
  reschedulePending: {
    type: Boolean,
    default: false
  },
  rescheduleTime: {
    type: Date
  },
  rescheduleRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  sessionId: {
    type: String,
    unique: true
  },
  xpAwarded: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate sessionId
// Using async syntax for Mongoose v9 + Kareem v2 compatibility
sessionSchema.pre('save', async function() {
  if (!this.sessionId) {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    this.sessionId = `SX-MEET-${randomHex}`;
  }
});

// ── MongoDB Indexes ──────────────────────────────────────────────────────────
sessionSchema.index({ learnerId: 1, status: 1 });
sessionSchema.index({ mentorId: 1, status: 1 });
sessionSchema.index({ scheduledTime: 1 });
sessionSchema.index({ sessionId: 1 }, { unique: true });
sessionSchema.index({ status: 1, scheduledTime: 1 });

module.exports = mongoose.model('Session', sessionSchema);
