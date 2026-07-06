const User = require('../models/User');
const Session = require('../models/Session');
const Report = require('../models/Report');
const ChatMessage = require('../models/ChatMessage');
const LearningPath = require('../models/LearningPath');
const createAndEmitNotification = require('../utils/notificationHelper');

// @desc    Get admin stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const sessionCount = await Session.countDocuments();
    const reportCount = await Report.countDocuments();
    const mentorCount = await User.countDocuments({ roles: 'mentor' });
    const learnerCount = await User.countDocuments({ roles: 'learner' });
    const moderatorCount = await User.countDocuments({ roles: 'moderator' });

    // Aggregate sessions for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklySessions = await Session.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dayOfWeek: "$createdAt" },
        count: { $sum: 1 }
      }},
      { $sort: { "_id": 1 } }
    ]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedWeekly = days.map((day, index) => {
      const match = weeklySessions.find(s => s._id === (index + 1));
      return { name: day, sessions: match ? match.count : 0 };
    });

    // Calculate User Growth (New users in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const growthRate = ((newUsers / (totalUsers || 1)) * 100).toFixed(1);

    // AI Usage (Sessions with AI summaries)
    const aiSessions = await Session.countDocuments({ aiSummary: { $ne: '' } });
    const aiUsageRate = ((aiSessions / (sessionCount || 1)) * 100).toFixed(1);

    // AI Detailed Analytics
    const aiSubstitute = await Session.countDocuments({ status: 'ai-substitute' });
    const aiSummaries = await Session.countDocuments({ aiSummary: { $exists: true, $ne: '' } });
    const doubtQueries = await ChatMessage.countDocuments({ role: 'assistant' });
    const roadmapsGenerated = await LearningPath.countDocuments();

    // User Growth Trend (Last 6 Months cumulative growth)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyGrowthRaw = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { 
          year: { $year: "$createdAt" }, 
          month: { $month: "$createdAt" } 
        },
        count: { $sum: 1 }
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyGrowth = [];
    let cumulativeUsers = totalUsers - await User.countDocuments({ createdAt: { $gte: sixMonthsAgo } });

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const match = monthlyGrowthRaw.find(g => g._id.month === m && g._id.year === y);
      const count = match ? match.count : 0;
      cumulativeUsers += count;
      monthlyGrowth.push({
        name: monthNames[m - 1],
        users: cumulativeUsers
      });
    }

    res.status(200).json({
      success: true,
      data: {
        users: totalUsers,
        sessions: sessionCount,
        reports: reportCount,
        mentors: mentorCount,
        learners: learnerCount,
        moderators: moderatorCount,
        weeklyStats: formattedWeekly,
        aiUsage: parseFloat(aiUsageRate),
        growthRate: parseFloat(growthRate),
        newUsersLastMonth: newUsers,
        aiStats: {
          aiSubstitute,
          aiSummaries,
          doubtQueries,
          roadmapsGenerated
        },
        monthlyGrowth
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle block user
// @route   PATCH /api/admin/block/:userId
// @access  Private/Admin/Moderator
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Moderators cannot modify/block Admins
    if (user.roles.includes('admin') && req.user.roles.includes('moderator')) {
      return res.status(403).json({ success: false, message: 'Moderators cannot perform actions on Admin accounts.' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();
    
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Promote user
// @route   PATCH /api/admin/promote/:userId
// @access  Private/Admin
exports.promoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.roles.includes('moderator')) {
      user.roles.push('moderator');
    }
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Modify user roles completely
// @route   PATCH /api/admin/role/:userId
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.roles = req.body.roles;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/user/:userId
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Block deleting admins
    if (user.roles.includes('admin')) {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted.' });
    }

    await User.findByIdAndDelete(req.params.userId);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle flag user
// @route   PATCH /api/admin/flag/:userId
// @access  Private/Admin/Moderator
exports.flagUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.roles.includes('admin') && req.user.roles.includes('moderator')) {
      return res.status(403).json({ success: false, message: 'Moderators cannot perform actions on Admin accounts.' });
    }

    user.isFlagged = !user.isFlagged;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Verify Mentor
// @route   PATCH /api/admin/verify-mentor/:userId
// @access  Private/Admin/Moderator
exports.verifyMentor = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Mark as verified
    user.verifiedSkills = [...new Set([...user.verifiedSkills, ...user.skillsTeach])];
    await user.save();

    await createAndEmitNotification(req.app, {
      recipient: user._id,
      sender: req.user.id,
      type: 'mentor_verified',
      title: 'Mentor Application Verified',
      message: 'Congratulations! Your mentor profile and skills have been officially verified by a moderator.',
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Revoke Mentor
// @route   PATCH /api/admin/revoke-mentor/:userId
// @access  Private/Admin/Moderator
exports.revokeMentor = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.verifiedSkills = [];
    await user.save();

    await createAndEmitNotification(req.app, {
      recipient: user._id,
      sender: req.user.id,
      type: 'mentor_revoked',
      title: 'Mentor Verification Revoked',
      message: 'Your mentor verification status has been revoked. Please update your profile or contact support.',
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Warn User
// @route   POST /api/admin/warn/:userId
// @access  Private/Admin/Moderator
exports.warnUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.roles.includes('admin') && req.user.roles.includes('moderator')) {
      return res.status(403).json({ success: false, message: 'Moderators cannot warn admin accounts.' });
    }

    await createAndEmitNotification(req.app, {
      recipient: user._id,
      sender: req.user.id,
      type: 'moderator_warning',
      title: 'Official Moderation Warning',
      message: `An official warning has been issued to your account for: "${reason}". Continuous violation may lead to account suspension.`,
    });

    res.status(200).json({ success: true, message: 'Warning issued successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Remove Skill
// @route   PATCH /api/admin/remove-skill/:userId
// @access  Private/Admin/Moderator
exports.removeSkill = async (req, res) => {
  try {
    const { skill } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.roles.includes('admin') && req.user.roles.includes('moderator')) {
      return res.status(403).json({ success: false, message: 'Moderators cannot perform actions on admin accounts.' });
    }

    user.skillsTeach = user.skillsTeach.filter(s => s !== skill);
    user.verifiedSkills = user.verifiedSkills.filter(s => s !== skill);
    await user.save();

    await createAndEmitNotification(req.app, {
      recipient: user._id,
      sender: req.user.id,
      type: 'skill_removed',
      title: 'Inappropriate Content Removed',
      message: `The teaching skill "${skill}" was flagged and removed from your profile by a moderator.`,
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Moderator Stats
// @route   GET /api/admin/moderator-stats
// @access  Private/Admin/Moderator
exports.getModeratorStats = async (req, res) => {
  try {
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedToday = await Report.countDocuments({ 
      status: { $in: ['resolved', 'dismissed'] }, 
      createdAt: { $gte: new Date().setHours(0,0,0,0) } 
    });

    res.status(200).json({
      success: true,
      data: {
        pendingReports,
        resolvedToday,
        platformHealth: 100 - (pendingReports > 10 ? 10 : pendingReports),
        avgResponse: 1.5
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
