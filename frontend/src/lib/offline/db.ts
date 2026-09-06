/**
 * IndexedDB wrapper for offline-first POS (§13).
 *
 * Stores:
 *  - transactions: offline transaction queue (pending sync)
 *  - cache: products, customers, prices, config for offline use
 *  - meta: device info, last sync time, sequence counters
 */
import type { OfflineTransaction, OfflineCacheData } from "./types";

const DB_NAME = "blueoceans_offline";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Transaction queue
      if (!db.objectStoreNames.contains("transactions")) {
        const store = db.createObjectStore("transactions", { keyPath: "id" });
        store.createIndex("syncStatus", "syncStatus", { unique: false });
        store.createIndex("idempotencyKey", "idempotencyKey", { unique: true });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      // Offline cache (products, customers, config)
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
      // Meta (device ID, last sync, sequence counter)
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Transaction Queue ──

export async function addTransaction(tx: OfflineTransaction): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("transactions", "readwrite").objectStore("transactions").put(tx);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getTransaction(id: string): Promise<OfflineTransaction | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("transactions", "readonly").objectStore("transactions").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingTransactions(): Promise<OfflineTransaction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction("transactions", "readonly").objectStore("transactions");
    const idx = store.index("syncStatus");
    const req = idx.getAll("PENDING");
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllTransactions(): Promise<OfflineTransaction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("transactions", "readonly").objectStore("transactions").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function updateTransaction(id: string, updates: Partial<OfflineTransaction>): Promise<void> {
  const db = await openDB();
  const existing = await getTransaction(id);
  if (!existing) return;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  return new Promise((resolve, reject) => {
    const req = db.transaction("transactions", "readwrite").objectStore("transactions").put(updated);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("transactions", "readwrite").objectStore("transactions").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearSyncedTransactions(): Promise<number> {
  const db = await openDB();
  const all = await getAllTransactions();
  const synced = all.filter((t) => t.syncStatus === "SYNCED");
  const store = db.transaction("transactions", "readwrite").objectStore("transactions");
  for (const t of synced) {
    store.delete(t.id);
  }
  return synced.length;
}

export async function getPendingCount(): Promise<number> {
  const pending = await getPendingTransactions();
  return pending.length;
}

// ── Cache ──

export async function setCacheData(key: string, data: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("cache", "readwrite").objectStore("cache").put({ key, data, updatedAt: new Date().toISOString() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getCacheData<T = unknown>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("cache", "readonly").objectStore("cache").get(key);
    req.onsuccess = () => resolve(req.result?.data ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function setOfflineCache(cache: OfflineCacheData): Promise<void> {
  await setCacheData("offlineCache", cache);
}

export async function getOfflineCache(): Promise<OfflineCacheData | null> {
  return getCacheData<OfflineCacheData>("offlineCache");
}

// ── Meta ──

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("meta", "readwrite").objectStore("meta").put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getMeta<T = unknown>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("meta", "readonly").objectStore("meta").get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getDeviceId(): Promise<string> {
  let id = await getMeta<string>("deviceId");
  if (!id) {
    id = `pos-${crypto.randomUUID()}`;
    await setMeta("deviceId", id);
  }
  return id;
}

export async function getNextSequence(): Promise<number> {
  const seq = (await getMeta<number>("localSequence")) || 0;
  const next = seq + 1;
  await setMeta("localSequence", next);
  return next;
}

export async function getLastSyncTime(): Promise<string | null> {
  return getMeta<string>("lastSyncTime");
}

export async function setLastSyncTime(time: string): Promise<void> {
  await setMeta("lastSyncTime", time);
}

export interface TransactionInput {
  entityType: "SALE" | "RETURN" | "STOCK" | "CUSTOMER" | "PRODUCT" | "HOLD";
  entityId?: string;
  branchId?: string;
  payload: Record<string, unknown>;
}

// ── Offline detection ──

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
