import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Loader2, Save, X, LogOut, CheckCircle, AlertCircle, Pencil } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] || '?').toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs font-medium text-slate-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-900 break-words min-w-0">{value || 'Not provided'}</span>
    </div>
  );
}

export default function ProfileCard({ onClose, cardClassName = 'fixed top-16 right-4' }) {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', bloodGroup: '', address: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/profile')
      .then((res) => {
        setUser(res.data);
        setForm({
          name: res.data.name || '', phone: res.data.phone || '',
          bloodGroup: res.data.bloodGroup || '', address: res.data.address || '',
          password: '',
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile'))
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
      const res = await api.put('/profile', payload);
      setUser(res.data);
      setForm({ ...res.data, password: '' });
      if (updateUser) updateUser(res.data);
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => { setEditing(false); setError(''); setSuccess(''); };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/25 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className={`absolute z-[70] w-[320px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in ${cardClassName}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={24} className="animate-spin text-rose-500" />
          </div>
        ) : error && !user ? (
          <div className="p-5 text-center">
            <AlertCircle size={28} className="mx-auto mb-2 text-rose-400" />
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {getInitials(user?.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                    <Droplets size={10} /> {user?.bloodGroup || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!editing && (
                  <button onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Edit profile">
                    <Pencil size={14} />
                  </button>
                )}
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Close">
                  <X size={14} />
                </button>
              </div>
            </div>

            {(error || success) && (
              <div className={`px-5 py-2 text-xs flex items-center gap-1.5 ${error ? 'text-rose-600' : 'text-emerald-600'}`}>
                {error ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                {error || success}
              </div>
            )}

            <div className="max-h-[50vh] overflow-y-auto">
              {!editing ? (
                <div className="px-5 py-2">
                  <DetailRow label="Email" value={user?.email} />
                  <DetailRow label="Phone" value={user?.phone} />
                  <DetailRow label="Blood Group" value={user?.bloodGroup} />
                  <DetailRow label="Address" value={user?.address} />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                    <input name="email" value={user?.email || ''} disabled
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                      <input name="phone" value={form.phone} onChange={handleChange} required
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Blood Group</label>
                      <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} required
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900">
                        {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                    <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">New Password (blank to keep)</label>
                    <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900" />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button type="submit" disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-all duration-200 shadow-sm">
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={handleCancel}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200">
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="border-t border-slate-100 p-2">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
