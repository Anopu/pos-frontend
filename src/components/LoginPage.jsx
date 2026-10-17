import React, { useState, useEffect } from 'react';
import { Lock, User, LogIn, ShieldCheck, AlertCircle, Eye, EyeOff, Store, Globe, Mail, KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getApiBase } from '../utils/apiConfig';

export default function LoginPage({ onLogin, lang: propLang, onToggleLang, onBackToWebsite }) {
  const [localLang, setLocalLang] = useState(() => localStorage.getItem('pos_language') || 'bn');
  const lang = propLang || localLang;

  const handleLanguageToggle = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLocalLang(nextLang);
    localStorage.setItem('pos_language', nextLang);
    if (onToggleLang) onToggleLang(nextLang);
  };

  const txt = (bn, en) => (lang === 'en' ? en : bn);

  // ক্রেডেনশিয়াল ও স্টেপ স্টেট
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ২-স্টেপ ভেরিফিকেশন (2FA OTP) স্টেট
  const [twoFaData, setTwoFaData] = useState(null); // { user_id, username, email, email_masked, dev_otp }
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError(txt('ইউজারনেম এবং পাসওয়ার্ড দিন', 'Please enter username and password'));
      return;
    }

    setLoading(true);
    setError('');
    setResendSuccess('');

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          // টু-স্টেপ ভেরিফিকেশন প্রয়োজন
          setTwoFaData(data);
          setStep('2fa');
          setOtp('');
          setResendCooldown(60);
        } else if (data.user) {
          if (typeof onLogin === 'function') {
            onLogin(data.user);
          }
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

  const handleVerify2fa = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      setError(txt('অনুগ্রহ করে ৬-সংখ্যার ওটিপি কোড দিন', 'Please enter 6-digit OTP code'));
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: twoFaData?.user_id,
          otp: otp.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        if (typeof onLogin === 'function') {
          onLogin(data.user);
        }
      } else {
        setError(data.error || txt('ভেরিফিকেশন কোড ভুল বা মেয়াদোত্তীর্ণ!', 'Invalid or expired verification code!'));
      }
    } catch (err) {
      setError(txt('সার্ভার কানেকশন সমস্যা: ', 'Server connection error: ') + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend2fa = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError('');
    setResendSuccess('');

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/resend-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: twoFaData?.user_id })
      });

      const data = await response.json();
      if (response.ok) {
        setResendSuccess(data.message || txt('নতুন কোড ইমেইলে পাঠানো হয়েছে!', 'New code sent to email!'));
        setResendCooldown(60);
      } else {
        setError(data.error || txt('কোড পাঠাতে সমস্যা হয়েছে', 'Failed to resend code'));
      }
    } catch (err) {
      setError(txt('সার্ভার এরর: ', 'Server error: ') + err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setError('');
    setResendSuccess('');
    setOtp('');
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060b19] via-[#091533] to-[#0d1d47] flex items-center justify-center p-4 relative">
      {/* ওয়েবসাইটে ফিরে যাওয়ার বাটন (টপ-লেফট) */}
      {onBackToWebsite && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={onBackToWebsite}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg hover:scale-105"
            title={txt('ওয়েবসাইটে ফিরে যান', 'Back to Website')}
          >
            <ArrowLeft size={14} className="text-cyan-400" />
            <span>{txt('← এফসি টেকনোলজি ওয়েবসাইট', '← FC Tech Website')}</span>
          </button>
        </div>
      )}

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
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-700 p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mb-3 border border-white/20 shadow-inner">
            {step === '2fa' ? <ShieldCheck className="w-8 h-8 text-white" /> : <Store className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-xl font-black tracking-tight">{txt('এফসি টেকনোলজি পিওএস', 'FC TECHNOLOGY POS')}</h1>
          <p className="text-xs text-blue-100 mt-1">
            {txt('স্মার্ট শপ অটোমেশন ও ইনভেন্টরি ম্যানেজমেন্ট', 'Smart Shop Automation & Inventory Management')}
          </p>
        </div>

        {/* ফর্ম এরিয়া */}
        <div className="p-6 md:p-8">
          {step === 'credentials' ? (
            <>
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
            </>
          ) : (
            /* ================= ২-স্টেপ ভেরিফিকেশন (2FA OTP) স্ক্রিন ================= */
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-2 border border-blue-200">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {txt('দ্বি-স্তরীয় নিরাপত্তা যাচাইকরণ', 'Two-Step Verification')}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {txt('আপনার একাউন্ট সুরক্ষার জন্য ইমেইলে একটি ৬-সংখ্যার কোড পাঠানো হয়েছে', 'A 6-digit verification code has been sent to your registered email')}
                </p>
              </div>

              {/* প্রেরিত ইমেইল প্রিভিউ বক্স */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">
                      {txt('কোড পাঠানো হয়েছে:', 'Code Sent To:')}
                    </span>
                    <span className="font-mono font-bold text-blue-900">
                      {twoFaData?.email_masked || twoFaData?.email}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {txt('১০ মিনিট মেয়াদ', '10 Min Valid')}
                </span>
              </div>

              {/* এরর মেসেজ */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* রিসেন্ড সাকসেস মেসেজ */}
              {resendSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              <form onSubmit={handleVerify2fa} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 text-center">
                    {txt('৬-সংখ্যার ওটিপি কোড (OTP) লিখুন', 'Enter 6-Digit OTP Code')}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-center text-2xl font-mono font-black tracking-[8px] py-2.5 border-2 border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition bg-blue-50/20"
                    disabled={otpLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.length < 6}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={16} /> {txt('যাচাই ও প্রবেশ করুন', 'Verify & Sign In')}
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <ArrowLeft size={14} /> {txt('পিছনে যান', 'Back')}
                </button>

                <button
                  type="button"
                  onClick={handleResend2fa}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={13} className={resendLoading ? 'animate-spin' : ''} />
                  {resendCooldown > 0
                    ? `${txt('পুনরায় পাঠান', 'Resend')} (${resendCooldown}s)`
                    : txt('পুনরায় কোড পাঠান', 'Resend Code')}
                </button>
              </div>
            </div>
          )}

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
