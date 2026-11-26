import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, User, Phone, Droplets,
  Heart, Loader2, CheckCircle, X,
  AlertCircle, ShieldCheck, Users, Activity,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ROTATING_FACTS = [
  { icon: <Heart size={32} className="text-white/90" />, text: '1 Donation can save up to 3 lives.', sub: 'Your blood is irreplaceable.' },
  { icon: <Users size={32} className="text-white/90" />, text: 'Every 2 seconds, someone needs blood.', sub: 'Be the reason for a heartbeat.' },
  { icon: <Activity size={32} className="text-white/90" />, text: 'Over 5 crore units of blood are needed annually in India.', sub: 'Your donation matters.' },
  { icon: <ShieldCheck size={32} className="text-white/90" />, text: 'A single blood donation can save a premature baby, a cancer patient, or an accident victim.', sub: 'Give the gift of life.' },
];

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'Contains uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'Contains lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'Contains a number', test: (v) => /\d/.test(v) },
];

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: 'bg-slate-200', textColor: 'text-slate-400' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-600' };
  if (score <= 3) return { level: 2, label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-600' };
  return { level: 3, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
}

/* ---- Toast ---- */
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const isSuccess = type === 'success';
  return (
    <div className={`fixed top-4 right-4 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-slide-up ${isSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
      }`} role="alert">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}>
        {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      </div>
      <p className={`text-sm font-medium ${isSuccess ? 'text-emerald-800' : 'text-rose-800'}`}>{message}</p>
      <button onClick={onClose} className={`ml-2 p-1 rounded-full transition-colors ${isSuccess ? 'hover:bg-emerald-200 text-emerald-400' : 'hover:bg-rose-200 text-rose-400'
        }`} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

/* ---- Password Strength Bar ---- */
function PasswordStrength({ password }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.level >= i ? strength.color : 'bg-slate-200'
            }`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</p>
    </div>
  );
}

/* ---- Left Panel ---- */
function LeftPanel() {
  const [factIdx, setFactIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setFactIdx((prev) => (prev + 1) % ROTATING_FACTS.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:flex md:sticky md:top-0 md:h-screen w-full md:w-[45%] lg:w-[40%] bg-gradient-to-b from-[#1a2332] via-[#2b1a2a] to-[#4a1525] flex-col justify-between items-center px-10 py-12 lg:px-12 lg:py-14 text-center text-white select-none relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-rose-500/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-rose-500/[0.04] blur-2xl pointer-events-none" />

      {/* Brand placed cleanly near top */}
      <div className="relative z-10 w-full max-w-md mx-auto pt-2">
        <div className="flex items-center justify-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Droplets size={26} className="text-rose-300" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">LifeFlow</span>
        </div>
      </div>

      {/* Centered Heartbeat + Fact for comfortable reading */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center my-auto py-8">
        {/* Heartbeat SVG */}
        <svg className="w-full max-w-sm h-16 mb-10" viewBox="0 0 400 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 30 L60 30 L70 10 L80 50 L90 20 L100 40 L110 25 L120 35 L130 28 L140 32 L150 30 L200 30 L210 10 L220 50 L230 20 L240 40 L250 25 L260 35 L270 28 L280 32 L290 30 L340 30 L350 20 L360 40 L370 30 L400 30"
            stroke="rgba(255,255,255,0.22)" strokeWidth="2" className="animate-pulse" />
          <path d="M0 30 L60 30 L70 10 L80 50 L90 20 L100 40 L110 25 L120 35 L130 28 L140 32 L150 30 L200 30 L210 10 L220 50 L230 20 L240 40 L250 25 L260 35 L270 28 L280 32 L290 30 L340 30 L350 20 L360 40 L370 30 L400 30"
            stroke="rgba(251, 113, 133, 0.7)" strokeWidth="2.5"
            strokeDasharray="400" strokeDashoffset="400">
            <animate attributeName="stroke-dashoffset" from="400" to="0" dur="3s" repeatCount="indefinite" />
          </path>
        </svg>

        {/* Rotating stat */}
        <div className={`w-full min-h-[156px] flex flex-col items-center justify-center px-3 transition-all duration-300 ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-5 shadow-inner">
            {ROTATING_FACTS[factIdx].icon}
          </div>
          <p className="text-xl lg:text-[22px] font-semibold text-white leading-relaxed tracking-tight mb-2.5 max-w-sm">
            {ROTATING_FACTS[factIdx].text}
          </p>
          <p className="text-sm lg:text-[15px] text-rose-100/80 leading-relaxed max-w-xs">
            {ROTATING_FACTS[factIdx].sub}
          </p>
        </div>

        {/* Indicator dots */}
        <div className="flex justify-center gap-2 mt-8">
          {ROTATING_FACTS.map((_, i) => (
            <button key={i} onClick={() => { setFade(false); setTimeout(() => { setFactIdx(i); setFade(true); }, 300); }}
              className={`h-2 rounded-full transition-all duration-300 ${i === factIdx ? 'bg-white w-6' : 'bg-white/30 w-2 hover:bg-white/50'
                }`} aria-label={`Fact ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Bottom balance spacer */}
      <div className="relative z-10 h-6" aria-hidden="true" />
    </div>
  );
}

/* ---- Reusable Input Field ---- */
function FormField({ id, label, error, touched, children }) {
  const showError = error && touched;
  return (
    <div className="auth-form-field">
      <label htmlFor={id} className="auth-form-label">{label}</label>
      {children}
      {showError && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

function InputIcon({ icon: Icon }) {
  return (
    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 pointer-events-none z-10">
      <Icon size={18} />
    </div>
  );
}

const inputBase = 'auth-input-field';
const inputError = '!border-rose-400 !ring-rose-500/20';
const inputNormal = '';

/* ---- Login Form ---- */
function LoginForm({ onSuccess, onError, onInfo }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem('rememberEmail') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(!!localStorage.getItem('rememberEmail'));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validate()) return;
    setLoading(true);
    if (remember) localStorage.setItem('rememberEmail', email);
    else localStorage.removeItem('rememberEmail');
    try {
      const res = await login(email, password);
      const role = res?.user?.role || 'donor';
      onSuccess(role === 'admin' ? 'Admin' : 'Donor');
      setTimeout(() => navigate(role === 'admin' ? '/admin' : '/dashboard'), 800);
    } catch (err) {
      onError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col">
      <FormField id="login-email" label="Email Address" error={errors.email} touched={touched.email}>
        <div className="relative flex items-center">
          <InputIcon icon={Mail} />
          <input id="login-email" type="email" value={email} autoComplete="email"
            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            className={`${inputBase} ${errors.email && touched.email ? inputError : inputNormal}`} />
        </div>
      </FormField>

      <FormField id="login-password" label="Password" error={errors.password} touched={touched.password}>
        <div className="relative flex items-center">
          <InputIcon icon={Lock} />
          <input id="login-password" type={showPw ? 'text' : 'password'} value={password} autoComplete="current-password"
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: '' })); }}
            onBlur={() => setTouched((p) => ({ ...p, password: true }))}
            placeholder="Enter your password"
            aria-invalid={!!errors.password}
            className={`${inputBase} ${errors.password && touched.password ? inputError : inputNormal}`} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors z-10 rounded-md focus:outline-none"
            aria-label={showPw ? 'Hide password' : 'Show password'}>
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FormField>

      {/* Remember me + Forgot password */}
      <div className="flex items-center justify-between mt-1 mb-6">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500/30 transition-colors cursor-pointer" />
          <span className="text-sm font-medium text-slate-600">Remember me</span>
        </label>
        <button type="button" onClick={() => onInfo?.('Password reset link has been sent to your email.')}
          className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors">
          Forgot Password?
        </button>
      </div>

      <button type="submit" disabled={loading}
        className="w-full h-11 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-semibold rounded-xl hover:from-black hover:to-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

/* ---- Register Form ---- */
function RegisterForm({ onSuccess, onError }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const nameRef = useRef(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', bloodGroup: '',
    password: '', confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => { nameRef.current?.focus(); }, []);

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const touch = (field) => setTouched((p) => ({ ...p, [field]: true }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.phone) errs.phone = 'Phone number is required';
    else if (!/^[+]?[\d\s()-]{7,15}$/.test(form.phone)) errs.phone = 'Enter a valid phone number';
    if (!form.bloodGroup) errs.bloodGroup = 'Please select your blood group';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = ['name', 'email', 'phone', 'bloodGroup', 'password', 'confirmPassword'];
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])));
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword: _cp, ...data } = form; // eslint-disable-line no-unused-vars
      const res = await register(data);
      const role = res?.user?.role || 'donor';
      onSuccess(role === 'admin' ? 'Admin' : 'Donor');
      setTimeout(() => navigate(role === 'admin' ? '/admin' : '/dashboard'), 800);
    } catch (err) {
      onError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
      {/* Full Name */}
      <FormField id="reg-name" label="Full Name" error={errors.name} touched={touched.name}>
        <div className="relative flex items-center">
          <InputIcon icon={User} />
          <input ref={nameRef} id="reg-name" type="text" value={form.name} autoComplete="name"
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => touch('name')}
            placeholder="John Doe"
            aria-invalid={!!errors.name && touched.name}
            className={`${inputBase} ${errors.name && touched.name ? inputError : inputNormal}`} />
        </div>
      </FormField>

      {/* Email */}
      <FormField id="reg-email" label="Email Address" error={errors.email} touched={touched.email}>
        <div className="relative flex items-center">
          <InputIcon icon={Mail} />
          <input id="reg-email" type="email" value={form.email} autoComplete="email"
            onChange={(e) => update('email', e.target.value)}
            onBlur={() => touch('email')}
            placeholder="you@example.com"
            aria-invalid={!!errors.email && touched.email}
            className={`${inputBase} ${errors.email && touched.email ? inputError : inputNormal}`} />
        </div>
      </FormField>

      {/* Phone + Blood Group side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-4">
        <FormField id="reg-phone" label="Phone Number" error={errors.phone} touched={touched.phone}>
          <div className="relative flex items-center">
            <InputIcon icon={Phone} />
            <input id="reg-phone" type="tel" value={form.phone} autoComplete="tel"
              onChange={(e) => update('phone', e.target.value)}
              onBlur={() => touch('phone')}
              placeholder="+1 (555) 123-4567"
              aria-invalid={!!errors.phone && touched.phone}
              className={`${inputBase} ${errors.phone && touched.phone ? inputError : inputNormal}`} />
          </div>
        </FormField>

        <FormField id="reg-blood" label="Blood Group" error={errors.bloodGroup} touched={touched.bloodGroup}>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 pointer-events-none z-10">
              <Droplets size={18} />
            </div>
            <select id="reg-blood" value={form.bloodGroup}
              onChange={(e) => update('bloodGroup', e.target.value)}
              onBlur={() => touch('bloodGroup')}
              aria-invalid={!!errors.bloodGroup && touched.bloodGroup}
              className={`${inputBase} appearance-none ${!form.bloodGroup ? 'text-slate-400' : 'text-slate-900'} ${errors.bloodGroup && touched.bloodGroup ? inputError : inputNormal}`}>
              <option value="">Select Blood Group</option>
              {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
        </FormField>
      </div>

      {/* Password */}
      <FormField id="reg-password" label="Password" error={errors.password} touched={touched.password}>
        <div className="relative flex items-center">
          <InputIcon icon={Lock} />
          <input id="reg-password" type={showPw ? 'text' : 'password'} value={form.password} autoComplete="new-password"
            onChange={(e) => update('password', e.target.value)}
            onBlur={() => touch('password')}
            placeholder="Min. 8 characters"
            aria-invalid={!!errors.password && touched.password}
            className={`${inputBase} pr-11 ${errors.password && touched.password ? inputError : inputNormal}`} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors z-10 rounded-md focus:outline-none"
            aria-label={showPw ? 'Hide password' : 'Show password'}>
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <PasswordStrength password={form.password} />
      </FormField>

      {/* Confirm Password */}
      <FormField id="reg-confirm" label="Confirm Password" error={errors.confirmPassword} touched={touched.confirmPassword}>
        <div className="relative flex items-center">
          <InputIcon icon={Lock} />
          <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} autoComplete="new-password"
            onChange={(e) => update('confirmPassword', e.target.value)}
            onBlur={() => touch('confirmPassword')}
            placeholder="Re-enter your password"
            aria-invalid={!!errors.confirmPassword && touched.confirmPassword}
            className={`${inputBase} pr-11 ${errors.confirmPassword && touched.confirmPassword ? inputError : inputNormal}`} />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors z-10 rounded-md focus:outline-none"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}>
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FormField>

      {/* Password rules checklist */}
      {form.password && (
        <div className="bg-slate-50 rounded-xl p-3 space-y-1 my-2">
          {PASSWORD_RULES.map((rule) => {
            const pass = rule.test(form.password);
            return (
              <div key={rule.label} className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${pass ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
                  }`}>
                  {pass ? <CheckCircle size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                </div>
                <span className={pass ? 'text-emerald-700' : 'text-slate-500'}>{rule.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="w-full h-11 py-2.5 mt-2 bg-gradient-to-r from-slate-800 to-slate-700 text-white text-sm font-semibold rounded-xl hover:from-slate-900 hover:to-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Heart size={16} />}
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}

/* ---- Main Auth Page ---- */
export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="w-full min-h-screen flex flex-col md:flex-row bg-white">
        {/* Left Visual Panel */}
        <LeftPanel />

        {/* Right Form Panel - no inner box, breathing space */}
        <div className="w-full md:w-[55%] lg:w-[60%] bg-slate-50 flex items-center justify-center p-4 sm:p-12 md:p-16">
          <div className="max-w-md w-full mx-auto">
            {/* Mobile brand */}
            <div className="md:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-rose-800 flex items-center justify-center shadow-md">
                <Droplets size={22} className="text-rose-300" />
              </div>
              <span className="text-2xl font-bold text-slate-800">LifeFlow</span>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
              {/* Section Heading */}
              {tab === 'login' ? (
                <div className="mb-6 space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                  <p className="text-sm text-slate-500">Sign in to access your donor dashboard.</p>
                </div>
              ) : (
                <div className="mb-6 space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Join LifeFlow</h2>
                  <p className="text-sm text-slate-500">Create an account and start saving lives.</p>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="bg-slate-100/80 p-1.5 rounded-xl flex gap-1 mb-6" role="tablist">
                <button role="tab" aria-selected={tab === 'login'} onClick={() => setTab('login')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg text-center transition-all duration-200 ${tab === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}>
                  Sign In
                </button>
                <button role="tab" aria-selected={tab === 'register'} onClick={() => setTab('register')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg text-center transition-all duration-200 ${tab === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}>
                  Create Account
                </button>
              </div>

              {/* Tab Content */}
              <div>
                <div className={tab === 'login' ? 'block' : 'hidden'}>
                  <LoginForm onSuccess={(role) => showToast(`Welcome${role === 'Admin' ? ', Admin' : ''}! Redirecting to ${role} Dashboard...`)} onError={(msg) => showToast(msg, 'error')} onInfo={(msg) => showToast(msg, 'success')} />
                  <p className="mt-5 text-center text-sm text-slate-500">
                    Don&apos;t have an account?{' '}
                    <button onClick={() => setTab('register')} className="font-medium text-rose-500 hover:text-rose-600 transition-colors">
                      Sign up free
                    </button>
                  </p>
                </div>

                <div className={tab === 'register' ? 'block' : 'hidden'}>
                  <RegisterForm onSuccess={(role) => showToast(`Welcome${role === 'Admin' ? ', Admin' : ''}! Redirecting to ${role} Dashboard...`)} onError={(msg) => showToast(msg, 'error')} />
                  <p className="mt-5 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <button onClick={() => setTab('login')} className="font-medium text-rose-500 hover:text-rose-600 transition-colors">
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <p className="mt-6 text-center text-xs text-slate-400">
              Trusted by thousands of donors across the country.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
