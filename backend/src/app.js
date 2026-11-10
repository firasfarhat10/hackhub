// Configuration de l'application Express (sans démarrage du serveur).
// Séparer app.js de server.js permet de réutiliser l'app ailleurs (tests, scripts).
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { isAiEnabled } = require('./services/ai/geminiClient');

const app = express();

// Render place l'API derrière un proxy : nécessaire pour connaître la vraie IP (rate limit)
app.set('trust proxy', 1);

app.use(helmet()); // en-têtes HTTP de sécurité
app.use(cors({ origin: env.clientUrls })); // seul le front autorisé peut appeler l'API
app.use(express.json({ limit: '100kb' })); // lit le JSON du body, taille limitée

// Santé de l'API (utile pour Render et pour réveiller le service avant une démo)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ai: isAiEnabled() ? 'enabled' : 'disabled', time: new Date().toISOString() });
});

// Toujours en dernier : 404 puis gestion centralisée des erreurs
app.use(notFound);
app.use(errorHandler);

module.exports = app;