// models/Registration.js
const { query, withTransaction } = require('../config/db');

// BR-02 overlap condition. Strict inequalities, so a conference ending
// at 13:00 and one starting at 13:00 do not clash. Using <= and >=
// here would wrongly reject abutting conferences and break SC-03.
//
//   overlap  <=>  A.starts_at < B.ends_at  AND  A.ends_at > B.starts_at
//
const CLASH_QUERY = `
  SELECT c.title, c.starts_at, c.ends_at
    FROM registrations r
    JOIN conferences c ON c.id = r.conference_id
   WHERE r.attendee_id = $1
     AND r.status = 'confirmed'
     AND r.id <> COALESCE($4, -1)
     AND c.starts_at < $3
     AND c.ends_at   > $2
   LIMIT 1
`;

class BookingError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code; // 'FULL' | 'CLASH' | 'NOT_FOUND' | 'DUPLICATE'
    this.details = details;
  }
}

// Books a place. Everything happens inside one transaction on one
// client, or the locks do nothing.
//
// Two rows are locked, always in the same order — user first, then
// conference. Consistent ordering is what prevents deadlock when two
// requests touch the same pair.
//
//   The user row serialises this attendee's own bookings, so two
//   simultaneous requests cannot both pass the BR-02 clash check.
//
//   The conference row serialises everyone booking that conference,
//   so two simultaneous requests cannot both pass the BR-01 capacity
//   check for the same last seat.
//
const book = async (attendeeId, conferenceId) =>
  withTransaction(async (client) => {
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [attendeeId]);

    const { rows: confRows } = await client.query(
      `SELECT id, title, starts_at, ends_at, capacity
         FROM conferences
        WHERE id = $1
          FOR UPDATE`,
      [conferenceId]
    );

    const conference = confRows[0];
    if (!conference) {
      throw new BookingError('NOT_FOUND', 'That conference no longer exists');
    }

    // BR-01. Counted inside the transaction, after the lock, so the
    // number cannot change between the check and the insert.
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS booked
         FROM registrations
        WHERE conference_id = $1 AND status = 'confirmed'`,
      [conferenceId]
    );

    if (countRows[0].booked >= conference.capacity) {
      throw new BookingError('FULL', `${conference.title} is full. No seats remaining.`);
    }

    // BR-02.
    const { rows: clashRows } = await client.query(CLASH_QUERY, [
      attendeeId,
      conference.starts_at,
      conference.ends_at,
      null,
    ]);

    if (clashRows[0]) {
      throw new BookingError('CLASH', 'Clashes with an existing booking', {
        clashesWith: clashRows[0],
      });
    }

    const { rows } = await client.query(
      `INSERT INTO registrations (attendee_id, conference_id, status)
       VALUES ($1, $2, 'confirmed')
       RETURNING id, conference_id, status`,
      [attendeeId, conferenceId]
    );

    return rows[0];
  });

const findMine = async (attendeeId) => {
  const { rows } = await query(
    `SELECT r.id,
            c.id AS conference_id,
            c.title,
            c.starts_at,
            c.ends_at
       FROM registrations r
       JOIN conferences c ON c.id = r.conference_id
      WHERE r.attendee_id = $1 AND r.status = 'confirmed'
      ORDER BY c.starts_at`,
    [attendeeId]
  );
  return rows;
};

module.exports = { book, findMine, BookingError };
