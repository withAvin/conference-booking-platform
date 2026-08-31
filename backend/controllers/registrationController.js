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

// Both book and change fail in the same ways, so the translation from
// BookingError to an HTTP response is shared.
const sendBookingError = (res, error, context) => {
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

  if (error.code === 'DUPLICATE' || error.code === '23505') {
    return res.status(409).json({
      message: error.message || 'You have already booked this conference',
    });
  }

  console.error(`${context} failed:`, error.message);
  return res.status(500).json({ message: 'Something went wrong' });
};

// CBP-10 Book.
const createBooking = async (req, res) => {
  const conferenceId = Number(req.body.conferenceId);

  if (!Number.isInteger(conferenceId)) {
    return res.status(400).json({ message: 'A conference must be chosen' });
  }

  try {
    const registration = await Registration.book(req.user.id, conferenceId);
    return res.status(201).json(registration);
  } catch (error) {
    return sendBookingError(res, error, 'Booking');
  }
};

// CBP-15 Change. On failure the original booking is unchanged, because
// the whole operation rolls back.
const changeBooking = async (req, res) => {
  const registrationId = Number(req.params.id);
  const conferenceId = Number(req.body.conferenceId);

  if (!Number.isInteger(conferenceId)) {
    return res.status(400).json({ message: 'A conference must be chosen' });
  }

  try {
    const registration = await Registration.change(
      req.user.id,
      registrationId,
      conferenceId
    );
    return res.json(registration);
  } catch (error) {
    return sendBookingError(res, error, 'Changing booking');
  }
};

// CBP-15 Cancel.
const cancelBooking = async (req, res) => {
  try {
    const registration = await Registration.cancel(req.user.id, Number(req.params.id));
    return res.json(registration);
  } catch (error) {
    return sendBookingError(res, error, 'Cancelling booking');
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

// Conferences this booking could be moved to. Full and clashing
// conferences are filtered out server-side, so the change screen only
// offers moves that will succeed.
const getMoveTargets = async (req, res) => {
  try {
    res.json(await Registration.findMoveTargets(req.user.id, Number(req.params.id)));
  } catch (error) {
    console.error('Fetching move targets failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  createBooking,
  changeBooking,
  cancelBooking,
  getMyBookings,
  getMoveTargets,
};
