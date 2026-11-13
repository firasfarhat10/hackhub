import { Link } from 'react-router-dom';
import { coverStyle, getPhase, dateParts } from '../utils/display';

// Composant réutilisable : utilisé sur l'accueil et dans "Mes événements"
export default function EventCard({ event, user, onToggle, error }) {
  const isOpen = event.status === 'published' && new Date(event.endDate) > new Date();
  const phase = getPhase(event);
  const { day, month } = dateParts(event.startDate);
  const fill = Math.min(100, Math.round((event.participantsCount / event.capacity) * 100));

  return (
    <article className="card event-card">
      <Link to={`/events/${event._id}`} className="cover" style={coverStyle(event)}>
        <span className="cover-date"><strong>{day}</strong>{month}</span>
        <span className={`phase phase-${phase.key}`}>{phase.label}</span>
      </Link>

      <div className="event-card-body">
        <h3><Link to={`/events/${event._id}`}>{event.title}</Link></h3>
        <p className="mono small muted">{event.location}</p>
        <p className="muted clamp">{event.description}</p>

        <div className="capacity">
          <div className="bar"><div style={{ width: `${fill}%` }} /></div>
          <span className="mono small">{event.participantsCount}/{event.capacity}</span>
        </div>

        {user && isOpen && onToggle && (
          <button
            className={`btn ${event.isRegistered ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => onToggle(event)}
            disabled={!event.isRegistered && event.isFull}
          >
            {event.isRegistered ? 'Se desinscrire' : event.isFull ? 'Complet' : "S'inscrire"}
          </button>
        )}
        {error && <p className="error small">{error}</p>}
      </div>
    </article>
  );
}
