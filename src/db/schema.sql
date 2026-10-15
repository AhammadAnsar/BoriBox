-- ==============================================================================
-- BoriBox: Highly Normalized Relational SQLite Database Schema
-- Designed for Offline-First Community & Model Pharmacies in Bangladesh
-- Compliant with DGDA (Directorate General of Drug Administration) Regulations
-- ==============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ------------------------------------------------------------------------------
-- 1. PRODUCTS (ওষুধের মূল তালিকা)
-- Stores product specifications, unit conversion multipliers, and DGDA flags.
-- Base unit is ALWAYS 'Piece' (পিস).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,                       -- UUID v4
    barcode_gtin TEXT UNIQUE,                  -- GS1 GTIN / EAN-13 Barcode
    brand_name TEXT NOT NULL,                  -- e.g., 'Seclo 20mg', 'Napa Extra'
    generic_name TEXT NOT NULL,                -- e.g., 'Omeprazole', 'Paracetamol'
    manufacturer TEXT NOT NULL,                -- e.g., 'Square Pharmaceuticals PLC'
    category TEXT NOT NULL,                    -- Therapeutic class (e.g. 'Anti-ulcerant')
    dosage_form TEXT NOT NULL,                 -- 'Tablet', 'Capsule', 'Syrup', 'Suspension'
    strength TEXT NOT NULL,                    -- '20 mg', '500 mg', '100 IU/ml'
    
    -- DGDA Compliance Fields
    dgda_dar_number TEXT NOT NULL,             -- DGDA Registration / DAR No (e.g. DAR-024-118)
    schedule TEXT NOT NULL DEFAULT 'OTC'       -- 'OTC', 'PRESCRIPTION_ONLY', 'ANTIBIOTIC', 'NARCOTIC'
        CHECK (schedule IN ('OTC', 'PRESCRIPTION_ONLY', 'ANTIBIOTIC', 'NARCOTIC')),
    is_antibiotic INTEGER NOT NULL DEFAULT 0   -- 1 = Antibiotic (Requires BMDC Doc & Patient record)
        CHECK (is_antibiotic IN (0, 1)),
    is_prescription_required INTEGER NOT NULL DEFAULT 0
        CHECK (is_prescription_required IN (0, 1)),
    storage_temp TEXT NOT NULL DEFAULT 'Below 30°C', -- 'Below 30°C' or '2°C - 8°C (Cold Chain)'
    
    -- Dynamic Multi-Level Unit Conversion Multipliers (Base Unit: Piece)
    base_unit_name TEXT NOT NULL DEFAULT 'Piece',    -- সর্বদাই 'Piece' (পিস)
    pieces_per_strip INTEGER NOT NULL DEFAULT 10     -- প্রতি পাতায় পিসের সংখ্যা
        CHECK (pieces_per_strip > 0),
    strips_per_box INTEGER NOT NULL DEFAULT 10       -- প্রতি বক্সে পাতার সংখ্যা
        CHECK (strips_per_box > 0),
    pieces_per_box INTEGER GENERATED ALWAYS AS (pieces_per_strip * strips_per_box) STORED,
    
    -- Pricing Structure per Packaging Level (in BDT ৳)
    cost_per_piece REAL NOT NULL CHECK (cost_per_piece >= 0),
    mrp_per_piece REAL NOT NULL CHECK (mrp_per_piece >= 0),
    mrp_per_strip REAL NOT NULL CHECK (mrp_per_strip >= 0),
    mrp_per_box REAL NOT NULL CHECK (mrp_per_box >= 0),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_name);
CREATE INDEX IF NOT EXISTS idx_products_generic ON products(generic_name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode_gtin);
CREATE INDEX IF NOT EXISTS idx_products_schedule ON products(schedule);

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS_FTS (SQLite FTS5 Trigram Substring Search)
-- Lightning-fast fuzzy medicine substring matching for rapid POS lookup.
-- ------------------------------------------------------------------------------
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    brand_name,
    generic_name,
    manufacturer,
    barcode_gtin,
    content='products',
    content_rowid='rowid',
    tokenize='trigram'
);

-- Triggers to synchronize FTS5 virtual table automatically
CREATE TRIGGER IF NOT EXISTS trg_products_ai AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(rowid, brand_name, generic_name, manufacturer, barcode_gtin)
    VALUES (new.rowid, new.brand_name, new.generic_name, new.manufacturer, new.barcode_gtin);
END;

CREATE TRIGGER IF NOT EXISTS trg_products_ad AFTER DELETE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, brand_name, generic_name, manufacturer, barcode_gtin)
    VALUES ('delete', old.rowid, old.brand_name, old.generic_name, old.manufacturer, old.barcode_gtin);
END;

CREATE TRIGGER IF NOT EXISTS trg_products_au AFTER UPDATE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, brand_name, generic_name, manufacturer, barcode_gtin)
    VALUES ('delete', old.rowid, old.brand_name, old.generic_name, old.manufacturer, old.barcode_gtin);
    INSERT INTO products_fts(rowid, brand_name, generic_name, manufacturer, barcode_gtin)
    VALUES (new.rowid, new.brand_name, new.generic_name, new.manufacturer, new.barcode_gtin);
END;

