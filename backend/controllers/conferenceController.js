// controllers/conferenceController.js
const Conference = require('../models/Conference');

// Shared by create and update. Returns field-keyed errors so each one
// lands on the input that caused it.
const validate = ({ title, date, startTime, endTime, capacity }) => {
  const errors = {};

  if (!title?.trim()) errors.title = 'Title is required';
  if (!date) errors.date = 'Date is required';
  if (!startTime) errors.startTime = 'Start time is required';
  if (!endTime) errors.endTime = 'End time is required';

  const capacityNumber = Number(capacity);
  if (!Number.isInteger(capacityNumber) || capacityNumber < 1) {
    errors.capacity = 'Capacity must be a whole number of 1 or more';
  }

  const startsAt = date && startTime ? new Date(`${date}T${startTime}`) : null;
  const endsAt = date && endTime ? new Date(`${date}T${endTime}`) : null;

  if (startsAt && endsAt && endsAt <= startsAt) {
    errors.endTime = 'End time must be after start time';
  }

  return { errors, startsAt, endsAt, capacityNumber };
};

const getConferences = async (req, res) => {
  try {
    res.json(await Conference.findAll(req.user.id));
  } catch (error) {
    console.error('Fetching conferences failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// Single conference, used to populate the edit form.
const getConference = async (req, res) => {
  try {
    const conference = await Conference.findById(Number(req.params.id));
    if (!conference) return res.status(404).json({ message: 'Conference not found' });
    res.json(conference);
  } catch (error) {
    console.error('Fetching conference failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// CBP-8 Create.
const createConference = async (req, res) => {
  const { errors, startsAt, endsAt, capacityNumber } = validate(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Please fix the fields below', errors });
  }

  try {
    const conference = await Conference.create({
      title: req.body.title.trim(),
      startsAt,
      endsAt,
      capacity: capacityNumber,
    });
    res.status(201).json(conference);
  } catch (error) {
    console.error('Creating conference failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// CBP-10 Update. Two rules beyond the shared validation, both of which
// exist to stop an edit invalidating bookings that already exist.
const updateConference = async (req, res) => {
  const id = Number(req.params.id);
  const { errors, startsAt, endsAt, capacityNumber } = validate(req.body);

  try {
    const existing = await Conference.findById(id);
    if (!existing) return res.status(404).json({ message: 'Conference not found' });

    // SC-05. Capacity cannot drop below the number already booked,
    // because BR-01 would then be violated by an edit rather than by a
    // booking, and there is no rule for which attendees to remove.
    if (capacityNumber < existing.booked) {
      errors.capacity = `${existing.booked} ${
        existing.booked === 1 ? 'person has' : 'people have'
      } already booked. Capacity cannot go below ${existing.booked}.`;
    }

    // Moving the times of a conference that already has bookings can
    // create a BR-02 violation retroactively: two conferences an
    // attendee holds legitimately could be made to overlap by an
    // organizer action, with no attendee involvement. Blocking the
    // change is simpler and safer than re-validating every affected
    // attendee and deciding whose booking to cancel.
    const timesChanged =
      new Date(existing.starts_at).getTime() !== startsAt?.getTime() ||
      new Date(existing.ends_at).getTime() !== endsAt?.getTime();

    if (timesChanged && existing.booked > 0) {
      errors.startTime = 'Times cannot be changed once the conference has bookings';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Please fix the fields below', errors });
    }

    const conference = await Conference.update(id, {
      title: req.body.title.trim(),
      startsAt,
      endsAt,
      capacity: capacityNumber,
    });

    res.json(conference);
  } catch (error) {
    console.error('Updating conference failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// CBP-10 Delete. Refused when confirmed bookings exist, so attendees
// cannot lose a booking without being told.
const deleteConference = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await Conference.findById(id);
    if (!existing) return res.status(404).json({ message: 'Conference not found' });

    if (existing.booked > 0) {
      return res.status(409).json({
        message: `${existing.booked} ${
          existing.booked === 1 ? 'person has' : 'people have'
        } booked. Cancel those bookings first.`,
      });
    }

    await Conference.remove(id);
    res.json({ id, deleted: true });
  } catch (error) {
    // Foreign key backstop: cancelled registrations still reference the
    // conference, so the delete is refused even though the confirmed
    // count is zero.
    if (error.code === '23503') {
      return res.status(409).json({
        message: 'This conference has booking history and cannot be deleted.',
      });
    }
    console.error('Deleting conference failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  getConferences,
  getConference,
  createConference,
  updateConference,
  deleteConference,
};
