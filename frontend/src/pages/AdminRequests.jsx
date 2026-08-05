import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Save, X, Edit3 } from 'lucide-react';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUSES = ['urgent', 'fulfilled', 'closed'];

function StatusBadge({ status }) {
  const styles = {
    urgent: 'bg-rose-50 text-rose-600 border border-rose-200',
    fulfilled: 'bg-emerald-50 text-emerald-600',
    closed: 'bg-slate-100 text-slate-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ hospital: '', bloodGroup: '', units: 1, city: '', contact: '', status: 'urgent' });

  const fetchRequests = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);
    api.get(`/admin/urgent-requests?${params}`)
      .then((res) => setRequests(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load requests'))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleEdit = (r) => {
    setEditing(r._id);
    setForm({ hospital: r.hospital || '', bloodGroup: r.bloodGroup || '', units: r.units || 1, city: r.city || '', contact: r.contact || '', status: r.status || 'urgent' });
  };

  const handleSave = async (id) => {
    try {
      const res = await api.put(`/admin/urgent-requests/${id}`, form);
      setRequests(requests.map((r) => (r._id === id ? res.data : r)));
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Blood Requests</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage urgent blood requests from hospitals</p>
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search hospital, city..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-400">{requests.length} request{requests.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hospital</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Units</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">City</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">No requests found.</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors duration-150">
                    {editing === r._id ? (
                      <>
                        <td className="px-4 py-3"><input value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></td>
                        <td className="px-4 py-3"><select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">{BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}</select></td>
                        <td className="px-4 py-3"><input type="number" min="1" value={form.units} onChange={(e) => setForm({ ...form, units: parseInt(e.target.value) || 1 })}
                          className="w-20 px-2 py-1.5 text-sm border border-slate-200 rounded-lg" /></td>
                        <td className="px-4 py-3"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" /></td>
                        <td className="px-4 py-3"><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" /></td>
                        <td className="px-4 py-3"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleSave(r._id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"><Save size={14} /></button>
                            <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={14} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3"><span className="text-sm font-medium text-slate-900">{r.hospital}</span></td>
                        <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">{r.bloodGroup}</span></td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{r.units}</td>
                        <td className="px-4 py-3 text-slate-600">{r.city}</td>
                        <td className="px-4 py-3 text-slate-600">{r.contact}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Edit3 size={14} /></button>
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
    </div>
  );
}
