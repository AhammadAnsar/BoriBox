/**
 * MainDashboard.tsx
 * BoriBox Human-Centric Minimalist Dashboard (ড্যাশবোর্ড)
 * 
 * Strict Language Policy: Pure Bengali UI text.
 * Concise Naming: Maximum 1-2 words per button and metric.
 * Palette: Soft Blue (#0284c7), Mint Green (#10b981), White, and Dark Grey (#0f172a / #334155).
 * Typography: 'Noto Serif Bengali'.
 */

import React from 'react';
import {
  Banknote,
  Receipt,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  ShoppingCart,
  Boxes,
  PieChart,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Product, StockBatch, SaleTransaction } from '../../types/pharmacy';
import { toBengaliNumber } from '../../services/unitCalculator';
import { analyzeExpiry } from '../../services/fefoEngine';

interface MainDashboardProps {
  products: Product[];
  batches: StockBatch[];
  sales: SaleTransaction[];
  onNavigate: (tab: any) => void;
  pharmacyName?: string;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  products,
  batches,
  sales,
  onNavigate,
  pharmacyName = 'জনতা মডেল ফার্মেসি',
}) => {
  // Calculations from live state
  const todaySalesTotal = sales.reduce((sum, s) => sum + s.net_payable, 0);
  const todaySalesCount = sales.length;

  const criticalBatches = batches.filter((b) => {
    const analysis = analyzeExpiry(b.expiry_date);
    return analysis.status === 'CRITICAL';
  });

  const antibioticSalesCount = sales.filter((s) => s.has_antibiotic).length;

  // Near expiry batches (top 4 earliest expiring)
  const sortedBatches = [...batches]
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-bangla">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            স্বাগতম, {pharmacyName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ফার্মেসির দৈনন্দিন কার্যক্রমের চিত্র · সম্পূর্ণ অফলাইন ও স্থানীয় তথ্যভাণ্ডারে সুরক্ষিত
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Boxes className="w-4 h-4 text-slate-600" />
            <span>মজুদ দেখুন</span>
          </button>
          <button
            onClick={() => onNavigate('accounts')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <PieChart className="w-4 h-4 text-slate-600" />
            <span>হিসাব দেখুন</span>
          </button>
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>নতুন বিক্রয়</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">আজকের মোট বিক্রয়</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              ৳ {toBengaliNumber(todaySalesTotal.toFixed(2))}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">
              {toBengaliNumber(todaySalesCount)} টি বিক্রয় সম্পন্ন
            </div>
          </div>
        </div>

        {/* Metric 2: Today's Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">মোট বিক্রয় রশিদ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {toBengaliNumber(todaySalesCount)} <span className="text-xs font-normal text-slate-500">টি</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              গড় রশিদ: ৳ {todaySalesCount > 0 ? toBengaliNumber((todaySalesTotal / todaySalesCount).toFixed(0)) : '০'}
            </div>
          </div>
        </div>

        {/* Metric 3: Critical Expiry */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">আসন্ন মেয়াদ শেষ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-rose-700">
              {toBengaliNumber(criticalBatches.length)} <span className="text-xs font-normal text-slate-500">ব্যাচ</span>
            </div>
            <div className="text-xs text-rose-600 mt-1">
              {criticalBatches.length > 0 ? 'কোম্পানি ফেরত বা ছাড় দিন' : 'কোনো মেয়াদ উত্তীর্ণ নেই'}
            </div>
          </div>
        </div>

        {/* Metric 4: Antibiotic Compliance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">অ্যান্টিবায়োটিক বিক্রয়</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {toBengaliNumber(antibioticSalesCount)} <span className="text-xs font-normal text-slate-500">টি</span>
            </div>
            <div className="text-xs text-sky-700 font-semibold mt-1">
              প্রেসক্রিপশন রেজিস্টারে নথিভুক্ত
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Expiry Radar (Left) & Recent Invoices (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Expiry Radar (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">মেয়াদ সতর্কতা</h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {sortedBatches.map((batch) => {
              const product = products.find((p) => p.id === batch.product_id);
              if (!product) return null;
              const analysis = analyzeExpiry(batch.expiry_date);

              return (
                <div
                  key={batch.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 font-sans truncate">
                      {product.brand_name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">ব্যাচ: {batch.batch_number}</span>
                      <span>·</span>
                      <span>{batch.rack_location}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${analysis.badgeClass}`}>
                      {analysis.labelBengali}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1 font-mono">
                      মজুদ: {toBengaliNumber(batch.available_pieces)} পিস
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Sales (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">সাম্প্রতিক বিক্রয় রশিদ</h3>
            </div>
            <button
              onClick={() => onNavigate('pos')}
              className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1"
            >
              <span>বিক্রয় কাউন্টার</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {sales.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <p>এখনো কোনো বিক্রয় রশিদ নেই।</p>
                <button
                  onClick={() => onNavigate('pos')}
                  className="px-4 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-bold transition-colors"
                >
                  বিক্রয় শুরু করুন
                </button>
              </div>
            ) : (
              sales.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{s.invoice_number}</span>
                      {s.customer_name && (
                        <span className="text-slate-600 font-medium truncate">
                          · {s.customer_name}
                        </span>
                      )}
                      {s.has_antibiotic && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          অ্যান্টিবায়োটিক
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-sans truncate max-w-md">
                      {s.items.map((i) => i.product.brand_name).join(', ')}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      ৳ {toBengaliNumber(s.net_payable.toFixed(2))}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {s.payment_method === 'CASH' ? 'ক্যাশ' : s.payment_method} · {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
