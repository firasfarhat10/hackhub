const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      maxlength: [60, 'Le nom ne peut pas depasser 60 caracteres']
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format d'email invalide"]
    },
    // Hash bcrypt (60 caractères). select: false -> jamais renvoyé sauf demande explicite
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      select: false
    },
    role: {
      type: String,
      enum: { values: ['member', 'admin'], message: "{VALUE} n'est pas un role autorise" },
      default: 'member'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);