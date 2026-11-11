const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, me);

module.exports = router;