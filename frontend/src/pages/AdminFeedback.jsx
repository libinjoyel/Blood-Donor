import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFeedback = useCallback(() => {
    api.get('/admin/feedback')
      .then((res) => setFeedback(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load feedback'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await api.delete(`/admin/feedback/${id}`);
      setFeedback(feedback.filter((f) => f._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete feedback');
    }
  };

  const renderStars = (rating) => {
    return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
  };

  if (loading) return <div className="loading">Loading feedback...</div>;

  return (
    <div className="admin-page">
      <h2 className="page-title">Manage Feedback</h2>

      {error && <p className="error">{error}</p>}

      <div className="table-count" style={{ marginBottom: '0.8rem' }}>{feedback.length} feedback entry{feedback.length !== 1 ? 's' : ''}</div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Donor</th>
              <th>Blood Bank</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedback.length === 0 ? (
              <tr><td colSpan={6} className="no-data">No feedback yet.</td></tr>
            ) : (
              feedback.map((f) => (
                <tr key={f._id}>
                  <td>
                    <div className="cell-name">{f.userId?.name || 'Unknown'}</div>
                    <div className="cell-sub">{f.userId?.bloodGroup || ''}</div>
                  </td>
                  <td>
                    {f.bloodBankId?.name || 'Unknown'}
                    <div className="cell-sub">{f.bloodBankId?.city || ''}</div>
                  </td>
                  <td><span className="feedback-stars">{renderStars(f.rating)}</span></td>
                  <td className="feedback-comment">{f.comment || '-'}</td>
                  <td>{new Date(f.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="actions-cell">
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
