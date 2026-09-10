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

const DEMO_PRODUCTS: RegisterProduct[] = [
  {
    id: "d-1",
    name: "Domstal",
    sku: "DOM-01",
    barcode: "8901001",
    sellingPrice: 7.00,
    costPrice: 5.00,
    productType: "SIMPLE",
    unit: "Tablet • 10mg",
    status: "ACTIVE",
    stockQty: 45,
    imageUrl: null,
    categoryName: "Pain Relief",
    brandName: "MedPharm",
  },
  {
    id: "d-2",
    name: "Esomeprazole",
    sku: "ESO-02",
    barcode: "8901002",
    sellingPrice: 8.50,
    costPrice: 6.00,
    productType: "SIMPLE",
    unit: "Capsule • 20mg",
    status: "ACTIVE",
    stockQty: 32,
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80",
    categoryName: "Gastrointestinal",
    brandName: "PharmaCare",
  },
  {
    id: "d-3",
    name: "Ibuprofen",
    sku: "IBU-03",
    barcode: "8901003",
    sellingPrice: 7.00,
    costPrice: 4.50,
    productType: "SIMPLE",
    unit: "Tablet • 400mg",
    status: "ACTIVE",
    stockQty: 50,
    imageUrl: null,
    categoryName: "Pain Relief",
    brandName: "HealthMed",
  },
  {
    id: "d-4",
    name: "Metformin",
    sku: "MET-04",
    barcode: "8901004",
    sellingPrice: 4.00,
    costPrice: 2.50,
    productType: "SIMPLE",
    unit: "Tablet • 500mg",
    status: "ACTIVE",
    stockQty: 12,
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=300&q=80",
    categoryName: "Diabetes Care",
    brandName: "DiabetesRx",
  },
  {
    id: "d-5",
    name: "Napa Extra",
    sku: "NAP-05",
    barcode: "8901005",
    sellingPrice: 12.00,
    costPrice: 8.00,
    productType: "SIMPLE",
    unit: "Tablet • 100mg",
    status: "ACTIVE",
    stockQty: 28,
    imageUrl: "https://images.unsplash.com/photo-1550572017-edf7928902d3?auto=format&fit=crop&w=300&q=80",
    categoryName: "Pain Relief",
    brandName: "Beximco",
  },
  {
    id: "d-6",
    name: "ORS",
    sku: "ORS-06",
    barcode: "8901006",
    sellingPrice: 5.00,
    costPrice: 3.00,
    productType: "SIMPLE",
    unit: "Powder • 21.8gm",
    status: "ACTIVE",
    stockQty: 40,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80",
    categoryName: "Gastrointestinal",
    brandName: "SMC",
  },
  {
    id: "d-7",
    name: "Omeprazole",
    sku: "OME-07",
    barcode: "8901007",
    sellingPrice: 8.00,
    costPrice: 5.50,
    productType: "SIMPLE",
    unit: "Capsule • 20mg",
    status: "ACTIVE",
    stockQty: 75,
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=300&q=80",
    categoryName: "Gastrointestinal",
    brandName: "Square",
  },
  {
    id: "d-8",
    name: "Paracetamol",
    sku: "PAR-08",
    barcode: "8901008",
    sellingPrice: 1.20,
    costPrice: 0.80,
    productType: "SIMPLE",
    unit: "Tablet • 500mg",
    status: "ACTIVE",
    stockQty: 90,
    imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=300&q=80",
    categoryName: "Pain Relief",
    brandName: "Renata",
  },
  {
    id: "d-9",
    name: "Salbutamol",
    sku: "SAL-09",
    barcode: "8901009",
    sellingPrice: 15.00,
    costPrice: 10.00,
    productType: "SIMPLE",
    unit: "Inhaler • 100mcg",
    status: "ACTIVE",
    stockQty: 22,
    imageUrl: null,
    categoryName: "Respiratory",
    brandName: "Incepta",
  },
  {
    id: "d-10",
    name: "Vitamin C",
    sku: "VIT-10",
    barcode: "8901010",
    sellingPrice: 3.00,
    costPrice: 1.80,
    productType: "SIMPLE",
    unit: "Tablet • 500mg",
    status: "ACTIVE",
    stockQty: 55,
    imageUrl: "https://images.unsplash.com/photo-1616671285420-b472e3995874?auto=format&fit=crop&w=300&q=80",
    categoryName: "Vitamins & Suppl.",
    brandName: "ACI",
  },
  {
    id: "d-11",
    name: "Vitamin D3",
    sku: "VIT-11",
    barcode: "8901011",
    sellingPrice: 10.00,
    costPrice: 7.00,
    productType: "SIMPLE",
    unit: "Capsule • 1000 IU",
    status: "ACTIVE",
    stockQty: 38,
    imageUrl: null,
    categoryName: "Vitamins & Suppl.",
    brandName: "HealthCare",
  },
  {
    id: "d-12",
    name: "Zincovit",
    sku: "ZIN-12",
    barcode: "8901012",
    sellingPrice: 2.50,
    costPrice: 1.50,
    productType: "SIMPLE",
    unit: "Tablet • 20mg",
    status: "ACTIVE",
    stockQty: 42,
    imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=300&q=80",
    categoryName: "Vitamins & Suppl.",
    brandName: "Apex",
  },
];

