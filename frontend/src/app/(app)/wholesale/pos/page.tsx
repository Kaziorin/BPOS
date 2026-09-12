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
import { WholesaleCustomerModal } from "@/components/wholesale/WholesaleCustomerModal";
import { WholesaleCheckoutModal, type WsCheckoutPayMethod } from "@/components/wholesale/WholesaleCheckoutModal";
import {
  type DiscountMode,
  type WsCartItem,
  type WsCategory,
  type WsSortBy,
} from "@/components/wholesale/wholesale-pos-types";

/** Placeholder for empty product state. */
const EMPTY_PRODUCTS: RegisterProduct[] = [];

const TAX_RATE = 0.15;

function calcLine(item: WsCartItem): WsCartItem {
  return { ...item, lineTotal: item.qty * item.unitPrice - item.discountAmount };
}

function WholesalePOSInner() {
  const { user } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);

  const [ctx, setCtx] = useState<RegisterContext>({ branch: null, warehouse: null, currency: "BDT" });
  const [products, setProducts] = useState<RegisterProduct[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [wsPayMethod, setWsPayMethod] = useState<WsCheckoutPayMethod>("CREDIT");
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [todaySales, setTodaySales] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);

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
        if (Array.isArray(parsed)) {
          // Filter out any legacy dummy data
          return parsed.filter((item: any) => item.productId && !item.productId.startsWith("demo-"));
        }
      }
    } catch { /* ignore */ }
    return [];
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
  const [recentOrdersOpen, setRecentOrdersOpen] = useState(false);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setCheckoutOpen(true);
      } else if (e.key === "F6") {
        e.preventDefault();
        holdOrder();
      } else if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [holdOrder]);

  useEffect(() => {
    try {
      localStorage.setItem("bpos_wholesale_dark_mode", String(darkMode));
    } catch { /* ignore */ }
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    return () => { document.documentElement.classList.remove("dark"); };
  }, []);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [ctxRes, prods, batches, custRes] = await Promise.allSettled([
          fetchRegisterContext(),
          fetchAllProducts(),
          fetchBatches(),
          api.get("/v1/customers?limit=500"),
        ]);
        if (cancelled) return;
        if (ctxRes.status === "fulfilled") setCtx(ctxRes.value);

        let list: RegisterProduct[] = [];
        if (prods.status === "fulfilled" && prods.value.length > 0) {
          list = prods.value;
          if (batches.status === "fulfilled") {
            list = applyBatchStock(list, batches.value);
          }
          list = list.map((p, i) =>
            p.imageUrl ? p : { ...p, imageUrl: null },
          );
        }
        setProducts(list);

        if (custRes.status === "fulfilled") {
          const rows = (custRes.value as any)?.data?.data ?? (custRes.value as any)?.data ?? custRes.value ?? [];
          if (Array.isArray(rows)) {
            setCustomers(rows);
          }
        }

        // Fetch today's stats
        try {
          const statsRes: any = await api.get("/api/v1/pos/stats/today");
          if (statsRes?.data) {
            setTodaySales(statsRes.data.totalSales || statsRes.data.revenue || 0);
            setTodayOrders(statsRes.data.transactionCount || statsRes.data.count || 0);
          }
        } catch { /* ignore */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAddCustomer = async (newCust: any) => {
    try {
      const res: any = await api.post("/api/v1/customers", {
        name: newCust.name,
        phone: newCust.phone,
        email: newCust.email,
        address: newCust.address,
        tier: newCust.tier,
      });
      const saved = res?.data ?? res;
      if (saved && (saved.id || saved._id)) {
        const finalCust = {
          ...newCust,
          id: saved.id || saved._id,
          ...saved
        };
        setCustomers(prev => [finalCust, ...prev]);
        setCustomerId(finalCust.id);
      } else {
        setCustomers(prev => [newCust, ...prev]);
        setCustomerId(newCust.id);
      }
    } catch (err) {
      console.error("Failed to save customer", err);
      setCustomers(prev => [newCust, ...prev]);
      setCustomerId(newCust.id);
    }
  };

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.lineTotal, 0),
    [cart],
  );

  const selectedCustomer = useMemo(() => {
    const found = customers.find((c) => c.id === customerId);
    if (found) return {
      id: found.id,
      name: found.name || found.fullName || "Customer",
      phone: found.phone || "N/A",
      tier: found.tier || "Standard",
      creditLimit: Number(found.creditLimit || found.credit_limit || 0),
      availableCredit: Number(found.availableCredit || found.available_credit || 0),
      outstanding: Number(found.outstanding || found.outstanding_balance || 0),
    };
    return null;
  }, [customers, customerId]);

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
      customerName: selectedCustomer?.name || "Walk-in Customer",
      customerTier: selectedCustomer?.tier || "Standard",
    });
  }, [cart, subtotal, discountAmount, taxAmount, total, selectedCustomer]);

  const stats = useMemo(() => {
    const low = products.filter((p) => (p.stockQty ?? 0) > 0 && (p.stockQty ?? 0) <= 10).length;
    return {
      todaysSales: todaySales,
      orders: todayOrders,
      delivery: 0,
      customers: customers.length,
      pendingOrders: heldBills.length,
      lowStockAlerts: low,
    };
  }, [products, customers.length, heldBills.length, todaySales, todayOrders]);

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

  function recallOrder(held: (typeof heldBills)[number]) {
    setCart(held.items);
    setDiscountInput(held.discountInput);
    setDiscountMode(held.discountMode);
    setShipping(held.shipping);
    setNote(held.note);
    setHeldBills((prev) => prev.filter((h) => h.id !== held.id));
    setRecentOrdersOpen(false);
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

  async function confirmSale(tenderedAmount?: number) {
    if (cart.length === 0 || submitting) return;
    setError(null);
    setSubmitting(true);

    // If tenderedAmount is provided (from non-CASH methods or partial payment), use it.
    // If undefined, assume full payment of 'total'.
    const paidAmt = tenderedAmount !== undefined ? tenderedAmount : total;
    const dueAmt = Math.max(total - paidAmt, 0);

    const payments: PaymentLine[] = [{ method: wsPayMethod as any, amount: paidAmt }];
    try {
      let saleRes: SaleResult | null = null;

      if (online) {
        try {
          const res: any = await api.post("/api/v1/pos/confirm", {
            branchId: ctx.branch?.id || null,
            warehouseId: ctx.warehouse?.id || null,
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
              paidTotal: Number(paidAmt),
              dueTotal: Number(apiData.dueTotal ?? dueAmt),
              paymentIds: apiData.paymentIds ?? [],
            };
          }
        } catch (apiErr) {
          console.warn("Wholesale confirm failed, using local result", apiErr);
        }
      }

      if (!saleRes) {
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
          paidTotal: paidAmt,
          dueTotal: dueAmt,
          paymentIds: [],
        };
      }

      setSaleSnapshot({
        cart: [...cart],
        payments,
        customerName: selectedCustomer?.name || "Walk-in Customer",
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
    setCheckoutOpen(false);
    setWsPayMethod("CREDIT");
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
          customerName={saleSnapshot?.customerName || "Walk-in Customer"}
          cashierName={user?.name || "Staff"}
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
      {/* ... background nodes ... */}
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
            <div className="absolute inset-0 bg-[#F5F9FE]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#EAF2FB] via-[#F5F9FE] to-white opacity-100" />
            <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-blue-400/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-[280px] w-[280px] rounded-full bg-blue-300/10 blur-3xl" />
          </>
        )}
        <svg className={cn("absolute inset-0 h-full w-full", darkMode ? "opacity-[0.2]" : "opacity-[0.15]")}>
          <defs>
            <pattern id="ws-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke={darkMode ? "rgba(148,163,184,0.12)" : "rgba(37,99,235,0.04)"} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ws-grid)" />
        </svg>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5">
        <WholesalePOSHeader
          orderNo={orderSeq}
          customer={selectedCustomer || {
            id: "N/A",
            name: "No Customer Selected",
            phone: "N/A",
            tier: "Standard",
            creditLimit: 0,
            availableCredit: 0,
            outstanding: 0,
          }}
          stats={stats}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((v) => !v)}
          onSelectCustomer={() => setCustomerModalOpen(true)}
        />

        <div className="flex min-h-0 flex-1 gap-2 flex-col md:flex-row overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex min-w-0 flex-1 flex-col rounded-[20px] p-2 backdrop-blur-md transition-all md:min-h-0",
              darkMode
                ? "border border-slate-700/80 bg-slate-900/70 shadow-lg"
                : "border border-white bg-white shadow-[0_4px_20px_rgba(37,99,235,0.06)]",
            )}
          >
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
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
                  if (id === "sales") window.open("/sales/orders", "_blank");
                  else if (id === "warehouse") window.open("/inventory", "_blank");
                  else if (id === "credit") window.open("/credit", "_blank");
                  else if (id === "delivery") window.open("/delivery", "_blank");
                  else if (id === "commission") window.open("/commission", "_blank");
                }}
                darkMode={darkMode}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex w-full shrink-0 md:w-[340px] lg:w-[380px] xl:w-[400px]"
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
              onHold={holdOrder}
              onProceed={() => setCheckoutOpen(true)}
              note={note}
              setNote={setNote}
              submitting={submitting}
              darkMode={darkMode}
            />
          </motion.div>
        </div>

        <WholesalePOSFooter
          warehouseName={ctx.warehouse?.name || "Main Warehouse"}
          salesRepName={user?.name || "Staff"}
          deliveryDate={deliveryDate}
          deliveryMethod="Standard"
          paymentTerm="30 Days"
          commission={5}
          onUtility={(id) => {
            if (id === "customer") setCustomerModalOpen(true);
            else if (id === "hold") holdOrder();
            else if (id === "recent") setRecentOrdersOpen(true);
          }}
          onHold={holdOrder}
          darkMode={darkMode}
        />

        <WholesaleCustomerModal
          open={customerModalOpen}
          onClose={() => setCustomerModalOpen(false)}
          customers={customers}
          onAddCustomer={handleAddCustomer}
          onSelectCustomer={(id) => setCustomerId(id)}
          darkMode={darkMode}
        />

        <WholesaleCheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          total={total}
          subtotal={subtotal}
          taxAmount={taxAmount}
          discountAmount={discountAmount}
          shipping={shipping}
          itemCount={cart.length}
          customerName={selectedCustomer?.name || "Walk-in Customer"}
          salesRepName={user?.name || "Staff"}
          payMethod={wsPayMethod}
          onChangePayMethod={setWsPayMethod}
          onConfirm={(cashTendered) => confirmSale(cashTendered)}
          submitting={submitting}
          darkMode={darkMode}
        />

        {/* Recent Orders Modal */}
        {recentOrdersOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex h-[500px] w-full max-w-2xl flex-col rounded-[24px] overflow-hidden shadow-2xl transition-colors",
                darkMode ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-100",
              )}
            >
              <div className="flex items-center justify-between border-b p-5 transition-colors dark:border-slate-800">
                <div>
                  <h3 className={cn("text-lg font-bold", darkMode ? "text-white" : "text-slate-900")}>
                    Held Orders / Recent Bills
                  </h3>
                  <p className={cn("text-xs font-medium", darkMode ? "text-slate-500" : "text-slate-400")}>
                    Restore any suspended sale to the active cart
                  </p>
                </div>
                <button
                  onClick={() => setRecentOrdersOpen(false)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                    darkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {heldBills.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <div className={cn("h-16 w-16 rounded-full flex items-center justify-center", darkMode ? "bg-slate-800" : "bg-slate-50")}>
                      <ShoppingBag className={cn("opacity-20", darkMode ? "text-white" : "text-slate-900")} size={32} />
                    </div>
                    <p className={cn("text-sm font-medium", darkMode ? "text-slate-500" : "text-slate-400")}>
                      No held orders found
                    </p>
                  </div>
                ) : (
                  heldBills.map((held) => (
                    <div
                      key={held.id}
                      className={cn(
                        "group flex items-center justify-between rounded-[18px] border p-4 transition-all hover:scale-[1.01]",
                        darkMode
                          ? "border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700"
                          : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-slate-900")}>
                            {held.items.length} Items
                          </span>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-blue-400" : "text-blue-600")}>
                            Held
                          </span>
                        </div>
                        <p className={cn("mt-1 truncate text-xs font-medium", darkMode ? "text-slate-500" : "text-slate-400")}>
                          {held.note || "No notes provided"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={cn("text-sm font-black", darkMode ? "text-white" : "text-slate-900")}>
                            ৳{held.items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2)}
                          </p>
                          <p className={cn("text-[10px] font-bold uppercase", darkMode ? "text-slate-600" : "text-slate-400")}>
                            Total
                          </p>
                        </div>
                        <button
                          onClick={() => recallOrder(held)}
                          className={cn(
                            "flex h-10 items-center justify-center rounded-xl px-5 text-xs font-bold transition-all active:scale-95",
                            darkMode
                              ? "bg-primary-600 text-white hover:bg-primary-500"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200",
                          )}
                        >
                          Recall
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
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
