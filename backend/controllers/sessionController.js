const Session = require('../models/Session');
const User = require('../models/User');
const Notification = require('../models/Notification');
const createAndEmitNotification = require('../utils/notificationHelper');
const { findSessionByIdOrCustomId } = require('../utils/sessionHelper');

const isSessionParticipant = (session, userId) => {
  return session.learnerId?.toString() === userId.toString() || session.mentorId?.toString() === userId.toString();
};

const validateParticipantOrAdmin = (req, res, session) => {
  if (req.user.roles.includes('admin')) return true;
  if (!isSessionParticipant(session, req.user.id)) {
    res.status(403).json({ success: false, message: 'Not authorized to modify this session.' });
    return false;
  }
  return true;
};

const checkConflict = async (userId, scheduledTime, duration = 60) => {
  const start = new Date(scheduledTime);
  const end = new Date(start.getTime() + duration * 60000);

  // Find any active session that overlaps with the new time range
  // Overlap Condition: (s.start < my.end) AND (s.end > my.start)
  return await Session.findOne({
    $or: [{ learnerId: userId }, { mentorId: userId }],
    status: { $in: ['accepted', 'requested'] },
    scheduledTime: { $lt: end },
    $expr: {
      $gt: [
        { $add: ["$scheduledTime", { $multiply: [{ $ifNull: ["$duration", 60] }, 60000] }] },
        start
      ]
    }
  });
};

