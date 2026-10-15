/**
 * DGDA Antibiotic / Prescription Compliance Modal
 * Mandated by Bangladesh Directorate General of Drug Administration (DGDA) Model Pharmacy rules.
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, User, Stethoscope, FileText, X, Check } from 'lucide-react';
import { PrescriptionDetails } from '../../types/pharmacy';

interface DgdaPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: PrescriptionDetails) => void;
  initialData?: PrescriptionDetails;
  antibioticNames: string[];
}

export const DgdaPrescriptionModal: React.FC<DgdaPrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  antibioticNames,
}) => {
  const [formData, setFormData] = useState<PrescriptionDetails>(
    initialData || {
      patient_name: '',
      patient_phone: '',
      patient_age: 0,
      patient_gender: 'Male',
      doctor_name: '',
      doctor_bmdc_reg: '',
      hospital_clinic: '',
      prescription_date: new Date().toISOString().split('T')[0],
      indication: '',
    }
  );

  // Sync state if initialData is provided
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        patient_name: '',
        patient_phone: '',
        patient_age: 0,
        patient_gender: 'Male',
        doctor_name: '',
        doctor_bmdc_reg: '',
        hospital_clinic: '',
        prescription_date: new Date().toISOString().split('T')[0],
        indication: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // All fields are optional - allowing smooth checkout during rush hours
    onSave(formData);
    onClose();
  };

  const handleSkipOrQuickSave = () => {
    // Quick checkout without mandatory data
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-bangla text-base">
                প্রেসক্রিপশন ও রোগীর তথ্য (ঐচ্ছিক)
              </h3>
              <p className="text-xs text-slate-600">
                ভীড়ের সময় তথ্য পূরণ বাধ্যতামূলক নয়। চাইলে এড়িয়ে যেতে পারেন বা পরে এন্ট্রি করতে পারেন।
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Antibiotic Notice */}
        <div className="px-6 py-2.5 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900">
          <span className="font-medium font-bangla">শনাক্তকৃত অ্যান্টিবায়োটিক:</span>
          <span className="font-mono font-semibold text-rose-700">
            {antibioticNames.join(', ')}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 font-bangla mb-1">
                রোগীর নাম (ঐচ্ছিক)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  placeholder="যেমন: রোগীর নাম (না দিলে খালি রাখুন)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Patient Age & Gender */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 font-bangla mb-1">
                  বয়স (ঐচ্ছিক)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.patient_age || ''}
                  onChange={(e) => setFormData({ ...formData, patient_age: parseInt(e.target.value) || 0 })}
                  placeholder="বয়স"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 font-bangla mb-1">
                  লিঙ্গ
                </label>
                <select
                  value={formData.patient_gender}
                  onChange={(e) => setFormData({ ...formData, patient_gender: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Male">পুরুষ</option>
                  <option value="Female">মহিলা</option>
                  <option value="Other">অন্যান্য</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 font-bangla mb-1">
                রোগী বা অভিভাবকের মোবাইল (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={formData.patient_phone}
                onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                placeholder="যেমন: ০১৭১xxxxxxx (ঐচ্ছিক)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            {/* BMDC Reg No */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 font-bangla mb-1">
                ডাক্তারের BMDC রেজি. নং (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={formData.doctor_bmdc_reg}
                onChange={(e) => setFormData({ ...formData, doctor_bmdc_reg: e.target.value })}
                placeholder="যেমন: A-12345 (ঐচ্ছিক)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Doctor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 font-bangla mb-1">
                প্রেসক্রিপশন প্রদানকারী ডাক্তার (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={formData.doctor_name}
                onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                placeholder="ডা. নাম ও ডিগ্রি (ঐচ্ছিক)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Hospital / Clinic */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 font-bangla mb-1">
                হাসপাতাল বা ক্লিনিক (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={formData.hospital_clinic}
                onChange={(e) => setFormData({ ...formData, hospital_clinic: e.target.value })}
                placeholder="হাসপাতালের নাম (ঐচ্ছিক)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Indication */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 font-bangla mb-1">
              রোগের লক্ষণ বা কারণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={formData.indication}
              onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
              placeholder="লক্ষণ বা রোগ..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSkipOrQuickSave}
              className="px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
            >
              ভীড়ের সময় সরাসরি বিক্রয় (তথ্য ছাড়া এগিয়ে যান)
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                বাতিল (Esc)
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>সংরক্ষণ ও বিক্রয় (Enter)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
