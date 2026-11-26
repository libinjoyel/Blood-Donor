import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Droplet, Heart, Calendar, Bell, ChevronRight, Clock,
  Award, CheckCircle, Building2, Syringe, AlertCircle,
  Loader2, Timer, CalendarClock, RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ProfileCard from '../components/ProfileCard';

const BLOOD_TYPE_MAP = {
  'A+': 'A+', 'A-': 'A-', 'B+': 'B+', 'B-': 'B-',
  'AB+': 'AB+', 'AB-': 'AB-', 'O+': 'O+', 'O-': 'O-',
};

const BLOOD_TYPE_COLORS = {
  'A+': 'bg-blue-100 text-blue-700 border-blue-200',
  'A-': 'bg-blue-50 text-blue-600 border-blue-200',
  'B+': 'bg-amber-100 text-amber-700 border-amber-200',
  'B-': 'bg-amber-50 text-amber-600 border-amber-200',
  'AB+': 'bg-purple-100 text-purple-700 border-purple-200',
  'AB-': 'bg-purple-50 text-purple-600 border-purple-200',
  'O+': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'O-': 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

const MILESTONES = [
  { label: 'Bronze', threshold: 5 },
  { label: 'Silver', threshold: 10 },
  { label: 'Gold', threshold: 25 },
  { label: 'Platinum', threshold: 50 },
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] || '?').toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return timeStr;
  }
}

