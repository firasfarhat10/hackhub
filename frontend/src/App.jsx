import { useDispatch, useSelector } from 'react-redux';
import { login, logout } from './store/authSlice';

export default function App() {
  const { user, status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return (
    <div style={{ padding: 24 }}>
      <h1>HackHub : test du store</h1>
      <p>Utilisateur : {user ? `${user.name} (${user.role})` : 'visiteur'}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => dispatch(login({ email: 'aya@hackhub.tn', password: 'Member2026!' }))}>
        {status === 'loading' ? 'Connexion...' : 'Se connecter en Aya'}
      </button>{' '}
      <button onClick={() => dispatch(login({ email: 'aya@hackhub.tn', password: 'faux' }))}>Mauvais mot de passe</button>{' '}
      <button onClick={() => dispatch(logout())}>Deconnexion</button>
    </div>
  );
}