const express = require('express');
const router = express.Router();
const {
  getDashboard,
  createOrganizer,
  getAllOrganizers,
  getOrganizerDetails,
  disableOrganizer,
  enableOrganizer,
  deleteOrganizer,
  resetOrganizerPassword,
  getAllEvents,
} = require('../controllers/adminController');
const {
  getPasswordResetRequests,
  approvePasswordReset,
  rejectPasswordReset,
} = require('../controllers/passwordResetController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected (admin only)

// Dashboard
router.get('/dashboard', protect, authorize('admin'), getDashboard);

// Organizer Management
router.post('/organizers/create', protect, authorize('admin'), createOrganizer);
router.get('/organizers', protect, authorize('admin'), getAllOrganizers);
router.get('/organizers/:organizerId', protect, authorize('admin'), getOrganizerDetails);
router.put('/organizers/:organizerId/disable', protect, authorize('admin'), disableOrganizer);
router.put('/organizers/:organizerId/enable', protect, authorize('admin'), enableOrganizer);
router.put('/organizers/:organizerId/reset-password', protect, authorize('admin'), resetOrganizerPassword);
router.delete('/organizers/:organizerId', protect, authorize('admin'), deleteOrganizer);

// Password Reset Requests
router.get('/password-reset-requests', protect, authorize('admin'), getPasswordResetRequests);
router.put('/password-reset-requests/:requestId/approve', protect, authorize('admin'), approvePasswordReset);
router.put('/password-reset-requests/:requestId/reject', protect, authorize('admin'), rejectPasswordReset);

// Event Management
router.get('/events', protect, authorize('admin'), getAllEvents);

module.exports = router;
