const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  milestones: [{
    title: String,
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ── MongoDB Indexes ──────────────────────────────────────────────────────────
learningPathSchema.index({ userId: 1 });
learningPathSchema.index({ userId: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model('LearningPath', learningPathSchema);
