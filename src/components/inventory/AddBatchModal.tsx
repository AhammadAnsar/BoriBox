/**
 * AddBatchModal.tsx
 * স্টক ও মজুদ এন্ট্রি - ডাইনামিক ইউনিট কনভার্সন ও কঠোর FEFO ব্যাচ ট্র্যাকিং
 * BoriBox Pharmacy Management
 */

import React, { useState, useMemo } from 'react';
import { Product, StockBatch, UnitType } from '../../types/pharmacy';
import { convertToPieces, toBengaliNumber } from '../../services/unitCalculator';
import { analyzeExpiry } from '../../services/fefoEngine';
import { HybridLogicalClock } from '../../services/crdtSyncEngine';
import {
  X,
  PackagePlus,
  Calendar,
  Layers,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface AddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  preselectedProductId?: string;
  onAddBatch: (batch: StockBatch) => void;
}

const hlcClock = new HybridLogicalClock('DESKTOP_MAIN');

export const AddBatchModal: React.FC<AddBatchModalProps> = ({
  isOpen,
  onClose,
  products,
  preselectedProductId,
  onAddBatch,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProductId || products[0]?.id || ''
  );
  const [batchNumber, setBatchNumber] = useState('');
  // Default to 18 months from now
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 18);
    return d.toISOString().split('T')[0];
  });
  const [rackLocation, setRackLocation] = useState('র্যাক A-01');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [inputUnit, setInputUnit] = useState<UnitType>('box');
  const [inputQuantity, setInputQuantity] = useState<number>(5);
  const [customCostPerPiece, setCustomCostPerPiece] = useState<number | ''>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastHlc, setLastHlc] = useState<string>('');

  const currentProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Dynamic calculated total pieces
  const calculatedPieces = useMemo(() => {
    if (!currentProduct || inputQuantity <= 0) return 0;
    return convertToPieces(inputQuantity, inputUnit, currentProduct);
  }, [inputQuantity, inputUnit, currentProduct]);

  // Unit breakdown text
  const unitBreakdownText = useMemo(() => {
    if (!currentProduct || calculatedPieces <= 0) return '০ পিস';
    const piecesPerStrip = currentProduct.pieces_per_strip || 1;
    const piecesPerBox = currentProduct.pieces_per_box || 100;

    if (inputUnit === 'box') {
      const totalStrips = inputQuantity * currentProduct.strips_per_box;
      return `${toBengaliNumber(inputQuantity)} বক্স = ${toBengaliNumber(totalStrips)} পাতা = ${toBengaliNumber(calculatedPieces)} পিস`;
    }
    if (inputUnit === 'strip') {
      const boxes = Math.floor(calculatedPieces / piecesPerBox);
      const remStrips = inputQuantity % (currentProduct.strips_per_box || 1);
      return `${toBengaliNumber(inputQuantity)} পাতা (${toBengaliNumber(boxes)} বক্স ${toBengaliNumber(remStrips)} পাতা) = ${toBengaliNumber(calculatedPieces)} পিস`;
    }
    return `${toBengaliNumber(calculatedPieces)} পিস`;
  }, [inputQuantity, inputUnit, calculatedPieces, currentProduct]);

  // Expiry preview
  const expiryAnalysis = useMemo(() => {
    if (!expiryDate) return null;
    return analyzeExpiry(expiryDate);
  }, [expiryDate]);

  // Cost calculations
  const costPerPiece = typeof customCostPerPiece === 'number' && customCostPerPiece > 0
    ? customCostPerPiece
    : (currentProduct?.cost_per_piece || 0);

  const totalCost = calculatedPieces * costPerPiece;
  const potentialMrpTotal = calculatedPieces * (currentProduct?.mrp_per_piece || 0);
  const potentialProfit = potentialMrpTotal - totalCost;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!currentProduct) {
      setValidationError('অনুগ্রহ করে একটি ওষুধ নির্বাচন করুন।');
      return;
    }

    if (!batchNumber.trim()) {
      setValidationError('ব্যাচ নম্বর দেওয়া বাধ্যতামূলক (FEFO ট্র্যাকিংয়ের জন্য)।');
      return;
    }

    if (!expiryDate) {
      setValidationError('মেয়াদোত্তীর্ণের তারিখ দেওয়া বাধ্যতামূলক।');
      return;
    }

    if (calculatedPieces <= 0) {
      setValidationError('স্টকের পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।');
      return;
    }

    // Generate CRDT HLC timestamp for peer synchronization
    const hlcTimestamp = hlcClock.now();
    setLastHlc(hlcTimestamp);

    const newBatch: StockBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: currentProduct.id,
      batch_number: batchNumber.trim().toUpperCase(),
      expiry_date: expiryDate,
      rack_location: rackLocation.trim() || 'র্যাক A-01',
      available_pieces: calculatedPieces,
      cost_per_piece: Number(costPerPiece.toFixed(2)),
      created_at: new Date().toISOString().split('T')[0],
      supplier_invoice_no: supplierInvoiceNo.trim() || undefined,
      is_recalled: false,
    };

    onAddBatch(newBatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-bangla animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 text-xs text-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                নতুন স্টক রিসিভ ও ব্যাচ এন্ট্রি
              </h2>
              <p className="text-[11px] text-slate-500">
                স্বয়ংক্রিয় একক রূপান্তর ও কঠোর FEFO (ফার্স্ট এক্সপায়ার, ফার্স্ট আউট) ট্র্যাকিং
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Medicine Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ওষুধ নির্বাচন করুন <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((x) => x.id === e.target.value);
                if (p) {
                  setCustomCostPerPiece(p.cost_per_piece);
                }
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand_name} ({p.generic_name}) - {p.manufacturer} [{p.dosage_form}]
                </option>
              ))}
            </select>
            {currentProduct && (
              <div className="mt-1.5 text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-700">ডিজিডিএ ডিএআর: {currentProduct.dgda_dar_number}</span>
                <span>·</span>
                <span>প্যাকেজিং: ১ বক্সে {toBengaliNumber(currentProduct.strips_per_box)} পাতা ({toBengaliNumber(currentProduct.pieces_per_box)} পিস)</span>
                {currentProduct.is_antibiotic && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                    অ্যান্টিবায়োটিক
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quantity & Dynamic Unit Conversion Box */}
          <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                স্টকের পরিমাণ ও একক নির্বাচন (Dynamic Unit Conversion)
              </span>
              <span className="text-[10px] text-sky-600 font-medium">বেস একক: পিস (Piece)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">পরিমাণ (সংখ্যা)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={inputQuantity}
                  onChange={(e) => setInputQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 bg-white border border-sky-300 rounded-lg text-slate-900 font-mono font-bold text-center text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">একক (Unit Type)</label>
                <select
                  value={inputUnit}
                  onChange={(e) => setInputUnit(e.target.value as UnitType)}
                  className="w-full p-2 bg-white border border-sky-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="box">বক্স (Box - {currentProduct?.pieces_per_box || 100} পিস)</option>
                  <option value="strip">পাতা (Strip - {currentProduct?.pieces_per_strip || 10} পিস)</option>
                  <option value="piece">পিস (Piece - ১ পিস)</option>
                </select>
              </div>
            </div>

            {/* Live calculation banner */}
            <div className="bg-white p-2.5 rounded-lg border border-sky-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">স্বয়ংক্রিয় রূপান্তর ফলাফল:</div>
                <div className="text-xs font-bold text-sky-950 mt-0.5">
                  {unitBreakdownText}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">ডাটাবেজে যুক্ত হবে:</div>
                <div className="text-sm font-mono font-bold text-emerald-600">
                  +{toBengaliNumber(calculatedPieces)} পিস
                </div>
              </div>
            </div>
          </div>

          {/* Strict FEFO: Batch Number & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <span>ব্যাচ নম্বর</span>
                <span className="text-rose-500">* (FEFO)</span>
              </label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="যেমন: BATCH-2026-X"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">কোম্পানির প্রস্তুতকৃত ব্যাচ নম্বর</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>মেয়াদোত্তীর্ণের তারিখ</span>
                <span className="text-rose-500">* (FEFO)</span>
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {expiryAnalysis && (
                <div className="mt-1 flex items-center gap-1 text-[11px]">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${expiryAnalysis.badgeClass}`}>
                    {expiryAnalysis.labelBengali}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Location & Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>র্যাক / তাকের অবস্থান</span>
              </label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                placeholder="যেমন: র্যাক A-02 অথবা ফ্রিজ-১"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>চালান / ইনভয়েস নং</span>
                <span className="text-[10px] text-slate-400 font-normal">(ঐচ্ছিক)</span>
              </label>
              <input
                type="text"
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                placeholder="যেমন: CH-8902"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Cost Price per piece & financial summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                মূল্য ও ইনভেন্টরি হিসাব (টাকা)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                MRP: ৳ {toBengaliNumber((currentProduct?.mrp_per_piece || 0).toFixed(2))} / পিস
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500">ক্রয়মূল্য (পিস)</div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPerPiece}
                  onChange={(e) => setCustomCostPerPiece(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 font-mono font-bold text-center text-xs text-slate-900 border-b border-slate-300 focus:outline-none"
                />
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500">মোট ক্রয়মূল্য</div>
                <div className="font-mono font-bold text-xs text-slate-800 mt-1">
                  ৳ {toBengaliNumber(totalCost.toFixed(2))}
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500">সম্ভাব্য মোট বিক্রয়</div>
                <div className="font-mono font-bold text-xs text-emerald-700 mt-1">
                  ৳ {toBengaliNumber(potentialMrpTotal.toFixed(2))}
                </div>
              </div>
            </div>
          </div>

          {/* CRDT backend indicator */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Cpu className="w-3 h-3 text-sky-600" />
              <span>CRDT SQLite Engine: HLC সিঙ্ক রেডি</span>
            </span>
            <span className="font-mono text-slate-500">Node: DESKTOP_MAIN</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>স্টকে যুক্ত করুন ({toBengaliNumber(calculatedPieces)} পিস)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
