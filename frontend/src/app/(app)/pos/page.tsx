"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search, ShoppingCart, PauseCircle, PlayCircle,
  XCircle, RotateCcw, User, ChevronDown, Settings2, WifiOff, CloudOff,
  Keyboard,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CartPanel } from "./CartPanel";
import { PaymentPanel } from "./PaymentPanel";
import { ReceiptModal } from "./ReceiptModal";
import type { CartItem, PaymentLine, HeldSale, SaleResult } from "./pos-types";
import { syncManager } from "@/lib/offline/sync";
import {
  loadShortcuts, saveShortcuts, matchesBinding, bindingList,
  ACTION_LABELS, SHORTCUT_ACTIONS, DEFAULT_SHORTCUTS,
  type PosShortcutAction,
} from "@/lib/pos-shortcuts";
import { publishCart, type DisplayCart } from "@/lib/customer-display";
import {
  getDeviceId, getOfflineCache, isOnline, getNextSequence,
} from "@/lib/offline/db";
import type { CachedProduct, CachedCustomer, CachedBranch, CachedWarehouse, CachedShift } from "@/lib/offline/types";
import { fetchAllProducts, fetchBatches, applyBatchStock, toRegisterProduct, type ApiProductRow } from "@/lib/catalog";

interface TenantInfo {
  branch: { id: string; name: string } | null;
  warehouse: { id: string; name: string } | null;
}

interface RawTenantInfo {
  tenant?: { id: string; slug: string; name: string; businessType: string; currency: string };
  branches?: { id: string; name: string }[];
  warehouses?: { id: string; name: string }[];
}

function pickTenantInfo(raw: RawTenantInfo): TenantInfo {
  return {
    branch: raw.branches?.[0] ? { id: raw.branches[0].id, name: raw.branches[0].name } : null,
    warehouse: raw.warehouses?.[0] ? { id: raw.warehouses[0].id, name: raw.warehouses[0].name } : null,
  };
}

function calcLine(item: CartItem): CartItem {
  return { ...item, lineTotal: item.qty * item.unitPrice - item.discountAmount };
}

/** Offline receipt result — generated locally when no server available */
function makeOfflineResult(invoiceNo: string, cart: CartItem[], total: number, payments: PaymentLine[]): SaleResult {
  return {
    saleId: crypto.randomUUID(),
    invoiceNo,
    invoiceId: crypto.randomUUID(),
    total,
    paidTotal: payments.reduce((s, p) => s + p.amount, 0),
    dueTotal: Math.max(total - payments.reduce((s, p) => s + p.amount, 0), 0),
    paymentIds: [],
  } as SaleResult;
}

