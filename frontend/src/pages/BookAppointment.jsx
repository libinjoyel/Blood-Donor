import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Building2, Loader2, CheckCircle, ArrowLeft, Syringe } from 'lucide-react';
import api from '../services/api';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
];

export default function BookAppointment() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [bloodBankId, setBloodBankId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/blood-bank')
      .then((res) => setBanks(res.data))
      .catch(() => setError('Failed to load blood banks'));
  }, []);

  const minDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bloodBankId || !date || !time) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/appointments', { bloodBankId, date, time });
      setSuccess('Appointment booked successfully!');
      setTimeout(() => navigate('/appointments'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Book Appointment</h1>
        <p className="text-sm text-slate-500 mt-0.5">Schedule your next blood donation</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Blood Bank</label>
          <div className="relative">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={bloodBankId} onChange={(e) => setBloodBankId(e.target.value)} required
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900 appearance-none">
              <option value="">Select a blood bank</option>
              {banks.map((b) => (
                <option key={b._id} value={b._id}>{b.name} - {b.city}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="date" value={date} min={minDate} onChange={(e) => setDate(e.target.value)} required
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Time Slot</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button key={slot} type="button" onClick={() => setTime(slot)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                  time === slot
                    ? 'border-rose-500 bg-rose-50 text-rose-700 font-medium shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                {new Date(`2000-01-01T${slot}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2">{error}</div>}
        {success && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-600 flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-all duration-200 shadow-sm">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Syringe size={15} />}
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200">
            <ArrowLeft size={15} /> Back
          </button>
        </div>
      </form>
    </div>
  );
}
