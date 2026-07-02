import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function DonationHistory() {
  const [donations, setDonations] = useState([]);
  const [nextEligibleDate, setNextEligibleDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDonations = useCallback(() => {
    api.get('/donations')
      .then((res) => {
        setDonations(res.data.donations);
        setNextEligibleDate(res.data.nextEligibleDate);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load donation history'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const getEligibilityStatus = () => {
    if (!nextEligibleDate) return { label: 'Eligible', className: 'eligible-yes', icon: '\u2705' };
    const now = new Date();
    const eligible = new Date(nextEligibleDate);
    if (now >= eligible) return { label: 'Eligible', className: 'eligible-yes', icon: '\u2705' };
    const diff = eligible - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { label: `${days} days`, className: 'eligible-no', icon: '\u23F3' };
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatShortDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="loading">Loading donation history...</div>;

  const elig = getEligibilityStatus();

  return (
    <div className="donation-history-page">
      <div className="page-header">
        <h2 className="page-title">Donation History</h2>
      </div>

      <div className={`eligibility-card ${elig.className}`}>
        <span className="elig-icon">{elig.icon}</span>
        <div className="elig-info">
          <p className="elig-label">Next eligible in</p>
          <p className="elig-value">{elig.label}</p>
        </div>
        {nextEligibleDate && (
          <p className="elig-date">{formatDate(nextEligibleDate)}</p>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {donations.length === 0 ? (
        <p className="no-data">No donations recorded yet.</p>
      ) : (
        <div className="donation-timeline">
          {donations.map((d, idx) => (
            <div key={d._id} className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-dot">{'\u2764'}</span>
                {idx < donations.length - 1 && <div className="timeline-line" />}
              </div>
              <div className="timeline-card">
                <div className="timeline-header">
                  <span className="timeline-blood">{d.bloodGroup}</span>
                  <span className="timeline-units">{d.units} unit{d.units > 1 ? 's' : ''}</span>
                </div>
                <p className="timeline-location">{d.bloodBankId?.name || 'Blood Bank'} &middot; {d.bloodBankId?.city || ''}</p>
                <p className="timeline-date">{formatShortDate(d.donationDate)}</p>
                {d.notes && <p className="timeline-notes">{d.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
