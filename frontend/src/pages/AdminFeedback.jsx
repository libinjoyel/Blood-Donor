import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Trash2, User, Star, MessageSquare } from 'lucide-react';
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

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await api.delete(`/admin/feedback/${id}`);
      setFeedback(feedback.filter((f) => f._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Feedback</h1>
        <p className="text-sm text-slate-500 mt-0.5">View donor feedback and ratings</p>
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="mb-4 text-xs text-slate-400">{feedback.length} feedback entr{feedback.length !== 1 ? 'ies' : 'y'}</div>

      <div className="space-y-3">
        {feedback.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
            <MessageSquare size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500 font-medium">No feedback yet.</p>
          </div>
        ) : (
          feedback.map((f) => (
            <div key={f._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900">{f.userId?.name || 'Anonymous'}</span>
                      <span className="text-[10px] text-slate-400">{f.userId?.bloodGroup || ''}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span>{f.bloodBankId?.name || 'Unknown Bank'} &middot; {f.bloodBankId?.city || ''}</span>
                      <span className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={12} fill={i < f.rating ? 'currentColor' : 'none'} />
                        ))}
                      </span>
                    </div>
                    {f.comment && <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{f.comment}</p>}
                    <p className="text-[10px] text-slate-400 mt-2">{new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(f._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
