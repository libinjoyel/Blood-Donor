import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Droplets, Loader2, Save, X, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-slate-50 last:border-0">
      <span className="text-sm font-medium text-slate-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-900">{value || 'Not provided'}</span>
    </div>
  );
}

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', bloodGroup: '', address: '', password: '',
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
          name: u.name || '', email: u.email || '',
          phone: u.phone || '', bloodGroup: u.bloodGroup || '',
          address: u.address || '', password: '',
        });
      })
      .catch((err) => {
        if (err.response?.status === 401) { logout(); navigate('/login'); }
        else setError('Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, [logout, navigate]);

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

  const handleCancel = () => { setEditing(false); setError(''); setSuccess(''); };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Profile & Eligibility</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your personal information</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200 shadow-sm">
              <User size={15} /> Edit Profile
            </button>
          ) : null}
          <button onClick={() => { logout(); navigate('/login'); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-600 flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {!editing ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
              <User size={28} className="text-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{form.name}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-rose-50 text-rose-700 border-rose-200">
                <Droplets size={11} /> {form.bloodGroup || 'N/A'}
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            <DetailRow label="Email" value={form.email} />
            <DetailRow label="Phone" value={form.phone} />
            <DetailRow label="Blood Group" value={form.bloodGroup} />
            <DetailRow label="Address" value={form.address} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input name="email" value={form.email} disabled
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Blood Group</label>
              <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900">
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password (leave blank to keep current)</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-all duration-200 shadow-sm">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200">
              <X size={15} /> Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
