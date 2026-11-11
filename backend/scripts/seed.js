// Remplit la base avec des données de démonstration : npm run seed
// ATTENTION : vide d'abord les 5 collections (utilisateurs compris).
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

const MEMBER_PASSWORD = 'Member2026!';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// [nom, niveau, compétences, bio]
const MEMBERS = [
  ['Aya Ben Salah', 'advanced', ['react', 'javascript', 'ui/ux', 'figma'], 'Front-end et design, j\'aime rendre les interfaces simples.'],
  ['Youssef Trabelsi', 'intermediate', ['node.js', 'express', 'mongodb'], 'Back-end, API REST et bases de donnees.'],
  ['Omar Gharbi', 'advanced', ['python', 'machine learning', 'pytorch', 'nlp'], 'Passionne de NLP et de modeles de langage.'],
  ['Sarra Mejri', 'beginner', ['pitch', 'marketing', 'business model'], 'Je prepare les pitchs et la strategie produit.'],
  ['Mehdi Jaziri', 'intermediate', ['docker', 'devops', 'linux', 'ci/cd'], 'Deploiement, conteneurs et automatisation.'],
  ['Ines Hammami', 'advanced', ['data science', 'python', 'pandas', 'visualisation'], 'Analyse de donnees et tableaux de bord.'],
  ['Karim Bouaziz', 'beginner', ['html', 'css', 'javascript'], 'Je debute en developpement web.'],
  ['Nour Chaabane', 'intermediate', ['react native', 'flutter', 'mobile'], 'Applications mobiles multiplateformes.'],
  ['Rami Feki', 'advanced', ['cybersecurite', 'pentest', 'reseaux'], 'Securite des applications et des reseaux.'],
  ['Lina Karray', 'intermediate', ['llm', 'prompt engineering', 'python', 'langchain'], 'Agents IA et integration de LLM.'],
  ['Hedi Sassi', 'beginner', ['gestion de projet', 'agile', 'scrum'], 'Organisation d\'equipe et suivi des taches.'],
  ['Mariem Zouari', 'advanced', ['node.js', 'graphql', 'typescript', 'mongodb'], 'Architecture back-end et performance.']
];

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

  // Un seul hachage pour les 12 membres (même mot de passe de démo) : bcrypt est volontairement lent
  const memberHash = await bcrypt.hash(MEMBER_PASSWORD, 10);
  const members = [];
  for (const [name, level, skills, bio] of MEMBERS) {
    const email = name.split(' ')[0].toLowerCase() + '@hackhub.tn';
    const user = await User.create({ name, email, password: memberHash, role: 'member' });
    const profile = new Profile({ user: user._id, level, skills, bio });
    await refreshEmbedding(profile, profileToText(profile)); // vecteur IA (si clé)
    await profile.save();
    members.push(user);
    process.stdout.write('.');
  }
  console.log(` ${members.length} membres crees`);
  const ids = members.map((m) => m._id);

  // --- Événements (N:N avec participants) ---
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const past = await Event.create({
    title: 'HackHub Winter Edition',
    description: 'Hackathon de 24h sur le theme des services numeriques pour le campus.',
    startDate: new Date(now - 60 * day), endDate: new Date(now - 59 * day),
    capacity: 40, status: 'closed', participants: ids.slice(0, 10)
  });
  const upcoming = await Event.create({
    title: 'AI for Good Hackathon',
    description: "48h pour construire une solution utile avec l'intelligence artificielle : sante, education, environnement.",
    startDate: new Date(now + 25 * day), endDate: new Date(now + 27 * day),
    capacity: 40, status: 'published', participants: ids.slice(0, 9)
  });
  await Event.create({
    title: 'Green Tech Sprint',
    description: 'Une journee pour prototyper des applications autour de la transition ecologique.',
    startDate: new Date(now + 90 * day), endDate: new Date(now + 90 * day + 11 * 3600 * 1000),
    capacity: 30, status: 'published', participants: ids.slice(3, 6)
  });
  await Event.create({
    title: 'Cyber Night (brouillon)',
    description: 'Capture The Flag de nuit, en preparation.',
    startDate: new Date(now + 150 * day), endDate: new Date(now + 150 * day + 12 * 3600 * 1000),
    capacity: 25, status: 'draft'
  });

  // --- Ateliers (1:N avec Event) ---
  const at = (event, offsetHours) => new Date(event.startDate.getTime() + offsetHours * 3600 * 1000);
  const workshopsData = [
    [upcoming, 'Integrer un LLM dans une app web', 'Appeler une API de LLM, structurer les reponses en JSON et gerer les erreurs.', 2, ['llm', 'python', 'api']],
    [upcoming, 'React en 90 minutes', 'Composants, hooks et appels API pour construire un front rapidement.', 5, ['react', 'javascript', 'front-end']],
    [upcoming, 'Deployer sans douleur', "Docker, variables d'environnement et mise en ligne sur Render et Vercel.", 25, ['docker', 'devops', 'deploiement']],
    [upcoming, 'Pitcher son projet', 'Structurer un pitch de 3 minutes convaincant devant un jury.', 31, ['pitch', 'business', 'communication']],
    [past, 'MongoDB pour les hackathons', 'Modeliser vite et bien avec Mongoose.', 2, ['mongodb', 'node.js']]
  ];
  for (const [event, title, description, offset, tags] of workshopsData) {
    const w = new Workshop({ event: event._id, title, description, startsAt: at(event, offset), capacity: 20, tags });
    await refreshEmbedding(w, workshopToText(w));
    await w.save();
  }
  console.log(`${workshopsData.length} ateliers crees`);

  // --- Avis sur l'événement passé ---
  const reviewsData = [
    [5, "Organisation au top, les mentors etaient disponibles toute la nuit. J'ai beaucoup appris."],
    [4, 'Tres bonne ambiance et sujets interessants, mais le wifi a coupe plusieurs fois.'],
    [2, 'Les horaires ont change sans prevenir et la communication etait confuse.'],
    [5, 'Les ateliers etaient excellents, surtout celui sur MongoDB. Bravo au club !'],
    [3, "Correct dans l'ensemble. Le repas du soir est arrive tres en retard."],
    [4, 'Jury bienveillant et retours utiles sur notre projet.'],
    [1, 'Salle trop petite, impossible de se concentrer, et personne pour nous aider.'],
    [4, 'Super experience, je reviendrai. Un peu plus de temps pour le pitch serait bien.']
  ];
  for (let i = 0; i < reviewsData.length; i++) {
    const [rating, comment] = reviewsData[i];
    const review = await Review.create({ user: ids[i], event: past._id, rating, comment });
    await analyzeReviewInBackground(review._id); // dans un script, on attend la fin de l'analyse
    if (isAiEnabled()) await sleep(1500); // reste sous la limite de requêtes par minute
    process.stdout.write('.');
  }
  const done = await Review.countDocuments({ 'analysis.status': 'done' });
  console.log(` ${reviewsData.length} avis crees (${done} analyses par l'IA)`);

  console.log(`\nAdmin   : ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin2026!'}`);
  console.log(`Membres : <prenom>@hackhub.tn / ${MEMBER_PASSWORD} (ex : aya@hackhub.tn)`);
}

seed()
  .catch((err) => {
    console.error('\nSeed echoue :', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
