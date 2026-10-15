/**
 * Mobile POS Counter (মোবাইল ক্যাশ কাউন্টার)
 * দোকানের স্মার্টফোনে দ্রুত বিক্রির জন্য টাচ-ফ্রেন্ডলি ইন্টারফেস।
 * লোকাল ওয়াইফাই বা হটস্পটের মাধ্যমে মেইন কম্পিউটারের সাথে স্বয়ংক্রিয়ভাবে সিঙ্ক হয়।
 */

import React, { useState } from 'react';
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Smartphone,
  Wifi,
  ChevronRight,
  ArrowLeft,
  Printer,
} from 'lucide-react';
import { Product, StockBatch, CartItem, UnitType, SaleTransaction } from '../../types/pharmacy';
import { convertToPieces, breakdownPieces, getUnitPrice, toBengaliNumber } from '../../services/unitCalculator';
import { allocateStockFEFO, analyzeExpiry } from '../../services/fefoEngine';

interface MobilePosViewProps {
  products: Product[];
  batches: StockBatch[];
  onCompleteSale: (sale: SaleTransaction) => void;
  onExitMobileView?: () => void;
}

export const MobilePosView: React.FC<MobilePosViewProps> = ({
  products,
  batches,
  onCompleteSale,
  onExitMobileView,
}) => {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Audio beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Audio autoplay restrictions
    }
  };

  const getProductAvailablePieces = (productId: string) => {
    return batches
      .filter((b) => b.product_id === productId)
      .reduce((acc, curr) => acc + curr.available_pieces, 0);
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      p.brand_name.toLowerCase().includes(q) ||
      p.generic_name.toLowerCase().includes(q) ||
      p.barcode_gtin.includes(q)
    );
  });

  const addToCart = (product: Product, unit: UnitType, qty = 1) => {
    const existingIndex = cart.findIndex((i) => i.product.id === product.id);
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
        final_price: totalPrice,
        allocated_batches: fefoResult.allocatedBatches,
      };
      setCart(updated);
    } else {
      const totalPieces = convertToPieces(qty, unit, product);
      const fefoResult = allocateStockFEFO(productBatches, totalPieces);
      const unitPrice = getUnitPrice(product, unit);
      const totalPrice = qty * unitPrice;

      const newItem: CartItem = {
        id: `m-cart-${Date.now()}-${product.id}`,
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
    playBeep();
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const newQty = Math.max(1, i.quantity + delta);
          const totalPieces = convertToPieces(newQty, i.selected_unit, i.product);
          const productBatches = batches.filter((b) => b.product_id === i.product.id);
          const fefoResult = allocateStockFEFO(productBatches, totalPieces);
          return {
            ...i,
            quantity: newQty,
            total_pieces: totalPieces,
            total_price: newQty * i.unit_price,
            final_price: newQty * i.unit_price,
            allocated_batches: fefoResult.allocatedBatches,
          };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const totalBill = cart.reduce((sum, i) => sum + i.final_price, 0);

  const handleMobileCheckout = () => {
    if (cart.length === 0) return;

    const sale: SaleTransaction = {
      id: `m-sale-${Date.now()}`,
      invoice_number: `ইনভয়েস-M${String(Date.now()).slice(-5)}`,
      timestamp: new Date().toISOString(),
      items: [...cart],
      subtotal: totalBill,
      discount_amount: 0,
      tax_amount: 0,
      net_payable: totalBill,
      paid_amount: totalBill,
      change_returned: 0,
      payment_method: 'CASH',
      customer_name: customerName.trim() || undefined,
      customer_phone: customerPhone.trim() || undefined,
      has_antibiotic: cart.some((i) => i.product.is_antibiotic),
      cashier_name: 'মোবাইল কাউন্টার ১',
      crdt_hlc: `${Date.now().toString(36)}-0-LAN_MOBILE_01`,
    };

    onCompleteSale(sale);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setIsCartOpen(false);
    setSuccessToast(`বিল #${sale.invoice_number} সফলভাবে মেইন কম্পিউটারে সিঙ্ক হয়েছে!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const simulateBarcodeScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Pick random medicine for instant scanner demo
      const randomProd = products[Math.floor(Math.random() * products.length)];
      if (randomProd) {
        addToCart(randomProd, 'strip', 1);
        setSuccessToast(`বারকোড স্ক্যান সফল: ${randomProd.brand_name} যোগ হয়েছে`);
        setTimeout(() => setSuccessToast(null), 2500);
      }
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-bangla border-x border-slate-200 shadow-xl select-none">
      {/* Mobile Top Bar */}
      <header className="bg-sky-600 text-white p-3.5 sticky top-0 z-20 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          {onExitMobileView && (
            <button
              onClick={onExitMobileView}
              className="p-1 hover:bg-sky-700 rounded-lg transition-colors text-sky-100 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-sm font-bold leading-tight">বোরিবক্স মোবাইল কাউন্টার</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-sky-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>ওয়াইফাই সিঙ্ক: 192.168.1.100 (সক্রিয়)</span>
            </div>
          </div>
        </div>

        <button
          onClick={simulateBarcodeScan}
          disabled={isScanning}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold"
        >
          <Barcode className="w-3.5 h-3.5" />
          <span>{isScanning ? 'স্ক্যান হচ্ছে...' : 'ক্যামেরা স্ক্যান'}</span>
        </button>
      </header>

      {/* Success Feedback Alert */}
      {successToast && (
        <div className="m-3 p-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Touch Search Bar */}
      <div className="p-3 bg-white border-b border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ওষুধ খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
          />
        </div>
      </div>

      {/* Product List for Quick Tapping */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto pb-24">
        {filteredProducts.map((prod) => {
          const totalPieces = getProductAvailablePieces(prod.id);
          const breakdown = breakdownPieces(totalPieces, prod);

          return (
            <div
              key={prod.id}
              className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-sm font-sans truncate">
                  {prod.brand_name}
                </div>
                <div className="text-[11px] text-slate-500 font-sans truncate">
                  {prod.generic_name}
                </div>
                <div className="text-[11px] font-semibold text-emerald-800 mt-1">
                  মজুদ: {breakdown.formattedBengali}
                </div>
              </div>

              {/* Touch Add Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => addToCart(prod, 'strip', 1)}
                  className="px-2.5 py-1.5 bg-sky-600 text-white font-bold rounded-lg text-xs shadow-xs active:scale-95 transition-transform"
                >
                  +পাতা
                </button>
                <button
                  onClick={() => addToCart(prod, 'piece', 1)}
                  className="px-2 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs active:scale-95 transition-transform"
                >
                  +পিস
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-200 p-3 shadow-lg z-30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 font-medium">
                {toBengaliNumber(cart.length)} পদ ওষুধ নির্বাচিত
              </div>
              <div className="text-lg font-bold font-mono text-slate-900">
                ৳ {toBengaliNumber(totalBill.toFixed(2))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCartOpen(true)}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                কার্ট ({toBengaliNumber(cart.length)})
              </button>
              <button
                onClick={handleMobileCheckout}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>বিল সম্পন্ন</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl max-w-md w-full mx-auto p-4 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">মোবাইল কার্ট মেমো</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-xs text-slate-500 font-bold px-2 py-1 bg-slate-100 rounded-lg"
              >
                বন্ধ
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 my-2">
              {cart.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 font-sans truncate">
                      {item.product.brand_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.selected_unit === 'box' ? 'বক্স' : item.selected_unit === 'strip' ? 'পাতা' : 'পিস'} · ৳{item.unit_price}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.id, -1)}
                      className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center"
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs font-mono">
                      {toBengaliNumber(item.quantity)}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.id, 1)}
                      className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ক্রেতার নাম (ঐচ্ছিক)..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-bangla"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="মোবাইল (ঐচ্ছিক)..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900">
                <span>সর্বমোট বিল:</span>
                <span className="font-mono text-base text-sky-800">
                  ৳ {toBengaliNumber(totalBill.toFixed(2))}
                </span>
              </div>
              <button
                onClick={handleMobileCheckout}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                ক্যাশ বিল জমা দিন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
