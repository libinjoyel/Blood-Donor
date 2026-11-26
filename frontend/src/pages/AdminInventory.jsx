import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Loader2, Plus, X, Eye, Edit3, Trash2, Droplets,
  Lock, CheckCircle2, Ban, Save, CalendarDays, Package,
  AlertTriangle, Filter,
} from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from '../components/ConfirmDialog';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'Red Blood Cells', 'Plasma', 'Platelets'];
const STATUSES = ['Available', 'Reserved', 'Issued', 'Expired', 'Discarded'];

const STATUS_STYLES = {
  Available: 'bg-emerald-50 text-emerald-700',
  Reserved: 'bg-amber-50 text-amber-700',
  Issued: 'bg-blue-50 text-blue-700',
  Expired: 'bg-slate-100 text-slate-500',
  Discarded: 'bg-rose-50 text-rose-600',
};

const COMPONENT_SHELF_LIFE_DAYS = {
  'Whole Blood': 35,
  'Red Blood Cells': 42,
  'Plasma': 365,
  'Platelets': 5,
};

const EMPTY_FORM = {
  bloodGroup: '', component: '', donationDate: '', expiryDate: '', storageLocation: '', remarks: '',
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toInputDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-500'}`}>
      {status === 'Issued' && <CheckCircle2 size={10} />}
      {status === 'Reserved' && <Lock size={10} />}
      {status === 'Expired' && <AlertTriangle size={10} />}
      {status}
    </span>
  );
}

