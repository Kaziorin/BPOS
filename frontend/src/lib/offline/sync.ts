/**
 * Sync Manager (§13) — background sync of offline transactions.
 *
 * - Detects online/offline status
 * - Syncs pending transactions when connection is restored
 * - Pulls latest cache data for offline use
 * - Reports sync status to UI via callbacks
 */
import { api } from "@/lib/api";
import {
  addTransaction,
  getPendingTransactions,
  updateTransaction,
  clearSyncedTransactions,
  getDeviceId,
  getNextSequence,
  getLastSyncTime,
  setLastSyncTime,
  setOfflineCache,
  getOfflineCache,
  isOnline,
  type TransactionInput,
} from "./db";
import type { OfflineTransaction, SyncResult, OfflineCacheData } from "./types";

type SyncListener = (status: SyncStatusInfo) => void;

export interface SyncStatusInfo {
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncAt: string | null;
}

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private syncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private status: SyncStatusInfo = {
    online: true,
    syncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncAt: null,
  };

  /** Initialize the sync manager — call once on app mount. */
  async init() {
    if (typeof window === "undefined") return;

    // Listen for online/offline changes
    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());

    // Initial status
    this.status.online = isOnline();
    this.status.lastSyncAt = await getLastSyncTime();
    await this.refreshPendingCount();
    this.notify();

    // Periodic sync attempt every 30s when online
    this.syncInterval = setInterval(() => {
      if (isOnline() && !this.syncing) {
        this.syncPending();
      }
    }, 30000);
  }

  /** Stop the sync manager. */
  destroy() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
  }

  /** Subscribe to sync status changes. */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener({ ...this.status });
    return () => this.listeners.delete(listener);
  }

  /** Create an offline transaction and queue it. */
  async createOfflineTransaction(input: TransactionInput): Promise<OfflineTransaction> {
    const deviceId = await getDeviceId();
    const seq = await getNextSequence();
    const idempotencyKey = `${deviceId}-${seq}-${Date.now()}`;

    const tx: OfflineTransaction = {
      id: crypto.randomUUID(),
      tenantId: "", // filled by the API layer from localStorage
      deviceId,
      branchId: input.branchId,
      entityType: input.entityType,
      entityId: input.entityId,
      localSequence: seq,
      idempotencyKey,
      syncStatus: "PENDING",
      payload: input.payload,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Read tenant from localStorage
    try {
      const raw = localStorage.getItem("blueoceans_tenant");
      if (raw) {
        const tenant = JSON.parse(raw);
        tx.tenantId = tenant.slug || tenant.id;
      }
    } catch { /* ignore */ }

    await addTransaction(tx);
    await this.refreshPendingCount();
    this.notify();
    return tx;
  }

  /** Try to sync all pending transactions. */
  async syncPending(): Promise<number> {
    if (this.syncing || !isOnline()) return 0;
    this.syncing = true;
    this.status.syncing = true;
    this.notify();

    let syncedCount = 0;
    try {
      const pending = await getPendingTransactions();
      if (pending.length === 0) {
        this.syncing = false;
        this.status.syncing = false;
        this.notify();
        return 0;
      }

      // Batch upload
      const deviceId = await getDeviceId();
      const batchPayload = {
        deviceId,
        transactions: pending.map((tx) => ({
          entityType: tx.entityType,
          entityId: tx.entityId,
          localSequence: tx.localSequence,
          idempotencyKey: tx.idempotencyKey,
          payload: tx.payload,
        })),
      };

      const result = await api.post<{ data: { results: SyncResult[]; synced: number } }>(
        "/sync/upload",
        batchPayload,
      );

      const results = result.data?.results || [];
      for (let i = 0; i < results.length; i++) {
        const tx = pending[i];
        const res = results[i];
        if (res.syncStatus === "SYNCED") {
          await updateTransaction(tx.id, {
            syncStatus: "SYNCED",
            syncedAt: new Date().toISOString(),
          });
          syncedCount++;
        } else if (res.syncStatus === "FAILED") {
          await updateTransaction(tx.id, {
            syncStatus: "FAILED",
            errorMessage: res.error,
            syncAttempts: tx.syncAttempts + 1,
          });
        } else if (res.syncStatus === "CONFLICT") {
          await updateTransaction(tx.id, {
            syncStatus: "CONFLICT",
            conflictData: res as unknown as Record<string, unknown>,
          });
        }
      }

      // Clean up synced transactions older than 24h
      await clearSyncedTransactions();

      // Update last sync time
      const now = new Date().toISOString();
      await setLastSyncTime(now);
      this.status.lastSyncAt = now;

    } catch (err) {
      console.warn("[SyncManager] sync failed:", err);
      // Mark all pending as failed with retry
      const pending = await getPendingTransactions();
      for (const tx of pending) {
        await updateTransaction(tx.id, {
          syncAttempts: tx.syncAttempts + 1,
          lastSyncAttempt: new Date().toISOString(),
        });
      }
    }

    await this.refreshPendingCount();
    this.syncing = false;
    this.status.syncing = false;
    this.notify();
    return syncedCount;
  }

  /** Pull latest cache data for offline use. */
  async pullCache(): Promise<OfflineCacheData | null> {
    if (!isOnline()) return getOfflineCache();
    try {
      const result = await api.post<{ data: OfflineCacheData }>("/sync/pull", {
        deviceId: await getDeviceId(),
        entities: ["products", "customers", "prices", "config", "promotions"],
      });
      const cache: OfflineCacheData = {
        ...result.data,
        cachedAt: new Date().toISOString(),
      };
      await setOfflineCache(cache);
      return cache;
    } catch (err) {
      console.warn("[SyncManager] pull cache failed:", err);
      return getOfflineCache();
    }
  }

  /** Force a full re-sync (clear local queue). */
  async forceResync(): Promise<void> {
    const pending = await getPendingTransactions();
    for (const tx of pending) {
      await updateTransaction(tx.id, { syncStatus: "PENDING", syncAttempts: 0 });
    }
    await this.refreshPendingCount();
    this.notify();
    if (isOnline()) {
      await this.syncPending();
    }
  }

  // ── Private helpers ──

  private handleOnline = async () => {
    this.status.online = true;
    this.notify();
    // Auto-sync when coming back online
    await this.syncPending();
    // Refresh cache
    await this.pullCache();
  };

  private handleOffline = () => {
    this.status.online = false;
    this.notify();
  };

  private async refreshPendingCount() {
    const pending = await getPendingTransactions();
    this.status.pendingCount = pending.filter((t) => t.syncStatus === "PENDING").length;
    this.status.failedCount = pending.filter((t) => t.syncStatus === "FAILED").length;
  }

  private notify() {
    const snapshot = { ...this.status };
    this.listeners.forEach((fn) => fn(snapshot));
  }
}

// Singleton
export const syncManager = new SyncManager();