function CountdownBox({ value, label }) {
  return (
    <div className="text-center bg-slate-50 rounded-xl border border-slate-100 py-3">
      <p className="text-2xl font-extrabold text-slate-900 leading-none tabular-nums">{String(value).padStart(2, '0')}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = Number(target) || 0;
    prevRef.current = to;
    if (from === to) return;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getEligibilityInfo(nextEligibleDate) {
  if (!nextEligibleDate) {
    return {
      label: 'Eligible to Donate',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
    };
  }
  const now = new Date();
  const eligible = new Date(nextEligibleDate);
  if (now >= eligible) {
    return {
      label: 'Eligible to Donate',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
    };
  }
  const diff = eligible - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return {
    label: `Next eligible in ${days}d`,
    pillClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  };
}

function getMilestoneProgress(count) {
  if (!count) return { current: 0, next: MILESTONES[0], progress: 0, label: 'First Donation' };
  for (let i = 0; i < MILESTONES.length; i++) {
    if (count < MILESTONES[i].threshold) {
      const prev = i > 0 ? MILESTONES[i - 1].threshold : 0;
      const range = MILESTONES[i].threshold - prev;
      const progress = ((count - prev) / range) * 100;
      return { current: count, next: MILESTONES[i], progress, label: `${count} / ${MILESTONES[i].threshold} to ${MILESTONES[i].label}` };
    }
  }
  return { current: count, next: MILESTONES[MILESTONES.length - 1], progress: 100, label: `Platinum Donor (${count} donations)` };
}

function StatCard({ label, value, icon, accent, sub }) {
  const Icon = icon;
  const gradMap = {
    'bg-rose-50': { bg: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-500/20' },
    'bg-emerald-50': { bg: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    'bg-blue-50': { bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    'bg-amber-50': { bg: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
  };
  const grad = gradMap[accent] || { bg: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-500/20' };
  const isLongValue = typeof value === 'string' && value.length > 8;

  return (
    <div className="group bg-white rounded-[18px] border border-slate-200/70 p-5 sm:p-6 hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col min-h-[150px] sm:min-h-[170px]">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1.5 min-w-0 flex-1 mr-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] truncate block">{label}</span>
          <p className={`font-extrabold text-slate-900 tracking-tight leading-none ${isLongValue ? 'text-lg sm:text-xl lg:text-2xl truncate' : 'text-2xl sm:text-3xl'}`}>
            {value}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${grad.bg} flex items-center justify-center shadow-lg ${grad.shadow} flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100/60">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
        <span className="text-xs text-slate-400 leading-snug">{sub}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const [bookingStep, setBookingStep] = useState(1);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let interval = null;
    const fetchData = async () => {
      try {
        const [dashRes, notifRes, apptsRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/notifications/unread-count').catch(() => ({ data: { count: 0 } })),
          api.get('/appointments').catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setDashboard(dashRes.data);
        setUnreadCount(notifRes.data.count || 0);
        setAppointments(Array.isArray(apptsRes.data) ? apptsRes.data : []);
        setLastUpdated(new Date());
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) { logout(); navigate('/login'); return; }
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    interval = setInterval(fetchData, 30000);
    return () => { cancelled = true; if (interval) clearInterval(interval); };
  }, [logout, navigate]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const user = dashboard?.user || authUser;
  const stats = dashboard?.stats || {};
  const donationCount = stats.donationCount || user?.donationCount || 0;
  const bloodGroup = stats.bloodGroup || user?.bloodGroup || '';
  const isEligible = stats.isEligible !== undefined ? stats.isEligible : user?.isEligible;
  const nextEligibleDate = user?.nextEligibleDate || (user?.lastDonationDate
    ? new Date(new Date(user.lastDonationDate).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
    : null);

  const EligIcon = getEligibilityInfo(nextEligibleDate).icon;
  const eligInfo = getEligibilityInfo(nextEligibleDate);
  const milestone = getMilestoneProgress(donationCount);
  const livesImpacted = donationCount * 3;

  const animatedDonations = useCountUp(donationCount);
  const animatedLives = useCountUp(livesImpacted);

  const greeting = getGreeting();
  const nowMs = now.getTime();

  const upcoming = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'scheduled')
      .map((a) => {
        const d = new Date(a.date).toISOString().split('T')[0];
        return { ...a, dt: new Date(`${d}T${a.time || '09:00'}`) };
      })
      .filter((a) => a.dt.getTime() > nowMs)
      .sort((x, y) => x.dt - y.dt)[0] || null;
  }, [appointments, nowMs]);

  const diffMs = upcoming ? Math.max(0, upcoming.dt.getTime() - nowMs) : 0;
  const countdownDays = Math.floor(diffMs / 86400000);
  const countdownHours = Math.floor((diffMs % 86400000) / 3600000);
  const countdownMins = Math.floor((diffMs % 3600000) / 60000);

  const bloodBadgeColor = BLOOD_TYPE_COLORS[bloodGroup] || 'bg-rose-100 text-rose-700 border-rose-200';
  const initials = getInitials(user?.name);

  const handleBooking = async () => {
    if (!selectedCenter || !selectedDate || !selectedTime) return;
    setBookingLoading(true);
    try {
      await api.post('/appointments', { bloodBankId: selectedCenter, date: selectedDate, time: selectedTime });
      setBookingStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-rose-500" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20 flex-shrink-0">
              <Droplet size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {greeting}, {user?.name?.split(' ')[0] || 'Donor'} <span className="align-middle">👋</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                Here&apos;s your donation overview for today.
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full ml-1">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
                  </span>
                  Live
                </span>
                {lastUpdated && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal" title="Auto-refreshes every 30s">
                    <RefreshCw size={10} className="inline" />
                    Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {bloodGroup && (
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-bold ${bloodBadgeColor}`}>
                <Droplet size={14} />
                {BLOOD_TYPE_MAP[bloodGroup] || bloodGroup}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold ${eligInfo.pillClass}`}>
              <EligIcon size={14} />
              {eligInfo.label}
            </span>
            <Link to="/notifications" className="relative p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200" aria-label="Notifications">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm shadow-rose-500/30">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-sm hover:opacity-90 hover:scale-105 transition-all duration-200">
                {initials}
              </button>
              {profileOpen && (
                <ProfileCard onClose={() => setProfileOpen(false)} cardClassName="fixed top-16 right-4 sm:absolute sm:right-0 sm:top-full sm:mt-2" />
              )}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={16} className="text-rose-600" />
          </div>
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6 mb-10">
        <StatCard label="Total Donations" value={animatedDonations} icon={Droplet} accent="bg-rose-50" sub="Lifetime donations" />
        <StatCard label="Lives Impacted" value={animatedLives} icon={Heart} accent="bg-emerald-50" sub="Each donation saves up to 3 lives" />
        <StatCard label="Next Eligible" value={nextEligibleDate ? formatDate(nextEligibleDate) : 'Now'} icon={Calendar} accent="bg-blue-50" sub={isEligible ? 'You are eligible to donate' : 'On hold'} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:gap-8">
        <div className="bg-white rounded-[18px] shadow-sm border border-slate-200/70 overflow-hidden hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Calendar size={16} className="text-rose-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Quick Book Appointment</h2>
              </div>
              <Link to="/book-appointment" className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-0.5 transition-colors">
                Full form <ChevronRight size={14} />
              </Link>
            </div>

            {bookingStep === 4 ? (
              <div className="flex flex-col items-center py-12 px-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-5">
                  <CheckCircle size={36} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Appointment Confirmed!</h3>
                <p className="text-sm text-slate-500 mb-6">Your donation appointment has been booked successfully.</p>
                <Link to="/appointments" className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/25 transition-all duration-200">
                  View Appointments <ChevronRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="p-6">
                <div className="relative flex items-center mb-8 sm:mb-10">
                  <div className="absolute top-[14px] left-0 right-0 h-0.5 bg-slate-100 rounded" />
                  <div
                    className="absolute top-[14px] left-0 h-0.5 bg-gradient-to-r from-rose-500 to-rose-600 rounded transition-all duration-500 shadow-sm shadow-rose-500/20"
                    style={{ width: `${((bookingStep - 1) / 2) * 100}%` }}
                  />
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex-1 flex flex-col items-center relative z-10">
                      <div className={`w-7 h-7 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        bookingStep >= step
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                          : 'bg-white text-slate-400 border-2 border-slate-200'
                      }`}>
                        {bookingStep > step ? <CheckCircle size={13} /> : step}
                      </div>
                      <span className={`hidden sm:block text-xs font-semibold mt-2 ${bookingStep >= step ? 'text-slate-700' : 'text-slate-400'}`}>
                        {step === 1 ? 'Select Center' : step === 2 ? 'Date & Time' : 'Confirm'}
                      </span>
                    </div>
                  ))}
                </div>

                {bookingStep === 1 && (
                  <BookingCenterStep value={selectedCenter} onChange={setSelectedCenter} onNext={() => selectedCenter && setBookingStep(2)} />
                )}
                {bookingStep === 2 && (
                  <BookingDateTimeStep
                    date={selectedDate} time={selectedTime}
                    onDateChange={setSelectedDate} onTimeChange={setSelectedTime}
                    onBack={() => setBookingStep(1)}
                    onNext={() => selectedDate && selectedTime && setBookingStep(3)}
                  />
                )}
                {bookingStep === 3 && (
                  <BookingConfirmStep
                    centerId={selectedCenter} date={selectedDate} time={selectedTime}
                    onBack={() => setBookingStep(2)} onConfirm={handleBooking} loading={bookingLoading}
                  />
                )}
              </div>
            )}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
          <div className="bg-white rounded-[18px] shadow-sm border border-slate-200/70 overflow-hidden hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-gradient-to-r from-rose-50/50 to-transparent">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                <CalendarClock size={16} className="text-rose-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Upcoming Appointment</h2>
              {upcoming && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
                  </span>
                  Live
                </span>
              )}
            </div>

            {upcoming ? (
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{upcoming.bloodBankId?.name || 'Blood Bank'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(upcoming.date)} at {formatTime(upcoming.time)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Timer size={12} /> Countdown
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <CountdownBox value={countdownDays} label="Days" />
                    <CountdownBox value={countdownHours} label="Hours" />
                    <CountdownBox value={countdownMins} label="Mins" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                  <CalendarClock size={30} className="text-rose-300" />
                </div>
                <p className="text-sm font-bold text-slate-900">No Upcoming Appointment</p>
                <p className="text-xs text-slate-500 mt-1 mb-5">Book your next donation and see a live countdown here.</p>
                <Link to="/book-appointment" className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/25 transition-all duration-200">
                  <Calendar size={16} /> Book Now
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[18px] shadow-sm border border-slate-200/70 overflow-hidden hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-gradient-to-r from-slate-50/50 to-transparent">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Award size={16} className="text-amber-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Donation Milestone</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{donationCount}</span>
                    <span className="text-sm text-slate-400 font-medium">donations</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">{milestone.next?.label || 'Next'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{milestone.label}</p>
                </div>
              </div>

              <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-5">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-1000 ease-out shadow-sm shadow-rose-500/20"
                  style={{ width: `${Math.min(milestone.progress, 100)}%` }} />
              </div>

              <div className="flex justify-between items-start">
                {MILESTONES.map((m, i) => {
                  const reached = donationCount >= m.threshold;
                  const isNext = !reached && (i === 0 || donationCount >= MILESTONES[i - 1].threshold);
                  return (
                    <div key={m.label} className="flex flex-col items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        reached
                          ? 'bg-rose-500 border-rose-500 shadow-sm shadow-rose-500/20'
                          : isNext
                            ? 'border-rose-300 bg-white ring-2 ring-rose-500/20'
                            : 'border-slate-200 bg-white'
                      }`}>
                        {reached && <CheckCircle size={13} className="text-white" />}
                        {!reached && isNext && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                      </div>
                      <span className={`text-[11px] font-bold ${reached ? 'text-slate-900' : isNext ? 'text-rose-600' : 'text-slate-300'}`}>
                        {m.label}
                      </span>
                      <span className={`text-[10px] font-medium ${reached ? 'text-emerald-500' : 'text-slate-300'}`}>
                        {reached ? 'Done' : `${m.threshold}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingCenterStep({ value, onChange, onNext }) {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blood-bank')
      .then((res) => setCenters(Array.isArray(res.data) ? res.data : (res.data.banks || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-3">Select a Blood Bank</label>
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Loader2 size={16} className="animate-spin" /> Loading centers...
        </div>
      ) : centers.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">No blood banks available in your area.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
          {centers.map((c) => (
            <button key={c._id} type="button" onClick={() => onChange(c._id)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                value === c._id
                  ? 'border-rose-500 bg-rose-50/50 shadow-sm ring-1 ring-rose-500/20'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${value === c._id ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                  <Building2 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{c.city}{c.address ? `, ${c.address}` : ''}</p>
                </div>
                {value === c._id && <CheckCircle size={16} className="text-rose-500 flex-shrink-0 mt-1" />}
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
        <button type="button" onClick={onNext} disabled={!value}
          className="px-5 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-rose-500/20 flex items-center gap-1.5">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function BookingDateTimeStep({ date, time, onDateChange, onTimeChange, onBack, onNext }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00',
  ];

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2.5" htmlFor="booking-date">Select Date</label>
        <div className="relative">
          <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input id="booking-date" type="date" value={date} min={minDate}
            onChange={(e) => { onDateChange(e.target.value); onTimeChange(''); }}
            className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-200 text-slate-900 bg-white" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">Select Time Slot</label>
        {!date ? (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Calendar size={14} /> Please select a date first.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {timeSlots.map((slot) => (
              <button key={slot} type="button" onClick={() => onTimeChange(slot)}
                className={`px-2.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border transition-all duration-200 ${
                  time === slot
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-500/20'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                {new Date(`2000-01-01T${slot}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-100">
        <button type="button" onClick={onBack} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-200">
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!date || !time}
          className="px-5 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-rose-500/20 flex items-center gap-1.5">
          Review <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function BookingConfirmStep({ centerId, date, time, onBack, onConfirm, loading }) {
  const [center, setCenter] = useState(null);
  const fetching = !center && !!centerId;

  useEffect(() => {
    if (!centerId) return;
    let cancelled = false;
    api.get(`/blood-bank/${centerId}`)
      .then((res) => { if (!cancelled) setCenter(res.data); })
      .catch(() => {})
    return () => { cancelled = true; };
  }, [centerId]);

  const formattedTime = time
    ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div>
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={17} className="text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{fetching ? 'Loading...' : (center?.name || 'Blood Bank')}</p>
            <p className="text-xs text-slate-400 mt-0.5">{fetching ? '' : (center?.city || '')}</p>
          </div>
        </div>
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Calendar size={17} className="text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-900 pt-1.5">{date ? formatDate(date) : ''}</p>
        </div>
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock size={17} className="text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-slate-900 pt-1.5">{formattedTime}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-100">
        <button type="button" onClick={onBack} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-200">
          Back
        </button>
        <button type="button" onClick={onConfirm} disabled={loading}
          className="px-6 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-rose-500/20 flex items-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Syringe size={16} />}
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
