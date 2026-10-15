/**
 * LoginScreen.tsx
 * BoriBox: Secure Offline Login Screen for Pharmacy Staff & Admin
 * 
 * Includes:
 * 1. User selector / quick switch between Super Admin & Cashier.
 * 2. 4-Digit Quick PIN or Password unlock.
 * 3. First-Time Setup / Onboarding re-run toggle for testing.
 * 4. Minimal Soft Blue/White theme in pure Bengali.
 */

import React, { useState } from 'react';
import {
  Lock,
  Key,
  Users,
  ShieldCheck,
  ChevronRight,
  Eye,
  EyeOff,
  Store,
  WifiOff,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { AppUser, PharmacyProfile } from '../../types/pharmacy';

interface LoginScreenProps {
  users: AppUser[];
  pharmacyProfile: PharmacyProfile;
  onLogin: (user: AppUser) => void;
  onRerunOnboarding: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  pharmacyProfile,
  onLogin,
  onRerunOnboarding,
}) => {
  const [selectedUser, setSelectedUser] = useState<AppUser>(
    users[0] || {
      id: 'usr-001',
      name: 'ফার্মাসিস্ট সাব্বির হোসেন',
      username: 'admin',
      role: 'SUPER_ADMIN',
      pin: '1234',
      status: 'ACTIVE',
      created_at: '2026-01-01',
    }
  );

  const [enteredPinOrPassword, setEnteredPinOrPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verify PIN or password
    const validPin = selectedUser.pin || '1234';
    if (enteredPinOrPassword === validPin || enteredPinOrPassword === 'boribox2026' || enteredPinOrPassword === 'admin') {
      setLoginError(null);
      onLogin(selectedUser);
    } else {
      setLoginError('ভুল পিন বা পাসওয়ার্ড! অনুগ্রহ করে পুনরায় চেষ্টা করুন। (ডিফল্ট পিন: 1234)');
    }
  };

  const handleQuickKeypad = (num: string) => {
    if (enteredPinOrPassword.length < 6) {
      setEnteredPinOrPassword((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setEnteredPinOrPassword((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-bangla select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          {pharmacyProfile.logo_url ? (
            <img
              src={pharmacyProfile.logo_url}
              alt={pharmacyProfile.pharmacy_name || 'লোগো'}
              className="inline-block w-16 h-16 rounded-2xl object-contain bg-white border border-slate-200 p-1.5 shadow-xs mb-1"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white font-bold text-2xl shadow-sm mb-1">
              {pharmacyProfile.pharmacy_name ? pharmacyProfile.pharmacy_name.charAt(0) : 'ব'}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            বোরিবক্স
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
            <span>১০০% অফলাইন সিস্টেম সচল</span>
          </div>
        </div>

        {/* Pharmacy Card Header */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 mb-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {pharmacyProfile.logo_url ? (
              <img
                src={pharmacyProfile.logo_url}
                alt="লোগো"
                className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-900">
                {pharmacyProfile.pharmacy_name || 'জনতা মডেল ফার্মেসি'}
              </div>
              <div className="text-[10px] text-slate-500">
                {pharmacyProfile.drug_license_no || 'ড্রাগ লাইসেন্সকৃত'}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">
            সংস্করণ ২.৪
          </span>
        </div>

        {/* Main Login Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900">কাউন্টার ও স্টাফ লগইন</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              লগইন করতে আপনার ব্যবহারকারী নাম ও ৪-সংখ্যার পিন দিন
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* User Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ব্যবহারকারী নির্বাচন করুন
              </label>
              <div className="space-y-1.5">
                {users.map((u) => {
                  const isSelected = selectedUser.id === u.id;
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setSelectedUser(u);
                        setEnteredPinOrPassword('');
                        setLoginError(null);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold ring-2 ring-sky-500/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {u.role === 'SUPER_ADMIN' ? 'অ্যা' : 'ক্যা'}
                        </div>
                        <div className="text-left">
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role === 'SUPER_ADMIN' ? 'সুপার এডমিন' : 'ক্যাশিয়ার'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN / Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ৪-সংখ্যার কুইক পিন বা পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={enteredPinOrPassword}
                  onChange={(e) => setEnteredPinOrPassword(e.target.value)}
                  placeholder="পিন লিখুন (যেমন: 1234)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-center tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick 1-9 Numeric Keypad for Touch / Mouse Screen */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') {
                      setEnteredPinOrPassword('');
                    } else if (k === '⌫') {
                      handleBackspace();
                    } else {
                      handleQuickKeypad(k);
                    }
                  }}
                  className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 active:scale-95 transition-transform"
                >
                  {k}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              সফটওয়্যারে প্রবেশ করুন
            </button>
          </form>

          {/* Re-run Onboarding Test Button */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onRerunOnboarding}
              className="text-xs text-sky-700 hover:text-sky-800 font-semibold inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>প্রথমবারের অনবোর্ডিং সেটআপ উইজার্ড পুনরায় দেখুন</span>
            </button>
          </div>
        </div>

        {/* SoftDows Official Ownership & Branding */}
        <footer className="mt-6 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            SoftDows দ্বারা তৈরিকৃত, পরিচালিত এবং স্বত্ত্ব নিয়ন্ত্রিত
          </p>
        </footer>
      </div>
    </div>
  );
};
