const mongoose = require('mongoose');
const Review = require('../models/Review');
const Event = require('../models/Event');
const HttpError = require('../utils/httpError');
const { isAiEnabled } = require('../services/ai/geminiClient');
const { analyzeReviewInBackground, summarizeComments } = require('../services/ai/reviewAnalysis');

// GET /api/events/:eventId/reviews (public) : avis avec le nom de l'auteur
const listByEvent = async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const reviews = await Review.find({ event: req.params.eventId })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    // L'analyse IA n'est visible que par l'admin
    .select(isAdmin ? '' : '-analysis')
    .lean();
  res.json(reviews);
};

// POST /api/events/:eventId/reviews : seul un participant, après le début de l'événement
const createReview = async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) throw new HttpError(404, 'Evenement introuvable');
  if (!event.participants.some((p) => p.equals(req.user._id))) {
    throw new HttpError(403, 'Seuls les participants peuvent laisser un avis');
  }
  if (event.startDate > new Date()) {
    throw new HttpError(400, "L'evenement n'a pas encore commence");
  }

  // Doublon (user, event) -> erreur 11000 de l'index unique -> 409 via errorHandler
  const review = await Review.create({
    user: req.user._id,
    event: event._id,
    rating: req.body.rating,
    comment: req.body.comment
  });

  // Pas de await : on répond tout de suite, l'IA travaille en arrière-plan
  analyzeReviewInBackground(review._id);

  res.status(201).json(review);
};

// PUT /api/reviews/:id : l'auteur modifie son avis (nouvelle analyse)
const updateReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new HttpError(404, 'Avis introuvable');
  if (!review.user.equals(req.user._id)) throw new HttpError(403, 'Vous ne pouvez modifier que vos avis');

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  review.analysis = { status: 'pending' };
  await review.save();

  analyzeReviewInBackground(review._id);
  res.json(review);
};

// DELETE /api/reviews/:id : l'auteur ou un admin
const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new HttpError(404, 'Avis introuvable');
  if (!review.user.equals(req.user._id) && req.user.role !== 'admin') {
    throw new HttpError(403, 'Action interdite');
  }
  await review.deleteOne();
  res.json({ message: 'Avis supprime', id: review._id });
};

// GET /api/events/:eventId/reviews/insights?refresh=true (admin)
const getInsights = async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) throw new HttpError(404, 'Evenement introuvable');
  const eventId = new mongoose.Types.ObjectId(req.params.eventId);

  // Pipelines d'agrégation : les calculs sont faits par MongoDB, pas en JavaScript
  const [[global], sentiments, themes] = await Promise.all([
    Review.aggregate([
      { $match: { event: eventId } },
      { $group: { _id: null, count: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]),
    Review.aggregate([
      { $match: { event: eventId, 'analysis.status': 'done' } },
      { $group: { _id: '$analysis.sentiment', count: { $sum: 1 } } }
    ]),
    Review.aggregate([
      { $match: { event: eventId, 'analysis.status': 'done' } },
      { $unwind: '$analysis.themes' },
      { $group: { _id: '$analysis.themes', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ]);

  const count = global?.count || 0;

  // Résumé IA : regénéré seulement si demandé (?refresh=true) et si de nouveaux avis sont arrivés
  let summary = event.aiSummary?.text ? event.aiSummary : null;
  const isStale = !summary || summary.reviewCount !== count;
  if (req.query.refresh === 'true' && isStale && count > 0 && isAiEnabled()) {
    const latest = await Review.find({ event: eventId }).sort({ createdAt: -1 }).limit(50).select('comment').lean();
    try {
      const text = await summarizeComments(event.title, latest.map((r) => r.comment));
      event.aiSummary = { text: text.trim(), reviewCount: count, generatedAt: new Date() };
      await event.save();
      summary = event.aiSummary;
    } catch (err) {
      console.warn(`[IA] Resume impossible : ${err.message}`);
    }
  }

  res.json({
    event: { _id: event._id, title: event.title },
    count,
    avgRating: count ? Math.round(global.avgRating * 10) / 10 : null,
    sentiments: Object.fromEntries(sentiments.map((s) => [s._id, s.count])),
    topThemes: themes.map((t) => ({ theme: t._id, count: t.count })),
    summary,
    summaryIsStale: Boolean(summary) && summary.reviewCount !== count,
    aiEnabled: isAiEnabled()
  });
};

module.exports = { listByEvent, createReview, updateReview, deleteReview, getInsights };