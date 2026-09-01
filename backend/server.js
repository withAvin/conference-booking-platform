const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
// Conference and registration routes are added in later stories.

app.use('/api/conferences', require('./routes/conferenceRoutes'));

app.use('/api/registrations', require('./routes/registrationRoutes'));

// Health check, useful for confirming the EC2 deployment is up.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the built frontend. One process on one port, so the deployed
// application and its API sit behind a single public URL.
const path = require('path');
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildPath));

// Anything that is not an API route falls through to React Router,
// so a direct visit to /browse or /my-bookings loads the app rather
// than returning 404.
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
