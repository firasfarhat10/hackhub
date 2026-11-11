const Profile = require('../models/Profile');
const HttpError = require('../utils/httpError');
const { profileToText, refreshEmbedding } = require('../services/ai/embeddings');

// GET /api/profile/me
const getMyProfile = async (req, res) => {
  let profile = await Profile.findOne({ user: req.user._id });
  // Filet de sécurité : profil créé s'il manque (normalement créé à l'inscription)
  if (!profile) profile = await Profile.create({ user: req.user._id });
  res.json(profile);
};

// PUT /api/profile/me
const updateMyProfile = async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id }).select('+embedding +embeddingHash')
    || new Profile({ user: req.user._id });

  // Liste blanche : seuls ces champs sont modifiables (pas user, pas embedding)
  const { bio, skills, level, githubUrl } = req.body;
  if (bio !== undefined) profile.bio = bio;
  if (skills !== undefined) {
    if (!Array.isArray(skills)) throw new HttpError(400, 'skills doit etre un tableau');
    // Normalisation puis suppression des doublons ("Python" et "python" -> "python")
    profile.skills = [...new Set(skills.map((s) => String(s).trim().toLowerCase()).filter(Boolean))];
  }
  if (level !== undefined) profile.level = level;
  if (githubUrl !== undefined) profile.githubUrl = githubUrl;

  await profile.validate(); // erreurs de validation AVANT d'appeler l'IA (pas d'appel inutile)
  await refreshEmbedding(profile, profileToText(profile)); // recalcul seulement si le texte a changé
  await profile.save();

  // On renvoie le profil sans les champs IA
  const { embedding, embeddingHash, ...data } = profile.toObject();
  res.json(data);
};

module.exports = { getMyProfile, updateMyProfile };