function Barcode({ value }) {
  if (!value) return <span className="text-xs text-slate-400">—</span>;
  const bars = value.split('').map((ch) => ({
    width: 1 + (ch.charCodeAt(0) % 4),
    margin: 1 + (ch.charCodeAt(0) % 2),
  }));
  return (
    <div>
      <div className="flex items-stretch h-12">
        {bars.map((b, i) => (
          <div key={i} style={{ width: b.width, marginRight: b.margin }} className="bg-slate-900" />
        ))}
      </div>
      <p className="text-center text-xs tracking-[0.25em] font-mono text-slate-500 mt-1">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white';

export default function AdminInventory() {
  const { toast, showToast, dismissToast } = useToast();
  const [searchParams] = useSearchParams();

  const [units, setUnits] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    bloodGroup: searchParams.get('bloodGroup') || '',
    component: '',
    storageLocation: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [viewUnit, setViewUnit] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  const [reserveUnit, setReserveUnit] = useState(null);
  const [reserveForm, setReserveForm] = useState({ reservedFor: '', remarks: '' });

  const [issueUnit, setIssueUnit] = useState(null);
  const [issueForm, setIssueForm] = useState({ patientName: '', hospital: '', doctor: '', remarks: '' });

  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [overview, setOverview] = useState(null);
  const [expiringOnly, setExpiringOnly] = useState(false);

  const hasFilters = Object.values(filters).some(Boolean);

  const fetchUnits = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    api.get(`/inventory/units?${params}`)
      .then((res) => setUnits(res.data))
      .catch(() => showToast('Failed to load blood units', 'error'))
      .finally(() => setLoading(false));
  }, [search, filters, showToast]);

  const fetchLocations = useCallback(() => {
    api.get('/inventory/locations').then((res) => setLocations(res.data || [])).catch(() => {});
  }, []);

  const fetchOverview = useCallback(() => {
    api.get('/inventory/overview').then((res) => setOverview(res.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);
  useEffect(() => { fetchLocations(); }, [fetchLocations]);
  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const expiryPreview = useMemo(() => {
    if (form.component && form.donationDate) {
      return toInputDate(addDays(new Date(form.donationDate), COMPONENT_SHELF_LIFE_DAYS[form.component] || 35));
    }
    return '';
  }, [form.component, form.donationDate]);

  const isExpiringSoon = (u) => {
    if (!u.expiryDate || !['Available', 'Reserved'].includes(u.status)) return false;
    const expiry = new Date(u.expiryDate);
    const now = new Date();
    if (expiry < now) return false;
    return expiry <= addDays(now, 7);
  };

  const visibleUnits = useMemo(() => {
    if (!expiringOnly) return units;
    return units.filter(isExpiringSoon);
  }, [units, expiringOnly]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditingId(u._id);
    setForm({
      bloodGroup: u.bloodGroup || '',
      component: u.component || '',
      donationDate: toInputDate(u.donationDate),
      expiryDate: toInputDate(u.expiryDate),
      storageLocation: u.storageLocation || '',
      remarks: u.remarks || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        bloodGroup: form.bloodGroup,
        component: form.component,
        donationDate: form.donationDate,
        expiryDate: form.expiryDate || expiryPreview || undefined,
        storageLocation: form.storageLocation,
        remarks: form.remarks,
      };
      if (editingId) {
        await api.put(`/inventory/units/${editingId}`, payload);
        showToast('Blood unit updated');
      } else {
        await api.post('/inventory/units', payload);
        showToast('Blood unit added to inventory');
      }
      closeForm();
      fetchUnits();
      fetchLocations();
      fetchOverview();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save blood unit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openView = async (u) => {
    setViewUnit(u);
    setTxLoading(true);
    try {
      const res = await api.get(`/inventory/transactions?bloodUnit=${u._id}`);
      setTransactions(res.data || []);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  const openReserve = (u) => {
    setReserveUnit(u);
    setReserveForm({ reservedFor: '', remarks: '' });
  };

  const handleReserve = async () => {
    if (!reserveForm.reservedFor.trim()) {
      showToast('Patient / requester name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/inventory/units/${reserveUnit._id}/reserve`, reserveForm);
      showToast(`Unit ${reserveUnit.unitId} reserved`);
      setReserveUnit(null);
      fetchUnits();
      fetchOverview();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reserve unit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openIssue = (u) => {
    setIssueUnit(u);
    setIssueForm({ patientName: '', hospital: '', doctor: '', remarks: '' });
  };

  const handleIssue = async () => {
    if (!issueForm.patientName.trim()) {
      showToast('Patient name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/inventory/units/${issueUnit._id}/issue`, issueForm);
      showToast(`Unit ${issueUnit.unitId} issued to ${issueForm.patientName}`);
      setIssueUnit(null);
      fetchUnits();
      fetchOverview();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to issue unit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === 'discard') {
        await api.put(`/inventory/units/${confirm.unit._id}/discard`, { remarks: confirm.remarks || '' });
        showToast(`Unit ${confirm.unit.unitId} discarded`);
      } else if (confirm.type === 'delete') {
        await api.delete(`/inventory/units/${confirm.unit._id}`);
        showToast(`Unit ${confirm.unit.unitId} deleted`);
      }
      setConfirm(null);
      fetchUnits();
      fetchOverview();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Toast toast={toast} onClose={dismissToast} />

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Blood Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage blood units, reservations, issues and expiry</p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 shadow-sm transition-all duration-200">
          <Plus size={16} />
          Add Blood Unit
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Available', value: overview?.stats?.totalAvailable ?? 0, cls: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Reserved', value: overview?.stats?.totalReserved ?? 0, cls: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Issued', value: overview?.stats?.totalIssued ?? 0, cls: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Expiring Soon', value: overview?.stats?.expiringSoon ?? 0, cls: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Expired', value: overview?.stats?.totalExpired ?? 0, cls: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-4`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Unit ID, Barcode, Storage Location, Remarks..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
            </div>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="flex-1 sm:flex-none px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white">
              <option value="">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.bloodGroup} onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
              className="flex-1 sm:flex-none px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white">
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filters.component} onChange={(e) => setFilters({ ...filters, component: e.target.value })}
              className="flex-1 sm:flex-none px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white">
              <option value="">All Components</option>
              {COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.storageLocation} onChange={(e) => setFilters({ ...filters, storageLocation: e.target.value })}
              className="flex-1 sm:flex-none px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white">
              <option value="">All Locations</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            {hasFilters && (
              <button onClick={() => setFilters({ status: '', bloodGroup: '', component: '', storageLocation: '' })}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                <Filter size={14} /> Clear
              </button>
            )}
            <button
              onClick={() => setExpiringOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                expiringOnly
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              <AlertTriangle size={14} />
              Expiring Soon
            </button>
            <span className="text-xs text-slate-400 ml-auto">{visibleUnits.length} unit{visibleUnits.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-rose-500" />
          </div>
        ) : visibleUnits.length === 0 ? (
          <div className="p-14 text-center">
            <Package size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500 font-medium">No blood units found.</p>
            <p className="text-xs text-slate-400 mt-1">Add a blood unit or adjust your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit ID</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Component</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Donation</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiry</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visibleUnits.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3">
                      <button onClick={() => openView(u)} className="text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors">{u.unitId}</button>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wide">{u.barcode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">
                        <Droplets size={10} /> {u.bloodGroup}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{u.component}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(u.donationDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`${u.expiryDate && new Date(u.expiryDate) < new Date() && ['Available', 'Reserved'].includes(u.status) ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                        {formatDate(u.expiryDate)}
                      </span>
                      {isExpiringSoon(u) && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-600">
                          <AlertTriangle size={9} /> Expiring soon
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.storageLocation || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openView(u)} title="View" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Eye size={14} /></button>
                        <button onClick={() => openEdit(u)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit3 size={14} /></button>
                        {u.status === 'Available' && (
                          <button onClick={() => openReserve(u)} title="Reserve" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Lock size={14} /></button>
                        )}
                        {['Available', 'Reserved'].includes(u.status) && (
                          <button onClick={() => openIssue(u)} title="Issue" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><CheckCircle2 size={14} /></button>
                        )}
                        {u.status !== 'Discarded' && u.status !== 'Issued' && (
                          <button onClick={() => setConfirm({ type: 'discard', unit: u, remarks: '' })} title="Discard" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Ban size={14} /></button>
                        )}
                        <button onClick={() => setConfirm({ type: 'delete', unit: u })} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Blood Unit' : 'Add Blood Unit'}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Blood Group">
                  <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} required className={inputCls}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Component">
                  <select value={form.component} onChange={(e) => setForm({ ...form, component: e.target.value })} required className={inputCls}>
                    <option value="">Select</option>
                    {COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Storage Location">
                  <input list="storage-locations" value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} placeholder="Fridge A - Shelf 2"
                    className={inputCls} />
                  <datalist id="storage-locations">
                    {locations.map((l) => <option key={l} value={l} />)}
                  </datalist>
                </Field>
                <Field label="Donation Date">
                  <input type="date" value={form.donationDate} onChange={(e) => setForm({ ...form, donationDate: e.target.value })} required className={inputCls} />
                </Field>
                <Field label="Expiry Date">
                  <input type="date" value={form.expiryDate || expiryPreview} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={inputCls} />
                  {!form.expiryDate && expiryPreview && (
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><CalendarDays size={11} /> Auto: {expiryPreview} ({COMPONENT_SHELF_LIFE_DAYS[form.component]} days)</p>
                  )}
                </Field>
              </div>
              <Field label="Remarks">
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} placeholder="Optional notes"
                  className={`${inputCls} resize-none`} />
              </Field>
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={closeForm}
                  className="flex-1 h-10 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {editingId ? 'Save Changes' : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewUnit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setViewUnit(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{viewUnit.unitId}</h2>
                <p className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">Barcode: {viewUnit.barcode}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={viewUnit.status} />
                <button onClick={() => setViewUnit(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Blood Group</p><p className="text-sm font-bold text-rose-700 mt-0.5">{viewUnit.bloodGroup}</p></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Component</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{viewUnit.component}</p></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Storage Location</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{viewUnit.storageLocation || '—'}</p></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Donation Date</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{formatDate(viewUnit.donationDate)}</p></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Expiry Date</p><p className={`text-sm font-semibold mt-0.5 ${viewUnit.expiryDate && new Date(viewUnit.expiryDate) < new Date() ? 'text-rose-600' : 'text-slate-800'}`}>{formatDate(viewUnit.expiryDate)}</p></div>
              {viewUnit.reservedFor && (
                <div className="bg-slate-50 rounded-xl p-3 sm:col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Reserved For</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{viewUnit.reservedFor}</p></div>
              )}
              {viewUnit.issuedTo?.patientName && (
                <div className="bg-slate-50 rounded-xl p-3 sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Issued To</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{viewUnit.issuedTo.patientName}{viewUnit.issuedTo.hospital ? ` · ${viewUnit.issuedTo.hospital}` : ''}{viewUnit.issuedTo.doctor ? ` · Dr. ${viewUnit.issuedTo.doctor}` : ''}</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 mb-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Barcode</p>
              <Barcode value={viewUnit.barcode} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Transaction History</p>
              {txLoading ? (
                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-rose-500" /></div>
              ) : transactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No transactions yet.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {transactions.map((t) => (
                    <div key={t._id} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-rose-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800">
                          {t.action}
                          <span className="text-slate-400 font-normal"> · {new Date(t.actionDate).toLocaleString()}</span>
                        </p>
                        {t.notes && <p className="text-xs text-slate-500 mt-0.5">{t.notes}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">By {t.performedByName || 'System'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {reserveUnit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setReserveUnit(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-900">Reserve Unit</h2>
              <button onClick={() => setReserveUnit(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Reserving <span className="font-semibold text-rose-600">{reserveUnit.unitId}</span> ({reserveUnit.bloodGroup} · {reserveUnit.component})</p>
            <div className="flex flex-col gap-4">
              <Field label="Patient / Requester Name">
                <input type="text" value={reserveForm.reservedFor} onChange={(e) => setReserveForm({ ...reserveForm, reservedFor: e.target.value })} placeholder="e.g. Patient name or doctor" className={inputCls} />
              </Field>
              <Field label="Remarks">
                <textarea value={reserveForm.remarks} onChange={(e) => setReserveForm({ ...reserveForm, remarks: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </Field>
              <div className="flex gap-3 mt-1">
                <button onClick={() => setReserveUnit(null)} className="flex-1 h-10 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleReserve} disabled={saving}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                  Reserve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {issueUnit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setIssueUnit(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-900">Issue Blood Unit</h2>
              <button onClick={() => setIssueUnit(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Issuing <span className="font-semibold text-rose-600">{issueUnit.unitId}</span> ({issueUnit.bloodGroup} · {issueUnit.component})</p>
            <div className="flex flex-col gap-4">
              <Field label="Patient Name">
                <input type="text" value={issueForm.patientName} onChange={(e) => setIssueForm({ ...issueForm, patientName: e.target.value })} placeholder="Patient name" className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Hospital">
                  <input type="text" value={issueForm.hospital} onChange={(e) => setIssueForm({ ...issueForm, hospital: e.target.value })} placeholder="Hospital" className={inputCls} />
                </Field>
                <Field label="Doctor">
                  <input type="text" value={issueForm.doctor} onChange={(e) => setIssueForm({ ...issueForm, doctor: e.target.value })} placeholder="Doctor name" className={inputCls} />
                </Field>
              </div>
              <Field label="Remarks">
                <textarea value={issueForm.remarks} onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </Field>
              <div className="flex gap-3 mt-1">
                <button onClick={() => setIssueUnit(null)} className="flex-1 h-10 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleIssue} disabled={saving}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Issue Unit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'delete' ? 'Delete Blood Unit' : 'Discard Blood Unit'}
        message={confirm?.type === 'delete'
          ? `Delete unit ${confirm?.unit?.unitId}? Its record will be removed from inventory but history is retained.`
          : `Discard unit ${confirm?.unit?.unitId}? This will mark it as discarded and remove it from available stock.`}
        confirmLabel={confirm?.type === 'delete' ? 'Delete' : 'Discard'}
        loading={confirmLoading}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
