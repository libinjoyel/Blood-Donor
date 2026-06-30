import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Profile() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    address: '',
    password: '',
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/profile')
      .then((res) => {
        const u = res.data;
        setForm({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          bloodGroup: u.bloodGroup || '',
          address: u.address || '',
          password: '',
        });
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        } else {
          setError('Failed to load profile');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      delete payload.email;
      const res = await api.put('/profile', payload);
      setForm({ ...res.data, password: '' });
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile">
      <div className="profile-header">
        <h2>Profile</h2>
        <div className="profile-actions">
          {!editing ? (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          ) : null}
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {!editing ? (
        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Name</span>
            <span className="detail-value">{form.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value">{form.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phone</span>
            <span className="detail-value">{form.phone}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Blood Group</span>
            <span className="detail-value">{form.bloodGroup}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Address</span>
            <span className="detail-value">{form.address || 'Not provided'}</span>
          </div>
        </div>
      ) : (
        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input name="email" value={form.email} disabled />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            Blood Group
            <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} required>
              {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </label>
          <label>
            Address
            <textarea name="address" value={form.address} onChange={handleChange} rows={3} />
          </label>
          <label>
            New Password (leave blank to keep current)
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
