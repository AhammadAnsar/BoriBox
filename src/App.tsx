/**
 * BoriBox - Offline-First Pharmacy Management Desktop System
 * Main Dashboard Layout with Sidebar Navigation
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { PosCashCounter } from './components/pos/PosCashCounter';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { AccountsReports } from './components/accounts/AccountsReports';
import { DgdaLogbook } from './components/dgda/DgdaLogbook';
import { LanServerDashboard } from './components/lan/LanServerDashboard';
import { ArchitectureDeliverables } from './components/docs/ArchitectureDeliverables';
import { MobilePosView } from './components/pos/MobilePosView';
import { SettingsManagement } from './components/settings/SettingsManagement';
import { Onboarding, OnboardingWizard } from './components/onboarding/Onboarding';
import { LoginScreen } from './components/auth/LoginScreen';
import {
  INITIAL_PRODUCTS,
  INITIAL_BATCHES,
  INITIAL_EXPENSES,
  INITIAL_SUPPLIER_BILLS,
  INITIAL_CUSTOMER_DUES,
  SAMPLE_SALES_HISTORY,
  INITIAL_APP_USERS,
  INITIAL_SMS_CONFIG,
  INITIAL_SMS_LOGS,
  INITIAL_BACKUP_CONFIG,
  INITIAL_BACKUP_HISTORY,
  INITIAL_PHARMACY_PROFILE,
} from './data/mockDatabase';
import {
  Product,
  StockBatch,
  SaleTransaction,
  CartItem,
  PharmacyExpense,
  SupplierBill,
  CustomerDue,
  CashierClosing,
  AppUser,
  UserRole,
  SmsGatewayConfig,
  SmsLogEntry,
  BackupConfig,
  BackupSnapshot,
  PharmacyProfile,
  OnboardingSetupPayload,
} from './types/pharmacy';
import { analyzeExpiry } from './services/fefoEngine';
import { sendSmsViaGateway, compileSmsTemplate } from './services/smsService';
import { dbApi } from './services/dbApi';
import {
  Menu,
  X,
  WifiOff,
  ShoppingCart,
  Smartphone,
  Settings,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_db_products') || localStorage.getItem('boribox_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [batches, setBatches] = useState<StockBatch[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_batches');
      return saved ? JSON.parse(saved) : INITIAL_BATCHES;
    } catch {
      return INITIAL_BATCHES;
    }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobilePreviewMode, setIsMobilePreviewMode] = useState(false);

  // Sales state (persisted in localStorage, pre-seeded with realistic sample sales)
  const [sales, setSales] = useState<SaleTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_sales_history');
      return saved ? JSON.parse(saved) : SAMPLE_SALES_HISTORY;
    } catch {
      return SAMPLE_SALES_HISTORY;
    }
  });

  // Accounts & Reports States
  const [expenses, setExpenses] = useState<PharmacyExpense[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_supplier_bills');
      return saved ? JSON.parse(saved) : INITIAL_SUPPLIER_BILLS;
    } catch {
      return INITIAL_SUPPLIER_BILLS;
    }
  });

  const [customerDues, setCustomerDues] = useState<CustomerDue[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_customer_dues');
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_DUES;
    } catch {
      return INITIAL_CUSTOMER_DUES;
    }
  });

  const [cashierClosings, setCashierClosings] = useState<CashierClosing[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_cashier_closings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Step 10: Users & RBAC State
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_users');
      return saved ? JSON.parse(saved) : INITIAL_APP_USERS;
    } catch {
      return INITIAL_APP_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    try {
      const saved = localStorage.getItem('boribox_current_user');
      return saved ? JSON.parse(saved) : INITIAL_APP_USERS[0];
    } catch {
      return INITIAL_APP_USERS[0];
    }
  });

  // SMS Gateway Configuration State
  const [smsConfig, setSmsConfig] = useState<SmsGatewayConfig>(() => {
    try {
      const saved = localStorage.getItem('boribox_sms_config');
      return saved ? JSON.parse(saved) : INITIAL_SMS_CONFIG;
    } catch {
      return INITIAL_SMS_CONFIG;
    }
  });

  const [smsLogs, setSmsLogs] = useState<SmsLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_sms_logs');
      return saved ? JSON.parse(saved) : INITIAL_SMS_LOGS;
    } catch {
      return INITIAL_SMS_LOGS;
    }
  });

  // Google Drive & Backup Configuration State
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(() => {
    try {
      const saved = localStorage.getItem('boribox_backup_config');
      return saved ? JSON.parse(saved) : INITIAL_BACKUP_CONFIG;
    } catch {
      return INITIAL_BACKUP_CONFIG;
    }
  });

  const [backupHistory, setBackupHistory] = useState<BackupSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('boribox_backup_history');
      return saved ? JSON.parse(saved) : INITIAL_BACKUP_HISTORY;
    } catch {
      return INITIAL_BACKUP_HISTORY;
    }
  });

  // Pharmacy Profile State
  const [pharmacyProfile, setPharmacyProfile] = useState<PharmacyProfile>(() => {
    try {
      const saved = localStorage.getItem('boribox_pharmacy_profile');
      return saved ? JSON.parse(saved) : INITIAL_PHARMACY_PROFILE;
    } catch {
      return INITIAL_PHARMACY_PROFILE;
    }
  });

  // Toast alert for Customer Due SMS sending
  const [smsFeedbackToast, setSmsFeedbackToast] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);

  // First-Time Boot & Onboarding check (In Rust: invoke('check_is_first_run'))
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('boribox_setup_completed');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Asynchronously synchronize with native SQLite / persistent dbApi on startup
  useEffect(() => {
    let isMounted = true;
    async function initDatabaseData() {
      try {
        const [
          dbProducts,
          dbBatches,
          dbSales,
          dbExpenses,
          dbBills,
          dbDues,
          dbClosings,
          dbUsers,
          dbProfile,
          dbSms,
          dbSmsLogs,
          dbBackup,
          dbBackupHist,
        ] = await Promise.all([
          dbApi.getProducts(),
          dbApi.getBatches(),
          dbApi.getSales(),
          dbApi.getExpenses(),
          dbApi.getSupplierBills(),
          dbApi.getCustomerDues(),
          dbApi.getCashierClosings(),
          dbApi.getUsers(),
          dbApi.getShopProfile(),
          dbApi.getSmsConfig(),
          dbApi.getSmsLogs(),
          dbApi.getBackupConfig(),
          dbApi.getBackupHistory(),
        ]);

        if (isMounted) {
          if (dbProducts.length > 0) setProducts(dbProducts);
          if (dbBatches.length > 0) setBatches(dbBatches);
          if (dbSales.length > 0) setSales(dbSales);
          if (dbExpenses.length > 0) setExpenses(dbExpenses);
          if (dbBills.length > 0) setSupplierBills(dbBills);
          if (dbDues.length > 0) setCustomerDues(dbDues);
          if (dbClosings.length > 0) setCashierClosings(dbClosings);
          if (dbUsers.length > 0) setUsers(dbUsers);
          if (dbProfile) setPharmacyProfile(dbProfile);
          if (dbSms) setSmsConfig(dbSms);
          if (dbSmsLogs) setSmsLogs(dbSmsLogs);
          if (dbBackup) setBackupConfig(dbBackup);
          if (dbBackupHist) setBackupHistory(dbBackupHist);
        }
      } catch (err) {
        console.warn('Database async load warning:', err);
      }
    }
    initDatabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Authentication Session State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // Critical expiry count
  const criticalExpiryCount = batches.filter((b) => {
    const analysis = analyzeExpiry(b.expiry_date);
    return analysis.status === 'CRITICAL';
  }).length;

  // Complete Sale
  const handleCompleteSale = async (completedSale: SaleTransaction) => {
    await dbApi.createSale(completedSale);
    setSales((prev) => [completedSale, ...prev]);

    setBatches((prevBatches) => {
      const updated = [...prevBatches];
      completedSale.items.forEach((item) => {
        item.allocated_batches.forEach((alloc) => {
          const idx = updated.findIndex(
            (b) => b.batch_number === alloc.batch_number && b.product_id === item.product.id
          );
          if (idx > -1) {
            updated[idx] = {
              ...updated[idx],
              available_pieces: Math.max(0, updated[idx].available_pieces - alloc.pieces_deducted),
            };
          }
        });
      });
      return updated;
    });
  };

  const handleAddBatch = (newBatch: StockBatch) => {
    dbApi.saveBatch(newBatch);
    setBatches((prev) => [newBatch, ...prev]);
  };

  const handleAddProduct = (newProduct: Product) => {
    dbApi.saveProduct(newProduct);
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleToggleBatchRecall = (batchId: string) => {
    dbApi.toggleBatchRecall(batchId);
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, is_recalled: !b.is_recalled } : b))
    );
  };

  const handleAddExpense = (newExpense: PharmacyExpense) => {
    dbApi.addExpense(newExpense);
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleUpdateSupplierBill = (
    billId: string,
    amount: number,
    method: string,
    note: string
  ) => {
    setSupplierBills((prev) => {
      const updated = prev.map((bill) => {
        if (bill.id === billId) {
          const newPaid = bill.paid_amount + amount;
          const newDue = Math.max(0, bill.total_amount - newPaid);
          return {
            ...bill,
            paid_amount: newPaid,
            due_amount: newDue,
            status: (newDue === 0 ? 'PAID' : 'PARTIAL') as any,
            last_payment_date: new Date().toISOString().split('T')[0],
          };
        }
        return bill;
      });
      try {
        localStorage.setItem('boribox_supplier_bills', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save supplier bills:', err);
      }
      return updated;
    });

    // Also record as expense if paid from cash/drawer
    if (method === 'CASH') {
      handleAddExpense({
        id: `exp-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category: 'SUPPLIER_PAYMENT',
        title: `সাপ্লায়ার বিল পরিশোধ (${note || 'নগদ'})`,
        amount,
        payment_method: 'CASH',
        is_paid_from_drawer: true,
        recorded_by: 'ফার্মাসিস্ট রফিক',
      });
    }
  };

  const handleUpdateCustomerDue = (
    dueId: string,
    amount: number,
    method: string,
    note: string
  ) => {
    setCustomerDues((prev) => {
      const updated = prev.map((due) => {
        if (due.id === dueId) {
          const newPaid = due.paid_amount + amount;
          const newDue = Math.max(0, due.total_bill - newPaid);
          return {
            ...due,
            paid_amount: newPaid,
            due_amount: newDue,
            status: (newDue === 0 ? 'CLEARED' : 'PARTIAL') as any,
            last_payment_date: new Date().toISOString().split('T')[0],
            notes: note ? `${due.notes ? due.notes + ' | ' : ''}${note}` : due.notes,
          };
        }
        return due;
      });
      try {
        localStorage.setItem('boribox_customer_dues', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save customer dues:', err);
      }
      return updated;
    });
  };

  const handleSaveCashierClosing = (closing: CashierClosing) => {
    dbApi.saveCashierClosing(closing);
    setCashierClosings((prev) => [closing, ...prev]);
  };

  // Step 10: Settings, SMS & Backup Handlers
  const handleSwitchUserRole = (newRole: UserRole) => {
    const matchingUser = users.find((u) => u.role === newRole) || {
      ...currentUser,
      role: newRole,
      name: newRole === 'SUPER_ADMIN' ? 'ফার্মাসিস্ট সাব্বির হোসেন' : 'ক্যাশিয়ার তানভীর আহমেদ',
    };
    setCurrentUser(matchingUser);
    try {
      localStorage.setItem('boribox_current_user', JSON.stringify(matchingUser));
    } catch (err) {
      console.error('Failed to save current user:', err);
    }
  };

  const handleAddUser = (newUser: AppUser) => {
    dbApi.saveUser(newUser);
    setUsers((prev) => [...prev, newUser]);
  };

  const handleUpdateSmsConfig = (newConfig: SmsGatewayConfig) => {
    dbApi.saveSmsConfig(newConfig);
    setSmsConfig(newConfig);
  };

  const handleAddSmsLog = (newLog: SmsLogEntry) => {
    dbApi.addSmsLog(newLog);
    setSmsLogs((prev) => [newLog, ...prev]);
  };

  const handleUpdateBackupConfig = (newConfig: BackupConfig) => {
    dbApi.saveBackupConfig(newConfig);
    setBackupConfig(newConfig);
  };

  const handleAddBackupSnapshot = (newSnapshot: BackupSnapshot) => {
    dbApi.addBackupSnapshot(newSnapshot);
    setBackupHistory((prev) => [newSnapshot, ...prev]);
  };

  const handleUpdatePharmacyProfile = (newProfile: PharmacyProfile) => {
    dbApi.saveShopProfile(newProfile);
    setPharmacyProfile(newProfile);
  };

  const handleSendDueSms = async (due: CustomerDue) => {
    const message = compileSmsTemplate(smsConfig.due_reminder_template, {
      customerName: due.customer_name,
      dueAmount: due.due_amount,
      pharmacyName: pharmacyProfile.pharmacy_name,
      invoiceNo: due.invoice_number,
    });

    const { result, logEntry } = await sendSmsViaGateway(
      smsConfig,
      due.customer_phone,
      message,
      due.customer_name
    );

    handleAddSmsLog(logEntry);

    if (result.success) {
      setSmsFeedbackToast({
        text: `গ্রাহক ${due.customer_name}-এর মোবাইলে (${due.customer_phone}) বকেয়া তাগাদা এসএমএস সফলভাবে প্রেরিত হয়েছে।`,
      });
    } else {
      setSmsFeedbackToast({
        text: result.error || 'এসএমএস পাঠাতে ত্রুটি হয়েছে।',
        isError: true,
      });
    }

    setTimeout(() => setSmsFeedbackToast(null), 4000);
  };

  // Complete First-Time Setup & Onboarding
  const handleCompleteOnboarding = (payload: OnboardingSetupPayload) => {
    // 1. Update Pharmacy Profile
    const newProfile: PharmacyProfile = {
      ...pharmacyProfile,
      pharmacy_name: payload.pharmacy.pharmacy_name,
      owner_name: payload.pharmacy.owner_name,
      drug_license_no: payload.pharmacy.drug_license_no,
      address: payload.pharmacy.address,
      phone: payload.pharmacy.phone,
      printer_paper_width: payload.pharmacy.printer_paper_width,
      logo_url: payload.pharmacy.logo_url || pharmacyProfile.logo_url,
    };
    handleUpdatePharmacyProfile(newProfile);

    // 2. Insert Super Admin User
    const adminUser: AppUser = {
      id: `usr-admin-${Date.now()}`,
      name: payload.admin.name,
      username: payload.admin.username,
      role: 'SUPER_ADMIN',
      pin: payload.admin.pin,
      phone: payload.admin.phone,
      status: 'ACTIVE',
      created_at: new Date().toISOString().split('T')[0],
    };

    dbApi.saveUser(adminUser);
    dbApi.bootstrapFirstTimeSetup(payload);

    setUsers((prev) => {
      const filtered = prev.filter((u) => u.username !== adminUser.username);
      return [adminUser, ...filtered];
    });

    setCurrentUser(adminUser);
    try {
      localStorage.setItem('boribox_current_user', JSON.stringify(adminUser));
      localStorage.setItem('boribox_setup_completed', 'true');
    } catch (err) {
      console.error('Failed to save setup state:', err);
    }

    setIsSetupCompleted(true);
    setIsLoggedIn(true);

    setSmsFeedbackToast({
      text: `অভিনন্দন! ${payload.pharmacy.pharmacy_name} এর প্রাথমিক সেটআপ ও সুপার এডমিন অ্যাকাউন্ট সক্রিয় হয়েছে।`,
    });
  };

  const tabTitles: Record<NavTab, string> = {
    dashboard: 'ড্যাশবোর্ড',
    pos: 'বিক্রয়',
    inventory: 'মজুদ',
    accounts: 'হিসাব',
    dgda: 'রেজিস্টার',
    lan_crdt: 'সিঙ্ক',
    settings: 'সেটিংস',
    docs: 'ডকুমেন্টস',
  };

  // 1. First-Time Setup / Onboarding Check
  if (!isSetupCompleted) {
    return (
      <OnboardingWizard
        onCompleteSetup={handleCompleteOnboarding}
        onSkipToDemo={() => {
          setIsSetupCompleted(true);
          setIsLoggedIn(true);
          try {
            localStorage.setItem('boribox_setup_completed', 'true');
          } catch {}
        }}
      />
    );
  }

  // 2. Authentication Login Screen Check
  if (!isLoggedIn) {
    return (
      <LoginScreen
        users={users}
        pharmacyProfile={pharmacyProfile}
        onLogin={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }}
        onRerunOnboarding={() => {
          setIsSetupCompleted(false);
        }}
      />
    );
  }

  if (isMobilePreviewMode) {
    return (
      <MobilePosView
        products={products}
        batches={batches}
        onCompleteSale={handleCompleteSale}
        onExitMobileView={() => setIsMobilePreviewMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-bangla">
      {/* Desktop Navigation Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartCount={cart.length}
          criticalExpiryCount={criticalExpiryCount}
          todaySalesCount={sales.length}
          currentUserRole={currentUser.role}
          currentUserName={currentUser.name}
          pharmacyLogo={pharmacyProfile.logo_url}
          pharmacyName={pharmacyProfile.pharmacy_name}
          onLogout={() => setIsLoggedIn(false)}
        />
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb with dynamic Pharmacy Logo & Title */}
            <div className="flex items-center gap-2.5">
              {pharmacyProfile.logo_url && (
                <img
                  src={pharmacyProfile.logo_url}
                  alt={pharmacyProfile.pharmacy_name || 'লোগো'}
                  className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0"
                />
              )}
              <div>
                <span className="text-xs text-slate-400">
                  {pharmacyProfile.pharmacy_name || 'বোরিবক্স'} ·{' '}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {tabTitles[activeTab]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* User Role Quick Switcher Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/90 px-2 sm:px-2.5 py-1 rounded-xl">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 ${
                  currentUser.role === 'SUPER_ADMIN' ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}
              >
                {currentUser.role === 'SUPER_ADMIN' ? 'অ্যা' : 'ক্যা'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-[11px] font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[9px] text-slate-400">
                  {currentUser.role === 'SUPER_ADMIN' ? 'সুপার এডমিন (মালিক)' : 'ক্যাশিয়ার (স্টাফ)'}
                </div>
              </div>
              <button
                onClick={() =>
                  handleSwitchUserRole(currentUser.role === 'SUPER_ADMIN' ? 'CASHIER' : 'SUPER_ADMIN')
                }
                className="text-[10px] px-2 py-0.5 rounded font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs shrink-0"
                title="এডমিন ও ক্যাশিয়ারের ভূমিকা অদলবদল করুন"
              >
                {currentUser.role === 'SUPER_ADMIN' ? 'ক্যাশিয়ারে যান' : 'এডমিনে যান'}
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
              <span>১০০% অফলাইন সচল</span>
            </div>

            {/* Re-run Onboarding Test Button */}
            <button
              onClick={() => setIsSetupCompleted(false)}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg font-semibold transition-colors"
              title="প্রথমবার অনবোর্ডিং সেটআপ উইজার্ড পরীক্ষা করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>অনবোর্ডিং উইজার্ড</span>
            </button>

            {/* Logout button */}
            <button
              onClick={() => setIsLoggedIn(false)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="লগইন স্ক্রিনে যান (লগআউট)"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Settings button */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-lg transition-colors border ${
                activeTab === 'settings'
                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                  : 'text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
              title="সিস্টেম সেটিংস, এসএমএস ও ব্যাকআপ"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMobilePreviewMode(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              title="স্মার্টফোনে কাউন্টার চালান"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-600" />
              <span>মোবাইল ভিউ</span>
            </button>

            {activeTab !== 'pos' && (
              <button
                onClick={() => setActiveTab('pos')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>বিক্রয় (F1)</span>
              </button>
            )}
          </div>
        </header>

        {/* Global Toast for SMS Sending / System Notices */}
        {smsFeedbackToast && (
          <div className="fixed bottom-5 right-5 z-50 max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-4 flex items-start gap-3 animate-slide-in">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                smsFeedbackToast.isError ? 'text-rose-600' : 'text-emerald-600'
              }`}
            />
            <div className="text-xs text-slate-800 leading-relaxed font-semibold">
              {smsFeedbackToast.text}
            </div>
            <button
              onClick={() => setSmsFeedbackToast(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-auto"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'ড্যাশবোর্ড' },
              { id: 'pos', label: 'বিক্রয়' },
              { id: 'inventory', label: 'মজুদ' },
              { id: 'accounts', label: 'হিসাব' },
              { id: 'dgda', label: 'রেজিস্টার' },
              { id: 'lan_crdt', label: 'সিঙ্ক' },
              { id: 'settings', label: 'সেটিংস' },
              { id: 'docs', label: 'ডকুমেন্টস' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as NavTab);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === t.id ? 'bg-sky-50 text-sky-800 font-bold' : 'text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 pb-10">
          {activeTab === 'dashboard' && (
            <MainDashboard
              products={products}
              batches={batches}
              sales={sales}
              onNavigate={setActiveTab}
              pharmacyName={pharmacyProfile.pharmacy_name}
            />
          )}

          {activeTab === 'pos' && (
            <PosCashCounter
              products={products}
              batches={batches}
              onCompleteSale={handleCompleteSale}
              cart={cart}
              setCart={setCart}
              pharmacyProfile={pharmacyProfile}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManagement
              products={products}
              batches={batches}
              onAddBatch={handleAddBatch}
              onAddProduct={handleAddProduct}
              onToggleBatchRecall={handleToggleBatchRecall}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsReports
              sales={sales}
              products={products}
              batches={batches}
              expenses={expenses}
              supplierBills={supplierBills}
              customerDues={customerDues}
              cashierClosings={cashierClosings}
              onAddExpense={handleAddExpense}
              onUpdateSupplierBill={handleUpdateSupplierBill}
              onUpdateCustomerDue={handleUpdateCustomerDue}
              onSaveCashierClosing={handleSaveCashierClosing}
              onNavigateToPos={() => setActiveTab('pos')}
              currentUserRole={currentUser.role}
              onSendDueSms={handleSendDueSms}
            />
          )}

          {activeTab === 'dgda' && (
            <DgdaLogbook sales={sales} />
          )}

          {activeTab === 'lan_crdt' && (
            <LanServerDashboard onOpenMobileView={() => setIsMobilePreviewMode(true)} />
          )}

          {activeTab === 'settings' && (
            <SettingsManagement
              currentUser={currentUser}
              onSwitchUserRole={handleSwitchUserRole}
              users={users}
              onAddUser={handleAddUser}
              smsConfig={smsConfig}
              onUpdateSmsConfig={handleUpdateSmsConfig}
              smsLogs={smsLogs}
              onAddSmsLog={handleAddSmsLog}
              backupConfig={backupConfig}
              onUpdateBackupConfig={handleUpdateBackupConfig}
              backupHistory={backupHistory}
              onAddBackupSnapshot={handleAddBackupSnapshot}
              pharmacyProfile={pharmacyProfile}
              onUpdatePharmacyProfile={handleUpdatePharmacyProfile}
              dbProducts={products}
              dbBatches={batches}
              dbSales={sales}
              dbExpenses={expenses}
              dbSupplierBills={supplierBills}
              dbCustomerDues={customerDues}
              onRerunOnboarding={() => setIsSetupCompleted(false)}
            />
          )}

          {activeTab === 'docs' && (
            <ArchitectureDeliverables />
          )}
        </main>
      </div>
    </div>
  );
}
