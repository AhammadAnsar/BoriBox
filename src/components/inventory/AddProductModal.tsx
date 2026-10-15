/**
 * AddProductModal.tsx
 * নতুন ওষুধ প্রোফাইল তৈরি - ডিজিডিএ (DGDA) কমপ্লায়েন্স ও মাল্টি-লেভেল ইউনিট কনফিগারেশন
 * BoriBox Pharmacy Management
 */

import React, { useState } from 'react';
import { Product, StockBatch, DrugSchedule } from '../../types/pharmacy';
import { toBengaliNumber } from '../../services/unitCalculator';
import { HybridLogicalClock } from '../../services/crdtSyncEngine';
import {
  X,
  FilePlus,
  ShieldCheck,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Layers,
} from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
  onAddBatch?: (batch: StockBatch) => void;
}

const hlcClock = new HybridLogicalClock('DESKTOP_MAIN');

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  onAddBatch,
}) => {
  // Basic info
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [manufacturer, setManufacturer] = useState('Square Pharmaceuticals PLC');
  const [category, setCategory] = useState('Anti-ulcerant');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('20 mg');
  const [barcodeGtin, setBarcodeGtin] = useState(`894${Math.floor(1000000000 + Math.random() * 9000000000)}`);

  // DGDA Compliance Fields
  const [dgdaDarNumber, setDgdaDarNumber] = useState('DAR-');
  const [schedule, setSchedule] = useState<DrugSchedule>('OTC');
  const [isAntibiotic, setIsAntibiotic] = useState(false);
  const [isPrescriptionRequired, setIsPrescriptionRequired] = useState(false);
  const [storageTemp, setStorageTemp] = useState('Below 30°C');

  // Dynamic Packaging Ratios (Base unit is always Piece)
  const [piecesPerStrip, setPiecesPerStrip] = useState<number>(10);
  const [stripsPerBox, setStripsPerBox] = useState<number>(10);

  // Pricing
  const [costPerPiece, setCostPerPiece] = useState<number>(4.50);
  const [mrpPerPiece, setMrpPerPiece] = useState<number>(6.00);

  // Initial batch receive option
  const [includeInitialBatch, setIncludeInitialBatch] = useState(true);
  const [initialBatchNumber, setInitialBatchNumber] = useState('');
  const [initialExpiryDate, setInitialExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 18);
    return d.toISOString().split('T')[0];
  });
  const [initialBoxes, setInitialBoxes] = useState<number>(5);
  const [initialRack, setInitialRack] = useState('র্যাক A-01');

  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-calculated pieces per box
  const piecesPerBox = Math.max(1, piecesPerStrip * stripsPerBox);
  const mrpPerStrip = Number((mrpPerPiece * piecesPerStrip).toFixed(2));
  const mrpPerBox = Number((mrpPerPiece * piecesPerBox).toFixed(2));

  if (!isOpen) return null;

  // Schedule change handler
  const handleScheduleChange = (newSched: DrugSchedule) => {
    setSchedule(newSched);
    if (newSched === 'ANTIBIOTIC') {
      setIsAntibiotic(true);
      setIsPrescriptionRequired(true);
    } else if (newSched === 'PRESCRIPTION_ONLY' || newSched === 'NARCOTIC') {
      setIsAntibiotic(false);
      setIsPrescriptionRequired(true);
    } else {
      setIsAntibiotic(false);
      setIsPrescriptionRequired(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!brandName.trim()) {
      setValidationError('ওষুধের ব্র্যান্ডের নাম দেওয়া আবশ্যক।');
      return;
    }
    if (!genericName.trim()) {
      setValidationError('জেনেরিক নাম দেওয়া আবশ্যক।');
      return;
    }
    if (!dgdaDarNumber.trim() || dgdaDarNumber.trim() === 'DAR-') {
      setValidationError('ডিজিডিএ রেজিস্ট্রেশন নম্বর (DAR No) দেওয়া আবশ্যক।');
      return;
    }

    if (includeInitialBatch && (!initialBatchNumber.trim() || !initialExpiryDate)) {
      setValidationError('প্রাথমিক স্টক ব্যাচের জন্য ব্যাচ নম্বর ও মেয়াদোত্তীর্ণের তারিখ আবশ্যক (FEFO)।');
      return;
    }

    const productId = `prod-${Date.now()}`;
    const hlcTimestamp = hlcClock.now();

    const newProduct: Product = {
      id: productId,
      barcode_gtin: barcodeGtin.trim() || `894${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      brand_name: brandName.trim(),
      generic_name: genericName.trim(),
      manufacturer: manufacturer.trim(),
      category: category.trim(),
      dosage_form: dosageForm,
      strength: strength.trim(),
      dgda_dar_number: dgdaDarNumber.trim(),
      schedule,
      is_antibiotic: isAntibiotic,
      is_prescription_required: isPrescriptionRequired,
      storage_temp: storageTemp,
      base_unit_name: 'Piece',
      pieces_per_strip: piecesPerStrip,
      strips_per_box: stripsPerBox,
      pieces_per_box: piecesPerBox,
      mrp_per_piece: mrpPerPiece,
      mrp_per_strip: mrpPerStrip,
      mrp_per_box: mrpPerBox,
      cost_per_piece: costPerPiece,
    };

    onAddProduct(newProduct);

    // If initial batch was requested
    if (includeInitialBatch && onAddBatch && initialBatchNumber.trim()) {
      const initialTotalPieces = initialBoxes * piecesPerBox;
      const initialBatch: StockBatch = {
        id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product_id: productId,
        batch_number: initialBatchNumber.trim().toUpperCase(),
        expiry_date: initialExpiryDate,
        rack_location: initialRack.trim() || 'র্যাক A-01',
        available_pieces: initialTotalPieces,
        cost_per_piece: costPerPiece,
        created_at: new Date().toISOString().split('T')[0],
        supplier_invoice_no: 'INITIAL-OPENING-STOCK',
        is_recalled: false,
      };
      onAddBatch(initialBatch);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-bangla animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-xs text-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                নতুন ওষুধ প্রোফাইল তৈরি (DGDA Compliance)
              </h2>
              <p className="text-[11px] text-slate-500">
                ডিজিডিএ রেজি. নম্বর, অ্যান্টিবায়োটিক ফ্ল্যাগ ও মাল্টি-লেভেল ইউনিট সাইজ নির্ধারণ
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
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Basic Identity */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-600" />
              <span>১. ওষুধের প্রাথমিক পরিচয়</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ব্র্যান্ডের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Maxpro 20mg"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  জেনেরিক নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Esomeprazole"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">প্রস্তুতকারক কোম্পানি</label>
                <select
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Square Pharmaceuticals PLC">Square Pharmaceuticals PLC</option>
                  <option value="Beximco Pharmaceuticals Ltd.">Beximco Pharmaceuticals Ltd.</option>
                  <option value="Incepta Pharmaceuticals Ltd.">Incepta Pharmaceuticals Ltd.</option>
                  <option value="Renata Limited">Renata Limited</option>
                  <option value="Beacon Pharmaceuticals PLC">Beacon Pharmaceuticals PLC</option>
                  <option value="ACI Limited">ACI Limited</option>
                  <option value="Eskayef Pharmaceuticals Ltd.">Eskayef Pharmaceuticals Ltd.</option>
                  <option value="Aristopharma Ltd.">Aristopharma Ltd.</option>
                  <option value="Opsonin Pharma Ltd.">Opsonin Pharma Ltd.</option>
                  <option value="Healthcare Pharmaceuticals Ltd.">Healthcare Pharmaceuticals Ltd.</option>
                  <option value="অন্যান্য কোম্পানি">অন্যান্য কোম্পানি</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ডোজ ফর্ম (Form)</label>
                <select
                  value={dosageForm}
                  onChange={(e) => setDosageForm(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Tablet">ট্যাবলেট (Tablet)</option>
                  <option value="Capsule">ক্যাপসুল (Capsule)</option>
                  <option value="Syrup">সিরাপ (Syrup)</option>
                  <option value="Suspension">সাসপেনশন (Suspension)</option>
                  <option value="Injection">ইনজেকশন (Injection)</option>
                  <option value="Eye Drops">আই ড্রপ (Eye Drops)</option>
                  <option value="Ointment">মলম (Ointment)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শক্তি / স্ট্রেন্থ</label>
                <input
                  type="text"
                  placeholder="যেমন: 20 mg, 500 mg"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">থেরাপিউটিক শ্রেণি / ক্যাটাগরি</label>
                <input
                  type="text"
                  placeholder="যেমন: Anti-ulcerant, Antibiotic, NSAID"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বারকোড / GTIN (GS1)</label>
                <input
                  type="text"
                  value={barcodeGtin}
                  onChange={(e) => setBarcodeGtin(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: DGDA Compliance Controls */}
          <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200 space-y-3">
            <div className="text-xs font-bold text-sky-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-700" />
                <span>২. ডিজিডিএ (DGDA) রেগুলেটরি কমপ্লায়েন্স ইনপুট</span>
              </span>
              <span className="text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full font-semibold">
                ঔষধ প্রশাসন অধিদপ্তর
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ডিজিডিএ ডিএআর নম্বর (DAR No) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: DAR-024-118"
                  value={dgdaDarNumber}
                  onChange={(e) => setDgdaDarNumber(e.target.value)}
                  className="w-full p-2.5 bg-white border border-sky-300 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">লাইসেন্সপ্রাপ্ত রেজিস্ট্রেশন নম্বর</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ওষুধের সিডিউল / ড্রাগ টাইপ</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'OTC', label: 'OTC (ওভার দ্য কাউন্টার)' },
                    { id: 'PRESCRIPTION_ONLY', label: 'প্রেসক্রিপশন আবশ্যক' },
                    { id: 'ANTIBIOTIC', label: 'অ্যান্টিবায়োটিক' },
                    { id: 'NARCOTIC', label: 'নারকোটিক / নিয়ন্ত্রিত' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleScheduleChange(s.id as DrugSchedule)}
                      className={`p-2 rounded-lg text-left text-[11px] font-semibold border transition-colors ${
                        schedule === s.id
                          ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkbox toggles for DGDA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-sky-200 cursor-pointer hover:bg-sky-50/50">
                <input
                  type="checkbox"
                  checked={isAntibiotic}
                  onChange={(e) => {
                    setIsAntibiotic(e.target.checked);
                    if (e.target.checked) {
                      setIsPrescriptionRequired(true);
                      setSchedule('ANTIBIOTIC');
                    }
                  }}
                  className="w-4 h-4 mt-0.5 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">অ্যান্টিবায়োটিক (Antibiotic)</span>
                  <span className="text-[10px] text-slate-500 block">
                    বিক্রির সময় রোগীর নাম, মোবাইল ও চিকিৎসকের BMDC নম্বর রেজিস্টারে বাধ্যতামূলক
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-sky-200 cursor-pointer hover:bg-sky-50/50">
                <input
                  type="checkbox"
                  checked={isPrescriptionRequired}
                  onChange={(e) => setIsPrescriptionRequired(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">প্রেসক্রিপশন আবশ্যক (Prescription Only)</span>
                  <span className="text-[10px] text-slate-500 block">
                    ডিজিডিএ বিধি অনুযায়ী প্রেসক্রিপশন ছাড়া সাধারণ বিক্রি নিষিদ্ধ
                  </span>
                </div>
              </label>
            </div>

            {/* Storage Temperature */}
            <div className="flex items-center gap-2 pt-1">
              <Thermometer className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">সংরক্ষণ তাপমাত্রা:</span>
              <div className="flex gap-2">
                {[
                  { value: 'Below 30°C', label: '৩০° সেলসিয়াসের নিচে (সাধারণ র্যাক)' },
                  { value: '2°C - 8°C (Cold Chain)', label: '২° - ৮° সেলসিয়াস (কোল্ড চেইন ফ্রিজ)' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setStorageTemp(t.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                      storageTemp === t.value
                        ? 'bg-sky-100 text-sky-800 border-sky-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Multi-Level Packaging Unit Definition */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>৩. প্যাকেজিং সাইজ ও একক অনুপাত (Box / Strip / Piece)</span>
              </span>
              <span className="text-[11px] font-semibold text-sky-700">বেস ইউনিট: পিস (Piece)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রতি পাতায় পিস (Pieces/Strip)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={piecesPerStrip}
                  onChange={(e) => setPiecesPerStrip(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রতি বক্সে পাতা (Strips/Box)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stripsPerBox}
                  onChange={(e) => setStripsPerBox(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রতি বক্সে মোট পিস (Pieces/Box)
                </label>
                <div className="w-full p-2.5 bg-sky-50 border border-sky-300 rounded-xl text-sky-900 font-mono font-bold text-center text-sm">
                  {toBengaliNumber(piecesPerBox)} পিস
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              হিসাব সূত্র: ১ বক্স = {toBengaliNumber(stripsPerBox)} পাতা x {toBengaliNumber(piecesPerStrip)} পিস = <strong>{toBengaliNumber(piecesPerBox)} পিস</strong>। ক্যাশ কাউন্টারে বক্স, পাতা বা পিস যেভাবে বিক্রি হোক না কেন, স্টক স্বয়ংক্রিয়ভাবে পিসে বিয়োগ হবে।
            </p>
          </div>

          {/* Section 4: Pricing Structure */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>৪. মূল্য নির্ধারণ (টাকা ৳)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">ক্রয়মূল্য (পিস)</label>
                <div className="flex items-center justify-center gap-1 font-mono">
                  <span className="text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPerPiece}
                    onChange={(e) => setCostPerPiece(parseFloat(e.target.value) || 0)}
                    className="w-16 font-bold text-slate-900 text-center border-b border-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">MRP (প্রতি পিস)</label>
                <div className="flex items-center justify-center gap-1 font-mono">
                  <span className="text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mrpPerPiece}
                    onChange={(e) => setMrpPerPiece(parseFloat(e.target.value) || 0)}
                    className="w-16 font-bold text-slate-900 text-center border-b border-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">MRP (প্রতি পাতা)</label>
                <div className="font-mono font-bold text-xs text-sky-800 mt-1">
                  ৳ {toBengaliNumber(mrpPerStrip.toFixed(2))}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">MRP (প্রতি বক্স)</label>
                <div className="font-mono font-bold text-xs text-sky-800 mt-1">
                  ৳ {toBengaliNumber(mrpPerBox.toFixed(2))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Optional Initial Stock Batch */}
          <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInitialBatch}
                onChange={(e) => setIncludeInitialBatch(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              <span className="font-bold text-sky-950 text-xs">
                সাথে সাথে প্রাথমিক ওপেনিং স্টক ব্যাচ রিসিভ করুন (FEFO Tracking)
              </span>
            </label>

            {includeInitialBatch && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-600 mb-1">ব্যাচ নং *</label>
                  <input
                    type="text"
                    required={includeInitialBatch}
                    placeholder="BATCH-01"
                    value={initialBatchNumber}
                    onChange={(e) => setInitialBatchNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-sky-300 rounded-lg font-mono uppercase text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 mb-1">মেয়াদোত্তীর্ণের তারিখ *</label>
                  <input
                    type="date"
                    required={includeInitialBatch}
                    value={initialExpiryDate}
                    onChange={(e) => setInitialExpiryDate(e.target.value)}
                    className="w-full p-2 bg-white border border-sky-300 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 mb-1">পরিমাণ (বক্স)</label>
                  <input
                    type="number"
                    min="1"
                    value={initialBoxes}
                    onChange={(e) => setInitialBoxes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 bg-white border border-sky-300 rounded-lg font-mono font-bold text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 mb-1">র্যাক অবস্থান</label>
                  <input
                    type="text"
                    value={initialRack}
                    onChange={(e) => setInitialRack(e.target.value)}
                    className="w-full p-2 bg-white border border-sky-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
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
              <span>ওষুধ ও প্রোফাইল সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
