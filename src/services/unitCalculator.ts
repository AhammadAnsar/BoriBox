/**
 * Unit Calculator service for BoriBox
 * Handles multi-level unit calculations: Box, Strip, Piece.
 * Base Unit is always 'Piece'.
 */

import { Product, UnitType } from '../types/pharmacy';

export interface UnitBreakdown {
  boxes: number;
  strips: number;
  pieces: number;
  formattedBengali: string;
}

/**
 * Converts a quantity in a specific unit to total pieces.
 */
export function convertToPieces(
  quantity: number,
  unit: UnitType,
  product: Product
): number {
  if (quantity <= 0) return 0;
  
  switch (unit) {
    case 'box':
      return quantity * product.pieces_per_box;
    case 'strip':
      return quantity * product.pieces_per_strip;
    case 'piece':
    default:
      return quantity;
  }
}

/**
 * Given a total piece count, breaks down into (Boxes, Strips, Pieces)
 * Example: 105 pieces where strip=10, box=10 strips (100 pieces):
 * -> 1 Box, 0 Strip, 5 Pieces
 */
export function breakdownPieces(totalPieces: number, product: Product): UnitBreakdown {
  if (totalPieces <= 0) {
    return {
      boxes: 0,
      strips: 0,
      pieces: 0,
      formattedBengali: '০ পিস',
    };
  }

  const piecesPerBox = product.pieces_per_box || (product.pieces_per_strip * product.strips_per_box);
  const piecesPerStrip = product.pieces_per_strip || 1;

  const boxes = Math.floor(totalPieces / piecesPerBox);
  const remainderAfterBoxes = totalPieces % piecesPerBox;

  const strips = Math.floor(remainderAfterBoxes / piecesPerStrip);
  const pieces = remainderAfterBoxes % piecesPerStrip;

  const parts: string[] = [];
  if (boxes > 0) parts.push(`${toBengaliNumber(boxes)} বক্স`);
  if (strips > 0) parts.push(`${toBengaliNumber(strips)} পাতা`);
  if (pieces > 0 || parts.length === 0) parts.push(`${toBengaliNumber(pieces)} পিস`);

  return {
    boxes,
    strips,
    pieces,
    formattedBengali: parts.join(', '),
  };
}

/**
 * Get the unit price based on selected unit
 */
export function getUnitPrice(product: Product, unit: UnitType): number {
  switch (unit) {
    case 'box':
      return product.mrp_per_box;
    case 'strip':
      return product.mrp_per_strip;
    case 'piece':
    default:
      return product.mrp_per_piece;
  }
}

/**
 * Converts English digits to Bengali digits
 */
export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

/**
 * Bengali Unit Labels
 */
export const UNIT_LABELS: Record<UnitType, { bn: string; en: string }> = {
  box: { bn: 'বক্স', en: 'Box' },
  strip: { bn: 'পাতা', en: 'Strip' },
  piece: { bn: 'পিস', en: 'Piece' },
};
