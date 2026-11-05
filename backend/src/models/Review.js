const mongoose = require('mongoose');

// Liste fermée des thèmes que l'IA a le droit de détecter
const THEMES = [
  'organisation', 'mentors', 'ateliers', 'ambiance', 'logistique',
  'repas', 'sujet', 'jury', 'horaires', 'communication'
];

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    rating: {
      type: Number,
      required: [true, 'La note est obligatoire'],
      min: [1, 'Note minimale : 1'],
      max: [5, 'Note maximale : 5'],
      validate: { validator: Number.isInteger, message: 'La note doit etre un entier' }
    },
    comment: {
      type: String,
      required: [true, 'Le commentaire est obligatoire'],
      trim: true,
      minlength: [10, 'Commentaire trop court (10 caracteres minimum)'],
      maxlength: [1000, 'Commentaire trop long (1000 caracteres maximum)']
    },
    // Résultat de l'analyse IA (rempli en arrière-plan)
    analysis: {
      status: { type: String, enum: ['pending', 'done', 'failed', 'skipped'], default: 'pending' },
      sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
      score: { type: Number, min: -1, max: 1 },
      themes: [{ type: String, enum: THEMES }],
      toxic: Boolean,
      analyzedAt: Date
    }
  },
  { timestamps: true }
);

// Un seul avis par membre et par événement, garanti par la base de données
reviewSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
module.exports.THEMES = THEMES;