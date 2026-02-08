const jwt = require('jsonwebtoken');

/**
 * Generate JWT token with user ID and role
 * @param {String} userId - MongoDB ObjectId of the user
 * @param {String} role - User role (participant, organizer, admin)
 * @returns {String} JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { 
      id: userId, 
      role: role 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
