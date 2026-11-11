const { rateLimit } = require('express-rate-limit');

// Connexion / inscription : 20 ECHECS par IP toutes les 15 minutes (anti force brute).
// Les requêtes réussies ne comptent pas : toute une salle derrière la même IP peut se connecter.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de tentatives, reessayez dans quelques minutes' }
});

// Routes qui appellent l'IA : 20 requêtes par minute et par utilisateur (protège le quota Gemini)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id, // placé après protect, donc req.user existe
  message: { message: "Trop de requetes vers l'IA, patientez une minute" }
});

module.exports = { authLimiter, aiLimiter };