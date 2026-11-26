import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarPlus, Building2, Bell, Menu,
  Boxes, User, Heart, LogIn, Home,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function MobileMenuBar({ onOpenMenu }) {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';

  const items = !token
    ? [
        { to: '/', label: 'Home', icon: Home, end: true },
        { to: '/blood-banks', label: 'Banks', icon: Building2 },
        { to: '/urgent-requests', label: 'Urgent', icon: Heart },
        { to: '/login', label: 'Sign In', icon: LogIn },
      ]
    : isAdmin
      ? [
          { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
          { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
          { to: '/admin/users', label: 'Donors', icon: User },
          { to: '/admin/requests', label: 'Requests', icon: Heart },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/book-appointment', label: 'Schedule', icon: CalendarPlus },
          { to: '/blood-banks', label: 'Banks', icon: Building2 },
          { to: '/notifications', label: 'Alerts', icon: Bell },
        ];

  return (
    <nav
      aria-label="Mobile menu bar"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-rose-600 bg-rose-50/80 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`
            }
          >
            <Icon size={19} strokeWidth={2} />
            <span className="truncate max-w-full px-1">{label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          aria-label="Open full navigation menu"
        >
          <Menu size={19} strokeWidth={2} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
