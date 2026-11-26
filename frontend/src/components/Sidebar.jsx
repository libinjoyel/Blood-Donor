import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, CalendarClock, CalendarPlus,
  Building2, User, LogOut, X, Heart,
  Bell, Shield, Boxes, Droplets,
} from 'lucide-react';
import ProfileCard from './ProfileCard';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/donation-history', label: 'Donation History', icon: CalendarClock },
  { to: '/book-appointment', label: 'Schedule Appointment', icon: CalendarPlus },
  { to: '/blood-banks', label: 'Blood Banks', icon: Building2 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/inventory', label: 'Blood Inventory', icon: Boxes },
  { to: '/admin/users', label: 'Donor Database', icon: User },
  { to: '/admin/admins', label: 'Administrators', icon: Shield },
  { to: '/admin/appointments', label: 'Appointment Requests', icon: CalendarClock },
  { to: '/admin/requests', label: 'Blood Requests', icon: Heart },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-14 left-0 z-50
          h-screen lg:h-[calc(100vh-3.5rem)]
          w-[260px] bg-slate-900 text-white
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl lg:shadow-none
        `}
        aria-label="Sidebar navigation"
      >
        {/* Mobile drawer header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-white">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
              <Droplets size={13} className="text-white" />
            </div>
            LifeFlow Menu
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pt-4 pb-3 px-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-300 shadow-sm border-l-[3px] border-rose-500'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1.5 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Administration</span>
              </div>
              {ADMIN_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-rose-500/15 text-rose-300 shadow-sm border-l-[3px] border-rose-500'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
                    }`
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer with user info + logout */}
        <div className="border-t border-white/10 p-4 flex-shrink-0 space-y-3">
          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 text-left rounded-lg hover:bg-white/5 px-1.5 py-1.5 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user?.role || 'donor'}</p>
              </div>
            </button>
            {profileOpen && (
              <ProfileCard
                onClose={() => setProfileOpen(false)}
                cardClassName="fixed bottom-20 left-4 right-4 sm:right-auto lg:absolute lg:bottom-full lg:left-0 lg:right-auto lg:mb-2"
              />
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
