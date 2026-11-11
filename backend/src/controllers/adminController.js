const User = require('../models/User');
const Event = require('../models/Event');
const Review = require('../models/Review');
const HttpError = require('../utils/httpError');

// GET /api/admin/stats : chiffres du tableau de bord, calculés en parallèle
const getStats = async (req, res) => {
  const now = new Date();
  const [users, members, events, upcoming, reviews, pendingAnalyses] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'member' }),
    Event.countDocuments(),
    Event.countDocuments({ status: 'published', startDate: { $gte: now } }),
    Review.countDocuments(),
    Review.countDocuments({ 'analysis.status': 'pending' })
  ]);
  res.json({ users, members, events, upcoming, reviews, pendingAnalyses });
};

// GET /api/admin/users
const listUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(users);
};

// PUT /api/admin/users/:id/role
const updateRole = async (req, res) => {
  const { role } = req.body;
  if (!['member', 'admin'].includes(role)) throw new HttpError(400, 'Role invalide (member ou admin)');
  if (req.user._id.equals(req.params.id)) {
    throw new HttpError(400, 'Vous ne pouvez pas modifier votre propre role');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Utilisateur introuvable');
  user.role = role;
  await user.save();
  res.json(user);
};

module.exports = { getStats, listUsers, updateRole };