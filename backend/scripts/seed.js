// Remplit la base avec des données de démonstration : npm run seed
// ATTENTION : vide d'abord les 5 collections (utilisateurs compris).
// Les données elles-mêmes sont dans scripts/data/seedData.js.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Event = require('../src/models/Event');
const Workshop = require('../src/models/Workshop');
const Review = require('../src/models/Review');
const { profileToText, workshopToText, refreshEmbedding } = require('../src/services/ai/embeddings');
const { isAiEnabled } = require('../src/services/ai/geminiClient');
const { analyzeReviewInBackground } = require('../src/services/ai/reviewAnalysis');
const { MEMBERS, EVENTS, WORKSHOPS, REVIEWS } = require('./data/seedData');

const MEMBER_PASSWORD = 'Member2026!';
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
// Pause entre deux analyses d'avis : reste sous la limite de requêtes/minute du quota gratuit Gemini
const AI_DELAY_MS = Number(process.env.SEED_AI_DELAY_MS ?? 4000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function seed() {
  // Garde-fou : ne jamais vider une base de production par erreur
  if (env.isProduction && !process.argv.includes('--force')) {
    throw new Error('Seed interdit en production (ajoutez --force si vous etes sur)');
  }
  await mongoose.connect(env.mongoUri);
  console.log(`Base : ${mongoose.connection.name} | IA : ${isAiEnabled() ? 'activee' : 'desactivee'}`);

  const models = [User, Profile, Event, Workshop, Review];
  await Promise.all(models.map((M) => M.deleteMany({})));
  await Promise.all(models.map((M) => M.syncIndexes())); // crée les index (uniques...)

  // --- Utilisateurs et profils (1:1) ---
  const admin = await User.create({
    name: 'Admin HackHub',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@hackhub.tn',
    password: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin2026!', 10),
    role: 'admin'
  });
  await Profile.create({ user: admin._id, bio: 'Bureau du club', skills: ['organisation'] });

  // Un seul hachage pour tous les membres (même mot de passe de démo) : bcrypt est volontairement lent
  const memberHash = await bcrypt.hash(MEMBER_PASSWORD, 10);
  const ids = [];
  process.stdout.write('Membres ');
  for (const [name, level, skills, bio, github] of MEMBERS) {
    const email = name.split(' ')[0].toLowerCase() + '@hackhub.tn';
    const user = await User.create({ name, email, password: memberHash, role: 'member' });
    const githubUrl = github ? `https://github.com/${github}` : '';
    const profile = new Profile({ user: user._id, level, skills, bio, githubUrl });
    await refreshEmbedding(profile, profileToText(profile)); // vecteur IA (si clé)
    await profile.save();
    ids.push(user._id);
    process.stdout.write('.');
  }
  console.log(` ${ids.length}`);

  // --- Événements (N:N avec participants) ---
  const now = Date.now();
  const events = {}; // clé -> document créé
  for (const e of EVENTS) {
    const startDate = new Date(now + e.startInDays * DAY);
    events[e.key] = await Event.create({
      title: e.title,
      description: e.description,
      location: e.location,
      startDate,
      endDate: new Date(startDate.getTime() + e.durationHours * HOUR),
      capacity: e.capacity,
      status: e.status,
      participants: e.participants.map((i) => ids[i]) // indices -> ObjectId
    });
  }
  console.log(`Evenements : ${EVENTS.length}`);

  // --- Ateliers (1:N avec Event) ---
  // Les participants de l'événement sont répartis entre ses ateliers (un sur n)
  const countByEvent = {};
  WORKSHOPS.forEach(([key]) => { countByEvent[key] = (countByEvent[key] || 0) + 1; });
  const seenByEvent = {};

  process.stdout.write('Ateliers ');
  for (const [key, title, description, offsetHours, tags] of WORKSHOPS) {
    const event = events[key];
    const position = (seenByEvent[key] = (seenByEvent[key] ?? -1) + 1);
    const attendees = event.participants.filter((_, i) => i % countByEvent[key] === position);

    const w = new Workshop({
      event: event._id,
      title,
      description,
      startsAt: new Date(event.startDate.getTime() + offsetHours * HOUR),
      capacity: 20,
      tags,
      attendees
    });
    await refreshEmbedding(w, workshopToText(w));
    await w.save();
    process.stdout.write('.');
  }
  console.log(` ${WORKSHOPS.length}`);

  // --- Avis (analysés par l'IA) ---
  const total = Object.values(REVIEWS).reduce((n, list) => n + list.length, 0);
  console.log(`Avis : ${total} (analyse IA ${isAiEnabled() ? `~${Math.ceil((total * AI_DELAY_MS) / 60000)} min` : 'desactivee'})`);
  for (const [key, list] of Object.entries(REVIEWS)) {
    const event = events[key];
    process.stdout.write(`  ${event.title} `);
    for (let i = 0; i < list.length; i++) {
      const [rating, comment] = list[i];
      // Le i-ème avis est écrit par le i-ème participant : l'auteur est toujours un participant
      const review = await Review.create({ user: event.participants[i], event: event._id, rating, comment });
      await analyzeReviewInBackground(review._id); // dans un script, on attend la fin de l'analyse
      if (isAiEnabled()) await sleep(AI_DELAY_MS);
      process.stdout.write('.');
    }
    console.log(` ${list.length}`);
  }
  const done = await Review.countDocuments({ 'analysis.status': 'done' });
  console.log(`Analyses IA reussies : ${done} / ${total}`);

  console.log(`\nAdmin   : ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin2026!'}`);
  console.log(`Membres : <prenom>@hackhub.tn / ${MEMBER_PASSWORD} (ex : aya@hackhub.tn, salma@hackhub.tn)`);
}

seed()
  .catch((err) => {
    console.error('\nSeed echoue :', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
