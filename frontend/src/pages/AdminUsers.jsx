import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, AlertCircle, Save, X, Edit3, Trash2, Droplets, Plus, User, Mail, Phone } from 'lucide-react';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EMPTY_ADD_FORM = { name: '', email: '', phone: '', bloodGroup: '' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', bloodGroup: '', address: '', isEligible: true });
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddForm, setShowAddForm] = useState(() => searchParams.get('add') === '1');
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [savingAdd, setSavingAdd] = useState(false);

  const fetchUsers = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('role', 'donor');
    api.get(`/admin/users?${params}`)
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load donors'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openAddForm = () => {
    setAddForm(EMPTY_ADD_FORM);
    setShowAddForm(true);
  };

  const closeAddForm = () => {
    setShowAddForm(false);
    setAddForm(EMPTY_ADD_FORM);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSavingAdd(true);
    setError('');
    try {
      await api.post('/admin/users', addForm);
      closeAddForm();
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add donor');
    } finally {
      setSavingAdd(false);
    }
  };

  const handleEdit = (u) => {
    setEditing(u._id);
    setForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', bloodGroup: u.bloodGroup || '', address: u.address || '', isEligible: u.isEligible !== undefined ? u.isEligible : true });
  };

  const handleSave = async (id) => {
    try {
      const res = await api.put(`/admin/users/${id}`, form);
      setUsers(users.map((u) => (u._id === id ? res.data : u)));
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update donor');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this donor and all associated data?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete donor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading donors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Donor Database</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage registered blood donors</p>
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{users.length} donor{users.length !== 1 ? 's' : ''}</span>
          <button onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 shadow-sm transition-all duration-200">
            <Plus size={16} />
            Add Donor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Donations</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Eligible</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No donors found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors duration-150">
                    {editing === u._id ? (
                      <>
                        <td className="px-4 py-3"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></td>
                        <td className="px-4 py-3"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></td>
                        <td className="px-4 py-3"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></td>
                        <td className="px-4 py-3"><select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">
                          {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                        </select></td>
                        <td className="px-4 py-3 text-slate-600">{u.donationCount}</td>
                        <td className="px-4 py-3"><select value={form.isEligible} onChange={(e) => setForm({ ...form, isEligible: e.target.value === 'true' })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">
                          <option value="true">Yes</option><option value="false">No</option>
                        </select></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleSave(u._id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"><Save size={14} /></button>
                            <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={14} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-semibold">{u.name?.charAt(0) || '?'}</div>
                            <span className="text-sm font-medium text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700"><Droplets size={10} className="mr-1" />{u.bloodGroup}</span></td>
                        <td className="px-4 py-3 text-slate-600">{u.donationCount}</td>
                        <td className="px-4 py-3">{u.isEligible ? <span className="text-emerald-600 text-xs font-medium">Eligible</span> : <span className="text-amber-600 text-xs font-medium">On hold</span>}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Edit3 size={14} /></button>
                            <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={closeAddForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add Donor</h2>
              <button onClick={closeAddForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required placeholder="John Doe"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required placeholder="john@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="tel" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="+1 (555) 123-4567"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Blood Group</label>
                  <div className="relative">
                    <Droplets size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                    <select value={addForm.bloodGroup} onChange={(e) => setAddForm({ ...addForm, bloodGroup: e.target.value })} required
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 appearance-none">
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-1">
                <button type="button" onClick={closeAddForm}
                  className="flex-1 h-10 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingAdd}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                  {savingAdd ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Add Donor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
