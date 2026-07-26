const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Read token from cookie or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pixelkeyssecretkey');

    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      res.status(401);
      return next(new Error('Not authorized, user not found'));
    }

    if (user.isBanned) {
      res.status(403);
      return next(new Error('Access denied, user is banned'));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401);
    return next(new Error('Not authorized, token validation failed'));
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    return next(new Error('Access denied, administrator role required'));
  }
};

module.exports = { protect, adminOnly };
