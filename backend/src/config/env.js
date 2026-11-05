// Lecture et vérification des variables d'environnement, une seule fois au démarrage.
// Le reste du code importe cet objet au lieu de lire process.env partout.
require('dotenv').config({ quiet: true });

// Variables sans lesquelles le serveur ne peut pas fonctionner
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
}

const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // "http://a.com, http://b.com" -> ['http://a.com', 'http://b.com']
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    embedModel: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 10000,
    baseUrl: process.env.GEMINI_BASE_URL || undefined // uniquement pour les tests
  },
  matchWeightSimilarity: Number(process.env.MATCH_WEIGHT_SIMILARITY) || 0.6
};

env.isProduction = env.nodeEnv === 'production';

module.exports = env;