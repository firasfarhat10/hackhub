const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    // Relation 1:1 : un profil appartient à un seul utilisateur (unique)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'La bio ne peut pas depasser 300 caracteres'],
      default: ''
    },
    skills: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      validate: {
        validator: (arr) => arr.length <= 15,
        message: '15 competences maximum'
      },
      default: []
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    githubUrl: {
      type: String,
      trim: true,
      match: [/^$|^https:\/\/github\.com\/[\w-]+\/?$/, 'URL GitHub invalide (https://github.com/pseudo)'],
      default: ''
    },
    // --- Données IA (jamais envoyées au front-end) ---
    embedding: { type: [Number], select: false, default: undefined },
    embeddingHash: { type: String, select: false } // empreinte (modèle + texte) du dernier calcul
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);