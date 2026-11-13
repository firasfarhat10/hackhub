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

  const candidates = others.map((other) => ({
    other,
    sim: semanticSimilarity(me, other, me.skills, other.skills),
    comp: complementarity(me.skills, other.skills)
  }));

  // Calibration : les cosinus Gemini sont tassés entre 0,8 et 0,95.
  // On les ramène sur [0, 1] par rapport aux candidats de l'événement (min-max),
  // sinon tous les scores se ressemblent. Jaccard (mode fallback) est déjà étalé.
  const aiSims = candidates.filter((c) => c.sim.mode === 'ai').map((c) => c.sim.value);
  const min = Math.min(...aiSims);
  const max = Math.max(...aiSims);
  const calibrate = (sim) =>
    sim.mode === 'ai' && max - min > 0.01 ? (sim.value - min) / (max - min) : sim.value;

  return candidates
    .map(({ other, sim, comp }) => {
      const theirSkills = normalizeSkills(other.skills);
      return {
        user: other.user, // { _id, name } grâce au populate
        level: other.level,
        skills: other.skills,
        rawScore: w * calibrate(sim) + (1 - w) * comp,
        similarity: round(sim.value), // cosinus brut, pour la transparence
        complementarity: round(comp),
        mode: sim.mode,
        // Explication lisible du score
        shared: theirSkills.filter((s) => mySkills.includes(s)),
        brings: theirSkills.filter((s) => !mySkills.includes(s))
      };
    })
    .sort((a, b) => b.rawScore - a.rawScore) // tri sur la valeur exacte, pas arrondie
    .slice(0, limit)
    .map(({ rawScore, ...rest }) => ({ ...rest, score: round(rawScore) }));
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