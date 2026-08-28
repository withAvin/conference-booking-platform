// models/User.js
// Data access for the users table. No ORM: plain parameterised queries.
// Parameterised ($1, $2) rather than string concatenation, so the input
// cannot be read as SQL.

const { query } = require('../config/db');

const VALID_ROLES = ['attendee', 'organizer'];

const findByUsername = async (username) => {
  const { rows } = await query(
    'SELECT id, username, password, role FROM users WHERE username = $1',
    [username]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await query(
    'SELECT id, username, role FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

// Returns the new user without the password hash.
const create = async ({ username, passwordHash, role }) => {
  const { rows } = await query(
    `INSERT INTO users (username, password, role)
     VALUES ($1, $2, $3)
     RETURNING id, username, role`,
    [username, passwordHash, role]
  );
  return rows[0];
};

module.exports = { findByUsername, findById, create, VALID_ROLES };
