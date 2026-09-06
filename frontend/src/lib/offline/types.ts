/**
 * Offline-first types (§13).
 *
 * Every offline transaction carries: UUID, Tenant ID, Device ID, Branch ID,
 * Created At, Local Sequence, Idempotency Key, Sync Status.
 */
export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED" | "CONFLICT";

export interface OfflineTransaction {
  /** Client-generated UUID */
  id: string;
  tenantId: string;
  deviceId: string;
  branchId?: string;
  entityType: "SALE" | "RETURN" | "STOCK" | "CUSTOMER" | "PRODUCT" | "HOLD";
  entityId?: string;
  localSequence: number;
  idempotencyKey: string;
  syncStatus: SyncStatus;
  payload: Record<string, unknown>;
  conflictData?: Record<string, unknown>;
  syncAttempts: number;
  lastSyncAttempt?: string;
  syncedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineCacheData {
  products: CachedProduct[];
  customers: CachedCustomer[];
  priceLists: unknown[];
  branches: CachedBranch[];
  warehouses: CachedWarehouse[];
  taxRules: unknown[];
  openShifts: CachedShift[];
  promotions: unknown[];
  cachedAt: string;
}

export interface CachedProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: string;
  costPrice: string;
  unit: string;
  productType: string;
  categoryId?: string;
  brandId?: string;
  status: string;
  stockQty?: string;
}

export interface CachedCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerGroupId?: string;
  creditLimit: number;
  currentDue: number;
  loyaltyPoints: number;
  status: string;
}

export interface CachedBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: string;
}

export interface CachedWarehouse {
  id: string;
  name: string;
  branchId: string;
}

export interface CachedShift {
  id: string;
  branchId: string;
  shiftNo: string;
  openingCash: number;
  status: string;
}

export interface SyncResult {
  success: boolean;
  syncStatus: SyncStatus;
  entityId?: string;
  invoiceNo?: string;
  returnNo?: string;
  error?: string;
  note?: string;
}

export interface DeviceSyncStatus {
  id: string;
  tenantId: string;
  deviceId: string;
  deviceName: string;
  branchId: string;
  userId: string;
  lastSyncAt: string | null;
  lastSyncSequence: number;
  pendingCount: number;
  failedCount: number;
  syncHealth: string;
  status: string;
  isLocked: boolean;
}
