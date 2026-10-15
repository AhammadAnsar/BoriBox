/**
 * AccountsReports.tsx
 * BoriBox Step 9: হিসাব ও আর্থিক প্রতিবেদন (Accounts & Reports)
 * 
 * Includes:
 * 1. ক্যাশিয়ার ডে ক্লোজিং ও ব্যালেন্স রিকনসিলিয়েশন (Z-Report Generation & Print)
 * 2. লাভ-ক্ষতি ও মার্জিন বিশ্লেষণ (Profit & Loss Statement with COGS)
 * 3. ওষুধ ও ক্যাটাগরিভিত্তিক বিক্রয় বিশ্লেষণ (Fast-Moving Items & DGDA Antibiotic Ratio)
 * 4. সাপ্লায়ার বাকি ও পেমেন্ট খাতা (Accounts Payable & Distributor Payments)
 * 5. গ্রাহক বাকির খাতা (Accounts Receivable & Due Collections)
 * 6. দৈনন্দিন দোকান পরিচালন খরচ (Petty Cash & Expenses Tracker)
 * 
 * Minimal Soft Blue/White theme, pure Bengali interface, zero cognitive overload.
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Building2,
  UserCheck,
  Calendar,
  Download,
  Printer,
  Plus,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Boxes,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wallet,
  CreditCard,
  Layers,
  Send,
} from 'lucide-react';
import {
  Product,
  StockBatch,
  SaleTransaction,
  PharmacyExpense,
  SupplierBill,
  CustomerDue,
  CashierClosing,
  UserRole,
} from '../../types/pharmacy';
import { toBengaliNumber } from '../../services/unitCalculator';
import { AddExpenseModal } from './AddExpenseModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import { CustomerDueCollectionModal } from './CustomerDueCollectionModal';
import { CashierClosingModal } from './CashierClosingModal';
import { ZReportPrintModal } from './ZReportPrintModal';

interface AccountsReportsProps {
  sales: SaleTransaction[];
  products: Product[];
  batches: StockBatch[];
  expenses: PharmacyExpense[];
  supplierBills: SupplierBill[];
  customerDues: CustomerDue[];
  cashierClosings: CashierClosing[];
  onAddExpense: (expense: PharmacyExpense) => void;
  onUpdateSupplierBill: (billId: string, amount: number, method: string, note: string) => void;
  onUpdateCustomerDue: (dueId: string, amount: number, method: string, note: string) => void;
  onSaveCashierClosing: (closing: CashierClosing) => void;
  onNavigateToPos?: () => void;
  currentUserRole?: UserRole;
  onSendDueSms?: (due: CustomerDue) => void;
}

type AccountsTab = 'closing' | 'profit_loss' | 'items_analytics' | 'supplier_ledger' | 'customer_due' | 'expenses';
type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export const AccountsReports: React.FC<AccountsReportsProps> = ({
  sales,
  products,
  batches,
  expenses,
  supplierBills,
  customerDues,
  cashierClosings,
  onAddExpense,
  onUpdateSupplierBill,
  onUpdateCustomerDue,
  onSaveCashierClosing,
  onNavigateToPos,
  currentUserRole = 'SUPER_ADMIN',
  onSendDueSms,
}) => {
  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<AccountsTab>('closing');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);
  const [activeClosingForPrint, setActiveClosingForPrint] = useState<CashierClosing | null>(null);
  const [selectedSupplierBill, setSelectedSupplierBill] = useState<SupplierBill | null>(null);
  const [selectedCustomerDue, setSelectedCustomerDue] = useState<CustomerDue | null>(null);

  // Date Filtering Logic
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(
    () => new Date(Date.now() - 86400000).toISOString().split('T')[0],
    []
  );
  const sevenDaysAgoStr = useMemo(
    () => new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    []
  );
  const thirtyDaysAgoStr = useMemo(
    () => new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
    []
  );

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleDate = s.timestamp.split('T')[0];
      if (dateFilter === 'today') return saleDate === todayStr;
      if (dateFilter === 'yesterday') return saleDate === yesterdayStr;
      if (dateFilter === 'week') return saleDate >= sevenDaysAgoStr;
      if (dateFilter === 'month') return saleDate >= thirtyDaysAgoStr;
      return true;
    });
  }, [sales, dateFilter, todayStr, yesterdayStr, sevenDaysAgoStr, thirtyDaysAgoStr]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (dateFilter === 'today') return e.date === todayStr;
      if (dateFilter === 'yesterday') return e.date === yesterdayStr;
      if (dateFilter === 'week') return e.date >= sevenDaysAgoStr;
      if (dateFilter === 'month') return e.date >= thirtyDaysAgoStr;
      return true;
    });
  }, [expenses, dateFilter, todayStr, yesterdayStr, sevenDaysAgoStr, thirtyDaysAgoStr]);

  // Today specific calculations for daily cash drawer closing
  const todaySalesStats = useMemo(() => {
    const todaySales = sales.filter((s) => s.timestamp.split('T')[0] === todayStr);
    const cashSales = todaySales
      .filter((s) => s.payment_method === 'CASH')
      .reduce((sum, s) => sum + s.net_payable, 0);
    const digitalSales = todaySales
      .filter((s) => s.payment_method === 'BKASH' || s.payment_method === 'NAGAD')
      .reduce((sum, s) => sum + s.net_payable, 0);
    const cardSales = todaySales
      .filter((s) => s.payment_method === 'CARD')
      .reduce((sum, s) => sum + s.net_payable, 0);
    const totalSales = todaySales.reduce((sum, s) => sum + s.net_payable, 0);
    const totalDiscounts = todaySales.reduce((sum, s) => sum + s.discount_amount, 0);

    const todayDrawerExpenses = expenses
      .filter((e) => e.date === todayStr && e.is_paid_from_drawer)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      cashSales,
      digitalSales,
      cardSales,
      totalSales,
      totalDiscounts,
      drawerExpenses: todayDrawerExpenses,
      invoicesCount: todaySales.length,
    };
  }, [sales, expenses, todayStr]);

  // Profit & Loss Core Computations
  const profitLossStats = useMemo(() => {
    let grossRevenue = 0;
    let totalCOGS = 0; // Cost of Goods Sold
    let totalDiscount = 0;

    filteredSales.forEach((sale) => {
      grossRevenue += sale.subtotal;
      totalDiscount += sale.discount_amount;

      // Calculate exact cost based on products in items
      sale.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.product.id) || item.product;
        const cost = (prod?.cost_per_piece || 0) * item.total_pieces;
        totalCOGS += cost;
      });
    });

    const netSales = grossRevenue - totalDiscount;
    const grossProfit = netSales - totalCOGS;
    const totalOperatingExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalOperatingExpense;
    const profitMarginPercent = netSales > 0 ? (netProfit / netSales) * 100 : 0;
    const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    return {
      grossRevenue,
      totalCOGS,
      totalDiscount,
      netSales,
      grossProfit,
      totalOperatingExpense,
      netProfit,
      profitMarginPercent,
      grossMarginPercent,
    };
  }, [filteredSales, filteredExpenses, products]);

  // Fast-Moving & Item Analytics
  const productAnalytics = useMemo(() => {
    const itemMap = new Map<
      string,
      {
        product: Product;
        quantityPieces: number;
        revenue: number;
        cost: number;
        profit: number;
        saleCount: number;
      }
    >();

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.product.id) || item.product;
        const existing = itemMap.get(prod.id);
        const itemCost = (prod.cost_per_piece || 0) * item.total_pieces;
        const itemRev = item.final_price;
        const itemProf = itemRev - itemCost;

        if (existing) {
          existing.quantityPieces += item.total_pieces;
          existing.revenue += itemRev;
          existing.cost += itemCost;
          existing.profit += itemProf;
          existing.saleCount += 1;
        } else {
          itemMap.set(prod.id, {
            product: prod,
            quantityPieces: item.total_pieces,
            revenue: itemRev,
            cost: itemCost,
            profit: itemProf,
            saleCount: 1,
          });
        }
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  // Supplier & Customer Totals
  const supplierTotalDue = useMemo(
    () => supplierBills.reduce((sum, b) => sum + b.due_amount, 0),
    [supplierBills]
  );
  const customerTotalDue = useMemo(
    () => customerDues.reduce((sum, d) => sum + d.due_amount, 0),
    [customerDues]
  );

  // Latest closing or active status
  const latestClosing = cashierClosings[0] || null;

  // Handle Closing Confirmation
  const handleConfirmClosing = (closingData: CashierClosing) => {
    onSaveCashierClosing(closingData);
    setIsClosingModalOpen(false);
    setActiveClosingForPrint(closingData);
    setIsZReportModalOpen(true);
  };

  // CSV Export Function
  const handleExportCSV = () => {
    const headers = [
      'ইনভয়েস নম্বর',
      'তারিখ ও সময়',
      'গ্রাহকের নাম',
      'ফোন',
      'মোট বিল',
      'ছাড়',
      'পরিশোধযোগ্য',
      'পেমেন্ট মাধ্যম',
      'অ্যান্টিবায়োটিক',
      'ক্যাশিয়ার',
    ];
    const rows = filteredSales.map((s) => [
      s.invoice_number,
      new Date(s.timestamp).toLocaleString('en-GB'),
      `"${s.customer_name || 'সাধারণ গ্রাহক'}"`,
      `"${s.customer_phone || '-'}"`,
      s.subtotal.toFixed(2),
      s.discount_amount.toFixed(2),
      s.net_payable.toFixed(2),
      s.payment_method,
      s.has_antibiotic ? 'YES' : 'NO',
      `"${s.cashier_name}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BoriBox_Sales_Report_${dateFilter}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-bangla select-none">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              হিসাব ও আর্থিক প্রতিবেদন
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ক্যাশিয়ার শিফট ক্লোজিং, লাভ-ক্ষতি বিবরণী, সাপ্লায়ার ও গ্রাহক খাতা
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'today', label: 'আজ' },
              { id: 'yesterday', label: 'গতকাল' },
              { id: 'week', label: '৭ দিন' },
              { id: 'month', label: 'চলতি মাস' },
              { id: 'all', label: 'সব' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === d.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>খরচ যোগ</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>ডাউনলোড</span>
          </button>

          <button
            onClick={() => setIsClosingModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>ক্লোজিং</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Net Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {dateFilter === 'today' ? 'আজকের নিট বিক্রয়' : 'মোট নিট বিক্রয় (নির্বাচিত সময়)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              ৳ {toBengaliNumber(profitLossStats.netSales.toFixed(2))}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center justify-between">
              <span>মেমো সংখ্যা: {toBengaliNumber(filteredSales.length)} টি</span>
              <span className="text-slate-400">
                ছাড়: ৳ {toBengaliNumber(profitLossStats.totalDiscount.toFixed(0))}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Net Profit & Gross Margin */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">প্রকৃত নিট লাভ (Net Profit)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {currentUserRole === 'CASHIER' ? (
              <div className="py-1">
                <div className="text-base font-bold text-slate-400 flex items-center gap-1.5 font-mono">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>৳ •••••• (লুকায়িত)</span>
                </div>
                <div className="text-[11px] text-amber-600 font-semibold mt-1">
                  🔒 RBAC: শুধু এডমিন দেখতে পারবেন
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  ৳ {toBengaliNumber(profitLossStats.netProfit.toFixed(2))}
                </div>
                <div className="text-[11px] text-emerald-800 font-semibold mt-1 flex items-center justify-between">
                  <span>মার্জিন: {toBengaliNumber(profitLossStats.profitMarginPercent.toFixed(1))}%</span>
                  <span className="text-slate-400 font-normal">
                    ক্রয়মূল্য: ৳ {toBengaliNumber(profitLossStats.totalCOGS.toFixed(0))}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Metric 3: Today's Drawer Cash & Variance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">আজকের ক্যাশ ড্রয়ার ফ্লো</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              ৳ {toBengaliNumber(todaySalesStats.cashSales.toFixed(2))}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center justify-between">
              <span>ড্রয়ার খরচ: ৳ {toBengaliNumber(todaySalesStats.drawerExpenses.toFixed(0))}</span>
              <span className="text-sky-700 font-semibold">
                ডিজিটাল: ৳ {toBengaliNumber(todaySalesStats.digitalSales.toFixed(0))}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Supplier & Customer Due Outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">বকেয়া ও দেনা-পাওনা</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold font-mono text-rose-700">
              ৳ {toBengaliNumber(supplierTotalDue.toFixed(2))}
              <span className="text-[11px] font-bangla font-normal text-slate-500 ml-1.5">
                (সাপ্লায়ার দেনা)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              গ্রাহকের কাছে বাকি: <span className="font-bold text-slate-800 font-mono">৳ {toBengaliNumber(customerTotalDue.toFixed(0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 text-xs">
        {[
          { id: 'closing', label: 'ক্লোজিং', icon: Lock },
          { id: 'profit_loss', label: 'লাভ-ক্ষতি', icon: TrendingUp },
          { id: 'items_analytics', label: 'অ্যানালিটিক্স', icon: PieChart },
          { id: 'supplier_ledger', label: 'সাপ্লায়ার', icon: Building2 },
          { id: 'customer_due', label: 'গ্রাহক বাকি', icon: UserCheck },
          { id: 'expenses', label: 'খরচ', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Cashier Closing & Shift Reconciliations */}
      {activeTab === 'closing' && (
        <div className="space-y-6">
          {/* Current Live Shift Reconciler Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="text-base font-bold text-slate-900">
                    আজকের ক্যাশ ড্রয়ার লাইভ রিকনসিলিয়েশন ({toBengaliNumber(todayStr)})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  বর্তমান সেশন এখনও খোলা আছে। দিনশেষে বা শিফট শেষে ক্যাশ গুনে ক্লোজিং সম্পন্ন করুন।
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsClosingModalOpen(true)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>ক্যাশিয়ার শিফট ক্লোজিং হিসাব করুন</span>
                </button>
              </div>
            </div>

            {/* Shift Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[11px]">১. প্রারম্ভিক ক্যাশ ফ্লোট</span>
                <div className="text-base font-bold font-mono text-slate-800 mt-1">৳ ২,০০০.০০</div>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                <span className="text-emerald-800 text-[11px]">২. নগদ ক্যাশ বিক্রয়</span>
                <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                  ৳ {toBengaliNumber(todaySalesStats.cashSales.toFixed(2))}
                </div>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60">
                <span className="text-rose-800 text-[11px]">৩. ড্রয়ার থেকে খরচ</span>
                <div className="text-base font-bold font-mono text-rose-700 mt-1">
                  ৳ {toBengaliNumber(todaySalesStats.drawerExpenses.toFixed(2))}
                </div>
              </div>
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200/80">
                <span className="text-sky-900 font-semibold text-[11px]">৪. ড্রয়ারে প্রত্যাশিত নগদ</span>
                <div className="text-base font-bold font-mono text-sky-800 mt-1">
                  ৳{' '}
                  {toBengaliNumber(
                    (2000 + todaySalesStats.cashSales - todaySalesStats.drawerExpenses).toFixed(2)
                  )}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[11px]">৫. ডিজিটাল বিক্রয় (বিকাশ)</span>
                <div className="text-base font-bold font-mono text-slate-800 mt-1">
                  ৳ {toBengaliNumber(todaySalesStats.digitalSales.toFixed(2))}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[11px]">৬. আজকের মোট মেমো</span>
                <div className="text-base font-bold font-mono text-slate-800 mt-1">
                  {toBengaliNumber(todaySalesStats.invoicesCount)} টি
                </div>
              </div>
            </div>
          </div>

          {/* Past Shift Closings & Z-Reports Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  বিগত শিফট ক্লোজিং ও Z-রিপোর্ট রেকর্ড
                </h4>
                <p className="text-xs text-slate-500">
                  প্রতিটি শিফটের গণনাকৃত ক্যাশ, শর্ট/এক্সেস ইতিহাস ও প্রিন্ট ভাউচার
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                মোট রেকর্ড: {toBengaliNumber(cashierClosings.length)} টি
              </span>
            </div>

            {cashierClosings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                এখনও কোনো শিফট ক্লোজিং রেকর্ড জমা হয়নি। ওপরের "ক্যাশিয়ার শিফট ক্লোজিং হিসাব করুন" বোতামে ক্লিক করে প্রথম Z-রিপোর্ট তৈরি করুন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-3 px-4">তারিখ ও শিফট</th>
                      <th className="py-3 px-4">ক্যাশিয়ার</th>
                      <th className="py-3 px-4 text-right">শুরুর ক্যাশ</th>
                      <th className="py-3 px-4 text-right">ক্যাশ সেলস</th>
                      <th className="py-3 px-4 text-right">ড্রয়ার খরচ</th>
                      <th className="py-3 px-4 text-right">প্রত্যাশিত ক্যাশ</th>
                      <th className="py-3 px-4 text-right">বাস্তব ক্যাশ</th>
                      <th className="py-3 px-4 text-right">পার্থক্য (শর্ট/এক্সেস)</th>
                      <th className="py-3 px-4 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {cashierClosings.map((closing) => {
                      const isShort = closing.variance < 0;
                      const isExcess = closing.variance > 0;
                      return (
                        <tr key={closing.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{closing.shift_name}</div>
                            <div className="text-[11px] text-slate-500">
                              {toBengaliNumber(closing.date)} · {closing.closed_at}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">{closing.cashier_name}</td>
                          <td className="py-3 px-4 text-right font-mono">
                            ৳ {toBengaliNumber(closing.opening_cash.toFixed(2))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            ৳ {toBengaliNumber(closing.cash_sales.toFixed(2))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-rose-700">
                            ৳ {toBengaliNumber(closing.drawer_expenses.toFixed(2))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            ৳ {toBengaliNumber(closing.expected_cash.toFixed(2))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sky-800">
                            ৳ {toBengaliNumber(closing.actual_cash.toFixed(2))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {closing.variance === 0 ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                সঠিক (৳ ০.০০)
                              </span>
                            ) : isShort ? (
                              <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                                ঘাটতি -৳ {toBengaliNumber(Math.abs(closing.variance).toFixed(2))}
                              </span>
                            ) : (
                              <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">
                                বাড়তি +৳ {toBengaliNumber(closing.variance.toFixed(2))}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setActiveClosingForPrint(closing);
                                setIsZReportModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 mx-auto"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Z-রিপোর্ট প্রিন্ট</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Profit & Loss Statement (লাভ-ক্ষতি বিবরণী) */}
      {activeTab === 'profit_loss' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  লাভ-ক্ষতি ও আয়-ব্যয় বিবরণী (Profit & Loss Statement)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  গ্রস সেলস, ক্রয়মূল্য (COGS), মোট লাভ, দোকান খরচ ও প্রকৃত নিট মুনাফা
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">সময়সীমা:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">
                  {dateFilter === 'today'
                    ? 'আজকের দিন'
                    : dateFilter === 'yesterday'
                    ? 'গতকাল'
                    : dateFilter === 'week'
                    ? 'বিগত ৭ দিন'
                    : dateFilter === 'month'
                    ? 'বিগত ৩০ দিন'
                    : 'সমস্ত রেকর্ড'}
                </span>
              </div>
            </div>

            {currentUserRole === 'CASHIER' ? (
              <div className="mt-8 mb-6 max-w-lg mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-amber-900">
                  অ্যাক্সেস সংরক্ষিত: শুধু সুপার এডমিন (মালিক) দেখতে পারবেন
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  RBAC পারমিশন পলিসি অনুসারে ক্যাশিয়ারদের জন্য ক্রয়মূল্য (COGS), গ্রস মার্জিন এবং প্রকৃত নিট মুনাফা প্রতিবেদন সংরক্ষিত রয়েছে।
                </p>
              </div>
            ) : (
              /* Income Statement Table format */
              <div className="mt-6 max-w-3xl mx-auto bg-slate-50 rounded-xl border border-slate-200/80 p-5 text-xs space-y-3 font-bangla">
              {/* 1. Operating Revenue */}
              <div className="pb-3 border-b border-slate-200">
                <div className="font-bold text-sm text-slate-900 mb-2">১. বিক্রয় আয় (Revenue)</div>
                <div className="flex justify-between py-1 text-slate-700">
                  <span>মোট বিক্রয় মূল্য (Gross Revenue / MRP Subtotal):</span>
                  <span className="font-mono font-bold">
                    ৳ {toBengaliNumber(profitLossStats.grossRevenue.toFixed(2))}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-500">
                  <span>বাদ: গ্রাহককে প্রদত্ত মোট ছাড় (Total Discounts):</span>
                  <span className="font-mono text-rose-600">
                    - ৳ {toBengaliNumber(profitLossStats.totalDiscount.toFixed(2))}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-white px-3 rounded-lg border border-slate-200/60 mt-1">
                  <span>নিট বিক্রয় মূল্য (Net Sales):</span>
                  <span className="font-mono text-sky-800">
                    ৳ {toBengaliNumber(profitLossStats.netSales.toFixed(2))}
                  </span>
                </div>
              </div>

              {/* 2. Cost of Goods Sold */}
              <div className="pb-3 border-b border-slate-200">
                <div className="font-bold text-sm text-slate-900 mb-2">
                  ২. বিক্রিত ওষুধের মোট ক্রয়মূল্য (Cost of Goods Sold - COGS)
                </div>
                <div className="flex justify-between py-1 text-slate-700">
                  <span>ঔষধ কোম্পানির নিকট থেকে পাইকারি ক্রয় খরচ (Base Cost):</span>
                  <span className="font-mono text-rose-700 font-semibold">
                    - ৳ {toBengaliNumber(profitLossStats.totalCOGS.toFixed(2))}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-emerald-800 bg-emerald-50/80 px-3 rounded-lg border border-emerald-100 mt-1">
                  <span>মোট লাভ (Gross Profit):</span>
                  <span className="font-mono text-sm">
                    ৳ {toBengaliNumber(profitLossStats.grossProfit.toFixed(2))}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 text-right mt-1">
                  গ্রস মার্জিন: {toBengaliNumber(profitLossStats.grossMarginPercent.toFixed(1))}%
                </div>
              </div>

              {/* 3. Operating Expenses */}
              <div className="pb-3 border-b border-slate-200">
                <div className="font-bold text-sm text-slate-900 mb-2">
                  ৩. দোকান পরিচালন ব্যয় (Operating & Petty Expenses)
                </div>
                <div className="flex justify-between py-1 text-slate-700">
                  <span>দোকানের দৈনন্দিন খরচ (চা-নাস্তা, পরিবহন, বিল, রক্ষণাবেক্ষণ ইত্যাদি):</span>
                  <span className="font-mono text-rose-700 font-semibold">
                    - ৳ {toBengaliNumber(profitLossStats.totalOperatingExpense.toFixed(2))}
                  </span>
                </div>
              </div>

              {/* 4. Bottom Line: Net Profit */}
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-base text-sky-950">
                      প্রকৃত নিট মুনাফা (Net Bottom-line Profit)
                    </span>
                    <p className="text-[11px] text-sky-700 mt-0.5">
                      সব খরচ ও ছাড় বাদ দিয়ে ফার্মেসির প্রকৃত নীট লাভ
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-emerald-700">
                      ৳ {toBengaliNumber(profitLossStats.netProfit.toFixed(2))}
                    </div>
                    <div className="text-xs font-bold text-emerald-800">
                      নিট প্রফিট মার্জিন: {toBengaliNumber(profitLossStats.profitMarginPercent.toFixed(1))}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Fast-Moving & Medicine Analytics (শীর্ষ বিক্রিত ওষুধ) */}
      {activeTab === 'items_analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  সর্বাধিক বিক্রিত ওষুধ ও লাভজনক প্রোডাক্ট অ্যানালিটিক্স
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  কোন ওষুধটি সবচেয়ে বেশি বিক্রি হচ্ছে এবং কোনটিতে সর্বাধিক মুনাফা অর্জিত হচ্ছে
                </p>
              </div>

              <div className="w-full md:w-64 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ওষুধ বা জেনেরিক খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">র‍্যাংক ও ওষুধের নাম</th>
                    <th className="py-3 px-4">জেনেরিক ও কোম্পানি</th>
                    <th className="py-3 px-4">ডিজিডিএ ক্যাটাগরি</th>
                    <th className="py-3 px-4 text-right">বিক্রিত পিস সংখ্যা</th>
                    <th className="py-3 px-4 text-right">মোট বিক্রয়মূল্য</th>
                    <th className="py-3 px-4 text-right">ক্রয়মূল্য (COGS)</th>
                    <th className="py-3 px-4 text-right">অর্জিত লাভ</th>
                    <th className="py-3 px-4 text-right">প্রফিট মার্জিন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {productAnalytics
                    .filter((item) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        item.product.brand_name.toLowerCase().includes(q) ||
                        item.product.generic_name.toLowerCase().includes(q) ||
                        item.product.manufacturer.toLowerCase().includes(q)
                      );
                    })
                    .map((item, idx) => {
                      const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                      return (
                        <tr key={item.product.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {toBengaliNumber(idx + 1)}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900">
                                  {item.product.brand_name}
                                </span>
                                <div className="text-[10px] text-slate-400 font-sans">
                                  {item.product.strength} · {item.product.dosage_form}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{item.product.generic_name}</div>
                            <div className="text-[11px] text-slate-500 font-sans">{item.product.manufacturer}</div>
                          </td>
                          <td className="py-3 px-4">
                            {item.product.is_antibiotic ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                অ্যান্টিবায়োটিক
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {item.product.schedule}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {toBengaliNumber(item.quantityPieces)} পিস
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ৳ {toBengaliNumber(item.revenue.toFixed(2))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            ৳ {toBengaliNumber(item.cost.toFixed(2))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            ৳ {toBengaliNumber(item.profit.toFixed(2))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                            {toBengaliNumber(margin.toFixed(1))}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Supplier Ledger & Accounts Payable (সাপ্লায়ার বাকি খাতা) */}
      {activeTab === 'supplier_ledger' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ওষুধ প্রস্তুতকারক ও পাইকারি সাপ্লায়ার দেনা-পাওনা লেজার
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  স্কয়ার, ইনসেপ্টা, বেক্সিমকো সহ পাইকারি কোম্পানিভিত্তিক ক্রয় চালান ও বকেয়া খাতা
                </p>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-right">
                <span className="text-[11px] text-rose-800 font-semibold block">
                  মোট অপরিশোধিত সাপ্লায়ার দেনা
                </span>
                <span className="text-xl font-bold font-mono text-rose-700">
                  ৳ {toBengaliNumber(supplierTotalDue.toFixed(2))}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">কোম্পানি ও ডিপো</th>
                    <th className="py-3 px-4">চালান ইনভয়েস নং</th>
                    <th className="py-3 px-4">চালান তারিখ</th>
                    <th className="py-3 px-4 text-right">মোট চালান বিল</th>
                    <th className="py-3 px-4 text-right">পরিশোধিত টাকা</th>
                    <th className="py-3 px-4 text-right">অবশিষ্ট বকেয়া</th>
                    <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {supplierBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{bill.supplier_name}</div>
                        <div className="text-[11px] text-slate-500 font-sans">{bill.company}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {bill.invoice_no}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {toBengaliNumber(bill.invoice_date)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ৳ {toBengaliNumber(bill.total_amount.toFixed(2))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                        ৳ {toBengaliNumber(bill.paid_amount.toFixed(2))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                        ৳ {toBengaliNumber(bill.due_amount.toFixed(2))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {bill.status === 'PAID' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            পরিশোধিত
                          </span>
                        ) : bill.status === 'PARTIAL' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            আংশিক বকেয়া
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                            বকেয়া
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {bill.due_amount > 0 ? (
                          <button
                            onClick={() => setSelectedSupplierBill(bill)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                          >
                            পরিশোধ
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">কোন দেনা নেই</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Customer Due Ledger (গ্রাহক বাকির খাতা) */}
      {activeTab === 'customer_due' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  গ্রাহক ও রোগীর বাকির খাতা (Accounts Receivable)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  স্থানীয় নিয়মিত বা জরুরি ওষুধের বাকির হিসাব, ফোন নম্বর ও আদায়ের রেকর্ড
                </p>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200/80 rounded-xl text-right">
                <span className="text-[11px] text-sky-800 font-semibold block">
                  মোট গ্রাহক বাকি পাওনা
                </span>
                <span className="text-xl font-bold font-mono text-sky-900">
                  ৳ {toBengaliNumber(customerTotalDue.toFixed(2))}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">গ্রাহকের নাম ও ফোন</th>
                    <th className="py-3 px-4">মেমো ইনভয়েস নং</th>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4 text-right">মোট বিল</th>
                    <th className="py-3 px-4 text-right">পরিশোধিত</th>
                    <th className="py-3 px-4 text-right">বকেয়া বাকি</th>
                    <th className="py-3 px-4">মন্তব্য / নোট</th>
                    <th className="py-3 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {customerDues.map((due) => (
                    <tr key={due.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{due.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-sans">{due.customer_phone}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {due.invoice_number}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {toBengaliNumber(due.invoice_date)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ৳ {toBengaliNumber(due.total_bill.toFixed(2))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                        ৳ {toBengaliNumber(due.paid_amount.toFixed(2))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                        ৳ {toBengaliNumber(due.due_amount.toFixed(2))}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                        {due.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {due.due_amount > 0 ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedCustomerDue(due)}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                            >
                              পরিশোধ
                            </button>
                            {onSendDueSms && (
                              <button
                                onClick={() => onSendDueSms(due)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                                title="গ্রাহকের মোবাইলে বকেয়া তাগাদার এসএমএস পাঠান"
                              >
                                <Send className="w-3 h-3 text-emerald-600" />
                                <span>এসএমএস</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px]">সম্পূর্ণ পরিশোধিত</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Daily Shop Expenses Ledger (দোকানের পরিচালন খরচ) */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ফার্মেসির দৈনন্দিন দোকান খরচ ও পেটি ক্যাশ খাতা
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  কর্মচারীর চা-নাস্তা, যাতায়াত, বিদ্যুৎ বিল, দোকান ভাড়া ও পেটি ক্যাশ উত্তোলন
                </p>
              </div>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন খরচ এন্ট্রি</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">খরচের শিরোনাম বা বিবরণ</th>
                    <th className="py-3 px-4">খাত / ক্যাটাগরি</th>
                    <th className="py-3 px-4 text-right">টাকার পরিমাণ</th>
                    <th className="py-3 px-4">মাধ্যম</th>
                    <th className="py-3 px-4">ক্যাশ ড্রয়ার থেকে কর্তন</th>
                    <th className="py-3 px-4">এন্ট্রি প্রদানকারী</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {toBengaliNumber(exp.date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{exp.title}</div>
                        {exp.note && <div className="text-[11px] text-slate-400">{exp.note}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                        ৳ {toBengaliNumber(exp.amount.toFixed(2))}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {exp.payment_method}
                      </td>
                      <td className="py-3 px-4">
                        {exp.is_paid_from_drawer ? (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            হ্যাঁ (ড্রয়ার)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">বাইরে থেকে</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{exp.recorded_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onAddExpense={onAddExpense}
      />

      <CashierClosingModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        todaySales={todaySalesStats}
        drawerExpenses={todaySalesStats.drawerExpenses}
        onConfirmClosing={handleConfirmClosing}
      />

      <ZReportPrintModal
        isOpen={isZReportModalOpen}
        closing={activeClosingForPrint}
        onClose={() => setIsZReportModalOpen(false)}
      />

      <SupplierPaymentModal
        isOpen={!!selectedSupplierBill}
        bill={selectedSupplierBill}
        onClose={() => setSelectedSupplierBill(null)}
        onRecordPayment={onUpdateSupplierBill}
      />

      <CustomerDueCollectionModal
        isOpen={!!selectedCustomerDue}
        dueItem={selectedCustomerDue}
        onClose={() => setSelectedCustomerDue(null)}
        onCollectDue={onUpdateCustomerDue}
      />
    </div>
  );
};
