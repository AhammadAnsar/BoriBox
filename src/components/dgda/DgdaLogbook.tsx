/**
 * DGDA Antibiotics & Prescription Logbook (প্রেসক্রিপশন রেজিস্টার)
 * সরকারি ড্রাগ সুপারিন্টেন্ডেন্ট বা অডিট পরিদর্শনের জন্য অফলাইন রেজিস্টার।
 * কোনো হরাইজন্টাল স্ক্রলবার নেই, পরিচ্ছন্ন বাংলা ইন্টারফেস।
 */

import React, { useState } from 'react';
import { ShieldCheck, Download, Search, CheckCircle2 } from 'lucide-react';
import { SaleTransaction } from '../../types/pharmacy';
import { toBengaliNumber } from '../../services/unitCalculator';

interface DgdaLogbookProps {
  sales: SaleTransaction[];
}

export const DgdaLogbook: React.FC<DgdaLogbookProps> = ({ sales }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const antibioticSales = sales.filter((s) => s.has_antibiotic && s.prescription);

  const filteredSales = antibioticSales.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const patient = (s.prescription?.patient_name || s.customer_name || '').toLowerCase();
    const doctor = (s.prescription?.doctor_name || '').toLowerCase();
    const bmdc = (s.prescription?.doctor_bmdc_reg || '').toLowerCase();
    return (
      s.invoice_number.toLowerCase().includes(q) ||
      patient.includes(q) ||
      doctor.includes(q) ||
      bmdc.includes(q) ||
      s.items.some((i) => i.product.brand_name.toLowerCase().includes(q))
    );
  });

  const handleExportCsv = () => {
    if (antibioticSales.length === 0) return;

    const headers = [
      'ইনভয়েস নং',
      'তারিখ',
      'রোগীর নাম',
      'বয়স',
      'মোবাইল নম্বর',
      'ডাক্তারের নাম',
      'BMDC রেজি নং',
      'ওষুধের নাম',
      'ব্যাচ নম্বর',
      'মোট পিস',
      'রোগের কারণ',
    ];

    const rows = antibioticSales.map((s) => {
      const p = s.prescription;
      const medNames = s.items.map((i) => i.product.brand_name).join('; ');
      const batchNos = s.items.flatMap((i) => i.allocated_batches.map((b) => b.batch_number)).join('; ');
      const totalPieces = s.items.reduce((sum, i) => sum + i.total_pieces, 0);

      const patientName = p?.patient_name || s.customer_name || 'সাধারণ ক্রেতা';
      const patientAge = p?.patient_age ? p.patient_age : '-';
      const patientPhone = p?.patient_phone || s.customer_phone || '-';
      const doctorName = p?.doctor_name || 'মৌখিক পরামর্শ / অনুল্লেখিত';
      const bmdcReg = p?.doctor_bmdc_reg || '-';
      const indication = p?.indication || '-';

      return [
        s.invoice_number,
        s.timestamp.split('T')[0],
        `"${patientName}"`,
        patientAge,
        patientPhone,
        `"${doctorName}"`,
        bmdcReg,
        `"${medNames}"`,
        `"${batchNos}"`,
        totalPieces,
        `"${indication}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `প্রেসক্রিপশন-রেজিস্টার-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5 font-bangla">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              প্রেসক্রিপশন ও অ্যান্টিবায়োটিক রেজিস্টার
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ঔষধ প্রশাসন (DGDA) পরিদর্শনের জন্য সংরক্ষিত রোগীর নাম ও ডাক্তারের BMDC তথ্য
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={antibioticSales.length === 0}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors shadow-xs ${
            antibioticSales.length === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>এক্সপোর্ট করুন (CSV)</span>
        </button>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="রোগীর নাম বা ডাক্তারের নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            মোট অ্যান্টিবায়োটিক বিক্রয়: <strong className="text-slate-900 font-mono">{toBengaliNumber(antibioticSales.length)}</strong> টি
          </div>
        </div>

        {/* Responsive Entries (No Horizontal Scrollbar) */}
        <div className="divide-y divide-slate-100">
          {filteredSales.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              কোনো অ্যান্টিবায়োটিক বিক্রির তথ্য মেলেনি।
            </div>
          ) : (
            filteredSales.map((sale) => {
              const p = sale.prescription;
              const patientDisplayName = p?.patient_name || sale.customer_name || 'সাধারণ ক্রেতা';
              const patientPhone = p?.patient_phone || sale.customer_phone || 'মোবাইল নেই';
              const doctorDisplayName = p?.doctor_name || 'মৌখিক পরামর্শ / অনুল্লেখিত';
              const bmdcNo = p?.doctor_bmdc_reg || 'অনুল্লেখিত';
              return (
                <div
                  key={sale.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Invoice & Patient */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {sale.invoice_number}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 font-mono">
                        {sale.timestamp.split('T')[0]}
                      </span>
                    </div>

                    <div className="font-bold text-slate-800 text-sm">
                      {patientDisplayName}{' '}
                      {p?.patient_age ? (
                        <span className="text-xs font-normal text-slate-500">
                          ({toBengaliNumber(p.patient_age)} বছর)
                        </span>
                      ) : null}
                    </div>

                    <div className="text-slate-400 text-[11px] font-mono">
                      ফোন: {patientPhone}
                    </div>
                  </div>

                  {/* Middle: Doctor Info */}
                  <div className="space-y-1 text-slate-600">
                    <div className="font-semibold text-slate-900">
                      {doctorDisplayName}
                    </div>
                    <div className="text-[11px] text-sky-800 font-mono font-bold">
                      BMDC রেজি নং: {bmdcNo}
                    </div>
                    {p?.hospital_clinic && (
                      <div className="text-[11px] text-slate-500">
                        {p.hospital_clinic}
                      </div>
                    )}
                  </div>

                  {/* Right: Dispensed Antibiotic & Status */}
                  <div className="space-y-1 md:text-right">
                    {sale.items.map((item) => (
                      <div key={item.id}>
                        <span className="font-bold text-slate-900 font-sans">{item.product.brand_name}</span>
                        <span className="text-slate-500 ml-1">
                          ({toBengaliNumber(item.total_pieces)} পিস)
                        </span>
                      </div>
                    ))}

                    <div className="text-[11px] text-slate-500">
                      লক্ষণ: {p?.indication || 'অনুল্লেখিত'}
                    </div>

                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>নথিভুক্ত</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
