const express = require('express');
const router = express.Router();
const {
  participantSignup,
  participantLogin,
  organizerLogin,
  adminLogin,
  completeOnboarding,
  getMe,
} = require('../controllers/authController');
const { requestPasswordReset } = require('../controllers/passwordResetController');
const { protect, authorize } = require('../middleware/auth');

// Participant routes (support both /participant/signup and /signup for frontend compatibility)
router.post('/participant/signup', participantSignup);
router.post('/signup', participantSignup);
router.post('/participant/login', participantLogin);
router.post('/login', participantLogin);

// Onboarding route
router.post('/onboarding', protect, authorize('participant'), completeOnboarding);

// Get current user profile
router.get('/me', protect, getMe);

// Organizer routes
router.post('/organizer/login', organizerLogin);
router.post('/organizer/request-password-reset', requestPasswordReset);

// Admin routes
router.post('/admin/login', adminLogin);

module.exports = router;
