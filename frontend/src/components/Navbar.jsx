import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar({ onToggleSidebar }) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {token && (
          <button className="navbar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            &#9776;
          </button>
        )}
        <Link to={token ? '/dashboard' : '/'} className="nav-brand">Blood Donor</Link>
      </div>
      <div className="nav-links">
        {!token ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <span className="nav-user">{user?.name}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
