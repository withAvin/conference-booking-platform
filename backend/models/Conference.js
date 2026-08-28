// models/Conference.js
const { query } = require('../config/db');

// Every list view needs the confirmed count, so it is computed here
// rather than in each caller. Cancelled rows are excluded, which is
// what makes BR-01 correct.
const CONFERENCE_WITH_COUNT = `
  SELECT c.id,
         c.title,
         c.starts_at,
         c.ends_at,
         c.capacity,
         COUNT(r.id)::int AS booked
    FROM conferences c
    LEFT JOIN registrations r
      ON r.conference_id = c.id AND r.status = 'confirmed'
`;

const findAll = async () => {
  const { rows } = await query(
    `${CONFERENCE_WITH_COUNT} GROUP BY c.id ORDER BY c.starts_at`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await query(
    `${CONFERENCE_WITH_COUNT} WHERE c.id = $1 GROUP BY c.id`,
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
  return { ...rows[0], booked: 0 };
};

module.exports = { findAll, findById, create };
