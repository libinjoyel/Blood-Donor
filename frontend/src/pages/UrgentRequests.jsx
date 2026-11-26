import { useState, useEffect } from 'react';
import { Search, AlertCircle, Loader2, Plus, X, CheckCircle, MapPin, Phone, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_TYPE_COLORS = {
  'A+': 'bg-blue-100 text-blue-700', 'A-': 'bg-blue-50 text-blue-600',
  'B+': 'bg-amber-100 text-amber-700', 'B-': 'bg-amber-50 text-amber-600',
  'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-50 text-purple-600',
  'O+': 'bg-emerald-100 text-emerald-700', 'O-': 'bg-emerald-50 text-emerald-600',
};

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

export default function UrgentRequests() {
  const { token } = useAuth();
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

  const fetchRequests = (params) => {
    setLoading(true);
    api.get('/urgent-requests', { params })
      .then((res) => {
        setRequests(res.data);
        setCities([...new Set(res.data.map((r) => r.city).filter(Boolean))].sort());
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

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
    setSearch(''); setBloodGroup(''); setCityFilter(''); setStatusFilter('');
    fetchRequests();
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!form.hospital || !form.bloodGroup || !form.units || !form.city || !form.contact) {
      setFormError('All fields are required'); return;
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Urgent Blood Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and post urgent blood donation requests</p>
        </div>
        {token ? (
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200 shadow-sm">
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Cancel' : 'Post Request'}
          </button>
        ) : (
          <Link to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200 shadow-sm">
            Sign in to Post
          </Link>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmitRequest} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Post Urgent Request</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="hospital" placeholder="Hospital Name" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
            <select name="bloodGroup" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900">
              <option value="">Blood Group</option>
              {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <input name="units" type="number" min="1" placeholder="Units Needed" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
            <input name="city" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
            <input name="contact" placeholder="Contact Number" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
          </div>
          {formError && <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 flex items-center gap-1"><AlertCircle size={12} /> {formError}</div>}
          {formSuccess && <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={12} /> {formSuccess}</div>}
          <button type="submit" className="w-full py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200">Submit Request</button>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-full sm:flex-1 sm:min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search hospital, city..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
        </div>
        <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700 bg-white">
          <option value="">All Blood</option>
          {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
        </select>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700 bg-white">
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700 bg-white">
          <option value="">All Status</option>
          <option value="urgent">Urgent</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="closed">Closed</option>
        </select>
        <button type="submit" className="px-3 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200"><Search size={14} className="inline" /></button>
        <button type="button" onClick={handleReset} className="px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-all duration-200"><RotateCcw size={14} className="inline" /></button>
      </form>

      {loading && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 size={28} className="animate-spin text-rose-500" />
        </div>
      )}
      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      {!loading && !error && (
        <div className="space-y-2">
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
              <CheckCircle size={44} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm text-slate-500 font-medium">No urgent requests found.</p>
              <p className="text-xs text-slate-400 mt-1">All blood type levels are currently stable.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req._id}
                onClick={() => setSelected(selected === req._id ? null : req._id)}
                className={`bg-white rounded-xl border shadow-sm transition-all duration-200 cursor-pointer ${
                  selected === req._id ? 'border-rose-300 shadow-md' : 'border-slate-100 hover:shadow-md'
                } ${req.status === 'urgent' ? 'border-l-4 border-l-rose-500' : ''}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900">{req.hospital}</h3>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${BLOOD_TYPE_COLORS[req.bloodGroup] || 'bg-slate-100 text-slate-700'}`}>{req.bloodGroup}</span>
                        <span>{req.units} unit{req.units > 1 ? 's' : ''} needed</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {req.city}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {selected === req._id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600 space-y-1">
                      <p className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> <a href={`tel:${req.contact}`} className="text-rose-600 hover:underline">{req.contact}</a></p>
                      <p><strong>Blood Group:</strong> {req.bloodGroup}</p>
                      <p><strong>Units:</strong> {req.units}</p>
                      <p><strong>City:</strong> {req.city}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
