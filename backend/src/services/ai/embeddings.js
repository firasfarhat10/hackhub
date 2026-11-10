const crypto = require('crypto');
const env = require('../../config/env');
const { isAiEnabled, embed } = require('./geminiClient');

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

// Texte envoyé à l'IA : jamais de nom ni d'email, seulement le contenu utile au matching
const profileToText = (p) =>
  `Niveau : ${p.level}. Competences : ${p.skills.join(', ') || 'aucune'}. Bio : ${p.bio || 'aucune'}`;

const workshopToText = (w) =>
  `Atelier : ${w.title}. Themes : ${w.tags.join(', ')}. ${w.description}`;

// Met à jour doc.embedding si le texte (ou le modèle) a changé depuis le dernier calcul.
// Ne lance jamais d'erreur : si l'IA échoue, le document est enregistré sans vecteur
// (le matching utilisera la solution de secours).
async function refreshEmbedding(doc, text) {
  if (!isAiEnabled()) return false;

  // Le nom du modèle fait partie de l'empreinte : changer de modèle force le recalcul
  // (deux modèles produisent des vecteurs incomparables entre eux)
  const hash = sha256(`${env.gemini.embedModel}:${text}`);
  if (doc.embeddingHash === hash && doc.embedding?.length) return false; // déjà à jour

  try {
    doc.embedding = await embed(text);
    doc.embeddingHash = hash;
    return true;
  } catch (err) {
    console.warn(`[IA] Vecteur non calcule : ${err.message}`);
    return false;
  }
}

module.exports = { profileToText, workshopToText, refreshEmbedding, sha256 };