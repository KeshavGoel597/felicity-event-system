const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  getDashboard,
} = require('../controllers/participantController');
const { submitFeedback, getFeedbackStats } = require('../controllers/feedbackController');
const { postMessage, getDiscussions, deleteMessage } = require('../controllers/discussionController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication as participant
router.use(protect);
router.use(authorize('participant'));

// Dashboard route
router.get('/dashboard', getDashboard);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Preferences route
router.put('/preferences', updatePreferences);

// Password change route
router.post('/change-password', changePassword);

// Feedback routes (Anonymous)
router.post('/events/:eventId/feedback', submitFeedback);
router.get('/events/:eventId/feedback-stats', getFeedbackStats);

// Discussion Forum routes
router.post('/events/:eventId/discussions', postMessage);
router.get('/events/:eventId/discussions', getDiscussions);
router.delete('/discussions/:discussionId', deleteMessage);

module.exports = router;
