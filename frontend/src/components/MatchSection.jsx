import useFetch from '../hooks/useFetch';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import Avatar from './Avatar';

// Suggestions IA : coéquipiers complémentaires et ateliers recommandés
export default function MatchSection({ eventId }) {
  const { data, loading, error } = useFetch(`/events/${eventId}/matches`);

  if (loading) return <Loader text="Calcul des suggestions..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <section className="card">
      <h2>Suggestions pour vous {data.aiEnabled ? <span className="badge badge-ai">IA</span> : <span className="badge">mode simple</span>}</h2>

      <h3>Coequipiers complementaires</h3>
      {data.teammates.length === 0 && <p className="muted">Pas encore d'autres participants avec des competences.</p>}
      <div className="match-grid">
        {data.teammates.map((t) => (
          <div key={t.user._id} className="match-card">
            <div className="match-head">
              <span className="match-name"><Avatar name={t.user.name} size={30} /><strong>{t.user.name}</strong></span>
              <span className="score mono">{Math.round(t.score * 100)} %</span>
            </div>
            <div className="bar"><div style={{ width: `${Math.round(t.score * 100)}%` }} /></div>
            {t.brings.length > 0 && <p className="small">Vous apporte : {t.brings.join(', ')}</p>}
            {t.shared.length > 0 && <p className="small muted">En commun : {t.shared.join(', ')}</p>}
          </div>
        ))}
      </div>

      <h3>Ateliers recommandes</h3>
      <ul className="plain-list">
        {data.workshops.map((w) => (
          <li key={w.workshop._id}>
            {w.workshop.title} <span className="muted">({Math.round(w.score * 100)} %)</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
