// routes/registrationRoutes.js
const express = require('express');
const {
  createBooking,
  changeBooking,
  cancelBooking,
  getMyBookings,
  getMoveTargets,
} = require('../controllers/registrationController');
const { protect, attendeeOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Organizers do not book. attendeeOnly returns 403, mirroring the
// organizerOnly guard on the conference write routes.
router
  .route('/')
  .get(protect, attendeeOnly, getMyBookings)
  .post(protect, attendeeOnly, createBooking); // CBP-10

router.get('/:id/move-targets', protect, attendeeOnly, getMoveTargets); // CBP-15

router
  .route('/:id')
  .put(protect, attendeeOnly, changeBooking) // CBP-15
  .delete(protect, attendeeOnly, cancelBooking); // CBP-15

module.exports = router;
