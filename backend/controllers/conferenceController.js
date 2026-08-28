// controllers/conferenceController.js
const Conference = require('../models/Conference');

// Both roles read the conference list. The attendee browse screen and
// the organizer manage screen use the same data, framed differently
// in the UI: seats remaining vs booked against capacity.
const getConferences = async (req, res) => {
  try {
    const conferences = await Conference.findAll();
    res.json(conferences);
  } catch (error) {
    console.error('Fetching conferences failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// CBP-8 Create a conference. Organizer only.
const createConference = async (req, res) => {
  const { title, date, startTime, endTime, capacity } = req.body;
  const errors = {};

  if (!title?.trim()) errors.title = 'Title is required';
  if (!date) errors.date = 'Date is required';
  if (!startTime) errors.startTime = 'Start time is required';
  if (!endTime) errors.endTime = 'End time is required';

  const capacityNumber = Number(capacity);
  if (!Number.isInteger(capacityNumber) || capacityNumber < 1) {
    errors.capacity = 'Capacity must be a whole number of 1 or more';
  }

  // Times are combined here so the database stores two timestamps.
  // BR-02's overlap check compares timestamps, not date plus time,
  // so keeping them separate would make the rule harder to express.
  const startsAt = date && startTime ? new Date(`${date}T${startTime}`) : null;
  const endsAt = date && endTime ? new Date(`${date}T${endTime}`) : null;

  if (startsAt && endsAt && endsAt <= startsAt) {
    errors.endTime = 'End time must be after start time';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Please fix the fields below', errors });
  }

  try {
    const conference = await Conference.create({
      title: title.trim(),
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

module.exports = { getConferences, createConference };
