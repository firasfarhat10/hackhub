const express = require('express');
const { getStats, listUsers, updateRole } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/auth');

const router = express.Router();

router.use(protect, adminOnly); // tout ce routeur est réservé aux admins
router.get('/stats', getStats);
router.get('/users', listUsers);
router.put('/users/:id/role', updateRole);

module.exports = router;