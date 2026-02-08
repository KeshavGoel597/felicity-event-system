const express = require('express');
const router = express.Router();
const {
  participantSignup,
  participantLogin,
  organizerLogin,
  adminLogin,
} = require('../controllers/authController');
const { requestPasswordReset } = require('../controllers/passwordResetController');

// Participant routes
router.post('/participant/signup', participantSignup);
router.post('/participant/login', participantLogin);

// Organizer routes
router.post('/organizer/login', organizerLogin);
router.post('/organizer/request-password-reset', requestPasswordReset);

// Admin routes
router.post('/admin/login', adminLogin);

module.exports = router;
