const express = require('express');
const { loginUser, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public route: Login
router.post('/login', loginUser);

// Private route: Get current user profile
router.get('/me', protect, getMe);

module.exports = router;
