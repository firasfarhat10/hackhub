import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser, selectIsAdmin } from '../store/authSlice';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">Hack<span>Hub</span></Link>

      <div className="nav-links">
        <NavLink to="/" end>Evenements</NavLink>
        {/* Affichage conditionnel selon la session et le rôle */}
        {user && <NavLink to="/my-events">Mes evenements</NavLink>}
        {user && <NavLink to="/profile">Mon profil</NavLink>}
        {isAdmin && <NavLink to="/admin">Administration</NavLink>}
      </div>

      <div className="nav-actions">
        <button className="btn btn-ghost" onClick={toggleTheme}>
          {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
        </button>
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="btn btn-outline" onClick={handleLogout}>Deconnexion</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Connexion</NavLink>
            <Link to="/register" className="btn btn-primary">Inscription</Link>
          </>
        )}
      </div>
    </nav>
  );
}