import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading admin dashboard...</div>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  const { stats, bloodGroupStats, recentAppointments, recentDonations } = data;

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: '\uD83D\uDC65', color: '#3498db', link: '/admin/users' },
    { title: 'Donors', value: stats.totalDonors, icon: '\uD83E\uDEC0', color: '#2ecc71', link: '/admin/users' },
    { title: 'Blood Banks', value: stats.totalBloodBanks, icon: '\uD83C\uDFE5', color: '#e74c3c', link: '/admin/blood-banks' },
    { title: 'Appointments', value: stats.totalAppointments, icon: '\uD83D\uDCC5', color: '#9b59b6', link: '/admin/appointments' },
    { title: 'Donations', value: stats.totalDonations, icon: '\u2764', color: '#e67e22', link: '/admin/appointments' },
    { title: 'Requests', value: stats.totalRequests, icon: '\u26A0', color: '#f39c12', link: '/admin/requests' },
    { title: 'Feedback', value: stats.totalFeedback, icon: '\uD83D\uDCAC', color: '#1abc9c', link: '/admin/feedback' },
  ];

  return (
    <div className="admin-dashboard">
      <h2 className="dashboard-title">Admin Dashboard</h2>
      <p className="dashboard-welcome">System overview and management</p>

      <div className="admin-cards">
        {statCards.map((card, i) => (
          <Link to={card.link} key={i} className="dashboard-card admin-card-link" style={{ borderLeftColor: card.color }}>
            <div className="card-icon">{card.icon}</div>
            <div className="card-body">
              <h3>{card.title}</h3>
              <p className="card-value">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="admin-grid">
        {bloodGroupStats && bloodGroupStats.length > 0 && (
          <div className="detail-card">
            <h3>Donors by Blood Group</h3>
            <div className="blood-group-list">
              {bloodGroupStats.map((bg) => (
                <div key={bg._id} className="blood-group-item">
                  <span className="timeline-blood">{bg._id}</span>
                  <span className="bg-count">{bg.count} donor{bg.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentAppointments && recentAppointments.length > 0 && (
          <div className="detail-card">
            <h3>Recent Appointments</h3>
            {recentAppointments.map((a) => (
              <div key={a._id} className="recent-request-item">
                <div className="recent-request-left">
                  <div>
                    <p className="recent-hospital">{a.userId?.name || 'Unknown'} &rarr; {a.bloodBankId?.name || 'Unknown'}</p>
                    <p className="recent-meta">{new Date(a.date).toLocaleDateString('en-IN')} &middot; {a.time}</p>
                  </div>
                </div>
                <span className={`apt-status status-${a.status}`}>{a.status}</span>
              </div>
            ))}
            <Link to="/admin/appointments" className="view-all" style={{ marginTop: '0.5rem', display: 'inline-block' }}>View All</Link>
          </div>
        )}

        {recentDonations && recentDonations.length > 0 && (
          <div className="detail-card">
            <h3>Recent Donations</h3>
            {recentDonations.map((d) => (
              <div key={d._id} className="recent-request-item">
                <div className="recent-request-left">
                  <span className="timeline-blood">{d.bloodGroup}</span>
                  <div>
                    <p className="recent-hospital">{d.userId?.name || 'Unknown'}</p>
                    <p className="recent-meta">{d.bloodBankId?.name || 'Unknown'} &middot; {new Date(d.donationDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
