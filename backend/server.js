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

// Health check, useful for confirming the EC2 deployment is up.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
