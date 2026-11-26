import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Save, X, Edit3 } from 'lucide-react';
import api from '../services/api';

const STATUSES = ['scheduled', 'completed', 'cancelled'];

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  const fetchAppointments = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    api.get(`/admin/appointments?${params}`)
      .then((res) => setAppointments(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load appointments'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleEdit = (apt) => { setEditing(apt._id); setEditStatus(apt.status); };

  const handleSave = async (id) => {
    try {
      const res = await api.put(`/admin/appointments/${id}`, { status: editStatus });
      setAppointments(appointments.map((a) => (a._id === id ? res.data : a)));
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Appointment Requests</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage donor appointment schedules</p>
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-400">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Donor</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Bank</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {appointments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No appointments found.</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-semibold">{a.userId?.name?.charAt(0) || '?'}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{a.userId?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{a.userId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">{a.userId?.bloodGroup || '-'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-900">{a.bloodBankId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{a.bloodBankId?.city || ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-4 py-3.5 text-slate-600">{a.time || '—'}</td>
                    <td className="px-4 py-3.5">
                      {editing === a._id ? (
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                          className="px-2 py-1 text-xs border border-slate-200 rounded-lg">
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          a.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                          a.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>{a.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {editing === a._id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleSave(a._id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"><Save size={14} /></button>
                          <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Edit3 size={14} /></button>
                      )}
                    </td>
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
