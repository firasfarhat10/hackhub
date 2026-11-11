const express = require('express');
const ev = require('../controllers/eventController');
const ws = require('../controllers/workshopController');
const { protect, adminOnly, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

// Chemins fixes AVANT '/:id' (sinon "mine" serait pris pour un identifiant)
router.get('/mine', protect, ev.myEvents);

router.get('/', optionalAuth, ev.listEvents);
router.post('/', protect, adminOnly, ev.createEvent);
router.get('/:id', optionalAuth, ev.getEvent);
router.put('/:id', protect, adminOnly, ev.updateEvent);
router.delete('/:id', protect, adminOnly, ev.deleteEvent);

// Inscription N:N
router.post('/:id/register', protect, ev.registerToEvent);
router.delete('/:id/register', protect, ev.unregisterFromEvent);

// Ateliers d'un événement (ressource imbriquée)
router.get('/:eventId/workshops', optionalAuth, ws.listByEvent);
router.post('/:eventId/workshops', protect, adminOnly, ws.createWorkshop);

module.exports = router;