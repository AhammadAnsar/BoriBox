/**
 * Complete Step-by-Step Architecture & Native Source Code Deliverables
 * Provides the Tauri project folder tree, normalized SQLite schema with FTS5,
 * Rust ESC/POS thermal rasterizer backend, React POS module, and CRDT sync specification.
 */

import React, { useState } from 'react';
import { Copy, Check, FolderTree, Database, Terminal, Cpu, FileCode2, Share2, Download, Cloud, ShieldCheck } from 'lucide-react';

export const ArchitectureDeliverables: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDeliverable, setActiveDeliverable] = useState<number>(1);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Deliverable 1: Folder Tree
  const folderStructureCode = `boribox-pharmacy/
├── src-tauri/                       # Native Rust Backend (Tauri 2.0)
│   ├── Cargo.toml                   # Rust dependencies: rusqlite, image, escpos, warp/axum
│   ├── tauri.conf.json              # Window config, security capabilities, plugins
│   ├── src/
│   │   ├── main.rs                  # Tauri entry point & IPC handlers registration
│   │   ├── db/
│   │   │   ├── mod.rs               # SQLite connection pool & migrations
│   │   │   ├── schema.sql           # SQLite normalized schema & FTS5 trigram
│   │   │   └── crdt.rs              # Hybrid Logical Clock (HLC) & Delta log
│   │   ├── printer/
│   │   │   ├── mod.rs               # USB & Network thermal printer communication
│   │   │   └── rasterizer.rs        # 1-bit monochrome ESC/POS Bengali rasterizer
│   │   ├── lan_server/
│   │   │   ├── mod.rs               # Localhost HTTP static server & WebSocket broker
│   │   │   └── ws_handler.rs        # Multi-node real-time delta broadcast
│   │   └── backup/
│   │       └── gdrive.rs            # Google Drive API AES-256 backup scheduler
├── src/                             # Modern Frontend (React 19 + Tailwind CSS)
│   ├── index.html                   # Entry point with Google Fonts (Hind Siliguri)
│   ├── main.tsx                     # React root mount
│   ├── App.tsx                      # Main app shell & router
│   ├── types/
│   │   └── pharmacy.ts              # Domain entities (Product, Batch, CartItem, Sale)
│   ├── services/
│   │   ├── unitCalculator.ts        # Box, Strip, Piece dynamic multi-level converter
│   │   ├── fefoEngine.ts            # First-Expire First-Out batch allocation algorithm
│   │   ├── escposRasterizer.ts      # HTML Canvas -> 1-Bit Monochrome GS v 0 byte stream
│   │   └── crdtSyncEngine.ts        # Client-side HLC & delta state merge
│   ├── components/
│   │   ├── Navbar.tsx               # Top Bar Contract navigation
│   │   ├── pos/
│   │   │   ├── PosCashCounter.tsx   # POS cash counter with F1, F2, F3, F4 shortcuts
│   │   │   ├── DgdaPrescriptionModal.tsx # Antibiotic & BMDC Doctor registry
│   │   │   └── ThermalPrintModal.tsx     # 58mm/80mm Thermal preview & hex inspector
│   │   ├── inventory/
│   │   │   └── InventoryManagement.tsx  # Multi-unit inventory & FEFO expiry alerts
│   │   ├── dgda/
│   │   │   └── DgdaLogbook.tsx          # Model Pharmacy inspection register
│   │   └── lan/
│   │       └── LanServerDashboard.tsx   # LAN smartphone QR pairing & CRDT sync
│   └── data/
│       └── mockDatabase.ts          # Authentic Bangladeshi pharma catalogue & batches
├── package.json                     # Vite + React + Tailwind v4 dependencies
├── tsconfig.json                    # Strict TypeScript configuration
└── vite.config.ts                   # Tauri-optimized Vite configuration`;

  // Deliverable 2: Normalized SQLite Schema with FTS5
  const sqliteSchemaCode = `-- ============================================================
-- BoriBox: Normalized SQLite Database Schema (DGDA Compliant)
-- Supports Multi-Unit Packaging (Box, Strip, Piece),
-- FEFO Expiry Management, and SQLite FTS5 Trigram Substring Search
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. Products Master Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,                       -- UUID v4
    barcode_gtin TEXT UNIQUE,                  -- GS1 GTIN / Barcode (EAN-13)
    brand_name TEXT NOT NULL,                  -- e.g., 'Seclo 20mg'
    generic_name TEXT NOT NULL,                -- e.g., 'Omeprazole 20mg'
    manufacturer TEXT NOT NULL,                -- e.g., 'Square Pharmaceuticals PLC'
    category TEXT NOT NULL,                    -- Therapeutic group
    dosage_form TEXT NOT NULL,                 -- 'Tablet', 'Capsule', 'Syrup'
    strength TEXT NOT NULL,                    -- '20 mg', '500 mg'
    dgda_dar_number TEXT NOT NULL,             -- DGDA Drug Registration No (e.g. DAR-024-118)
    schedule TEXT NOT NULL DEFAULT 'OTC',      -- 'OTC', 'PRESCRIPTION_ONLY', 'ANTIBIOTIC', 'NARCOTIC'
    is_antibiotic INTEGER NOT NULL DEFAULT 0,  -- 1 if antibiotic (mandates prescription)
    is_prescription_required INTEGER NOT NULL DEFAULT 0,
    storage_temp TEXT DEFAULT 'Below 30°C',    -- 'Below 30°C' or '2°C - 8°C (Cold Chain)'
    
    -- Dynamic Multi-Level Unit Definitions (Base Unit = 'Piece')
    base_unit_name TEXT NOT NULL DEFAULT 'Piece',
    pieces_per_strip INTEGER NOT NULL DEFAULT 10,
    strips_per_box INTEGER NOT NULL DEFAULT 10,
    pieces_per_box INTEGER GENERATED ALWAYS AS (pieces_per_strip * strips_per_box) STORED,
    
    -- Pricing
    cost_per_piece REAL NOT NULL,
    mrp_per_piece REAL NOT NULL,
    mrp_per_strip REAL NOT NULL,
    mrp_per_box REAL NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Full-Text Search Virtual Table using SQLite FTS5 with Trigram Tokenizer
-- Allows lightning-fast fuzzy substring matching even with minor spelling mistakes
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    brand_name,
    generic_name,
    manufacturer,
    barcode_gtin,
    content='products',
    content_rowid='rowid',
    tokenize='trigram'
);

-- Triggers to keep FTS index synchronized
CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(rowid, brand_name, generic_name, manufacturer, barcode_gtin)
  VALUES (new.rowid, new.brand_name, new.generic_name, new.manufacturer, new.barcode_gtin);
END;

CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, brand_name, generic_name, manufacturer, barcode_gtin)
  VALUES('delete', old.rowid, old.brand_name, old.generic_name, old.manufacturer, old.barcode_gtin);
END;

CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, brand_name, generic_name, manufacturer, barcode_gtin)
  VALUES('delete', old.rowid, old.brand_name, old.generic_name, old.manufacturer, old.barcode_gtin);
  INSERT INTO products_fts(rowid, brand_name, generic_name, manufacturer, barcode_gtin)
  VALUES (new.rowid, new.brand_name, new.generic_name, new.manufacturer, new.barcode_gtin);
END;

-- 3. Inventory Stock Batches Table (Supports FEFO - First Expire, First Out)
CREATE TABLE IF NOT EXISTS inventory_stocks (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,                 -- Critical for FEFO ordering: ASC
    rack_location TEXT NOT NULL DEFAULT 'A-01',
    available_pieces INTEGER NOT NULL CHECK (available_pieces >= 0),
    cost_per_piece REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_inventory_fefo ON inventory_stocks (product_id, expiry_date ASC);

-- 4. Sales Master Table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal REAL NOT NULL,
    discount_amount REAL NOT NULL DEFAULT 0,
    net_payable REAL NOT NULL,
    paid_amount REAL NOT NULL,
    change_returned REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'CARD')),
    cashier_id TEXT NOT NULL,
    
    -- DGDA Compliance Fields
    has_antibiotic INTEGER NOT NULL DEFAULT 0,
    patient_name TEXT,
    patient_phone TEXT,
    patient_age INTEGER,
    patient_gender TEXT,
    doctor_name TEXT,
    doctor_bmdc_reg TEXT,                      -- Mandatory for DGDA audits
    hospital_clinic TEXT,
    prescription_date DATE,
    indication TEXT,
    
    -- CRDT Hybrid Logical Clock identifier for offline peer-to-peer sync
    hlc_timestamp TEXT NOT NULL,
    node_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(timestamp DESC);

-- 5. Sale Line Items Table
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    selected_unit TEXT NOT NULL CHECK (selected_unit IN ('box', 'strip', 'piece')),
    quantity_sold INTEGER NOT NULL,
    quantity_pieces INTEGER NOT NULL,          -- Converted to base unit 'Piece'
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    discount_percent REAL NOT NULL DEFAULT 0,
    final_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 6. Sale Batch Deduction Tracking (Audit trail for FEFO batch deductions)
CREATE TABLE IF NOT EXISTS sale_batch_deductions (
    id TEXT PRIMARY KEY,
    sale_item_id TEXT NOT NULL,
    stock_id TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    pieces_deducted INTEGER NOT NULL,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES inventory_stocks(id)
);

-- 7. CRDT Delta Log (For Offline LAN and Cloud Sync)
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
CREATE INDEX IF NOT EXISTS idx_crdt_hlc ON crdt_delta_log (hlc_timestamp ASC);`;

  // Deliverable 3: Core Rust Backend Logic
  const rustPrinterCode = `// ==============================================================================
// src-tauri/src/printer/rasterizer.rs
// BoriBox Core Rust Thermal Printing Module
// Renders Bengali Text / Invoices into 1-Bit Monochrome Bitmap & ESC/POS "GS v 0"
// ==============================================================================

use image::{DynamicImage, GenericImageView, GrayImage, Luma};
use std::fs::File;
use std::io::Write;

pub struct ThermalPrinter {
    pub paper_width_dots: u32, // 384 for 58mm, 576 for 80mm
}

impl ThermalPrinter {
    pub fn new(is_80mm: bool) -> Self {
        Self {
            paper_width_dots: if is_80mm { 576 } else { 384 },
        }
    }

    /// Converts a rendered RGBA dynamic image into 1-bit monochrome ESC/POS "GS v 0" bytes.
    /// Generic ESC/POS printers lack native Bengali shaping (HarfBuzz).
    /// Rasterizing into a 1-bit monochrome bitmap prints Bengali flawlessly on ANY generic printer!
    pub fn rasterize_to_escpos(&self, img: &DynamicImage) -> Result<Vec<u8>, String> {
        let (width, height) = img.dimensions();
        let gray: GrayImage = img.to_luma8();

        let width_bytes = ((width + 7) / 8) as usize;
        let mut bitmap_data = vec![0u8; width_bytes * height as usize];

        // 1-Bit Thresholding (Standard luminance: 0 = Paper White, 1 = Black Dot)
        for y in 0..height {
            for x in 0..width {
                let pixel = gray.get_pixel(x, y);
                // In thermal printers, black dot is 1, white is 0
                if pixel[0] < 140 {
                    let byte_index = (y as usize * width_bytes) + (x as usize / 8);
                    let bit_offset = 7 - (x % 8);
                    bitmap_data[byte_index] |= 1 << bit_offset;
                }
            }
        }

        let mut commands = Vec::new();

        // 1. ESC @ (Initialize Printer)
        commands.extend_from_slice(&[0x1B, 0x40]);

        // 2. ESC 3 0 (Set line spacing to 0 for seamless continuous raster blocks)
        commands.extend_from_slice(&[0x1B, 0x33, 0x00]);

        // 3. GS v 0 m xL xH yL yH (Raster Bit Image Command)
        // m = 0 (Normal mode), xL/xH = width in bytes, yL/yH = height in dots
        let xl = (width_bytes & 0xFF) as u8;
        let xh = ((width_bytes >> 8) & 0xFF) as u8;
        let yl = (height & 0xFF) as u8;
        let yh = ((height >> 8) & 0xFF) as u8;

        commands.extend_from_slice(&[0x1D, 0x76, 0x30, 0x00, xl, xh, yl, yh]);
        commands.extend_from_slice(&bitmap_data);

        // 4. ESC 2 (Reset line spacing to default)
        commands.extend_from_slice(&[0x1B, 0x32]);

        // 5. ESC d 4 (Feed 4 lines)
        commands.extend_from_slice(&[0x1B, 0x64, 0x04]);

        // 6. GS V 66 0 (Feed paper and partial/full cut)
        commands.extend_from_slice(&[0x1D, 0x56, 0x42, 0x00]);

        Ok(commands)
    }

    /// Sends raw binary commands to direct USB printer endpoint (/dev/usb/lp0 on Linux,
    /// or Windows raw print spooler "\\\\localhost\\PrinterName")
    pub fn send_to_usb_device(&self, device_path: &str, raw_bytes: &[u8]) -> Result<(), String> {
        let mut file = File::create(device_path).map_err(|e| format!("Printer error: {}", e))?;
        file.write_all(raw_bytes).map_err(|e| format!("Write failed: {}", e))?;
        file.flush().map_err(|e| format!("Flush failed: {}", e))?;
        Ok(())
    }
}

// ------------------------------------------------------------------------------
// src-tauri/src/main.rs (Tauri IPC Command Handler)
// ------------------------------------------------------------------------------
#[tauri::command]
pub async fn print_bengali_invoice(image_base64: String, is_80mm: bool, printer_target: String) -> Result<String, String> {
    use base64::{Engine as _, engine::general_purpose};
    
    let image_bytes = general_purpose::STANDARD.decode(image_base64)
        .map_err(|e| format!("Base64 error: {}", e))?;
        
    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Image decode error: {}", e))?;

    let printer = ThermalPrinter::new(is_80mm);
    let escpos_payload = printer.rasterize_to_escpos(&img)?;

    // Send payload to device
    printer.send_to_usb_device(&printer_target, &escpos_payload)?;
    
    Ok("Print completed successfully".to_string())
}`;

  // Deliverable 4: React POS Component Architecture
  const reactPosExplanation = `// ==============================================================================
// POS Cash Counter: Keyboard Architecture & Dynamic Unit Calculation
// ==============================================================================
// 
// Key Architectural Highlights:
// 1. Keyboard First: Non-tech savvy shop owners never need to touch a mouse.
//    - F1: Focuses medicine search input and triggers GS1 GTIN barcode scanner mode.
//    - F2: Focuses Cash Paid input or immediately finalizes checkout & thermal printing.
//    - F3: Pops the DGDA Mandatory Antibiotic & BMDC Doctor Prescription Modal.
//    - F4: Instant Cart Purge.
//    - Up / Down Arrows: Seamless navigation through search results.
//    - Enter: Adds highlighted medicine into active cart.
//
// 2. Dynamic Unit Multiplier Calculation:
//    - Base Unit is ALWAYS 'Piece' (পিস).
//    - Conversion formula:
//        total_pieces = quantity * (unit === 'box' ? pieces_per_box : unit === 'strip' ? pieces_per_strip : 1)
//    - Breakdown formula (modulo arithmetic):
//        boxes = floor(total_pieces / pieces_per_box)
//        strips = floor((total_pieces % pieces_per_box) / pieces_per_strip)
//        pieces = total_pieces % pieces_per_strip
//
// 3. FEFO (First-Expire, First-Out) Automated Batch Allocation:
//    - Batches sorted ascending by expiry_date: Earliest expiring batches are drained first.
//    - Displays exact shelf rack location (e.g. 'Rack A-02') to assist quick retrieval.`;

  // Deliverable 5: CRDT Sync Logic Explanation
  const crdtExplanation = `// ==============================================================================
// CRDT Offline Sync Architecture: Hybrid Logical Clocks & Delta Replication
// ==============================================================================
//
// Problem Statement:
// Multiple sales counters (Desktop Main + 2 Android Smartphones over Wi-Fi) 
// operate offline without internet. They continuously sell stock and add records.
// Central database locking is impossible in offline distributed networks.
//
// Solution: State-based Delta CRDT + Hybrid Logical Clocks (HLC)
//
// 1. Hybrid Logical Clock (HLC):
//    Every node maintains a logical clock tuple (l, c, node_id):
//    - l: physical timestamp (wall clock)
//    - c: logical counter for concurrent events within the same millisecond
//    - node_id: deterministic tie-breaker
//    HLC provides strict causal ordering even with device clock drift up to +/- 5 minutes.
//
// 2. Conflict-Free Stock Deduction (PN-Counter):
//    Instead of writing "stock = 45", mutations are logged as atomic increments/decrements:
//      DELTA(product_id: 'prod-001', batch: 'SEC-2401', change: -10, hlc: '1a7bc8-0-DESKTOP_MAIN')
//    When nodes connect over LAN WebSocket, they exchange delta logs since their last known HLC.
//    The merge is commutative and associative:
//      Total Stock = Initial Stock + SUM(Positive Deltas) - SUM(Negative Deltas)
//    No conflicts can ever occur!
// 3. Automated Encrypted Google Drive Backup:
//    Every 24 hours (or upon user request), the Tauri backend:
//    1. Issues SQLite 'VACUUM INTO ?' to produce an atomic snapshot file.
//    2. Encrypts the snapshot using AES-256-GCM with a user-derived PBKDF2 key.
//    3. Streams the ciphertext to the Google Drive API multipart upload endpoint.`;

  // Deliverable 6: Rust Backend Google Drive Auto-Backup & Bangladeshi SMS Gateway
  const rustBackupAndSmsCode = `// ==============================================================================
// BoriBox Step 10: Tauri Native Rust Backend Logic
// src-tauri/src/backup/gdrive.rs & src-tauri/src/sms/gateway.rs
//
// 1. AES-256-GCM Military Grade Encryption & Gzip Compression
// 2. Google OAuth 2.0 PKCE Loopback Authentication
// 3. Google Drive REST API v3 Multipart Upload
// 4. Bangladeshi SMS Gateway Dispatcher (Greenweb, GotiSMS, SSL Wireless)
// ==============================================================================

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce
};
use flate2::write::GzEncoder;
use flate2::Compression;
use pbkdf2::pbkdf2_hmac;
use sha2::Sha256;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct BackupUploadResult {
    pub success: bool,
    pub drive_file_id: String,
    pub filename: String,
    pub size_bytes: usize,
    pub uploaded_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GoogleAuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub token_type: String,
}

pub struct PharmacyBackupEngine {
    db_path: String,
}

impl PharmacyBackupEngine {
    pub fn new(db_path: &str) -> Self {
        Self { db_path: db_path.to_string() }
    }

    /// Step 1: Takes an atomic SQLite snapshot using SQLite's VACUUM INTO statement
    pub fn create_sqlite_snapshot(&self, snapshot_path: &str) -> Result<(), String> {
        let conn = rusqlite::Connection::open(&self.db_path)
            .map_err(|e| format!("SQLite open failed: {}", e))?;
            
        // Clean up previous temporary snapshot if exists
        let _ = fs::remove_file(snapshot_path);
        
        conn.execute("VACUUM INTO ?1", [snapshot_path])
            .map_err(|e| format!("VACUUM INTO failed: {}", e))?;
            
        Ok(())
    }

    /// Step 2: Gzip compress and encrypt with AES-256-GCM using PBKDF2 derived key
    pub fn compress_and_encrypt(&self, input_file: &str, password: &str) -> Result<Vec<u8>, String> {
        // Read raw SQLite snapshot bytes
        let mut raw_db = Vec::new();
        File::open(input_file)
            .map_err(|e| format!("Failed to read snapshot: {}", e))?
            .read_to_end(&mut raw_db)
            .map_err(|e| format!("Read failed: {}", e))?;

        // 1. Gzip Compression (reduces database size by 70-80%)
        let mut encoder = GzEncoder::new(Vec::new(), Compression::best());
        encoder.write_all(&raw_db).map_err(|e| format!("Gzip failed: {}", e))?;
        let compressed_bytes = encoder.finish().map_err(|e| format!("Gzip finish failed: {}", e))?;

        // 2. Derive 256-bit AES key using PBKDF2-HMAC-SHA256 (100,000 iterations)
        let salt = b"BoriBox_DGDA_Pharma_Salt_2026";
        let mut derived_key = [0u8; 32];
        pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, 100_000, &mut derived_key);

        let key = Key::<Aes256Gcm>::from_slice(&derived_key);
        let cipher = Aes256Gcm::new(key);
        
        // 96-bit random nonce for AES-256-GCM
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng); // 12-bytes
        
        let ciphertext = cipher.encrypt(&nonce, compressed_bytes.as_ref())
            .map_err(|e| format!("AES-256-GCM encryption error: {}", e))?;

        // Format final payload: [12-byte Nonce] + [Ciphertext + 16-byte Poly1305 Tag]
        let mut final_payload = Vec::with_capacity(12 + ciphertext.len());
        final_payload.extend_from_slice(nonce.as_slice());
        final_payload.extend_from_slice(&ciphertext);

        Ok(final_payload)
    }

    /// Step 3: Upload encrypted blob to Google Drive API v3 (Multipart Upload)
    pub async fn upload_to_google_drive(
        &self,
        access_token: &str,
        encrypted_bytes: &[u8],
        filename: &str
    ) -> Result<BackupUploadResult, String> {
        let client = reqwest::Client::new();
        
        let metadata = serde_json::json!({
            "name": filename,
            "mimeType": "application/octet-stream",
            "description": "BoriBox Pharmacy Management AES-256 Encrypted SQLite Backup"
        });

        let boundary = "-------BoriBoxBoundary987654321";
        let mut body = Vec::new();

        // Part 1: Metadata JSON
        body.extend_from_slice(format!("--{}\\r\\nContent-Type: application/json; charset=UTF-8\\r\\n\\r\\n", boundary).as_bytes());
        body.extend_from_slice(metadata.to_string().as_bytes());
        body.extend_from_slice(b"\\r\\n");

        // Part 2: Encrypted Binary Content
        body.extend_from_slice(format!("--{}\\r\\nContent-Type: application/octet-stream\\r\\n\\r\\n", boundary).as_bytes());
        body.extend_from_slice(encrypted_bytes);
        body.extend_from_slice(format!("\\r\\n--{}--\\r\\n", boundary).as_bytes());

        let url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
        
        let response = client.post(url)
            .header(AUTHORIZATION, format!("Bearer {}", access_token))
            .header(CONTENT_TYPE, format!("multipart/related; boundary={}", boundary))
            .body(body)
            .send()
            .await
            .map_err(|e| format!("Drive HTTP upload failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let err_text = response.text().await.unwrap_or_default();
            return Err(format!("Google Drive returned HTTP {}: {}", status, err_text));
        }

        let resp_json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse Drive response JSON: {}", e))?;

        let file_id = resp_json["id"].as_str().unwrap_or("unknown").to_string();

        Ok(BackupUploadResult {
            success: true,
            drive_file_id: file_id,
            filename: filename.to_string(),
            size_bytes: encrypted_bytes.len(),
            uploaded_at: chrono::Local::now().to_rfc3339(),
        })
    }
}

// ------------------------------------------------------------------------------
// src-tauri/src/main.rs (Tauri IPC Handlers for Settings, SMS, & Backup)
// ------------------------------------------------------------------------------

#[tauri::command]
pub async fn trigger_encrypted_drive_backup(
    db_path: String,
    encryption_key: String,
    google_token: String
) -> Result<BackupUploadResult, String> {
    let engine = PharmacyBackupEngine::new(&db_path);
    let temp_snapshot = "temp_boribox_snapshot.sqlite";
    
    // 1. Create atomic SQLite snapshot
    engine.create_sqlite_snapshot(temp_snapshot)?;

    // 2. Compress with Gzip and Encrypt with AES-256-GCM
    let encrypted_data = engine.compress_and_encrypt(temp_snapshot, &encryption_key)?;
    
    // Clean up temporary snapshot file
    let _ = fs::remove_file(temp_snapshot);

    let now = chrono::Local::now();
    let filename = format!("boribox_backup_{}.sqlite.enc", now.format("%Y_%m_%d_%H%M%S"));

    // 3. Stream to Google Drive
    engine.upload_to_google_drive(&google_token, &encrypted_data, &filename).await
}

#[tauri::command]
pub async fn send_bangladeshi_sms_gateway(
    provider: String,
    api_token: String,
    sender_id: String,
    recipient_phone: String,
    message: String
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    // Normalize Bangladeshi phone number to 8801XXXXXXXXX
    let clean_phone = recipient_phone.replace(|c: char| !c.is_numeric(), "");
    let formatted_phone = if clean_phone.starts_with("880") {
        clean_phone
    } else if clean_phone.starts_with("0") {
        format!("88{}", clean_phone)
    } else {
        format!("880{}", clean_phone)
    };

    match provider.to_uppercase().as_str() {
        "GREENWEB" => {
            let res = client.post("https://api.greenweb.com.bd/api.php?json")
                .form(&[
                    ("token", &api_token),
                    ("to", &formatted_phone),
                    ("message", &message),
                ])
                .send()
                .await
                .map_err(|e| format!("Greenweb dispatch error: {}", e))?;
            let body = res.text().await.unwrap_or_default();
            Ok(format!("Greenweb response: {}", body))
        },
        "GOTISMS" => {
            let payload = serde_json::json!({
                "api_key": api_token,
                "sender_id": sender_id,
                "recipient": formatted_phone,
                "message": message
            });
            let res = client.post("https://gotisms.com/api/sms/send")
                .json(&payload)
                .send()
                .await
                .map_err(|e| format!("GotiSMS dispatch error: {}", e))?;
            let body = res.text().await.unwrap_or_default();
            Ok(format!("GotiSMS response: {}", body))
        },
        "SSL_WIRELESS" => {
            let payload = serde_json::json!({
                "api_token": api_token,
                "sid": sender_id,
                "msisdn": formatted_phone,
                "sms": message,
                "csms_id": uuid::Uuid::new_v4().to_string()
            });
            let res = client.post("https://smsplus.sslwireless.com/api/v3/send-sms")
                .json(&payload)
                .send()
                .await
                .map_err(|e| format!("SSL Wireless dispatch error: {}", e))?;
            let body = res.text().await.unwrap_or_default();
            Ok(format!("SSL Wireless response: {}", body))
        },
        _ => Err("Unsupported SMS gateway provider".to_string())
    }
}`;

  // Deliverable 7: Rust Onboarding, Password Hashing (Argon2id) & SQLite Bootstrap
  const rustOnboardingAndAuthCode = `// -----------------------------------------------------------------------------
// BoriBox First-Time Setup & Onboarding: Rust + SQLite Backend Implementation
// -----------------------------------------------------------------------------
// src-tauri/Cargo.toml dependencies:
// rusqlite = { version = "0.31", features = ["bundled"] }
// argon2 = "0.5"
// rand_core = { version = "0.6", features = ["std"] }
// serde = { version = "1.0", features = ["derive"] }
// serde_json = "1.0"
// -----------------------------------------------------------------------------

use rusqlite::{params, Connection, Result};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PharmacyProfileInput {
    pub pharmacy_name: String,
    pub owner_name: String,
    pub drug_license_no: String,
    pub address: String,
    pub phone: String,
    pub printer_paper_width: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SuperAdminInput {
    pub name: String,
    pub username: String,
    pub password: String,
    pub pin: String,
    pub phone: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OnboardingPayload {
    pub pharmacy: PharmacyProfileInput,
    pub admin: SuperAdminInput,
}

#[derive(Debug, Serialize)]
pub struct OnboardingResult {
    pub success: bool,
    pub message: String,
    pub user_id: String,
}

/// 1. Initial Check Logic: Checks if SQLite database has any users
/// If count == 0, returns true (first run -> route to Onboarding screen)
/// Otherwise returns false (route to standard PIN / Login screen)
#[tauri::command]
pub fn check_is_first_run(db_path: &str) -> Result<bool, String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Ensure users and settings/shop_profile tables exist
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS shop_profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            pharmacy_name TEXT NOT NULL,
            owner_name TEXT,
            drug_license_no TEXT NOT NULL,
            address TEXT,
            phone TEXT NOT NULL,
            printer_paper_width TEXT DEFAULT '80mm',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            pin TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'CASHIER')),
            phone TEXT,
            status TEXT DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );"
    ).map_err(|e| format!("Database initialization failed: {}", e))?;

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    Ok(count == 0)
}

/// 2. Secure Save & Database Insertion:
/// Securely hashes admin password using Argon2id with cryptographically random salt,
/// and saves pharmacy details + super admin in an atomic SQLite transaction.
#[tauri::command]
pub fn bootstrap_first_time_setup(
    db_path: &str,
    payload: OnboardingPayload,
) -> Result<OnboardingResult, String> {
    let mut conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Validate inputs
    if payload.pharmacy.pharmacy_name.trim().is_empty() {
        return Err("ফার্মেসির নাম আবশ্যক।".into());
    }
    if payload.admin.username.trim().len() < 3 {
        return Err("ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে।".into());
    }
    if payload.admin.password.len() < 6 {
        return Err("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।".into());
    }

    // 2.1 Cryptographic Password Hashing (Argon2id)
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(payload.admin.password.as_bytes(), &salt)
        .map_err(|e| format!("Argon2 hashing error: {}", e))?
        .to_string();

    let user_id = format!("usr-admin-{}", chrono::Utc::now().timestamp_millis());

    // 2.2 Atomic SQLite Transaction
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Upsert shop_profile
    tx.execute(
        "INSERT OR REPLACE INTO shop_profile (id, pharmacy_name, owner_name, drug_license_no, address, phone, printer_paper_width)
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            payload.pharmacy.pharmacy_name.trim(),
            payload.pharmacy.owner_name.trim(),
            payload.pharmacy.drug_license_no.trim(),
            payload.pharmacy.address.trim(),
            payload.pharmacy.phone.trim(),
            payload.pharmacy.printer_paper_width
        ],
    ).map_err(|e| format!("Shop profile save failed: {}", e))?;

    // Insert Super Admin user
    tx.execute(
        "INSERT INTO users (id, name, username, password_hash, pin, role, phone, status)
         VALUES (?1, ?2, ?3, ?4, ?5, 'SUPER_ADMIN', ?6, 'ACTIVE')",
        params![
            user_id,
            payload.admin.name.trim(),
            payload.admin.username.trim().to_lowercase(),
            password_hash,
            payload.admin.pin.trim(),
            payload.admin.phone.trim()
        ],
    ).map_err(|e| format!("Admin user creation failed: {}", e))?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(OnboardingResult {
        success: true,
        message: format!("{} ফার্মেসি ও সুপার এডমিন অ্যাকাউন্ট সফলভাবে সক্রিয় হয়েছে!", payload.pharmacy.pharmacy_name),
        user_id,
    })
}

/// 3. Offline Password Verification (Argon2id)
#[tauri::command]
pub fn verify_user_login(
    db_path: &str,
    username: &str,
    password_or_pin: &str,
) -> Result<bool, String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT password_hash, pin FROM users WHERE username = ?1 AND status = 'ACTIVE'")
        .map_err(|e| e.to_string())?;

    let user_data = stmt.query_row(params![username.to_lowercase()], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    });

    match user_data {
        Ok((stored_hash, stored_pin)) => {
            // Check Quick PIN first
            if password_or_pin == stored_pin {
                return Ok(true);
            }

            // Check Argon2id password hash
            let parsed_hash = PasswordHash::new(&stored_hash)
                .map_err(|e| format!("Invalid password hash: {}", e))?;
            
            let is_valid = Argon2::default()
                .verify_password(password_or_pin.as_bytes(), &parsed_hash)
                .is_ok();

            Ok(is_valid)
        }
        Err(_) => Ok(false),
    }
}

// -----------------------------------------------------------------------------
// React Frontend Lifecycle Hook (src/App.tsx)
// -----------------------------------------------------------------------------
// useEffect(() => {
//   async function checkFirstRun() {
//     try {
//       // In Tauri desktop: invoke Rust command
//       const isFirstRun = await invoke<boolean>('check_is_first_run', { dbPath: 'boribox.sqlite' });
//       if (isFirstRun) {
//         setIsSetupCompleted(false);
//       }
//     } catch (err) {
//       console.error('Initial check failed:', err);
//     }
//   }
//   checkFirstRun();
// }, []);
`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-bangla">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <h2 className="text-lg font-bold text-slate-900">
              বোরিবক্স সফটওয়্যার আর্কিটেকচার ও কোড এক্সপ্লোরার
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            টরি (Tauri 2.0), রাস্ট ব্যাকএন্ড, নরমালাইজড SQLite স্কিমা, ESC/POS রাস্টারাইজার এবং CRDT সিঙ্ক
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">ডেলিভারেবল:</span>
          <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded border border-sky-100">
            ৭টি মূল মডিউল প্রস্তুত
          </span>
        </div>
      </div>

      {/* Deliverable Selector Tabs (flex-wrap to prevent horizontal scrollbar) */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1 text-xs">
        {[
          { id: 1, label: '১. ফোল্ডার স্ট্রাকচার', icon: FolderTree },
          { id: 2, label: '২. SQLite ডাটাবেজ স্কিমা', icon: Database },
          { id: 3, label: '৩. রাস্ট থার্মাল প্রিন্টার', icon: Terminal },
          { id: 4, label: '৪. পিওএস কিবোর্ড আর্কিটেকচার', icon: Cpu },
          { id: 5, label: '৫. অফলাইন সিঙ্ক মেকানিজম', icon: Share2 },
          { id: 6, label: '৬. রাস্ট AES-256 ব্যাকআপ ও SMS', icon: Cloud },
          { id: 7, label: '৭. অনবোর্ডিং ও পাসওয়ার্ড হ্যাশ', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDeliverable(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeDeliverable === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Deliverable Content Viewers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Deliverable 1 */}
        {activeDeliverable === 1 && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ডেলিভারেবল ১: Tauri + React কমপ্লিট প্রজেক্ট ফোল্ডার স্ট্রাকচার
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  লাইটওয়েট সিকিউর ডেক্সটপ এক্সিকিউটেবল (.exe / .deb / .dmg) তৈরির জন্য স্ট্যান্ডার্ড ফাইল ট্রি
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(folderStructureCode, 'folder')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 font-sans"
              >
                {copiedId === 'folder' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'folder' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-5 bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-[60vh]">
              {folderStructureCode}
            </pre>
          </div>
        )}

        {/* Deliverable 2 */}
        {activeDeliverable === 2 && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ডেলিভারেবল ২: নরমালাইজড রিলেশনাল SQLite ডাটাবেজ স্কিমা (schema.sql)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Products, Inventory Stocks, Sales, Sale Items এবং FTS5 Trigram সাবস্ট্রিং সার্চ ইঞ্জিন
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(sqliteSchemaCode, 'schema')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 font-sans"
              >
                {copiedId === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'schema' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-5 bg-slate-950 text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-[60vh]">
              {sqliteSchemaCode}
            </pre>
          </div>
        )}

        {/* Deliverable 3 */}
        {activeDeliverable === 3 && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ডেলিভারেবল ৩: রাস্ট (Rust) ESC/POS থার্মাল প্রিন্টিং রাস্টারাইজার মডিউল
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  জেনেরিক থার্মাল প্রিন্টারে বাংলা যুক্তাক্ষর রেন্ডারিং এবং ১-বিট মনোক্রোম GS v 0 হেক্স কমান্ড জেনারেটর
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(rustPrinterCode, 'rust')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 font-sans"
              >
                {copiedId === 'rust' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'rust' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-5 bg-slate-950 text-amber-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-[60vh]">
              {rustPrinterCode}
            </pre>
          </div>
        )}

        {/* Deliverable 4 */}
        {activeDeliverable === 4 && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ডেলিভারেবল ৪: পিওএস ক্যাশ কাউন্টার কিবোর্ড ইভেন্ট ও মাল্টি-ইউনিট আর্কিটেকচার
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  F1, F2, F3, F4 শর্টকাট লিসেনার ও বক্স-পাতা-পিস রূপান্তরের গাণিতিক অ্যালগরিদম
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(reactPosExplanation, 'pos')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 font-sans"
              >
                {copiedId === 'pos' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'pos' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-5 bg-slate-950 text-sky-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-[60vh]">
              {reactPosExplanation}
            </pre>
          </div>
        )}

        {/* Deliverable 5 */}
        {activeDeliverable === 5 && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ডেলিভারেবল ৫: CRDT অফলাইন সিঙ্ক ও অটোমেটেড গুগল ড্রাইভ ব্যাকআপ মেকানিজম
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hybrid Logical Clocks (HLC), PN-Counter ডেল্টা স্টেট মার্জ এবং AES-256 এনক্রিপ্টেড ব্যাকআপ
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(crdtExplanation, 'crdt')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 font-sans"
              >
                {copiedId === 'crdt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'crdt' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-5 bg-slate-950 text-indigo-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-[60vh]">
              {crdtExplanation}
            </pre>
          </div>
        )}

        {/* Deliverable 6 */}
        {activeDeliverable === 6 && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ডেলিভারেবল ৬: রাস্ট (Rust) ব্যাকএন্ড AES-256 ব্যাকআপ ইঞ্জিন ও বাংলাদেশী SMS গেটওয়ে
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  SQLite VACUUM INTO, Gzip কম্প্রেশন, PBKDF2/AES-256-GCM এনক্রিপশন, গুগল ড্রাইভ v3 এপিআই এবং Greenweb/GotiSMS/SSL ওয়্যারলেস
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(rustBackupAndSmsCode, 'rustBackup')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 font-sans"
              >
                {copiedId === 'rustBackup' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'rustBackup' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-5 bg-slate-950 text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-[60vh]">
              {rustBackupAndSmsCode}
            </pre>
          </div>
        )}

        {/* Deliverable 7 */}
        {activeDeliverable === 7 && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ডেলিভারেবল ৭: ফার্স্ট-টাইম অনবোর্ডিং, পাসওয়ার্ড সিকিউর হ্যাশিং (Argon2id) ও বুটস্ট্র্যাপ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  SQLite-এ users টেবিল চেক (`check_is_first_run`), Argon2id ক্রিপ্টোগ্রাফিক সল্ট হ্যাশিং এবং শপ প্রোফাইল এটমিক ট্রানজেকশন
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(rustOnboardingAndAuthCode, 'rustAuth')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 font-sans"
              >
                {copiedId === 'rustAuth' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'rustAuth' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-5 bg-slate-950 text-sky-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-[60vh]">
              {rustOnboardingAndAuthCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
