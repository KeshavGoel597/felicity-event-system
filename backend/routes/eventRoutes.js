const express = require('express');
const router = express.Router();
const {
  browseEvents,
  getTrendingEvents,
  getEventDetails,
  checkRegistration,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/browse', browseEvents);
router.get('/trending', getTrendingEvents);
router.get('/:eventId', getEventDetails);

// Protected routes (participant only)
router.get(
  '/:eventId/check-registration',
  protect,
  authorize('participant'),
  checkRegistration
);

module.exports = router;
