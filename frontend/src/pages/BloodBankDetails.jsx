import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Clock, Building2, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import MapView from '../components/MapView';

export default function BloodBankDetails() {
  const { id } = useParams();
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/blood-bank/${id}`)
      .then((res) => setBank(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load blood bank details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>;
  if (!bank) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/blood-banks" className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors mb-4">
        <ArrowLeft size={15} /> Back to Blood Banks
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-rose-900 p-6 text-white">
          <h1 className="text-xl font-bold">{bank.name}</h1>
          <p className="text-sm text-white/70 mt-1 flex items-center gap-1">
            <MapPin size={14} /> {bank.city}
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 size={16} className="text-slate-400" /> Contact Information
            </h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {bank.address}</p>
              {bank.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {bank.phone}</p>}
              {bank.email && <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {bank.email}</p>}
            </div>
          </div>

          {bank.workingHours && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-slate-400" /> Working Hours
              </h2>
              <p className="text-sm text-slate-600">{bank.workingHours}</p>
            </div>
          )}

          {bank.services && bank.services.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Services</h2>
              <div className="flex flex-wrap gap-1.5">
                {bank.services.map((s, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {bank.latitude && bank.longitude && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Location</h2>
              <div className="rounded-xl overflow-hidden border border-slate-100 h-[300px]">
                <MapView banks={[bank]} height="100%" singleBank={true} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
