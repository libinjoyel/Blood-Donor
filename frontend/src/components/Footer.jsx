import { Droplets } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-100 py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Droplets size={14} className="text-rose-400" />
          <span className="text-sm font-medium text-slate-500">LifeFlow</span>
        </div>
        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} LifeFlow Blood Donation Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
