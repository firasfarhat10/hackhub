const env = require('../../config/env');
const { cosineSimilarity, jaccard, complementarity, normalizeSkills } = require('../../utils/similarity');

const round = (x) => Math.round(x * 100) / 100;

// Similarité "de sens" entre deux éléments : vecteurs IA si disponibles, sinon Jaccard sur les compétences
function semanticSimilarity(a, b, skillsA, skillsB) {
  if (a.embedding?.length && b.embedding?.length) {
    return { value: cosineSimilarity(a.embedding, b.embedding), mode: 'ai' };
  }
  return { value: jaccard(skillsA, skillsB), mode: 'fallback' };
}

// Classe les autres participants pour "me" : intérêts proches + compétences complémentaires
function rankTeammates(me, others, limit = 5) {
  const w = env.matchWeightSimilarity;
  const mySkills = normalizeSkills(me.skills);

  return others
    .map((other) => {
      const sim = semanticSimilarity(me, other, me.skills, other.skills);
      const comp = complementarity(me.skills, other.skills);
      const theirSkills = normalizeSkills(other.skills);
      return {
        user: other.user, // { _id, name } grâce au populate
        level: other.level,
        skills: other.skills,
        score: round(w * sim.value + (1 - w) * comp),
        similarity: round(sim.value),
        complementarity: round(comp),
        mode: sim.mode,
        // Explication lisible du score
        shared: theirSkills.filter((s) => mySkills.includes(s)),
        brings: theirSkills.filter((s) => !mySkills.includes(s))
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Classe les ateliers de l'événement selon leur proximité avec le profil
function rankWorkshops(me, workshops, limit = 3) {
  return workshops
    .map((w) => {
      const sim = semanticSimilarity(me, w, me.skills, w.tags);
      return {
        workshop: { _id: w._id, title: w.title, startsAt: w.startsAt, tags: w.tags },
        score: round(sim.value),
        mode: sim.mode
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { rankTeammates, rankWorkshops };