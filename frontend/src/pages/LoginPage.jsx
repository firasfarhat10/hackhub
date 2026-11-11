import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearAuthError } from '../store/authSlice';
import ErrorMessage from '../components/ErrorMessage';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' }); // formulaire contrôlé
  const { user, status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Page demandée avant la redirection vers /login (voir ProtectedRoute)
  const from = location.state?.from || '/';

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Une fois connecté, on renvoie vers la page d'origine
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div className="auth-page card">
      <h1>Connexion</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" />
        </label>
        <label>
          Mot de passe
          <input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="current-password" />
        </label>
        <ErrorMessage message={error} />
        <button className="btn btn-primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p className="muted">Pas encore de compte ? <Link to="/register">Inscription</Link></p>
    </div>
  );
}