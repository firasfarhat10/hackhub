const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      maxlength: 2000
    },
    location: { type: String, trim: true, default: 'Ecole Polytechnique de Sousse' },
    startDate: { type: Date, required: [true, 'La date de debut est obligatoire'] },
    endDate: {
      type: Date,
      required: [true, 'La date de fin est obligatoire'],
      validate: {
        // this = le document en cours de validation (create / save)
        validator: function (value) {
          return !this.startDate || value > this.startDate;
        },
        message: 'La date de fin doit etre apres la date de debut'
      }
    },
    capacity: {
      type: Number,
      required: true,
      min: [2, 'Capacite minimale : 2'],
      max: [500, 'Capacite maximale : 500']
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft'
    },
    // Relation N:N : tableau de références vers User
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Synthèse IA des avis, générée à la demande puis mise en cache
    aiSummary: {
      text: String,
      reviewCount: Number,
      generatedAt: Date
    }
  },
  { timestamps: true }
);

// Index pour la liste publique : filtre par statut, tri par date
eventSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model('Event', eventSchema);