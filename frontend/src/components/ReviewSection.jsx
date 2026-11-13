import { useState } from 'react';
import api, { getErrorMessage } from '../api/axios';
import useFetch from '../hooks/useFetch';
import ErrorMessage from './ErrorMessage';

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

// Avis d'un événement + formulaire (réservé aux participants, après le début)
export default function ReviewSection({ eventId, canReview, userId }) {
  const { data: reviews, loading, error, reload } = useFetch(`/events/${eventId}/reviews`);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState(null);

  const alreadyReviewed = reviews?.some((r) => r.user?._id === userId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setFormError(null);
    try {
      await api.post(`/events/${eventId}/reviews`, { rating: Number(form.rating), comment: form.comment });
      setForm({ rating: 5, comment: '' });
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="card">
      <h2>Avis ({reviews?.length ?? 0})</h2>

      {canReview && !alreadyReviewed && (
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Note
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{stars(n)}</option>)}
            </select>
          </label>
          <label>
            Commentaire
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              minLength={10}
              maxLength={1000}
              required
            />
          </label>
          <ErrorMessage message={formError} />
          <button className="btn btn-primary" disabled={sending}>{sending ? 'Envoi...' : 'Publier mon avis'}</button>
        </form>
      )}

      {loading && <p className="muted">Chargement des avis...</p>}
      <ErrorMessage message={error} />
      <ul className="review-list">
        {reviews?.map((r) => (
          <li key={r._id}>
            <div className="review-head">
              <strong>{r.user?.name}</strong>
              <span className="stars">{stars(r.rating)}</span>
            </div>
            <p>{r.comment}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}