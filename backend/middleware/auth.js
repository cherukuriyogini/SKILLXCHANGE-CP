const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Block check — prevents blocked users from continuing with existing tokens
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Check if user has the role
    const hasRole = req.user.roles.some(role => roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `User role is not authorized to access this route`
      });
    }

    // 2. EXTRA HARDENING: Strict Admin Verification
    // If the user is relying SOLELY on their 'admin' role to access this route
    // (i.e., no other role they hold also qualifies), verify their email against
    // the ADMIN_EMAIL env var. This prevents a compromised non-admin account
    // that was somehow granted the admin role from bypassing this check.
    //
    // IMPORTANT: The allowed admin email is read from the ADMIN_EMAIL environment
    // variable — never hardcoded. Change it in .env, not here.
    if (
      req.user.roles.includes('admin') &&
      !req.user.roles.some(r => r !== 'admin' && roles.includes(r))
    ) {
      const adminEmail = process.env.ADMIN_EMAIL;

      // Fail-closed: if ADMIN_EMAIL is not configured, deny access and warn loudly.
      if (!adminEmail) {
        console.error(
          '[Auth] SECURITY WARNING: ADMIN_EMAIL is not set in .env. ' +
          'Admin access denied for all users until this is configured.'
        );
        return res.status(403).json({
          success: false,
          message: 'Admin access is not configured. Contact the system administrator.'
        });
      }

      if (req.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
        console.warn(
          `[Auth] SECURITY ALERT: User ${req.user.email} attempted to access ` +
          `an Admin route but is not the designated admin.`
        );
        return res.status(403).json({
          success: false,
          message: 'Strict security policy: Unauthorized Admin access'
        });
      }
    }

    next();
  };
};
