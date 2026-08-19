const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'mentor_issue', 'other'],
    default: 'technical'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  replies: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ── MongoDB Indexes ──────────────────────────────────────────────────────────
ticketSchema.index({ userId: 1, status: 1 });
ticketSchema.index({ status: 1, priority: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
