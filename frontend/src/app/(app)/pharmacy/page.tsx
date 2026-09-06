"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ShoppingCart, Pill, AlertTriangle, RefreshCw, ScanLine } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CartPanel } from "../pos/CartPanel";
import { PaymentPanel } from "../pos/PaymentPanel";
import { ReceiptModal } from "../pos/ReceiptModal";
import type { CartItem, PaymentLine, SaleResult } from "../pos/pos-types";
import { isOnline } from "@/lib/offline/db";
import { syncManager } from "@/lib/offline/sync";
import {
  fetchAllProducts, fetchBatches, applyBatchStock, fetchRegisterContext,
  groupBatchesByProduct, daysUntilExpiry, expiryBadge,
  type RegisterProduct, type RegisterContext, type BatchRow,
} from "@/lib/catalog";

/** Cart line for a pharmacy sale — batch selection travels with the item. */
interface RxCartItem extends CartItem {
  batchNo?: string | null;
  expiryDate?: string | null;
}

export default function PharmacyPage() {
  const [ctx, setCtx] = useState<RegisterContext>({ branch: null, warehouse: null, currency: "BDT" });
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<RegisterProduct[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string | null }[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [cart, setCart] = useState<RxCartItem[]>([]);
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 0 }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [online, setOnline] = useState(true);
  const [note, setNote] = useState("");
  const [discountTotal, setDiscountTotal] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Batch picker state
  const [pickerFor, setPickerFor] = useState<RegisterProduct | null>(null);
  const [pickerBatch, setPickerBatch] = useState<BatchRow | null>(null);

  // ── connectivity ──
  useEffect(() => {
    setOnline(isOnline());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [c, prods, bts] = await Promise.all([
      fetchRegisterContext(),
      fetchAllProducts().catch(() => []),
      fetchBatches(),
    ]);
    setCtx(c);
    setBatches(bts);
    setProducts(applyBatchStock(prods, bts));
    try {
      const res = await api.get<{ data: { id: string; name: string; phone: string | null }[] }>("/customers?limit=500");
      setCustomers(res.data ?? []);
    } catch { /* optional */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── fast medicine search (barcode-first) ──
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode && p.barcode === search.trim()),
    );
  }, [products, search]);

  const byProduct = useMemo(() => groupBatchesByProduct(batches), [batches]);

  // Expiry summary for the alert strip
  const expiryStats = useMemo(() => {
    let expired = 0, expiring = 0;
    for (const b of batches) {
      const d = daysUntilExpiry(b.expiryDate);
      if (d === null) continue;
      if (d < 0) expired += 1;
      else if (d <= 30) expiring += 1;
    }
    return { expired, expiring };
  }, [batches]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.lineTotal, 0), [cart]);
  const total = Math.max(subtotal - discountTotal, 0);

  useEffect(() => {
    if (payments.length === 1) setPayments([{ ...payments[0], amount: total }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  function calcLine(item: RxCartItem): RxCartItem {
    return { ...item, lineTotal: item.qty * item.unitPrice - item.discountAmount };
  }

  /** Open batch picker for a medicine that carries batches. */
  function tapProduct(p: RegisterProduct) {
    const list = byProduct.get(p.id) ?? [];
    const usable = list.filter((b) => Number(b.qty || 0) > 0);
    if (usable.length <= 1) {
      // FEFO default or no batches — add straight away
      const batch = usable[0] ?? null;
      if (batch && (daysUntilExpiry(batch.expiryDate) ?? 0) < 0) {
        setError(`${p.name} — only available in an EXPIRED batch (${batch.batchNo}). Receive new stock first.`);
        return;
      }
      addToCart(p, batch);
      return;
    }
    setPickerFor(p);
    setPickerBatch(usable[0]); // FEFO default
    setError(null);
  }

  function addToCart(p: RegisterProduct, batch: BatchRow | null) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id && (i.batchNo ?? null) === (batch?.batchNo ?? null));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = calcLine({ ...updated[idx], qty: updated[idx].qty + 1 });
        return updated;
      }
      return [...prev, calcLine({
        productId: p.id, variantId: null,
        name: p.name, qty: 1,
        unitPrice: p.sellingPrice,
        discountAmount: 0, lineTotal: 0,
        batchNo: batch?.batchNo ?? null,
        expiryDate: batch?.expiryDate ?? null,
      })];
    });
    setSearch("");
    searchRef.current?.focus();
  }

  function onQty(idx: number, qty: number) {
    if (qty <= 0) { setCart((prev) => prev.filter((_, i) => i !== idx)); return; }
    setCart((prev) => prev.map((item, i) => (i === idx ? calcLine({ ...item, qty }) : item)));
  }
  function onRemove(idx: number) { setCart((prev) => prev.filter((_, i) => i !== idx)); }
  function onDiscount(idx: number, d: number) {
    setCart((prev) => prev.map((item, i) => (i === idx ? calcLine({ ...item, discountAmount: d }) : item)));
  }
  function onPrice(idx: number, price: number) {
    setCart((prev) => prev.map((item, i) => (i === idx ? calcLine({ ...item, unitPrice: price }) : item)));
  }

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && search.trim()) {
      const match = products.find((p) => (p.barcode && p.barcode === search.trim()) || p.sku === search.trim());
      if (match) { tapProduct(match); return; }
      if (visible.length === 1) tapProduct(visible[0]);
    }
  }

  async function confirmSale() {
    if (cart.length === 0) return;
    if (!ctx.branch?.id || !ctx.warehouse?.id) {
      setError("Branch/warehouse not configured. Complete onboarding first.");
      return;
    }
    // Block expired stock at the register
    for (const line of cart) {
      if (line.batchNo && line.expiryDate) {
        const d = daysUntilExpiry(line.expiryDate);
        if (d !== null && d < 0) {
          setError(`“${line.name}” (batch ${line.batchNo}) is EXPIRED — cannot be sold.`);
          return;
        }
      }
    }
    setError(null);
    setSubmitting(true);
    try {
      if (online) {
        const res = await api.post<SaleResult>("/api/v1/pos/confirm", {
          branchId: ctx.branch.id,
          warehouseId: ctx.warehouse.id,
          customerId: customerId || null,
          items: cart.map((i) => ({
            productId: i.productId, name: i.name, qty: i.qty,
            unitPrice: i.unitPrice, discountAmount: i.discountAmount,
            batchNo: i.batchNo ?? null,
          })),
          payments,
          discountTotal,
          note,
        });
        setResult(res);
      } else {
        const saleId = crypto.randomUUID();
        await syncManager.createOfflineTransaction({
          entityType: "SALE",
          entityId: saleId,
          branchId: ctx.branch.id,
          payload: {
            saleId,
            branchId: ctx.branch.id,
            warehouseId: ctx.warehouse.id,
            customerId: customerId || null,
            items: cart.map((i) => ({
              productId: i.productId, name: i.name, qty: i.qty,
              unitPrice: i.unitPrice, discountAmount: i.discountAmount,
              batchNo: i.batchNo ?? null,
            })),
            payments,
            discountTotal,
            note,
          },
        });
        setResult({
          saleId,
          invoiceNo: `OFF-${Date.now().toString(36).toUpperCase()}`,
          invoiceId: crypto.randomUUID(),
          total,
          paidTotal: payments.reduce((s, p) => s + p.amount, 0),
          dueTotal: Math.max(total - payments.reduce((s, p) => s + p.amount, 0), 0),
          paymentIds: [],
        } as SaleResult);
      }
      resetSale();
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
    setPayments([{ method: "CASH", amount: 0 }]);
    setResult(null);
    setNote("");
    setError(null);
    searchRef.current?.focus();
  }

  if (result) {
    return (
      <div className="mx-auto max-w-md">
        <ReceiptModal result={result} onNewSale={resetSale} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-14 lg:h-[calc(100vh-4rem)] lg:flex-row lg:overflow-hidden lg:pb-0">
      {/* LEFT — medicine search + grid */}
      <div className="flex h-[55dvh] min-w-0 flex-1 flex-col gap-3 overflow-hidden lg:h-auto">
        <div className="flex items-center gap-2">
          <Pill size={16} className="shrink-0 text-primary-600" />
          <span className="shrink-0 text-sm font-semibold text-gray-900">Pharmacy Register</span>
          {!online && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              <AlertTriangle size={11} /> Offline — sales queue for sync
            </span>
          )}
          {loading && <RefreshCw size={14} className="ml-1 animate-spin text-gray-300" />}
        </div>

        {(expiryStats.expired > 0 || expiryStats.expiring > 0) && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle size={14} className="shrink-0" />
            <span>
              {expiryStats.expiring > 0 && <b>{expiryStats.expiring} batch{expiryStats.expiring === 1 ? "" : "es"} expiring within 30 days</b>}
              {expiryStats.expired > 0 && (
                <>
                  {expiryStats.expiring > 0 ? " · " : ""}
                  <b className="text-red-700">{expiryStats.expired} expired</b> — FEFO sells the soonest-expiring first
                </>
              )}
            </span>
          </div>
        )}

        <CustomInput
          ref={searchRef}
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder="Scan barcode or search medicine… (Enter adds FEFO batch)"
          leftIcon={<Search size={15} />}
          className="py-2.5"
        />

        <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-2 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => {
            const list = (byProduct.get(p.id) ?? []).filter((b) => Number(b.qty || 0) > 0);
            const fefo = list[0] ?? null;
            const fefoDays = fefo ? daysUntilExpiry(fefo.expiryDate) : null;
            const out = (p.stockQty ?? 0) <= 0;
            const badge = expiryBadge(fefoDays);
            return (
              <button
                key={p.id}
                disabled={out || (fefo && fefoDays !== null && fefoDays < 0)}
                onClick={() => tapProduct(p)}
                className="flex flex-col items-start rounded-xl border border-gray-100 bg-white p-3 text-left transition hover:border-primary-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="flex w-full items-start justify-between gap-1">
                  <p className="line-clamp-2 text-sm font-medium text-gray-800">{p.name}</p>
                  {p.barcode && <ScanLine size={13} className="mt-0.5 shrink-0 text-gray-300" />}
                </div>
                <p className="mt-0.5 text-xs text-gray-400">{p.sku}</p>
                <div className="mt-1.5 flex w-full flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                    {p.stockQty ?? 0} in stock
                  </span>
                  {fefo && badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                  {!fefo && list.length === 0 && p.stockQty === 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">No batch</span>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-bold text-primary-600 tabular-nums">
                  {Number(p.sellingPrice).toFixed(2)}
                </p>
                {fefo && list.length > 1 && (
                  <p className="mt-0.5 text-[11px] text-gray-400">Choose batch… ({list.length})</p>
                )}
              </button>
            );
          })}
          {visible.length === 0 && !loading && (
            <p className="col-span-full py-12 text-center text-sm text-gray-400">
              {search ? "No medicines match — check barcode or name" : "No medicines in this pharmacy yet"}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT — cart + checkout */}
      <div className="flex w-full shrink-0 flex-col rounded-2xl border border-gray-100 bg-white shadow-sm lg:w-80">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ShoppingCart size={16} className="text-gray-400" />
            Cart {cart.length > 0 && `(${cart.length})`}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-hidden px-3 py-2">
          <CartPanel
            items={cart}
            selfCheckout={false}
            onQtyChange={onQty}
            onRemove={onRemove}
            onDiscountChange={onDiscount}
            onPriceOverride={onPrice}
          />
          {/* Batch trace on each cart line */}
          {cart.some((c) => c.batchNo) && (
            <div className="max-h-24 space-y-0.5 overflow-y-auto rounded-lg bg-gray-50 p-2 text-[11px] text-gray-500">
              {cart.filter((c) => c.batchNo).map((c, i) => {
                const b = expiryBadge(daysUntilExpiry(c.expiryDate));
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="truncate">{c.name}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <span className="rounded bg-white px-1 font-mono">{c.batchNo}</span>
                      {b && <span className={`rounded px-1 ${b.cls}`}>{b.label}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-gray-100 px-4 py-3">
          <CustomSelect
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="Walk-in customer / patient"
            options={customers.map((c) => ({ value: c.id, label: `${c.name}${c.phone ? ` · ${c.phone}` : ""}` }))}
          />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span className="tabular-nums">{subtotal.toFixed(2)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Discount</span><span className="tabular-nums">−{discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-1 font-bold text-gray-900">
              <span>Total</span><span className="tabular-nums">{total.toFixed(2)}</span>
            </div>
          </div>
          <CustomInput label="Discount" type="number" min={0} step="0.01" value={discountTotal || ""}
                       onChange={(e) => setDiscountTotal(Number(e.target.value))} className="py-1.5 text-sm" />
          <PaymentPanel total={total} payments={payments} onChange={setPayments} />
          <CustomInput label="Note" value={note} onChange={(e) => setNote(e.target.value)} className="py-1.5 text-sm" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <CustomButton fullWidth size="lg" loading={submitting} disabled={cart.length === 0} onClick={confirmSale}>
            {!online ? "⚡ Confirm Offline Sale" : "Confirm Sale"}
          </CustomButton>
        </div>
      </div>

      {/* Batch picker modal — FEFO first */}
      <CustomModal
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        title={pickerFor ? `Select batch — ${pickerFor.name}` : "Select batch"}
      >
        {pickerFor && (
          <div className="space-y-2">
            <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
              FEFO (first-expiry-first-out) — the soonest-expiring batch is highlighted and pre-selected.
            </p>
            {(byProduct.get(pickerFor.id) ?? []).filter((b) => Number(b.qty || 0) > 0).length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">No sellable stock for this medicine.</p>
            )}
            {(byProduct.get(pickerFor.id) ?? [])
              .filter((b) => Number(b.qty || 0) > 0)
              .map((b, i) => {
                const d = daysUntilExpiry(b.expiryDate);
                const expired = d !== null && d < 0;
                const badge = expiryBadge(d);
                const selected = pickerBatch?.id === b.id;
                return (
                  <button
                    key={b.id}
                    disabled={expired}
                    onClick={() => setPickerBatch(b)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-40 ${
                      selected ? "border-primary-400 bg-primary-50 ring-1 ring-primary-200" : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <span className="font-mono">{b.batchNo}</span>
                        {i === 0 && !expired && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">FEFO</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400 tabular-nums">{b.qty} units available</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {badge && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>}
                      {b.expiryDate && <span className="text-xs text-gray-400 tabular-nums">{b.expiryDate.slice(0, 10)}</span>}
                    </div>
                  </button>
                );
              })}
            <div className="flex justify-end gap-2 pt-2">
              <CustomButton variant="outline" onClick={() => setPickerFor(null)}>Cancel</CustomButton>
              <CustomButton
                onClick={() => {
                  if (pickerFor && pickerBatch) addToCart(pickerFor, pickerBatch);
                  setPickerFor(null);
                }}
              >
                Add selected batch
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}
