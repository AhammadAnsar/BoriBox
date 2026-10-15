/**
 * Data types and interfaces for BoriBox Pharmacy Management POS
 */

export type UnitType = 'box' | 'strip' | 'piece';

export type DrugSchedule = 'OTC' | 'PRESCRIPTION_ONLY' | 'ANTIBIOTIC' | 'NARCOTIC';

export interface Product {
  id: string;
  barcode_gtin: string;
  brand_name: string;        // e.g. "Seclo 20mg"
  generic_name: string;      // e.g. "Omeprazole"
  manufacturer: string;      // e.g. "Square Pharmaceuticals PLC"
  category: string;          // e.g. "Anti-ulcerant"
  dosage_form: string;       // "Capsule" | "Tablet" | "Syrup" | "Injection"
  strength: string;          // e.g. "20 mg"
  dgda_dar_number: string;   // e.g. "DAR-024-118"
  schedule: DrugSchedule;    // Bangladesh DGDA schedule
  is_antibiotic: boolean;
  is_prescription_required: boolean;
  storage_temp: string;      // "Below 30°C" | "2°C - 8°C"
  
  // Dynamic multi-level unit definitions
  base_unit_name: string;    // Always "Piece" (পিস)
  pieces_per_strip: number;  // e.g. 10 pieces per strip (পাতা)
  strips_per_box: number;    // e.g. 10 strips per box (বক্স)
  pieces_per_box: number;    // auto-calculated: pieces_per_strip * strips_per_box
  
  // Pricing per unit
  mrp_per_piece: number;     // e.g. 7.00 BDT
  mrp_per_strip: number;     // e.g. 70.00 BDT
  mrp_per_box: number;       // e.g. 700.00 BDT
  cost_per_piece: number;    // e.g. 5.95 BDT
}

export interface StockBatch {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date: string;       // YYYY-MM-DD
  rack_location: string;     // e.g. "A-04", "Fridge-1"
  available_pieces: number;  // Total pieces available in this batch
  cost_per_piece: number;
  created_at: string;
  supplier_invoice_no?: string;
  is_recalled?: boolean;
}

export interface CartItem {
  id: string;                // unique cart row id
  product: Product;
  selected_unit: UnitType;   // 'box' | 'strip' | 'piece'
  quantity: number;          // quantity in selected_unit
  total_pieces: number;      // auto-calculated quantity * unit multiplier
  unit_price: number;        // price of the selected unit
  total_price: number;       // quantity * unit_price
  discount_percent: number;  // e.g. 0% or 5%
  final_price: number;
  allocated_batches: {
    batch_number: string;
    expiry_date: string;
    pieces_deducted: number;
    rack_location: string;
  }[];
}

export interface PrescriptionDetails {
  patient_name?: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: 'Male' | 'Female' | 'Other';
  doctor_name?: string;
  doctor_bmdc_reg?: string;   // BMDC Registration Number (optional in rush)
  hospital_clinic?: string;
  prescription_date?: string;
  indication?: string;
}

export interface SaleTransaction {
  id: string;
  invoice_number: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  net_payable: number;
  paid_amount: number;
  change_returned: number;
  payment_method: 'CASH' | 'BKASH' | 'NAGAD' | 'CARD';
  customer_name?: string;
  customer_phone?: string;
  has_antibiotic: boolean;
  prescription?: PrescriptionDetails;
  cashier_name: string;
  crdt_hlc: string;          // Hybrid Logical Clock timestamp
}

export interface CRDTLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  hlc_timestamp: string;
  node_id: string;           // "DESKTOP_MAIN" | "LAN_MOBILE_01"
  payload: Record<string, unknown>;
  synced: boolean;
}

export type ExpenseCategory =
  | 'RENT'
  | 'ELECTRICITY'
  | 'SALARY'
  | 'TEA_SNACKS'
  | 'TRANSPORT'
  | 'SUPPLIER_PAYMENT'
  | 'MAINTENANCE'
  | 'OTHER';

