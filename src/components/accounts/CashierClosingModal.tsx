/**
 * CashierClosingModal.tsx
 * ক্যাশিয়ার শিফট ও ডে ক্লোজিং ক্যালকুলেশন মডাল
 * BoriBox Pharmacy Management (Step 9)
 */

import React, { useState } from 'react';
import { X, Lock, Calculator, ArrowRight, DollarSign, Wallet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CashierClosing } from '../../types/pharmacy';
import { toBengaliNumber } from '../../services/unitCalculator';

interface CashierClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  todaySales: {
    cashSales: number;
    digitalSales: number;
    cardSales: number;
    totalSales: number;
    totalDiscounts: number;
  };
  drawerExpenses: number;
  onConfirmClosing: (closingData: CashierClosing) => void;
}

export const CashierClosingModal: React.FC<CashierClosingModalProps> = ({
  isOpen,
  onClose,
  todaySales,
  drawerExpenses,
  onConfirmClosing,
}) => {
  const [shiftName, setShiftName] = useState('সারাদিনের হিসাব (Full Day)');
  const [cashierName, setCashierName] = useState('ফার্মাসিস্ট মো: রফিকুল ইসলাম');
  const [openingCash, setOpeningCash] = useState<number | ''>(2000); // Typical starting float
  const [actualCash, setActualCash] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validOpening = typeof openingCash === 'number' ? openingCash : 0;
  const expectedCash = validOpening + todaySales.cashSales - drawerExpenses;
  const validActual = typeof actualCash === 'number' ? actualCash : 0;
  const variance = typeof actualCash === 'number' ? validActual - expectedCash : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCash === '' || isNaN(Number(actualCash))) {
      setError('অনুগ্রহ করে ড্রয়ারে থাকা বাস্তব গণনাকৃত ক্যাশের পরিমাণ লিখুন');
      return;
    }

    const closing: CashierClosing = {
      id: `closing-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      shift_name: shiftName,
      cashier_name: cashierName,
      opening_cash: validOpening,
      cash_sales: todaySales.cashSales,
      digital_sales: todaySales.digitalSales,
      card_sales: todaySales.cardSales,
      total_sales: todaySales.totalSales,
      total_discounts: todaySales.totalDiscounts,
      drawer_expenses: drawerExpenses,
      expected_cash: expectedCash,
      actual_cash: Number(actualCash),
      variance,
      status: 'CLOSED',
      closed_at: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      notes: notes.trim() || undefined,
    };

    onConfirmClosing(closing);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-bangla">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-sky-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ক্যাশিয়ার ডে ক্লোজিং ও ব্যালেন্স সমন্বয়
              </h3>
              <p className="text-xs text-slate-500">
                দৈনিক ক্যাশ ড্রয়ার হিসাব, নগদ ঘাটতি/উদ্বৃত্ত ও Z-রিপোর্ট
              </p>
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
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">শিফটের ধরন</label>
              <select
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="সারাদিনের হিসাব (Full Day)">সারাদিনের হিসাব (Full Day)</option>
                <option value="সকালের শিফট (Morning Shift)">সকালের শিফট (Morning Shift)</option>
                <option value="রাতের শিফট (Night Shift)">রাতের শিফট (Night Shift)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">দায়িত্বপ্রাপ্ত ক্যাশিয়ার</label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Reconciliation Ledger Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ক্যাশ ড্রয়ার হিসাব বিবরণী
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-600">১. প্রারম্ভিক ক্যাশ ফ্লোট (Opening Cash):</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-600">২. আজকের নগদ বিক্রয় (Cash Sales):</span>
              <span className="font-mono font-bold text-emerald-700">
                + ৳ {toBengaliNumber(todaySales.cashSales.toFixed(2))}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-600">৩. ড্রয়ার থেকে খরচ / পেমেন্ট (Drawer Outflow):</span>
              <span className="font-mono font-bold text-rose-700">
                - ৳ {toBengaliNumber(drawerExpenses.toFixed(2))}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 bg-sky-50/80 px-2.5 rounded-lg border border-sky-100">
              <span className="font-bold text-sky-950">
                হিসাবকৃত প্রত্যাশিত ড্রয়ার ক্যাশ (Expected Cash):
              </span>
              <span className="font-mono font-bold text-sm text-sky-900">
                ৳ {toBengaliNumber(expectedCash.toFixed(2))}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
              <span>ডিজিটাল বিক্রয় (বিকাশ/নগদ): ৳ {toBengaliNumber(todaySales.digitalSales.toFixed(2))}</span>
              <span>কার্ড বিক্রয়: ৳ {toBengaliNumber(todaySales.cardSales.toFixed(2))}</span>
            </div>
          </div>

          {/* Actual Cash Input & Variance calculation */}
          <div className="p-4 bg-white rounded-xl border-2 border-sky-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-bold text-slate-900 text-sm">
                  ড্রয়ারের বাস্তব গণনাকৃত ক্যাশ <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  কাউন্টার ক্যাশ ড্রয়ারে থাকা সমস্ত নোট ও কয়েন গণনা করে বসান
                </p>
              </div>
              <div className="w-36 relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="০.০০"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full pl-7 pr-3 py-2 bg-sky-50/40 border border-sky-400 rounded-lg text-slate-900 font-mono font-bold text-base text-right focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {actualCash !== '' && (
              <div
                className={`p-3 rounded-lg flex items-center justify-between border ${
                  variance === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : variance < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {variance === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <div className="font-bold">
                      {variance === 0
                        ? 'সঠিক ব্যালেন্স! কোনো গরমিল নেই'
                        : variance < 0
                        ? 'ক্যাশ ড্রয়ার ঘাটতি (Cash Short)'
                        : 'ক্যাশ ড্রয়ার বাড়তি (Cash Excess)'}
                    </div>
                    <div className="text-[11px]">
                      {variance === 0
                        ? 'প্রত্যাশিত এবং গণনাকৃত ক্যাশ সম্পূর্ণ মিলে গেছে'
                        : `পার্থক্য: ৳ ${toBengaliNumber(Math.abs(variance).toFixed(2))}`}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-base">
                  {variance === 0 ? '৳ ০.০০' : `৳ ${toBengaliNumber(Math.abs(variance).toFixed(2))}`}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ক্লোজিং নোট বা মন্তব্য (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="উদা: ১০০০ টাকার ভাংতি কম ছিল অথবা ঘাটতির কারণ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>শিফট ক্লোজিং সম্পন্ন ও Z-রিপোর্ট জেনারেট করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
