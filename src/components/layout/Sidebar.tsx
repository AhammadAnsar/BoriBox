/**
 * Sidebar.tsx
 * BoriBox Human-Centric Minimalist Navigation
 * 
 * Features:
 * - Collapsible Sidebar: Smooth toggle button to minimize to w-20 / expand to w-64.
 * - Persistent Collapse Preference: Stored in localStorage.
 * - Dynamic Pharmacy Logo: Renders uploaded logo or custom initial.
 * - SoftDows Official Branding: "SoftDows দ্বারা তৈরিকৃত, পরিচালিত এবং স্বত্ত্ব নিয়ন্ত্রিত"
 * - Strict Language Policy: Pure Bengali UI text (No mixing).
 * - Short naming: Max 1-2 words per module paired with clean modern icons.
 * - Palette: Soft Blue / Mint Green / White with Dark Grey text.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  PieChart,
  ClipboardList,
  RefreshCw,
  Sliders,
  FileCode2,
  CheckCircle2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { toBengaliNumber } from '../../services/unitCalculator';
import { UserRole } from '../../types/pharmacy';

export type NavTab = 'dashboard' | 'pos' | 'inventory' | 'accounts' | 'dgda' | 'lan_crdt' | 'settings' | 'docs';

export interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  cartCount: number;
  criticalExpiryCount: number;
  todaySalesCount: number;
  currentUserRole?: UserRole;
  currentUserName?: string;
  pharmacyLogo?: string;
  pharmacyName?: string;
  onLogout?: () => void;
  onRerunOnboarding?: () => void;
  isCollapsedProp?: boolean;
  onToggleCollapseProp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  criticalExpiryCount,
  currentUserRole = 'SUPER_ADMIN',
  currentUserName = 'ফার্মাসিস্ট সাব্বির',
  pharmacyLogo,
  pharmacyName = 'বোরিবক্স',
  onLogout,
  isCollapsedProp,
  onToggleCollapseProp,
}) => {
  // Collapsible Sidebar State (Remembers state in localStorage)
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('boribox_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : internalCollapsed;

  const toggleSidebar = () => {
    if (onToggleCollapseProp) {
      onToggleCollapseProp();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem('boribox_sidebar_collapsed', String(next));
      } catch {}
    }
  };

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'ড্যাশবোর্ড',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pos' as NavTab,
      label: 'বিক্রয়',
      icon: ShoppingCart,
      badge: cartCount > 0 ? toBengaliNumber(cartCount) : null,
      badgeColor: 'bg-sky-600 text-white',
    },
    {
      id: 'inventory' as NavTab,
      label: 'মজুদ',
      icon: Boxes,
      badge: criticalExpiryCount > 0 ? toBengaliNumber(criticalExpiryCount) : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'accounts' as NavTab,
      label: 'হিসাব',
      icon: PieChart,
      badge: null,
    },
    {
      id: 'dgda' as NavTab,
      label: 'রেজিস্টার',
      icon: ClipboardList,
      badge: null,
    },
    {
      id: 'lan_crdt' as NavTab,
      label: 'সিঙ্ক',
      icon: RefreshCw,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'সেটিংস',
      icon: Sliders,
      badge: null,
    },
    {
      id: 'docs' as NavTab,
      label: 'ডকুমেন্টস',
      icon: FileCode2,
      badge: null,
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col shrink-0 h-screen sticky top-0 font-bangla select-none z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header with Dynamic Pharmacy Logo & Collapse Button */}
      <div className={`p-3.5 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
          {pharmacyLogo ? (
            <img
              src={pharmacyLogo}
              alt={pharmacyName}
              className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200/90 p-0.5 shadow-2xs shrink-0"
              title={pharmacyName}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0"
              title={pharmacyName}
            >
              {pharmacyName ? pharmacyName.charAt(0) : 'ব'}
            </div>
          )}

          {!isCollapsed && (
            <div className="min-w-0 flex-1 animate-in fade-in duration-200">
              <h1 className="text-sm font-bold text-slate-900 leading-snug truncate" title={pharmacyName}>
                {pharmacyName}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">অফলাইন সক্রিয়</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Toggle Minimize/Expand Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={`p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0 ${
            isCollapsed ? 'mt-2' : ''
          }`}
          title={isCollapsed ? 'সাইডবার প্রসারিত করুন' : 'সাইডবার সংকুচিত করুন'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-sky-600" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 tracking-wider animate-in fade-in duration-150">
            মেনু
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`w-full flex items-center rounded-xl transition-all relative ${
                isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-sky-50 text-sky-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-sky-600' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && (
                  <span className="text-xs truncate animate-in fade-in duration-200">
                    {item.label}
                  </span>
                )}
              </div>

              {/* Badges */}
              {item.badge && (
                isCollapsed ? (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                ) : (
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-full font-mono font-bold ${
                      item.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session */}
      <div className={`p-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
        <div
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity ${isCollapsed ? 'justify-center' : 'flex-1'}`}
          title={`${currentUserName} (${currentUserRole === 'SUPER_ADMIN' ? 'সুপার এডমিন' : 'ক্যাশিয়ার'})`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              currentUserRole === 'SUPER_ADMIN'
                ? 'bg-sky-100 text-sky-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {currentUserName ? currentUserName.charAt(0) : 'স'}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-200">
              <div className="text-xs font-bold text-slate-900 truncate">
                {currentUserName}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {currentUserRole === 'SUPER_ADMIN' ? 'সুপার এডমিন' : 'ক্যাশিয়ার'}
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-colors shrink-0 border border-transparent hover:border-slate-200"
            title="লগআউট"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* SoftDows Official Ownership & Branding */}
      <div className="px-2 py-2 bg-slate-100/80 border-t border-slate-200/70 text-center">
        {isCollapsed ? (
          <span
            className="text-[10px] font-bold text-sky-800 font-mono"
            title="SoftDows দ্বারা তৈরিকৃত, পরিচালিত এবং স্বত্ত্ব নিয়ন্ত্রিত"
          >
            SD
          </span>
        ) : (
          <p className="text-[10px] text-slate-500 font-medium leading-normal tracking-tight animate-in fade-in duration-200">
            SoftDows দ্বারা তৈরিকৃত, পরিচালিত এবং স্বত্ত্ব নিয়ন্ত্রিত
          </p>
        )}
      </div>
    </aside>
  );
};
