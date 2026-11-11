// Mesure la qualité de la classification des avis : npm run eval:reviews
// Compare la réponse de l'IA au sentiment annoté à la main pour 30 avis.
require('dotenv').config({ quiet: true });
const path = require('path');
const { isAiEnabled } = require('../src/services/ai/geminiClient');
const { classifyReview } = require('../src/services/ai/reviewAnalysis');
const dataset = require(path.join(__dirname, 'data', 'reviews.eval.json'));

const LABELS = ['positive', 'neutral', 'negative'];
// Pause entre deux appels : 4 s = 15 requêtes par minute, sous la limite de l'offre gratuite
const DELAY_MS = Number(process.env.EVAL_DELAY_MS) || 4000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!isAiEnabled()) {
    console.log('GEMINI_API_KEY absente : evaluation impossible.');
    process.exitCode = 1;
    return;
  }
  console.log(`${dataset.length} avis a classer (environ ${Math.round((dataset.length * DELAY_MS) / 60000)} min)\n`);

  // confusion[attendu][prédit] = nombre d'avis
  const confusion = Object.fromEntries(LABELS.map((a) => [a, Object.fromEntries(LABELS.map((p) => [p, 0]))]));
  let correct = 0;
  let errors = 0;
  const latencies = [];

  for (const [i, item] of dataset.entries()) {
    const start = Date.now();
    try {
      const { sentiment } = await classifyReview(item.comment, item.rating);
      latencies.push(Date.now() - start);
      confusion[item.expected][sentiment]++;
      if (sentiment === item.expected) correct++;
      else console.log(`  #${i + 1} attendu ${item.expected}, obtenu ${sentiment} : "${item.comment}"`);
    } catch (err) {
      errors++;
      console.log(`  #${i + 1} erreur : ${err.message.slice(0, 120)}`);
    }
    await sleep(DELAY_MS);
  }

  const evaluated = dataset.length - errors;
  const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  console.log(`\nPrecision globale (accuracy) : ${correct}/${evaluated} = ${((100 * correct) / evaluated).toFixed(1)} %`);
  console.log(`Erreurs d'appel : ${errors} | Latence moyenne : ${avgLatency} ms\n`);

  console.log('Matrice de confusion (lignes = attendu, colonnes = predit)');
  console.table(confusion);

  // Rappel par classe : parmi les avis vraiment "X", combien ont été reconnus comme "X" ?
  for (const label of LABELS) {
    const total = Object.values(confusion[label]).reduce((a, b) => a + b, 0);
    console.log(`Rappel ${label.padEnd(8)} : ${total ? ((100 * confusion[label][label]) / total).toFixed(0) : '-'} %`);
  }
}

main();
