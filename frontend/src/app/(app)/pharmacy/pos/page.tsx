"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ReceiptModal } from "../../pos/ReceiptModal";
import type { PaymentLine, SaleResult } from "../../pos/pos-types";
import { isOnline } from "@/lib/offline/db";
import { syncManager } from "@/lib/offline/sync";
import {
  fetchAllProducts,
  fetchBatches,
  applyBatchStock,
  fetchRegisterContext,
  groupBatchesByProduct,
  daysUntilExpiry,
  expiryBadge,
  type RegisterProduct,
  type RegisterContext,
  type BatchRow,
} from "@/lib/catalog";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomButton } from "@/components/custom/CustomButton";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import {
  PharmacyPOSLeftPanel,
  type PharmaCat,
  type GridFilter,
  type SortBy,
} from "@/components/pharmacy/PharmacyPOSLeftPanel";
import {
  PharmacyPOSRightPanel,
  type RxCartItem,
  type PayMethod,
  PAY_METHODS,
} from "@/components/pharmacy/PharmacyPOSRightPanel";
import { PharmacyPOSFooter } from "@/components/pharmacy/PharmacyPOSFooter";

export default function PharmacyPOSPage() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<RegisterContext>({ branch: null, warehouse: null, currency: "BDT" });
  const [search, setSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [products, setProducts] = useState<RegisterProduct[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string | null }[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [cart, setCart] = useState<RxCartItem[]>([]);
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 0 }]);
  const [payMethod, setPayMethod] = useState<PayMethod>("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [online, setOnline] = useState(true);
  const [note, setNote] = useState("");
  const [discountTotal, setDiscountTotal] = useState(0);
  const [discountInput, setDiscountInput] = useState("");
  const [category, setCategory] = useState<PharmaCat>("All");
  const [gridFilter, setGridFilter] = useState<GridFilter>("All Medicines");
  const [sortBy, setSortBy] = useState<SortBy>("name-asc");
  const [rxMode, setRxMode] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [heldBills, setHeldBills] = useState<{ id: string; items: RxCartItem[]; discountTotal: number; note: string }[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const [pickerFor, setPickerFor] = useState<RegisterProduct | null>(null);
  const [pickerBatch, setPickerBatch] = useState<BatchRow | null>(null);

  useEffect(() => {
    setOnline(isOnline());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [c, prods, bts] = await Promise.all([
        fetchRegisterContext(),
        fetchAllProducts().catch(() => []),
        fetchBatches().catch(() => []),
      ]);
      setCtx(c);
      setBatches(bts);
      setProducts(applyBatchStock(prods, bts));
    } catch {
      setProducts([]);
    }
    try {
      const res = await api.get<{ data: { id: string; name: string; phone: string | null }[] }>("/customers?limit=500");
      setCustomers(res.data ?? []);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const byProduct = useMemo(() => groupBatchesByProduct(batches), [batches]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (category !== "All" && (p.categoryName || "Others") !== category) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode && p.barcode === search.trim())
      );
    });

    if (gridFilter === "Low Stock") list = list.filter((p) => (p.stockQty ?? 0) <= 15);

    if (sortBy === "name-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === "price-asc") list = [...list].sort((a, b) => a.sellingPrice - b.sellingPrice);
    else if (sortBy === "price-desc") list = [...list].sort((a, b) => b.sellingPrice - a.sellingPrice);
    else if (sortBy === "stock") list = [...list].sort((a, b) => (b.stockQty ?? 0) - (a.stockQty ?? 0));

    return list;
  }, [products, search, category, gridFilter, sortBy]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.qty * i.unitPrice, 0), [cart]);
  const lineDiscountSum = useMemo(() => cart.reduce((s, i) => s + i.discountAmount, 0), [cart]);
  const totalDiscount = lineDiscountSum + discountTotal;
  const afterDiscount = Math.max(subtotal - totalDiscount, 0);
  const vatAmount = +(afterDiscount * 0.05).toFixed(2);
  const total = Math.max(afterDiscount + vatAmount, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    const method = PAY_METHODS.find((m) => m.id === payMethod)?.id ?? "CASH";
    setPayments([{ method, amount: total }]);
  }, [total, payMethod]);

  function calcLine(item: RxCartItem): RxCartItem {
    return { ...item, lineTotal: item.qty * item.unitPrice - item.discountAmount };
  }

  function tapProduct(p: RegisterProduct) {
    const list = byProduct.get(p.id) ?? [];
    const usable = list.filter((b) => Number(b.qty || 0) > 0);
    if (usable.length > 1) {
      setPickerFor(p);
      setPickerBatch(usable[0]);
      return;
    }
    addToCart(p, usable[0] ?? null);
  }

  function addToCart(p: RegisterProduct, batch: BatchRow | null) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id && (i.batchNo ?? null) === (batch?.batchNo ?? null));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = calcLine({ ...updated[idx], qty: updated[idx].qty + 1 });
        return updated;
      }
      return [
        ...prev,
        calcLine({
          productId: p.id,
          variantId: null,
          name: p.name,
          qty: 1,
          unitPrice: p.sellingPrice,
          discountAmount: 0,
          lineTotal: p.sellingPrice,
          batchNo: batch?.batchNo ?? null,
          expiryDate: batch?.expiryDate ?? null,
          imageUrl: p.imageUrl,
          unitLabel: p.unit || "Unit",
          stockQty: p.stockQty ?? 0,
        }),
      ];
    });
    setSearch("");
    searchRef.current?.focus();
  }

  function onQty(idx: number, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    setCart((prev) => prev.map((item, i) => (i === idx ? calcLine({ ...item, qty }) : item)));
  }

  function onRemove(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && search.trim()) {
      const match = products.find((p) => (p.barcode && p.barcode === search.trim()) || p.sku === search.trim());
      if (match) {
        tapProduct(match);
        return;
      }
      if (visibleProducts.length === 1) tapProduct(visibleProducts[0]);
    }
  }

  async function confirmSale() {
    if (cart.length === 0 || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (online && ctx.branch?.id && ctx.warehouse?.id) {
        const res = await api.post<SaleResult>("/api/v1/pos/confirm", {
          branchId: ctx.branch.id,
          warehouseId: ctx.warehouse.id,
          customerId: customerId || null,
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
            discountAmount: i.discountAmount,
            batchNo: i.batchNo ?? null,
          })),
          payments,
          discountTotal,
          note,
        });
        setResult(res);
      }
      resetSale();
    } catch (err: any) {
      setError(err.message || "Sale transaction failed");
    } finally {
      setSubmitting(false);
    }
  }

  function resetSale() {
    setCart([]);
    setCustomerId("");
    setDiscountTotal(0);
    setDiscountInput("");
    setPayments([{ method: "CASH", amount: 0 }]);
    setPayMethod("CASH");
    setResult(null);
    setNote("");
    setError(null);
    searchRef.current?.focus();
  }

  const cashierName = user?.name ?? "Ahmed R.";
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long",
  });

  if (result) {
    return (
      <div className="mx-auto flex h-screen items-center justify-center max-w-md p-4">
        <ReceiptModal result={result} onNewSale={resetSale} />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden bg-[#f1f5f9] p-2 gap-2 select-none"
      style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
    >
      <div className="flex min-h-0 flex-1 gap-2 overflow-hidden">
        <div className="flex w-full lg:w-[70%] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <PharmacyPOSLeftPanel
            search={search}
            setSearch={setSearch}
            searchRef={searchRef}
            category={category}
            setCategory={setCategory}
            catSearch={catSearch}
            setCatSearch={setCatSearch}
            gridFilter={gridFilter}
            setGridFilter={setGridFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            products={visibleProducts}
            onTapProduct={tapProduct}
            handleSearchKeyDown={handleSearchKeyDown}
            onQuickAction={() => {}}
            onCustomerClick={() => {}}
          />
        </div>

        <div className="flex w-full lg:w-[30%] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <PharmacyPOSRightPanel
            rxMode={rxMode}
            setRxMode={setRxMode}
            cart={cart}
            itemCount={itemCount}
            subtotal={subtotal}
            totalDiscount={totalDiscount}
            vatAmount={vatAmount}
            total={total}
            customers={customers}
            customerId={customerId}
            setCustomerId={setCustomerId}
            discountInput={discountInput}
            setDiscountInput={setDiscountInput}
            applyDiscount={() => setDiscountTotal(Number(discountInput))}
            note={note}
            setNote={setNote}
            payMethod={payMethod}
            setPayMethod={setPayMethod}
            onQty={onQty}
            onRemove={onRemove}
            onClearCart={() => setCart([])}
            holdBill={() => {}}
            confirmSale={confirmSale}
            submitting={submitting}
            error={error}
          />
        </div>
      </div>

      <div className="flex-none rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <PharmacyPOSFooter
          timeStr={timeStr}
          dateStr={dateStr}
          cashierName={cashierName}
          terminalName="PC-01"
          online={online}
          lastBackupTime="11:30 AM"
          heldBillsCount={heldBills.length}
          onResumeHeldBill={() => {}}
        />
      </div>

      <CustomModal
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        title={pickerFor ? `Select batch — ${pickerFor.name}` : "Select batch"}
      >
        {pickerFor && (
          <div className="space-y-2">
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800 font-semibold">
              FEFO — soonest-expiring batch is pre-selected.
            </p>
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
                    type="button"
                    disabled={expired}
                    onClick={() => setPickerBatch(b)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-40",
                      selected ? "border-teal-400 bg-teal-50 ring-1 ring-teal-200" : "border-slate-100 hover:border-slate-200",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <span className="font-mono">{b.batchNo}</span>
                        {i === 0 && !expired && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">FEFO</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 tabular-nums">{b.qty} units</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {badge && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>}
                    </div>
                  </button>
                );
              })}
            <div className="flex justify-end gap-2 pt-2">
              <CustomButton variant="outline" onClick={() => setPickerFor(null)}>Cancel</CustomButton>
              <CustomButton
                themeColor="teal"
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
