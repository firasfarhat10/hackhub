// Tests automatiques de l'étape 6 (événements, inscriptions N:N, ateliers).
// Prérequis : le serveur tourne (npm run dev) dans un autre terminal.
// Lancer :   node scripts/testEtape6.js
// Le script crée des comptes et des événements de test, puis les supprime à la fin.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Event = require('../src/models/Event');
const Workshop = require('../src/models/Workshop');

const API = `http://localhost:${process.env.PORT || 3000}/api`;
const STAMP = Date.now();
const PASSWORD = 'TestEtape6!';
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
  console.log(`${success ? 'OK ' : 'XX '} #${String(num).padEnd(2)} ${String(res.status).padEnd(3)} (attendu ${expected})  ${label}${detail}`);
  return res;
}

async function newAccount(prefix) {
  const email = `${prefix}.${STAMP}@test.hackhub`;
  const r = await call('POST', '/auth/register', { body: { name: `${prefix} test`, email, password: PASSWORD } });
  if (r.status !== 201) throw new Error(`Inscription de ${email} impossible : ${r.status} ${JSON.stringify(r.data)}`);
  return { email, id: r.data.user._id, token: r.data.token };
}

async function main() {
  const health = await call('GET', '/health').catch(() => null);
  if (!health || health.status !== 200) {
    throw new Error(`API injoignable sur ${API} : lancez "npm run dev" dans un autre terminal`);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`API : ${API} | base : ${mongoose.connection.name} | IA : ${health.data.ai}\n`);

  // Comptes de test : un admin (promu directement en base) et trois membres
  const admin = await newAccount('admin');
  await User.updateOne({ _id: admin.id }, { role: 'admin' });
  const aya = await newAccount('aya');
  const omar = await newAccount('omar');
  const lina = await newAccount('lina');

  const eventBody = {
    title: `AI for Good Hackathon (test ${STAMP})`,
    description: '48h pour une IA utile',
    startDate: '2027-12-05T09:00:00Z',
    endDate: '2027-12-07T09:00:00Z',
    capacity: 3,
    status: 'published'
  };

  const created = check(1, 'POST /events (admin)', await call('POST', '/events', { token: admin.token, body: eventBody }), 201);
  const eventId = created.data?._id;
  check(2, 'POST /events (membre) -> refuse', await call('POST', '/events', { token: aya.token, body: eventBody }), 403);
  check(3, 'POST /events dates inversees', await call('POST', '/events', {
    token: admin.token,
    body: { ...eventBody, startDate: '2027-12-07T09:00:00Z', endDate: '2027-12-05T09:00:00Z' }
  }), 400);
  const list = check(4, 'GET /events (public, pagination)', await call('GET', '/events?upcoming=true&limit=5'), 200);
  console.log(`         pagination = ${JSON.stringify(list.data?.pagination)}`);
  check(5, 'inscription Aya', await call('POST', `/events/${eventId}/register`, { token: aya.token }), 201);
  check(6, 'inscription Aya une 2e fois', await call('POST', `/events/${eventId}/register`, { token: aya.token }), 409);
  check(7, 'inscription Omar (2/3)', await call('POST', `/events/${eventId}/register`, { token: omar.token }), 201);
  check(7, 'inscription admin (3/3)', await call('POST', `/events/${eventId}/register`, { token: admin.token }), 201);
  const full = check(8, 'inscription Lina (complet)', await call('POST', `/events/${eventId}/register`, { token: lina.token }), 409);
  console.log(`         message = ${full.data?.message}`);
  const detail = check(9, 'GET /events/:id (populate)', await call('GET', `/events/${eventId}`, { token: aya.token }), 200);
  console.log(`         participants = ${JSON.stringify(detail.data?.participants)} | isRegistered = ${detail.data?.isRegistered} | isFull = ${detail.data?.isFull}`);

  const ws = check(10, 'POST atelier (admin)', await call('POST', `/events/${eventId}/workshops`, {
    token: admin.token,
    body: { title: 'Integrer un LLM', description: 'Sortie JSON et validation', startsAt: '2027-12-05T11:00:00Z', capacity: 10, tags: ['LLM', 'python'] }
  }), 201);
  const workshopId = ws.data?._id;
  check(11, 'GET /events/abc', await call('GET', '/events/abc'), 400);

  // Tests complémentaires
  check(12, 'GET /events/mine (Aya)', await call('GET', '/events/mine', { token: aya.token }), 200);
  check(13, 'atelier : reservation Lina (non inscrite)', await call('POST', `/workshops/${workshopId}/attend`, { token: lina.token }), 403);
  check(14, 'atelier : reservation Aya', await call('POST', `/workshops/${workshopId}/attend`, { token: aya.token }), 201);
  check(15, 'atelier : reservation Aya une 2e fois', await call('POST', `/workshops/${workshopId}/attend`, { token: aya.token }), 409);
  const cap = check(16, 'capacite reduite sous le nb d\'inscrits', await call('PUT', `/events/${eventId}`, { token: admin.token, body: { capacity: 2 } }), 400);
  console.log(`         message = ${cap.data?.message}`);
  check(17, 'desinscription Aya', await call('DELETE', `/events/${eventId}/register`, { token: aya.token }), 200);
  const wsAfter = await call('GET', `/events/${eventId}/workshops`, { token: aya.token });
  const freed = wsAfter.data?.find((w) => w._id === workshopId);
  console.log(`         place d'atelier liberee apres desinscription : ${freed && !freed.isAttending ? 'oui' : 'NON'}`);
  check(18, 'desinscription Aya une 2e fois', await call('DELETE', `/events/${eventId}/register`, { token: aya.token }), 404);

  // Test de concurrence : 4 inscriptions simultanées pour 2 places
  const race = await call('POST', '/events', { token: admin.token, body: { ...eventBody, capacity: 2, title: `Course ${STAMP}` } });
  const results = await Promise.all([aya, omar, lina, admin].map((u) =>
    call('POST', `/events/${race.data._id}/register`, { token: u.token })));
  const raceDetail = await call('GET', `/events/${race.data._id}`);
  const accepted = results.filter((r) => r.status === 201).length;
  const raceOk = accepted === 2 && raceDetail.data.participantsCount === 2;
  raceOk ? ok++ : ko++;
  console.log(`${raceOk ? 'OK ' : 'XX '} #19 4 inscriptions simultanees pour 2 places -> ${results.map((r) => r.status).join(', ')} | inscrits = ${raceDetail.data.participantsCount} (attendu 2)`);

  check(20, 'suppression evenement (cascade)', await call('DELETE', `/events/${eventId}`, { token: admin.token }), 200);
  const orphans = await Workshop.countDocuments({ event: eventId });
  console.log(`         ateliers restants de l'evenement supprime : ${orphans} (attendu 0)`);
  await call('DELETE', `/events/${race.data._id}`, { token: admin.token });

  console.log(`\nRESULTAT : ${ok} OK, ${ko} echec(s)`);
}

main()
  .catch((err) => {
    console.error('\nTest interrompu :', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Nettoyage : comptes et événements de test
    if (mongoose.connection.readyState === 1) {
      const users = await User.find({ email: new RegExp(`\\.${STAMP}@test\\.hackhub$`) }).select('_id');
      const ids = users.map((u) => u._id);
      const events = await Event.find({ title: new RegExp(STAMP) }).select('_id');
      await Workshop.deleteMany({ event: { $in: events.map((e) => e._id) } });
      await Event.deleteMany({ _id: { $in: events.map((e) => e._id) } });
      await Profile.deleteMany({ user: { $in: ids } });
      await User.deleteMany({ _id: { $in: ids } });
      console.log(`Nettoyage : ${ids.length} comptes et ${events.length} evenements de test supprimes`);
      await mongoose.disconnect();
    }
  });
