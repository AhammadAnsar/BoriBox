/**
 * CRDT (Conflict-free Replicated Data Type) & Backup Sync Engine
 * Implements Hybrid Logical Clock (HLC) and Delta-State replication for offline pharmacy nodes.
 */

import { CRDTLogEntry } from '../types/pharmacy';

export class HybridLogicalClock {
  private lastPhysicalTime: number = 0;
  private logicalCounter: number = 0;
  readonly nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  /**
   * Increments the clock for a local event
   */
  now(): string {
    const physical = Date.now();
    if (physical > this.lastPhysicalTime) {
      this.lastPhysicalTime = physical;
      this.logicalCounter = 0;
    } else {
      this.logicalCounter += 1;
    }
    return `${this.lastPhysicalTime.toString(36)}-${this.logicalCounter.toString(36)}-${this.nodeId}`;
  }

  /**
   * Advances the clock upon receiving a remote message
   */
  update(remoteHlc: string): string {
    const parts = remoteHlc.split('-');
    if (parts.length >= 2) {
      const remotePhysical = parseInt(parts[0], 36);
      const remoteCounter = parseInt(parts[1], 36);
      const physical = Date.now();

      if (physical > this.lastPhysicalTime && physical > remotePhysical) {
        this.lastPhysicalTime = physical;
        this.logicalCounter = 0;
      } else if (this.lastPhysicalTime === remotePhysical) {
        this.logicalCounter = Math.max(this.logicalCounter, remoteCounter) + 1;
      } else if (remotePhysical > this.lastPhysicalTime) {
        this.lastPhysicalTime = remotePhysical;
        this.logicalCounter = remoteCounter + 1;
      } else {
        this.logicalCounter += 1;
      }
    }
    return this.now();
  }
}

export interface SyncNodeState {
  nodeId: string;
  nodeName: string;
  deviceType: 'Desktop' | 'Mobile LAN';
  ipAddress: string;
  isOnline: boolean;
  lastSyncTime: string;
  pendingDeltaCount: number;
}

export interface BackupStatus {
  isConfigured: boolean;
  provider: 'Google Drive API (AES-256 Encrypted)';
  lastBackupTimestamp: string;
  backupSizeKb: number;
  checksumSha256: string;
  autoDailyEnabled: boolean;
  statusMessage: string;
}

export const INITIAL_NODES: SyncNodeState[] = [
  {
    nodeId: 'DESKTOP_MAIN',
    nodeName: 'কাউন্টার ১ (মেইন ক্যাশ ডেস্কটপ)',
    deviceType: 'Desktop',
    ipAddress: '127.0.0.1 (Localhost)',
    isOnline: true,
    lastSyncTime: new Date().toLocaleTimeString(),
    pendingDeltaCount: 0,
  },
  {
    nodeId: 'LAN_MOBILE_01',
    nodeName: 'কাউন্টার ২ (মোবাইল পিওএস - স্যামসাং)',
    deviceType: 'Mobile LAN',
    ipAddress: '192.168.1.105:3000',
    isOnline: true,
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString(),
    pendingDeltaCount: 2,
  },
];

export const INITIAL_BACKUP_STATUS: BackupStatus = {
  isConfigured: true,
  provider: 'Google Drive API (AES-256 Encrypted)',
  lastBackupTimestamp: new Date(Date.now() - 1000 * 60 * 180).toLocaleString(),
  backupSizeKb: 4820,
  checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  autoDailyEnabled: true,
  statusMessage: 'দৈনিক স্বয়ংক্রিয় ব্যাকআপ সচল (রাত ১২:০০ টা)',
};
