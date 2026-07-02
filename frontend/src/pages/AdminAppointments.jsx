import { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleEdit = (apt) => {
    setEditing(apt._id);
    setEditStatus(apt.status);
  };

  const handleSave = async (id) => {
    try {
      const res = await api.put(`/admin/appointments/${id}`, { status: editStatus });
      setAppointments(appointments.map((a) => (a._id === id ? res.data : a)));
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment');
    }
  };

  const statusClass = (s) => {
    if (s === 'scheduled') return 'status-scheduled';
    if (s === 'completed') return 'status-completed';
    return 'status-cancelled';
  };

  if (loading) return <div className="loading">Loading appointments...</div>;

  return (
    <div className="admin-page">
      <h2 className="page-title">Manage Appointments</h2>

      {error && <p className="error">{error}</p>}

      <div className="filter-bar">
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="table-count">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Donor</th>
              <th>Blood</th>
              <th>Blood Bank</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan={7} className="no-data">No appointments found.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a._id}>
                  <td>
                    <div className="cell-name">{a.userId?.name || 'Unknown'}</div>
                    <div className="cell-sub">{a.userId?.email || ''}</div>
                  </td>
                  <td><span className="timeline-blood">{a.userId?.bloodGroup || '-'}</span></td>
                  <td>{a.bloodBankId?.name || 'Unknown'}<br /><span className="cell-sub">{a.bloodBankId?.city || ''}</span></td>
                  <td>{new Date(a.date).toLocaleDateString('en-IN')}</td>
                  <td>{a.time}</td>
                  <td>
                    {editing === a._id ? (
                      <select className="table-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`apt-status ${statusClass(a.status)}`}>{a.status}</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    {editing === a._id ? (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleSave(a._id)}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleEdit(a)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
