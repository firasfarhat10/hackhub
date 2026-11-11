import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearAuthError } from '../store/authSlice';
import ErrorMessage from '../components/ErrorMessage';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState(null);
  const { user, status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (user) navigate('/profile', { replace: true }); // nouveau compte -> compléter son profil
  }, [user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Vérification côté client : retour immédiat, l'API revérifie de toute façon
    if (form.password.length < 8) return setLocalError('Le mot de passe doit comporter au moins 8 caracteres');
    if (form.password !== form.confirm) return setLocalError('Les mots de passe ne correspondent pas');
    setLocalError(null);
    const { name, email, password } = form;
    dispatch(register({ name, email, password }));
  };

  return (
    <div className="auth-page card">
      <h1>Inscription</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>Nom<input name="name" value={form.name} onChange={handleChange} required maxLength={60} /></label>
        <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} required /></label>
        <label>Mot de passe<input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" /></label>
        <label>Confirmation<input type="password" name="confirm" value={form.confirm} onChange={handleChange} required autoComplete="new-password" /></label>
        <ErrorMessage message={localError || error} />
        <button className="btn btn-primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creation...' : 'Creer mon compte'}
        </button>
      </form>
      <p className="muted">Deja inscrit ? <Link to="/login">Connexion</Link></p>
    </div>
  );
}