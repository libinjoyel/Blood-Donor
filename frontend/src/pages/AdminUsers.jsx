import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ROLES = ['donor', 'admin'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', bloodGroup: '', role: '', address: '', isEligible: true });

  const fetchUsers = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (roleFilter) params.append('role', roleFilter);

    api.get(`/admin/users?${params}`)
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user) => {
    setEditing(user._id);
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      bloodGroup: user.bloodGroup || '',
      role: user.role || 'donor',
      address: user.address || '',
      isEligible: user.isEligible !== undefined ? user.isEligible : true,
    });
  };

  const handleSave = async (id) => {
    try {
      const res = await api.put(`/admin/users/${id}`, form);
      setUsers(users.map((u) => (u._id === id ? res.data : u)));
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user and all associated data?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-page">
      <h2 className="page-title">Manage Users</h2>

      {error && <p className="error">{error}</p>}

      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Blood</th>
              <th>Role</th>
              <th>Donations</th>
              <th>Eligible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={8} className="no-data">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  {editing === u._id ? (
                    <>
                      <td><input className="table-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></td>
                      <td><input className="table-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></td>
                      <td><input className="table-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></td>
                      <td>
                        <select className="table-input" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                          {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="table-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>{u.donationCount}</td>
                      <td>
                        <select className="table-input" value={form.isEligible} onChange={(e) => setForm({ ...form, isEligible: e.target.value === 'true' })}>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </td>
                      <td className="actions-cell">
                        <button className="btn btn-success btn-sm" onClick={() => handleSave(u._id)}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td><span className="timeline-blood">{u.bloodGroup}</span></td>
                      <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                      <td>{u.donationCount}</td>
                      <td>{u.isEligible ? '\u2705' : '\u274C'}</td>
                      <td className="actions-cell">
                        <button className="btn btn-primary btn-sm" onClick={() => handleEdit(u)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>Delete</button>
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
