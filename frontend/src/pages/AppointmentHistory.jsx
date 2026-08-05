import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Loader2, CheckCircle, X, AlertCircle, Plus } from 'lucide-react';
import api from '../services/api';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
];

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-emerald-50 text-emerald-600',
    scheduled: 'bg-blue-50 text-blue-600',
    cancelled: 'bg-rose-50 text-rose-600',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduling, setRescheduling] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const fetchAppointments = () => {
    api.get('/appointments')
      .then((res) => setAppointments(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load appointments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleComplete = async (id) => {
    if (!confirm('Mark this appointment as completed?')) return;
    try {
      await api.put(`/appointments/${id}/complete`);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete');
    }
  };

  const handleReschedule = async (id) => {
    if (!newDate || !newTime) return;
    try {
      await api.put(`/appointments/${id}/reschedule`, { date: newDate, time: newTime });
      setRescheduling(null); setNewDate(''); setNewTime('');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule');
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage your donation appointments</p>
        </div>
        <Link to="/book-appointment"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200 shadow-sm">
          <Plus size={15} /> Book New
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <Calendar size={44} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500 font-medium">No appointments yet.</p>
          <p className="text-xs text-slate-400 mt-1">Schedule your first donation today!</p>
          <Link to="/book-appointment" className="inline-block mt-4 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">
            Book Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div key={apt._id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">{apt.bloodBankId?.name || 'Blood Bank'}</h3>
                    <StatusBadge status={apt.status} />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    {apt.bloodBankId?.city}{apt.bloodBankId?.address ? `, ${apt.bloodBankId.address}` : ''}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {apt.time}</span>
                  </div>
                </div>
              </div>

              {rescheduling === apt._id ? (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3">
                  <input type="date" value={newDate} min={minDate} onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_SLOTS.map((slot) => (
                      <button key={slot} type="button" onClick={() => setNewTime(slot)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all duration-200 ${
                          newTime === slot
                            ? 'border-rose-500 bg-rose-50 text-rose-700 font-medium'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                        {new Date(`2000-01-01T${slot}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleReschedule(apt._id)} disabled={!newDate || !newTime}
                      className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 disabled:opacity-40 transition-all duration-200">
                      Confirm
                    </button>
                    <button onClick={() => { setRescheduling(null); setNewDate(''); setNewTime(''); }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                apt.status === 'scheduled' && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                    <button onClick={() => handleComplete(apt._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                      <CheckCircle size={12} /> Complete
                    </button>
                    <button onClick={() => setRescheduling(apt._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                      <Calendar size={12} /> Reschedule
                    </button>
                    <button onClick={() => handleCancel(apt._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
