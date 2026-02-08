const express = require('express');
const router = express.Router();
const {
  getAllOrganizers,
  getOrganizerDetails,
  getOrganizerEvents,
} = require('../controllers/organizerController');

// All routes are public
router.get('/', getAllOrganizers);
router.get('/:organizerId', getOrganizerDetails);
router.get('/:organizerId/events', getOrganizerEvents);

module.exports = router;
