const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema(
  {
    // Relation 1:N : chaque atelier appartient à un événement
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, "L'evenement est obligatoire"],
      index: true
    },
    title: { type: String, required: [true, 'Le titre est obligatoire'], trim: true, maxlength: 100 },
    description: { type: String, required: [true, 'La description est obligatoire'], maxlength: 1000 },
    startsAt: { type: Date, required: [true, "L'horaire est obligatoire"] },
    capacity: { type: Number, required: true, min: 1, max: 200 },
    tags: [{ type: String, trim: true, lowercase: true }],
    // Relation N:N : membres inscrits à l'atelier
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    embedding: { type: [Number], select: false, default: undefined },
    embeddingHash: { type: String, select: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workshop', workshopSchema);