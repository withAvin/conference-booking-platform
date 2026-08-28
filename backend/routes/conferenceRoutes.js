// routes/conferenceRoutes.js
const express = require('express');
const {
  getConferences,
  createConference,
} = require('../controllers/conferenceController');
const { protect, organizerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Both roles can read. Only organizers can write.
// The organizerOnly guard here is what SC-06 tests.
router
  .route('/')
  .get(protect, getConferences)
  .post(protect, organizerOnly, createConference); // CBP-8

module.exports = router;
