# Conference Booking Platform

Author: Avinandan Powdyel
Unit: IFN636 Software Life Cycle Management, Queensland University of Technology

A conference booking platform with two roles. Attendees browse conferences and
book a place; organizers create and manage the conferences. The system enforces
two business rules at the moment a booking is made:

- **BR-01 Capacity** — confirmed bookings never exceed a conference's capacity.
- **BR-02 No overlap** — an attendee cannot hold two confirmed bookings whose
  times overlap. The condition uses strict inequalities:
  `A.starts_at < B.ends_at AND A.ends_at > B.starts_at`, so a conference ending
  at 13:00 and one starting at 13:00 do not clash.

---

## Deployment URL

```
http://3.25.80.186:5001
```

The instance's public IPv4 address changes if the instance is stopped and
started. If the URL above does not respond, the current address is on the EC2
instance summary page.

Demo accounts are not seeded. Sign up through the application, choosing the
attendee or organizer role at signup.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Create React App), Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JSON Web Tokens, bcryptjs |
| Hosting | AWS EC2, Ubuntu, single instance |

---

## Local setup

### Prerequisites

- Node.js 18 or later
- PostgreSQL 14 or later
- Git

### 1. Clone and install

```bash
git clone https://github.com/withAvin/conference-booking-platform.git
cd conference-booking-platform
cd backend && npm install
cd ../frontend && npm install
```

### 2. Create the database

```bash
psql -U postgres -c "CREATE DATABASE cbp;"
```

### 3. Configure the backend

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=<your postgres password>
PGDATABASE=cbp
JWT_SECRET=<generate one, see below>
PORT=5001
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`.env` is gitignored and is never committed.

### 4. Create the schema and seed data

```bash
cd backend
npm run seed
```

This drops and recreates the three tables and inserts three demo conferences,
chosen so that every rule can be demonstrated without creating data by hand:

| Conference | Times | Capacity | Demonstrates |
|---|---|---|---|
| Crypto Conference | 09:00 – 13:00 | 30 | — |
| Leadership Workshop | 13:00 – 17:00 | 30 | Abuts Crypto Conference, so both are bookable (SC-03) |
| Security Briefing | 09:00 – 11:00 | 1 | Overlaps Crypto Conference (BR-02); capacity 1 for the concurrency test |

### 5. Run

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm start
```

The frontend runs on `http://localhost:3000` and calls the backend on port 5001.

---

## Architecture summary

The application is a three-layer system: a React frontend, an Express API, and a
PostgreSQL database. In production both the built frontend and the API are served
by the same Express process on one port, so the deployed application sits behind
a single public URL.

### Data model

Three tables. `users` holds accounts with a role of `attendee` or `organizer`.
`conferences` holds the title, start and end timestamps, and capacity.
`registrations` is the join table between them, carrying a status of `confirmed`
or `cancelled`.

Times are stored as two timestamps rather than a date plus two times, because
BR-02 compares instants and splitting the date out would make the overlap
expression harder to write correctly.

### How the business rules are enforced

Booking runs inside a single database transaction. Two rows are locked, always
in the same order:

1. The **user row**, which serialises one attendee's own simultaneous requests so
   they cannot both pass the BR-02 clash check.
2. The **conference row**, which serialises everyone booking that conference so
   two requests cannot both pass the BR-01 capacity check for the same last seat.

A consistent lock order across every code path is what prevents deadlock when two
requests contend for the same pair.

With the conference row locked, the confirmed count is read and compared against
capacity, then the attendee's other confirmed bookings are checked for overlap.
Only if both pass does the insert happen. If either fails the transaction rolls
back and nothing is written.

Changing a booking uses the same checks, with the booking being moved excluded
from its own clash check — a conference does not clash with the row that is
moving onto it.

Two database-level backstops support the application logic:

- A **partial unique index** on `(attendee_id, conference_id) WHERE status =
  'confirmed'` stops a double submit creating two bookings for one conference.
  The overlap check cannot catch this, because under strict inequalities a
  conference does not overlap itself.
- **`ON DELETE RESTRICT`** on `registrations.conference_id` refuses deletion of a
  conference that has registrations, even if the application check is bypassed.

Cancellation is a soft delete: the row is marked `cancelled` rather than removed.
Only confirmed rows count towards either rule, so the seat frees immediately
while the booking history survives.

