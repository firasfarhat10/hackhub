// Relance l'analyse IA des avis en échec ou restés en attente : npm run ai:reanalyze
// Utile après une panne ou un timeout de Gemini. Ne touche pas aux avis déjà analysés.
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Review = require('../src/models/Review');
const { isAiEnabled } = require('../src/services/ai/geminiClient');
const { analyzeReviewInBackground } = require('../src/services/ai/reviewAnalysis');

const DELAY_MS = Number(process.env.SEED_AI_DELAY_MS ?? 4000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!isAiEnabled()) throw new Error('GEMINI_API_KEY absente : impossible de relancer les analyses');
  await mongoose.connect(env.mongoUri);

  const reviews = await Review.find({ 'analysis.status': { $in: ['failed', 'pending', 'skipped'] } }).select('_id');
  console.log(`Avis a (re)analyser : ${reviews.length}`);

  for (const { _id } of reviews) {
    await analyzeReviewInBackground(_id); // même fonction que l'API : une seule logique d'analyse
    const { analysis } = await Review.findById(_id).select('analysis');
    console.log(`  ${_id} -> ${analysis.status}${analysis.sentiment ? ` (${analysis.sentiment})` : ''}`);
    await sleep(DELAY_MS);
  }

  const counts = await Review.aggregate([{ $group: { _id: '$analysis.status', n: { $sum: 1 } } }]);
  console.log('Bilan :', Object.fromEntries(counts.map((c) => [c._id, c.n])));
}

main()
  .catch((err) => {
    console.error('Echec :', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
