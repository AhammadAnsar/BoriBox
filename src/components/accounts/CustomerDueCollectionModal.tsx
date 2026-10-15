/**
 * CustomerDueCollectionModal.tsx
 * গ্রাহক বা রোগীর বাকি টাকা আদায় ও রসিদ এন্ট্রি
 * BoriBox Pharmacy Management (Step 9)
 */

import React, { useState } from 'react';
import { X, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { CustomerDue } from '../../types/pharmacy';
import { toBengaliNumber } from '../../services/unitCalculator';

interface CustomerDueCollectionModalProps {
  isOpen: boolean;
  dueItem: CustomerDue | null;
  onClose: () => void;
  onCollectDue: (dueId: string, amount: number, method: 'CASH' | 'BKASH' | 'NAGAD', note: string) => void;
}

export const CustomerDueCollectionModal: React.FC<CustomerDueCollectionModalProps> = ({
  isOpen,
  dueItem,
  onClose,
  onCollectDue,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'CASH' | 'BKASH' | 'NAGAD'>('CASH');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !dueItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('আদায়ের টাকার পরিমাণ লিখুন');
      return;
    }
    if (Number(amount) > dueItem.due_amount) {
      setError(`বকেয়া বাকি টাকার (৳ ${toBengaliNumber(dueItem.due_amount.toFixed(2))}) চেয়ে বেশি আদায় সম্ভব নয়`);
      return;
    }

    onCollectDue(dueItem.id, Number(amount), method, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 font-bangla">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">গ্রাহক বাকি আদায়</h3>
              <p className="text-xs text-slate-500">বাকির খাতা থেকে আদায় ও ক্যাশ সমন্বয়</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Due Details Card */}
        <div className="mx-6 mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-bold text-slate-900 text-sm">{dueItem.customer_name}</span>
              <div className="text-slate-500 font-sans mt-0.5">{dueItem.customer_phone}</div>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-sky-100 text-sky-800 text-[11px]">
              মেমো: {dueItem.invoice_number}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
            <div>
              <div className="text-slate-400 text-[11px]">মোট বিক্রয় বিল</div>
              <div className="font-bold font-mono text-slate-800 mt-0.5">
                ৳ {toBengaliNumber(dueItem.total_bill.toFixed(0))}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">পূর্বে পরিশোধিত</div>
              <div className="font-bold font-mono text-emerald-700 mt-0.5">
                ৳ {toBengaliNumber(dueItem.paid_amount.toFixed(0))}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">বর্তমান বাকি</div>
              <div className="font-bold font-mono text-rose-700 mt-0.5">
                ৳ {toBengaliNumber(dueItem.due_amount.toFixed(0))}
              </div>
            </div>
          </div>
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
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                আদায়ের পরিমাণ (৳) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(dueItem.due_amount)}
                className="text-[11px] text-sky-600 hover:text-sky-800 font-bold underline"
              >
                পুরো বাকি (৳ {toBengaliNumber(dueItem.due_amount.toFixed(0))}) আদায়
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 font-bold text-slate-400">৳</span>
              <input
                type="number"
                min="1"
                max={dueItem.due_amount}
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
              আদায়ের মাধ্যম <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'নগদ ক্যাশ (ড্রয়ার)' },
                { id: 'BKASH', label: 'বিকাশ (bKash)' },
                { id: 'NAGAD', label: 'নগদ (Nagad)' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={`p-2 rounded-lg border text-center font-medium transition-all ${
                    method === m.id
                      ? 'bg-sky-50 border-sky-500 text-sky-800 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              আদায় নোট বা মানি রসিদ মন্তব্য (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="উদা: গ্রাহক নিজে এসে পরিশোধ করেছেন"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>বাকি আদায় নিশ্চিত করুন</span>
              {amount && Number(amount) > 0 && (
                <span className="font-mono text-emerald-100">
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
