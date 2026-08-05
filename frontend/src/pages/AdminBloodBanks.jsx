import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Save, X, Edit3, Trash2, Plus, Building2, MapPin, Phone, Mail } from 'lucide-react';
import api from '../services/api';

const INIT_FORM = { name: '', address: '', city: '', phone: '', email: '', latitude: '', longitude: '', services: '', workingHours: '' };

function BankFormFields({ form, setForm }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div><label className="block text-xs font-medium text-slate-500 mb-1">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
      <div><label className="block text-xs font-medium text-slate-500 mb-1">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
      <div><label className="block text-xs font-medium text-slate-500 mb-1">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
      <div><label className="block text-xs font-medium text-slate-500 mb-1">City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
      <div><label className="block text-xs font-medium text-slate-500 mb-1">Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
      <div><label className="block text-xs font-medium text-slate-500 mb-1">Working Hours</label><input value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
      <div><label className="block text-xs font-medium text-slate-500 mb-1">Latitude</label><input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
      <div><label className="block text-xs font-medium text-slate-500 mb-1">Longitude</label><input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
      <div className="col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Services (comma separated)</label><input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" /></div>
    </div>
  );
}

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

  useEffect(() => { fetchBanks(); }, [fetchBanks]);

  const handleEdit = (bank) => {
    setEditing(bank._id);
    setForm({ name: bank.name || '', address: bank.address || '', city: bank.city || '', phone: bank.phone || '', email: bank.email || '', latitude: bank.latitude ?? '', longitude: bank.longitude ?? '', services: (bank.services || []).join(', '), workingHours: bank.workingHours || '' });
  };

  const handleSave = async (id) => {
    try {
      const payload = { ...form, latitude: form.latitude ? parseFloat(form.latitude) : undefined, longitude: form.longitude ? parseFloat(form.longitude) : undefined, services: form.services ? form.services.split(',').map((s) => s.trim()).filter(Boolean) : [] };
      const res = await api.put(`/blood-bank/${id}`, payload);
      setBanks(banks.map((b) => (b._id === id ? res.data : b)));
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update blood bank');
    }
  };

  const handleCreate = async () => {
    try {
      const payload = { ...form, latitude: form.latitude ? parseFloat(form.latitude) : undefined, longitude: form.longitude ? parseFloat(form.longitude) : undefined, services: form.services ? form.services.split(',').map((s) => s.trim()).filter(Boolean) : [] };
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading blood banks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Blood Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage blood bank locations and information</p>
        </div>
        {!showCreate && (
          <button onClick={() => { setShowCreate(true); setEditing(null); setForm(INIT_FORM); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200 shadow-sm">
            <Plus size={15} /> Add Blood Bank
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">New Blood Bank</h3>
                  <BankFormFields form={form} setForm={setForm} />
          <div className="flex items-center gap-2 mt-4">
            <button onClick={handleCreate} className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200">Create</button>
            <button onClick={() => { setShowCreate(false); setForm(INIT_FORM); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, city, address..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
        </div>
        <span className="text-xs text-slate-400">{banks.length} blood bank{banks.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3">
        {banks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
            <Building2 size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500 font-medium">No blood banks found.</p>
          </div>
        ) : (
          banks.map((b) => (
            <div key={b._id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {editing === b._id ? (
                <div className="p-5">
          <BankFormFields form={form} setForm={setForm} />
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={() => handleSave(b._id)} className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all duration-200"><Save size={14} /> Save</button>
                    <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"><X size={14} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">{b.name}</h3>
                      <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                        <p className="flex items-center gap-1"><MapPin size={12} /> {b.city}{b.address ? `, ${b.address}` : ''}</p>
                        {b.phone && <p className="flex items-center gap-1"><Phone size={12} /> {b.phone}</p>}
                        {b.email && <p className="flex items-center gap-1"><Mail size={12} /> {b.email}</p>}
                      </div>
                      {b.services && b.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {b.services.map((s, i) => <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600">{s}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(b._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
