import { useState } from 'react';
import { useSelector } from 'react-redux';
import api, { getErrorMessage } from '../api/axios';
import useFetch from '../hooks/useFetch';
import { selectUser } from '../store/authSlice';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const EMPTY_EVENT = { title: '', description: '', startDate: '', endDate: '', capacity: 30, status: 'draft' };
const SENTIMENTS = { positive: 'Positifs', neutral: 'Neutres', negative: 'Negatifs' };

export default function AdminPage() {
  const me = useSelector(selectUser);
  const { data: stats, reload: reloadStats } = useFetch('/admin/stats');
  const { data: events, loading, error, reload: reloadEvents } = useFetch('/events?limit=50');
  const { data: users, reload: reloadUsers } = useFetch('/admin/users');
  const [form, setForm] = useState(EMPTY_EVENT);
  const [actionError, setActionError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Appel API puis rechargement de toutes les listes concernées
  const run = async (request, ...reloads) => {
    setActionError(null);
    try {
      await request();
      reloads.forEach((reload) => reload());
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const createEvent = (e) => {
    e.preventDefault();
    run(async () => {
      // Les champs datetime-local n'ont pas de fuseau : on les convertit en ISO
      await api.post('/events', {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        capacity: Number(form.capacity)
      });
      setForm(EMPTY_EVENT);
    }, reloadEvents, reloadStats);
  };

  const showInsights = async (eventId) => {
    setInsightsLoading(true);
    setActionError(null);
    try {
      const { data } = await api.get(`/events/${eventId}/reviews/insights`, { params: { refresh: true } });
      setInsights(data);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setInsightsLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="admin">
      <h1>Administration</h1>
      <ErrorMessage message={error || actionError} />

      {stats && (
        <div className="stats">
          {[['Utilisateurs', stats.users], ['Membres', stats.members], ['Evenements', stats.events],
            ['A venir', stats.upcoming], ['Avis', stats.reviews], ['Analyses en attente', stats.pendingAnalyses]]
            .map(([label, value]) => (
              <div key={label} className="stat card"><span className="stat-value">{value}</span><span className="muted">{label}</span></div>
            ))}
        </div>
      )}

      <section className="card">
        <h2>Evenements</h2>
        <table className="table">
          <thead>
            <tr><th>Titre</th><th>Debut</th><th>Inscrits</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {events?.data.map((ev) => (
              <tr key={ev._id}>
                <td>{ev.title}</td>
                <td>{new Date(ev.startDate).toLocaleDateString('fr-FR')}</td>
                <td>{ev.participantsCount} / {ev.capacity}</td>
                <td>
                  <select value={ev.status} onChange={(e) => run(() => api.put(`/events/${ev._id}`, { status: e.target.value }), reloadEvents, reloadStats)}>
                    <option value="draft">brouillon</option>
                    <option value="published">publie</option>
                    <option value="closed">ferme</option>
                  </select>
                </td>
                <td className="actions">
                  <button className="btn btn-outline" onClick={() => showInsights(ev._id)}>Synthese IA</button>
                  <button
                    className="btn btn-danger"
                    onClick={() => window.confirm(`Supprimer "${ev.title}" et ses ateliers et avis ?`)
                      && run(() => api.delete(`/events/${ev._id}`), reloadEvents, reloadStats)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {insightsLoading && <Loader text="Analyse des avis en cours..." />}
      {insights && !insightsLoading && (
        <section className="card insights">
          <div className="insights-head">
            <h2>Synthese des avis : {insights.event.title}</h2>
            <button className="btn btn-ghost" onClick={() => setInsights(null)}>Fermer</button>
          </div>
          {insights.count === 0 ? (
            <p className="muted">Aucun avis pour cet evenement.</p>
          ) : (
            <>
              <p><strong>{insights.count}</strong> avis • note moyenne <strong>{insights.avgRating} / 5</strong></p>
              <div className="sentiments">
                {Object.entries(SENTIMENTS).map(([key, label]) => (
                  <span key={key} className={`badge badge-${key}`}>{label} : {insights.sentiments[key] || 0}</span>
                ))}
              </div>
              {insights.topThemes.length > 0 && (
                <p>Themes les plus cites : {insights.topThemes.map((t) => `${t.theme} (${t.count})`).join(', ')}</p>
              )}
              {insights.summary ? (
                <blockquote className="summary">{insights.summary.text}</blockquote>
              ) : (
                <p className="muted">{insights.aiEnabled ? 'Resume indisponible.' : 'IA desactivee : pas de resume.'}</p>
              )}
            </>
          )}
        </section>
      )}

      <section className="card">
        <h2>Nouvel evenement</h2>
        <form className="form form-grid" onSubmit={createEvent}>
          <label>Titre<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Capacite<input type="number" min="2" max="500" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required /></label>
          <label>Debut<input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></label>
          <label>Fin<input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></label>
          <label className="full">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label>
          <label>
            Statut
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">brouillon</option>
              <option value="published">publie</option>
            </select>
          </label>
          <div className="full"><button className="btn btn-primary">Creer l'evenement</button></div>
        </form>
      </section>

      <section className="card">
        <h2>Utilisateurs</h2>
        <table className="table">
          <thead><tr><th>Nom</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={u._id === me._id} // l'API interdit aussi de modifier son propre rôle
                    onChange={(e) => run(() => api.put(`/admin/users/${u._id}/role`, { role: e.target.value }), reloadUsers, reloadStats)}
                  >
                    <option value="member">membre</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}