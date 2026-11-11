const express = require('express');
const { updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;