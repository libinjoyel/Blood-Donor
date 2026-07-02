import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    if (!bloodBankId || !date || !time) {
      setError('Please fill all fields');
      return;
    }
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
    <div className="book-appointment">
      <h2 className="page-title">Book Appointment</h2>

      <form className="appointment-form" onSubmit={handleSubmit}>
        <label>
          Blood Bank
          <select value={bloodBankId} onChange={(e) => setBloodBankId(e.target.value)} required>
            <option value="">Select a blood bank</option>
            {banks.map((b) => (
              <option key={b._id} value={b._id}>{b.name} - {b.city}</option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label>
          Time
          <div className="time-slots">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`time-slot ${time === slot ? 'selected' : ''}`}
                onClick={() => setTime(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </label>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
}
