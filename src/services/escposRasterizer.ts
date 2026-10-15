/**
 * ESC/POS Thermal Printing Rasterizer for Bengali Script
 * Converts rendered HTML Canvas / Bengali text into 1-bit monochrome ESC/POS commands (GS v 0).
 * Generic ESC/POS printers (Xprinter, Epson, POS-58/80) lack native Bengali complex text shaping (HarfBuzz).
 * Rasterizing into a 1-bit bitmap ensures 100% faithful Bengali rendering on ANY thermal printer!
 */

import { SaleTransaction } from '../types/pharmacy';
import { toBengaliNumber } from './unitCalculator';

export interface RasterizedReceipt {
  canvas: HTMLCanvasElement;
  widthDots: number;
  heightDots: number;
  widthBytes: number;
  escposBytes: Uint8Array;
  hexDumpSample: string;
}

export interface PrinterConfig {
  paperWidthMm: 58 | 80;
  dotsPerLine: number; // 384 for 58mm, 576 for 80mm
  shopNameBn: string;
  shopAddressBn: string;
  shopPhone: string;
  dgdaLicense: string;
  shopLogoBase64?: string;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  paperWidthMm: 58,
  dotsPerLine: 384,
  shopNameBn: 'বোরিবক্স মডেল ফার্মেসি',
  shopAddressBn: 'ধানমন্ডি ২৭, ঢাকা-১২০৯',
  shopPhone: '০১৭১১-২২৩৩৪৪',
  dgdaLicense: 'DGDA-REG: DH-10492/2026',
};

/**
 * Renders a full Bengali invoice onto an HTML Canvas at exact thermal dot resolution
 */