export interface PharmacyExpense {
  id: string;
  date: string;              // YYYY-MM-DD
  category: ExpenseCategory;
  title: string;
  amount: number;
  payment_method: 'CASH' | 'BKASH' | 'NAGAD' | 'BANK';
  is_paid_from_drawer: boolean; // deducted from daily cash drawer
  note?: string;
  recorded_by: string;
}

export interface SupplierBill {
  id: string;
  supplier_name: string;
  company: string;
  invoice_no: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: 'PAID' | 'PARTIAL' | 'DUE';
  last_payment_date?: string;
}

export interface CustomerDue {
  id: string;
  customer_name: string;
  customer_phone: string;
  invoice_number: string;
  invoice_date: string;
  total_bill: number;
  paid_amount: number;
  due_amount: number;
  status: 'DUE' | 'PARTIAL' | 'CLEARED';
  last_payment_date?: string;
  notes?: string;
}

export interface CashierClosing {
  id: string;
  date: string;              // YYYY-MM-DD
  shift_name: string;        // e.g. "মর্নিং শিফট" | "ইভনিং শিফট" | "সারাদিন"
  cashier_name: string;
  opening_cash: number;
  cash_sales: number;
  digital_sales: number;     // bKash + Nagad
  card_sales: number;
  total_sales: number;
  total_discounts: number;
  drawer_expenses: number;
  expected_cash: number;     // opening_cash + cash_sales - drawer_expenses
  actual_cash: number;       // counted cash in drawer
  variance: number;          // actual_cash - expected_cash (0 = balanced, - = shortage, + = excess)
  status: 'OPEN' | 'CLOSED';
  closed_at?: string;
  notes?: string;
}

// -----------------------------------------------------------------------------
// Step 10: RBAC, SMS Gateway, & Google Drive Auto-Backup Interfaces
// -----------------------------------------------------------------------------

export type UserRole = 'SUPER_ADMIN' | 'CASHIER';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  phone?: string;
  pin?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export type SmsProvider = 'GREENWEB' | 'GOTISMS' | 'SSL_WIRELESS' | 'CUSTOM';

export interface SmsGatewayConfig {
  provider: SmsProvider;
  api_token: string;
  sender_id: string;
  endpoint_url?: string;
  balance: number;
  is_enabled: boolean;
  due_reminder_template: string;
  low_stock_alert_template: string;
  sale_receipt_sms: boolean;
}

export interface SmsLogEntry {
  id: string;
  recipient_phone: string;
  recipient_name: string;
  message: string;
  provider: SmsProvider;
  status: 'SENT' | 'FAILED' | 'PENDING';
  sent_at: string;
  response_code?: string;
}

export interface BackupConfig {
  is_google_connected: boolean;
  google_account_email?: string;
  auto_backup_frequency: 'DAILY' | 'AFTER_SHIFT' | 'MANUAL';
  last_backup_time?: string;
  encryption_enabled: boolean;
  encryption_algorithm: 'AES-256-GCM';
  drive_folder_name: string;
}

export interface BackupSnapshot {
  id: string;
  filename: string;
  size_kb: number;
  created_at: string;
  storage_type: 'LOCAL' | 'GOOGLE_DRIVE';
  is_encrypted: boolean;
  status: 'SUCCESS' | 'IN_PROGRESS' | 'FAILED';
  drive_file_id?: string;
}

export interface PharmacyProfile {
  pharmacy_name: string;
  owner_name: string;
  drug_license_no: string;
  trade_license_no: string;
  address: string;
  phone: string;
  email: string;
  vat_percentage: number;
  default_discount: number;
  printer_paper_width: '58mm' | '80mm';
  logo_url?: string;
}

export interface OnboardingSetupPayload {
  pharmacy: {
    pharmacy_name: string;
    owner_name: string;
    drug_license_no: string;
    address: string;
    phone: string;
    printer_paper_width: '58mm' | '80mm';
    logo_url?: string;
  };
  admin: {
    name: string;
    username: string;
    password: string;
    pin: string;
    phone: string;
  };
}


