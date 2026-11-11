// Tests automatiques de l'étape 7 (avis, matching IA, synthèse, administration).
// Prérequis : le serveur tourne (npm run dev) dans un autre terminal.
// Lancer :   node scripts/testEtape7.js
// Le script crée ses données de test, puis les supprime à la fin.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Event = require('../src/models/Event');
const Workshop = require('../src/models/Workshop');
const Review = require('../src/models/Review');

const API = `http://localhost:${process.env.PORT || 3000}/api`;
const STAMP = Date.now();
const PASSWORD = 'TestEtape7!';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0;
let ko = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch { /* corps vide */ }
  return { status: res.status, data };
}

function check(num, label, res, expected) {
  const success = res.status === expected;
  success ? ok++ : ko++;
  const detail = success ? '' : `  -> ${JSON.stringify(res.data).slice(0, 160)}`;
  console.log(`${success ? 'OK ' : 'XX '} ${num.padEnd(3)} ${String(res.status).padEnd(3)} (attendu ${expected})  ${label}${detail}`);
  return res;
}

async function newAccount(prefix, profile) {
  const email = `${prefix}.${STAMP}@test.hackhub`;
  const r = await call('POST', '/auth/register', { body: { name: `${prefix} test`, email, password: PASSWORD } });
  if (r.status !== 201) throw new Error(`Inscription de ${email} impossible : ${r.status} ${JSON.stringify(r.data)}`);
  const account = { email, id: r.data.user._id, token: r.data.token };
  if (profile) await call('PUT', '/profile/me', { token: account.token, body: profile });
  return account;
}