export function renderInvoiceToCanvas(
  sale: SaleTransaction,
  config: PrinterConfig = DEFAULT_PRINTER_CONFIG,
  logoImage?: HTMLImageElement | null
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = config.dotsPerLine; // 384 or 576
  canvas.width = width;

  // Temporary canvas context to measure layout height dynamically
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const hasLogo = !!(logoImage && logoImage.complete && logoImage.naturalWidth > 0);
  const logoHeightEstimated = hasLogo ? 60 : 0;

  // Estimate height: header ~ 140 + logo, patient ~ 80, items ~ 32 each, totals ~ 140, footer ~ 120
  const estimatedHeight = 520 + logoHeightEstimated + sale.items.length * 36 + (sale.has_antibiotic ? 100 : 0);
  canvas.height = estimatedHeight;

  // Fill pure white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, estimatedHeight);

  // Set drawing styles
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  let y = 14;
  const paddingX = 14;
  const contentWidth = width - paddingX * 2;

  // 0. Dynamic Pharmacy Logo (if available)
  if (hasLogo && logoImage) {
    const targetLogoWidth = Math.min(64, width / 4);
    const aspect = logoImage.naturalHeight / logoImage.naturalWidth;
    const targetLogoHeight = targetLogoWidth * aspect;
    ctx.drawImage(logoImage, (width - targetLogoWidth) / 2, y, targetLogoWidth, targetLogoHeight);
    y += targetLogoHeight + 8;
  }

  // 1. Header: Shop Name (Bold Bengali)
  ctx.font = 'bold 22px "Hind Siliguri", "Noto Serif Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(config.shopNameBn, width / 2, y);
  y += 26;

  // Subtitle / DGDA Reg
  ctx.font = '13px "Hind Siliguri", "Noto Serif Bengali", sans-serif';
  ctx.fillText(config.shopAddressBn, width / 2, y);
  y += 18;
  ctx.fillText(`মোবাইল: ${config.shopPhone}`, width / 2, y);
  y += 18;
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillText(config.dgdaLicense, width / 2, y);
  y += 22;

  // Divider line
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.setLineDash([4, 2]);
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 8;

  // 2. Invoice Meta
  ctx.textAlign = 'left';
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillText(`ইনভয়েস: ${sale.invoice_number}`, paddingX, y);
  ctx.textAlign = 'right';
  ctx.fillText(sale.timestamp.split('T')[0], width - paddingX, y);
  y += 18;

  ctx.textAlign = 'left';
  ctx.fillText(`ক্যাশিয়ার: ${sale.cashier_name}`, paddingX, y);
  ctx.textAlign = 'right';
  ctx.fillText(sale.payment_method === 'CASH' ? 'ক্যাশ' : sale.payment_method, width - paddingX, y);
  y += 18;

  ctx.textAlign = 'left';
  ctx.font = '12px "Hind Siliguri", sans-serif';
  ctx.fillText(`ক্রেতা: ${sale.customer_name ? sale.customer_name : 'সাধারণ ক্রেতা'}${sale.customer_phone ? ' (' + sale.customer_phone + ')' : ''}`, paddingX, y);
  y += 18;

  // Antibiotic / DGDA Patient Badge if applicable
  if (sale.has_antibiotic && sale.prescription) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(paddingX, y, contentWidth, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Hind Siliguri", sans-serif';
    ctx.fillText('DGDA অ্যান্টিবায়োটিক প্রেসক্রিপশন নিবন্ধিত', width / 2, y + 3);
    y += 24;

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.font = '11px "Hind Siliguri", sans-serif';
    const patName = sale.prescription.patient_name || sale.customer_name || 'সাধারণ ক্রেতা';
    const patAgeStr = sale.prescription.patient_age ? ` (${toBengaliNumber(sale.prescription.patient_age)} বছর)` : '';
    const docName = sale.prescription.doctor_name || 'মৌখিক পরামর্শ';
    const bmdcStr = sale.prescription.doctor_bmdc_reg ? ` (BMDC: ${sale.prescription.doctor_bmdc_reg})` : '';

    ctx.fillText(`রোগী: ${patName}${patAgeStr}`, paddingX, y);
    y += 16;
    ctx.fillText(`ডাক্তার: ${docName}${bmdcStr}`, paddingX, y);
    y += 20;
  }

  // 3. Item Table Header
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();
  y += 4;

  ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ওষুধ ও পরিমাণ', paddingX, y);
  ctx.textAlign = 'right';
  ctx.fillText('মোট (টাকা)', width - paddingX, y);
  y += 18;

  ctx.beginPath();
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();
  y += 8;

  // 4. Cart Items
  sale.items.forEach((item) => {
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(item.product.brand_name, paddingX, y);

    ctx.textAlign = 'right';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(`৳ ${item.final_price.toFixed(2)}`, width - paddingX, y);
    y += 16;

    // Unit & Qty line in Bengali
    ctx.textAlign = 'left';
    ctx.font = '11px "Hind Siliguri", sans-serif';
    const unitLabel = item.selected_unit === 'box' ? 'বক্স' : item.selected_unit === 'strip' ? 'পাতা' : 'পিস';
    const batchInfo = item.allocated_batches.map(b => b.batch_number).join(',');
    ctx.fillText(
      `${toBengaliNumber(item.quantity)} ${unitLabel} (${toBengaliNumber(item.total_pieces)} পিস) · ব্যাচ: ${batchInfo}`,
      paddingX,
      y
    );
    y += 18;
  });

  // Divider
  ctx.beginPath();
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();
  y += 10;

  // 5. Totals
  const drawTotalLine = (labelBn: string, amount: number, isBold: boolean = false) => {
    ctx.textAlign = 'left';
    ctx.font = isBold ? 'bold 14px "Hind Siliguri", sans-serif' : '12px "Hind Siliguri", sans-serif';
    ctx.fillText(labelBn, paddingX + 80, y);
    ctx.textAlign = 'right';
    ctx.font = isBold ? 'bold 14px "JetBrains Mono", monospace' : '12px "JetBrains Mono", monospace';
    ctx.fillText(`৳ ${amount.toFixed(2)}`, width - paddingX, y);
    y += 18;
  };

  drawTotalLine('সাব-টোটাল:', sale.subtotal);
  if (sale.discount_amount > 0) {
    drawTotalLine('ডিসকাউন্ট:', -sale.discount_amount);
  }
  drawTotalLine('মোট প্রদেয়:', sale.net_payable, true);
  y += 2;
  drawTotalLine('জমা:', sale.paid_amount);
  drawTotalLine('ফেরত:', sale.change_returned);
  y += 10;

  // 6. Footer Notes
  ctx.beginPath();
  ctx.setLineDash([3, 2]);
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 12;

  ctx.textAlign = 'center';
  ctx.font = '11px "Hind Siliguri", "Noto Serif Bengali", sans-serif';
  ctx.fillText('ধন্যবাদ! সুস্থ থাকুন, ভালো থাকুন।', width / 2, y);
  y += 16;
  ctx.font = '10px "Hind Siliguri", "Noto Serif Bengali", sans-serif';
  ctx.fillText('ওষুধ সরাসরি আলো ও শিশুদের নাগালের বাইরে রাখুন।', width / 2, y);
  y += 16;
  if (sale.has_antibiotic) {
    ctx.font = 'bold 10px "Hind Siliguri", "Noto Serif Bengali", sans-serif';
    ctx.fillText('সতর্কতা: চিকিৎসকের পরামর্শে পুরো কোর্স শেষ করুন।', width / 2, y);
    y += 16;
  }
  ctx.font = '9px "Hind Siliguri", "Noto Serif Bengali", sans-serif';
  ctx.fillText('SoftDows দ্বারা তৈরিকৃত, পরিচালিত এবং স্বত্ত্ব নিয়ন্ত্রিত', width / 2, y);

  return canvas;
}

