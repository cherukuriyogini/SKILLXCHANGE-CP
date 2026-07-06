const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, roles, bio, skillsTeach, skillsLearn } = req.body;
    const allowedSignupRoles = ['learner', 'mentor'];
    const normalizedRoles = Array.isArray(roles)
      ? roles.filter((role) => allowedSignupRoles.includes(role))
      : [];
    const finalRoles = normalizedRoles.length ? normalizedRoles : ['learner'];

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered. Please login instead.'
      });
    }

    await User.create({
      name,
      email,
      password,
      roles: finalRoles,
      bio: bio || '',
      skillsTeach: skillsTeach || [],
      skillsLearn: skillsLearn || []
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please login to continue.'
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    const trimmedEmail = email.trim();
    const user = await User.findOne({ 
      email: { $regex: new RegExp('^' + trimmedEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } 
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed attempts. Please try again in 30 minutes.'
      });
    }

    const isMatch = await user.matchPassword(password);
    
    // Account Lockout Logic
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 mins
      }
      await user.save({ validateBeforeSave: false });

      return res.status(401).json({
        success: false,
        message: user.lockUntil && user.lockUntil > Date.now() 
          ? 'Account is temporarily locked due to multiple failed attempts. Try again in 30 mins.'
          : 'Invalid credentials. Please check your email and password.'
      });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    user.lastLogin = Date.now();
    user.status = 'online';
    await user.save({ validateBeforeSave: false });

    // Set refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        roles: user.roles,
        bio: user.bio,
        avatar: user.avatar,
        skillsTeach: user.skillsTeach,
        skillsLearn: user.skillsLearn,
        reputationScore: user.reputationScore,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      res.clearCookie('refreshToken');
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }

    if (user.isBlocked) {
      res.clearCookie('refreshToken');
      return res.status(403).json({ success: false, message: 'Your account has been blocked.' });
    }

    // Generate new tokens (Rotation)
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (err) {
    res.status(403).json({ success: false, message: 'Token refresh failed' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = undefined;
      user.status = 'offline';
      await user.save({ validateBeforeSave: false });
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // Normalize: always include an `id` string field so frontend comparisons are consistent
    const userData = user.toObject();
    userData.id = userData._id.toString();
    res.status(200).json({ success: true, data: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({ success: false, message: 'There is no user with that email' });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    // In production, send actual email. For now, log to console.
    // Remove debug logs
    // ...
    
    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  const crypto = require('crypto');
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid token' });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successful' });
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  const user = await User.findOne({ emailVerificationToken: req.params.token }).select('+emailVerificationToken');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid verification token' });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully' });
};

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};
