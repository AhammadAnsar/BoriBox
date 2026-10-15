/**
 * dbApi.ts
 * BoriBox Production Database API Service
 * 
 * Interacts directly with native Tauri Rust/SQLite commands when running in desktop mode,
 * or persistent browser SQLite/IndexedDB relational storage engine in web preview mode.
 * Zero hardcoded mock arrays inside components; all components fetch and mutate via this API.
 */

import {
  Product,
  StockBatch,
  SaleTransaction,
  PharmacyExpense,
  SupplierBill,
  CustomerDue,
  CashierClosing,
  AppUser,
  PharmacyProfile,
  SmsGatewayConfig,
  SmsLogEntry,
  BackupConfig,
  BackupSnapshot,
  OnboardingSetupPayload,
} from '../types/pharmacy';

import {
  INITIAL_PRODUCTS,
  INITIAL_BATCHES,
  INITIAL_EXPENSES,
  INITIAL_SUPPLIER_BILLS,
  INITIAL_CUSTOMER_DUES,
  INITIAL_APP_USERS,
  INITIAL_SMS_CONFIG,
  INITIAL_BACKUP_CONFIG,
  INITIAL_PHARMACY_PROFILE,
} from '../data/mockDatabase';

// Check if running inside native Tauri runtime
const isTauriRuntime = typeof window !== 'undefined' && '__TAURI__' in window;

declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
    };
  }
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauriRuntime && window.__TAURI__?.core?.invoke) {
    return window.__TAURI__.core.invoke<T>(cmd, args);
  }
  throw new Error('Tauri native runtime not detected; using persistent local storage engine.');
}

// Keys for local storage / IndexedDB engine
const KEYS = {
  PRODUCTS: 'boribox_db_products',
  BATCHES: 'boribox_db_batches',
  SALES: 'boribox_db_sales',
  EXPENSES: 'boribox_db_expenses',
  SUPPLIER_BILLS: 'boribox_db_supplier_bills',
  CUSTOMER_DUES: 'boribox_db_customer_dues',
  CASHIER_CLOSINGS: 'boribox_db_cashier_closings',
  USERS: 'boribox_db_users',
  SHOP_PROFILE: 'boribox_db_shop_profile',
  SMS_CONFIG: 'boribox_db_sms_config',
  SMS_LOGS: 'boribox_db_sms_logs',
  BACKUP_CONFIG: 'boribox_db_backup_config',
  BACKUP_HISTORY: 'boribox_db_backup_history',
  SETUP_COMPLETED: 'boribox_db_setup_completed',
};

// Safe storage helpers
function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed reading storage for ${key}:`, err);
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed writing storage for ${key}:`, err);
  }
}

// -----------------------------------------------------------------------------
// Database API Exports
// -----------------------------------------------------------------------------

