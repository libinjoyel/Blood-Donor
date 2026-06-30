import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to load dashboard');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  const { user, stats } = data;

  const cards = [
    { title: 'Appointments', value: stats.totalAppointments, icon: '📅', color: '#3498db' },
    { title: 'Donation Count', value: stats.donationCount, icon: '🩸', color: '#e74c3c' },
    { title: 'Blood Group', value: stats.bloodGroup, icon: '🧬', color: '#2ecc71' },
    { title: 'Eligibility', value: stats.isEligible ? 'Eligible' : 'Not Eligible', icon: '✅', color: stats.isEligible ? '#27ae60' : '#e67e22' },
  ];

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Dashboard</h2>
      <p className="dashboard-welcome">Welcome back, {user.name}!</p>

      <div className="dashboard-cards">
        {cards.map((card, index) => (
          <div key={index} className="dashboard-card" style={{ borderLeftColor: card.color }}>
            <div className="card-icon">{card.icon}</div>
            <div className="card-body">
              <h3>{card.title}</h3>
              <p className="card-value">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-details">
        <div className="detail-card">
          <h3>Your Information</h3>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Blood Group:</strong> {user.bloodGroup}</p>
          <p><strong>Address:</strong> {user.address || 'Not provided'}</p>
        </div>
      </div>
    </div>
  );
}
