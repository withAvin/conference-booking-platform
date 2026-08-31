// models/Conference.js
const { query } = require('../config/db');

const findAll = async (userId = null) => {
  const { rows } = await query(
    `SELECT c.id,
            c.title,
            c.starts_at,
            c.ends_at,
            c.capacity,
            COUNT(r.id)::int AS booked,
            BOOL_OR(r.attendee_id = $1) AS "bookedByMe"
       FROM conferences c
       LEFT JOIN registrations r
         ON r.conference_id = c.id AND r.status = 'confirmed'
      GROUP BY c.id
      ORDER BY c.starts_at`,
    [userId]
  );
  return rows.map((r) => ({ ...r, bookedByMe: r.bookedByMe === true }));
};

const findById = async (id) => {
  const { rows } = await query(
    `SELECT c.id,
            c.title,
            c.starts_at,
            c.ends_at,
            c.capacity,
            COUNT(r.id)::int AS booked
       FROM conferences c
       LEFT JOIN registrations r
         ON r.conference_id = c.id AND r.status = 'confirmed'
      WHERE c.id = $1
      GROUP BY c.id`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ title, startsAt, endsAt, capacity }) => {
  const { rows } = await query(
    `INSERT INTO conferences (title, starts_at, ends_at, capacity)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, starts_at, ends_at, capacity`,
    [title, startsAt, endsAt, capacity]
  );
  return { ...rows[0], booked: 0, bookedByMe: false };
};

// CBP-10 Update.
const update = async (id, { title, startsAt, endsAt, capacity }) => {
  const { rows } = await query(
    `UPDATE conferences
        SET title = $2, starts_at = $3, ends_at = $4, capacity = $5
      WHERE id = $1
      RETURNING id, title, starts_at, ends_at, capacity`,
    [id, title, startsAt, endsAt, capacity]
  );
  return rows[0] || null;
};

// CBP-10 Delete. The controller checks for confirmed bookings first so
// it can explain the refusal. The ON DELETE RESTRICT foreign key on
// registrations.conference_id is the backstop if that check is ever
// bypassed.
const remove = async (id) => {
  const { rowCount } = await query('DELETE FROM conferences WHERE id = $1', [id]);
  return rowCount > 0;
};

module.exports = { findAll, findById, create, update, remove };
