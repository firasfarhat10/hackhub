import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents, toggleRegistration, setUpcoming } from '../store/eventsSlice';
import { selectUser } from '../store/authSlice';
import EventCard from '../components/EventCard';
import ErrorMessage from '../components/ErrorMessage';

export default function HomePage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { items, pagination, upcoming, status, error, actionError } = useSelector((state) => state.events);

  // Charge la page 1 à l'arrivée, et à chaque changement de filtre ou d'utilisateur
  // (connecté, l'API ajoute "isRegistered" à chaque événement)
  useEffect(() => {
    dispatch(fetchEvents({ page: 1, upcoming }));
  }, [dispatch, upcoming, user?._id]);

  const goToPage = (page) => dispatch(fetchEvents({ page, upcoming }));
  const handleToggle = (event) => dispatch(toggleRegistration({ id: event._id, registered: event.isRegistered }));

  return (
    <div>
      <section className="hero">
        <p className="hero-kicker mono">{'// club hackathon · Polytechnique Sousse'}</p>
        <h1>Code. Collabore. <span className="gradient-text">Innove.</span></h1>
        <p className="hero-text">
          Inscris-toi aux hackathons du club, trouve des coequipiers complementaires grace a l'IA
          et partage ton experience.
        </p>
        {!user && (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Rejoindre le club</Link>
            <Link to="/login" className="btn btn-outline btn-lg">Se connecter</Link>
          </div>
        )}
      </section>

      <header className="page-header">
        <div>
          <h2>Evenements</h2>
          <p className="muted small">{pagination.total} evenement(s)</p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={upcoming} onChange={(e) => dispatch(setUpcoming(e.target.checked))} />
          A venir uniquement
        </label>
      </header>

      <ErrorMessage message={error} />
      <div className="grid">
        {status === 'loading' && items.length === 0
          ? [1, 2, 3].map((n) => <div key={n} className="card skeleton" />) // squelettes pendant le chargement
          : items.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                user={user}
                onToggle={handleToggle}
                error={actionError?.id === event._id ? actionError.message : null}
              />
            ))}
      </div>
      {status !== 'loading' && items.length === 0 && <p className="muted">Aucun evenement pour le moment.</p>}

      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>Precedent</button>
          <span>Page {pagination.page} / {pagination.pages}</span>
          <button className="btn btn-outline" disabled={pagination.page >= pagination.pages} onClick={() => goToPage(pagination.page + 1)}>Suivant</button>
        </div>
      )}
    </div>
  );
}
