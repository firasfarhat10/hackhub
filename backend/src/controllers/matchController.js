const Event = require('../models/Event');
const Profile = require('../models/Profile');
const Workshop = require('../models/Workshop');
const HttpError = require('../utils/httpError');
const { profileToText, refreshEmbedding } = require('../services/ai/embeddings');
const { rankTeammates, rankWorkshops } = require('../services/ai/matching');
const { isAiEnabled } = require('../services/ai/geminiClient');

// GET /api/events/:eventId/matches : coéquipiers suggérés + ateliers recommandés
const getMatches = async (req, res) => {
  const event = await Event.findById(req.params.eventId).select('participants title');
  if (!event) throw new HttpError(404, 'Evenement introuvable');
  if (!event.participants.some((p) => p.equals(req.user._id))) {
    throw new HttpError(403, 'Inscrivez-vous a cet evenement pour voir vos suggestions');
  }

  // Mon profil, avec son vecteur (calculé maintenant s'il manque)
  const me = await Profile.findOne({ user: req.user._id }).select('+embedding +embeddingHash');
  if (!me || me.skills.length === 0) {
    throw new HttpError(400, 'Ajoutez des competences a votre profil pour obtenir des suggestions');
  }
  if (await refreshEmbedding(me, profileToText(me))) await me.save();

  // Profils des autres participants (populate pour avoir le nom) + ateliers de l'événement
  const [others, workshops] = await Promise.all([
    Profile.find({ user: { $in: event.participants, $ne: req.user._id } })
      .select('+embedding')
      .populate('user', 'name')
      .lean(),
    Workshop.find({ event: event._id }).select('+embedding').lean()
  ]);

  res.json({
    event: { _id: event._id, title: event.title },
    aiEnabled: isAiEnabled(),
    // On écarte les comptes supprimés et les profils sans compétences
    teammates: rankTeammates(me, others.filter((o) => o.user && o.skills.length > 0)),
    workshops: rankWorkshops(me, workshops)
  });
};

module.exports = { getMatches };