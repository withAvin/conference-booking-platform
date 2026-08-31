// routes/conferenceRoutes.js
const express = require('express');
const {
  getConferences,
  getConference,
  createConference,
  updateConference,
  deleteConference,
} = require('../controllers/conferenceController');
const { protect, organizerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Both roles read the list. Every write is organizer-only, which is
// what SC-06 tests by calling these endpoints as an attendee.
router
  .route('/')
  .get(protect, getConferences)
  .post(protect, organizerOnly, createConference); // CBP-8

router
  .route('/:id')
  .get(protect, organizerOnly, getConference) // populates the edit form
  .put(protect, organizerOnly, updateConference) // CBP-10
  .delete(protect, organizerOnly, deleteConference); // CBP-10

module.exports = router;
