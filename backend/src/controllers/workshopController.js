const Workshop = require('../models/Workshop');
const Event = require('../models/Event');
const HttpError = require('../utils/httpError');
const { workshopToText, refreshEmbedding } = require('../services/ai/embeddings');

const EDITABLE = ['title', 'description', 'startsAt', 'capacity', 'tags'];
const pick = (body) => Object.fromEntries(EDITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

const toPublic = (w, userId) => {
  const { embedding, embeddingHash, ...data } = w.toObject ? w.toObject() : w;
  return {
    ...data,
    attendeesCount: data.attendees.length,
    isAttending: Boolean(userId) && data.attendees.some((a) => String(a) === String(userId))
  };
};

// GET /api/events/:eventId/workshops
const listByEvent = async (req, res) => {
  const workshops = await Workshop.find({ event: req.params.eventId }).sort({ startsAt: 1 }).lean();
  res.json(workshops.map((w) => toPublic(w, req.user?._id)));
};

// POST /api/events/:eventId/workshops (admin)
const createWorkshop = async (req, res) => {
  const event = await Event.exists({ _id: req.params.eventId });
  if (!event) throw new HttpError(404, 'Evenement introuvable');

  const workshop = new Workshop({ ...pick(req.body), event: req.params.eventId });
  await workshop.validate();
  await refreshEmbedding(workshop, workshopToText(workshop));
  await workshop.save();
  res.status(201).json(toPublic(workshop));
};

// PUT /api/workshops/:id (admin)
const updateWorkshop = async (req, res) => {
  const workshop = await Workshop.findById(req.params.id).select('+embedding +embeddingHash');
  if (!workshop) throw new HttpError(404, 'Atelier introuvable');

  Object.assign(workshop, pick(req.body));
  if (workshop.capacity < workshop.attendees.length) {
    throw new HttpError(400, `Capacite inferieure au nombre d'inscrits (${workshop.attendees.length})`);
  }
  await workshop.validate();
  await refreshEmbedding(workshop, workshopToText(workshop));
  await workshop.save();
  res.json(toPublic(workshop));
};

// DELETE /api/workshops/:id (admin)
const deleteWorkshop = async (req, res) => {
  const workshop = await Workshop.findByIdAndDelete(req.params.id);
  if (!workshop) throw new HttpError(404, 'Atelier introuvable');
  res.json({ message: 'Atelier supprime', id: workshop._id });
};

// POST /api/workshops/:id/attend : réserver une place (il faut être inscrit à l'événement)
const attendWorkshop = async (req, res) => {
  const userId = req.user._id;
  const workshop = await Workshop.findById(req.params.id);
  if (!workshop) throw new HttpError(404, 'Atelier introuvable');

  const isParticipant = await Event.exists({ _id: workshop.event, participants: userId });
  if (!isParticipant) throw new HttpError(403, "Inscrivez-vous d'abord a l'evenement");

  // Même principe atomique que l'inscription à un événement
  const updated = await Workshop.findOneAndUpdate(
    {
      _id: workshop._id,
      attendees: { $ne: userId },
      $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }
    },
    { $addToSet: { attendees: userId } },
    { returnDocument: 'after' }
  );
  if (!updated) {
    const already = workshop.attendees.some((a) => a.equals(userId));
    throw new HttpError(409, already ? 'Vous etes deja inscrit a cet atelier' : 'Atelier complet');
  }
  res.status(201).json({ message: 'Place reservee', attendeesCount: updated.attendees.length });
};

// DELETE /api/workshops/:id/attend
const leaveWorkshop = async (req, res) => {
  const updated = await Workshop.findOneAndUpdate(
    { _id: req.params.id, attendees: req.user._id },
    { $pull: { attendees: req.user._id } },
    { returnDocument: 'after' }
  );
  if (!updated) throw new HttpError(404, "Vous n'etes pas inscrit a cet atelier");
  res.json({ message: 'Place liberee', attendeesCount: updated.attendees.length });
};

module.exports = { listByEvent, createWorkshop, updateWorkshop, deleteWorkshop, attendWorkshop, leaveWorkshop };