// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod printer;

use base64::{Engine as _, engine::general_purpose};
use printer::ThermalPrinter;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct PrintRequest {
    pub image_base64: String,    // PNG / JPEG Base64 rendered from React Canvas
    pub is_80mm: bool,           // false = 58mm (384 dots), true = 80mm (576 dots)
    pub transport_type: String,  // "usb" | "network" | "spooler"
    pub target_endpoint: String, // e.g. "/dev/usb/lp0" or "192.168.1.150"
}

#[derive(Debug, Serialize)]
pub struct PrintResponse {
    pub success: bool,
    pub bytes_written: usize,
    pub message: String,
}

/// Tauri Command: Receives pre-rendered Bengali invoice from React UI,
/// rasterizes to 1-bit monochrome ESC/POS "GS v 0" bitmap, and sends directly
/// to physical thermal printer hardware.
#[tauri::command]
pub async fn print_bengali_receipt(request: PrintRequest) -> Result<PrintResponse, String> {
    // 1. Strip potential data URL prefix ("data:image/png;base64,...")
    let clean_base64 = if let Some(idx) = request.image_base64.find("base64,") {
        &request.image_base64[(idx + 7)..]
    } else {
        &request.image_base64
    };

    // 2. Decode Base64 to image bytes
    let image_bytes = general_purpose::STANDARD
        .decode(clean_base64)
        .map_err(|e| format!("Base64 decoding failed: {}", e))?;

    // 3. Load image into memory buffer
    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to parse image from memory: {}", e))?;

    // 4. Rasterize to 1-bit ESC/POS binary stream
    let printer = ThermalPrinter::new(request.is_80mm);
    let escpos_payload = printer.rasterize_image(&img)?;
    let payload_len = escpos_payload.len();

    // 5. Send to hardware device depending on transport type
    match request.transport_type.as_str() {
        "network" => {
            printer.print_to_network_endpoint(&request.target_endpoint, &escpos_payload)?;
        }
        "usb" => {
            printer.print_to_usb_endpoint(&request.target_endpoint, &escpos_payload)?;
        }
        _ => {
            // Default: Fallback to USB or Linux device
            printer.print_to_usb_endpoint(&request.target_endpoint, &escpos_payload)?;
        }
    }

    Ok(PrintResponse {
        success: true,
        bytes_written: payload_len,
        message: "ইনভয়েস সফলভাবে থার্মাল প্রিন্টারে মুদ্রিত হয়েছে।".to_string(),
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![print_bengali_receipt])
        .run(tauri::generate_context!())
        .expect("error while running BoriBox desktop application");
}
