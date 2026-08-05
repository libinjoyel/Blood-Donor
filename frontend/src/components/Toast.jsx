import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const isSuccess = toast.type !== 'error';

  return (
    <div
      key={toast.id}
      role="alert"
      className={`fixed top-4 right-4 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-slide-up ${
        isSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      </div>
      <p className={`text-sm font-medium ${isSuccess ? 'text-emerald-800' : 'text-rose-800'}`}>{toast.message}</p>
      <button onClick={onClose} className={`ml-2 p-1 rounded-full transition-colors ${isSuccess ? 'hover:bg-emerald-200 text-emerald-400' : 'hover:bg-rose-200 text-rose-400'}`} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
