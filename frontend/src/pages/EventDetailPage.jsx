import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api, { getErrorMessage } from '../api/axios';
import useFetch from '../hooks/useFetch';
import { selectUser } from '../store/authSlice';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

export default function EventDetailPage() {
  const { id } = useParams(); // paramètre de l'URL /events/:id
  const user = useSelector(selectUser);
  const { data: event, loading, error, reload } = useFetch(`/events/${id}`);
  const { data: workshops, reload: reloadWorkshops } = useFetch(`/events/${id}/workshops`);
  const [actionError, setActionError] = useState(null);

  // Toutes les actions suivent le même schéma : appel API, puis rechargement
  const run = async (request, after) => {
    setActionError(null);
    try {
      await request();
      after();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  const now = new Date();
  const isOpen = event.status === 'published' && new Date(event.endDate) > now;

  return (
    <div className="detail">
      <Link to="/" className="muted">← Tous les evenements</Link>

      <section className="card">
        <span className={`badge badge-${event.status}`}>{event.status}</span>
        <h1>{event.title}</h1>
        <p>{event.description}</p>
        <p className="muted">
          {formatDateTime(event.startDate)} → {formatDateTime(event.endDate)} • {event.location}
        </p>
        <p><strong>{event.participantsCount} / {event.capacity}</strong> inscrits</p>

        {!user && isOpen && <p><Link to="/login">Connectez-vous</Link> pour vous inscrire.</p>}
        {user && isOpen && (
          event.isRegistered ? (
            <button className="btn btn-outline" onClick={() => run(() => api.delete(`/events/${id}/register`), () => { reload(); reloadWorkshops(); })}>
              Se desinscrire
            </button>
          ) : (
            <button className="btn btn-primary" disabled={event.isFull} onClick={() => run(() => api.post(`/events/${id}/register`), reload)}>
              {event.isFull ? 'Complet' : "S'inscrire"}
            </button>
          )
        )}
        <ErrorMessage message={actionError} />

        {/* N:N peuplée : les noms des participants */}
        {event.participants.length > 0 && (
          <p className="small muted">Participants : {event.participants.map((p) => p.name).join(', ')}</p>
        )}
      </section>

      <section className="card">
        <h2>Ateliers</h2>
        {workshops?.length === 0 && <p className="muted">Aucun atelier pour cet evenement.</p>}
        <ul className="plain-list">
          {workshops?.map((w) => (
            <li key={w._id} className="workshop">
              <div>
                <strong>{w.title}</strong> <span className="muted">• {formatDateTime(w.startsAt)}</span>
                <p className="small">{w.description}</p>
                <p className="small muted">{w.attendeesCount} / {w.capacity} places • {w.tags.join(', ')}</p>
              </div>
              {user && event.isRegistered && (
                w.isAttending ? (
                  <button className="btn btn-outline" onClick={() => run(() => api.delete(`/workshops/${w._id}/attend`), reloadWorkshops)}>Liberer ma place</button>
                ) : (
                  <button className="btn btn-primary" disabled={w.attendeesCount >= w.capacity} onClick={() => run(() => api.post(`/workshops/${w._id}/attend`), reloadWorkshops)}>Reserver</button>
                )
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}