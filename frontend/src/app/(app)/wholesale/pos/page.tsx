"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { isOnline } from "@/lib/offline/db";
import { syncManager } from "@/lib/offline/sync";
import { publishCart } from "@/lib/customer-display";
import {
  fetchAllProducts,
  fetchBatches,
  applyBatchStock,
  fetchRegisterContext,
  type RegisterProduct,
  type RegisterContext,
} from "@/lib/catalog";
import { ReceiptModal } from "../../pos/ReceiptModal";
import type { PaymentLine, SaleResult } from "../../pos/pos-types";
import { WholesalePOSHeader } from "@/components/wholesale/WholesalePOSHeader";
import { WholesalePOSLeftPanel } from "@/components/wholesale/WholesalePOSLeftPanel";
import { WholesalePOSRightPanel } from "@/components/wholesale/WholesalePOSRightPanel";
import { WholesalePOSFooter } from "@/components/wholesale/WholesalePOSFooter";
import {
  DEMO_CUSTOMER,
  DEMO_STATS,
  type DiscountMode,
  type WsCartItem,
  type WsCategory,
  type WsSortBy,
} from "@/components/wholesale/wholesale-pos-types";

/** Premium demo catalog matching the design mock (used when API is empty). */
const DEMO_PRODUCTS: RegisterProduct[] = [
  {
    id: "demo-1",
    name: "Premium Wireless Headphones",
    sku: "SKU-HD-2401",
    barcode: "8901001001",
    sellingPrice: 129.99,
    costPrice: 80,
    productType: "SIMPLE",
    unit: "pcs",
    status: "ACTIVE",
    stockQty: 48,
    categoryName: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
  },
  {
    id: "demo-2",
    name: "Ultra Slim Smart Watch",
    sku: "SKU-SW-8820",
    barcode: "8901001002",
    sellingPrice: 249.0,
    costPrice: 160,
    productType: "SIMPLE",
    unit: "pcs",
    status: "ACTIVE",
    stockQty: 32,
    categoryName: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
  },
  {
    id: "demo-3",
    name: "Noise Cancelling Earbuds",
    sku: "SKU-EB-3311",
    barcode: "8901001003",
    sellingPrice: 89.5,
    costPrice: 45,
    productType: "SIMPLE",
    unit: "pcs",
    status: "ACTIVE",
    stockQty: 8,
    categoryName: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
  },
  {
    id: "demo-4",
    name: "Pro Mechanical Keyboard",
    sku: "SKU-KB-5502",
    barcode: "8901001004",
    sellingPrice: 159.0,
    costPrice: 95,
    productType: "SIMPLE",
    unit: "pcs",
    status: "ACTIVE",
    stockQty: 21,
    categoryName: "Computers",
    imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=400&fit=crop",
  },
  {
    id: "demo-5",
    name: "4K Action Camera",
    sku: "SKU-CAM-901",
    barcode: "8901001005",
    sellingPrice: 319.99,
    costPrice: 210,
    productType: "SIMPLE",
    unit: "pcs",
    status: "ACTIVE",
    stockQty: 14,
    categoryName: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
  },
  {
    id: "demo-6",
    name: "Wireless Gaming Mouse",
    sku: "SKU-MS-4410",
    barcode: "8901001006",
    sellingPrice: 69.99,
    costPrice: 35,
    productType: "SIMPLE",
    unit: "pcs",
    status: "ACTIVE",
    stockQty: 5,
    categoryName: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
  },
  {
    id: "demo-7",
    name: "Portable Bluetooth Speaker",
    sku: "SKU-SP-2208",
    barcode: "8901001007",
    sellingPrice: 79.0,
    costPrice: 40,
    productType: "SIMPLE",
    unit: "pcs",
    status: "ACTIVE",
    stockQty: 27,
    categoryName: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
  },
  {
    id: "demo-8",
    name: "USB-C Hub Dock Station",
    sku: "SKU-HUB-118",
    barcode: "8901001008",
    sellingPrice: 54.5,
    costPrice: 28,
    productType: "SIMPLE",
    unit: "pcs",
    status: "ACTIVE",
    stockQty: 40,
    categoryName: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop",
  },
];

const TAX_RATE = 0.07;

function calcLine(item: WsCartItem): WsCartItem {
  return { ...item, lineTotal: item.qty * item.unitPrice - item.discountAmount };
}