async function main() {
  const health = await call('GET', '/health').catch(() => null);
  if (!health || health.status !== 200) {
    throw new Error(`API injoignable sur ${API} : lancez "npm run dev" dans un autre terminal`);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`API : ${API} | base : ${mongoose.connection.name} | IA : ${health.data.ai}`);
  console.log('Preparation (comptes, profils, evenement, ateliers)...\n');

  const admin = await newAccount('admin');
  await User.updateOne({ _id: admin.id }, { role: 'admin' });
  const aya = await newAccount('aya', { bio: 'Front-end et design', skills: ['react', 'javascript', 'ui/ux'], level: 'advanced' });
  const omar = await newAccount('omar', { bio: 'NLP et modeles de langage', skills: ['python', 'nlp', 'pytorch'], level: 'advanced' });
  const ines = await newAccount('ines', { bio: 'Back-end et bases de donnees', skills: ['node.js', 'mongodb', 'react'], level: 'intermediate' });
  const karim = await newAccount('karim'); // inscrit mais sans competences
  const lina = await newAccount('lina', { skills: ['pitch'] }); // non inscrite a l'evenement

  const ev = await call('POST', '/events', {
    token: admin.token,
    body: {
      title: `Test etape 7 (${STAMP})`, description: 'Evenement de test',
      startDate: '2027-12-05T09:00:00Z', endDate: '2027-12-07T09:00:00Z', capacity: 20, status: 'published'
    }
  });
  const eventId = ev.data._id;
  await call('POST', `/events/${eventId}/workshops`, { token: admin.token, body: { title: 'Integrer un LLM dans une app', description: 'API de LLM, sortie JSON, NLP', startsAt: '2027-12-05T11:00:00Z', capacity: 10, tags: ['llm', 'python', 'nlp'] } });
  await call('POST', `/events/${eventId}/workshops`, { token: admin.token, body: { title: 'React en 90 minutes', description: 'Composants, hooks et interface', startsAt: '2027-12-05T14:00:00Z', capacity: 10, tags: ['react', 'javascript', 'front-end'] } });
  for (const u of [aya, omar, ines, karim]) await call('POST', `/events/${eventId}/register`, { token: u.token });

  // --- Matching IA ---
  console.log('--- Matching ---');
  check('M1', 'matching non participante (Lina)', await call('GET', `/events/${eventId}/matches`, { token: lina.token }), 403);
  check('M2', 'matching sans competences (Karim)', await call('GET', `/events/${eventId}/matches`, { token: karim.token }), 400);
  const m = check('M3', 'matching Aya', await call('GET', `/events/${eventId}/matches`, { token: aya.token }), 200);
  for (const t of m.data?.teammates || []) {
    console.log(`         ${t.user.name.padEnd(10)} score ${t.score} (similarite ${t.similarity}, complementarite ${t.complementarity}, mode ${t.mode}) apporte : ${t.brings.join(', ') || '-'}`);
  }
  for (const w of m.data?.workshops || []) console.log(`         atelier : ${w.workshop.title} -> ${w.score} (${w.mode})`);

  // --- Avis ---
  console.log('\n--- Avis ---');
  const good = { rating: 5, comment: 'Les mentors etaient super et les ateliers tres utiles.' };
  check('R1', 'avis avant le debut de l\'evenement', await call('POST', `/events/${eventId}/reviews`, { token: aya.token, body: good }), 400);
  // On fait "commencer" l'evenement directement en base (uniquement pour le test)
  await Event.updateOne({ _id: eventId }, { startDate: new Date(Date.now() - 3600 * 1000) });
  check('R2', 'avis d\'une non participante (Lina)', await call('POST', `/events/${eventId}/reviews`, { token: lina.token, body: good }), 403);
  check('R3', 'note 6', await call('POST', `/events/${eventId}/reviews`, { token: aya.token, body: { ...good, rating: 6 } }), 400);
  check('R4', 'commentaire trop court', await call('POST', `/events/${eventId}/reviews`, { token: aya.token, body: { rating: 4, comment: 'ok' } }), 400);
  const r5 = check('R5', 'avis Aya', await call('POST', `/events/${eventId}/reviews`, { token: aya.token, body: good }), 201);
  console.log(`         analyse immediatement apres la creation : ${r5.data?.analysis?.status}`);
  check('R6', 'deuxieme avis d\'Aya', await call('POST', `/events/${eventId}/reviews`, { token: aya.token, body: good }), 409);
  const r7 = check('R7', 'avis Omar', await call('POST', `/events/${eventId}/reviews`, { token: omar.token, body: { rating: 2, comment: 'Le repas est arrive tres en retard et les horaires ont change sans prevenir.' } }), 201);

  console.log('         (attente de 5 s pour l\'analyse IA en arriere-plan...)');
  await sleep(5000);
  const pub = await call('GET', `/events/${eventId}/reviews`);
  console.log(`         liste publique : ${pub.data.length} avis, analyse cachee : ${pub.data.every((r) => !('analysis' in r))}, auteur peuple : ${JSON.stringify(pub.data[0]?.user)}`);
  const adm = await call('GET', `/events/${eventId}/reviews`, { token: admin.token });
  for (const r of adm.data) console.log(`         [admin] ${r.user.name} : ${JSON.stringify(r.analysis)}`);

  check('R8', 'Omar modifie l\'avis d\'Aya', await call('PUT', `/reviews/${r5.data._id}`, { token: omar.token, body: { rating: 1 } }), 403);
  check('R9', 'Aya modifie son avis', await call('PUT', `/reviews/${r5.data._id}`, { token: aya.token, body: { rating: 4 } }), 200);

  // --- Synthese admin ---
  console.log('\n--- Synthese ---');
  check('I1', 'synthese demandee par un membre', await call('GET', `/events/${eventId}/reviews/insights`, { token: aya.token }), 403);
  await sleep(3000);
  const ins = check('I2', 'synthese admin (refresh)', await call('GET', `/events/${eventId}/reviews/insights?refresh=true`, { token: admin.token }), 200);
  if (ins.data) {
    console.log(`         avis : ${ins.data.count} | note moyenne : ${ins.data.avgRating} | sentiments : ${JSON.stringify(ins.data.sentiments)} | themes : ${JSON.stringify(ins.data.topThemes)}`);
    console.log(`         resume : ${ins.data.summary?.text || '(aucun : IA desactivee)'}`);
  }

  // --- Administration ---
  console.log('\n--- Administration ---');
  check('A1', 'stats demandees par un membre', await call('GET', '/admin/stats', { token: aya.token }), 403);
  const st = check('A2', 'stats admin', await call('GET', '/admin/stats', { token: admin.token }), 200);
  console.log(`         ${JSON.stringify(st.data)}`);
  const us = check('A3', 'liste des utilisateurs', await call('GET', '/admin/users', { token: admin.token }), 200);
  console.log(`         mot de passe present dans la reponse : ${us.data.some((u) => 'password' in u)}`);
  check('A4', 'admin change son propre role', await call('PUT', `/admin/users/${admin.id}/role`, { token: admin.token, body: { role: 'member' } }), 400);
  check('A5', 'role invalide', await call('PUT', `/admin/users/${lina.id}/role`, { token: admin.token, body: { role: 'boss' } }), 400);
  check('A6', 'Lina promue admin', await call('PUT', `/admin/users/${lina.id}/role`, { token: admin.token, body: { role: 'admin' } }), 200);
  check('A7', 'ancien jeton de Lina -> stats', await call('GET', '/admin/stats', { token: lina.token }), 200);
  check('D1', 'Aya supprime l\'avis d\'Omar', await call('DELETE', `/reviews/${r7.data._id}`, { token: aya.token }), 403);
  check('D2', 'Lina (admin) supprime l\'avis d\'Omar', await call('DELETE', `/reviews/${r7.data._id}`, { token: lina.token }), 200);

  console.log(`\nRESULTAT : ${ok} OK, ${ko} echec(s)`);
}

main()
  .catch((err) => {
    console.error('\nTest interrompu :', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find({ email: new RegExp(`\\.${STAMP}@test\\.hackhub$`) }).select('_id');
      const ids = users.map((u) => u._id);
      const events = await Event.find({ title: new RegExp(STAMP) }).select('_id');
      const eventIds = events.map((e) => e._id);
      await Review.deleteMany({ $or: [{ event: { $in: eventIds } }, { user: { $in: ids } }] });
      await Workshop.deleteMany({ event: { $in: eventIds } });
      await Event.deleteMany({ _id: { $in: eventIds } });
      await Profile.deleteMany({ user: { $in: ids } });
      await User.deleteMany({ _id: { $in: ids } });
      console.log(`Nettoyage : ${ids.length} comptes et ${eventIds.length} evenement(s) de test supprimes`);
      await mongoose.disconnect();
    }
  });
