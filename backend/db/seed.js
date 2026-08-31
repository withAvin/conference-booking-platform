// db/seed.js
// Rebuilds the schema and inserts the four demo conferences.
// Run with: npm run seed
//
// The four conferences are chosen so that every business rule can be
// demonstrated without creating extra data by hand:
//
//   Crypto Conference    09:00-13:00  overlaps Security Briefing  -> BR-02
//   Leadership Workshop  13:00-17:00  abuts Crypto Conference     -> SC-03
//   Security Briefing    09:00-11:00  capacity 1                  -> BR-01 / TC-01

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const CONFERENCE_DATE = '2026-10-05';

const conferences = [
  { title: 'Crypto Conference', start: '09:00', end: '13:00', capacity: 30 },
  { title: 'Leadership Workshop', start: '13:00', end: '17:00', capacity: 30 },
  { title: 'Security Briefing', start: '09:00', end: '11:00', capacity: 1 },
];

const seed = async () => {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  try {
    await pool.query(schema);
    console.log('Schema created.');

    for (const c of conferences) {
      await pool.query(
        `INSERT INTO conferences (title, starts_at, ends_at, capacity)
         VALUES ($1, $2, $3, $4)`,
        [
          c.title,
          `${CONFERENCE_DATE} ${c.start}`,
          `${CONFERENCE_DATE} ${c.end}`,
          c.capacity,
        ]
      );
      console.log(`  + ${c.title}  ${c.start}-${c.end}  cap ${c.capacity}`);
    }

    console.log('\nSeed complete. Sign up your own accounts through the app.');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seed();
