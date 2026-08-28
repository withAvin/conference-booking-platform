// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres client error:', err.message);
});

// Simple query helper for everything that is not a transaction.
const query = (text, params) => pool.query(text, params);

// Runs a callback inside a transaction on a single dedicated client.
// The booking logic in FR-02 depends on this: the check and the insert
// must happen on the same client, inside the same transaction, or the
// row lock does nothing.
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const connectDB = async () => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected at', rows[0].now);
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, query, withTransaction, connectDB };
