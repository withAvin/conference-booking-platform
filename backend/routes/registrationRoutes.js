// routes/registrationRoutes.js
const express = require('express');
const {
  createBooking,
  getMyBookings,
} = require('../controllers/registrationController');
const { protect, attendeeOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Organizers do not book. attendeeOnly returns 403, matching the
// mirror-image guard on the conference write routes.
router
  .route('/')
  .get(protect, attendeeOnly, getMyBookings)
  .post(protect, attendeeOnly, createBooking); // CBP-10

module.exports = router;
