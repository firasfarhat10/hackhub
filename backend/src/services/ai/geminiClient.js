// Point d'accès unique à Gemini. Les autres fichiers n'importent jamais le SDK directement :
// pour changer de fournisseur d'IA, on ne modifierait que ce fichier.
const { GoogleGenAI } = require('@google/genai');
const env = require('../../config/env');

// Sans clé API, l'IA est désactivée et l'application fonctionne en mode dégradé
const isAiEnabled = () => Boolean(env.gemini.apiKey);

let client = null;
function getClient() {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: env.gemini.apiKey,
      httpOptions: { timeout: env.gemini.timeoutMs, baseUrl: env.gemini.baseUrl }
    });
  }
  return client;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Erreurs temporaires qui valent une nouvelle tentative :
// 429 = quota dépassé, 500/503 = serveur surchargé, pas de status = coupure réseau / timeout
const isRetryable = (err) => !err.status || [429, 500, 503].includes(err.status);

// Exécute fn() ; en cas d'erreur temporaire, réessaie après 500 ms, puis 1000 ms (backoff exponentiel)
async function withRetry(fn, retries = 2) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const delay = 500 * 2 ** attempt + Math.random() * 200; // + un peu d'aléatoire
      await sleep(delay);
    }
  }
}

// Texte -> vecteur (liste de nombres)
async function embed(text, taskType = 'SEMANTIC_SIMILARITY') {
  const response = await withRetry(() =>
    getClient().models.embedContent({
      model: env.gemini.embedModel,
      contents: text,
      config: { taskType }
    })
  );
  return response.embeddings[0].values;
}

// Génération de texte ; si jsonSchema est fourni, le modèle doit répondre en JSON conforme
async function generate({ system, prompt, jsonSchema, temperature = 0 }) {
  const config = { systemInstruction: system, temperature };
  if (jsonSchema) {
    config.responseMimeType = 'application/json';
    config.responseJsonSchema = jsonSchema;
  }
  const response = await withRetry(() =>
    getClient().models.generateContent({ model: env.gemini.model, contents: prompt, config })
  );
  return response.text;
}

module.exports = { isAiEnabled, embed, generate, withRetry };