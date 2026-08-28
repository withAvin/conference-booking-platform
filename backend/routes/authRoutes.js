// routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser); // CBP-6
router.post('/login', loginUser); // CBP-7
router.get('/me', protect, getMe);

module.exports = router;