// @desc    Create session
// @route   POST /api/sessions
// @access  Private
exports.createSession = async (req, res) => {
  try {
    req.body.learnerId = req.user.id;
    const { mentorId, scheduledTime, duration } = req.body;

    // Check for conflicts for both Learner and Mentor
    const learnerConflict = await checkConflict(req.user.id, scheduledTime, duration);
    if (learnerConflict) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a session scheduled during this time.' 
      });
    }

    const mentorConflict = await checkConflict(mentorId, scheduledTime, duration);
    if (mentorConflict) {
      return res.status(400).json({ 
        success: false, 
        message: 'The mentor is unavailable during this time slot.' 
      });
    }

    const session = await Session.create(req.body);

    // Create Notification for Mentor
    await createAndEmitNotification(req.app, {
      recipient: session.mentorId,
      sender: req.user.id,
      type: 'session_booked',
      title: 'New Session Request',
      message: `You have a new session request for topic: ${session.topic}`,
      relatedId: session._id
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const { status, timeframe } = req.query;
    let filter = {};

    if (req.user.roles.includes('admin') || req.user.roles.includes('moderator')) {
      filter = {};
    } else {
      filter = { $or: [{ learnerId: req.user.id }, { mentorId: req.user.id }] };
    }

    if (status) {
      filter.status = status;
    }

    const now = new Date();
    const todayStart = new Date(new Date().setHours(0,0,0,0));
    const todayEnd = new Date(new Date().setHours(23,59,59,999));

    if (timeframe === 'today') {
      filter.scheduledTime = { $gte: todayStart, $lte: todayEnd };
    } else if (timeframe === 'upcoming') {
      filter.scheduledTime = { $gt: now };
      filter.status = { $in: ['accepted', 'requested'] };
    } else if (timeframe === 'completed') {
      filter.status = 'completed';
    } else if (timeframe === 'cancelled') {
      filter.status = 'cancelled';
    }

    const sessions = await Session.find(filter)
      .sort({ scheduledTime: -1 })
      .populate('learnerId mentorId', 'name email avatar skillsMentor skillsLearn');
      
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private
exports.getSession = async (req, res) => {
  try {
    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (!req.user.roles.includes('admin') && !req.user.roles.includes('moderator') && !isSessionParticipant(session, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this session' });
    }

    await session.populate('learnerId mentorId', 'name email avatar');
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private
exports.updateSession = async (req, res) => {
  try {
    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!validateParticipantOrAdmin(req, res, session)) return;
    
    // Prevent updating protected fields directly
    const protectedFields = ['learnerId', 'mentorId', 'sessionId', 'createdAt', 'refreshToken'];
    protectedFields.forEach((field) => delete req.body[field]);

    Object.assign(session, req.body);
    await session.save();
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private
exports.deleteSession = async (req, res) => {
  try {
    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!validateParticipantOrAdmin(req, res, session)) return;

    await session.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Accept session
// @route   PATCH /api/sessions/:id/accept
// @access  Private/Mentor
exports.acceptSession = async (req, res) => {
  try {
    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.mentorId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned mentor can accept this session.' });
    }
    if (session.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'Only requested sessions can be accepted.' });
    }

    session.status = 'accepted';
    await session.save();
    
    // Notify Learner
    await createAndEmitNotification(req.app, {
      recipient: session.learnerId,
      sender: req.user.id,
      type: 'session_accepted',
      title: 'Session Accepted',
      message: `Your session request for ${session.topic} has been accepted!`,
      relatedId: session._id
    });

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reject session
// @route   PATCH /api/sessions/:id/reject
// @access  Private/Mentor
exports.rejectSession = async (req, res) => {
  try {
    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.mentorId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned mentor can reject this session.' });
    }
    if (['completed', 'cancelled', 'no-show'].includes(session.status)) {
      return res.status(400).json({ success: false, message: 'This session can no longer be rejected.' });
    }

    session.status = 'cancelled';
    await session.save();
    
    // Notify Learner
    await createAndEmitNotification(req.app, {
      recipient: session.learnerId,
      sender: req.user.id,
      type: 'session_cancelled',
      title: 'Session Cancelled',
      message: `Your session request for ${session.topic} was declined or cancelled.`,
      relatedId: session._id
    });

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Cancel session (by learner or mentor)
// @route   PATCH /api/sessions/:id/cancel
// @access  Private
exports.cancelSession = async (req, res) => {
  try {
    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!isSessionParticipant(session, req.user.id) && !req.user.roles.includes('admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this session.' });
    }
    if (['completed', 'cancelled', 'no-show'].includes(session.status)) {
      return res.status(400).json({ success: false, message: 'This session can no longer be cancelled.' });
    }

    session.status = 'cancelled';
    await session.save();

    // Notify Mentor if learner cancels, otherwise notify learner
    const recipient = session.learnerId.toString() === req.user.id.toString() ? session.mentorId : session.learnerId;
    await createAndEmitNotification(req.app, {
      recipient,
      sender: req.user.id,
      type: 'session_cancelled',
      title: 'Session Cancelled',
      message: `${req.user.id.toString() === session.learnerId.toString() ? 'The learner' : 'The mentor'} has cancelled the session for ${session.topic}.`,
      relatedId: session._id
    });

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark session as no-show
// @route   PATCH /api/sessions/:id/no-show
// @access  Private
exports.markNoShow = async (req, res) => {
  try {
    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!isSessionParticipant(session, req.user.id) && !req.user.roles.includes('admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized to mark this session as no-show.' });
    }
    if (['completed', 'cancelled', 'no-show'].includes(session.status)) {
      return res.status(400).json({ success: false, message: 'This session cannot be marked as no-show.' });
    }

    session.status = 'no-show';
    await session.save();

    const mentor = await User.findById(session.mentorId);
    if (mentor) {
      mentor.reputationScore = Math.max(0, mentor.reputationScore - 50);
      await mentor.save();
    }

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Request reschedule
// @route   PATCH /api/sessions/:id/reschedule-request
// @access  Private
exports.requestReschedule = async (req, res) => {
  try {
    const { newTime } = req.body;
    if (!newTime) return res.status(400).json({ success: false, message: 'New time is required' });

    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!isSessionParticipant(session, req.user.id) && !req.user.roles.includes('admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized to request a reschedule for this session.' });
    }
    if (['completed', 'cancelled', 'no-show'].includes(session.status)) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule a session that is no longer active.' });
    }

    session.reschedulePending = true;
    session.rescheduleTime = newTime;
    session.rescheduleRequestedBy = req.user.id;
    await session.save();

    res.status(200).json({ success: true, message: 'Reschedule request sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Confirm reschedule
// @route   PATCH /api/sessions/:id/reschedule-confirm
// @access  Private
exports.confirmReschedule = async (req, res) => {
  try {
    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.reschedulePending) {
      return res.status(400).json({ success: false, message: 'No pending reschedule request' });
    }
    if (!session.mentorId || session.mentorId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned mentor can confirm a reschedule.' });
    }

    const conflict = await checkConflict(session.learnerId, session.rescheduleTime, session.duration);
    if (conflict && conflict._id.toString() !== session._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule: Conflict detected with another session.' });
    }

    session.scheduledTime = session.rescheduleTime;
    session.reschedulePending = false;
    session.rescheduleTime = null;
    session.rescheduleRequestedBy = null;
    await session.save();

    const recipient = req.user.id.toString() === session.learnerId.toString() ? session.mentorId : session.learnerId;
    await createAndEmitNotification(req.app, {
      recipient,
      sender: req.user.id,
      type: 'session_accepted',
      title: 'Reschedule Confirmed',
      message: `The rescheduled time for ${session.topic} has been confirmed.`,
      relatedId: session._id
    });

    res.status(200).json({ success: true, message: 'Session rescheduled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Complete session
// @route   PATCH /api/sessions/:id/complete
// @access  Private/Mentor/Learner
exports.completeSession = async (req, res) => {
  const mongoose = require('mongoose');
  let dbSession = null;

  try {
    const session = await findSessionByIdOrCustomId(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!validateParticipantOrAdmin(req, res, session)) return;
    
    if (session.status === 'completed') {
      return res.status(200).json({ success: true, data: session });
    }

    // ── ACID Database Transaction ─────────────────────────────────────────────
    // Ensures atomic update of session state, learner XP, level up, and notifications
    try {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    } catch (txnInitErr) {
      // Fallback for standalone MongoDB environments without replica sets
      dbSession = null;
    }

    const sessionOpts = dbSession ? { session: dbSession } : {};

    session.status = 'completed';
    await session.save(sessionOpts);

    // Award XP to Learner atomically within transaction
    if (!session.xpAwarded) {
      const learner = await User.findById(session.learnerId).session(dbSession || null);
      if (learner) {
        learner.xp += 100;
        session.xpAwarded = 100;
        // Level up logic (1000 XP per level)
        const nextLevel = Math.floor(learner.xp / 1000) + 1;
        if (nextLevel > learner.level) {
          learner.level = nextLevel;
          // Notify level up
          await createAndEmitNotification(req.app, {
            recipient: learner._id,
            sender: req.user.id,
            type: 'level_up',
            title: 'Level Up!',
            message: `Congratulations! You've reached Level ${learner.level}.`,
            relatedId: learner._id
          });
        }
        await learner.save(sessionOpts);
      }
    }

    await session.save(sessionOpts);

    // Commit Transaction
    if (dbSession) {
      await dbSession.commitTransaction();
    }

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    // Abort Transaction on failure
    if (dbSession) {
      try { await dbSession.abortTransaction(); } catch (_) {}
    }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (dbSession) {
      dbSession.endSession();
    }
  }
};

// @desc    Submit feedback and rating
// @route   PATCH /api/sessions/:id/feedback
// @access  Private
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const session = await findSessionByIdOrCustomId(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.learnerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the learner can submit feedback for this session.' });
    }

    session.rating = rating;
    session.feedback = feedback;
    session.status = 'completed';
    await session.save();

    // Update Mentor Metrics
    const mentor = await User.findById(session.mentorId);
    if (mentor) {
      mentor.reputationScore += (rating * 10);
      mentor.totalSessions += 1;
      
      const allMentorSessions = await Session.find({ mentorId: mentor._id, rating: { $exists: true } });
      const totalRating = allMentorSessions.reduce((acc, s) => acc + s.rating, 0);
      mentor.averageRating = (allMentorSessions.length ? (totalRating / allMentorSessions.length).toFixed(1) : 0);
      
      // Dynamic Badge Assignment
      if (mentor.totalSessions >= 5 && !mentor.badges.includes('⭐ Rising Mentor')) {
        mentor.badges.push('⭐ Rising Mentor');
      }
      if (mentor.averageRating >= 4.8 && mentor.totalSessions >= 10 && !mentor.badges.includes('🏆 Top Mentor')) {
        mentor.badges.push('🏆 Top Mentor');
      }
      if (mentor.totalSessions >= 20 && !mentor.badges.includes('🔥 Consistent Performer')) {
        mentor.badges.push('🔥 Consistent Performer');
      }

      await mentor.save();

      // Notify Mentor of Feedback
      await createAndEmitNotification(req.app, {
        recipient: mentor._id,
        sender: session.learnerId,
        type: 'feedback_submitted',
        title: 'New Feedback Received',
        message: `A learner rated your session: ${rating} stars.`,
        relatedId: session._id
      });
    }

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/sessions/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[DashboardStats] Fetching for User: ${userId}`);
    
    const upcomingSessions = await Session.find({
      $or: [{ learnerId: userId }, { mentorId: userId }],
      status: { $in: ['requested', 'accepted'] },
      scheduledTime: { $gte: new Date() }
    }).populate('learnerId mentorId', 'name email avatar');
    console.log(`[DashboardStats] Upcoming sessions found: ${upcomingSessions.length}`);

    const recentSessions = await Session.find({
      $or: [{ learnerId: userId }, { mentorId: userId }],
      status: { $in: ['completed', 'no-show', 'ai-substitute'] }
    }).sort({ scheduledTime: -1 }).limit(5).populate('learnerId mentorId', 'name email avatar');
    console.log(`[DashboardStats] Recent sessions found: ${recentSessions.length}`);

    const user = await User.findById(userId).select('xp level currentStreak longestStreak totalEarnings achievements badges');
    if (!user) {
      console.warn(`[DashboardStats] User not found: ${userId}`);
      return res.status(404).json({ success: false, message: 'User record not found' });
    }

    const allUserSessions = await Session.find({ $or: [{ learnerId: userId }, { mentorId: userId }] });
    const uniqueLearnerSet = new Set(allUserSessions.map(s => s.learnerId?.toString()).filter(Boolean));

    const stats = {
      totalSessions: await Session.countDocuments({ $or: [{ learnerId: userId }, { mentorId: userId }] }),
      completedSessions: await Session.countDocuments({ $or: [{ learnerId: userId }, { mentorId: userId }], status: 'completed' }),
      upcomingCount: upcomingSessions.length,
      xp: user.xp || 0,
      level: user.level || 1,
      currentStreak: user.currentStreak || 0,
      totalEarnings: user.totalEarnings || 0,
      badges: user.badges || [],
      achievements: user.achievements || [],
      uniqueLearners: uniqueLearnerSet.size
    };

    console.log(`[DashboardStats] Success. Stats calculated.`);
    res.status(200).json({
      success: true,
      data: {
        stats,
        upcomingSessions,
        recentSessions
      }
    });
  } catch (err) {
    console.error(`[DashboardStats] CRITICAL ERROR:`, err);
    res.status(500).json({ success: false, message: 'Failed to generate dashboard statistics' });
  }
};
