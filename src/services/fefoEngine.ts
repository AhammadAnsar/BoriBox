/**
 * FEFO (First Expire, First Out) Allocation and Expiry Management Engine
 * Automatically allocates stock from batches with earliest expiration date.
 */

import { StockBatch } from '../types/pharmacy';
import { toBengaliNumber } from './unitCalculator';

export interface BatchAllocationResult {
  allocatedBatches: {
    batch_number: string;
    expiry_date: string;
    pieces_deducted: number;
    rack_location: string;
  }[];
  remainingRequestedPieces: number;
  isFullySatisfied: boolean;
}

export type ExpiryStatus = 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'HEALTHY';

export interface ExpiryAnalysis {
  status: ExpiryStatus;
  daysRemaining: number;
  labelBengali: string;
  badgeClass: string;
}

/**
 * Allocates requested pieces across available product batches using FEFO algorithm.
 */
export function allocateStockFEFO(
  availableBatches: StockBatch[],
  piecesRequested: number
): BatchAllocationResult {
  // Filter batches with stock > 0, sort by expiry_date ascending
  const sortedBatches = [...availableBatches]
    .filter((b) => b.available_pieces > 0)
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

  let needed = piecesRequested;
  const allocations: BatchAllocationResult['allocatedBatches'] = [];

  for (const batch of sortedBatches) {
    if (needed <= 0) break;

    const deduct = Math.min(needed, batch.available_pieces);
    allocations.push({
      batch_number: batch.batch_number,
      expiry_date: batch.expiry_date,
      pieces_deducted: deduct,
      rack_location: batch.rack_location,
    });
    needed -= deduct;
  }

  return {
    allocatedBatches: allocations,
    remainingRequestedPieces: needed,
    isFullySatisfied: needed === 0,
  };
}

/**
 * Calculates days until expiry and returns categorized status
 */
export function analyzeExpiry(expiryDateStr: string): ExpiryAnalysis {
  const now = new Date();
  const expiry = new Date(expiryDateStr);
  const diffTime = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'EXPIRED',
      daysRemaining,
      labelBengali: 'মেয়াদ শেষ',
      badgeClass: 'text-red-700 bg-red-50 border border-red-200',
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'CRITICAL',
      daysRemaining,
      labelBengali: `${toBengaliNumber(daysRemaining)} দিন বাকি (জরুরি)`,
      badgeClass: 'text-rose-700 bg-rose-50 border border-rose-200',
    };
  }

  if (daysRemaining <= 90) {
    return {
      status: 'WARNING',
      daysRemaining,
      labelBengali: `${toBengaliNumber(daysRemaining)} দিন বাকি`,
      badgeClass: 'text-amber-700 bg-amber-50 border border-amber-200',
    };
  }

  return {
    status: 'HEALTHY',
    daysRemaining,
    labelBengali: 'মেয়াদ ঠিক আছে',
    badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  };
}
