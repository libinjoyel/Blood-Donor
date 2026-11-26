import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Phone, Loader2, Building2, ChevronRight, RotateCcw } from 'lucide-react';
import api from '../services/api';
import MapView from '../components/MapView';

export default function BloodBanks() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [sort, setSort] = useState('name');

  const [cities, setCities] = useState([]);
  const [allServices, setAllServices] = useState([]);

  const fetchBanks = (params) => {
    setLoading(true);
    api.get('/blood-bank', { params })
      .then((res) => {
        const data = res.data;
        setBanks(data);
        setCities([...new Set(data.map((b) => b.city).filter(Boolean))].sort());
        setAllServices([...new Set(data.flatMap((b) => b.services || []))].sort());
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load blood banks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBanks(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (cityFilter) params.city = cityFilter;
    if (serviceFilter) params.service = serviceFilter;
    if (sort) params.sort = sort;
    fetchBanks(params);
  };

  const handleReset = () => {
    setSearch(''); setCityFilter(''); setServiceFilter(''); setSort('name');
    fetchBanks();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Blood Banks</h1>
        <p className="text-sm text-slate-500 mt-0.5">Find and locate blood banks near you</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or address..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 placeholder:text-slate-400" />
        </div>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
          className="w-[calc(50%-0.25rem)] sm:w-auto px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700">
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}
          className="w-[calc(50%-0.25rem)] sm:w-auto px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700">
          <option value="">All Services</option>
          {allServices.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200 shadow-sm">
          <Search size={15} className="inline mr-1" /> Search
        </button>
        <button type="button" onClick={handleReset}
          className="px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-all duration-200">
          <RotateCcw size={15} className="inline mr-1" /> Reset
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 size={28} className="animate-spin text-rose-500" />
            <p className="text-sm font-medium">Loading blood banks...</p>
          </div>
        </div>
      )}
      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-3">
            {banks.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
                <Building2 size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500 font-medium">No blood banks found.</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              banks.map((bank) => (
                <Link to={`/blood-banks/${bank._id}`} key={bank._id}
                  className="block bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 group">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">{bank.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin size={13} className="flex-shrink-0" />
                        {bank.city}{bank.address ? `, ${bank.address}` : ''}
                      </p>
                      {bank.phone && (
                        <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone size={13} className="flex-shrink-0" />
                          {bank.phone}
                        </p>
                      )}
                      {bank.services && bank.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {bank.services.map((s, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-rose-400 transition-colors mt-1 flex-shrink-0" />
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 rounded-xl overflow-hidden border border-slate-100 shadow-sm h-[300px] sm:h-[400px] lg:h-[500px]">
              <MapView banks={banks} height="100%" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
