/**
 * POS Cash Counter (ক্যাশ কাউন্টার)
 * সহজ, পরিচ্ছন্ন ও আরামদায়ক ফার্মেসি ক্যাশ কাউন্টার।
 * কিবোর্ড (F1, F2, F3, F4, Enter) ও মাউস দিয়ে সহজে ব্যবহারযোগ্য।
 * কোনো অতিরিক্ত স্ক্রলবার বা অপ্রয়োজনীয় ইংরেজি মিক্স ছাড়া পরিষ্কার বাংলা ইন্টারফেস।
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Trash2,
  Printer,
  ShieldAlert,
  Plus,
  Minus,
  Banknote,
  Smartphone,
  CreditCard,
  Check,
  User,
  Zap,
} from 'lucide-react';
import {
  Product,
  StockBatch,
  CartItem,
  UnitType,
  SaleTransaction,
  PrescriptionDetails,
  PharmacyProfile,
} from '../../types/pharmacy';
import {
  convertToPieces,
  breakdownPieces,
  getUnitPrice,
  toBengaliNumber,
} from '../../services/unitCalculator';
import { allocateStockFEFO, analyzeExpiry } from '../../services/fefoEngine';
import { searchMedicinesWithTrigram } from '../../services/trigramSearch';
import { DgdaPrescriptionModal } from './DgdaPrescriptionModal';
import { ThermalPrintModal } from './ThermalPrintModal';

interface PosCashCounterProps {
  products: Product[];
  batches: StockBatch[];
  onCompleteSale: (sale: SaleTransaction) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  pharmacyProfile?: PharmacyProfile;
}

export const PosCashCounter: React.FC<PosCashCounterProps> = ({
  products,
  batches,
  onCompleteSale,
  cart,
  setCart,
  pharmacyProfile,
}) => {
  // Search & Filter state (powered by SQLite FTS5 Trigram Search)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<Product[]>(products);
  const [isSearching, setIsSearching] = useState(false);

  // Cart & Keyboard Navigation state
  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(-1);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'CARD'>('CASH');

  // Customer state (dynamic, real inputs - never dummy/hardcoded)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Modals
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionDetails | undefined>();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);

  // Focus refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Audio beep
  const playBeep = (freq = 1900, duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Audio not supported or blocked
    }
  };

  // Query medicines via SQLite FTS5 Trigram Engine
  useEffect(() => {
    let active = true;
    setIsSearching(true);
    searchMedicinesWithTrigram(searchQuery, products, selectedCategory)
      .then((res) => {
        if (active) {
          setSearchResults(res);
          setHighlightedIndex(0);
          setIsSearching(false);
        }
      })
      .catch(() => {
        if (active) setIsSearching(false);
      });
    return () => {
      active = false;
    };
  }, [searchQuery, products, selectedCategory]);

  // Global keyboard shortcut event listeners (Complete Mouse-Free POS Workflow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) {
          if (activeEl === cashInputRef.current) {
            handleCheckout();
          } else {
            cashInputRef.current?.focus();
            cashInputRef.current?.select();
          }
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsPrescriptionModalOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          if (confirm('আপনি কি কার্টের সমস্ত ওষুধ মুছে ফেলতে চান?')) {
            setCart([]);
            setSelectedCartIndex(-1);
          }
        }
      } else if (e.key === 'Escape') {
        setIsPrescriptionModalOpen(false);
        setIsPrintModalOpen(false);
      } else if (!isInput && cart.length > 0) {
        // Global cart keyboard navigation when not focused in an input
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCartIndex((prev) => (prev < cart.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCartIndex((prev) => (prev > 0 ? prev - 1 : cart.length - 1));
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          if (selectedCartIndex >= 0 && cart[selectedCartIndex]) {
            updateCartItemQty(cart[selectedCartIndex].id, 1);
            playBeep(2100, 0.05);
          }
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          if (selectedCartIndex >= 0 && cart[selectedCartIndex]) {
            updateCartItemQty(cart[selectedCartIndex].id, -1);
            playBeep(1800, 0.05);
          }
        } else if (e.key === 'u' || e.key === 'U' || e.key === ' ') {
          e.preventDefault();
          if (selectedCartIndex >= 0 && cart[selectedCartIndex]) {
            const currentItem = cart[selectedCartIndex];
            const units: UnitType[] = ['box', 'strip', 'piece'];
            const nextIdx = (units.indexOf(currentItem.selected_unit) + 1) % units.length;
            updateCartItemUnit(currentItem.id, units[nextIdx]);
            playBeep(2300, 0.06);
          }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          if (selectedCartIndex >= 0 && cart[selectedCartIndex]) {
            removeCartItem(cart[selectedCartIndex].id);
            setSelectedCartIndex((prev) => Math.max(0, prev - 1));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCartIndex, setCart]);

  // Available pieces helper
  const getProductAvailablePieces = (productId: string) => {
    return batches
      .filter((b) => b.product_id === productId)
      .reduce((acc, curr) => acc + curr.available_pieces, 0);
  };

  // Search input keydown
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const exactBarcode = products.find((p) => p.barcode_gtin === searchQuery.trim());
      if (exactBarcode) {
        addToCart(exactBarcode, 'strip', 1);
        setSearchQuery('');
        setSelectedCartIndex(0);
        playBeep(2200, 0.1);
        return;
      }
      if (searchResults.length > 0 && searchResults[highlightedIndex]) {
        addToCart(searchResults[highlightedIndex], 'strip', 1);
        setSearchQuery('');
        setSelectedCartIndex(0);
        playBeep(2000, 0.08);
      }
    }
  };

  // Add to cart
  const addToCart = (product: Product, unit: UnitType, qty = 1) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const productBatches = batches.filter((b) => b.product_id === product.id);

    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      const newQty = existing.quantity + qty;
      const totalPieces = convertToPieces(newQty, existing.selected_unit, product);
      const fefoResult = allocateStockFEFO(productBatches, totalPieces);
      const unitPrice = getUnitPrice(product, existing.selected_unit);
      const totalPrice = newQty * unitPrice;

      const updated = [...cart];
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        total_pieces: totalPieces,
        unit_price: unitPrice,
        total_price: totalPrice,
        final_price: totalPrice * (1 - existing.discount_percent / 100),
        allocated_batches: fefoResult.allocatedBatches,
      };
      setCart(updated);
    } else {
      const totalPieces = convertToPieces(qty, unit, product);
      const fefoResult = allocateStockFEFO(productBatches, totalPieces);
      const unitPrice = getUnitPrice(product, unit);
      const totalPrice = qty * unitPrice;

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${product.id}`,
        product,
        selected_unit: unit,
        quantity: qty,
        total_pieces: totalPieces,
        unit_price: unitPrice,
        total_price: totalPrice,
        discount_percent: 0,
        final_price: totalPrice,
        allocated_batches: fefoResult.allocatedBatches,
      };
      setCart([newItem, ...cart]);
    }
  };

  // Unit update
  const updateCartItemUnit = (cartId: string, newUnit: UnitType) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartId) return item;
        const totalPieces = convertToPieces(item.quantity, newUnit, item.product);
        const productBatches = batches.filter((b) => b.product_id === item.product.id);
        const fefoResult = allocateStockFEFO(productBatches, totalPieces);
        const unitPrice = getUnitPrice(item.product, newUnit);
        const totalPrice = item.quantity * unitPrice;

        return {
          ...item,
          selected_unit: newUnit,
          total_pieces: totalPieces,
          unit_price: unitPrice,
          total_price: totalPrice,
          final_price: totalPrice * (1 - item.discount_percent / 100),
          allocated_batches: fefoResult.allocatedBatches,
        };
      })
    );
  };

  // Qty update
  const updateCartItemQty = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== cartId) return item;
          const newQty = Math.max(1, item.quantity + delta);
          const totalPieces = convertToPieces(newQty, item.selected_unit, item.product);
          const productBatches = batches.filter((b) => b.product_id === item.product.id);
          const fefoResult = allocateStockFEFO(productBatches, totalPieces);
          const totalPrice = newQty * item.unit_price;

          return {
            ...item,
            quantity: newQty,
            total_pieces: totalPieces,
            total_price: totalPrice,
            final_price: totalPrice * (1 - item.discount_percent / 100),
            allocated_batches: fefoResult.allocatedBatches,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartId));
  };

  // Financials
  const subtotal = cart.reduce((sum, item) => sum + item.final_price, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const netPayable = Math.max(0, subtotal - discountAmount);
  const paidVal = parseFloat(paidAmount) || 0;
  const changeDue = Math.max(0, paidVal - netPayable);

  // Antibiotics check
  const cartAntibiotics = cart.filter((item) => item.product.is_antibiotic);
  const hasAntibioticInCart = cartAntibiotics.length > 0;

  // Checkout (All customer and prescription fields are optional for fast rush-hour checkout)
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const effectivePaid = paidVal > 0 ? paidVal : netPayable;
    const saleTransaction: SaleTransaction = {
      id: `sale-${Date.now()}`,
      invoice_number: `ইনভয়েস-${new Date().getFullYear()}${String(Date.now()).slice(-5)}`,
      timestamp: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discount_amount: discountAmount,
      tax_amount: 0,
      net_payable: netPayable,
      paid_amount: effectivePaid,
      change_returned: Math.max(0, effectivePaid - netPayable),
      payment_method: paymentMethod,
      customer_name: customerName.trim() || undefined,
      customer_phone: customerPhone.trim() || undefined,
      has_antibiotic: hasAntibioticInCart,
      prescription: prescriptionData,
      cashier_name: 'ফার্মাসিস্ট',
      crdt_hlc: `${Date.now().toString(36)}-0-DESKTOP_MAIN`,
    };

    onCompleteSale(saleTransaction);
    setLastCompletedSale(saleTransaction);
    setIsPrintModalOpen(true);
    setCart([]);
    setPaidAmount('');
    setCustomerName('');
    setCustomerPhone('');
    setPrescriptionData(undefined);
    playBeep(1200, 0.15);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4 font-bangla">
      {/* Antibiotic warning alert (Information is strictly optional) */}
      {hasAntibioticInCart && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-950">
                কার্টে অ্যান্টিবায়োটিক রয়েছে (তথ্য ঐচ্ছিক)
              </p>
              <p className="text-[11px] text-amber-700">
                ভীড়ের মধ্যে তথ্য দেয়া সম্ভব না হলে সরাসরি বিল করতে পারবেন; নাম ও BMDC বাধ্যতামূলক নয়।
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPrescriptionModalOpen(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
              prescriptionData
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
            }`}
          >
            {prescriptionData ? '✓ প্রেসক্রিপশন সংরক্ষিত' : 'প্রেসক্রিপশন দিন (ঐচ্ছিক F3)'}
          </button>
        </div>
      )}

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Search & Medicine List (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Search Box */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 pb-0.5">
              <div className="flex items-center gap-1.5 font-medium text-sky-800">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>SQLite FTS5 Trigram সার্চ ইঞ্জিন সক্রিয় (&lt;১ms)</span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                {searchResults.length > 0 ? `${toBengaliNumber(searchResults.length)} টি ম্যাচ` : 'কোনো ফলাফল নেই'}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="ওষুধের নাম লিখুন অথবা বারকোড স্ক্যান করুন..."
                className="w-full pl-9 pr-14 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-sans"
                autoFocus
              />
              <span className="absolute right-2.5 top-2.5 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                F1
              </span>
            </div>

            {/* Clean category buttons without horizontal scrolling */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'ALL', label: 'সব ওষুধ' },
                { id: 'OTC', label: 'সাধারণ ওষুধ' },
                { id: 'ANTIBIOTIC', label: 'অ্যান্টিবায়োটিক' },
                { id: 'PRESCRIPTION', label: 'প্রেসক্রিপশন প্রয়োজন' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1 rounded-md transition-colors font-medium ${
                    selectedCategory === tab.id
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medicine List */}
          <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-0.5">
            {searchResults.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                কোনো ওষুধ পাওয়া যায়নি। ওষুধের নাম বা জেনেরিক নাম লিখে খুঁজুন।
              </div>
            ) : (
              searchResults.map((prod, index) => {
                const totalPieces = getProductAvailablePieces(prod.id);
                const breakdown = breakdownPieces(totalPieces, prod);
                const isSelected = highlightedIndex === index;

                // Check earliest expiring batch
                const prodBatches = batches.filter((b) => b.product_id === prod.id);
                const sorted = [...prodBatches].sort(
                  (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
                );
                const nextExpiringBatch = sorted[0];
                const expiryInfo = nextExpiringBatch ? analyzeExpiry(nextExpiringBatch.expiry_date) : null;

                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setHighlightedIndex(index);
                      addToCart(prod, 'strip', 1);
                      playBeep(2100, 0.08);
                    }}
                    className={`p-3 bg-white rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 font-sans truncate">
                          {prod.brand_name}
                        </span>
                        {prod.is_antibiotic && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-rose-100 text-rose-800 shrink-0">
                            অ্যান্টিবায়োটিক
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 font-sans truncate mt-0.5">
                        {prod.generic_name} · {prod.manufacturer}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          মজুদ: {breakdown.formattedBengali}
                        </span>

                        {expiryInfo && expiryInfo.status !== 'HEALTHY' && (
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${expiryInfo.badgeClass}`}>
                            {expiryInfo.labelBengali}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Unit Buttons */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-slate-400">প্রতি পাতা: </span>
                        <span className="text-sm font-bold font-mono text-slate-900">
                          ৳ {toBengaliNumber(prod.mrp_per_strip.toFixed(2))}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => addToCart(prod, 'box', 1)}
                          className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 rounded transition-colors"
                        >
                          +বক্স
                        </button>
                        <button
                          onClick={() => addToCart(prod, 'strip', 1)}
                          className="px-2 py-1 text-xs font-semibold bg-sky-100 hover:bg-sky-600 hover:text-white text-sky-800 rounded transition-colors"
                        >
                          +পাতা
                        </button>
                        <button
                          onClick={() => addToCart(prod, 'piece', 1)}
                          className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 rounded transition-colors"
                        >
                          +পিস
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Cart & Billing (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            {/* Cart Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {pharmacyProfile?.logo_url ? (
                  <img
                    src={pharmacyProfile.logo_url}
                    alt={pharmacyProfile.pharmacy_name || 'লোগো'}
                    className="w-7 h-7 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                  />
                ) : null}
                <span className="font-bold text-sm text-slate-900 truncate">
                  {pharmacyProfile?.pharmacy_name ? `${pharmacyProfile.pharmacy_name} · ` : ''}বিক্রয় ({toBengaliNumber(cart.length)})
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('কার্ট খালি করতে চান?')) setCart([]);
                  }}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>খালি করুন (F4)</span>
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="p-3 max-h-[38vh] overflow-y-auto space-y-2.5 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  কার্টে কোনো ওষুধ নেই। ওষুধ খুঁজতে <strong>F1</strong> চাপুন।
                </div>
              ) : (
                cart.map((item, index) => {
                  const isCartSelected = selectedCartIndex === index;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCartIndex(index)}
                      className={`pt-2.5 pb-2 px-2.5 rounded-lg transition-all flex flex-col gap-1.5 cursor-pointer ${
                        isCartSelected
                          ? 'bg-sky-50/70 border border-sky-300 ring-1 ring-sky-400/40'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 font-sans">
                              {item.product.brand_name}
                            </span>
                            {isCartSelected && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-600 text-white font-medium">
                                সক্রিয়
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-sans">
                            {item.product.generic_name} · {item.product.dosage_form}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-slate-900">
                            ৳ {toBengaliNumber(item.final_price.toFixed(2))}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            একক: ৳ {toBengaliNumber(item.unit_price.toFixed(2))}
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Unit Dropdown & Quantity */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        {/* Unit Select Dropdown */}
                        <div className="flex items-center gap-1">
                          <select
                            value={item.selected_unit}
                            onChange={(e) => updateCartItemUnit(item.id, e.target.value as UnitType)}
                            className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                          >
                            <option value="box">বক্স (Box)</option>
                            <option value="strip">পাতা (Strip)</option>
                            <option value="piece">পিস (Piece)</option>
                          </select>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            (= {toBengaliNumber(item.total_pieces)} পিস)
                          </span>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartItemQty(item.id, -1);
                            }}
                            title="পরিমাণ কমান (-)"
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold font-mono text-slate-800">
                            {toBengaliNumber(item.quantity)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartItemQty(item.id, 1);
                            }}
                            title="পরিমাণ বাড়ান (+)"
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCartItem(item.id);
                            }}
                            title="মুছে ফেলুন (Del)"
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors ml-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Batch & FEFO Info */}
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-slate-100">
                        <span className="font-medium text-slate-600">FEFO ব্যাচ:</span>
                        {item.allocated_batches.map((b, i) => (
                          <span key={i} className="font-mono text-slate-700">
                            {b.batch_number} ({toBengaliNumber(b.pieces_deducted)} পিস){i < item.allocated_batches.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex flex-col gap-3">
              {/* Customer Information (Optional - Real input, no dummy data) */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col gap-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    <span>ক্রেতার তথ্য (ঐচ্ছিক)</span>
                    <span className="text-[10px] font-normal text-slate-400">· ভীড়ে খালি রাখুন</span>
                  </div>
                  {(customerName || customerPhone) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName('');
                        setCustomerPhone('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-normal transition-colors"
                    >
                      মুছুন
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="ক্রেতার নাম (ঐচ্ছিক)..."
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-colors"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="মোবাইল নম্বর (ঐচ্ছিক)..."
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-4 gap-1 text-xs">
                {[
                  { id: 'CASH', label: 'ক্যাশ', icon: Banknote },
                  { id: 'BKASH', label: 'বিকাশ', icon: Smartphone },
                  { id: 'NAGAD', label: 'নগদ', icon: Smartphone },
                  { id: 'CARD', label: 'কার্ড', icon: CreditCard },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-1.5 px-1 rounded-md border text-center transition-colors ${
                      paymentMethod === m.id
                        ? 'bg-sky-600 text-white border-sky-600 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>মোট দাম:</span>
                  <span className="font-mono font-medium">৳ {toBengaliNumber(subtotal.toFixed(2))}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    ছাড় (%):
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 text-xs border border-slate-300 rounded text-right font-mono"
                    />
                  </span>
                  <span className="font-mono text-emerald-700">
                    - ৳ {toBengaliNumber(discountAmount.toFixed(2))}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="font-mono text-base text-sky-800">
                    ৳ {toBengaliNumber(netPayable.toFixed(2))}
                  </span>
                </div>

                {/* Cash In & Change */}
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">জমা টাকা (Enter চেপে বিল):</label>
                    <input
                      ref={cashInputRef}
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCheckout();
                        }
                      }}
                      placeholder={netPayable > 0 ? netPayable.toFixed(0) : '০'}
                      className="w-full px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ফেরত টাকা:</label>
                    <div className="w-full px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg text-emerald-700">
                      ৳ {toBengaliNumber(changeDue.toFixed(2))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete sale button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  cart.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>বিল সম্পন্ন করুন (F2 / Enter)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Keyboard Shortcuts Bar (Mouse-free POS Guide) */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-slate-800">কীবোর্ড শর্টকাট:</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px]">F1</kbd> সার্চ ফোকাস</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px]">F2</kbd> বিল / ক্যাশ জমা</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px]">↑/↓</kbd> কার্ট নেভিগেশন</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px]">+ / -</kbd> পরিমাণ পরিবর্তন</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px]">U</kbd> একক (বক্স/পাতা/পিস)</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px]">Del</kbd> আইটেম মুছুন</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px]">F4</kbd> কার্ট খালি</span>
        </div>
        <div className="text-[11px] text-sky-800 font-medium">
          বোরিবক্স মাউস-লেস পিওএস
        </div>
      </div>

      {/* Prescription Modal */}
      <DgdaPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        onSave={(data) => {
          setPrescriptionData(data);
          if (data.patient_name && !customerName) {
            setCustomerName(data.patient_name);
          }
          if (data.patient_phone && !customerPhone) {
            setCustomerPhone(data.patient_phone);
          }
          setIsPrescriptionModalOpen(false);
        }}
        initialData={
          prescriptionData || (customerName.trim() ? {
            patient_name: customerName.trim(),
            patient_phone: customerPhone.trim(),
            patient_age: 0,
            patient_gender: 'Male',
            doctor_name: '',
            doctor_bmdc_reg: '',
            hospital_clinic: '',
            prescription_date: new Date().toISOString().split('T')[0],
            indication: '',
          } : undefined)
        }
        antibioticNames={cartAntibiotics.map((i) => i.product.brand_name)}
      />

      {/* Thermal Print Modal */}
      <ThermalPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        sale={lastCompletedSale}
        pharmacyProfile={pharmacyProfile}
      />
    </div>
  );
};