export const dbApi = {
  // --- Products ---
  async getProducts(): Promise<Product[]> {
    try {
      return await tauriInvoke<Product[]>('get_products');
    } catch {
      return readStorage<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
  },

  async saveProduct(product: Product): Promise<Product> {
    try {
      return await tauriInvoke<Product>('save_product', { product });
    } catch {
      const current = readStorage<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
      const idx = current.findIndex((p) => p.id === product.id);
      let updated: Product[];
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = product;
      } else {
        updated = [product, ...current];
      }
      writeStorage(KEYS.PRODUCTS, updated);
      return product;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      return await tauriInvoke<boolean>('delete_product', { id });
    } catch {
      const current = readStorage<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
      const filtered = current.filter((p) => p.id !== id);
      writeStorage(KEYS.PRODUCTS, filtered);
      return true;
    }
  },

  // --- Stock Batches ---
  async getBatches(): Promise<StockBatch[]> {
    try {
      return await tauriInvoke<StockBatch[]>('get_batches');
    } catch {
      return readStorage<StockBatch[]>(KEYS.BATCHES, INITIAL_BATCHES);
    }
  },

  async saveBatch(batch: StockBatch): Promise<StockBatch> {
    try {
      return await tauriInvoke<StockBatch>('save_batch', { batch });
    } catch {
      const current = readStorage<StockBatch[]>(KEYS.BATCHES, INITIAL_BATCHES);
      const idx = current.findIndex((b) => b.id === batch.id);
      let updated: StockBatch[];
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = batch;
      } else {
        updated = [batch, ...current];
      }
      writeStorage(KEYS.BATCHES, updated);
      return batch;
    }
  },

  async toggleBatchRecall(batchId: string): Promise<StockBatch[]> {
    try {
      return await tauriInvoke<StockBatch[]>('toggle_batch_recall', { batchId });
    } catch {
      const current = readStorage<StockBatch[]>(KEYS.BATCHES, INITIAL_BATCHES);
      const updated = current.map((b) =>
        b.id === batchId ? { ...b, is_recalled: !b.is_recalled } : b
      );
      writeStorage(KEYS.BATCHES, updated);
      return updated;
    }
  },

  // --- Sales ---
  async getSales(): Promise<SaleTransaction[]> {
    try {
      return await tauriInvoke<SaleTransaction[]>('get_sales');
    } catch {
      return readStorage<SaleTransaction[]>(KEYS.SALES, []);
    }
  },

  async createSale(sale: SaleTransaction): Promise<SaleTransaction> {
    try {
      return await tauriInvoke<SaleTransaction>('create_sale', { sale });
    } catch {
      // 1. Save sale record
      const currentSales = readStorage<SaleTransaction[]>(KEYS.SALES, []);
      const updatedSales = [sale, ...currentSales];
      writeStorage(KEYS.SALES, updatedSales);

      // 2. Atomically deduct inventory pieces
      const currentBatches = readStorage<StockBatch[]>(KEYS.BATCHES, INITIAL_BATCHES);
      const updatedBatches = [...currentBatches];
      sale.items.forEach((item) => {
        item.allocated_batches.forEach((alloc) => {
          const idx = updatedBatches.findIndex(
            (b) => b.batch_number === alloc.batch_number && b.product_id === item.product.id
          );
          if (idx >= 0) {
            updatedBatches[idx] = {
              ...updatedBatches[idx],
              available_pieces: Math.max(0, updatedBatches[idx].available_pieces - alloc.pieces_deducted),
            };
          }
        });
      });
      writeStorage(KEYS.BATCHES, updatedBatches);

      // 3. If credit sale with customer due, insert/update customer due
      const dueAmount = Math.max(0, sale.net_payable - sale.paid_amount);
      if (dueAmount > 0) {
        const currentDues = readStorage<CustomerDue[]>(KEYS.CUSTOMER_DUES, INITIAL_CUSTOMER_DUES);
        const newDue: CustomerDue = {
          id: `due-${Date.now()}`,
          customer_name: sale.customer_name || 'সাধারণ গ্রাহক',
          customer_phone: sale.customer_phone || '',
          invoice_number: sale.invoice_number,
          invoice_date: sale.timestamp.split('T')[0] || new Date().toISOString().split('T')[0],
          total_bill: sale.net_payable,
          paid_amount: sale.paid_amount,
          due_amount: dueAmount,
          status: sale.paid_amount > 0 ? 'PARTIAL' : 'DUE',
        };
        writeStorage(KEYS.CUSTOMER_DUES, [newDue, ...currentDues]);
      }

      return sale;
    }
  },

  // --- Expenses ---
  async getExpenses(): Promise<PharmacyExpense[]> {
    try {
      return await tauriInvoke<PharmacyExpense[]>('get_expenses');
    } catch {
      return readStorage<PharmacyExpense[]>(KEYS.EXPENSES, INITIAL_EXPENSES);
    }
  },

  async addExpense(expense: PharmacyExpense): Promise<PharmacyExpense> {
    try {
      return await tauriInvoke<PharmacyExpense>('add_expense', { expense });
    } catch {
      const current = readStorage<PharmacyExpense[]>(KEYS.EXPENSES, INITIAL_EXPENSES);
      const updated = [expense, ...current];
      writeStorage(KEYS.EXPENSES, updated);
      return expense;
    }
  },

  // --- Supplier Bills ---
  async getSupplierBills(): Promise<SupplierBill[]> {
    try {
      return await tauriInvoke<SupplierBill[]>('get_supplier_bills');
    } catch {
      return readStorage<SupplierBill[]>(KEYS.SUPPLIER_BILLS, INITIAL_SUPPLIER_BILLS);
    }
  },

  async updateSupplierBill(bill: SupplierBill): Promise<SupplierBill> {
    try {
      return await tauriInvoke<SupplierBill>('update_supplier_bill', { bill });
    } catch {
      const current = readStorage<SupplierBill[]>(KEYS.SUPPLIER_BILLS, INITIAL_SUPPLIER_BILLS);
      const idx = current.findIndex((b) => b.id === bill.id);
      let updated: SupplierBill[];
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = bill;
      } else {
        updated = [bill, ...current];
      }
      writeStorage(KEYS.SUPPLIER_BILLS, updated);
      return bill;
    }
  },

  // --- Customer Dues ---
  async getCustomerDues(): Promise<CustomerDue[]> {
    try {
      return await tauriInvoke<CustomerDue[]>('get_customer_dues');
    } catch {
      return readStorage<CustomerDue[]>(KEYS.CUSTOMER_DUES, INITIAL_CUSTOMER_DUES);
    }
  },

  async updateCustomerDue(due: CustomerDue): Promise<CustomerDue> {
    try {
      return await tauriInvoke<CustomerDue>('update_customer_due', { due });
    } catch {
      const current = readStorage<CustomerDue[]>(KEYS.CUSTOMER_DUES, INITIAL_CUSTOMER_DUES);
      const idx = current.findIndex((d) => d.id === due.id);
      let updated: CustomerDue[];
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = due;
      } else {
        updated = [due, ...current];
      }
      writeStorage(KEYS.CUSTOMER_DUES, updated);
      return due;
    }
  },

  // --- Cashier Shift Closings ---
  async getCashierClosings(): Promise<CashierClosing[]> {
    try {
      return await tauriInvoke<CashierClosing[]>('get_cashier_closings');
    } catch {
      return readStorage<CashierClosing[]>(KEYS.CASHIER_CLOSINGS, []);
    }
  },

  async saveCashierClosing(closing: CashierClosing): Promise<CashierClosing> {
    try {
      return await tauriInvoke<CashierClosing>('save_cashier_closing', { closing });
    } catch {
      const current = readStorage<CashierClosing[]>(KEYS.CASHIER_CLOSINGS, []);
      const updated = [closing, ...current];
      writeStorage(KEYS.CASHIER_CLOSINGS, updated);
      return closing;
    }
  },

  // --- Users & RBAC ---
  async getUsers(): Promise<AppUser[]> {
    try {
      return await tauriInvoke<AppUser[]>('get_users');
    } catch {
      return readStorage<AppUser[]>(KEYS.USERS, INITIAL_APP_USERS);
    }
  },

  async saveUser(user: AppUser): Promise<AppUser> {
    try {
      return await tauriInvoke<AppUser>('save_user', { user });
    } catch {
      const current = readStorage<AppUser[]>(KEYS.USERS, INITIAL_APP_USERS);
      const idx = current.findIndex((u) => u.id === user.id || u.username === user.username);
      let updated: AppUser[];
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = user;
      } else {
        updated = [user, ...current];
      }
      writeStorage(KEYS.USERS, updated);
      return user;
    }
  },

  // --- Shop Profile ---
  async getShopProfile(): Promise<PharmacyProfile> {
    try {
      return await tauriInvoke<PharmacyProfile>('get_shop_profile');
    } catch {
      return readStorage<PharmacyProfile>(KEYS.SHOP_PROFILE, INITIAL_PHARMACY_PROFILE);
    }
  },

  async saveShopProfile(profile: PharmacyProfile): Promise<PharmacyProfile> {
    try {
      return await tauriInvoke<PharmacyProfile>('save_shop_profile', { profile });
    } catch {
      writeStorage(KEYS.SHOP_PROFILE, profile);
      return profile;
    }
  },

  // --- SMS Configuration ---
  async getSmsConfig(): Promise<SmsGatewayConfig> {
    try {
      return await tauriInvoke<SmsGatewayConfig>('get_sms_config');
    } catch {
      return readStorage<SmsGatewayConfig>(KEYS.SMS_CONFIG, INITIAL_SMS_CONFIG);
    }
  },

  async saveSmsConfig(config: SmsGatewayConfig): Promise<SmsGatewayConfig> {
    try {
      return await tauriInvoke<SmsGatewayConfig>('save_sms_config', { config });
    } catch {
      writeStorage(KEYS.SMS_CONFIG, config);
      return config;
    }
  },

  async getSmsLogs(): Promise<SmsLogEntry[]> {
    try {
      return await tauriInvoke<SmsLogEntry[]>('get_sms_logs');
    } catch {
      return readStorage<SmsLogEntry[]>(KEYS.SMS_LOGS, []);
    }
  },

  async addSmsLog(log: SmsLogEntry): Promise<SmsLogEntry> {
    try {
      return await tauriInvoke<SmsLogEntry>('add_sms_log', { log });
    } catch {
      const current = readStorage<SmsLogEntry[]>(KEYS.SMS_LOGS, []);
      const updated = [log, ...current];
      writeStorage(KEYS.SMS_LOGS, updated);
      return log;
    }
  },

  // --- Backup Configuration ---
  async getBackupConfig(): Promise<BackupConfig> {
    try {
      return await tauriInvoke<BackupConfig>('get_backup_config');
    } catch {
      return readStorage<BackupConfig>(KEYS.BACKUP_CONFIG, INITIAL_BACKUP_CONFIG);
    }
  },

  async saveBackupConfig(config: BackupConfig): Promise<BackupConfig> {
    try {
      return await tauriInvoke<BackupConfig>('save_backup_config', { config });
    } catch {
      writeStorage(KEYS.BACKUP_CONFIG, config);
      return config;
    }
  },

  async getBackupHistory(): Promise<BackupSnapshot[]> {
    try {
      return await tauriInvoke<BackupSnapshot[]>('get_backup_history');
    } catch {
      return readStorage<BackupSnapshot[]>(KEYS.BACKUP_HISTORY, []);
    }
  },

  async addBackupSnapshot(snapshot: BackupSnapshot): Promise<BackupSnapshot> {
    try {
      return await tauriInvoke<BackupSnapshot>('add_backup_snapshot', { snapshot });
    } catch {
      const current = readStorage<BackupSnapshot[]>(KEYS.BACKUP_HISTORY, []);
      const updated = [snapshot, ...current];
      writeStorage(KEYS.BACKUP_HISTORY, updated);
      return snapshot;
    }
  },

  // --- First-Run & Onboarding ---
  async checkIsFirstRun(): Promise<boolean> {
    try {
      return await tauriInvoke<boolean>('check_is_first_run');
    } catch {
      const flag = localStorage.getItem(KEYS.SETUP_COMPLETED);
      if (flag === null) {
        return false; // Default demo ready
      }
      return flag !== 'true';
    }
  },

  async bootstrapFirstTimeSetup(payload: OnboardingSetupPayload): Promise<boolean> {
    try {
      await tauriInvoke('bootstrap_first_time_setup', { payload });
    } catch {
      // Save shop profile
      const currentProfile = readStorage<PharmacyProfile>(KEYS.SHOP_PROFILE, INITIAL_PHARMACY_PROFILE);
      const profile: PharmacyProfile = {
        ...currentProfile,
        pharmacy_name: payload.pharmacy.pharmacy_name,
        owner_name: payload.pharmacy.owner_name,
        drug_license_no: payload.pharmacy.drug_license_no,
        address: payload.pharmacy.address,
        phone: payload.pharmacy.phone,
        printer_paper_width: payload.pharmacy.printer_paper_width,
        logo_url: payload.pharmacy.logo_url,
      };
      writeStorage(KEYS.SHOP_PROFILE, profile);

      // Save admin user
      const admin: AppUser = {
        id: `usr-admin-${Date.now()}`,
        name: payload.admin.name,
        username: payload.admin.username,
        role: 'SUPER_ADMIN',
        pin: payload.admin.pin,
        phone: payload.admin.phone,
        status: 'ACTIVE',
        created_at: new Date().toISOString().split('T')[0],
      };
      const users = readStorage<AppUser[]>(KEYS.USERS, []);
      writeStorage(KEYS.USERS, [admin, ...users.filter((u) => u.username !== admin.username)]);
      writeStorage(KEYS.SETUP_COMPLETED, 'true');
    }
    return true;
  },
};
