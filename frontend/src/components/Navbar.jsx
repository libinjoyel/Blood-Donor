import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function Navbar({ onToggleSidebar }) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = () => {
      api.get('/notifications/unread-count')
        .then((res) => setUnreadCount(res.data.count))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [token]);

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
            <Link to="/notifications" className="nav-notif-link">
              <span className="nav-notif-icon">{'\uD83D\uDD14'}</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </Link>
            <span className="nav-user">{user?.name}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
