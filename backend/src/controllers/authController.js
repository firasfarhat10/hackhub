const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const HttpError = require('../utils/httpError');
const env = require('../config/env');

const MIN_PASSWORD = 8;

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

// Ce que le front reçoit : jamais le mot de passe
const publicUser = (user) => ({ _id: user._id, name: user.name, email: user.email, role: user.role });

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new HttpError(400, 'Nom, email et mot de passe requis');
  }
  // Vérifié AVANT le hachage (après, le hash fait toujours 60 caractères)
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw new HttpError(400, `Le mot de passe doit comporter au moins ${MIN_PASSWORD} caracteres`);
  }

  const exists = await User.exists({ email: String(email).toLowerCase().trim() });
  if (exists) throw new HttpError(409, 'Cet email est deja utilise');

  const hashed = await bcrypt.hash(password, 10); // 10 = facteur de coût (2^10 tours)
  // Le rôle n'est jamais lu depuis req.body : impossible de s'inscrire en admin
  const user = await User.create({ name, email, password: hashed, role: 'member' });
  await Profile.create({ user: user._id }); // relation 1:1 créée avec le compte

  res.status(201).json({ user: publicUser(user), token: generateToken(user) });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Email et mot de passe requis');

  // password est en select: false : on le demande explicitement avec +password
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

  // Même message dans les deux cas : on ne révèle pas si l'email existe
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Identifiants invalides');
  }

  res.json({ user: publicUser(user), token: generateToken(user) });
};

// GET /api/auth/me : permet au front de restaurer la session après un rechargement
const me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

module.exports = { register, login, me };