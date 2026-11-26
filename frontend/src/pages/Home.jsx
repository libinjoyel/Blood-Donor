import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Droplets, Heart, Users, Activity } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="py-12 sm:py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-xl shadow-rose-500/20">
          <Droplets size={32} className="text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Every Drop <span className="text-rose-600">Saves Lives</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto mb-8">
          Join LifeFlow and become part of a community dedicated to saving lives through blood donation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {!user && (
            <>
              <Link to="/register"
                className="px-6 py-3 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-500/25 transition-all duration-200">
                Become a Donor
              </Link>
              <Link to="/login"
                className="px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200">
                Sign In
              </Link>
            </>
          )}
          <Link to="/blood-banks"
            className="px-6 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200">
            Find Blood Banks
          </Link>
        </div>
      </div>

      {user && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8 text-left max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <Heart size={20} className="text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Welcome, {user.name}!</h2>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p><span className="font-medium text-slate-400">Email:</span> {user.email}</p>
            <p><span className="font-medium text-slate-400">Phone:</span> {user.phone}</p>
            <p><span className="font-medium text-slate-400">Blood Group:</span> {user.bloodGroup}</p>
          </div>
          <Link to="/dashboard"
            className="inline-block mt-4 w-full text-center px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-all duration-200">
            Go to Dashboard
          </Link>
        </div>
      )}

      {!user && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: Heart, label: 'Save Lives', desc: 'One donation can save up to 3 lives.', color: 'text-rose-500', bg: 'bg-rose-50' },
            { icon: Users, label: 'Join Community', desc: 'Connect with thousands of donors.', color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Activity, label: 'Track Impact', desc: 'Monitor your donation history.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center hover:shadow-md transition-all duration-200">
              <div className={`w-10 h-10 mx-auto mb-3 rounded-lg ${item.bg} flex items-center justify-center`}>
                <item.icon size={20} className={item.color} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
