import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Droplets } from 'lucide-react';

export default function Navbar() {
  const { token } = useAuth();

  return (
    <nav className="flex items-center justify-between h-14 px-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3">
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
          <span className="hidden sm:block text-sm text-white/70 font-medium">LifeFlow Admin</span>
        )}
      </div>
    </nav>
  );
}