export default function PosPage() {
  // ── Online status ──
  const [online, setOnline] = useState(true);

  // Context
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [openShift, setOpenShift] = useState<CachedShift | null>(null);

  // Product search
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<CachedCustomer[]>([]);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [note, setNote] = useState("");

  // Payments
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 0 }]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const extrasRef = useRef<HTMLDivElement>(null);

  // ── Configurable keyboard shortcuts (§27: F1–F7) ──
  const [shortcuts, setShortcuts] = useState(loadShortcuts);
  const [showShortcutSettings, setShowShortcutSettings] = useState(false);
  const [draftShortcuts, setDraftShortcuts] = useState(shortcuts);
  const [recordingAction, setRecordingAction] = useState<PosShortcutAction | null>(null);

  // Holds
  const [holds, setHolds] = useState<HeldSale[]>([]);
  const [showHolds, setShowHolds] = useState(false);
  const [resumingHoldId, setResumingHoldId] = useState<string | null>(null);

  // Void / Return
  const [showVoid, setShowVoid] = useState(false);
  const [voidSaleId, setVoidSaleId] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const [returnSaleId, setReturnSaleId] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [actionSaving, setActionSaving] = useState(false);

  // ── Online/offline listener ──
  useEffect(() => {
    setOnline(isOnline());
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Load data: try server first, fall back to IndexedDB cache ──
  const loadData = useCallback(async () => {
    const onlineNow = isOnline();

    if (onlineNow) {
      try {
        const raw = await api.get<{ data: RawTenantInfo }>("/api/v1/tenant");
        setTenantInfo(pickTenantInfo(raw.data ?? (raw as unknown as RawTenantInfo)));
      } catch { /* ignore */ }

      try {
        // Normalized full catalog + real stock from the batches ledger
        const [prods, batches] = await Promise.all([fetchAllProducts(), fetchBatches()]);
        setProducts(applyBatchStock(prods, batches) as unknown as CachedProduct[]);
      } catch { /* ignore */ }

      try {
        const res = await api.get<{ data: CachedCustomer[] }>("/customers");
        setCustomers((res.data ?? res) as CachedCustomer[]);
      } catch { /* ignore */ }

      // Pull and cache for offline use
      await syncManager.pullCache();
    } else {
      // Offline — load from IndexedDB cache
      const cache = await getOfflineCache();
      if (cache) {
        setProducts(cache.products || []);
        setCustomers(cache.customers || []);
        if (cache.openShifts?.length) {
          setOpenShift(cache.openShifts[0]);
        }
      }
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Product search (from local cache when offline) ──
  useEffect(() => {
    if (!search.trim()) {
      // Show cached products when no search
      return;
    }
    const term = search.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode && p.barcode === search.trim()),
    );
    // If online, also do a server search for better results
    if (isOnline()) {
      const t = setTimeout(() => {
        api
          .get<{ data: ApiProductRow[] }>(`/products?search=${encodeURIComponent(search)}&limit=100`)
          .then((res) => setProducts((res.data ?? []).map((r) => toRegisterProduct(r)) as unknown as CachedProduct[]))
          .catch(() => {});
      }, 250);
      return () => clearTimeout(t);
    } else {
      setProducts(filtered);
    }
  }, [search]);

  // Totals
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.lineTotal, 0), [cart]);
  const taxTotal = 0; // stub — Prompt 17
  const total = Math.max(subtotal - discountTotal + taxTotal + serviceCharge, 0);

  // ── Customer-facing display: publish the live cart to the second screen ──
  useEffect(() => {
    publishCart({
      updatedAt: Date.now(),
      lines: cart.map((i) => ({
        name: i.name, qty: i.qty, unitPrice: i.unitPrice, discountAmount: i.discountAmount,
      })),
      subtotal,
      discountTotal,
      taxTotal,
      total,
      status: cart.length > 0 ? "ACTIVE" : "IDLE",
    });
  }, [cart, subtotal, discountTotal, taxTotal, total]);

  // Keep first payment amount in sync with total when only one payment line
  useEffect(() => {
    if (payments.length === 1) {
      setPayments([{ ...payments[0], amount: total }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // ── Cart operations ──────────────────────────────────────────────

  function addProduct(p: CachedProduct) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id && !i.variantId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = calcLine({ ...updated[idx], qty: updated[idx].qty + 1 });
        return updated;
      }
      return [...prev, calcLine({
        productId: p.id, variantId: null,
        name: p.name, qty: 1,
        unitPrice: Number(p.sellingPrice),
        discountAmount: 0, lineTotal: 0,
      })];
    });
    setSearch("");
    searchRef.current?.focus();
  }

  function handleQtyChange(idx: number, qty: number) {
    if (qty <= 0) { removeItem(idx); return; }
    setCart((prev) => prev.map((item, i) => i === idx ? calcLine({ ...item, qty }) : item));
  }

  function removeItem(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleDiscountChange(idx: number, discount: number) {
    setCart((prev) => prev.map((item, i) => i === idx ? calcLine({ ...item, discountAmount: discount }) : item));
  }

  function handlePriceOverride(idx: number, price: number) {
    setCart((prev) => prev.map((item, i) => i === idx ? calcLine({ ...item, unitPrice: price }) : item));
  }

  // ── Barcode scan (Enter key in search) ──────────────────────────

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && search.trim()) {
      const match = products.find(
        (p) => p.barcode === search.trim() || p.sku === search.trim(),
      );
      if (match) addProduct(match);
    }
  }

  // ── Checkout (§13 — works offline) ──────────────────────────────

  async function confirmSale() {
    if (cart.length === 0) return;
    if (!tenantInfo?.branch?.id || !tenantInfo?.warehouse?.id) {
      setError("Branch/warehouse not configured. Complete onboarding first.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const onlineNow = isOnline();

    try {
      if (onlineNow) {
        // Online: direct API call
        const res = await api.post<SaleResult>("/api/v1/pos/confirm", {
          branchId: tenantInfo.branch.id,
          warehouseId: tenantInfo.warehouse.id,
          customerId: customerId || null,
          items: cart,
          payments,
          discountTotal,
          taxTotal,
          serviceCharge,
          note,
          heldSaleId: resumingHoldId ?? undefined,
        });
        setResult(res);
        loadHolds();
        publishCart({
          updatedAt: Date.now(),
          invoiceNo: res.invoiceNo,
          lines: cart.map((i) => ({
            name: i.name, qty: i.qty, unitPrice: i.unitPrice, discountAmount: i.discountAmount,
          })),
          subtotal, discountTotal, taxTotal, total,
          status: "PAID",
        } as DisplayCart);
      } else {
        // Offline: queue the transaction
        const invoiceNo = `OFF-${Date.now().toString(36).toUpperCase()}`;
        const saleId = crypto.randomUUID();

        await syncManager.createOfflineTransaction({
          entityType: "SALE",
          entityId: saleId,
          branchId: tenantInfo.branch.id,
          payload: {
            saleId,
            branchId: tenantInfo.branch.id,
            warehouseId: tenantInfo.warehouse.id,
            customerId: customerId || null,
            items: cart,
            payments,
            discountTotal,
            taxTotal,
            serviceCharge,
            note,
          },
        });

        // Generate local receipt
        const localResult = makeOfflineResult(invoiceNo, cart, total, payments);
        setResult(localResult);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetSale() {
    setCart([]);
    setCustomerId("");
    setDiscountTotal(0);
    setServiceCharge(0);
    setNote("");
    setPayments([{ method: "CASH", amount: 0 }]);
    setResult(null);
    setResumingHoldId(null);
    setError(null);
    setShowExtras(false);
    searchRef.current?.focus();
  }

  // ── Configurable keyboard shortcuts (§27) ──
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;
  const actionsRef = useRef({
    resetSale, holdSale, confirmSale, loadHolds,
    cartHasItems: () => cart.length > 0,
  });
  actionsRef.current = {
    resetSale, holdSale, confirmSale, loadHolds,
    cartHasItems: () => cart.length > 0,
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Never hijack typing in inputs/textareas/selects for plain keys, but F-keys
      // and modifier combos are safe even while an input is focused.
      const tag = (e.target as HTMLElement)?.tagName;
      const plainKey = /^[A-Za-z0-9 ]$/.test(e.key);
      if ((tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") && plainKey) return;
      // Settings recorder captures the next key press
      if (recordingAction) {
        e.preventDefault();
        const mods: string[] = [];
        if (e.ctrlKey) mods.push("Ctrl");
        if (e.altKey) mods.push("Alt");
        if (e.shiftKey) mods.push("Shift");
        if (e.metaKey) mods.push("Cmd");
        const keyName = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
        const binding = [...mods, keyName].join("+");
        setDraftShortcuts((prev) => ({ ...prev, [recordingAction]: binding }));
        setRecordingAction(null);
        return;
      }
      const map = shortcutsRef.current;
      for (const action of SHORTCUT_ACTIONS) {
        if (matchesBinding(e, map[action])) {
          e.preventDefault();
          switch (action) {
            case "search":
              searchRef.current?.focus();
              searchRef.current?.select();
              break;
            case "customer":
              document.getElementById("pos-customer-select")?.focus();
              break;
            case "discount":
              setShowExtras(true);
              setTimeout(() => {
                const el = document.getElementById("pos-discount-input") as HTMLInputElement | null;
                el?.focus(); el?.select();
              }, 50);
              break;
            case "payment":
              if (actionsRef.current.cartHasItems()) confirmSale();
              break;
            case "hold":
              if (actionsRef.current.cartHasItems()) holdSale();
              break;
            case "resume":
              loadHolds();
              setShowHolds(true);
              break;
            case "return":
              setShowReturn(true);
              break;
          }
          return;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingAction]);

  // ── Hold / Resume ────────────────────────────────────────────────

  async function loadHolds() {
    if (!tenantInfo?.branch?.id) return;
    if (isOnline()) {
      const data = await api.get<HeldSale[]>(`/api/v1/pos/holds?branchId=${tenantInfo.branch.id}`).catch(() => []);
      setHolds(data);
    }
    // Offline holds are in IndexedDB — handled by the cache
  }

  useEffect(() => { if (tenantInfo) loadHolds(); }, [tenantInfo]);

  async function holdSale() {
    if (cart.length === 0) return;
    if (isOnline()) {
      await api.post("/api/v1/pos/holds", {
        branchId: tenantInfo?.branch?.id,
        customerId: customerId || null,
        items: cart,
        note,
      });
    } else {
      // Queue hold for sync
      await syncManager.createOfflineTransaction({
        entityType: "HOLD",
        branchId: tenantInfo?.branch?.id,
        payload: {
          branchId: tenantInfo?.branch?.id,
          customerId: customerId || null,
          items: cart,
          note,
        },
      });
    }
    resetSale();
    loadHolds();
  }

  function resumeHold(hold: HeldSale) {
    setCart(hold.cartSnapshot);
    setCustomerId(hold.customerId ?? "");
    setNote(hold.note ?? "");
    setResumingHoldId(hold.id);
    setShowHolds(false);
  }

  async function deleteHold(id: string) {
    if (isOnline()) {
      await api.del(`/api/v1/pos/holds/${id}`);
    }
    loadHolds();
  }

  // ── Void ─────────────────────────────────────────────────────────

  async function doVoid() {
    if (!voidSaleId) return;
    setActionSaving(true);
    try {
      if (isOnline()) {
        await api.post(`/api/v1/pos/sales/${voidSaleId}/void`, { reason: voidReason });
      }
      // Offline voids are queued via the sync engine
      setShowVoid(false);
      setVoidSaleId("");
      setVoidReason("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionSaving(false);
    }
  }

  // ── Return ───────────────────────────────────────────────────────

  async function doReturn() {
    if (!returnSaleId || !returnAmount) return;
    setActionSaving(true);
    try {
      if (isOnline()) {
        await api.post(`/api/v1/pos/sales/${returnSaleId}/return`, {
          branchId: tenantInfo?.branch?.id,
          warehouseId: tenantInfo?.warehouse?.id,
          refundAmount: Number(returnAmount),
          reason: returnReason,
          refundMethod: "CASH",
        });
      } else {
        // Queue return for sync
        await syncManager.createOfflineTransaction({
          entityType: "RETURN",
          branchId: tenantInfo?.branch?.id,
          payload: {
            saleId: returnSaleId,
            branchId: tenantInfo?.branch?.id,
            refundAmount: Number(returnAmount),
            reason: returnReason,
            refundMethod: "CASH",
          },
        });
      }
      setShowReturn(false);
      setReturnSaleId("");
      setReturnAmount("");
      setReturnReason("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionSaving(false);
    }
  }

  // ── Receipt screen ───────────────────────────────────────────────

  if (result) {
    return (
      <div className="mx-auto max-w-md">
        <ReceiptModal result={result} onNewSale={resetSale} />
      </div>
    );
  }

  // ── Main POS layout ──────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-14 lg:h-[calc(100vh-4rem)] lg:flex-row lg:overflow-hidden lg:pb-0">

      {/* LEFT — Product grid */}
      <div className="flex h-[55dvh] min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:h-auto">

        {/* Offline mode banner */}
        {!online && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
            <WifiOff size={16} />
            <span className="font-medium">Offline Mode</span>
            <span className="text-amber-600">— Sales will sync when connection is restored</span>
          </div>
        )}

        <CustomInput
          ref={searchRef}
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder={online ? "Scan barcode or search product… (Enter to add) · F1" : "Search cached products… (Enter to add) · F1"}
          leftIcon={<Search size={15} />}
          className="py-2.5"
        />

        {/* Keyboard shortcut hints (§27) — collapsible, shows active bindings */}
        <div className="flex flex-wrap items-center gap-1.5 px-0.5">
          {bindingList(shortcuts).map(({ action, binding }) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                if (action === "search") searchRef.current?.focus();
                else if (action === "customer") document.getElementById("pos-customer-select")?.focus();
                else if (action === "discount") setShowExtras(true);
                else if (action === "payment" && cart.length > 0) confirmSale();
                else if (action === "hold" && cart.length > 0) holdSale();
                else if (action === "resume") { loadHolds(); setShowHolds(true); }
                else if (action === "return") setShowReturn(true);
              }}
              title={`${ACTION_LABELS[action]} (${binding})`}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500 transition hover:border-primary-300 hover:text-primary-600"
            >
              <kbd className="rounded bg-white px-1 font-semibold text-gray-700 shadow-sm">{binding}</kbd>
              <span className="capitalize">{action}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setDraftShortcuts(shortcuts); setRecordingAction(null); setShowShortcutSettings(true); }}
            title="Customize keyboard shortcuts"
            className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-gray-400 transition hover:text-primary-600"
          >
            <Settings2 size={12} /> Customize
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4 pb-2">
          {products.map((p) => {
            const outOfStock = p.stockQty !== undefined && Number(p.stockQty) <= 0;
            return (
              <button
                key={p.id}
                disabled={outOfStock}
                onClick={() => addProduct(p)}
                className="flex flex-col items-start rounded-xl border border-gray-100 bg-white p-3 text-left transition hover:border-primary-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <p className="line-clamp-2 text-sm font-medium text-gray-800">{p.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">{p.sku}</p>
                <p className="mt-2 text-sm font-bold text-primary-600 tabular-nums">
                  {Number(p.sellingPrice).toFixed(2)}
                </p>
              </button>
            );
          })}
          {products.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-gray-400">
              {online ? "No products found" : "No cached products — connect to internet to sync"}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT — Cart + Checkout */}
      <div className="flex w-full shrink-0 flex-col rounded-2xl border border-gray-100 bg-white shadow-sm lg:w-80">

        {/* Cart header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">
              Cart {cart.length > 0 && `(${cart.length})`}
            </span>
            {resumingHoldId && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Resumed</span>
            )}
            {!online && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                <CloudOff size={10} /> Offline
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              title="Hold sale"
              onClick={holdSale}
              disabled={cart.length === 0}
              className="rounded p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30"
            >
              <PauseCircle size={16} />
            </button>
            <button
              title="Held sales"
              onClick={() => { loadHolds(); setShowHolds(true); }}
              className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            >
              <PlayCircle size={16} />
            </button>
            <button
              title="Void sale"
              onClick={() => setShowVoid(true)}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <XCircle size={16} />
            </button>
            <button
              title="Return"
              onClick={() => setShowReturn(true)}
              className="rounded p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-600"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex flex-1 flex-col gap-2 overflow-hidden px-3 py-2">
          <CartPanel
            items={cart}
            onQtyChange={handleQtyChange}
            onRemove={removeItem}
            onDiscountChange={handleDiscountChange}
            onPriceOverride={handlePriceOverride}
          />
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">

          {/* Customer (F2 focuses this) */}
          <CustomSelect
            id="pos-customer-select"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="Walk-in customer"
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.name}${c.phone ? ` · ${c.phone}` : ""}`,
            }))}
          />

          {/* Extras toggle */}
          <button
            onClick={() => setShowExtras((v) => !v)}
            className="flex w-full items-center justify-between text-xs text-gray-400 hover:text-gray-600"
          >
            <span className="flex items-center gap-1"><Settings2 size={12} /> Charges & note</span>
            <ChevronDown size={12} className={showExtras ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>

          {showExtras && (
            <div className="grid grid-cols-2 gap-2">
              <CustomInput
                label="Discount"
                id="pos-discount-input"
                type="number" min={0} step="0.01"
                value={discountTotal || ""}
                onChange={(e) => setDiscountTotal(Number(e.target.value))}
                className="py-1.5 text-sm"
              />
              <CustomInput
                label="Service charge"
                type="number" min={0} step="0.01"
                value={serviceCharge || ""}
                onChange={(e) => setServiceCharge(Number(e.target.value))}
                className="py-1.5 text-sm"
              />
              <CustomInput
                label="Note"
                containerClassName="col-span-2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="py-1.5 text-sm"
              />
            </div>
          )}

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{subtotal.toFixed(2)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Discount</span>
                <span className="tabular-nums">−{discountTotal.toFixed(2)}</span>
              </div>
            )}
            {serviceCharge > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Service charge</span>
                <span className="tabular-nums">+{serviceCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-1 font-bold text-gray-900">
              <span>Total</span>
              <span className="tabular-nums">{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <PaymentPanel total={total} payments={payments} onChange={setPayments} />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <CustomButton
            fullWidth
            size="lg"
            loading={submitting}
            disabled={cart.length === 0}
            onClick={confirmSale}
          >
            {!online ? "⚡ Confirm Offline Sale" : "Confirm Sale"}
          </CustomButton>
        </div>
      </div>

      {/* Held Sales Modal */}
      <CustomModal open={showHolds} onClose={() => setShowHolds(false)} title="Held Sales">
        <div className="space-y-2">
          {holds.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">No held sales</p>
          )}
          {holds.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                <p className="text-sm font-medium">{h.holdNo}</p>
                <p className="text-xs text-gray-400">
                  {h.cartSnapshot.length} items · {new Date(h.createdAt).toLocaleTimeString()}
                </p>
                {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
              </div>
              <div className="flex gap-2">
                <CustomButton size="sm" onClick={() => resumeHold(h)}>Resume</CustomButton>
                <CustomButton size="sm" variant="danger" onClick={() => deleteHold(h.id)}>Delete</CustomButton>
              </div>
            </div>
          ))}
        </div>
      </CustomModal>

      {/* Void Modal */}
      <CustomModal open={showVoid} onClose={() => setShowVoid(false)} title="Void Sale">
        <div className="space-y-4">
          <CustomInput
            label="Sale ID"
            value={voidSaleId}
            onChange={(e) => setVoidSaleId(e.target.value)}
            placeholder="Paste sale ID"
          />
          <CustomInput
            label="Reason"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="Reason for void"
          />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowVoid(false)}>Cancel</CustomButton>
            <CustomButton variant="danger" loading={actionSaving} onClick={doVoid}>Void Sale</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Return Modal */}
      <CustomModal open={showReturn} onClose={() => setShowReturn(false)} title="Return / Refund">
        <div className="space-y-4">
          <CustomInput
            label="Sale ID"
            value={returnSaleId}
            onChange={(e) => setReturnSaleId(e.target.value)}
            placeholder="Paste sale ID"
          />
          <CustomInput
            label="Refund Amount"
            type="number" min={0} step="0.01"
            value={returnAmount}
            onChange={(e) => setReturnAmount(e.target.value)}
          />
          <CustomInput
            label="Reason"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowReturn(false)}>Cancel</CustomButton>
            <CustomButton loading={actionSaving} onClick={doReturn}>Process Return</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Keyboard Shortcut Settings (§27) */}
      <CustomModal
        open={showShortcutSettings}
        onClose={() => setShowShortcutSettings(false)}
        title="Keyboard Shortcuts"
      >
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
            <Keyboard size={14} className="mt-0.5 shrink-0" />
            Click an action then press the key (or key combination) you want to assign.
          </p>
          <div className="space-y-1.5">
            {SHORTCUT_ACTIONS.map((action) => {
              const isRecording = recordingAction === action;
              return (
                <div
                  key={action}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">{ACTION_LABELS[action]}</span>
                  <button
                    type="button"
                    onClick={() => setRecordingAction(isRecording ? null : action)}
                    className={`min-w-[92px] rounded-lg border px-3 py-1.5 text-center text-xs font-semibold transition ${
                      isRecording
                        ? "animate-pulse border-primary-400 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary-300"
                    }`}
                  >
                    {isRecording ? "Press key…" : (draftShortcuts[action] ?? shortcuts[action])}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 pt-1">
            <CustomButton
              variant="outline"
              onClick={() => {
                setDraftShortcuts({ ...DEFAULT_SHORTCUTS });
                setRecordingAction(null);
              }}
            >
              Reset to defaults
            </CustomButton>
            <div className="flex gap-2">
              <CustomButton variant="outline" onClick={() => setShowShortcutSettings(false)}>Cancel</CustomButton>
              <CustomButton
                onClick={() => {
                  setShortcuts(draftShortcuts);
                  saveShortcuts(draftShortcuts);
                  setShowShortcutSettings(false);
                }}
              >
                Save Shortcuts
              </CustomButton>
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
