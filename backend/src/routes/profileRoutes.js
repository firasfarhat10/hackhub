const express = require('express');
const { getMyProfile, updateMyProfile } = require('../controllers/profileController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect); // toutes les routes de ce routeur sont privées
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

module.exports = router;