/**
 * Converts a 2D HTML Canvas into 1-bit monochrome ESC/POS "GS v 0" raster commands
 */
export function convertCanvasToEscpos(canvas: HTMLCanvasElement): RasterizedReceipt {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Each horizontal line is packed into bytes (8 dots per byte)
  const widthBytes = Math.ceil(width / 8);
  const bitmapBytesCount = widthBytes * height;

  // ESC/POS header: GS v 0 0 xL xH yL yH
  // GS = 0x1D, v = 0x76, 0 = 0x30, mode = 0x00
  const header = [
    0x1b, 0x40,             // ESC @ (Initialize printer)
    0x1d, 0x76, 0x30, 0x00, // GS v 0 0 (Raster bit image normal mode)
    widthBytes & 0xff,
    (widthBytes >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
  ];

  // Footer: Feed 4 lines and full cut
  const footer = [
    0x1b, 0x64, 0x04,       // ESC d 4 (Feed 4 lines)
    0x1d, 0x56, 0x42, 0x00, // GS V 66 0 (Cut paper)
  ];

  const totalLength = header.length + bitmapBytesCount + footer.length;
  const output = new Uint8Array(totalLength);

  // Copy header
  output.set(header, 0);

  // Pack 1-bit monochrome pixels
  let destIdx = header.length;

  for (let y = 0; y < height; y++) {
    for (let xByte = 0; xByte < widthBytes; xByte++) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = xByte * 8 + bit;
        if (x < width) {
          const pixelIdx = (y * width + x) * 4;
          const r = data[pixelIdx];
          const g = data[pixelIdx + 1];
          const b = data[pixelIdx + 2];
          // Standard ITU-R BT.601 luminance calculation
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          // Thermal printer: 1 = black dot, 0 = white paper
          if (luminance < 140) {
            byteVal |= 1 << (7 - bit);
          }
        }
      }
      output[destIdx++] = byteVal;
    }
  }

  // Copy footer
  output.set(footer, destIdx);

  // Generate sample hex dump for visual inspection in UI
  const hexSample: string[] = [];
  const sampleLimit = Math.min(32, output.length);
  for (let i = 0; i < sampleLimit; i++) {
    hexSample.push(output[i].toString(16).padStart(2, '0').toUpperCase());
  }

  return {
    canvas,
    widthDots: width,
    heightDots: height,
    widthBytes,
    escposBytes: output,
    hexDumpSample: hexSample.join(' ') + ' ...',
  };
}