function WholesalePOSInner() {
  const { user } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);

  const [ctx, setCtx] = useState<RegisterContext>({ branch: null, warehouse: null, currency: "USD" });
  const [products, setProducts] = useState<RegisterProduct[]>(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<WsCategory>("All Products");
  const [sortBy, setSortBy] = useState<WsSortBy>("name-asc");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [cart, setCart] = useState<WsCartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("bpos_wholesale_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    // First visit: seed a premium demo cart matching the mock layout
    return DEMO_PRODUCTS.slice(0, 8).map((p, i) =>
      calcLine({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        qty: i === 0 ? 2 : 1,
        unitPrice: p.sellingPrice,
        discountAmount: 0,
        lineTotal: 0,
        imageUrl: p.imageUrl,
        warehouseName: "Main Warehouse",
        stockQty: p.stockQty,
      }),
    );
  });

  const [discountMode, setDiscountMode] = useState<DiscountMode>("flat");
  const [discountInput, setDiscountInput] = useState("0");
  const [shipping, setShipping] = useState(15);
  const [note, setNote] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [saleSnapshot, setSaleSnapshot] = useState<{
    cart: WsCartItem[];
    payments: PaymentLine[];
    customerName: string;
  } | null>(null);
  const [orderSeq] = useState(() => {
    const d = new Date();
    const y = d.getFullYear().toString().slice(2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `SO-${y}${m}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  });

  const [heldBills, setHeldBills] = useState<
    { id: string; items: WsCartItem[]; discountInput: string; discountMode: DiscountMode; shipping: number; note: string }[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("bpos_wholesale_held") || "[]");
    } catch {
      return [];
    }
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("bpos_wholesale_dark_mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("bpos_wholesale_dark_mode", String(darkMode));
    } catch { /* ignore */ }

    // Sync with document element for Tailwind dark: utility classes
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Cleanup dark mode on unmount
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem("bpos_wholesale_cart", JSON.stringify(cart));
    } catch { /* ignore */ }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("bpos_wholesale_held", JSON.stringify(heldBills));
    } catch { /* ignore */ }
  }, [heldBills]);

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

  // Load catalog
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [ctxRes, prods, batches] = await Promise.allSettled([
          fetchRegisterContext(),
          fetchAllProducts(),
          fetchBatches(),
        ]);
        if (cancelled) return;
        if (ctxRes.status === "fulfilled") setCtx(ctxRes.value);

        let list: RegisterProduct[] = [];
        if (prods.status === "fulfilled" && prods.value.length > 0) {
          list = prods.value;
          if (batches.status === "fulfilled") {
            list = applyBatchStock(list, batches.value);
          }
          // Enrich missing images with demo visuals so the grid stays premium
          list = list.map((p, i) =>
            p.imageUrl
              ? p
              : { ...p, imageUrl: DEMO_PRODUCTS[i % DEMO_PRODUCTS.length]?.imageUrl ?? null },
          );
        }
        setProducts(list.length > 0 ? list : DEMO_PRODUCTS);

        try {
          const custRes: any = await api.get("/customers?limit=50");
          const rows = custRes?.data?.data ?? custRes?.data ?? custRes ?? [];
          if (Array.isArray(rows) && rows[0]?.id) {
            setCustomerId(rows[0].id);
          }
        } catch { /* keep demo customer UI */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.lineTotal, 0),
    [cart],
  );

  const discountAmount = useMemo(() => {
    const raw = Number(discountInput) || 0;
    if (discountMode === "percent") return Math.min(subtotal, (subtotal * raw) / 100);
    return Math.min(subtotal, raw);
  }, [discountInput, discountMode, subtotal]);

  const taxable = Math.max(subtotal - discountAmount, 0);
  const taxAmount = taxable * TAX_RATE;
  const total = taxable + taxAmount + (Number(shipping) || 0);

  // Publish customer display
  useEffect(() => {
    publishCart({
      updatedAt: Date.now(),
      lines: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        discountAmount: i.discountAmount,
        sku: i.sku,
        image: i.imageUrl || undefined,
      })),
      subtotal,
      discountTotal: discountAmount,
      taxTotal: taxAmount,
      total,
      status: cart.length > 0 ? "ACTIVE" : "IDLE",
      customerName: DEMO_CUSTOMER.name,
      customerTier: DEMO_CUSTOMER.tier,
    });
  }, [cart, subtotal, discountAmount, taxAmount, total]);

  const stats = useMemo(() => {
    const low = products.filter((p) => (p.stockQty ?? 0) > 0 && (p.stockQty ?? 0) <= 10).length;
    return {
      ...DEMO_STATS,
      lowStockAlerts: low || DEMO_STATS.lowStockAlerts,
      pendingOrders: heldBills.length || DEMO_STATS.pendingOrders,
    };
  }, [products, heldBills.length]);

  const addProduct = useCallback(
    (p: RegisterProduct) => {
      if ((p.stockQty ?? 0) <= 0) return;
      setCart((prev) => {
        const idx = prev.findIndex((i) => i.productId === p.id);
        if (idx >= 0) {
          const next = [...prev];
          const qty = next[idx].qty + 1;
          next[idx] = calcLine({ ...next[idx], qty });
          return next;
        }
        return [
          ...prev,
          calcLine({
            productId: p.id,
            name: p.name,
            sku: p.sku,
            qty: 1,
            unitPrice: p.sellingPrice,
            discountAmount: 0,
            lineTotal: p.sellingPrice,
            imageUrl: p.imageUrl,
            warehouseName: ctx.warehouse?.name || "Main Warehouse",
            stockQty: p.stockQty,
          }),
        ];
      });
    },
    [ctx.warehouse?.name],
  );

  function onQty(idx: number, qty: number) {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = calcLine({ ...next[idx], qty });
      return next;
    });
  }

  function onRemove(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function onClearCart() {
    setCart([]);
    setDiscountInput("0");
    setNote("");
  }

  function holdOrder() {
    if (cart.length === 0) return;
    setHeldBills((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        items: cart,
        discountInput,
        discountMode,
        shipping,
        note,
      },
    ]);
    onClearCart();
  }

  async function confirmSale() {
    if (cart.length === 0 || submitting) return;
    setError(null);
    setSubmitting(true);
    const payments: PaymentLine[] = [{ method: "CREDIT", amount: total }];
    try {
      let saleRes: SaleResult | null = null;

      if (online) {
        try {
          const res: any = await api.post("/api/v1/pos/confirm", {
            branchId: ctx.branch?.id || null,
            warehouseId: ctx.warehouse?.id || null,
            customerId: customerId || null,
            items: cart.map((i) => ({
              productId: i.productId.startsWith("demo-") ? undefined : i.productId,
              name: i.name,
              qty: i.qty,
              unitPrice: i.unitPrice,
              discountAmount: i.discountAmount,
            })),
            payments,
            discountTotal: discountAmount,
            note: note || `Wholesale SO ${orderSeq}`,
            source: "B2B",
          });
          const apiData = res?.data ?? res;
          if (apiData && (apiData.saleId || apiData.id || apiData.invoiceNo)) {
            saleRes = {
              saleId: apiData.saleId || apiData.id,
              invoiceNo: apiData.invoiceNo || orderSeq,
              invoiceId: apiData.invoiceId || apiData.saleId || apiData.id,
              total: Number(apiData.total ?? total),
              paidTotal: Number(apiData.paidTotal ?? total),
              dueTotal: Number(apiData.dueTotal ?? 0),
              paymentIds: apiData.paymentIds ?? [],
            };
          }
        } catch (apiErr) {
          console.warn("Wholesale confirm failed, using local result", apiErr);
        }
      }

      if (!saleRes) {
        const saleId = crypto.randomUUID();
        if (ctx.branch?.id && !cart.some((i) => i.productId.startsWith("demo-"))) {
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
              discountTotal: discountAmount,
              note,
            },
          });
        }
        saleRes = {
          saleId,
          invoiceNo: orderSeq,
          invoiceId: crypto.randomUUID(),
          total,
          paidTotal: total,
          dueTotal: 0,
          paymentIds: [],
        };
      }

      setSaleSnapshot({
        cart: [...cart],
        payments,
        customerName: DEMO_CUSTOMER.name,
      });
      setResult(saleRes);
    } catch (err: any) {
      setError(err?.message || "Sale failed");
    } finally {
      setSubmitting(false);
    }
  }

  function resetSale() {
    onClearCart();
    setResult(null);
    setSaleSnapshot(null);
    setError(null);
  }

  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, []);

  if (result) {
    return (
      <div
        data-theme="wholesale"
        className={cn(
          "mx-auto flex h-screen items-center justify-center max-w-md p-4",
          darkMode ? "bg-slate-950" : "bg-gradient-to-br from-[#eef5ff] to-[#f7faff]",
        )}
        style={{ fontFamily: "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif" }}
      >
        <ReceiptModal
          result={result}
          cart={(saleSnapshot?.cart || cart).map((i) => ({
            productId: i.productId,
            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,
          }))}
          payments={saleSnapshot?.payments || [{ method: "CREDIT", amount: total }]}
          customerName={saleSnapshot?.customerName || DEMO_CUSTOMER.name}
          cashierName={user?.name || "John Smith"}
          onNewSale={resetSale}
        />
      </div>
    );
  }

  return (
    <div
      data-theme="wholesale"
      className={cn(
        "relative flex h-screen w-screen flex-col overflow-hidden transition-colors duration-300",
        darkMode ? "dark bg-slate-950" : "bg-white",
      )}
      style={{ fontFamily: "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        {darkMode ? (
          <>
            <div className="absolute inset-0 bg-slate-950" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/50 to-slate-950 opacity-100" />
            <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-primary-600/10 blur-3xl" />
            <div className="absolute top-1/3 -left-24 h-[360px] w-[360px] rounded-full bg-indigo-500/5 blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-[#f7faff] to-primary-100/40" />
            <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-primary-400/20 blur-3xl" />
            <div className="absolute top-1/3 -left-24 h-[360px] w-[360px] rounded-full bg-primary-300/15 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-[280px] w-[280px] rounded-full bg-sky-300/20 blur-3xl" />
          </>
        )}
        <svg className={cn("absolute inset-0 h-full w-full", darkMode ? "opacity-[0.2]" : "opacity-[0.35]")} aria-hidden>
          <defs>
            <pattern id="ws-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path
                d="M32 0H0V32"
                fill="none"
                stroke={darkMode ? "rgba(148,163,184,0.12)" : "rgba(0,102,255,0.06)"}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ws-grid)" />
        </svg>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <WholesalePOSHeader
          orderNo={orderSeq}
          customer={DEMO_CUSTOMER}
          stats={stats}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((v) => !v)}
          onSelectCustomer={() => searchRef.current?.focus()}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:flex-row md:overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex min-h-[520px] min-w-0 flex-1 flex-col rounded-[22px] p-3 backdrop-blur-md transition-colors sm:p-4 md:min-h-0",
              darkMode
                ? "border border-slate-700/80 bg-slate-900/70 shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
                : "border border-primary-50 bg-white/80 shadow-[0_8px_40px_rgba(0,102,255,0.06)]",
            )}
          >
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Loading catalog…
                  </p>
                </div>
              </div>
            ) : (
              <WholesalePOSLeftPanel
                search={search}
                setSearch={setSearch}
                searchRef={searchRef}
                category={category}
                setCategory={setCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
                lowStockOnly={lowStockOnly}
                setLowStockOnly={setLowStockOnly}
                products={products}
                onTapProduct={addProduct}
                warehouseName={ctx.warehouse?.name || "All Warehouses"}
                onScan={() => searchRef.current?.focus()}
                onQuickAction={(id) => {
                  if (id === "sales") searchRef.current?.focus();
                }}
                darkMode={darkMode}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full shrink-0 min-h-[420px] md:min-h-0 md:w-[340px] lg:w-[380px] xl:w-[400px]"
          >
            <WholesalePOSRightPanel
              cart={cart}
              subtotal={subtotal}
              discountMode={discountMode}
              setDiscountMode={setDiscountMode}
              discountInput={discountInput}
              setDiscountInput={setDiscountInput}
              discountAmount={discountAmount}
              taxAmount={taxAmount}
              taxRate={TAX_RATE}
              shipping={shipping}
              setShipping={setShipping}
              total={total}
              onQty={onQty}
              onRemove={onRemove}
              onClearCart={onClearCart}
              onScanItem={() => searchRef.current?.focus()}
              darkMode={darkMode}
            />
          </motion.div>
        </div>

        {error && (
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-[12px] font-semibold",
              darkMode
                ? "border border-rose-500/30 bg-rose-950/50 text-rose-300"
                : "border border-rose-200 bg-rose-50 text-rose-600",
            )}
          >
            {error}
          </div>
        )}

        <WholesalePOSFooter
          warehouseName={ctx.warehouse?.name || "Main Warehouse"}
          salesRepName={user?.name || "John Smith"}
          deliveryDate={deliveryDate}
          deliveryMethod="Standard"
          paymentTerm="30 Days"
          commission={5}
          noteCount={note ? 1 : 0}
          attachmentCount={0}
          submitting={submitting}
          canProceed={cart.length > 0}
          onHold={holdOrder}
          onProceed={confirmSale}
          darkMode={darkMode}
          onUtility={(id) => {
            if (id === "customer") searchRef.current?.focus();
          }}
        />
      </div>

      {!online && (
        <div className="absolute top-3 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
          Offline mode — sales will sync later
        </div>
      )}
    </div>
  );
}

export default function WholesalePOSPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#eef5ff]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Initializing Wholesale Register…
            </p>
          </div>
        </div>
      }
    >
      <WholesalePOSInner />
    </Suspense>
  );
}
