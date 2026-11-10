// Fonctions mathématiques du matching. Aucune dépendance : tout est codé à la main.

// Similarité cosinus entre deux vecteurs de même longueur : (A·B) / (|A| x |B|)
// Résultat entre -1 et 1 ; 1 = même direction (même "sens"), 0 = sans rapport.
function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Compétences normalisées : minuscules, sans espaces autour, sans doublons
function normalizeSkills(skills = []) {
  return [...new Set(skills.map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

// Indice de Jaccard : |A ∩ B| / |A ∪ B| (0 = rien en commun, 1 = identiques)
// Sert de solution de secours quand les vecteurs IA ne sont pas disponibles.
function jaccard(a = [], b = []) {
  const setA = new Set(normalizeSkills(a));
  const setB = new Set(normalizeSkills(b));
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

// Complémentarité : part des compétences de "other" que "me" ne possède pas.
// 1 = tout ce qu'il sait faire me manque, 0 = il ne m'apporte rien de nouveau.
function complementarity(mySkills = [], otherSkills = []) {
  const mine = new Set(normalizeSkills(mySkills));
  const theirs = normalizeSkills(otherSkills);
  if (theirs.length === 0) return 0;
  const brings = theirs.filter((s) => !mine.has(s));
  return brings.length / theirs.length;
}

module.exports = { cosineSimilarity, normalizeSkills, jaccard, complementarity };