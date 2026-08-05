import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Heart, Clock, CheckCircle, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import api from '../services/api';

function getIcon(type) {
  switch (type) {
    case 'donation_completed': return <Heart size={16} className="text-rose-500" />;
    case 'appointment_reminder': return <Clock size={16} className="text-blue-500" />;
    case 'eligibility': return <CheckCircle size={16} className="text-emerald-500" />;
    default: return <Bell size={16} className="text-slate-500" />;
  }
}

function formatTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

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

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stay updated with your donation activities</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200">
            <CheckCircle size={15} /> Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <Bell size={44} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500 font-medium">No notifications yet.</p>
          <p className="text-xs text-slate-400 mt-1">You will see updates about your donations and appointments here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.read && handleMarkAsRead(n._id)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                n.read
                  ? 'bg-white border-slate-100 hover:shadow-sm'
                  : 'bg-rose-50/50 border-rose-200 hover:shadow-sm'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-slate-100' : 'bg-rose-100'}`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>{n.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{formatTime(n.createdAt)}</span>
                  {n.link && (
                    <Link to={n.link} onClick={(e) => e.stopPropagation()}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5">
                      View <ChevronRight size={10} />
                    </Link>
                  )}
                </div>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
