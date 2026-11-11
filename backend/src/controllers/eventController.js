const Event = require('../models/Event');
const Workshop = require('../models/Workshop');
const Review = require('../models/Review');
const HttpError = require('../utils/httpError');

// Champs modifiables par l'admin (liste blanche)
const EDITABLE = ['title', 'description', 'location', 'startDate', 'endDate', 'capacity', 'status'];
const pick = (body) => Object.fromEntries(EDITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

// Ajoute des champs calculés utiles au front
const withStats = (event, userId) => ({
  ...event,
  participantsCount: event.participants.length,
  isRegistered: Boolean(userId) && event.participants.some((p) => String(p._id ?? p) === String(userId)),
  isFull: event.participants.length >= event.capacity
});

// GET /api/events?status=published&upcoming=true&page=1&limit=10
const listEvents = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const isAdmin = req.user?.role === 'admin';

  const filter = {};
  // Un visiteur ou un membre ne voit jamais les brouillons
  if (isAdmin && req.query.status) filter.status = req.query.status;
  else if (!isAdmin) filter.status = { $in: ['published', 'closed'] };
  if (req.query.upcoming === 'true') filter.endDate = { $gte: new Date() };

  // Les deux requêtes sont indépendantes : on les lance en parallèle
  const [events, total] = await Promise.all([
    Event.find(filter).sort({ startDate: 1 }).skip((page - 1) * limit).limit(limit).select('-aiSummary').lean(),
    Event.countDocuments(filter)
  ]);

  res.json({
    data: events.map((e) => withStats(e, req.user?._id)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
};

// GET /api/events/mine (membre connecté)
const myEvents = async (req, res) => {
  const events = await Event.find({ participants: req.user._id }).sort({ startDate: 1 }).select('-aiSummary').lean();
  res.json(events.map((e) => withStats(e, req.user._id)));
};

// GET /api/events/:id
const getEvent = async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('participants', 'name') // N:N -> on ne révèle que le nom des participants
    .select('-aiSummary')
    .lean();

  const isAdmin = req.user?.role === 'admin';
  if (!event || (event.status === 'draft' && !isAdmin)) throw new HttpError(404, 'Evenement introuvable');

  res.json(withStats(event, req.user?._id));
};

// POST /api/events (admin)
const createEvent = async (req, res) => {
  const event = await Event.create(pick(req.body));
  res.status(201).json(event);
};

// PUT /api/events/:id (admin)
const updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new HttpError(404, 'Evenement introuvable');

  const changes = pick(req.body);
  if (changes.capacity !== undefined && changes.capacity < event.participants.length) {
    throw new HttpError(400, `Capacite inferieure au nombre d'inscrits (${event.participants.length})`);
  }
  Object.assign(event, changes);
  await event.save(); // save() lance les validateurs (dont endDate > startDate)
  res.json(event);
};

// DELETE /api/events/:id (admin) : supprime aussi les ateliers et avis liés
const deleteEvent = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) throw new HttpError(404, 'Evenement introuvable');
  await Promise.all([Workshop.deleteMany({ event: event._id }), Review.deleteMany({ event: event._id })]);
  res.json({ message: 'Evenement supprime', id: event._id });
};

// POST /api/events/:id/register : inscription (relation N:N)
const registerToEvent = async (req, res) => {
  const userId = req.user._id;

  // Opération ATOMIQUE : toutes les conditions sont vérifiées par MongoDB au moment de l'écriture.
  // Deux inscriptions simultanées ne peuvent pas dépasser la capacité.
  const event = await Event.findOneAndUpdate(
    {
      _id: req.params.id,
      status: 'published',
      endDate: { $gt: new Date() },
      participants: { $ne: userId },
      $expr: { $lt: [{ $size: '$participants' }, '$capacity'] }
    },
    { $addToSet: { participants: userId } },
    { returnDocument: 'after' }
  );

  if (!event) {
    // L'écriture a échoué : on cherche pourquoi pour renvoyer le bon code
    const current = await Event.findById(req.params.id);
    if (!current || current.status === 'draft') throw new HttpError(404, 'Evenement introuvable');
    if (current.participants.some((p) => p.equals(userId))) throw new HttpError(409, 'Vous etes deja inscrit');
    if (current.status !== 'published' || current.endDate <= new Date()) {
      throw new HttpError(400, 'Les inscriptions sont fermees pour cet evenement');
    }
    throw new HttpError(409, 'Evenement complet');
  }

  res.status(201).json({ message: 'Inscription confirmee', participantsCount: event.participants.length });
};

// DELETE /api/events/:id/register : désinscription
const unregisterFromEvent = async (req, res) => {
  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, participants: req.user._id },
    { $pull: { participants: req.user._id } },
    { returnDocument: 'after' }
  );
  if (!event) throw new HttpError(404, "Vous n'etes pas inscrit a cet evenement");

  // Cohérence : on libère aussi ses places dans les ateliers de cet événement
  await Workshop.updateMany({ event: event._id }, { $pull: { attendees: req.user._id } });
  res.json({ message: 'Desinscription effectuee', participantsCount: event.participants.length });
};

module.exports = {
  listEvents, myEvents, getEvent, createEvent, updateEvent, deleteEvent, registerToEvent, unregisterFromEvent
};