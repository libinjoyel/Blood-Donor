import { Loader2 } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', loading = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 h-10 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
