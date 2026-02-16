const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  purchaseMerchandise,
  cancelRegistration,
  getTicket,
} = require('../controllers/registrationController');
const {
  uploadPaymentProof,
} = require('../controllers/paymentApprovalController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

// All routes are protected (participant only)
router.post(
  '/event/:eventId',
  protect,
  authorize('participant'),
  registerForEvent
);

router.post(
  '/merchandise/:eventId',
  protect,
  authorize('participant'),
  purchaseMerchandise
);

router.delete(
  '/:registrationId',
  protect,
  authorize('participant'),
  cancelRegistration
);

// Get ticket by ticket ID
router.get(
  '/ticket/:ticketId',
  protect,
  authorize('participant'),
  getTicket
);

// Payment proof upload for merchandise
router.post(
  '/:registrationId/payment-proof',
  protect,
  authorize('participant'),
  upload.single('paymentProof'),
  uploadPaymentProof
);

module.exports = router;
