import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const INIT_FORM = { name: '', address: '', city: '', phone: '', email: '', latitude: '', longitude: '', services: '', workingHours: '' };

export default function AdminBloodBanks() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(INIT_FORM);

  const fetchBanks = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    api.get(`/blood-bank?${params}`)
      .then((res) => setBanks(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load blood banks'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const handleEdit = (bank) => {
    setEditing(bank._id);
    setForm({
      name: bank.name || '',
      address: bank.address || '',
      city: bank.city || '',
      phone: bank.phone || '',
      email: bank.email || '',
      latitude: bank.latitude ?? '',
      longitude: bank.longitude ?? '',
      services: (bank.services || []).join(', '),
      workingHours: bank.workingHours || '',
    });
  };

  const handleSave = async (id) => {
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        services: form.services ? form.services.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      const res = await api.put(`/blood-bank/${id}`, payload);
      setBanks(banks.map((b) => (b._id === id ? res.data : b)));
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update blood bank');
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        services: form.services ? form.services.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      const res = await api.post('/blood-bank', payload);
      setBanks([res.data, ...banks]);
      setShowCreate(false);
      setForm(INIT_FORM);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create blood bank');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this blood bank?')) return;
    try {
      await api.delete(`/blood-bank/${id}`);
      setBanks(banks.filter((b) => b._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete blood bank');
    }
  };

  const renderForm = (isCreate = false) => (
    <div className="admin-bank-form">
      <div className="form-row">
        <label>Name <input className="table-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Phone <input className="table-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      </div>
      <div className="form-row">
        <label>Address <input className="table-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
        <label>City <input className="table-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
      </div>
      <div className="form-row">
        <label>Email <input className="table-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Working Hours <input className="table-input" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} /></label>
      </div>
      <div className="form-row">
        <label>Latitude <input className="table-input" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></label>
        <label>Longitude <input className="table-input" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></label>
      </div>
      <div className="form-row">
        <label className="form-full">Services (comma separated) <input className="table-input" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} /></label>
      </div>
    </div>
  );

  if (loading) return <div className="loading">Loading blood banks...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 className="page-title">Manage Blood Banks</h2>
        {!showCreate && <button className="btn btn-primary" onClick={() => { setShowCreate(true); setEditing(null); setForm(INIT_FORM); }}>+ Add Blood Bank</button>}
      </div>

      {error && <p className="error">{error}</p>}

      {showCreate && (
        <div className="detail-card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.8rem' }}>New Blood Bank</h3>
          {renderForm(true)}
          <div className="form-actions" style={{ marginTop: '0.8rem' }}>
            <button className="btn btn-success" onClick={handleCreate}>Create</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setForm(INIT_FORM); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Search by name, city, address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="table-count">{banks.length} blood bank{banks.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Services</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {banks.length === 0 ? (
              <tr><td colSpan={6} className="no-data">No blood banks found.</td></tr>
            ) : (
              banks.map((b) => (
                <tr key={b._id}>
                  {editing === b._id ? (
                    <td colSpan={6}>
                      {renderForm()}
                      <div className="form-actions" style={{ marginTop: '0.5rem' }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleSave(b._id)}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td><span className="cell-name">{b.name}</span></td>
                      <td>{b.city}</td>
                      <td className="cell-sub" style={{ fontSize: '0.8rem' }}>{b.address}</td>
                      <td>{b.phone}</td>
                      <td>
                        <div className="bank-services" style={{ margin: 0 }}>
                          {(b.services || []).map((s, i) => <span key={i} className="service-tag">{s}</span>)}
                          {(!b.services || b.services.length === 0) && <span className="cell-sub">-</span>}
                        </div>
                      </td>
                      <td className="actions-cell">
                        <button className="btn btn-primary btn-sm" onClick={() => handleEdit(b)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}>Delete</button>
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
