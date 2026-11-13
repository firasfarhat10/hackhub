import { Link } from 'react-router-dom';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Composant réutilisable : utilisé sur l'accueil et dans "Mes événements"
export default function EventCard({ event, user, onToggle, error }) {
  const isOpen = event.status === 'published' && new Date(event.endDate) > new Date();

  return (
    <article className="card event-card">
      <div className="event-card-top">
        <span className={`badge badge-${event.status}`}>{event.status}</span>
        <span className="muted">{formatDate(event.startDate)}</span>
      </div>
      <h3><Link to={`/events/${event._id}`}>{event.title}</Link></h3>
      <p className="muted clamp">{event.description}</p>
      <div className="event-card-bottom">
        <span>{event.participantsCount} / {event.capacity} inscrits</span>
        {user && isOpen && onToggle && (
          <button
            className={`btn ${event.isRegistered ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => onToggle(event)}
            disabled={!event.isRegistered && event.isFull}
          >
            {event.isRegistered ? 'Se desinscrire' : event.isFull ? 'Complet' : "S'inscrire"}
          </button>
        )}
      </div>
      {error && <p className="error small">{error}</p>}
    </article>
  );
}