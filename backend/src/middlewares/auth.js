const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

// Vérifie le JWT "Authorization: Bearer <token>" et place l'utilisateur dans req.user
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorise, aucun token fourni' });
  }

  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], env.jwtSecret);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Votre session a expire, veuillez vous reconnecter'
      : 'Non autorise, token invalide';
    return res.status(401).json({ message });
  }

  // On relit l'utilisateur en base : un compte supprimé ou un rôle modifié est pris en compte tout de suite
  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ message: 'Non autorise, utilisateur introuvable' });
  }

  req.user = user;
  next();
};

// À placer après protect : réservé aux administrateurs
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acces refuse : droits administrateur requis' });
  }
  next();
};

// Pour les routes publiques qui affichent plus d'infos à un utilisateur connecté
// (ex : "déjà inscrit"). Si le jeton est absent ou invalide, on continue en visiteur.
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], env.jwtSecret);
      req.user = await User.findById(decoded.id);
    } catch {
      // jeton invalide : on reste en visiteur
    }
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };