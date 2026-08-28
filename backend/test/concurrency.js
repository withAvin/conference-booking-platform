// test/concurrency.js
// TC-01 — evidence for SC-01: a conference never goes over capacity.
//
// Clicking Book in two browsers cannot test this. The transaction
// finishes in a few milliseconds, so two people clicking are never
// actually simultaneous and the race never happens.
//
// This script fires 20 booking requests at the same instant, at a
// conference with one seat. Exactly one must succeed.
//
// Run with the server up:  npm run test:concurrency

require('dotenv').config();
const { pool } = require('../config/db');

const API = process.env.TEST_API_URL || 'http://localhost:5001';
const ATTEMPTS = 20;
const CONFERENCE_TITLE = 'Security Briefing'; // capacity 1 in the seed data

const post = async (path, body, token) => {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

// Each request needs its own attendee. One attendee booking the same
// conference 20 times would be blocked by the partial unique index
// rather than by the capacity check, which is not what this tests.
const createAttendees = async (count) => {
  const stamp = Date.now();
  const tokens = [];

  for (let i = 0; i < count; i += 1) {
    const { body } = await post('/api/auth/register', {
      username: `loadtest_${stamp}_${i}`,
      password: 'loadtest',
      role: 'attendee',
    });
    tokens.push(body.token);
  }

  return { tokens, stamp };
};

const cleanUp = async (stamp) => {
  await pool.query(
    `DELETE FROM registrations
      WHERE attendee_id IN (SELECT id FROM users WHERE username LIKE $1)`,
    [`loadtest_${stamp}_%`]
  );
  await pool.query('DELETE FROM users WHERE username LIKE $1', [`loadtest_${stamp}_%`]);
};

const run = async () => {
  console.log(`\nTC-01 concurrency test — ${ATTEMPTS} simultaneous bookings\n`);

  const { rows } = await pool.query(
    'SELECT id, title, capacity FROM conferences WHERE title = $1',
    [CONFERENCE_TITLE]
  );
  const conference = rows[0];

  if (!conference) {
    console.error(`No conference named "${CONFERENCE_TITLE}". Run npm run seed first.`);
    process.exit(1);
  }

  const { rows: before } = await pool.query(
    `SELECT COUNT(*)::int AS booked FROM registrations
      WHERE conference_id = $1 AND status = 'confirmed'`,
    [conference.id]
  );

  const seatsAvailable = conference.capacity - before[0].booked;
  console.log(`Conference : ${conference.title}`);
  console.log(`Capacity   : ${conference.capacity}`);
  console.log(`Booked     : ${before[0].booked}`);
  console.log(`Seats free : ${seatsAvailable}\n`);

  if (seatsAvailable < 1) {
    console.error('No seats free. Clear registrations and try again.');
    process.exit(1);
  }

  console.log(`Creating ${ATTEMPTS} test attendees...`);
  const { tokens, stamp } = await createAttendees(ATTEMPTS);

  console.log('Firing all requests at once...\n');
  const started = Date.now();

  // Promise.all launches every request before any of them resolves.
  // This is what makes them genuinely concurrent.
  const results = await Promise.all(
    tokens.map((token) => post('/api/registrations', { conferenceId: conference.id }, token))
  );

  const elapsed = Date.now() - started;

  const succeeded = results.filter((r) => r.status === 201);
  const rejected = results.filter((r) => r.status !== 201);

  const { rows: after } = await pool.query(
    `SELECT COUNT(*)::int AS booked FROM registrations
      WHERE conference_id = $1 AND status = 'confirmed'`,
    [conference.id]
  );

  console.log(`Elapsed        : ${elapsed}ms`);
  console.log(`Succeeded      : ${succeeded.length}`);
  console.log(`Rejected       : ${rejected.length}`);
  console.log(`Confirmed rows : ${after[0].booked} (capacity ${conference.capacity})\n`);

  const reasons = rejected.reduce((acc, r) => {
    const key = r.body.message || `HTTP ${r.status}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log('Rejection reasons:');
  Object.entries(reasons).forEach(([reason, count]) => {
    console.log(`  ${count} x ${reason}`);
  });

  const passed =
    succeeded.length === seatsAvailable && after[0].booked <= conference.capacity;

  console.log(
    `\n${passed ? 'PASS' : 'FAIL'} — expected ${seatsAvailable} success(es), got ${
      succeeded.length
    }. Confirmed count ${after[0].booked} vs capacity ${conference.capacity}.\n`
  );

  console.log('Cleaning up test data...');
  await cleanUp(stamp);
  await pool.end();

  process.exit(passed ? 0 : 1);
};

run().catch(async (error) => {
  console.error('Test failed to run:', error.message);
  await pool.end();
  process.exit(1);
});
