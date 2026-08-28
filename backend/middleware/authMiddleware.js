// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the token and attaches the user to the request.
// The tutorial version had a bug: after a failed verify it sent a 401
// and then fell through to a second res.send. Each path here returns.
const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Read the user from the database rather than trusting the token
    // payload alone, so a deleted account cannot keep using a valid token.
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// SC-06: an attendee requesting an organizer route gets 403, not the page.
// 403 rather than 401: the user is authenticated, just not permitted.
const organizerOnly = (req, res, next) => {
  if (req.user?.role !== 'organizer') {
    return res.status(403).json({ message: 'Organizers only' });
  }
  return next();
};

const attendeeOnly = (req, res, next) => {
  if (req.user?.role !== 'attendee') {
    return res.status(403).json({ message: 'Attendees only' });
  }
  return next();
};

module.exports = { protect, organizerOnly, attendeeOnly };