-- ------------------------------------------------------------------------------
-- 3. INVENTORY_BATCHES (ব্যাচ ও মেয়াদ ট্র্যাকিং - FEFO Engine)
-- Stores physical stock batches with strict FEFO index (expiry_date ASC).
-- Stock is tracked in base unit 'Piece' to prevent fractional rounding errors.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_batches (
    id TEXT PRIMARY KEY,                       -- UUID v4
    product_id TEXT NOT NULL,
    batch_number TEXT NOT NULL,                -- Manufacturer batch no (e.g. 'SEC-2401')
    expiry_date DATE NOT NULL,                 -- Critical for FEFO ordering (YYYY-MM-DD)
    rack_location TEXT NOT NULL DEFAULT 'A-01',-- Physical shelf / rack / cold chain fridge
    available_pieces INTEGER NOT NULL          -- Total pieces currently available in this batch
        CHECK (available_pieces >= 0),
    cost_per_piece REAL NOT NULL CHECK (cost_per_piece >= 0),
    supplier_invoice_no TEXT,                  -- Distributor challan / invoice reference
    is_recalled INTEGER NOT NULL DEFAULT 0     -- DGDA safety recall flag (0 = Good, 1 = Recalled)
        CHECK (is_recalled IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Compound index optimized for FEFO queries: (product_id, expiry_date ASC)
CREATE INDEX IF NOT EXISTS idx_fefo_expiry ON inventory_batches(product_id, expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_batches_expiry_alert ON inventory_batches(expiry_date ASC);

-- ------------------------------------------------------------------------------
-- 4. SALES (ক্যাশ কাউন্টার ইনভয়েস ও ডিজিডিএ রেজিস্টার)
-- Stores transaction headers and mandatory DGDA patient & doctor audit data.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,                       -- UUID v4
    invoice_number TEXT UNIQUE NOT NULL,       -- e.g. 'INV-202610041'
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cashier_id TEXT NOT NULL DEFAULT 'CASHIER-1',
    payment_method TEXT NOT NULL DEFAULT 'CASH'
        CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'CARD')),
    
    -- Financial Totals (BDT ৳)
    subtotal REAL NOT NULL CHECK (subtotal >= 0),
    discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    net_payable REAL NOT NULL CHECK (net_payable >= 0),
    paid_amount REAL NOT NULL CHECK (paid_amount >= 0),
    change_returned REAL NOT NULL DEFAULT 0 CHECK (change_returned >= 0),
    
    -- DGDA Compliance Data (Mandatory for Antibiotics / Prescription-Only)
    has_antibiotic INTEGER NOT NULL DEFAULT 0 CHECK (has_antibiotic IN (0, 1)),
    patient_name TEXT,                         -- রোগীর নাম
    patient_phone TEXT,                        -- রোগীর মোবাইল নম্বর
    patient_age INTEGER,                       -- রোগীর বয়স
    patient_gender TEXT CHECK (patient_gender IN ('Male', 'Female', 'Other')),
    doctor_name TEXT,                          -- প্রেসক্রিপশন প্রদানকারী চিকিৎসকের নাম
    doctor_bmdc_reg TEXT,                      -- বাংলাদেশ মেডিকেল ও ডেন্টাল কাউন্সিল (BMDC) রেজি নং
    hospital_clinic TEXT,                      -- হাসপাতাল বা ক্লিনিক
    prescription_date DATE,
    indication TEXT,                           -- রোগের কারণ বা ডায়াগনোসিস
    
    -- CRDT Offline Sync Meta
    hlc_timestamp TEXT NOT NULL,               -- Hybrid Logical Clock (e.g. '1a7bc8-0-DESKTOP_MAIN')
    node_id TEXT NOT NULL                      -- 'DESKTOP_MAIN' or 'LAN_MOBILE_01'
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sales_antibiotic ON sales(has_antibiotic);
CREATE INDEX IF NOT EXISTS idx_sales_bmdc ON sales(doctor_bmdc_reg);

-- ------------------------------------------------------------------------------
-- 5. SALE_ITEMS (ইনভয়েসের ওষুধ ও বিক্রয় একক)
-- Supports dynamic units (Box, Strip, Piece) seamlessly mapped to base pieces.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,                       -- UUID v4
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    
    -- Packaging Unit Selected at Checkout
    selected_unit TEXT NOT NULL CHECK (selected_unit IN ('box', 'strip', 'piece')),
    quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
    
    -- Normalized Base Unit Calculation
    -- Example: 2 boxes of 100-piece drug = 200 pieces deducted
    quantity_pieces INTEGER NOT NULL CHECK (quantity_pieces > 0),
    
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    total_price REAL NOT NULL CHECK (total_price >= 0),
    discount_percent REAL NOT NULL DEFAULT 0 CHECK (discount_percent >= 0),
    final_price REAL NOT NULL CHECK (final_price >= 0),
    
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- ------------------------------------------------------------------------------
-- 6. SALE_ITEM_BATCH_ALLOCATIONS (FEFO ব্যাচ অডিট ট্রেইল)
-- Highly normalized junction table linking each sold item to exact batch deduction.
-- If a sale of 15 pieces drains 10 pieces from Batch-A and 5 pieces from Batch-B,
-- this table records both allocations precisely for 100% DGDA regulatory traceability.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_item_batch_allocations (
    id TEXT PRIMARY KEY,
    sale_item_id TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    pieces_deducted INTEGER NOT NULL CHECK (pieces_deducted > 0),
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES inventory_batches(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_allocations_item ON sale_item_batch_allocations(sale_item_id);
CREATE INDEX IF NOT EXISTS idx_allocations_batch ON sale_item_batch_allocations(batch_id);

-- ------------------------------------------------------------------------------
-- 7. CRDT_DELTA_LOG (অফলাইন পিয়ার-টু-পিয়ার রেপ্লিকেশন লগ)
-- Stores atomic delta mutations for multi-counter LAN synchronization.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crdt_delta_log (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    hlc_timestamp TEXT NOT NULL,
    node_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    synced_to_cloud INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_crdt_hlc ON crdt_delta_log(hlc_timestamp ASC);
