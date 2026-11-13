import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/authSlice';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyEventsPage from './pages/MyEventsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const dispatch = useDispatch();
  const { token, initialized } = useSelector((state) => state.auth);

  // Restauration de la session au chargement : un jeton existe, est-il encore valide ?
  useEffect(() => {
    if (token && !initialized) dispatch(fetchMe());
  }, [token, initialized, dispatch]);

  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes privées : connexion obligatoire */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<h1>Mon profil (etape F5)</h1>} />
            <Route path="/my-events" element={<MyEventsPage />} />
          </Route>

          {/* Routes admin */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<h1>Administration (etape F6)</h1>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}