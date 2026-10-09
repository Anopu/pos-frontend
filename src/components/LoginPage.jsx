import React, { useState } from 'react';
import { Lock, User, LogIn, ShieldCheck, AlertCircle, Eye, EyeOff, Store, Globe } from 'lucide-react';

export default function LoginPage({ onLogin, lang: propLang, onToggleLang }) {
  const [localLang, setLocalLang] = useState(() => localStorage.getItem('pos_language') || 'bn');
  const lang = propLang || localLang;

  const handleLanguageToggle = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLocalLang(nextLang);
    localStorage.setItem('pos_language', nextLang);
    if (onToggleLang) onToggleLang(nextLang);
  };

  const txt = (bn, en) => (lang === 'en' ? en : bn);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError(txt('ইউজারনেম এবং পাসওয়ার্ড দিন', 'Please enter username and password'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5010/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        if (typeof onLogin === 'function') {
          onLogin(data.user);
        }
      } else {
        setError(data.error || txt('লগইন ব্যর্থ হয়েছে! সঠিক তথ্য প্রদান করুন।', 'Login failed! Please check your credentials.'));
      }
    } catch (err) {
      setError(txt(
        'সার্ভারে যোগাযোগ করা সম্ভব হয়নি। ব্যাকএন্ড সার্ভার (Port 5010) চালু আছে কিনা নিশ্চিত করুন।',
        'Could not connect to server. Please ensure backend server (Port 5010) is running.'
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative">
      {/* ল্যাঙ্গুয়েজ সুইচ বাটন (টপ-রাইট) */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleLanguageToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg"
          title={txt('ভাষা পরিবর্তন করুন', 'Switch Language')}
        >
          <Globe size={14} className="text-amber-400" />
          <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* হেডার ব্যানার */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mb-3 border border-white/20 shadow-inner">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight">FC TECHNOLOGY POS</h1>
          <p className="text-xs text-blue-100 mt-1">
            {txt('স্মার্ট শপ অটোমেশন ও ইনভেন্টরি ম্যানেজমেন্ট', 'Smart Shop Automation & Inventory Management')}
          </p>
        </div>

        {/* ফর্ম এরিয়া */}
        <div className="p-6 md:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-gray-800">
              {txt('সিস্টেমে লগইন করুন', 'Sign In to System')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {txt('আপনার ইউজার আইডি ও পাসওয়ার্ড দিয়ে প্রবেশ করুন', 'Enter your user ID and password to access')}
            </p>
          </div>

          {/* কুইক রোল বাটন */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
              {txt('দ্রুত সিলেক্ট করুন (ডেমো)', 'Quick Select (Demo)')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <ShieldCheck size={14} /> 👑 {txt('অ্যাডমিন', 'Admin')}
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sales', 'sales123')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <User size={14} /> 👤 {txt('সেলস এক্সিকিউটিভ', 'Sales Executive')}
              </button>
            </div>
          </div>

          {/* এরর মেসেজ */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {txt('ইউজারনেম', 'Username')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder={txt('admin বা sales', 'admin or sales')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {txt('পাসওয়ার্ড', 'Password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={txt('আপনার পাসওয়ার্ড লিখুন', 'Enter your password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} /> {txt('লগইন করুন', 'Sign In')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">
              FC Technology © 2026 • {txt('সর্বস্বত্ব সংরক্ষিত', 'All Rights Reserved')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
