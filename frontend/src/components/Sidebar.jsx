import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="sidebar-close" onClick={onClose}>&times;</button>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">General</div>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Dashboard
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Profile
          </NavLink>
          <NavLink to="/notifications" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Notifications
          </NavLink>
          <NavLink to="/donation-history" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Donation History
          </NavLink>

          <div className="sidebar-section-title">Donations</div>
          <NavLink to="/book-appointment" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Book Appointment
          </NavLink>
          <NavLink to="/appointments" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            My Appointments
          </NavLink>
          <NavLink to="/urgent-requests" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Urgent Requests
          </NavLink>
          <NavLink to="/blood-banks" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
            Blood Banks
          </NavLink>

          {isAdmin && (
            <>
              <div className="sidebar-section-title">Admin</div>
              <NavLink to="/admin" end className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
                Admin Dashboard
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
                Manage Users
              </NavLink>
              <NavLink to="/admin/blood-banks" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
                Manage Blood Banks
              </NavLink>
              <NavLink to="/admin/appointments" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
                Manage Appointments
              </NavLink>
              <NavLink to="/admin/requests" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
                Manage Requests
              </NavLink>
              <NavLink to="/admin/feedback" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={onClose}>
                Manage Feedback
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-user">{user?.name}</p>
          <p className="sidebar-role">{user?.role}</p>
        </div>
      </aside>
    </>
  );
}
