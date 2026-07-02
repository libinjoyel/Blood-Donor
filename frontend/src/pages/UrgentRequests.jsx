import { useState, useEffect } from 'react';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function UrgentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [cities, setCities] = useState([]);
  const [selected, setSelected] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ hospital: '', bloodGroup: '', units: '', city: '', contact: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = (params) => {
    setLoading(true);
    api.get('/urgent-requests', { params })
      .then((res) => {
        setRequests(res.data);
        const uniqueCities = [...new Set(res.data.map((r) => r.city).filter(Boolean))].sort();
        setCities(uniqueCities);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load requests'))
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (bloodGroup) params.bloodGroup = bloodGroup;
    if (cityFilter) params.city = cityFilter;
    if (statusFilter) params.status = statusFilter;
    fetchRequests(params);
  };

  const handleReset = () => {
    setSearch('');
    setBloodGroup('');
    setCityFilter('');
    setStatusFilter('');
    fetchRequests();
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!form.hospital || !form.bloodGroup || !form.units || !form.city || !form.contact) {
      setFormError('All fields are required');
      return;
    }
    try {
      await api.post('/urgent-requests', { ...form, units: Number(form.units) });
      setFormSuccess('Urgent request posted!');
      setForm({ hospital: '', bloodGroup: '', units: '', city: '', contact: '' });
      fetchRequests();
      setTimeout(() => setShowForm(false), 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to post request');
    }
  };

  const statusClass = (status) => {
    if (status === 'urgent') return 'status-urgent';
    if (status === 'fulfilled') return 'status-completed';
    return 'status-cancelled';
  };

  return (
    <div className="urgent-requests">
      <div className="page-header">
        <h2 className="page-title">Urgent Blood Requests</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Post Request'}
        </button>
      </div>

      {showForm && (
        <form className="urgent-form" onSubmit={handleSubmitRequest}>
          <h3>Post Urgent Request</h3>
          <input name="hospital" placeholder="Hospital Name" value={form.hospital} onChange={handleFormChange} />
          <select name="bloodGroup" value={form.bloodGroup} onChange={handleFormChange}>
            <option value="">Blood Group</option>
            {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <input name="units" type="number" min="1" placeholder="Units Needed" value={form.units} onChange={handleFormChange} />
          <input name="city" placeholder="City" value={form.city} onChange={handleFormChange} />
          <input name="contact" placeholder="Contact Number" value={form.contact} onChange={handleFormChange} />
          {formError && <p className="error">{formError}</p>}
          {formSuccess && <p className="success">{formSuccess}</p>}
          <button type="submit" className="btn btn-primary">Submit Request</button>
        </form>
      )}

      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search hospital, city, contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />
        <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="filter-select">
          <option value="">All Blood Groups</option>
          {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
        </select>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="filter-select">
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All Status</option>
          <option value="urgent">Urgent</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="closed">Closed</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
        <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
      </form>

      {loading && <div className="loading">Loading requests...</div>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="requests-content">
          <div className="requests-list">
            {requests.length === 0 ? (
              <p className="no-data">No urgent requests found.</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req._id}
                  className={`request-card ${selected === req._id ? 'selected' : ''}`}
                  onClick={() => setSelected(selected === req._id ? null : req._id)}
                >
                  <div className="request-header">
                    <h3>{req.hospital}</h3>
                    <span className={`req-status ${statusClass(req.status)}`}>{req.status}</span>
                  </div>
                  <div className="request-meta">
                    <span className={`blood-badge req-blood`}>{req.bloodGroup}</span>
                    <span className="req-units">{req.units} unit{req.units > 1 ? 's' : ''} needed</span>
                    <span className="req-city">{req.city}</span>
                  </div>
                  <p className="req-time">{new Date(req.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

                  {selected === req._id && (
                    <div className="request-details">
                      <p><strong>Contact:</strong> <a href={`tel:${req.contact}`}>{req.contact}</a></p>
                      <p><strong>Blood Group:</strong> {req.bloodGroup}</p>
                      <p><strong>Units:</strong> {req.units}</p>
                      <p><strong>City:</strong> {req.city}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
