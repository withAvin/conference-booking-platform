-- CBP schema
-- Run with: psql -U postgres -d cbp -f backend/db/schema.sql
-- Or via the seed script: npm run seed

DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS conferences;
DROP TABLE IF EXISTS users;

-- Users -----------------------------------------------------------------
-- Role is chosen at signup. See README known limitations.
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20)  NOT NULL CHECK (role IN ('attendee', 'organizer')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Conferences -----------------------------------------------------------
CREATE TABLE conferences (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  starts_at  TIMESTAMPTZ  NOT NULL,
  ends_at    TIMESTAMPTZ  NOT NULL,
  capacity   INTEGER      NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT ends_after_starts CHECK (ends_at > starts_at)
);

-- Registrations ---------------------------------------------------------
-- Cancelled rows are kept, not deleted. Only 'confirmed' counts
-- towards BR-01 and BR-02.
CREATE TABLE registrations (
  id            SERIAL PRIMARY KEY,
  attendee_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conference_id INTEGER     NOT NULL REFERENCES conferences(id) ON DELETE RESTRICT,
  status        VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                            CHECK (status IN ('confirmed', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- An attendee cannot hold two confirmed bookings for the same conference.
-- Partial index, so cancelled rows do not block re-booking.
CREATE UNIQUE INDEX one_confirmed_booking_per_conference
  ON registrations (attendee_id, conference_id)
  WHERE status = 'confirmed';

-- Supports the BR-01 count and the BR-02 overlap query.
CREATE INDEX idx_registrations_conference
  ON registrations (conference_id) WHERE status = 'confirmed';

CREATE INDEX idx_registrations_attendee
  ON registrations (attendee_id) WHERE status = 'confirmed';

-- ON DELETE RESTRICT on conference_id enforces "a conference with
-- confirmed bookings cannot be deleted" at the database level, as a
-- backstop to the application check in FR-01.
