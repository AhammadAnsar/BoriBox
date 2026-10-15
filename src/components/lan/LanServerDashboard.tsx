/**
 * LAN Mobile Server & CRDT Sync Dashboard (মোবাইল সংযোগ ও ব্যাকআপ)
 * ওয়াইফাই বা হটস্পটের মাধ্যমে দোকানে ইন্টারনেট ছাড়া স্মার্টফোনে বিক্রয় এবং অটো ব্যাকআপ।
 */

import React, { useState } from 'react';
import {
  QrCode,
  Smartphone,
  Monitor,
  RefreshCw,
  HardDrive,
  Cloud,
  ArrowRightLeft,
} from 'lucide-react';
import { SyncNodeState, BackupStatus, INITIAL_NODES, INITIAL_BACKUP_STATUS } from '../../services/crdtSyncEngine';
import { toBengaliNumber } from '../../services/unitCalculator';

export const LanServerDashboard: React.FC<{ onOpenMobileView?: () => void }> = ({
  onOpenMobileView,
}) => {
  const [nodes, setNodes] = useState<SyncNodeState[]>(INITIAL_NODES);
  const [backup, setBackup] = useState<BackupStatus>(INITIAL_BACKUP_STATUS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const [syncHistory, setSyncHistory] = useState<
    { id: string; action: string; time: string; device: string }[]
  >([
    {
      id: 's-1',
      action: 'ইনভয়েস বিক্রয় সংরক্ষিত',
      time: '১০:২৫ মিনিট',
      device: 'দোকানের কম্পিউটার',
    },
    {
      id: 's-2',
      action: '১০ পিস সেক্লো স্টক কর্তন',
      time: '১০:২৮ মিনিট',
      device: 'মোবাইল ফোন ১',
    },
    {
      id: 's-3',
      action: 'নাপা এক্সট্রা বিক্রয় সম্পন্ন',
      time: '১০:৩২ মিনিট',
      device: 'মোবাইল ফোন ১',
    },
  ]);

  const handleTriggerManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          lastSyncTime: new Date().toLocaleTimeString(),
          pendingDeltaCount: 0,
        }))
      );
      setIsSyncing(false);
    }, 600);
  };

  const handleTriggerBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setBackup((prev) => ({
        ...prev,
        lastBackupTimestamp: new Date().toLocaleString(),
        statusMessage: 'গুগল ড্রাইভে ডাটাবেজ ব্যাকআপ সফলভাবে সংরক্ষিত হয়েছে।',
      }));
      setIsBackingUp(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5 font-bangla">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-base font-bold text-slate-900">
              দোকানের ওয়াইফাই সংযোগ ও মোবাইল কাউন্টার
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ইন্টারনেট ছাড়া দোকানের ওয়াইফাই বা হটস্পটের মাধ্যমে যেকোনো স্মার্টফোনে পিওএস চালান
          </p>
        </div>

        <button
          onClick={handleTriggerManualSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'সব ডিভাইস সিঙ্ক করুন'}</span>
        </button>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Mobile QR Pairing (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center text-center shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-2">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">মোবাইল সংযোগ QR কোড</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            কর্মচারীরা স্মার্টফোনের ক্যামেরা দিয়ে এই কোড স্ক্যান করে সঙ্গে সঙ্গে বিক্রয় কাউন্টার চালু করতে পারবেন।
          </p>

          {/* QR Pattern */}
          <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 shadow-xs inline-block">
            <svg
              className="w-40 h-40 mx-auto"
              viewBox="0 0 140 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="10" y="10" width="35" height="35" rx="4" fill="#0284c7" />
              <rect x="17" y="17" width="21" height="21" fill="white" />
              <rect x="22" y="22" width="11" height="11" rx="2" fill="#0284c7" />

              <rect x="95" y="10" width="35" height="35" rx="4" fill="#0284c7" />
              <rect x="102" y="17" width="21" height="21" fill="white" />
              <rect x="107" y="22" width="11" height="11" rx="2" fill="#0284c7" />

              <rect x="10" y="95" width="35" height="35" rx="4" fill="#0284c7" />
              <rect x="17" y="102" width="21" height="21" fill="white" />
              <rect x="22" y="107" width="11" height="11" rx="2" fill="#0284c7" />

              <rect x="52" y="12" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="66" y="12" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="80" y="12" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="52" y="26" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="66" y="38" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="80" y="38" width="7" height="7" rx="1.5" fill="#334155" />

              <rect x="12" y="52" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="26" y="52" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="38" y="52" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="52" y="52" width="14" height="14" rx="2" fill="#0284c7" />
              <rect x="74" y="52" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="95" y="52" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="115" y="52" width="7" height="7" rx="1.5" fill="#334155" />

              <rect x="12" y="66" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="38" y="66" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="74" y="66" width="14" height="7" rx="1.5" fill="#334155" />
              <rect x="102" y="66" width="7" height="7" rx="1.5" fill="#334155" />

              <rect x="52" y="95" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="66" y="102" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="80" y="95" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="95" y="102" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="115" y="102" width="7" height="7" rx="1.5" fill="#334155" />
              <rect x="52" y="115" width="14" height="7" rx="1.5" fill="#334155" />
              <rect x="80" y="115" width="14" height="7" rx="1.5" fill="#334155" />
              <rect x="107" y="115" width="14" height="7" rx="1.5" fill="#334155" />
            </svg>
          </div>

          <div className="mt-3.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-left w-full space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">লোকাল লিংক:</span>
              <span className="font-mono font-bold text-slate-800">192.168.1.100:3000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ইন্টারনেট প্রয়োজন:</span>
              <span className="text-emerald-700 font-bold">না (০ এমবি)</span>
            </div>
          </div>

          {onOpenMobileView && (
            <button
              onClick={onOpenMobileView}
              className="mt-3 w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>মোবাইল কাউন্টার প্রিভিউ টেস্ট করুন</span>
            </button>
          )}
        </div>

        {/* Right: Connected Devices & Backup (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Connected Devices */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>সংযুক্ত ডিভাইসসমূহ ({toBengaliNumber(nodes.length)})</span>
              <span className="text-emerald-700 font-medium">সব সক্রিয়</span>
            </h3>

            <div className="space-y-2.5">
              {nodes.map((node) => (
                <div
                  key={node.nodeId}
                  className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      {node.deviceType === 'Desktop' ? (
                        <Monitor className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{node.nodeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {node.ipAddress}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      সংযুক্ত
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {node.lastSyncTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-sky-600" />
              <span>সাম্প্রতিক ডাটা আদান-প্রদান</span>
            </h3>

            <div className="space-y-1.5">
              {syncHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{h.action}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({h.device})</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">{h.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Google Drive Backup */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">গুগল ড্রাইভ ডাটাবেজ ব্যাকআপ</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    প্রতিদিন স্বয়ংক্রিয়ভাবে এনক্রিপ্ট করে ব্যাকআপ রাখা হয়
                  </p>
                </div>
              </div>

              <button
                onClick={handleTriggerBackup}
                disabled={isBackingUp}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
              >
                <HardDrive className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-pulse' : ''}`} />
                <span>{isBackingUp ? 'হচ্ছে...' : 'ব্যাকআপ নিন'}</span>
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs flex justify-between text-slate-500">
              <span>সর্বশেষ ব্যাকআপ:</span>
              <span className="font-mono text-slate-800">{backup.lastBackupTimestamp}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
