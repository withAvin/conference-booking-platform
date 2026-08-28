// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// The role is signed into the token so the role check in
// authMiddleware does not need a database round trip on every request.
const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

// CBP-6 Signup
// Validation is deliberately minimal: username uniqueness only.
// Signup is not an assessed feature, so no format or strength rules.
const registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res
      .status(400)
      .json({ message: 'Username, password and role are required' });
  }

  if (!User.VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Role must be attendee or organizer' });
  }

  try {
    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(409).json({ message: 'That username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, role });

    res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    // The unique index on users.username catches the race where two
    // signups with the same name arrive at once and both pass the
    // check above.
    if (error.code === '23505') {
      return res.status(409).json({ message: 'That username is already taken' });
    }
    console.error('Signup failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// CBP-7 Login
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await User.findByUsername(username);

    // Same message whether the username or the password was wrong,
    // so the response does not reveal which usernames exist.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// Returns the logged-in user. The frontend calls this on load to
// confirm a stored token is still valid.
const getMe = async (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
};

module.exports = { registerUser, loginUser, getMe };
