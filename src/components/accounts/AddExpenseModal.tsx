/**
 * AddExpenseModal.tsx
 * ফার্মেসির দৈনন্দিন দোকান খরচ ও পেটি ক্যাশ এন্ট্রি
 * BoriBox Pharmacy Management (Step 9)
 */

import React, { useState } from 'react';
import { X, Receipt, Wallet, AlertCircle } from 'lucide-react';
import { PharmacyExpense, ExpenseCategory } from '../../types/pharmacy';
import { toBengaliNumber } from '../../services/unitCalculator';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: PharmacyExpense) => void;
}

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'TEA_SNACKS', label: 'কাউন্টার স্টাফ চা-নাস্তা ও পানি' },
  { value: 'TRANSPORT', label: 'ওষুধ পরিবহন ও কুরিয়ার খরচ' },
  { value: 'MAINTENANCE', label: 'দোকান মেরামত ও প্রিন্টার পেপার রোল' },
  { value: 'ELECTRICITY', label: 'বিদ্যুৎ বিল (ডেসকো/পল্লী বিদ্যুৎ)' },
  { value: 'RENT', label: 'দোকানের মাসিক ভাড়া' },
  { value: 'SALARY', label: 'কর্মচারীর বেতন বা দৈনিক হাতখরচ' },
  { value: 'SUPPLIER_PAYMENT', label: 'সাপ্লায়ার পাইকারি চালান নগদ পরিশোধ' },
  { value: 'OTHER', label: 'অন্যান্য জরুরি খরচ' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('TEA_SNACKS');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'BANK'>('CASH');
  const [isPaidFromDrawer, setIsPaidFromDrawer] = useState(true);
  const [note, setNote] = useState('');
  const [recordedBy, setRecordedBy] = useState('ফার্মাসিস্ট রফিক');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('অনুগ্রহ করে খরচের বিবরণ বা শিরোনাম লিখুন');
      return;
    }
    if (!amount || amount <= 0) {
      setError('সঠিক খরচের পরিমাণ (টাকা) উল্লেখ করুন');
      return;
    }

    const newExpense: PharmacyExpense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category,
      title: title.trim(),
      amount: Number(amount),
      payment_method: paymentMethod,
      is_paid_from_drawer: paymentMethod === 'CASH' ? isPaidFromDrawer : false,
      note: note.trim() || undefined,
      recorded_by: recordedBy.trim() || 'ক্যাশিয়ার',
    };

    onAddExpense(newExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 font-bangla">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">দোকানের নতুন খরচ এন্ট্রি</h3>
              <p className="text-xs text-slate-500">দৈনন্দিন পরিচালন ব্যয় ও ক্যাশ ড্রয়ার হিসাব</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              খরচের খাত বা ধরন <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ExpenseCategory);
                const opt = CATEGORY_OPTIONS.find((c) => c.value === e.target.value);
                if (opt && !title) setTitle(opt.label);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              খরচের বিবরণ বা বিস্তারিত <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="উদা: বিকেলের চা-নাস্তা / রিকশা ভাড়া / প্রিন্টার পেপার"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="০.০০"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                পরিশোধের মাধ্যম <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const m = e.target.value as any;
                  setPaymentMethod(m);
                  if (m !== 'CASH') setIsPaidFromDrawer(false);
                  else setIsPaidFromDrawer(true);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="CASH">ক্যাশ (নগদ)</option>
                <option value="BKASH">বিকাশ (bKash)</option>
                <option value="NAGAD">নগদ (Nagad)</option>
                <option value="BANK">ব্যাংক একাউন্ট</option>
              </select>
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">কাউন্টার ক্যাশ ড্রয়ার থেকে পরিশোধ</div>
                  <div className="text-[11px] text-slate-500">
                    দিনের ক্যাশ ক্লোজিংয়ে ড্রয়ার থেকে স্বয়ংক্রিয়ভাবে বিয়োগ হবে
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPaidFromDrawer}
                onChange={(e) => setIsPaidFromDrawer(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded-sm border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">এন্ট্রি প্রদানকারী</label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">অতিরিক্ত নোট (ঐচ্ছিক)</label>
              <input
                type="text"
                placeholder="রসিদ নম্বর বা মন্তব্য"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>খরচ সংরক্ষণ করুন</span>
              {amount && Number(amount) > 0 && (
                <span className="font-mono text-sky-100">
                  (৳ {toBengaliNumber(Number(amount).toFixed(0))})
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
