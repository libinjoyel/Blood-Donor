import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUSES = ['urgent', 'fulfilled', 'closed'];

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

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleEdit = (r) => {
    setEditing(r._id);
    setForm({
      hospital: r.hospital || '',
      bloodGroup: r.bloodGroup || '',
      units: r.units || 1,
      city: r.city || '',
      contact: r.contact || '',
      status: r.status || 'urgent',
    });
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

  const handleDelete = async (id) => {
    // No delete endpoint exists yet in admin routes, so we'll use the update to close it
    if (!confirm('Mark this request as closed?')) return;
    try {
      const res = await api.put(`/admin/urgent-requests/${id}`, { status: 'closed' });
      setRequests(requests.map((r) => (r._id === id ? res.data : r)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close request');
    }
  };

  const statusClass = (s) => {
    if (s === 'urgent') return 'status-urgent';
    if (s === 'fulfilled') return 'status-completed';
    return 'status-cancelled';
  };

  if (loading) return <div className="loading">Loading requests...</div>;

  return (
    <div className="admin-page">
      <h2 className="page-title">Manage Urgent Requests</h2>

      {error && <p className="error">{error}</p>}

      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Search hospital, city, contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="table-count">{requests.length} request{requests.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Hospital</th>
              <th>Blood</th>
              <th>Units</th>
              <th>City</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={8} className="no-data">No requests found.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r._id}>
                  {editing === r._id ? (
                    <>
                      <td><input className="table-input" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} /></td>
                      <td>
                        <select className="table-input" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                          {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </td>
                      <td><input className="table-input" type="number" min="1" value={form.units} onChange={(e) => setForm({ ...form, units: parseInt(e.target.value) || 1 })} /></td>
                      <td><input className="table-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></td>
                      <td><input className="table-input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></td>
                      <td>
                        <select className="table-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="actions-cell">
                        <button className="btn btn-success btn-sm" onClick={() => handleSave(r._id)}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{r.hospital}</td>
                      <td><span className="timeline-blood">{r.bloodGroup}</span></td>
                      <td>{r.units}</td>
                      <td>{r.city}</td>
                      <td>{r.contact}</td>
                      <td><span className={`req-status ${statusClass(r.status)}`}>{r.status}</span></td>
                      <td>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="actions-cell">
                        <button className="btn btn-primary btn-sm" onClick={() => handleEdit(r)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>Close</button>
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
  );
}
