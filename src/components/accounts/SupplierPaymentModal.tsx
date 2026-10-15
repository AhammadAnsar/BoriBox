/**
 * SupplierPaymentModal.tsx
 * ওষুধ প্রস্তুতকারক / পাইকারি সাপ্লায়ারের বকেয়া পরিশোধ এন্ট্রি
 * BoriBox Pharmacy Management (Step 9)
 */

import React, { useState } from 'react';
import { X, Building2, CreditCard, AlertCircle } from 'lucide-react';
import { SupplierBill } from '../../types/pharmacy';
import { toBengaliNumber } from '../../services/unitCalculator';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  bill: SupplierBill | null;
  onClose: () => void;
  onRecordPayment: (billId: string, amount: number, method: 'CASH' | 'BKASH' | 'BANK', note: string) => void;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  bill,
  onClose,
  onRecordPayment,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'CASH' | 'BKASH' | 'BANK'>('BANK');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !bill) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('পরিশোধের টাকার পরিমাণ দিন');
      return;
    }
    if (Number(amount) > bill.due_amount) {
      setError(`বকেয়া টাকার (৳ ${toBengaliNumber(bill.due_amount.toFixed(2))}) চেয়ে বেশি দেওয়া সম্ভব নয়`);
      return;
    }

    onRecordPayment(bill.id, Number(amount), method, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 font-bangla">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">সাপ্লায়ার বকেয়া পরিশোধ</h3>
              <p className="text-xs text-slate-500">ওষুধ কোম্পানি ও পাইকারি চালান পেমেন্ট</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary Card */}
        <div className="mx-6 mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-bold text-slate-900 text-sm">{bill.supplier_name}</span>
              <div className="text-slate-500 font-sans mt-0.5">{bill.company}</div>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800 text-[11px]">
              চালান: {bill.invoice_no}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
            <div>
              <div className="text-slate-400 text-[11px]">মোট চালান বিল</div>
              <div className="font-bold font-mono text-slate-800 mt-0.5">
                ৳ {toBengaliNumber(bill.total_amount.toFixed(0))}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">পরিশোধিত</div>
              <div className="font-bold font-mono text-emerald-700 mt-0.5">
                ৳ {toBengaliNumber(bill.paid_amount.toFixed(0))}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">অবশিষ্ট বকেয়া</div>
              <div className="font-bold font-mono text-rose-700 mt-0.5">
                ৳ {toBengaliNumber(bill.due_amount.toFixed(0))}
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
                পরিশোধের পরিমাণ (৳) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(bill.due_amount)}
                className="text-[11px] text-sky-600 hover:text-sky-800 font-bold underline"
              >
                সম্পূর্ণ বকেয়া (৳ {toBengaliNumber(bill.due_amount.toFixed(0))}) নির্বাচন করুন
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 font-bold text-slate-400">৳</span>
              <input
                type="number"
                min="1"
                max={bill.due_amount}
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
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'BANK', label: 'ব্যাংক চেক / EFTN' },
                { id: 'BKASH', label: 'বিকাশ / নগদ' },
                { id: 'CASH', label: 'নগদ ক্যাশ' },
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
              মানি রসিদ বা চেক নম্বর / রেফারেন্স নোট
            </label>
            <input
              type="text"
              placeholder="উদা: চেক নং ৪৪৯১০ অথবা পে-স্লিপ নম্বর"
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
              <CreditCard className="w-4 h-4" />
              <span>পেমেন্ট নিশ্চিত করুন</span>
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
