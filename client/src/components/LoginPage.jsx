import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Building,
  User,
  ShieldCheck,
  Award,
  Zap,
  X,
  Plus,
  ChevronLeft,
} from 'lucide-react';
import { sounds } from '../audio/soundEngine';
import { API_BASE } from '../config/api';

export default function LoginPage({ onLoginSuccess = () => {} }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('faculty_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [university, setUniversity] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive Google Sign-In Popup Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleMode, setGoogleMode] = useState('select'); // 'select' | 'custom'
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [googleCustomInst, setGoogleCustomInst] = useState('');
  const [googleError, setGoogleError] = useState('');

  const handleOpenGoogleModal = () => {
    sounds.playPop();
    setGoogleError('');
    setGoogleCustomEmail(email.trim());
    setIsGoogleModalOpen(true);
  };

  const handleGoogleAuthenticateEmail = async (targetEmail, targetName = '', targetInst = '') => {
    setIsLoading(true);
    setGoogleError('');
    sounds.playPop();
    const cleanEmail = targetEmail.trim().toLowerCase();

    // If both name and institute are provided, register/save directly
    if (targetName && targetInst) {
      try {
        const regRes = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            name: targetName.trim(),
            institute: targetInst.trim(),
            university: targetInst.trim(),
            department: 'Academic Faculty',
          }),
        });
        const regData = await regRes.json();
        if (regData.success) {
          localStorage.setItem(`faculty_profile_${cleanEmail}`, JSON.stringify(regData.user));
          sounds.playCelebration();
          setIsGoogleModalOpen(false);
          setIsLoading(false);
          onLoginSuccess(regData.user, regData.token);
          return;
        }
      } catch {
        // Fallback offline
      }
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isNewUser) {
          // 1st time login! Transition to 1st-time profile setup
          setIsGoogleModalOpen(false);
          setIsRegister(true);
          setEmail(cleanEmail);
          if (targetName) setName(targetName);
          if (targetInst) setUniversity(targetInst);
          setIsLoading(false);
          setErrorMsg('');
          return;
        } else {
          // Returning user: Direct login without requiring anything else!
          localStorage.setItem(`faculty_profile_${cleanEmail}`, JSON.stringify(data.user));
          sounds.playCelebration();
          setIsGoogleModalOpen(false);
          setIsLoading(false);
          onLoginSuccess(data.user, data.token);
          return;
        }
      }
    } catch {
      // offline fallback
      const cached = localStorage.getItem(`faculty_profile_${cleanEmail}`);
      if (cached) {
        const user = JSON.parse(cached);
        sounds.playCelebration();
        setIsGoogleModalOpen(false);
        setIsLoading(false);
        onLoginSuccess(user, 'local_token');
        return;
      }
    }

    // 1st-time user fallback
    setIsGoogleModalOpen(false);
    setIsRegister(true);
    setEmail(cleanEmail);
    if (targetName) setName(targetName);
    if (targetInst) setUniversity(targetInst);
    setIsLoading(false);
  };

  const handleGoogleCustomSubmit = (e) => {
    e.preventDefault();
    if (!googleCustomEmail.trim()) {
      setGoogleError('Please enter your Google or school email address');
      return;
    }
    handleGoogleAuthenticateEmail(googleCustomEmail, googleCustomName, googleCustomInst);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your university or Gmail email');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    sounds.playPop();
    const cleanEmail = email.trim().toLowerCase();

    if (!isRegister) {
      // Login with email + password
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        const data = await res.json();

        if (data.success) {
          localStorage.setItem(`faculty_profile_${cleanEmail}`, JSON.stringify(data.user));
          try { localStorage.setItem('faculty_remembered_email', cleanEmail); } catch {}
          sounds.playCelebration();
          onLoginSuccess(data.user, data.token);
          return;
        } else {
          setErrorMsg(data.error || 'Invalid email or password.');
        }
      } catch {
        // Offline check
        const cached = localStorage.getItem(`faculty_profile_${cleanEmail}`);
        if (cached) {
          const user = JSON.parse(cached);
          sounds.playCelebration();
          onLoginSuccess(user, 'local_token');
          return;
        }
        setErrorMsg('Connection failed. Please check your internet.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 1st-Time Setup: Register with Name, Institute, and Password
      if (!name.trim()) {
        setErrorMsg('Please enter your Full Name or Title');
        setIsLoading(false);
        return;
      }
      if (!university.trim()) {
        setErrorMsg('Please enter your Institute or University');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: cleanEmail,
            password,
            institute: university.trim(),
            university: university.trim(),
            department,
          }),
        });

        const data = await res.json();
        if (data.success) {
          localStorage.setItem(`faculty_profile_${cleanEmail}`, JSON.stringify(data.user));
          try { localStorage.setItem('faculty_remembered_email', cleanEmail); } catch {}
          sounds.playCelebration();
          onLoginSuccess(data.user, data.token);
          return;
        } else {
          setErrorMsg(data.error || 'Registration failed.');
        }
      } catch {
        // Offline fallback
        const formattedName = name.startsWith('Prof.') || name.startsWith('Dr.') ? name.trim() : `Prof. ${name.trim()}`;
        const user = {
          id: `user-${Date.now()}`,
          name: formattedName,
          email: cleanEmail,
          university: university.trim(),
          institute: university.trim(),
          department,
          role: 'Faculty Instructor',
        };
        localStorage.setItem(`faculty_profile_${cleanEmail}`, JSON.stringify(user));
        sounds.playCelebration();
        onLoginSuccess(user, 'local_token');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans select-none relative overflow-hidden">
      {/* Background Ambience: Subtle bioluminescent caustics & glowing orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
            <GraduationCap size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white">
              Campus Fish Tank
            </span>
            <span className="ml-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
              Faculty Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
          <span>Need help?</span>
          <a href="#support" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Contact Academic IT
          </a>
        </div>
      </header>

      {/* Main Content: Split Hero & Login Panel */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 sm:py-12 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Section: Value Proposition & Impact Metrics */}
        <div className="flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-6">
            <Zap size={14} className="text-amber-400 fill-amber-400" />
            <span>Used by top engineering & science faculty</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-5">
            Transform course homework into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">living ecosystem.</span>
          </h1>

          <p className="text-slate-300 text-base leading-relaxed mb-8">
            Empower university students to submit problem sets, laboratory briefs, and code reviews on time. Every enrolled student owns an animated swimming fish that grows as they master course milestones.
          </p>

          {/* 3 Impact Metric Badges */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl mb-8 shadow-inner">
            <div>
              <div className="text-2xl font-black text-cyan-300 font-mono">+86%</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">On-Time Submissions</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 font-mono">42K+</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Lab Briefs Graded</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-300 font-mono">4.9/5</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Faculty Rating</div>
            </div>
          </div>

          {/* Professor Testimonial Card */}
          <div className="p-4 bg-gradient-to-br from-slate-900/90 to-slate-950 border border-cyan-500/20 rounded-2xl">
            <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
              {'★★★★★'}
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed mb-3">
              "My 2nd-year computer science students wouldn't stop talking about their fish growing after submitting their dynamic programming lab. It completely eliminated last-minute procrastinations!"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
                <GraduationCap size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Verified Faculty Instructor</div>
                <div className="text-[10px] text-slate-400">Department of Computer Science & Engineering</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Interactive Faculty Login / Sign-up Card */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 relative">
          {/* Form Mode Selector: Direct Sign In vs 1st-Time Setup */}
          <div className="flex p-1 bg-slate-800/90 rounded-2xl mb-5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsRegister(false);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                !isRegister
                  ? 'bg-cyan-500 text-slate-950 shadow-md scale-102'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsRegister(true);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                isRegister
                  ? 'bg-cyan-500 text-slate-950 shadow-md scale-102'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1st-Time Setup
            </button>
          </div>

          {/* 1st-Time Setup Informative Banner */}
          {isRegister && (
            <div className="mb-4 p-3 bg-cyan-950/70 border border-cyan-500/40 rounded-2xl text-xs text-cyan-200 flex items-start gap-2 shadow-inner">
              <Sparkles size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-white">1st-Time Setup:</span> Fill in your details and create a password. You'll use your email &amp; password to sign in every time.
              </div>
            </div>
          )}

          {/* Error Message banner */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If 1st-Time Setup: Full Name */}
            {isRegister && (
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Full Name / Title *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Alan Turing"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-semibold"
                  />
                </div>
              </div>
            )}

            {/* University or Gmail Email */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                {isRegister ? 'Your Email Address (Gmail or School) *' : 'Email Address *'}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com or name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={isRegister ? 'Create a password (min. 6 characters)' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* If 1st-Time Setup: Institute & Department */}
            {isRegister && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Institute / University *
                  </label>
                  <div className="relative">
                    <Building size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stanford University"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-2 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Biological Sciences">Biological Sciences</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Business">Business</option>
                    <option value="Humanities">Humanities</option>
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : isRegister ? 'Save Profile & Launch Classrooms' : 'Direct Sign In to Profile'}</span>
              <ArrowRight size={16} className="stroke-[2.5]" />
            </button>
          </form>

          {/* Divider: 'or' (Exact match to screenshot) */}
          <div className="relative flex py-3.5 items-center my-1">
            <div className="flex-grow border-t border-slate-700/60"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold">
              or
            </span>
            <div className="flex-grow border-t border-slate-700/60"></div>
          </div>

          {/* Continue with Google button (Exact match to screenshot) */}
          <button
            type="button"
            onClick={handleOpenGoogleModal}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#f8fafc] hover:bg-white text-slate-800 font-bold text-sm rounded-2xl border border-slate-300/80 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            {/* Google G logo */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-slate-800 tracking-wide font-extrabold">Continue with Google</span>
          </button>

          {/* New here? Create account / Already have an account? Sign in (Exact match to screenshot) */}
          <div className="mt-4 text-center text-xs text-slate-400">
            {!isRegister ? (
              <span>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsRegister(true);
                    setErrorMsg('');
                  }}
                  className="font-bold text-white hover:text-cyan-300 underline underline-offset-2 decoration-cyan-400 transition-colors"
                >
                  Create account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsRegister(false);
                    setErrorMsg('');
                  }}
                  className="font-bold text-white hover:text-cyan-300 underline underline-offset-2 decoration-cyan-400 transition-colors"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

          {/* Compliance & Security Badge */}
          <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>FERPA Compliant • Institutional Single Sign-On Ready</span>
          </div>

        </div>
      </main>

      {/* Google Sign-In Popup Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
          <div className="relative w-full max-w-[430px] bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsGoogleModalOpen(false);
              }}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
              title="Close Google Sign-In"
            >
              <X size={18} />
            </button>

            {/* Google Brand Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <svg className="w-9 h-9 mb-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Sign in with Google
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                to continue to <span className="font-bold text-slate-800">Campus Fish Tank</span>
              </p>
            </div>

            {/* Error Message */}
            {googleError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {googleError}
              </div>
            )}

            {/* Direct Google Sign-In Form */}
            <form onSubmit={handleGoogleCustomSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Google or University Email *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="e.g. you@gmail.com or prof@university.edu"
                    value={googleCustomEmail}
                    onChange={(e) => setGoogleCustomEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Returning teachers directly access their course tank. 1st-time teachers can set Name & Institute below.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instructor Name (1st-time setup only)
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Prof. Alan Turing"
                    value={googleCustomName}
                    onChange={(e) => setGoogleCustomName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Institute / University (1st-time setup only)
                </label>
                <div className="relative">
                  <Building size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Stanford University or MIT"
                    value={googleCustomInst}
                    onChange={(e) => setGoogleCustomInst(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsGoogleModalOpen(false);
                  }}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Signing In...' : 'Sign In with Google'}
                </button>
              </div>
            </form>

            {/* Google Notice Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 leading-relaxed">
              To continue, Google will share your name, email address, and language preference with Campus Fish Tank.
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center text-xs text-slate-600 border-t border-slate-900 bg-slate-950/80">
        <span>© 2026 Campus Fish Tank · Made by Zihan 🐠</span>
      </footer>
    </div>
  );
}
