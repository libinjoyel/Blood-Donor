import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(() => {
    api.get('/notifications')
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'donation_completed': return '\u2764';
      case 'appointment_reminder': return '\u23F0';
      case 'eligibility': return '\u2705';
      default: return '\uD83D\uDD14';
    }
  };

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) return <div className="loading">Loading notifications...</div>;

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h2 className="page-title">Notifications</h2>
        {unreadCount > 0 && (
          <button className="btn btn-primary btn-sm" onClick={handleMarkAllAsRead}>
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {notifications.length === 0 ? (
        <p className="no-data">No notifications yet.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`notification-item ${n.read ? '' : 'notification--unread'}`}
              onClick={() => !n.read && handleMarkAsRead(n._id)}
            >
              <span className="notif-icon">{getIcon(n.type)}</span>
              <div className="notif-content">
                <p className="notif-message">{n.message}</p>
                <div className="notif-meta">
                  <span className="notif-time">{formatTime(n.createdAt)}</span>
                  {n.link && (
                    <Link to={n.link} className="notif-link" onClick={(e) => e.stopPropagation()}>View</Link>
                  )}
                </div>
              </div>
              {!n.read && <span className="notif-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
