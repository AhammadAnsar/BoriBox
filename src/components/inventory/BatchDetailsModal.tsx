/**
 * BatchDetailsModal.tsx
 * ওষুধের বিস্তারিত FEFO ব্যাচ তালিকা ও স্টকের অবস্থা
 * BoriBox Pharmacy Management
 */

import React from 'react';
import { Product, StockBatch } from '../../types/pharmacy';
import { breakdownPieces, toBengaliNumber } from '../../services/unitCalculator';
import { analyzeExpiry } from '../../services/fefoEngine';
import {
  X,
  Layers,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  Plus,
  ShieldAlert,
  Boxes,
} from 'lucide-react';

interface BatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  batches: StockBatch[];
  onOpenAddBatchForProduct: (productId: string) => void;
  onToggleBatchRecall?: (batchId: string) => void;
}

export const BatchDetailsModal: React.FC<BatchDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  batches,
  onOpenAddBatchForProduct,
  onToggleBatchRecall,
}) => {
  if (!isOpen || !product) return null;

  // Filter batches for this product and sort strict FEFO (earliest expiry first)
  const productBatches = batches
    .filter((b) => b.product_id === product.id)
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

  const totalPieces = productBatches.reduce((acc, b) => acc + b.available_pieces, 0);
  const totalBreakdown = breakdownPieces(totalPieces, product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-bangla animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-xs text-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-sans">
                {product.brand_name}
              </h2>
              <span className="text-xs text-slate-500 font-sans">
                ({product.generic_name})
              </span>
              {product.is_antibiotic && (
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                  অ্যান্টিবায়োটিক
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {product.manufacturer} · {product.dosage_form} · {product.strength} · DGDA DAR: {product.dgda_dar_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Row */}
        <div className="mt-4 p-3 bg-sky-50/70 rounded-xl border border-sky-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-sky-800 font-medium">মোট মজুদ পরিমাণ</div>
              <div className="text-sm font-bold text-sky-950 font-sans">
                {totalBreakdown.formattedBengali} ({toBengaliNumber(totalPieces)} পিস)
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenAddBatchForProduct(product.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>এই ওষুধে নতুন ব্যাচ যুক্ত করুন</span>
          </button>
        </div>

        {/* FEFO Batches List */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>FEFO ভিত্তিক সক্রিয় ব্যাচের তালিকা (মেয়াদ অনুযায়ী সাজানো)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              মোট {toBengaliNumber(productBatches.length)} টি ব্যাচ
            </span>
          </div>

          {productBatches.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              এই ওষুধের কোনো সক্রিয় ব্যাচ নেই।
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {productBatches.map((batch, index) => {
                const expiry = analyzeExpiry(batch.expiry_date);
                const breakdown = breakdownPieces(batch.available_pieces, product);
                const isOutOfStock = batch.available_pieces <= 0;

                return (
                  <div
                    key={batch.id}
                    className={`p-3 rounded-xl border transition-all ${
                      batch.is_recalled
                        ? 'bg-rose-50 border-rose-300'
                        : expiry.status === 'EXPIRED' || expiry.status === 'CRITICAL'
                        ? 'bg-rose-50/70 border-rose-200'
                        : expiry.status === 'WARNING'
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Left: Batch & Expiry */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            #{toBengaliNumber(index + 1)} FEFO
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {batch.batch_number}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${expiry.badgeClass}`}
                          >
                            {expiry.labelBengali}
                          </span>
                          {batch.is_recalled && (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              ডিজিডিএ প্রত্যাহারকৃত
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-sans">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            মেয়াদ: <strong className="text-slate-700 font-mono">{batch.expiry_date}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            তাক: <strong className="text-slate-700">{batch.rack_location}</strong>
                          </span>
                          {batch.supplier_invoice_no && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              চালান: <strong className="text-slate-700 font-mono">{batch.supplier_invoice_no}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Quantity & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right">
                          <div className={`font-bold font-sans ${isOutOfStock ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {breakdown.formattedBengali}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ({toBengaliNumber(batch.available_pieces)} পিস)
                          </div>
                        </div>

                        {onToggleBatchRecall && (
                          <button
                            onClick={() => onToggleBatchRecall(batch.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                              batch.is_recalled
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700'
                            }`}
                            title={batch.is_recalled ? 'রিকল বাতিল করুন' : 'নিরাপত্তা প্রত্যাহার মার্ক করুন'}
                          >
                            {batch.is_recalled ? 'রিকল রিমুভ' : 'রিকল মার্ক'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
