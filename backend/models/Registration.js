// models/Registration.js
const { query, withTransaction } = require('../config/db');

// BR-02 overlap condition. Strict inequalities, so a conference ending
// at 13:00 and one starting at 13:00 do not clash. Using <= and >=
// here would wrongly reject abutting conferences and break SC-03.
//
//   overlap  <=>  A.starts_at < B.ends_at  AND  A.ends_at > B.starts_at
//
// $4 excludes one registration from the check. When changing a
// booking, the row being moved must not count as clashing with its own
// destination, or every change would be refused. COALESCE($4, -1)
// means "exclude nothing" when no id is passed.
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

// Shared by book() and change(). Runs inside an open transaction on a
// locked conference row.
const assertBookable = async (client, attendeeId, conference, excludeRegistrationId) => {
  // BR-01. Counted after the lock, so the number cannot change between
  // the check and the write.
  const { rows: countRows } = await client.query(
    `SELECT COUNT(*)::int AS booked
       FROM registrations
      WHERE conference_id = $1 AND status = 'confirmed'`,
    [conference.id]
  );

  if (countRows[0].booked >= conference.capacity) {
    throw new BookingError('FULL', `${conference.title} is full. No seats remaining.`);
  }

  // BR-02.
  const { rows: clashRows } = await client.query(CLASH_QUERY, [
    attendeeId,
    conference.starts_at,
    conference.ends_at,
    excludeRegistrationId ?? null,
  ]);

  if (clashRows[0]) {
    throw new BookingError('CLASH', 'Clashes with an existing booking', {
      clashesWith: clashRows[0],
    });
  }
};

const lockConference = async (client, conferenceId) => {
  const { rows } = await client.query(
    `SELECT id, title, starts_at, ends_at, capacity
       FROM conferences
      WHERE id = $1
        FOR UPDATE`,
    [conferenceId]
  );
  if (!rows[0]) throw new BookingError('NOT_FOUND', 'That conference no longer exists');
  return rows[0];
};

// Two rows are locked, always in the same order — user first, then
// conference. Consistent ordering is what prevents deadlock when two
// requests touch the same pair.
const book = async (attendeeId, conferenceId) =>
  withTransaction(async (client) => {
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [attendeeId]);
    const conference = await lockConference(client, conferenceId);

    await assertBookable(client, attendeeId, conference, null);

    const { rows } = await client.query(
      `INSERT INTO registrations (attendee_id, conference_id, status)
       VALUES ($1, $2, 'confirmed')
       RETURNING id, conference_id, status`,
      [attendeeId, conferenceId]
    );

    return rows[0];
  });

// CBP-15 Change. A genuine UPDATE of conference_id, not a cancel
// followed by a book. Both rules are re-checked against the target
// before the row moves, and if either fails the transaction rolls back
// with the original booking untouched.
//
// The seat on the old conference frees itself: a seat is a confirmed
// row pointing at that conference, and this row now points elsewhere.
const change = async (attendeeId, registrationId, newConferenceId) =>
  withTransaction(async (client) => {
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [attendeeId]);

    const { rows: regRows } = await client.query(
      `SELECT id, conference_id
         FROM registrations
        WHERE id = $1 AND attendee_id = $2 AND status = 'confirmed'
          FOR UPDATE`,
      [registrationId, attendeeId]
    );

    const registration = regRows[0];
    if (!registration) {
      throw new BookingError('NOT_FOUND', 'That booking no longer exists');
    }

    if (registration.conference_id === newConferenceId) {
      throw new BookingError('DUPLICATE', 'That is the conference you are already booked on');
    }

    const conference = await lockConference(client, newConferenceId);

    // Exclude this registration from its own clash check.
    await assertBookable(client, attendeeId, conference, registrationId);

    const { rows } = await client.query(
      `UPDATE registrations
          SET conference_id = $2
        WHERE id = $1
        RETURNING id, conference_id, status`,
      [registrationId, newConferenceId]
    );

    return rows[0];
  });

// CBP-15 Cancel. Soft delete: the row is marked cancelled rather than
// removed. Only confirmed rows count towards BR-01 and BR-02, so the
// seat frees immediately, and the booking history survives.
const cancel = async (attendeeId, registrationId) => {
  const { rows } = await query(
    `UPDATE registrations
        SET status = 'cancelled'
      WHERE id = $1 AND attendee_id = $2 AND status = 'confirmed'
      RETURNING id, conference_id, status`,
    [registrationId, attendeeId]
  );

  if (!rows[0]) throw new BookingError('NOT_FOUND', 'That booking no longer exists');
  return rows[0];
};

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

// Conferences this attendee could move a given booking to: not full,
// not clashing with anything else they hold, and not the one they are
// already on. Used to populate the change screen, so the list only
// offers moves that will succeed.
const findMoveTargets = async (attendeeId, registrationId) => {
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
      WHERE c.id <> (SELECT conference_id FROM registrations WHERE id = $2)
        AND NOT EXISTS (
              SELECT 1
                FROM registrations mine
                JOIN conferences mc ON mc.id = mine.conference_id
               WHERE mine.attendee_id = $1
                 AND mine.status = 'confirmed'
                 AND mine.id <> $2
                 AND mc.starts_at < c.ends_at
                 AND mc.ends_at   > c.starts_at
            )
      GROUP BY c.id
     HAVING COUNT(r.id) < c.capacity
      ORDER BY c.starts_at`,
    [attendeeId, registrationId]
  );
  return rows;
};

module.exports = { book, change, cancel, findMine, findMoveTargets, BookingError };
