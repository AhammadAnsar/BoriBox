//! BoriBox Thermal Printer Rasterization Engine
//!
//! Solves the Bengali font rendering limitation on generic thermal printers (Xprinter, Epson, POS-58/80).
//! Generic printers lack OpenType/HarfBuzz complex text shaping in firmware.
//! By rasterizing pre-rendered canvas/image buffers into 1-bit monochrome ESC/POS "GS v 0" commands,
//! Bengali conjuncts (যুক্তাক্ষর), matras, and numbers print 100% faithfully.

use image::{DynamicImage, GenericImageView, GrayImage};
use std::fs::File;
use std::io::Write;
use std::net::TcpStream;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct ThermalPrinterConfig {
    pub is_80mm: bool,
    pub dots_per_line: u32,  // 384 dots for 58mm, 576 dots for 80mm
    pub threshold: u8,       // 0-255 (default: 140 for crisp thermal darks)
}

impl Default for ThermalPrinterConfig {
    fn default() -> Self {
        Self {
            is_80mm: false,
            dots_per_line: 384,
            threshold: 140,
        }
    }
}

pub struct ThermalPrinter {
    config: ThermalPrinterConfig,
}

impl ThermalPrinter {
    pub fn new(is_80mm: bool) -> Self {
        let dots_per_line = if is_80mm { 576 } else { 384 };
        Self {
            config: ThermalPrinterConfig {
                is_80mm,
                dots_per_line,
                threshold: 140,
            },
        }
    }

    /// Converts an RGBA image buffer into ESC/POS monochrome "GS v 0" raster bytes
    pub fn rasterize_image(&self, img: &DynamicImage) -> Result<Vec<u8>, String> {
        let (width, height) = img.dimensions();

        // 1. Convert to 8-bit grayscale
        let gray: GrayImage = img.to_luma8();

        // 2. Calculate bytes per line (8 dots per byte, rounded up)
        let width_bytes = ((width + 7) / 8) as usize;
        let mut bitmap_data = vec![0u8; width_bytes * height as usize];

        // 3. Monochrome 1-bit thresholding
        // Thermal printer mechanics: 1 = Black dot (burn heat on paper), 0 = White (no burn)
        for y in 0..height {
            for x in 0..width {
                let pixel = gray.get_pixel(x, y);
                let luminance = pixel[0];

                if luminance < self.config.threshold {
                    let byte_idx = (y as usize * width_bytes) + (x as usize / 8);
                    let bit_offset = 7 - (x % 8); // MSB (Most Significant Bit) first
                    bitmap_data[byte_idx] |= 1 << bit_offset;
                }
            }
        }

        // 4. Assemble standard ESC/POS command sequence
        let mut commands = Vec::with_capacity(32 + bitmap_data.len());

        // (a) ESC @ (0x1B, 0x40): Initialize printer & clear internal print buffer
        commands.extend_from_slice(&[0x1B, 0x40]);

        // (b) ESC 3 0 (0x1B, 0x33, 0x00): Set line spacing to 0 dots
        // CRITICAL: Prevents blank horizontal gaps between bitmap raster rows
        commands.extend_from_slice(&[0x1B, 0x33, 0x00]);

        // (c) GS v 0 (0x1D, 0x76, 0x30, mode, xL, xH, yL, yH): Raster Bit Image
        // mode = 0 (Normal density)
        // xL, xH = Number of horizontal bytes
        // yL, yH = Number of vertical dots
        let xl = (width_bytes & 0xFF) as u8;
        let xh = ((width_bytes >> 8) & 0xFF) as u8;
        let yl = (height & 0xFF) as u8;
        let yh = ((height >> 8) & 0xFF) as u8;

        commands.extend_from_slice(&[0x1D, 0x76, 0x30, 0x00, xl, xh, yl, yh]);
        commands.extend_from_slice(&bitmap_data);

        // (d) ESC 2 (0x1B, 0x32): Reset line spacing back to printer default
        commands.extend_from_slice(&[0x1B, 0x32]);

        // (e) ESC d 4 (0x1B, 0x64, 0x04): Feed 4 lines of paper past cutter blade
        commands.extend_from_slice(&[0x1B, 0x64, 0x04]);

        // (f) GS V 66 0 (0x1D, 0x56, 0x42, 0x00): Partial/Full Paper Cut command
        commands.extend_from_slice(&[0x1D, 0x56, 0x42, 0x00]);

        Ok(commands)
    }

    /// Transmit raw ESC/POS bytes to a local USB device (/dev/usb/lp0 on Linux / Raspberry Pi)
    pub fn print_to_usb_endpoint(&self, device_path: &str, raw_bytes: &[u8]) -> Result<(), String> {
        let mut file = File::create(device_path)
            .map_err(|e| format!("Failed to open USB printer at '{}': {}", device_path, e))?;
        file.write_all(raw_bytes)
            .map_err(|e| format!("Failed to write to USB printer: {}", e))?;
        file.flush()
            .map_err(|e| format!("Failed to flush printer buffer: {}", e))?;
        Ok(())
    }

    /// Transmit raw ESC/POS bytes over LAN / Wi-Fi to a Network Thermal Printer (Port 9100)
    pub fn print_to_network_endpoint(&self, ip_address: &str, raw_bytes: &[u8]) -> Result<(), String> {
        let address = format!("{}:9100", ip_address);
        let mut stream = TcpStream::connect_timeout(
            &address.parse().map_err(|e| format!("Invalid IP address '{}': {}", address, e))?,
            Duration::from_secs(4),
        )
        .map_err(|e| format!("Could not connect to network thermal printer at {}: {}", address, e))?;

        stream.set_write_timeout(Some(Duration::from_secs(5)))
            .map_err(|e| format!("Timeout configuration failed: {}", e))?;

        stream.write_all(raw_bytes)
            .map_err(|e| format!("Network write failed: {}", e))?;
        stream.flush()
            .map_err(|e| format!("Network flush failed: {}", e))?;
        Ok(())
    }
}