const INITIAL_CART: RxCartItem[] = [
  {
    productId: "c-1",
    name: "Cetirizine",
    qty: 4,
    unitPrice: 6.00,
    discountAmount: 0,
    lineTotal: 24.00,
    stockQty: 60,
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=150&q=80",
  },
  {
    productId: "c-2",
    name: "Becom-Z",
    qty: 1,
    unitPrice: 6.50,
    discountAmount: 0,
    lineTotal: 6.50,
    stockQty: 65,
    imageUrl: null,
  },
  {
    productId: "c-3",
    name: "Metformin",
    qty: 1,
    unitPrice: 4.00,
    discountAmount: 0,
    lineTotal: 4.00,
    stockQty: 12,
    drugInteraction: "No interaction detected",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=150&q=80",
  },
  {
    productId: "c-4",
    name: "Napa Extra",
    qty: 1,
    unitPrice: 12.00,
    discountAmount: 0,
    lineTotal: 12.00,
    stockQty: 28,
    imageUrl: "https://images.unsplash.com/photo-1550572017-edf7928902d3?auto=format&fit=crop&w=150&q=80",
  },
  {
    productId: "c-5",
    name: "Omeprazole",
    qty: 2,
    unitPrice: 8.00,
    discountAmount: 0,
    lineTotal: 16.00,
    stockQty: 75,
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=150&q=80",
  },
  {
    productId: "c-6",
    name: "Zincovit",
    qty: 2,
    unitPrice: 2.50,
    discountAmount: 0,
    lineTotal: 5.00,
    stockQty: 42,
    imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=150&q=80",
  },
];

function inferCategory(p: RegisterProduct): PharmaCat {
  const raw = `${p.categoryName || ""} ${p.name}`.toLowerCase();
  if (raw.includes("antibiotic") || raw.includes("amox") || raw.includes("cipro") || raw.includes("azith"))
    return "Antibiotics";
  if (raw.includes("pain") || raw.includes("napa") || raw.includes("paracetamol") || raw.includes("ibuprofen") || raw.includes("ace") || raw.includes("domstal"))
    return "Pain Relief";
  if (raw.includes("vitamin") || raw.includes("suppl") || raw.includes("zinc") || raw.includes("calcium"))
    return "Vitamins & Suppl.";
  if (raw.includes("skin") || raw.includes("cream") || raw.includes("ointment") || raw.includes("lotion"))
    return "Skin Care";
  if (raw.includes("diabet") || raw.includes("metformin") || raw.includes("insulin") || raw.includes("glime"))
    return "Diabetes Care";
  if (raw.includes("cardio") || raw.includes("heart") || raw.includes("atenolol") || raw.includes("amlodip"))
    return "Cardiovascular";
  if (raw.includes("gastro") || raw.includes("seclo") || raw.includes("omeprazole") || raw.includes("antacid") || raw.includes("esomeprazole") || raw.includes("ors"))
    return "Gastrointestinal";
  if (raw.includes("respir") || raw.includes("cough") || raw.includes("asthma") || raw.includes("inhal") || raw.includes("salbutamol"))
    return "Respiratory";
  if (raw.includes("eye") || raw.includes("ear") || raw.includes("drop"))
    return "Eye & Ear Care";
  return "Others";
}

