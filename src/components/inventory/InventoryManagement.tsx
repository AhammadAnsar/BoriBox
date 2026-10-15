/**
 * InventoryManagement.tsx
 * BoriBox Step 8: ইনভেন্টরি ও স্টক ম্যানেজমেন্ট (স্টক ও মজুদ)
 * সম্পূর্ণ বাংলা ইন্টারফেস, সফট ব্লু/হোয়াইট থিম, কঠোর FEFO ট্র্যাকিং,
 * ডাইনামিক ইউনিট কনভার্সন এবং ডিজিডিএ (DGDA) কমপ্লায়েন্স।
 */

import React, { useState, useMemo } from 'react';
import { Product, StockBatch } from '../../types/pharmacy';
import { breakdownPieces, toBengaliNumber } from '../../services/unitCalculator';
import { analyzeExpiry } from '../../services/fefoEngine';
import { AddBatchModal } from './AddBatchModal';
import { AddProductModal } from './AddProductModal';
import { BatchDetailsModal } from './BatchDetailsModal';
import {
  Boxes,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  ShieldCheck,
  PackagePlus,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  TrendingDown,
  Info,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface InventoryManagementProps {
  products: Product[];
  batches: StockBatch[];
  onAddBatch: (batch: StockBatch) => void;
  onAddProduct: (product: Product) => void;
  onToggleBatchRecall?: (batchId: string) => void;
}

type TabMode = 'PRODUCTS' | 'BATCHES_FEFO' | 'ALERTS';
type ExpiryFilter = 'ALL' | 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'EXPIRED';
type StockLevelFilter = 'ALL' | 'LOW' | 'IN_STOCK' | 'OUT_OF_STOCK';
type DgdaFilter = 'ALL' | 'ANTIBIOTIC' | 'PRESCRIPTION' | 'OTC';

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  products,
  batches,
  onAddBatch,
  onAddProduct,
  onToggleBatchRecall,
}) => {
  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<TabMode>('PRODUCTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('ALL');
  const [stockLevelFilter, setStockLevelFilter] = useState<StockLevelFilter>('ALL');
  const [dgdaFilter, setDgdaFilter] = useState<DgdaFilter>('ALL');

  // Modals state
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedProductIdForBatch, setSelectedProductIdForBatch] = useState<string | undefined>(undefined);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);

  // Compute aggregated product stock & earliest expiry (FEFO)
  const productStockList = useMemo(() => {
    return products.map((product) => {
      // Find all batches for this product
      const productBatches = batches.filter((b) => b.product_id === product.id && !b.is_recalled);
      const totalPieces = productBatches.reduce((acc, b) => acc + b.available_pieces, 0);

      // Earliest expiring active batch (strict FEFO)
      const validBatchesWithStock = productBatches
        .filter((b) => b.available_pieces > 0)
        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

      const earliestBatch = validBatchesWithStock[0] || null;
      const expiryAnalysis = earliestBatch ? analyzeExpiry(earliestBatch.expiry_date) : null;
      const breakdown = breakdownPieces(totalPieces, product);

      // Low stock condition: less than 50 pieces or less than 1 box
      const isLowStock = totalPieces < Math.min(50, product.pieces_per_box);
      const isOutOfStock = totalPieces === 0;

      // Unique racks where this medicine is stored
      const rackLocations = Array.from(new Set(productBatches.map((b) => b.rack_location))).join(', ');

      return {
        product,
        totalPieces,
        breakdown,
        earliestBatch,
        expiryAnalysis,
        batchCount: productBatches.length,
        isLowStock,
        isOutOfStock,
        rackLocations: rackLocations || 'র্যাক A-01',
      };
    });
  }, [products, batches]);

  // Compute FEFO batch list
  const fefoBatchList = useMemo(() => {
    return batches.map((batch) => {
      const product = products.find((p) => p.id === batch.product_id);
      const expiry = analyzeExpiry(batch.expiry_date);
      return {
        ...batch,
        product,
        expiry,
      };
    }).sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  }, [batches, products]);

  // Summary Metrics
  const summaryStats = useMemo(() => {
    const totalInventoryValue = batches.reduce((acc, b) => {
      return acc + (b.available_pieces * b.cost_per_piece);
    }, 0);

    const criticalExpiringBatches = batches.filter((b) => {
      const e = analyzeExpiry(b.expiry_date);
      return e.status === 'CRITICAL' || e.status === 'EXPIRED';
    }).length;

    const warningExpiringBatches = batches.filter((b) => {
      const e = analyzeExpiry(b.expiry_date);
      return e.status === 'WARNING';
    }).length;

    const lowStockMedicines = productStockList.filter((p) => p.isLowStock || p.isOutOfStock).length;
    const antibioticCount = products.filter((p) => p.is_antibiotic).length;

    return {
      totalProducts: products.length,
      totalBatches: batches.length,
      totalInventoryValue,
      criticalExpiringBatches,
      warningExpiringBatches,
      lowStockMedicines,
      antibioticCount,
    };
  }, [products, batches, productStockList]);

  // Filtered Products for Product View
  const filteredProducts = useMemo(() => {
    return productStockList.filter((item) => {
      const p = item.product;
      const q = searchTerm.toLowerCase().trim();

      // Search match
      if (q) {
        const matchesName = p.brand_name.toLowerCase().includes(q) ||
          p.generic_name.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q) ||
          p.dgda_dar_number.toLowerCase().includes(q) ||
          item.rackLocations.toLowerCase().includes(q) ||
          (item.earliestBatch && item.earliestBatch.batch_number.toLowerCase().includes(q));

        if (!matchesName) return false;
      }

      // DGDA filter
      if (dgdaFilter === 'ANTIBIOTIC' && !p.is_antibiotic) return false;
      if (dgdaFilter === 'PRESCRIPTION' && !p.is_prescription_required) return false;
      if (dgdaFilter === 'OTC' && (p.is_antibiotic || p.is_prescription_required)) return false;

      // Stock Level filter
      if (stockLevelFilter === 'LOW' && (!item.isLowStock || item.isOutOfStock)) return false;
      if (stockLevelFilter === 'OUT_OF_STOCK' && !item.isOutOfStock) return false;
      if (stockLevelFilter === 'IN_STOCK' && item.isOutOfStock) return false;

      // Expiry filter
      if (expiryFilter !== 'ALL') {
        if (!item.expiryAnalysis || item.expiryAnalysis.status !== expiryFilter) return false;
      }

      // Alerts tab: only show items with low stock or near expiry
      if (activeTab === 'ALERTS') {
        const hasExpiryIssue = item.expiryAnalysis && (item.expiryAnalysis.status === 'CRITICAL' || item.expiryAnalysis.status === 'WARNING' || item.expiryAnalysis.status === 'EXPIRED');
        const hasStockIssue = item.isLowStock || item.isOutOfStock;
        if (!hasExpiryIssue && !hasStockIssue) return false;
      }

      return true;
    });
  }, [productStockList, searchTerm, dgdaFilter, stockLevelFilter, expiryFilter, activeTab]);

  // Filtered Batches for Batch View
  const filteredBatches = useMemo(() => {
    return fefoBatchList.filter((batch) => {
      if (!batch.product) return false;
      const q = searchTerm.toLowerCase().trim();

      if (q) {
        const matches = batch.product.brand_name.toLowerCase().includes(q) ||
          batch.product.generic_name.toLowerCase().includes(q) ||
          batch.batch_number.toLowerCase().includes(q) ||
          batch.rack_location.toLowerCase().includes(q) ||
          (batch.supplier_invoice_no && batch.supplier_invoice_no.toLowerCase().includes(q));

        if (!matches) return false;
      }

      if (expiryFilter !== 'ALL' && batch.expiry.status !== expiryFilter) return false;
      if (dgdaFilter === 'ANTIBIOTIC' && !batch.product.is_antibiotic) return false;

      return true;
    });
  }, [fefoBatchList, searchTerm, expiryFilter, dgdaFilter, stockLevelFilter]);

  // Strict Pinned Sorting Logic: Pinned #1: Expired (মেয়াদ শেষ), Pinned #2: Stock Out (স্টক আউট)
  const displayProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const getRank = (item: typeof a) => {
        if (item.expiryAnalysis?.status === 'EXPIRED') return 1; // Expired first
        if (item.isOutOfStock || item.totalPieces === 0) return 2; // Stock Out second
        if (item.expiryAnalysis?.status === 'CRITICAL') return 3; // Critical expiry
        if (item.isLowStock) return 4; // Low stock
        if (item.expiryAnalysis?.status === 'WARNING') return 5; // Warning expiry
        return 10; // Normal healthy stock
      };

      const rankA = getRank(a);
      const rankB = getRank(b);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Secondary sort: earliest expiring batch first
      const dateA = a.earliestBatch ? new Date(a.earliestBatch.expiry_date).getTime() : Infinity;
      const dateB = b.earliestBatch ? new Date(b.earliestBatch.expiry_date).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;

      return a.product.brand_name.localeCompare(b.product.brand_name);
    });
  }, [filteredProducts]);

  const displayBatches = useMemo(() => {
    return [...filteredBatches].sort((a, b) => {
      const getRank = (batch: typeof a) => {
        if (batch.expiry?.status === 'EXPIRED') return 1; // Expired batch first
        if (batch.available_pieces === 0) return 2; // Stock Out batch second
        if (batch.expiry?.status === 'CRITICAL') return 3; // Critical expiry
        if (batch.expiry?.status === 'WARNING') return 4; // Warning expiry
        return 10;
      };

      const rankA = getRank(a);
      const rankB = getRank(b);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    });
  }, [filteredBatches]);

  const handleOpenAddBatch = (productId?: string) => {
    setSelectedProductIdForBatch(productId);
    setIsAddBatchOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5 font-bangla animate-fadeIn">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Medicines */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500 font-semibold">মোট ওষুধের পদ ও মজুদ</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {toBengaliNumber(summaryStats.totalProducts)} টি ওষুধ
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              মোট {toBengaliNumber(summaryStats.totalBatches)} টি সক্রিয় ব্যাচ
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Inventory Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-emerald-700 font-semibold">মজুদ মালের ক্রয়মূল্য (স্টক ভ্যালু)</div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              ৳ {toBengaliNumber(summaryStats.totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }))}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              হোলসেল ইনভয়েস ভিত্তিক মূল্যায়ন
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Expiry Alerts (FEFO) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-rose-700 font-semibold">আসন্ন মেয়াদ শেষ (FEFO অ্যালার্ট)</div>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">
              {toBengaliNumber(summaryStats.criticalExpiringBatches)} টি ব্যাচ (জরুরি)
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">
              {toBengaliNumber(summaryStats.warningExpiringBatches)} টি ব্যাচ সতর্কসীমায় (৯০ দিন)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-amber-700 font-semibold">স্বল্প স্টক ও রিঅর্ডার লেভেল</div>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1">
              {toBengaliNumber(summaryStats.lowStockMedicines)} টি ওষুধের ঘাটতি
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ডিজিডিএ অ্যান্টিবায়োটিক: {toBengaliNumber(summaryStats.antibioticCount)} টি
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Action & Navigation Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          {/* View Modes */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'PRODUCTS'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ওষুধ ({toBengaliNumber(products.length)})
            </button>
            <button
              onClick={() => setActiveTab('BATCHES_FEFO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'BATCHES_FEFO'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ব্যাচ ({toBengaliNumber(batches.length)})
            </button>
            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ALERTS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>সতর্কতা ({toBengaliNumber(summaryStats.lowStockMedicines + summaryStats.criticalExpiringBatches)})</span>
            </button>
          </div>

          {/* Action Buttons: Add Batch & Add Product */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4 text-sky-600" />
              <span>নতুন ওষুধ</span>
            </button>

            <button
              onClick={() => handleOpenAddBatch()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs"
            >
              <PackagePlus className="w-4 h-4" />
              <span>ব্যাচ যোগ</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ওষুধের নাম, জেনেরিক, প্রস্তুতকারক, ব্যাচ নম্বর বা র্যাক দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Expiry Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px]">মেয়াদ:</span>
              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value as ExpiryFilter)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">সব মেয়াদ</option>
                <option value="CRITICAL">জরুরি (≤৩০ দিন)</option>
                <option value="WARNING">সতর্কতা (≤৯০ দিন)</option>
                <option value="HEALTHY">মেয়াদ ভালো আছে</option>
                <option value="EXPIRED">মেয়াদোত্তীর্ণ</option>
              </select>
            </div>

            {/* Stock Level Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px]">স্টক লেভেল:</span>
              <select
                value={stockLevelFilter}
                onChange={(e) => setStockLevelFilter(e.target.value as StockLevelFilter)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">সব মজুদ</option>
                <option value="LOW">স্বল্প স্টক (রিঅর্ডার)</option>
                <option value="OUT_OF_STOCK">স্টক শূন্য (০ পিস)</option>
                <option value="IN_STOCK">পর্যাপ্ত স্টক</option>
              </select>
            </div>

            {/* DGDA Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px]">ডিজিডিএ:</span>
              <select
                value={dgdaFilter}
                onChange={(e) => setDgdaFilter(e.target.value as DgdaFilter)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">সব ক্যাটাগরি</option>
                <option value="ANTIBIOTIC">অ্যান্টিবায়োটিক</option>
                <option value="PRESCRIPTION">প্রেসক্রিপশন আবশ্যক</option>
                <option value="OTC">ওটিসি (OTC)</option>
              </select>
            </div>

            {(searchTerm || expiryFilter !== 'ALL' || stockLevelFilter !== 'ALL' || dgdaFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setExpiryFilter('ALL');
                  setStockLevelFilter('ALL');
                  setDgdaFilter('ALL');
                }}
                className="px-2 py-1.5 text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
              >
                রিসেট ফিল্টার
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Products Summary Table View */}
        {activeTab === 'PRODUCTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">ওষুধের নাম ও জেনেরিক</th>
                  <th className="py-3 px-3">ডিজিডিএ (DGDA) ও প্যাকেজিং</th>
                  <th className="py-3 px-3">বর্তমান মজুদ (বক্স / পাতা / পিস)</th>
                  <th className="py-3 px-3">FEFO নিকটবর্তী মেয়াদ</th>
                  <th className="py-3 px-3">র্যাক অবস্থান</th>
                  <th className="py-3 px-3">মূল্য (MRP)</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      কোনো ওষুধের তথ্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  displayProducts.map((item) => {
                    const p = item.product;
                    const hasCriticalExpiry = item.expiryAnalysis?.status === 'CRITICAL' || item.expiryAnalysis?.status === 'EXPIRED';
                    const hasWarningExpiry = item.expiryAnalysis?.status === 'WARNING';

                    // Visual highlight row logic
                    let rowBgClass = 'hover:bg-slate-50/70 border-l-4 border-l-transparent';
                    if (item.isOutOfStock || hasCriticalExpiry) {
                      rowBgClass = 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500';
                    } else if (item.isLowStock || hasWarningExpiry) {
                      rowBgClass = 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500';
                    }

                    return (
                      <tr key={p.id} className={`transition-colors ${rowBgClass}`}>
                        {/* 1. Medicine Name & Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="font-bold text-slate-900 text-sm font-sans flex items-center gap-1.5">
                                <span>{p.brand_name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-normal">
                                  {p.dosage_form}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                                {p.generic_name} ({p.strength})
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {p.manufacturer}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. DGDA & Unit Packaging */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1">
                              {p.is_antibiotic ? (
                                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-rose-600" />
                                  অ্যান্টিবায়োটিক
                                </span>
                              ) : p.is_prescription_required ? (
                                <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold text-[10px]">
                                  প্রেসক্রিপশন
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                                  OTC
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-slate-500">
                                {p.dgda_dar_number}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              ১ বক্স = {toBengaliNumber(p.strips_per_box)} পাতা ({toBengaliNumber(p.pieces_per_box)} পিস)
                            </div>
                          </div>
                        </td>

                        {/* 3. Available Stock */}
                        <td className="py-3.5 px-3">
                          <div>
                            <div className="font-bold font-sans text-sm text-slate-900">
                              {item.breakdown.formattedBengali}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                              <span>মোট: {toBengaliNumber(item.totalPieces)} পিস</span>
                              {item.isOutOfStock ? (
                                <span className="text-rose-600 font-bold text-[10px]">স্টক শূন্য</span>
                              ) : item.isLowStock ? (
                                <span className="text-amber-600 font-bold text-[10px]">স্বল্প স্টক</span>
                              ) : (
                                <span className="text-emerald-600 text-[10px]">পর্যাপ্ত</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 4. FEFO Nearest Expiry */}
                        <td className="py-3.5 px-3">
                          {item.earliestBatch ? (
                            <div>
                              <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
                                <span>{item.earliestBatch.expiry_date}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                    item.expiryAnalysis?.badgeClass || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {item.expiryAnalysis?.labelBengali}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({item.earliestBatch.batch_number})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">কোনো ব্যাচ নেই</span>
                          )}
                        </td>

                        {/* 5. Rack Location */}
                        <td className="py-3.5 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                            {item.rackLocations}
                          </span>
                        </td>

                        {/* 6. Pricing */}
                        <td className="py-3.5 px-3">
                          <div className="font-mono text-slate-700 space-y-0.5">
                            <div>পিস: ৳ {toBengaliNumber(p.mrp_per_piece.toFixed(2))}</div>
                            <div className="text-[10px] text-slate-400">
                              বক্স: ৳ {toBengaliNumber(p.mrp_per_box.toFixed(0))}
                            </div>
                          </div>
                        </td>

                        {/* 7. Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAddBatch(p.id)}
                              className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold rounded-lg text-xs transition-colors"
                              title="এই ওষুধে নতুন ব্যাচ যোগ করুন"
                            >
                              + স্টক
                            </button>
                            <button
                              onClick={() => setDetailsProduct(p)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                              title="সব ব্যাচ ও বিবরণ দেখুন"
                            >
                              <span>ব্যাচ ({toBengaliNumber(item.batchCount)})</span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: FEFO Batch View */}
        {activeTab === 'BATCHES_FEFO' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">FEFO ক্রম ও ব্যাচ নং</th>
                  <th className="py-3 px-3">ওষুধের বিবরণ</th>
                  <th className="py-3 px-3">মেয়াদোত্তীর্ণের তারিখ ও দিন বাকি</th>
                  <th className="py-3 px-3">মজুদ পরিমাণ</th>
                  <th className="py-3 px-3">র্যাক ও অবস্থান</th>
                  <th className="py-3 px-3">চালান ও ক্রয়মূল্য</th>
                  <th className="py-3 px-4 text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      কোনো ব্যাচের তথ্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  displayBatches.map((item, index) => {
                    const p = item.product!;
                    const breakdown = breakdownPieces(item.available_pieces, p);

                    let rowClass = 'hover:bg-slate-50/70 border-l-4 border-l-transparent';
                    if (item.expiry.status === 'CRITICAL' || item.expiry.status === 'EXPIRED') {
                      rowClass = 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500';
                    } else if (item.expiry.status === 'WARNING') {
                      rowClass = 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500';
                    }

                    return (
                      <tr key={item.id} className={`transition-colors ${rowClass}`}>
                        {/* 1. FEFO Order & Batch */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                              {toBengaliNumber(index + 1)}
                            </span>
                            <div>
                              <div className="font-mono font-bold text-slate-900 text-sm">
                                {item.batch_number}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                যুক্ত: {item.created_at}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Medicine */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold font-sans text-slate-900">
                            {p.brand_name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-sans">
                            {p.generic_name} ({p.manufacturer})
                          </div>
                          {p.is_antibiotic && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold text-[9px] mt-0.5 inline-block">
                              অ্যান্টিবায়োটিক
                            </span>
                          )}
                        </td>

                        {/* 3. Expiry & Remaining */}
                        <td className="py-3.5 px-3">
                          <div className="font-mono font-semibold text-slate-900">
                            {item.expiry_date}
                          </div>
                          <div className="mt-0.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.expiry.badgeClass}`}>
                              {item.expiry.labelBengali}
                            </span>
                          </div>
                        </td>

                        {/* 4. Available Quantity */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold font-sans text-slate-900">
                            {breakdown.formattedBengali}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            মোট: {toBengaliNumber(item.available_pieces)} পিস
                          </div>
                        </td>

                        {/* 5. Rack */}
                        <td className="py-3.5 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">
                            {item.rack_location}
                          </span>
                        </td>

                        {/* 6. Invoice & Cost */}
                        <td className="py-3.5 px-3 font-mono text-[11px]">
                          <div>ক্রয়: ৳ {toBengaliNumber(item.cost_per_piece.toFixed(2))} / পিস</div>
                          <div className="text-[10px] text-slate-400">
                            চালান: {item.supplier_invoice_no || 'N/A'}
                          </div>
                        </td>

                        {/* 7. Status & Recall */}
                        <td className="py-3.5 px-4 text-right">
                          {item.is_recalled ? (
                            <span className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px]">
                              প্রত্যাহারকৃত
                            </span>
                          ) : item.available_pieces <= 0 ? (
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                              স্টক শেষ
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                              সক্রিয় FEFO
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Alerts View */}
        {activeTab === 'ALERTS' && (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  <strong>জরুরি স্টক ও মেয়াদ সতর্কতা:</strong> যে সকল ওষুধের মেয়াদ ৩০-৯০ দিনের মধ্যে শেষ হচ্ছে অথবা স্টকের পরিমাণ রিঅর্ডার লেভেলের নিচে নেমে গেছে, সেগুলো নিচে তালিকাভুক্ত করা হয়েছে।
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProducts.map((item) => {
                const p = item.product;
                const isCritical = item.expiryAnalysis?.status === 'CRITICAL' || item.isOutOfStock;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCritical
                        ? 'bg-rose-50/60 border-rose-200'
                        : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm font-sans">
                          {p.brand_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans">
                          {p.generic_name} ({p.manufacturer})
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          isCritical
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {item.isOutOfStock
                          ? 'স্টক শূন্য'
                          : item.isLowStock
                          ? 'স্বল্প স্টক'
                          : item.expiryAnalysis?.labelBengali}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-400">বর্তমান মোট মজুদ</div>
                        <div className="font-bold text-slate-900 font-sans mt-0.5">
                          {item.breakdown.formattedBengali} ({toBengaliNumber(item.totalPieces)} পিস)
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-400">নিকটতম FEFO মেয়াদ</div>
                        <div className="font-bold text-slate-900 font-mono mt-0.5">
                          {item.earliestBatch ? item.earliestBatch.expiry_date : 'ব্যাচ নেই'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500">
                        অবস্থান: <strong>{item.rackLocations}</strong>
                      </span>
                      <button
                        onClick={() => handleOpenAddBatch(p.id)}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-2xs transition-colors"
                      >
                        + নতুন স্টক রিসিভ করুন
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info banner */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-600" />
            <span>
              ক্যাশ কাউন্টারে যেকোনো একক (বক্স, পাতা বা পিস) নির্বাচন করলে স্বয়ংক্রিয়ভাবে প্রাচীনতম মেয়াদযুক্ত ব্যাচ (FEFO) থেকে স্টক বাদ যাবে।
            </span>
          </div>
          <div className="font-semibold text-slate-600">
            সর্বমোট ওষুধ: {toBengaliNumber(filteredProducts.length)} টি প্রদর্শিত
          </div>
        </div>
      </div>

      {/* Modal 1: Add Batch Modal with Dynamic Unit Conversion */}
      <AddBatchModal
        isOpen={isAddBatchOpen}
        onClose={() => {
          setIsAddBatchOpen(false);
          setSelectedProductIdForBatch(undefined);
        }}
        products={products}
        preselectedProductId={selectedProductIdForBatch}
        onAddBatch={onAddBatch}
      />

      {/* Modal 2: Add Product Profile with DGDA Compliance */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={onAddProduct}
        onAddBatch={onAddBatch}
      />

      {/* Modal 3: Batch Details Modal */}
      <BatchDetailsModal
        isOpen={!!detailsProduct}
        onClose={() => setDetailsProduct(null)}
        product={detailsProduct}
        batches={batches}
        onOpenAddBatchForProduct={(prodId) => handleOpenAddBatch(prodId)}
        onToggleBatchRecall={onToggleBatchRecall}
      />
    </div>
  );
};
