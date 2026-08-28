// controllers/registrationController.js
const Registration = require('../models/Registration');

const timeRange = (startsAt, endsAt) => {
  const opts = { hour: '2-digit', minute: '2-digit', hour12: false };
  const dateOpts = { day: 'numeric', month: 'short' };
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return `${start.toLocaleTimeString('en-AU', opts)} – ${end.toLocaleTimeString(
    'en-AU',
    opts
  )} on ${start.toLocaleDateString('en-AU', dateOpts)}`;
};

// CBP-10 Book a conference.
// Each refusal states why, which is what SC-08 asks for. The clash
// message names the conference, so the attendee knows what to cancel.
const createBooking = async (req, res) => {
  const conferenceId = Number(req.body.conferenceId);

  if (!Number.isInteger(conferenceId)) {
    return res.status(400).json({ message: 'A conference must be chosen' });
  }

  try {
    const registration = await Registration.book(req.user.id, conferenceId);
    return res.status(201).json(registration);
  } catch (error) {
    if (error.code === 'FULL') {
      return res.status(409).json({ message: error.message });
    }

    if (error.code === 'CLASH') {
      const { title, starts_at, ends_at } = error.details.clashesWith;
      return res.status(409).json({
        message: `Clashes with ${title}, ${timeRange(starts_at, ends_at)}.`,
      });
    }

    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }

    // The partial unique index on (attendee_id, conference_id) where
    // status = 'confirmed' catches a double submit. The overlap check
    // cannot: under strict inequalities a conference does not overlap
    // itself.
    if (error.code === '23505') {
      return res.status(409).json({ message: 'You have already booked this conference' });
    }

    console.error('Booking failed:', error.message);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    res.json(await Registration.findMine(req.user.id));
  } catch (error) {
    console.error('Fetching bookings failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = { createBooking, getMyBookings };