export default function PharmacyPOSPage() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<RegisterContext>({ branch: null, warehouse: null, currency: "BDT" });
  const [search, setSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [products, setProducts] = useState<RegisterProduct[]>(DEMO_PRODUCTS);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string | null }[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [cart, setCart] = useState<RxCartItem[]>(INITIAL_CART);
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 74.03 }]);
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
      if (prods.length > 0) {
        setProducts(applyBatchStock(prods, bts));
      } else {
        setProducts(DEMO_PRODUCTS);
      }
    } catch {
      setProducts(DEMO_PRODUCTS);
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
      if (category !== "All" && inferCategory(p) !== category) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.brandName && p.brandName.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode === search.trim())
      );
    });

    if (gridFilter === "Popular") list = [...list].sort((a, b) => (b.stockQty ?? 0) - (a.stockQty ?? 0));
    else if (gridFilter === "Low Stock") list = list.filter((p) => (p.stockQty ?? 0) <= 15);
    else if (gridFilter === "Expiring Soon") list = list.filter((p) => p.name.includes("Metformin") || p.name.includes("Napa"));
    else if (gridFilter === "Prescription Required") list = list.filter((p) => /rx|prescription|omeprazole|esomeprazole/i.test(p.categoryName || p.name));
    else if (gridFilter === "Generic Available") list = list.filter((_, i) => i % 2 === 0);

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (!["F1", "F2", "F3", "F6", "F8"].includes(e.key)) return;
      }
      if (e.key === "F1") {
        e.preventDefault();
        void confirmSale();
      }
      if (e.key === "F2" || e.key === "F3") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F6" || e.key === "F8") {
        e.preventDefault();
        holdBill();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, total, submitting]);

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
          stockQty: p.stockQty ?? 50,
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

  function applyDiscount() {
    const val = Number(discountInput) || 0;
    if (val <= 0) {
      setDiscountTotal(0);
      return;
    }
    setDiscountTotal(Math.min(val, subtotal));
  }

  function holdBill() {
    if (cart.length === 0) return;
    setHeldBills((prev) => [...prev, { id: crypto.randomUUID(), items: cart, discountTotal, note }]);
    setCart([]);
    setDiscountTotal(0);
    setDiscountInput("");
    setNote("");
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
      } else {
        const saleId = crypto.randomUUID();
        if (ctx.branch?.id) {
          await syncManager.createOfflineTransaction({
            entityType: "SALE",
            entityId: saleId,
            branchId: ctx.branch.id,
            payload: {
              saleId,
              branchId: ctx.branch.id,
              warehouseId: ctx.warehouse?.id,
              customerId: customerId || null,
              items: cart.map((i) => ({
                productId: i.productId,
                name: i.name,
                qty: i.qty,
                unitPrice: i.unitPrice,
                discountAmount: i.discountAmount,
              })),
              payments,
              discountTotal,
              note,
            },
          });
        }
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

  function handleQuickAction(actionId: string) {
    if (actionId === "note") {
      const el = document.getElementById("pharma-note");
      if (el) el.focus();
    } else if (actionId === "doctor") {
      setNote((n) => (n.includes("Doctor:") ? n : `Doctor: Dr. Smith | ${n}`));
    } else if (actionId === "refill" || actionId === "scan-rx" || actionId === "scan-barcode" || actionId === "add-medicine") {
      searchRef.current?.focus();
    }
  }

  function handleResumeHeldBill() {
    const last = heldBills[heldBills.length - 1];
    if (!last) return;
    setCart(last.items);
    setDiscountTotal(last.discountTotal);
    setNote(last.note);
    setHeldBills((prev) => prev.slice(0, -1));
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
      {/* ═══ TOP MAIN BODY: Left Card (70%) + Right Card (30%) ═══ */}
      <div className="flex min-h-0 flex-1 gap-2 overflow-hidden">
        {/* Left Side Card Container */}
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
            onQuickAction={handleQuickAction}
            onCustomerClick={() => {
              const el = document.getElementById("pharma-customer");
              if (el) el.focus();
            }}
            handleSearchKeyDown={handleSearchKeyDown}
          />
        </div>

        {/* Right Side Card Container */}
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
            applyDiscount={applyDiscount}
            note={note}
            setNote={setNote}
            payMethod={payMethod}
            setPayMethod={setPayMethod}
            onQty={onQty}
            onRemove={onRemove}
            onClearCart={() => setCart([])}
            holdBill={holdBill}
            confirmSale={confirmSale}
            submitting={submitting}
            error={error}
          />
        </div>
      </div>

      {/* ═══ FOOTER CARD CONTAINER ═══ */}
      <div className="flex-none rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <PharmacyPOSFooter
          timeStr={timeStr}
          dateStr={dateStr}
          cashierName={cashierName}
          terminalName="PC-01"
          online={online}
          lastBackupTime="11:30 AM"
          heldBillsCount={heldBills.length}
          onResumeHeldBill={handleResumeHeldBill}
        />
      </div>

      {/* FEFO Batch Picker Modal */}
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