### Roles

Role separation is enforced on the server by `organizerOnly` and `attendeeOnly`
middleware, which return 403 rather than 401 — the user is authenticated, just
not permitted. The client-side route guards are a convenience; the server checks
are the enforcement.

---

## Testing

`backend/test/concurrency.js` evidences BR-01 under load. It fires 20 booking
requests simultaneously at a conference with one seat, using 20 separate attendee
accounts so that the partial unique index is not what rejects them.

```bash
cd backend
npm run test:concurrency
```

Expected result: 1 success, 19 refusals, and a confirmed count equal to capacity.
Committed output is in `docs/evidence/`.

Manual testing cannot produce this result. The transaction completes in under
100 milliseconds, so two people clicking Book are never genuinely simultaneous
and the race never occurs.

---

## Known limitations

- **Role is chosen at signup.** Anyone can create an organizer account. Accepted
  for assessment convenience; in production, organizer accounts would be issued
  by an administrator. Recorded in the backlog as CBP-78.
- **No waitlist.** When a conference is full, attendees have no way to be offered
  a place if someone cancels. Recorded in the backlog as CBP-77.
- **Signup validation is minimal.** Only username uniqueness is checked. There
  are no password strength rules and no email verification, as authentication is
  not an assessed feature of this project.
- **No unit tests.** The concurrency script is an integration test against the
  real database, which is where the row lock actually exists. Unit tests with a
  mocked database would exercise the code path but not the locking, which is the
  part that can fail.
- **TC-02 is verified manually.** The 13:00 boundary case was tested by hand
  rather than by a committed script.
- **Single instance, single database.** No load balancing, no replication, no
  automated backup.
- **Dev dependencies carry known advisories** inherited from the project
  scaffold. Production dependencies are current.

---

## Deployment procedure

CI/CD is out of scope for this project. Deployment is manual and documented here.

### Instance

Ubuntu on AWS EC2, t3.medium, in ap-southeast-2, in a public subnet.

### Steps

```bash
# 1. Install dependencies on the instance
sudo apt update && sudo apt upgrade -y
sudo apt install git nodejs npm postgresql postgresql-contrib -y

# 2. Create the database and set a password
sudo -u postgres psql
CREATE DATABASE cbp;
ALTER USER postgres WITH PASSWORD '<password>';
\q

# 3. Clone the repository
cd ~
git clone https://github.com/withAvin/conference-booking-platform.git
cd conference-booking-platform

# 4. Configure the backend
cd backend
cp .env.example .env
nano .env          # fill in PGPASSWORD and JWT_SECRET
npm install
npm run seed

# 5. Build the frontend
cd ../frontend
echo "REACT_APP_API_URL=" > .env
npm install
npm run build

# 6. Start the server
cd ../backend
npm run dev
```

Express serves the built frontend from `frontend/build`, so a single process on
port 5001 handles both the application and its API.

### Security configuration

- **No secrets are committed.** `.env` is gitignored on both the backend and the
  frontend. `.env.example` contains placeholders only.
- **Passwords are hashed** with bcryptjs before storage.
- **Inbound access is scoped by port.** SSH (22) and RDP (3389) are restricted to
  the developer's IP address. The application port (5001) is open more broadly,
  because the application must be reachable by an assessor.
- **The database is not exposed.** PostgreSQL listens on localhost only; no
  inbound rule opens port 5432.
- **The instance uses an IAM instance profile** rather than embedded credentials.

---

## Repository

| Item | Location |
|---|---|
| Decision log | `docs/decision-log.md` |
| Iteration plan and sprint reviews | `docs/iteration-plan.md` |
| Test evidence | `docs/evidence/` |
| Concurrency test | `backend/test/concurrency.js` |
| Database schema | `backend/db/schema.sql` |
| Seed script | `backend/db/seed.js` |

Jira project key: **CBP**. Branches and commits are prefixed with the issue key
they deliver.

---

## Attribution

Project structure and the authentication scaffold were adapted from the Task
Manager tutorial by rajuiit
(https://github.com/rajuiit/taskmanager_aws_setup). The data layer was
subsequently migrated from MongoDB to PostgreSQL; the reasoning is recorded as
D-01 in the decision log.
