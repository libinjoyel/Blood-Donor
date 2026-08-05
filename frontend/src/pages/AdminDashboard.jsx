import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Bell, ChevronDown, LogOut, Settings,
  Droplets, Calendar, AlertTriangle, CheckCircle, X,
  Building2, Phone, Clock, ChevronLeft, ChevronRight,
  Hospital, Loader2, User, ArrowUpDown,
  BadgeCheck, Ban, FlaskConical, Edit3,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ALL_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_TYPE_INFO = {
  'A+':  { compatible: 'A+, AB+', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500' },
  'A-':  { compatible: 'A+, A-, AB+, AB-', bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-600', bar: 'bg-blue-400' },
  'B+':  { compatible: 'B+, AB+', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
  'B-':  { compatible: 'B+, B-, AB+, AB-', bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-600', bar: 'bg-amber-400' },
  'AB+': { compatible: 'AB+ only', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', bar: 'bg-purple-500' },
  'AB-': { compatible: 'AB+, AB-', bg: 'bg-purple-50/50', border: 'border-purple-200', text: 'text-purple-600', bar: 'bg-purple-400' },
  'O+':  { compatible: 'O+, A+, B+, AB+', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  'O-':  { compatible: 'Universal', bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-400' },
};

const CRITICAL_THRESHOLD_UNITS = 10;

function getInitials(name) {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  try {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return timeStr;
  }
}

function usePagination(items, pageSize = 5) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil((items || []).length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = (items || []).slice(safePage * pageSize, (safePage + 1) * pageSize);
  return { page: safePage, setPage, totalPages, pageItems };
}

function useSortable(items, defaultKey) {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    if (!items) return [];
    const arr = [...items];
    arr.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [items, sortKey, sortAsc]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  return { sorted, sortKey, sortAsc, toggleSort };
}

function SortHeader({ label, sortKey, currentKey, onToggle }) {
  const active = currentKey === sortKey;
  return (
    <button
      onClick={() => onToggle(sortKey)}
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
    >
      {label}
      <ArrowUpDown size={12} className={`transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
    </button>
  );
}

function StatCard({ title, value, icon, accent, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all duration-200 flex flex-col min-h-[150px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate pr-2">{title}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent || 'bg-slate-100 text-slate-500'}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-auto leading-snug">{sub}</p>}
    </div>
  );
}

function BloodStockCard({ type, info, stock, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(stock?.units ?? 0);
  const units = stock?.units ?? 0;
  const critical = units < CRITICAL_THRESHOLD_UNITS;
  return (
    <div className={`relative rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
      critical ? 'border-rose-300 bg-rose-50/30 animate-pulse-soft' : info.border + ' ' + info.bg
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-lg font-bold ${info.text}`}>{type}</span>
        {critical && <AlertTriangle size={16} className="text-rose-500" />}
      </div>
      {editing ? (
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            <button
              onClick={() => { onUpdate(type, value); setEditing(false); }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Save
            </button>
          </div>
          <button
            onClick={() => { setEditing(false); setValue(units); }}
            className="mt-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div className="mb-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">{units} Units</span>
              <span className={`font-semibold ${critical ? 'text-rose-600' : 'text-slate-600'}`}>{critical ? 'LOW' : 'In Stock'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
            <span>Compatible: {info.compatible}</span>
            <button
              onClick={() => { setValue(units); setEditing(true); }}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-600 bg-white/80 border border-slate-200 rounded-lg hover:text-rose-600 hover:border-rose-300 transition-colors"
            >
              <Edit3 size={10} /> Update
            </button>
          </div>
        </>
      )}
      {critical && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-100 rounded px-1.5 py-0.5">
          <AlertTriangle size={10} />
          LOW STOCK
        </div>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
      <span className="text-xs text-slate-400">Page {page + 1} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => setPage(i)}
            className={`min-w-[28px] h-7 text-xs font-medium rounded-md transition-colors ${
              i === page ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}>
            {i + 1}
          </button>
        ))}
        <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

const APPT_STATUS_MAP = {
  scheduled: { label: 'Pending', class: 'bg-amber-50 text-amber-600' },
  completed: { label: 'Arrived', class: 'bg-emerald-50 text-emerald-600' },
  cancelled: { label: 'No Show', class: 'bg-rose-50 text-rose-600' },
};

const URGENCY_MAP = {
  urgent: { label: 'Emergency', class: 'bg-rose-50 text-rose-600 border border-rose-200' },
  fulfilled: { label: 'Fulfilled', class: 'bg-emerald-50 text-emerald-600' },
  closed: { label: 'Closed', class: 'bg-slate-100 text-slate-400' },
};

function StatusBadge({ status, type }) {
  const map = type === 'urgency' ? URGENCY_MAP : APPT_STATUS_MAP;
  const s = (status || '').toLowerCase();
  const entry = map[s] || { label: status, class: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.class}`}>
      {s === 'urgent' && <AlertTriangle size={10} />}
      {s === 'fulfilled' && <CheckCircle size={10} />}
      {entry.label}
    </span>
  );
}

export default function AdminDashboard() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [stock, setStock] = useState({});
  const [allAppointments, setAllAppointments] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [statsRes, aptsRes, reqsRes, stockRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/appointments'),
          api.get('/admin/urgent-requests'),
          api.get('/admin/blood-stock'),
        ]);
        if (cancelled) return;
        setStats(statsRes.data.stats);
        const stockMap = {};
        (stockRes.data || []).forEach((s) => { stockMap[s.bloodGroup] = s; });
        setStock(stockMap);
        setAllAppointments(aptsRes.data || []);
        setAllRequests(reqsRes.data || []);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) { logout(); navigate('/login'); return; }
        setError(err.response?.data?.message || 'Failed to load admin data');
      } finally { if (!cancelled) setLoading(false); }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [logout, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const criticalShortages = useMemo(() => {
    return ALL_BLOOD_TYPES.filter((bt) => (stock[bt]?.units ?? 0) < CRITICAL_THRESHOLD_UNITS).length;
  }, [stock]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = useMemo(() => {
    return allAppointments.filter((a) => {
      const d = a.date ? new Date(a.date).toISOString().split('T')[0] : '';
      return d === todayStr && a.status === 'scheduled';
    });
  }, [allAppointments, todayStr]);

  const urgentRequests = useMemo(() => {
    return allRequests.filter((r) => r.status === 'urgent');
  }, [allRequests]);

  const aptSort = useSortable(allAppointments, 'date');
  const aptPag = usePagination(aptSort.sorted);

  const reqSort = useSortable(urgentRequests, 'createdAt');
  const reqPag = usePagination(reqSort.sorted);

  const handleCheckIn = async (id) => {
    setCheckingIn(id);
    try {
      await api.put(`/admin/appointments/${id}`, { status: 'completed' });
      setAllAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status: 'completed' } : a));
    } catch {
      setError('Failed to check in');
    } finally { setCheckingIn(null); }
  };

  const handleRequestAction = async (id, newStatus) => {
    try {
      await api.put(`/admin/urgent-requests/${id}`, { status: newStatus });
      setAllRequests((prev) => prev.map((r) => r._id === id ? { ...r, status: newStatus } : r));
    } catch {
      setError('Failed to update request');
    }
  };

  const handleUpdateStock = async (bloodGroup, units) => {
    try {
      const res = await api.put(`/admin/blood-stock/${encodeURIComponent(bloodGroup)}`, { units });
      setStock((prev) => ({ ...prev, [bloodGroup]: res.data }));
    } catch {
      setError('Failed to update stock');
    }
  };

  const totalUnits = useMemo(() => {
    return ALL_BLOOD_TYPES.reduce((sum, bt) => sum + (stock[bt]?.units ?? 0), 0);
  }, [stock]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const adminName = authUser?.name || 'Admin';
  const initials = getInitials(adminName);

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex items-center flex-1 min-w-[200px] max-w-md">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search donors by name, blood type, or phone..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 placeholder:text-slate-400"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/users?add=1"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 shadow-sm transition-all duration-200"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add New Donor</span>
          </Link>

          <Link to="/notifications" className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200">
            <Bell size={20} />
          </Link>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              onBlur={() => setTimeout(() => setProfileOpen(false), 150)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{adminName}</p>
                  <p className="text-xs text-slate-400">Administrator</p>
                </div>
                <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                  <User size={15} /> Profile
                </button>
                <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                  <Settings size={15} /> Settings
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Available Units" value={totalUnits} icon={<Droplets size={20} className="text-rose-500" />} accent="bg-rose-50 text-rose-500" sub="Across all blood types" />
        <StatCard title="Pending Requests" value={stats?.totalRequests || 0} icon={<AlertTriangle size={20} className="text-amber-500" />} accent="bg-amber-50 text-amber-500" sub={`${urgentRequests.length} urgent`} />
        <StatCard title="Appointments Today" value={todayAppts.length} icon={<Calendar size={20} className="text-blue-500" />} accent="bg-blue-50 text-blue-500" sub={todayAppts.length > 0 ? `${todayAppts.length} scheduled` : 'No appointments today'} />
        <StatCard title="Critical Shortage Alert" value={criticalShortages} icon={<FlaskConical size={20} />} accent={criticalShortages > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'} sub={`${criticalShortages} blood type${criticalShortages !== 1 ? 's' : ''} below ${CRITICAL_THRESHOLD_UNITS} units`} />
      </div>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Droplets size={18} className="text-rose-500" />
            Blood Stock Inventory
          </h2>
          <span className="text-xs text-slate-400">Low stock alert: below {CRITICAL_THRESHOLD_UNITS} units</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ALL_BLOOD_TYPES.map((bt) => (
            <BloodStockCard key={bt} type={bt} info={BLOOD_TYPE_INFO[bt]} stock={stock[bt]} onUpdate={handleUpdateStock} />
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Stock levels are updated manually. Use the Update button on each blood type after physically checking inventory.</p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-rose-500" />
              <h2 className="text-sm font-semibold text-slate-900">Active Appointments</h2>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{aptSort.sorted.length}</span>
            </div>
            <Link to="/admin/appointments" className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5 transition-colors">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {aptSort.sorted.length === 0 ? (
            <div className="p-10 text-center">
              <Calendar size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400">No appointments found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-4 py-3.5 text-left"><SortHeader label="Donor" sortKey="userId" currentKey={aptSort.sortKey} onToggle={aptSort.toggleSort} /></th>
                      <th className="px-4 py-3.5 text-left"><SortHeader label="Blood" sortKey="status" currentKey={aptSort.sortKey} onToggle={aptSort.toggleSort} /></th>
                      <th className="px-4 py-3.5 text-left"><SortHeader label="Time" sortKey="time" currentKey={aptSort.sortKey} onToggle={aptSort.toggleSort} /></th>
                      <th className="px-4 py-3.5 text-left"><SortHeader label="Status" sortKey="status" currentKey={aptSort.sortKey} onToggle={aptSort.toggleSort} /></th>
                      <th className="px-4 py-3.5 text-right"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Action</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {aptPag.pageItems.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {getInitials(a.userId?.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{a.userId?.name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400 truncate">{a.userId?.phone || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {a.userId?.bloodGroup ? (
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${BLOOD_TYPE_INFO[a.userId.bloodGroup]?.bg || 'bg-slate-100'} ${BLOOD_TYPE_INFO[a.userId.bloodGroup]?.text || 'text-slate-600'}`}>
                              {a.userId.bloodGroup}
                            </span>
                          ) : <span className="text-xs text-slate-400">&mdash;</span>}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {formatTimeDisplay(a.time)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-3.5 text-right">
                          {a.status === 'scheduled' ? (
                            <button
                              onClick={() => handleCheckIn(a._id)}
                              disabled={checkingIn === a._id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 disabled:opacity-40 transition-colors"
                            >
                              {checkingIn === a._id ? <Loader2 size={12} className="animate-spin" /> : <BadgeCheck size={12} />}
                              Check-In
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={aptPag.page} totalPages={aptPag.totalPages} setPage={aptPag.setPage} />
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border-2 border-rose-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
            <div className="flex items-center gap-2">
              <Hospital size={16} className="text-rose-500" />
              <h2 className="text-sm font-semibold text-slate-900">Emergency Blood Requests</h2>
              <span className="text-[10px] font-medium text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">{urgentRequests.length}</span>
            </div>
            <Link to="/admin/requests" className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5 transition-colors">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {urgentRequests.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle size={36} className="mx-auto mb-2 text-emerald-400" />
              <p className="text-sm text-slate-500 font-medium">No emergency requests at this time.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-rose-100 bg-rose-50/30">
                      <th className="px-4 py-3.5 text-left"><SortHeader label="Hospital" sortKey="hospital" currentKey={reqSort.sortKey} onToggle={reqSort.toggleSort} /></th>
                      <th className="px-4 py-3.5 text-left"><SortHeader label="Blood Type" sortKey="bloodGroup" currentKey={reqSort.sortKey} onToggle={reqSort.toggleSort} /></th>
                      <th className="px-4 py-3.5 text-left"><SortHeader label="Units" sortKey="units" currentKey={reqSort.sortKey} onToggle={reqSort.toggleSort} /></th>
                      <th className="px-4 py-3.5 text-left"><SortHeader label="Urgency" sortKey="status" currentKey={reqSort.sortKey} onToggle={reqSort.toggleSort} /></th>
                      <th className="px-4 py-3.5 text-right"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Action</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {reqPag.pageItems.map((r) => (
                      <tr key={r._id} className="hover:bg-rose-50/30 transition-colors duration-150">
                        <td className="px-4 py-3.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{r.hospital}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building2 size={10} /> {r.city || ''} &middot; <Phone size={10} /> {r.contact || r.phone || ''}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${BLOOD_TYPE_INFO[r.bloodGroup]?.bg || 'bg-slate-100'} ${BLOOD_TYPE_INFO[r.bloodGroup]?.text || 'text-slate-600'}`}>
                            {r.bloodGroup}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold text-slate-900">{r.units}</span>
                          <span className="text-xs text-slate-400 ml-0.5">unit{r.units > 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={r.status} type="urgency" />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {r.status === 'urgent' ? (
                              <>
                                <button
                                  onClick={() => handleRequestAction(r._id, 'fulfilled')}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                  <CheckCircle size={12} /> Approve
                                </button>
                                <button
                                  onClick={() => handleRequestAction(r._id, 'closed')}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                  <Ban size={12} /> Decline
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">&mdash;</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={reqPag.page} totalPages={reqPag.totalPages} setPage={reqPag.setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
