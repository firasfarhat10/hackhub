// Affiche les modèles Gemini disponibles pour votre clé : npm run ai:models
// Utile pour choisir GEMINI_MODEL et GEMINI_EMBED_MODEL (les noms changent avec le temps).
require('dotenv').config({ quiet: true });

async function main() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log('GEMINI_API_KEY absente du fichier .env');
    process.exitCode = 1;
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${key}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    console.log(`Erreur ${response.status} : ${data.error?.message}`);
    process.exitCode = 1;
    return;
  }

  const list = (method) =>
    data.models
      .filter((m) => m.supportedGenerationMethods?.includes(method))
      .map((m) => m.name.replace('models/', ''));

  console.log('Modeles de generation (GEMINI_MODEL) :\n  ' + list('generateContent').join('\n  '));
  console.log('\nModeles d\'embedding (GEMINI_EMBED_MODEL) :\n  ' + list('embedContent').join('\n  '));
}

main();