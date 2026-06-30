import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

  if (loading) return <div className="loading">Loading details...</div>;
  if (error) return <p className="error">{error}</p>;
  if (!bank) return null;

  return (
    <div className="bank-details">
      <Link to="/blood-banks" className="back-link">&larr; Back to Blood Banks</Link>

      <div className="bank-detail-card">
        <div className="bank-detail-header">
          <h2>{bank.name}</h2>
          <span className="bank-detail-city">{bank.city}</span>
        </div>

        <div className="bank-detail-body">
          <div className="detail-section">
            <h3>Contact Information</h3>
            <p><strong>Address:</strong> {bank.address}</p>
            {bank.phone && <p><strong>Phone:</strong> {bank.phone}</p>}
            {bank.email && <p><strong>Email:</strong> {bank.email}</p>}
          </div>

          {bank.workingHours && (
            <div className="detail-section">
              <h3>Working Hours</h3>
              <p>{bank.workingHours}</p>
            </div>
          )}

          {bank.services && bank.services.length > 0 && (
            <div className="detail-section">
              <h3>Services</h3>
              <div className="bank-services">
                {bank.services.map((s, i) => <span key={i} className="service-tag">{s}</span>)}
              </div>
            </div>
          )}

          {bank.latitude && bank.longitude && (
            <div className="detail-section">
              <h3>Location</h3>
              <MapView banks={[bank]} height="300px" singleBank={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
