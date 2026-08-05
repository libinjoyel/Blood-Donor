import { useState, useEffect, useCallback } from 'react';
import { Heart, Droplets, Calendar, Loader2, Building2 } from 'lucide-react';
import api from '../services/api';

export default function DonationHistory() {
  const [donations, setDonations] = useState([]);
  const [nextEligibleDate, setNextEligibleDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDonations = useCallback(() => {
    api.get('/donations')
      .then((res) => {
        setDonations(res.data.donations || []);
        setNextEligibleDate(res.data.nextEligibleDate);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load donation history'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  const getEligibilityStatus = () => {
    if (!nextEligibleDate) return { label: 'Eligible to Donate', className: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: 'eligible' };
    const now = new Date();
    const eligible = new Date(nextEligibleDate);
    if (now >= eligible) return { label: 'Eligible to Donate', className: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: 'eligible' };
    const diff = eligible - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { label: `${days} days until next eligible`, className: 'bg-amber-50 border-amber-200 text-amber-700', icon: 'waiting' };
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const formatShortDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading donation history...</p>
        </div>
      </div>
    );
  }

  const elig = getEligibilityStatus();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Donation History</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your complete donation timeline</p>
      </div>

      <div className={`${elig.className} rounded-2xl border p-5 mb-6 flex items-start gap-4`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${elig.icon === 'eligible' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
          <Heart size={22} className={elig.icon === 'eligible' ? 'text-emerald-500' : 'text-amber-500'} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium opacity-75">Next eligible in</p>
          <p className="text-xl font-bold">{elig.label}</p>
          {nextEligibleDate && <p className="text-xs opacity-60 mt-0.5">{formatDate(nextEligibleDate)}</p>}
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">{error}</div>}

      {donations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <Droplets size={44} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500 font-medium">No donations recorded yet.</p>
          <p className="text-xs text-slate-400 mt-1">Your first donation could save up to 3 lives!</p>
        </div>
      ) : (
        <div className="space-y-0">
          {donations.map((d, idx) => (
            <div key={d._id} className="flex items-start gap-4">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
                  <Droplets size={16} className="text-white" />
                </div>
                {idx < donations.length - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-rose-200 to-transparent min-h-[24px]" />}
              </div>
              <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-3 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">{d.bloodGroup}</span>
                  <span className="text-xs text-slate-500">{d.units} unit{d.units > 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <Building2 size={13} className="text-slate-400" />
                  {d.bloodBankId?.name || 'Blood Bank'} &middot; {d.bloodBankId?.city || ''}
                </p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar size={11} /> {formatShortDate(d.donationDate)}
                </p>
                {d.notes && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">{d.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
