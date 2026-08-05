import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Menu, Bell, Droplets } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, token } = useAuth();
  const intervalRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) {
      return;
    }
    const fetchUnread = () => {
      api.get('/notifications/unread-count')
        .then((res) => setUnreadCount(res.data.count))
        .catch(() => {});
    };
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [token]);

  return (
    <nav className="flex items-center justify-between h-14 px-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3">
        {token && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <Link to={token ? '/dashboard' : '/'} className="flex items-center gap-2 font-bold text-base tracking-tight">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-sm">
            <Droplets size={15} className="text-white" />
          </div>
          LifeFlow
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {!token ? (
          <>
            <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="px-3 py-1.5 text-sm font-medium bg-white/15 rounded-lg hover:bg-white/25 transition-colors">Register</Link>
          </>
        ) : (
          <>
            <Link
              to="/notifications"
              className="relative p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white bg-rose-500 rounded-full shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <span className="hidden sm:block text-sm text-white/70 font-medium">{user?.name}</span>
          </>
        )}
      </div>
    </nav>
  );
}
