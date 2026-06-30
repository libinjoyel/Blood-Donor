import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        setBanks(res.data);
        const uniqueCities = [...new Set(res.data.map((b) => b.city).filter(Boolean))].sort();
        setCities(uniqueCities);
        const uniqueServices = [...new Set(res.data.flatMap((b) => b.services || []))].sort();
        setAllServices(uniqueServices);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load blood banks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanks();
  }, []);

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
    setSearch('');
    setCityFilter('');
    setServiceFilter('');
    setSort('name');
    fetchBanks();
  };

  const handleSort = (field) => {
    const newSort = sort === field ? `-${field}` : field;
    setSort(newSort);
    const params = {};
    if (search) params.search = search;
    if (cityFilter) params.city = cityFilter;
    if (serviceFilter) params.service = serviceFilter;
    params.sort = newSort;
    fetchBanks(params);
  };

  return (
    <div className="blood-banks">
      <h2 className="page-title">Blood Banks</h2>

      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by name, city, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="filter-select">
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="filter-select">
          <option value="">All Services</option>
          {allServices.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
        <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
      </form>

      <div className="sort-bar">
        <span className="sort-label">Sort by:</span>
        <button className={`sort-btn ${sort === 'name' || sort === '-name' ? 'active' : ''}`} onClick={() => handleSort('name')}>
          Name {sort === 'name' ? '\u2191' : sort === '-name' ? '\u2193' : ''}
        </button>
        <button className={`sort-btn ${sort === 'city' || sort === '-city' ? 'active' : ''}`} onClick={() => handleSort('city')}>
          City {sort === 'city' ? '\u2191' : sort === '-city' ? '\u2193' : ''}
        </button>
      </div>

      {loading && <div className="loading">Loading blood banks...</div>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="banks-content">
          <div className="banks-list">
            {banks.length === 0 ? (
              <p className="no-data">No blood banks found.</p>
            ) : (
              banks.map((bank) => (
                <Link to={`/blood-banks/${bank._id}`} key={bank._id} className="bank-card">
                  <h3>{bank.name}</h3>
                  <p className="bank-city">{bank.city}</p>
                  <p className="bank-address">{bank.address}</p>
                  <p className="bank-phone">{bank.phone}</p>
                  {bank.services && bank.services.length > 0 && (
                    <div className="bank-services">
                      {bank.services.map((s, i) => <span key={i} className="service-tag">{s}</span>)}
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>

          <div className="map-container">
            <MapView banks={banks} height="500px" />
          </div>
        </div>
      )}
    </div>
  );
}
