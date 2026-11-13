import { useSelector } from 'react-redux';
import useFetch from '../hooks/useFetch';
import { selectUser } from '../store/authSlice';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function MyEventsPage() {
  const user = useSelector(selectUser);
  const { data: events, loading, error } = useFetch('/events/mine');

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h1>Mes evenements</h1>
      {events.length === 0 && <p className="muted">Vous n'etes inscrit a aucun evenement.</p>}
      <div className="grid">
        {events.map((event) => <EventCard key={event._id} event={event} user={user} />)}
      </div>
    </div>
  );
}