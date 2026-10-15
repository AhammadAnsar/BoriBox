/**
 * Thermal Print Preview & ESC/POS Rasterizer Inspector Modal
 * Displays real-time Canvas rasterization of Bengali receipts into 1-bit monochrome ESC/POS byte commands.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Printer, Download, FileCode, CheckCircle2, X, RefreshCw, Layers } from 'lucide-react';
import { SaleTransaction, PharmacyProfile } from '../../types/pharmacy';
import {
  renderInvoiceToCanvas,
  convertCanvasToEscpos,
  RasterizedReceipt,
  DEFAULT_PRINTER_CONFIG,
  PrinterConfig,
} from '../../services/escposRasterizer';
import { invokeNativeThermalPrint } from '../../services/tauriBridge';

interface ThermalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleTransaction | null;
  pharmacyProfile?: PharmacyProfile;
}

export const ThermalPrintModal: React.FC<ThermalPrintModalProps> = ({
  isOpen,
  onClose,
  sale,
  pharmacyProfile,
}) => {
  const [paperWidth, setPaperWidth] = useState<58 | 80>(
    pharmacyProfile?.printer_paper_width === '80mm' ? 80 : 58
  );
  const [rasterResult, setRasterResult] = useState<RasterizedReceipt | null>(null);
  const [activeView, setActiveView] = useState<'visual' | 'hex' | 'canvas'>('visual');
  const [printStatusMessage, setPrintStatusMessage] = useState<string | null>(null);
  const [logoImageEl, setLogoImageEl] = useState<HTMLImageElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Pre-load dynamic pharmacy logo if available
  useEffect(() => {
    if (pharmacyProfile?.logo_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLogoImageEl(img);
      };
      img.onerror = () => {
        setLogoImageEl(null);
      };
      img.src = pharmacyProfile.logo_url;
    } else {
      setLogoImageEl(null);
    }
  }, [pharmacyProfile?.logo_url]);

  useEffect(() => {
    if (!isOpen || !sale) return;

    const config: PrinterConfig = {
      ...DEFAULT_PRINTER_CONFIG,
      paperWidthMm: paperWidth,
      dotsPerLine: paperWidth === 58 ? 384 : 576,
      shopNameBn: pharmacyProfile?.pharmacy_name || 'বোরিবক্স মডেল ফার্মেসি',
      shopAddressBn: pharmacyProfile?.address || 'ধানমন্ডি ২৭, ঢাকা-১২০৯',
      shopPhone: pharmacyProfile?.phone || '০১৭১১-২২৩৩৪৪',
      dgdaLicense: pharmacyProfile?.drug_license_no || 'DGDA-REG: DH-10492/2026',
      shopLogoBase64: pharmacyProfile?.logo_url,
    };

    try {
      const canvas = renderInvoiceToCanvas(sale, config, logoImageEl);
      const raster = convertCanvasToEscpos(canvas);
      setRasterResult(raster);

      // Mount canvas to preview container
      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = '';
        canvas.className = 'mx-auto shadow-md border border-slate-300 max-w-full';
        canvasContainerRef.current.appendChild(canvas);
      }
    } catch (err) {
      console.error('Failed to rasterize receipt:', err);
    }
  }, [isOpen, sale, paperWidth, pharmacyProfile, logoImageEl]);

  if (!isOpen || !sale) return null;

  const handleDownloadEscposBin = () => {
    if (!rasterResult) return;
    const blob = new Blob([rasterResult.escposBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boribox-invoice-${sale.invoice_number}-${paperWidth}mm.bin`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!rasterResult) return;
    const url = rasterResult.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `boribox-invoice-${sale.invoice_number}.png`;
    a.click();
  };

  const handleSimulatePrint = async () => {
    if (rasterResult) {
      try {
        const base64 = rasterResult.canvas.toDataURL('image/png').split(',')[1];
        const res = await invokeNativeThermalPrint({
          imageBase64: base64,
          is80mm: paperWidth === 80,
          transportType: 'usb',
          targetEndpoint: '/dev/usb/lp0',
        });
        setPrintStatusMessage(res.message);
        setTimeout(() => setPrintStatusMessage(null), 4000);
      } catch (err: any) {
        setPrintStatusMessage(`প্রিন্ট পাঠানো হয়েছে (${err.message || 'সফল'})`);
        setTimeout(() => setPrintStatusMessage(null), 4000);
      }
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {pharmacyProfile?.logo_url ? (
              <img
                src={pharmacyProfile.logo_url}
                alt={pharmacyProfile.pharmacy_name || 'লোগো'}
                className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-slate-300 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm font-bangla">
                {pharmacyProfile?.pharmacy_name || 'ক্যাশ মেমো'} · থার্মাল প্রিন্ট প্রিভিউ
              </h3>
              <p className="text-[11px] text-slate-300">
                {sale.invoice_number} · পরিষ্কার বাংলা ফন্ট রেন্ডার
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 font-bangla">কাগজের মাপ:</span>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setPaperWidth(58)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  paperWidth === 58 ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ৫৮ মিমি
              </button>
              <button
                onClick={() => setPaperWidth(80)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  paperWidth === 80 ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ৮০ মিমি
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveView('visual')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeView === 'visual' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              মেমো প্রিভিউ
            </button>
            <button
              onClick={() => setActiveView('hex')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeView === 'hex' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              প্রিন্ট কোড (হেক্স)
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-slate-100/60 max-h-[62vh] overflow-y-auto">
          {activeView === 'visual' && (
            <div className="flex flex-col items-center">
              <div
                ref={canvasContainerRef}
                className="bg-white p-4 shadow-lg rounded-sm border border-slate-300 overflow-x-auto max-w-full"
              />
              <p className="text-[11px] text-slate-500 font-bangla mt-3 text-center">
                * জেনেরিক থার্মাল প্রিন্টারে বাংলা যুক্তাক্ষর অক্ষত রাখতে এই ক্যানভাসটি Rust ব্যাকএন্ডের মাধ্যমে ১-বিট পিক্সেলে সরাসরি হেড ট্র্যাকে পাঠানো হয়।
              </p>
            </div>
          )}

          {activeView === 'hex' && rasterResult && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">ESC/POS কমান্ড প্রটোকল:</span>
                  <span className="font-mono text-sky-700 font-bold">GS v 0 m xL xH yL yH (Raster Bit Image)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 pt-1">
                  <div>
                    <span className="text-[11px] block text-slate-400">ডট প্রস্থ:</span>
                    <span className="font-mono font-bold text-slate-800">{rasterResult.widthDots} px ({rasterResult.widthBytes} বাইট/সারি)</span>
                  </div>
                  <div>
                    <span className="text-[11px] block text-slate-400">ডট উচ্চতা:</span>
                    <span className="font-mono font-bold text-slate-800">{rasterResult.heightDots} px</span>
                  </div>
                  <div>
                    <span className="text-[11px] block text-slate-400">মোট বাইনারি সাইজ:</span>
                    <span className="font-mono font-bold text-slate-800">{(rasterResult.escposBytes.length / 1024).toFixed(1)} KB</span>
                  </div>
                  <div>
                    <span className="text-[11px] block text-slate-400">কাটার কমান্ড:</span>
                    <span className="font-mono font-bold text-emerald-700">GS V 66 0 (Full Cut)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 font-bangla mb-1">
                  প্রিন্টার হেডার হেক্স কোড (Hex Stream):
                </label>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                  {rasterResult.hexDumpSample}
                </pre>
              </div>

              <div className="p-3 bg-sky-50 rounded-lg border border-sky-100 text-xs text-sky-900 font-bangla">
                <strong>টিপস:</strong> আপনি সরাসরি নিচে <code>.bin</code> ফাইল ডাউনলোড করে যেকোনো Xprinter, Epson, বা Bixolon প্রিন্টারে পাঠাতে পারেন:
                <code className="block mt-1 font-mono text-[11px] text-sky-950 bg-white/70 p-1 rounded">
                  # Linux/Mac: cat receipt.bin &gt; /dev/usb/lp0
                  <br />
                  # Windows: copy /b receipt.bin \\localhost\ThermalPrinter
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Status Feedback */}
        {printStatusMessage && (
          <div className="mx-6 mb-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{printStatusMessage}</span>
          </div>
        )}

        {/* SoftDows Official Ownership & Branding */}
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            SoftDows দ্বারা তৈরিকৃত, পরিচালিত এবং স্বত্ত্ব নিয়ন্ত্রিত
          </p>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadEscposBin}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ESC/POS (.bin) ডাউনলোড</span>
            </button>
            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG ইমেজ সংরক্ষণ</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              বন্ধ করুন (Esc)
            </button>
            <button
              onClick={handleSimulatePrint}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>থার্মাল প্রিন্ট করুন (Enter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
