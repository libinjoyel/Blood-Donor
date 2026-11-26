import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Droplets, Menu, X } from 'lucide-react';

export default function Navbar({ onMenuClick, isMenuOpen = false }) {
  const { token } = useAuth();

  return (
    <nav className="flex items-center justify-between h-14 px-3 sm:px-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        <Link to={token ? '/dashboard' : '/'} className="flex items-center gap-2 font-bold text-base tracking-tight truncate">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <Droplets size={15} className="text-white" />
          </div>
          <span className="truncate">LifeFlow</span>
        </Link>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {!token ? (
          <>
            <Link to="/login" className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white/80 hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/15 rounded-lg hover:bg-white/25 transition-colors">Register</Link>
          </>
        ) : (
          <span className="hidden sm:block text-sm text-white/70 font-medium">LifeFlow Admin</span>
        )}
      </div>
    </nav>
  );
}
