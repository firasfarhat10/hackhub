const env = require('../config/env');

// Route inconnue -> 404
const notFound = (req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
};

// Middleware d'erreurs : 4 paramètres, c'est à cela qu'Express le reconnaît.
// Express 5 y envoie automatiquement les erreurs des contrôleurs async (promesse rejetée).
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Erreur métier lancée volontairement (HttpError)
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  // Données refusées par un schéma Mongoose
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Donnees invalides', details });
  }
  // Identifiant mal formé (ex : /api/events/abc)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Identifiant invalide' });
  }
  // Doublon sur un index unique
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ');
    return res.status(409).json({ message: `Valeur deja utilisee (${field})` });
  }
  // JSON du body mal écrit
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON invalide dans le corps de la requete' });
  }

  console.error(err);
  res.status(500).json({
    message: 'Erreur interne du serveur',
    // Le détail technique n'est montré qu'en développement
    ...(env.isProduction ? {} : { error: err.message })
  });
};

module.exports = { notFound, errorHandler };