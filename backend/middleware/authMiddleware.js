const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user without password
      req.user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized — user no longer exists' });
      }

      // Check session timeout
      const sessionTimeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);
      const timeSinceLastActivity = (Date.now() - new Date(req.user.lastActivity).getTime()) / (1000 * 60);

      if (timeSinceLastActivity > sessionTimeoutMinutes) {
        return res.status(401).json({ message: 'Session expired due to inactivity. Please log in again.' });
      }

      // Atomically update lastActivity without triggering full document validation or re-save
      await User.findByIdAndUpdate(req.user._id, { lastActivity: new Date() });

      return next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      // Let the global error handler deal with JWT errors too
      return res.status(401).json({ message: 'Not authorized — token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied — Admin role required' });
  }
};

const supportOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Support')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied — Support or Admin role required' });
  }
};

module.exports = { protect, admin, supportOrAdmin };
