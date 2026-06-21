import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Tasks() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/blood-bank')
      .then((res) => setInventory(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load inventory'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading inventory...</div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="tasks">
      <h2>Blood Bank Inventory</h2>
      {inventory.length === 0 ? (
        <p>No inventory data available.</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Blood Group</th>
              <th>Quantity (units)</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item._id}>
                <td>{item.bloodGroup}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
