const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin/Moderator
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    console.log(`[UserController] Update Request for ID: ${req.params.id}`);
    console.log(`[UserController] Body:`, req.body);

    // Only allow updating certain fields for security
    const allowedUpdates = ['name', 'bio', 'skillsTeach', 'skillsLearn', 'avatar', 'settings'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation && !req.user.roles.includes('admin')) {
      console.warn(`[UserController] Invalid update attempt by ${req.user.email}. Fields: ${updates}`);
      return res.status(400).json({ success: false, message: 'Invalid updates detected.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    console.log(`[SettingsUpdate] User: ${req.user.email}, Data:`, req.body);
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure settings object exists
    if (!user.settings) user.settings = {};
    
    user.settings = { ...user.settings, ...req.body };
    user.markModified('settings');
    await user.save();

    console.log(`[SettingsUpdate] Success for ${req.user.email}`);
    res.status(200).json({ success: true, data: user.settings });
  } catch (err) {
    console.error(`[SettingsUpdate] Error:`, err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update password
// @route   PUT /api/users/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload avatar
// @route   PUT /api/users/:id/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    console.log(`[AvatarUpload] Request for ID: ${req.params.id}`);
    if (!req.file) {
      console.warn(`[AvatarUpload] No file provided`);
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    console.log(`[AvatarUpload] File received: ${req.file.filename}, Size: ${req.file.size} bytes`);

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure only the user themselves or an admin can change avatar
    if (user._id.toString() !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const avatarPath = `/uploads/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarPath },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.error(`[AvatarUpload] User not found after update`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`[AvatarUpload] Success for ${updatedUser.email}`);
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    console.error(`[AvatarUpload] Critical Error:`, err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all mentors with matching logic
// @route   GET /api/users/mentors
// @access  Private
exports.getMentors = async (req, res) => {
  try {
    const learner = await User.findById(req.user.id).lean();
    const learnerSkills = learner ? (learner.skillsLearn || []) : [];
    
    const mentors = await User.find({ roles: 'mentor', isBlocked: false }).lean();

    const matchedMentors = mentors
      .filter(m => m._id.toString() !== req.user.id)
      .map(mentor => {
        let matchScore = 0;
        const skillsTeach = mentor.skillsTeach || [];
        
        // 1. Skill Overlap (40% weight)
        const overlap = skillsTeach.filter(skill => learnerSkills.includes(skill));
        const overlapScore = (overlap.length / (learnerSkills.length || 1)) * 40;
        matchScore += overlapScore;

        // 2. Rating (30% weight)
        const ratingScore = ((mentor.averageRating || 0) / 5) * 30;
        matchScore += ratingScore;

        // 3. Reputation & Experience (30% weight)
        const experienceScore = Math.min(((mentor.totalSessions || 0) / 20) * 15, 15) + Math.min(((mentor.reputationScore || 0) / 500) * 15, 15);
        matchScore += experienceScore;

        return {
          ...mentor,
          id: mentor._id.toString(),
          matchPercentage: Math.round(matchScore),
          overlapSkills: overlap
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      success: true,
      count: matchedMentors.length,
      data: matchedMentors
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/gamification/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const topLearners = await User.find({ roles: 'learner' }).sort({ xp: -1 }).limit(10).select('name avatar xp level badges');
    const topMentors = await User.find({ roles: 'mentor' }).sort({ totalEarnings: -1, reputationScore: -1 }).limit(10).select('name avatar totalEarnings reputationScore level');

    res.status(200).json({
      success: true,
      data: { topLearners, topMentors }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Award XP to user
// @route   POST /api/users/:id/xp
// @access  Private
exports.awardXP = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.xp += amount;
    
    // Level up logic (every 1000 XP = 1 Level)
    const newLevel = Math.floor(user.xp / 1000) + 1;
    let leveledUp = false;
    
    if (newLevel > user.level) {
      user.level = newLevel;
      leveledUp = true;
      user.achievements.push({ title: `Reached Level ${newLevel}`, date: new Date() });
    }

    await user.save();

    res.status(200).json({
      success: true,
      leveledUp,
      data: user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// @desc    Moderate user (Flag, Block, Remove Skill)
// @route   PATCH /api/users/:id/moderate
// @access  Private/Admin/Moderator
exports.moderateUser = async (req, res) => {
  try {
    const { action, skill } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let message = '';

    switch (action) {
      case 'flag':
        user.isFlagged = true;
        message = 'User account flagged';
        break;
      case 'warn':
        await createAndEmitNotification(req.app, {
          recipient: user._id,
          sender: req.user.id,
          type: 'moderation_warning',
          title: 'Official Warning',
          message: 'Your account has received an official warning for policy violation. Please review our community guidelines.',
          relatedId: user._id
        });
        message = 'Warning sent to user';
        break;
      case 'block':
        user.isBlocked = true;
        // Forced logout via socket
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user._id}`).emit('forced_logout', { reason: 'Your account has been blocked by a moderator.' });
        }
        message = 'User account blocked and disconnected';
        break;
      case 'unblock':
        user.isBlocked = false;
        message = 'User account unblocked';
        break;
      case 'remove_skill':
        if (skill) {
          user.skillsTeach = user.skillsTeach.filter(s => s !== skill);
          user.skillsLearn = user.skillsLearn.filter(s => s !== skill);
          message = `Skill "${skill}" removed from user profile`;
        }
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid moderation action' });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message,
      data: user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
