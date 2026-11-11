const express = require('express');
const ws = require('../controllers/workshopController');
const { protect, adminOnly } = require('../middlewares/auth');

const router = express.Router();

router.put('/:id', protect, adminOnly, ws.updateWorkshop);
router.delete('/:id', protect, adminOnly, ws.deleteWorkshop);
router.post('/:id/attend', protect, ws.attendWorkshop);
router.delete('/:id/attend', protect, ws.leaveWorkshop);

module.exports = router;