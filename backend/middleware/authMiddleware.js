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
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
          return res.status(401).json({ message: 'Not authorized, user deleted' });
      }

      // Check session timeout
      const sessionTimeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);
      const timeSinceLastActivity = (Date.now() - req.user.lastActivity) / (1000 * 60);

      if (timeSinceLastActivity > sessionTimeoutMinutes) {
          return res.status(401).json({ message: 'Session expired due to inactivity' });
      }

      // Update last activity
      req.user.lastActivity = Date.now();
      await req.user.save({ validateBeforeSave: false });

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const supportOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Support')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized for this role' });
  }
};

module.exports = { protect, admin, supportOrAdmin };
