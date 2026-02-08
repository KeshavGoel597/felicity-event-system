const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getProfile,
  updateProfile,
  getOngoingEvents,
} = require('../controllers/organizerDashboardController');
const {
  createEvent,
  updateEvent,
  publishEvent,
  changeEventStatus,
  getEventDetails,
  updateCustomForm,
  getParticipants,
  exportParticipantsCSV,
} = require('../controllers/organizerEventController');
const {
  markAttendance,
  getAttendanceStats,
  toggleAttendance,
} = require('../controllers/qrScannerController');
const {
  getPendingPayments,
  approvePayment,
  rejectPayment,
} = require('../controllers/paymentApprovalController');
const { getMyResetRequests } = require('../controllers/passwordResetController');
const { getEventFeedback } = require('../controllers/feedbackController');
const { postOrganizerMessage, getOrganizerDiscussions, pinMessage } = require('../controllers/discussionController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected (organizer only)

// Dashboard & Profile
router.get('/dashboard', protect, authorize('organizer'), getDashboard);
router.get('/profile', protect, authorize('organizer'), getProfile);
router.put('/profile', protect, authorize('organizer'), updateProfile);

// Events Management
router.get('/events/ongoing', protect, authorize('organizer'), getOngoingEvents);
router.post('/events/create', protect, authorize('organizer'), createEvent);
router.put('/events/:eventId', protect, authorize('organizer'), updateEvent);
router.post('/events/:eventId/publish', protect, authorize('organizer'), publishEvent);
router.put('/events/:eventId/status', protect, authorize('organizer'), changeEventStatus);
router.get('/events/:eventId/details', protect, authorize('organizer'), getEventDetails);

// Custom Form
router.put('/events/:eventId/custom-form', protect, authorize('organizer'), updateCustomForm);

// Participants Management
router.get('/events/:eventId/participants', protect, authorize('organizer'), getParticipants);
router.get('/events/:eventId/export-csv', protect, authorize('organizer'), exportParticipantsCSV);

// QR Scanner & Attendance Tracking
router.post('/events/:eventId/scan-qr', protect, authorize('organizer'), markAttendance);
router.get('/events/:eventId/attendance', protect, authorize('organizer'), getAttendanceStats);
router.put('/events/:eventId/attendance/:registrationId', protect, authorize('organizer'), toggleAttendance);

// Payment Approval Workflow
router.get('/events/:eventId/payment-approvals', protect, authorize('organizer'), getPendingPayments);
router.put('/registrations/:registrationId/approve-payment', protect, authorize('organizer'), approvePayment);
router.put('/registrations/:registrationId/reject-payment', protect, authorize('organizer'), rejectPayment);

// Password Reset Requests
router.get('/password-reset-requests', protect, authorize('organizer'), getMyResetRequests);

// Feedback & Ratings
router.get('/events/:eventId/feedback', protect, authorize('organizer'), getEventFeedback);

// Discussion Forum
router.post('/events/:eventId/discussions', protect, authorize('organizer'), postOrganizerMessage);
router.get('/events/:eventId/discussions', protect, authorize('organizer'), getOrganizerDiscussions);
router.put('/discussions/:discussionId/pin', protect, authorize('organizer'), pinMessage);

module.exports = router;
