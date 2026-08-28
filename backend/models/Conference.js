// models/Conference.js
const { query } = require('../config/db');

// booked is the confirmed count, which BR-01 checks against capacity.
// bookedByMe lets the attendee browse screen mark rows the caller has
// already booked, without a second request.
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

  // BOOL_OR returns null when a conference has no confirmed rows.
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

module.exports = { findAll, findById, create };
