/**
 * Navbar - Clean, Pure Bengali Navigation adhering to Top Bar Contract
 * No excessive horizontal scrollbars, no mixed English labels.
 */

import React from 'react';
import { ShoppingCart, Package, ShieldCheck, Smartphone, Code2, WifiOff } from 'lucide-react';
import { toBengaliNumber } from '../services/unitCalculator';

export type ActiveTab = 'pos' | 'inventory' | 'dgda' | 'lan_crdt' | 'docs';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, cartCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs font-bangla">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-16">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
            ব
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 leading-tight">
              বোরিবক্স <span className="text-xs font-normal text-slate-400 font-sans">BoriBox</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              সহজ ফার্মেসি সফটওয়্যার
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean Bengali, no horizontal scroll) */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors shrink-0 ${
              activeTab === 'pos'
                ? 'bg-sky-100/70 text-sky-800 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-sky-600" />
            <span>ক্যাশ কাউন্টার</span>
            {cartCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-xs rounded-full bg-sky-600 text-white font-bold font-mono">
                {toBengaliNumber(cartCount)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-sky-100/70 text-sky-800 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-600" />
            <span>ওষুধের স্টক</span>
          </button>

          <button
            onClick={() => setActiveTab('dgda')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors shrink-0 ${
              activeTab === 'dgda'
                ? 'bg-sky-100/70 text-sky-800 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span>প্রেসক্রিপশন রেজিস্টার</span>
          </button>

          <button
            onClick={() => setActiveTab('lan_crdt')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors shrink-0 ${
              activeTab === 'lan_crdt'
                ? 'bg-sky-100/70 text-sky-800 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>মোবাইল ও ব্যাকআপ</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors shrink-0 ${
              activeTab === 'docs'
                ? 'bg-sky-100/70 text-sky-800 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-4 h-4 text-amber-600" />
            <span>সফটওয়্যার কোড</span>
          </button>
        </nav>

        {/* Zone 3: Offline status & New Sale button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
            <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
            <span>অফলাইন মোড</span>
          </div>

          <button
            onClick={() => setActiveTab('pos')}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
          >
            নতুন বিক্রয়
          </button>
        </div>
      </div>

      {/* Clean Mobile Tabs without horizontal scrolling */}
      <div className="md:hidden grid grid-cols-5 border-t border-slate-200 bg-slate-50/90 text-center text-xs py-1.5 px-2 gap-1 font-bangla">
        <button
          onClick={() => setActiveTab('pos')}
          className={`py-1 rounded ${activeTab === 'pos' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`}
        >
          কাউন্টার
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-1 rounded ${activeTab === 'inventory' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`}
        >
          স্টক
        </button>
        <button
          onClick={() => setActiveTab('dgda')}
          className={`py-1 rounded ${activeTab === 'dgda' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`}
        >
          রেজিস্টার
        </button>
        <button
          onClick={() => setActiveTab('lan_crdt')}
          className={`py-1 rounded ${activeTab === 'lan_crdt' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`}
        >
          মোবাইল
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`py-1 rounded ${activeTab === 'docs' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`}
        >
          কোড
        </button>
      </div>
    </header>
  );
};
