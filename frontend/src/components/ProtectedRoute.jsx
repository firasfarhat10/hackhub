import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from './Loader';

// Garde de route : redirige vers /login si personne n'est connecté,
// et vers l'accueil si la route est réservée aux admins.
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, initialized } = useSelector((state) => state.auth);
  const location = useLocation();

  // La session est en cours de restauration (/auth/me) : on attend avant de décider
  if (!initialized) return <Loader />;

  if (!user) {
    // On mémorise la page demandée pour y revenir après la connexion
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />; // affiche la route enfant
}