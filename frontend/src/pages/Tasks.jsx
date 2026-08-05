import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Droplets } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) return <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600"><AlertCircle size={16} className="inline mr-1" />{error}</div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Blood Bank Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">Current stock levels</p>
      </div>

      {inventory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <Droplets size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500 font-medium">No inventory data available.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Group</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quantity (units)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {inventory.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-700">
                      <Droplets size={12} /> {item.bloodGroup}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-900 font-medium">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
