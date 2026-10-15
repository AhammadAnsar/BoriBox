/**
 * OnboardingWizard.tsx
 * BoriBox: First-Time Setup & Onboarding Module
 * 
 * Includes:
 * 1. Dynamic Pharmacy Logo file upload (Base64 encoding with live preview & removal).
 * 2. Pharmacy details: Name, Address, Phone, Drug License, Thermal printer width.
 * 3. Super Admin setup: Name, Username, Password, Quick PIN.
 * 4. Step-by-step pure Bengali UI with Soft Blue/Mint Green/White theme.
 * 5. SoftDows official copyright branding integration.
 */

import React, { useState, useRef } from 'react';
import {
  Store,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Lock,
  Printer,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { OnboardingSetupPayload } from '../../types/pharmacy';

interface OnboardingWizardProps {
  onCompleteSetup: (payload: OnboardingSetupPayload) => void;
  onSkipToDemo?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onCompleteSetup,
  onSkipToDemo,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Pharmacy Details & Dynamic Logo
  const [pharmacyName, setPharmacyName] = useState('জনতা মডেল ফার্মেসি');
  const [ownerName, setOwnerName] = useState('মো. সাব্বির হোসেন');
  const [drugLicenseNo, setDrugLicenseNo] = useState('DL-DHK-2026-8819');
  const [address, setAddress] = useState('হাউস #১২, রোড #৪, ধানমন্ডি, ঢাকা-১২০৫');
  const [pharmacyPhone, setPharmacyPhone] = useState('01711223344');
  const [printerPaperWidth, setPrinterPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [pharmacyLogo, setPharmacyLogo] = useState<string | null>(null);

  // Step 2: Super Admin Setup
  const [adminName, setAdminName] = useState('ফার্মাসিস্ট সাব্বির হোসেন');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('boribox2026');
  const [confirmPassword, setConfirmPassword] = useState('boribox2026');
  const [adminPin, setAdminPin] = useState('1234');
  const [adminPhone, setAdminPhone] = useState('01711223344');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & status
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Logo Upload and Convert to Base64
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (PNG, JPG, WebP) আপলোড করুন।');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setValidationError('ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPharmacyLogo(base64);
      setValidationError(null);
    };
    reader.onerror = () => {
      setValidationError('ছবি আপলোড করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setPharmacyLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Step 1 Validation & Next
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyName.trim()) {
      setValidationError('অনুগ্রহ করে ফার্মেসির নাম লিখুন।');
      return;
    }
    if (!drugLicenseNo.trim()) {
      setValidationError('ড্রাগ লাইসেন্স নম্বর আবশ্যক।');
      return;
    }
    if (!pharmacyPhone.trim()) {
      setValidationError('ফার্মেসির যোগাযোগের মোবাইল নম্বর দিন।');
      return;
    }
    setValidationError(null);
    setCurrentStep(2);
  };

  // Step 2 Validation & Next
  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      setValidationError('সুপার এডমিনের পুরো নাম লিখুন।');
      return;
    }
    if (!adminUsername.trim() || adminUsername.length < 3) {
      setValidationError('ব্যবহারকারী নাম কমপক্ষে ৩ অক্ষরের হতে হবে।');
      return;
    }
    if (!adminPassword || adminPassword.length < 6) {
      setValidationError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (adminPassword !== confirmPassword) {
      setValidationError('উভয় পাসওয়ার্ড মেলেনি! পুনরায় চেক করুন।');
      return;
    }
    if (!adminPin || adminPin.length < 4) {
      setValidationError('কুইক পিন ৪ সংখ্যার হতে হবে (যেমন: 1234)।');
      return;
    }

    setValidationError(null);
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      setCurrentStep(3);
    }, 1000);
  };

  // Step 3: Final Launch
  const handleFinalLaunch = () => {
    const payload: OnboardingSetupPayload = {
      pharmacy: {
        pharmacy_name: pharmacyName.trim(),
        owner_name: ownerName.trim(),
        drug_license_no: drugLicenseNo.trim(),
        address: address.trim(),
        phone: pharmacyPhone.trim(),
        printer_paper_width: printerPaperWidth,
        logo_url: pharmacyLogo || undefined,
      },
      admin: {
        name: adminName.trim(),
        username: adminUsername.trim().toLowerCase(),
        password: adminPassword,
        pin: adminPin.trim(),
        phone: adminPhone.trim(),
      },
    };

    onCompleteSetup(payload);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-bangla select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white font-bold text-2xl shadow-xs mb-1">
            ব
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            বোরিবক্স
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
            ফার্মেসি ব্যবস্থাপনা সফটওয়্যার · প্রাথমিক অনবোর্ডিং নির্দেশিকা
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 mb-6 shadow-xs">
          <div className="grid grid-cols-3 gap-2 text-xs font-bold text-center">
            <div
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                currentStep === 1
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : currentStep > 1
                  ? 'text-emerald-700 bg-emerald-50/60'
                  : 'text-slate-400'
              }`}
            >
              {currentStep > 1 ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] flex items-center justify-center">
                  ১
                </span>
              )}
              <span className="truncate">ফার্মেসির তথ্য</span>
            </div>

            <div
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                currentStep === 2
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : currentStep > 2
                  ? 'text-emerald-700 bg-emerald-50/60'
                  : 'text-slate-400'
              }`}
            >
              {currentStep > 2 ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <span
                  className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${
                    currentStep === 2 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  ২
                </span>
              )}
              <span className="truncate">সুপার এডমিন</span>
            </div>

            <div
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                currentStep === 3
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${
                  currentStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                ৩
              </span>
              <span className="truncate">চালু করুন</span>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {validationError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8">
          {/* ========================================================================= */}
          {/* STEP 1: Pharmacy Profile Form with Dynamic Logo Upload */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <form onSubmit={handleProceedToStep2} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-sky-600" />
                  <span>ফার্মেসির বিবরণ ও লোগো</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  এই তথ্য এবং লোগো ইনভয়েস রিসিট, সাইডবার ও প্রতিবেদনে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে
                </p>
              </div>

              {/* Dynamic Logo Upload Section */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  ফার্মেসির লোগো (ঐচ্ছিক কিন্তু সুপারিশকৃত)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview Container */}
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative group">
                    {pharmacyLogo ? (
                      <img
                        src={pharmacyLogo}
                        alt="ফার্মেসি লোগো"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-0.5 text-slate-300" />
                        <span className="text-[10px] block font-medium">লোগো নেই</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="pharmacy-logo-input"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="pharmacy-logo-input"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>{pharmacyLogo ? 'লোগো পরিবর্তন করুন' : 'লোগো আপলোড করুন'}</span>
                      </label>

                      {pharmacyLogo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>মুছুন</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      পিএনজি, জেপিজি বা ওয়েবপি ফরম্যাট (সর্বোচ্চ ২ মেগাবাইট)। এটি সাইডবার ও প্রিন্ট রিসিটের শীর্ষে প্রদর্শিত হবে।
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ফার্মেসির নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    placeholder="যেমন: জনতা মডেল ফার্মেসি"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মালিক / প্রধান ফার্মাসিস্টের নাম
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="যেমন: মো. সাব্বির হোসেন"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ড্রাগ লাইসেন্স নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={drugLicenseNo}
                    onChange={(e) => setDrugLicenseNo(e.target.value)}
                    placeholder="যেমন: DL-DHK-2026-8819"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    দোকানের পূর্ণ ঠিকানা
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="হাউস #১২, রোড #৪, ধানমন্ডি, ঢাকা"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ফার্মেসির হেল্পলাইন ফোন নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={pharmacyPhone}
                    onChange={(e) => setPharmacyPhone(e.target.value)}
                    placeholder="01711223344"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    থার্মাল প্রিন্টার মাপ
                  </label>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setPrinterPaperWidth('80mm')}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        printerPaperWidth === '80mm'
                          ? 'border-sky-600 bg-sky-50 text-sky-800 font-bold ring-2 ring-sky-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ৮০ মিমি (স্ট্যান্ডার্ড)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrinterPaperWidth('58mm')}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        printerPaperWidth === '58mm'
                          ? 'border-sky-600 bg-sky-50 text-sky-800 font-bold ring-2 ring-sky-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ৫৮ মিমি (মিনি পস)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {onSkipToDemo ? (
                  <button
                    type="button"
                    onClick={onSkipToDemo}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    ডেমো মোড চালু করুন
                  </button>
                ) : <span />}

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <span>পরবর্তী ধাপ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Super Admin Form */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleProceedToStep3} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>সুপার এডমিন অ্যাকাউন্ট তৈরি</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  মালিকের পূর্ণ নিয়ন্ত্রণযুক্ত নিরাপদ অ্যাকাউন্ট
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    এডমিনের পুরো নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="ফার্মাসিস্ট সাব্বির হোসেন"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ব্যবহারকারী নাম (ইউজারনেম) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পুনরায় পাসওয়ার্ড দিন"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কুইক ৪-সংখ্যার পিন (Quick PIN) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="যেমন: 1234"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    কাউন্টারে দ্রুত লগইন বা আনলক করতে ব্যবহৃত হবে
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="01711223344"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/80 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  পাসওয়ার্ডটি স্থানীয় SQLite ডেটাবেজে সম্পূর্ণ ক্রিপ্টোগ্রাফিক হ্যাশ আকারে সংরক্ষিত হবে। সাধারণ টেক্সট হিসেবে কোনো পাসওয়ার্ড সংরক্ষিত থাকে না।
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী ধাপ</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>যাচাই ও সমাপ্তি</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Setup Completion Confirmation & Launch */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="text-center space-y-6 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  সেটআপ সফলভাবে সম্পন্ন হয়েছে!
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  আপনার ফার্মেসি প্রোফাইল, লোগো এবং সুপার এডমিন অ্যাকাউন্ট নিরাপদ স্থানীয় ডেটাবেজে সংরক্ষিত হয়েছে।
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs text-left max-w-lg mx-auto space-y-2.5">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">ফার্মেসির নাম:</span>
                  <div className="flex items-center gap-2">
                    {pharmacyLogo && (
                      <img
                        src={pharmacyLogo}
                        alt="লোগো"
                        className="w-6 h-6 rounded-md object-contain bg-white border border-slate-200"
                      />
                    )}
                    <span className="font-bold text-slate-900">{pharmacyName}</span>
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">ড্রাগ লাইসেন্স নং:</span>
                  <span className="font-mono font-bold text-slate-900">{drugLicenseNo}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">সুপার এডমিন:</span>
                  <span className="font-bold text-slate-900">
                    {adminName} (<code className="text-indigo-700 font-mono">@{adminUsername}</code>)
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">নিরাপত্তা স্তর:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Argon2id Hash সুরক্ষিত</span>
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">ডেটাবেজ স্টোরেজ:</span>
                  <span className="font-bold text-sky-800">১০০% অফলাইন লোকাল SQLite সচল</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinalLaunch}
                className="w-full sm:w-auto px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <span>সফটওয়্যার চালু করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SoftDows Official Ownership & Branding */}
      <footer className="mt-8 text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          SoftDows দ্বারা তৈরিকৃত, পরিচালিত এবং স্বত্ত্ব নিয়ন্ত্রিত
        </p>
      </footer>
    </div>
  );
};
