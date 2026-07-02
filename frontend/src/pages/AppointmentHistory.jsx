import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

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

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleReschedule = async (id) => {
    if (!newDate || !newTime) return;
    try {
      await api.put(`/appointments/${id}/reschedule`, { date: newDate, time: newTime });
      setRescheduling(null);
      setNewDate('');
      setNewTime('');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule');
    }
  };

  const statusClass = (status) => {
    if (status === 'scheduled') return 'status-scheduled';
    if (status === 'completed') return 'status-completed';
    return 'status-cancelled';
  };

  const minDate = new Date().toISOString().split('T')[0];

  const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30',
  ];

  if (loading) return <div className="loading">Loading appointments...</div>;

  return (
    <div className="appointment-history">
      <div className="page-header">
        <h2 className="page-title">My Appointments</h2>
        <Link to="/book-appointment" className="btn btn-primary">Book New</Link>
      </div>

      {error && <p className="error">{error}</p>}

      {appointments.length === 0 ? (
        <p className="no-data">No appointments yet.</p>
      ) : (
        <div className="appointments-list">
          {appointments.map((apt) => (
            <div key={apt._id} className="appointment-card">
              <div className="apt-header">
                <h3>{apt.bloodBankId?.name || 'Blood Bank'}</h3>
                <span className={`apt-status ${statusClass(apt.status)}`}>{apt.status}</span>
              </div>
              <p className="apt-location">{apt.bloodBankId?.city}{apt.bloodBankId?.address ? `, ${apt.bloodBankId.address}` : ''}</p>
              <p className="apt-datetime">
                {new Date(apt.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {apt.time}
              </p>

              {rescheduling === apt._id ? (
                <div className="reschedule-form">
                  <input
                    type="date"
                    value={newDate}
                    min={minDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                  <div className="time-slots time-slots--small">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot time-slot--sm ${newTime === slot ? 'selected' : ''}`}
                        onClick={() => setNewTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <div className="reschedule-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleReschedule(apt._id)} disabled={!newDate || !newTime}>Confirm</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setRescheduling(null); setNewDate(''); setNewTime(''); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                apt.status === 'scheduled' && (
                  <div className="apt-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setRescheduling(apt._id)}>Reschedule</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(apt._id)}>Cancel</button>
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
