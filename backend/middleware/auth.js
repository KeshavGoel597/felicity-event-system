const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Admin = require('../models/Admin');

/**
 * Middleware to protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.',
    });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Find user based on role
    let user;
    
    if (decoded.role === 'participant') {
      user = await User.findById(decoded.id).select('-password');
    } else if (decoded.role === 'organizer') {
      user = await Organizer.findById(decoded.id).select('-password');
      
      // Check if organizer is approved
      if (user && !user.isApproved) {
        return res.status(403).json({
          success: false,
          message: 'Your organizer account has been disabled. Please contact admin.',
        });
      }
    } else if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
    }

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route.',
    });
  }
};

/**
 * Middleware to restrict routes to specific roles
 * @param  {...String} roles - Allowed roles (participant, organizer, admin)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
