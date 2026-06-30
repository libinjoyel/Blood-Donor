import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="sidebar-close" onClick={onClose}>&times;</button>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Dashboard
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Profile
          </NavLink>
          <NavLink to="/blood-banks" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Blood Banks
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-user">{user?.name}</p>
          <p className="sidebar-role">{user?.role}</p>
        </div>
      </aside>
    </>
  );
}
