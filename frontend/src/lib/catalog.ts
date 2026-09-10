"use client";

/**
 * Catalog shape helpers (§27 registers).
 *
 * The POS & pharmacy registers render products from several sources that each
 * return slightly different field shapes:
 *   • GET /products           → { data: [...], pagination } with nested
 *                               { unit: {id,name} }, { category }, { brand }.
 *   • POST /sync/pull         → flat rows (unitId/categoryId/brandId).
 *   • GET /inventory/batches  → batch rows with nested { product }.
 *
 * These helpers normalize everything into one RegisterProduct shape so both
 * screens behave identically online and offline.
 */

export interface RegisterProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  costPrice: number;
  productType: string;
  unit: string;
  status: string;
  stockQty?: number;
  imageUrl?: string | null;
  categoryName?: string | null;
  brandName?: string | null;
}

export interface ApiProductRow {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  sellingPrice?: string | number;
  costPrice?: string | number;
  productType?: string;
  status?: string;
  unit?: { id?: string; name?: string } | null;
  unitId?: string | null;
  category?: { id?: string; name?: string } | null;
  brand?: { id?: string; name?: string } | null;
  imageUrl?: string | null;
  _count?: { variants?: number; stockRows?: number } | null;
}

export function toRegisterProduct(row: ApiProductRow): RegisterProduct {
  const unit =
    typeof row.unit === "object" && row.unit !== null && row.unit.name
      ? row.unit.name
      : (row.unitId as string) ?? "";

  // Use backend provided totalStock if available, otherwise fallback to count
  const backendStock = (row as any).totalStock !== undefined ? Number((row as any).totalStock) : undefined;
  const stockRows = Number(row._count?.stockRows ?? 0);

  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode ?? null,
    sellingPrice: Number(row.sellingPrice ?? 0),
    costPrice: Number(row.costPrice ?? 0),
    productType: row.productType ?? "SIMPLE",
    unit,
    status: row.status ?? "ACTIVE",
    stockQty: backendStock !== undefined ? backendStock : (stockRows > 0 ? stockRows : undefined),
    imageUrl: row.imageUrl || (row as any).image || null,
    categoryName: row.category?.name ?? null,
    brandName: row.brand?.name ?? null,
  };
}

/** Fetch every active product from the paginated list endpoint. */
export async function fetchAllProducts(): Promise<RegisterProduct[]> {
  const { api } = await import("@/lib/api");
  const rows: ApiProductRow[] = [];
  let page = 1;
  for (;;) {
    const res: any = await api.get(
      `/products?limit=500&page=${page}`,
    );
    const batch = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    rows.push(...batch);
    const totalPages = res?.data?.pagination?.totalPages ?? res?.pagination?.totalPages ?? 1;
    if (page >= totalPages || batch.length === 0) break;
    page += 1;
  }
  return rows.map(toRegisterProduct);
}

// ─── Tenant / branch / warehouse (§27 registers) ─────────────────────

export interface RegisterContext {
  branch: { id: string; name: string } | null;
  warehouse: { id: string; name: string } | null;
  currency: string;
}

interface RawTenantInfo {
  tenant?: { id: string; slug: string; name: string; currency?: string };
  branches?: { id: string; name: string }[];
  warehouses?: { id: string; name: string }[];
}

/** Fetch + normalize /tenant → { branch, warehouse, currency }. */
export async function fetchRegisterContext(): Promise<RegisterContext> {
  const { api } = await import("@/lib/api");
  try {
    const res = await api.get<{ data: RawTenantInfo }>("/api/v1/tenant");
    const raw = res.data ?? (res as unknown as RawTenantInfo);
    return {
      branch: raw.branches?.[0] ? { id: raw.branches[0].id, name: raw.branches[0].name } : null,
      warehouse: raw.warehouses?.[0] ? { id: raw.warehouses[0].id, name: raw.warehouses[0].name } : null,
      currency: raw.tenant?.currency ?? "BDT",
    };
  } catch {
    return { branch: null, warehouse: null, currency: "BDT" };
  }
}

// ─── Batches (§10.17 pharmacy) ───────────────────────────────────────

export interface BatchRow {
  id: string;
  batchNo: string | null;
  qty: number;
  mfgDate?: string | null;
  expiryDate?: string | null;
  costPrice?: number;
  warehouseId?: string | null;
  product: { id: string; name: string };
}

/** Days from today until expiry (negative = already expired). */
export function daysUntilExpiry(expiryDate?: string | null): number | null {
  if (!expiryDate) return null;
  const exp = new Date(expiryDate);
  if (Number.isNaN(exp.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - now.getTime()) / 86_400_000);
}

export function expiryBadge(days: number | null): { label: string; cls: string } | null {
  if (days === null) return null;
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, cls: "bg-red-100 text-red-700" };
  if (days === 0) return { label: "Expires today", cls: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: `${days}d to expiry`, cls: "bg-amber-100 text-amber-700" };
  return { label: `${days}d`, cls: "bg-emerald-100 text-emerald-700" };
}

/**
 * Enrich register products with real on-hand quantity aggregated from the
 * batches ledger (the products list endpoint only exposes row counts).
 */
export async function fetchBatches(): Promise<BatchRow[]> {
  const { api } = await import("@/lib/api");
  try {
    const res = await api.get<{ data: BatchRow[] }>("/inventory/batches?limit=500");
    return res.data ?? [];
  } catch {
    return [];
  }
}

export function applyBatchStock(products: RegisterProduct[], batches: BatchRow[]): RegisterProduct[] {
  const perProduct = new Map<string, number>();
  for (const b of batches) {
    perProduct.set(b.product.id, (perProduct.get(b.product.id) ?? 0) + Number(b.qty || 0));
  }
  return products.map((p) => {
    const batchQty = perProduct.get(p.id);
    return {
      ...p,
      // If product has entries in batches, use that aggregate.
      // Otherwise, trust the product's own total stock (from simple stock management).
      stockQty: batchQty !== undefined ? batchQty : (p.stockQty ?? 0),
    };
  });
}

/** Per-product batches, FEFO-ordered (soonest expiry first; no-expiry last). */
export function groupBatchesByProduct(batches: BatchRow[]): Map<string, BatchRow[]> {
  const map = new Map<string, BatchRow[]>();
  for (const b of batches) {
    const list = map.get(b.product.id) ?? [];
    list.push(b);
    map.set(b.product.id, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const da = a.expiryDate ?? "9999-12-31";
      const db = b.expiryDate ?? "9999-12-31";
      return da.localeCompare(db);
    });
  }
  return map;
}
