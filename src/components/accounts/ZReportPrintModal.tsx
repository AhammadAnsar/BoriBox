/**
 * ZReportPrintModal.tsx
 * ক্যাশিয়ার শিফট ক্লোজিং Z-রিপোর্ট প্রিন্ট ও থার্মাল প্রিভিউ মডাল
 * BoriBox Pharmacy Management (Step 9)
 */

import React from 'react';
import { X, Printer, CheckCircle, AlertTriangle, Copy, Check } from 'lucide-react';
import { CashierClosing } from '../../types/pharmacy';
import { toBengaliNumber } from '../../services/unitCalculator';

interface ZReportPrintModalProps {
  isOpen: boolean;
  closing: CashierClosing | null;
  onClose: () => void;
}

export const ZReportPrintModal: React.FC<ZReportPrintModalProps> = ({
  isOpen,
  closing,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !closing) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `
========================================
     জনতা মডেল ফার্মেসি (JANATA PHARMACY)
    ডিজিডিএ মডেল ফার্মেসি লাইসেন্স: DGDA/DHK-4891
========================================
ক্যাশিয়ার শিফট ক্লোজিং Z-রিপোর্ট
তারিখ: ${closing.date} | শিফট: ${closing.shift_name}
ক্যাশিয়ার: ${closing.cashier_name}
ক্লোজিং সময়: ${closing.closed_at || new Date().toLocaleTimeString('bn-BD')}
----------------------------------------
প্রারম্ভিক ক্যাশ ড্রয়ার: ৳ ${closing.opening_cash.toFixed(2)}
মোট বিক্রয়: ৳ ${closing.total_sales.toFixed(2)}
মোট ডিসকাউন্ট: ৳ ${closing.total_discounts.toFixed(2)}
----------------------------------------
বিক্রয় মাধ্যম বিভাজন:
- নগদ ক্যাশ: ৳ ${closing.cash_sales.toFixed(2)}
- ডিজিটাল (বিকাশ/নগদ): ৳ ${closing.digital_sales.toFixed(2)}
- ব্যাংক কার্ড: ৳ ${closing.card_sales.toFixed(2)}
----------------------------------------
ড্রয়ার থেকে খরচ: ৳ ${closing.drawer_expenses.toFixed(2)}
প্রত্যাশিত ড্রয়ার ক্যাশ: ৳ ${closing.expected_cash.toFixed(2)}
গণনাকৃত ড্রয়ার ক্যাশ: ৳ ${closing.actual_cash.toFixed(2)}
পার্থক্য (শর্ট/এক্সেস): ৳ ${closing.variance.toFixed(2)} (${
      closing.variance === 0 ? 'ব্যালেন্স সঠিক' : closing.variance > 0 ? 'ক্যাশ বেশি' : 'ক্যাশ ঘাটতি'
    })
----------------------------------------
ক্যাশিয়ার স্বাক্ষর: _____________
ম্যানেজার স্বাক্ষর: _____________
========================================
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isShortage = closing.variance < 0;
  const isExcess = closing.variance > 0;
  const isBalanced = closing.variance === 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-bangla">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="text-sm font-bold text-slate-900">
              ক্যাশিয়ার ডে ক্লোজিং Z-রিপোর্ট (প্রিন্ট ভিউ)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg text-xs flex items-center gap-1 transition-colors"
              title="টেক্সট কপি করুন"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div
            id="printable-z-report"
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-slate-200 text-slate-900 font-mono text-[12px] leading-relaxed select-text"
          >
            {/* Pharmacy Branding */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-bold text-slate-900 font-bangla">
                জনতা মডেল ফার্মেসি
              </h2>
              <p className="text-[10px] text-slate-600 font-bangla mt-0.5">
                মডেল ফার্মেসি ও ড্রাগ কর্নার
              </p>
              <p className="text-[10px] text-slate-500 font-sans">
                ডিজিডিএ লাইসেন্স: DGDA/DHK-4891
              </p>
              <p className="text-[10px] text-slate-500 font-bangla">
                ফোন: ০১৭০০-১১২২৩৩ | ঢাকা
              </p>
            </div>

            {/* Z-Report Title Banner */}
            <div className="py-2.5 text-center border-b border-dashed border-slate-300">
              <span className="font-bold text-[13px] tracking-wider bg-slate-100 px-2.5 py-0.5 rounded font-bangla">
                *** শিফট ক্লোজিং Z-রিপোর্ট ***
              </span>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-bangla">
                <span>তারিখ: {toBengaliNumber(closing.date)}</span>
                <span>শিফট: {closing.shift_name}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bangla">
                <span>ক্যাশিয়ার: {closing.cashier_name}</span>
                <span>{closing.closed_at || new Date().toLocaleTimeString('bn-BD')}</span>
              </div>
            </div>

            {/* Cash Flow Summary */}
            <div className="py-3 space-y-1.5 border-b border-dashed border-slate-300 font-bangla">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>প্রারম্ভিক ক্যাশ ড্রয়ার:</span>
                <span className="font-bold font-mono">
                  ৳ {toBengaliNumber(closing.opening_cash.toFixed(2))}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-900 font-semibold">
                <span>মোট বিক্রয় রেভিনিউ:</span>
                <span className="font-bold font-mono text-emerald-700">
                  ৳ {toBengaliNumber(closing.total_sales.toFixed(2))}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>প্রদত্ত মোট ডিসকাউন্ট:</span>
                <span className="font-mono text-slate-600">
                  - ৳ {toBengaliNumber(closing.total_discounts.toFixed(2))}
                </span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 font-bangla text-[11px]">
              <div className="font-bold text-slate-800 text-[10px] uppercase text-slate-400">
                পেমেন্ট মেথড বিভাজন:
              </div>
              <div className="flex justify-between text-slate-700">
                <span>· নগদ ক্যাশ বিক্রয়:</span>
                <span className="font-mono font-bold">
                  ৳ {toBengaliNumber(closing.cash_sales.toFixed(2))}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>· বিকাশ / নগদ ডিজিটাল:</span>
                <span className="font-mono font-bold">
                  ৳ {toBengaliNumber(closing.digital_sales.toFixed(2))}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>· ব্যাংক কার্ড পেমেন্ট:</span>
                <span className="font-mono font-bold">
                  ৳ {toBengaliNumber(closing.card_sales.toFixed(2))}
                </span>
              </div>
            </div>

            {/* Cash in Drawer Reconciliation */}
            <div className="py-3 space-y-1.5 border-b-2 border-slate-900 font-bangla">
              <div className="flex justify-between text-[11px] text-rose-700">
                <span>ড্রয়ার থেকে খরচ / উত্তোলন:</span>
                <span className="font-mono font-bold">
                  - ৳ {toBengaliNumber(closing.drawer_expenses.toFixed(2))}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>প্রত্যাশিত ড্রয়ার ক্যাশ:</span>
                <span className="font-mono">৳ {toBengaliNumber(closing.expected_cash.toFixed(2))}</span>
              </div>
              <div className="flex justify-between text-[12px] font-bold text-sky-800">
                <span>প্রকৃত গণনাকৃত ক্যাশ:</span>
                <span className="font-mono">৳ {toBengaliNumber(closing.actual_cash.toFixed(2))}</span>
              </div>

              {/* Variance Tag */}
              <div
                className={`mt-2 p-2 rounded flex items-center justify-between text-xs font-bold ${
                  isBalanced
                    ? 'bg-emerald-50 text-emerald-800'
                    : isShortage
                    ? 'bg-rose-50 text-rose-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                <span>
                  {isBalanced ? 'স্ট্যাটাস: সঠিক ব্যালেন্স' : isShortage ? 'ক্যাশ ঘাটতি (Short):' : 'ক্যাশ বাড়তি (Excess):'}
                </span>
                <span className="font-mono text-sm">
                  {isBalanced ? '৳ ০.০০' : `৳ ${toBengaliNumber(Math.abs(closing.variance).toFixed(2))}`}
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 pb-3 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500 font-bangla">
              <div>
                <div className="border-t border-slate-300 pt-1 font-semibold text-slate-700">
                  ক্যাশিয়ার স্বাক্ষর
                </div>
                <div className="text-[9px]">{closing.cashier_name}</div>
              </div>
              <div>
                <div className="border-t border-slate-300 pt-1 font-semibold text-slate-700">
                  ম্যানেজার স্বাক্ষর
                </div>
                <div className="text-[9px]">অনুমোদিত</div>
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-400 font-bangla pt-2">
              বোরিবক্স পিওএস ও অ্যাকাউন্টস ইঞ্জিন দ্বারা স্বয়ংক্রিয়ভাবে জেনারেটকৃত
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500 font-bangla flex items-center gap-1.5">
            {isBalanced ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> ড্রয়ার ব্যালেন্স সম্পূর্ণ সমন্বিত
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> অসামঞ্জস্য রেকর্ড করা হয়েছে
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
            >
              বন্ধ করুন
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Z-রিপোর্ট প্রিন্ট করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
