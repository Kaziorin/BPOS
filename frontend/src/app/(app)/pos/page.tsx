"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search, ShoppingCart, PauseCircle, PlayCircle,
  XCircle, RotateCcw, User, ChevronDown, Settings2, WifiOff, CloudOff,
  Keyboard, Scan, Zap, TrendingUp, BarChart2, Package, Bell, Cpu,
  CreditCard, Banknote, Smartphone, Gift, Plus, Minus, Trash2,
  MoreHorizontal, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight,
  Monitor, Tag, ShoppingBag, Star, Clock, RefreshCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { ReceiptModal } from "./ReceiptModal";
import type { CartItem, PaymentLine, HeldSale, SaleResult } from "./pos-types";
import { syncManager } from "@/lib/offline/sync";
import {
  loadShortcuts, saveShortcuts, matchesBinding,
  ACTION_LABELS, SHORTCUT_ACTIONS, DEFAULT_SHORTCUTS,
  type PosShortcutAction,
} from "@/lib/pos-shortcuts";
import { publishCart, type DisplayCart } from "@/lib/customer-display";
import {
  getOfflineCache, isOnline,
} from "@/lib/offline/db";
import type { CachedProduct, CachedCustomer, CachedShift } from "@/lib/offline/types";
import { fetchAllProducts, fetchBatches, applyBatchStock, toRegisterProduct } from "@/lib/catalog";

// ── Interfaces ──────────────────────────────────────────────────────
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

// ── Format currency ──────────────────────────────────────────────────
function fmt(n: number): string {
  return `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Category extraction ──────────────────────────────────────────────
function getCategories(products: CachedProduct[]): string[] {
  const cats = new Set<string>();
  products.forEach((p) => { if ((p as any).category) cats.add((p as any).category); });
  return ["All", ...Array.from(cats).slice(0, 10)];
}

// ── Payment method config ──────────────────────────────────────────
const PAYMENT_METHODS = [
  { method: "CASH", label: "Cash", icon: Banknote, color: "emerald", shortcut: "F3" },
  { method: "CARD", label: "Card", icon: CreditCard, color: "blue", shortcut: "F4" },
  { method: "MOBILE_PAY", label: "Mobile Pay", icon: Smartphone, color: "purple", shortcut: "F5" },
  { method: "GIFT_CARD", label: "Gift Card", icon: Gift, color: "rose", shortcut: "F6" },
];

export default function PosPage() {
  // ── Online status ──
  const [online, setOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Context
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [openShift, setOpenShift] = useState<CachedShift | null>(null);

  // Product search & categories
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const searchRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("bpos_general_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [customerId, setCustomerId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem("bpos_general_customer") || ""; } catch { return ""; }
  });
  const [customers, setCustomers] = useState<CachedCustomer[]>([]);
  const [discountTotal, setDiscountTotal] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try { return Number(localStorage.getItem("bpos_general_discount_total")) || 0; } catch { return 0; }
  });
  const [serviceCharge, setServiceCharge] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try { return Number(localStorage.getItem("bpos_general_service_charge")) || 0; } catch { return 0; }
  });
  const [note, setNote] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem("bpos_general_note") || ""; } catch { return ""; }
  });

  // Payment
  const [activePaymentMethod, setActivePaymentMethod] = useState("CASH");
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 0 }]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Stats (mock/calculated from cart history)
  const [todaySales, setTodaySales] = useState(0);
  const [todayTxCount, setTodayTxCount] = useState(0);

  const [saleSnapshot, setSaleSnapshot] = useState<{
    cart: CartItem[];
    payments: PaymentLine[];
    customerName: string;
  } | null>(null);

  // Keyboard shortcuts
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

  // ── Clock ──
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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

  // ── Load data ──
  const loadData = useCallback(async () => {
    const onlineNow = isOnline();
    if (onlineNow) {
      try {
        const raw = await api.get<{ data: RawTenantInfo }>("/api/v1/tenant");
        const info = pickTenantInfo(raw.data ?? (raw as unknown as RawTenantInfo));
        setTenantInfo(info.branch && info.warehouse ? info : null);
      } catch { setTenantInfo(null); }

      try {
        const [prods, batches] = await Promise.all([fetchAllProducts(), fetchBatches()]);
        const loaded = applyBatchStock(prods, batches) as unknown as CachedProduct[];
        setProducts(Array.isArray(loaded) ? loaded : []);
      } catch { setProducts([]); }

      try {
        const res = await api.get<any>("/api/v1/customers?limit=500");
        const list = res.data ?? (Array.isArray(res) ? res : res?.data || []);
        let localCusts: any[] = [];
        try {
          const raw = localStorage.getItem("bpos_custom_customers");
          if (raw) localCusts = JSON.parse(raw);
        } catch {}
        const mergedMap = new Map();
        (Array.isArray(list) ? list : []).forEach((c: any) => { if (c && c.id) mergedMap.set(c.id, c); });
        localCusts.forEach((c: any) => { if (c && c.id) mergedMap.set(c.id, c); });
        setCustomers(Array.from(mergedMap.values()));
      } catch {
        let localCusts: any[] = [];
        try {
          const raw = localStorage.getItem("bpos_custom_customers");
          if (raw) localCusts = JSON.parse(raw);
        } catch {}
        setCustomers(localCusts);
      }

      // Load today's sales stats
      try {
        const stats = await api.get<any>("/api/v1/pos/stats/today").catch(() => null);
        if (stats) {
          setTodaySales(stats.totalSales || stats.revenue || 0);
          setTodayTxCount(stats.transactionCount || stats.count || 0);
        }
      } catch {}
    } else {
      const cache = await getOfflineCache();
      if (cache && cache.products) {
        setProducts(cache.products || []);
        setCustomers(cache.customers || []);
        if (cache.openShifts?.length) setOpenShift(cache.openShifts[0]);
      } else {
        setProducts([]);
        setCustomers([]);
      }
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Product search (filter local) ──
  useEffect(() => {
    if (!search.trim()) return;
    const term = search.toLowerCase();
    const filtered = products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || (p.barcode && p.barcode === search.trim()),
    );
    if (isOnline()) {
      const t = setTimeout(() => {
        api
          .get(`/products?search=${encodeURIComponent(search)}&limit=100`)
          .then((res: any) => {
            const arr = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setProducts(arr.map((r: any) => toRegisterProduct(r)) as unknown as CachedProduct[]);
          })
          .catch(() => {});
      }, 250);
      return () => clearTimeout(t);
    } else {
      setProducts(filtered);
    }
  }, [search]);

  // ── Filtered products by category ──
  const filteredProducts = useMemo(() => {
    let base = products;
    if (search.trim()) {
      const term = search.toLowerCase();
      base = products.filter(
        (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term),
      );
    }
    if (activeCategory !== "All") {
      base = base.filter((p) => (p as any).category === activeCategory);
    }
    return base;
  }, [products, search, activeCategory]);

  const categories = useMemo(() => getCategories(products), [products]);

  // ── Totals ──
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.lineTotal, 0), [cart]);
  const taxTotal = 0;
  const total = Math.max(subtotal - discountTotal + taxTotal + serviceCharge, 0);

  // ── Customer name lookup ──
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) || null,
    [customers, customerId],
  );
  const customerName = selectedCustomer
    ? (selectedCustomer as any).name || (selectedCustomer as any).fullName || "Customer"
    : "";

  // ── Customer display sync ──
  useEffect(() => {
    publishCart({
      updatedAt: Date.now(),
      lines: cart.map((i) => ({
        name: i.name, qty: i.qty, unitPrice: i.unitPrice, discountAmount: i.discountAmount,
        image: (i as any).image || (i as any).imageUrl,
      })),
      subtotal, discountTotal, taxTotal, total,
      status: cart.length > 0 ? "ACTIVE" : "IDLE",
      source: "RETAIL",
      customerName: customerName || undefined,
    });

    try {
      if (cart.length > 0) localStorage.setItem("bpos_general_cart", JSON.stringify(cart));
      else localStorage.removeItem("bpos_general_cart");
      if (customerId) localStorage.setItem("bpos_general_customer", customerId);
      else localStorage.removeItem("bpos_general_customer");
      if (discountTotal > 0) localStorage.setItem("bpos_general_discount_total", discountTotal.toString());
      else localStorage.removeItem("bpos_general_discount_total");
      if (serviceCharge > 0) localStorage.setItem("bpos_general_service_charge", serviceCharge.toString());
      else localStorage.removeItem("bpos_general_service_charge");
      if (note) localStorage.setItem("bpos_general_note", note);
      else localStorage.removeItem("bpos_general_note");
    } catch {}
  }, [cart, customerId, note, discountTotal, serviceCharge, subtotal, taxTotal, total, customerName]);

  // Sync payment amount with total
  useEffect(() => {
    setPayments([{ method: activePaymentMethod, amount: total }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, activePaymentMethod]);

  // ── Cart operations ──
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
  }

  function handleQtyChange(idx: number, qty: number) {
    if (qty <= 0) { removeItem(idx); return; }
    setCart((prev) => prev.map((item, i) => i === idx ? calcLine({ ...item, qty }) : item));
  }

  function removeItem(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && search.trim()) {
      const match = filteredProducts.find((p) => p.barcode === search.trim() || p.sku === search.trim());
      if (match) { addProduct(match); setSearch(""); searchRef.current?.focus(); }
    }
  }

  // ── Checkout ──
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
      const cartSnapshot = [...cart];
      const paymentsSnapshot = [...payments];
      const customerNameSnapshot = selectedCustomer
        ? (selectedCustomer as any).name || (selectedCustomer as any).fullName || "Walk-in Customer"
        : "Walk-in Retail Customer";

      if (onlineNow) {
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
        setSaleSnapshot({ cart: cartSnapshot, payments: paymentsSnapshot, customerName: customerNameSnapshot });
        setResult(res);
        setCart([]); setCustomerId(""); setDiscountTotal(0); setServiceCharge(0); setNote("");
        setPayments([{ method: activePaymentMethod, amount: 0 }]);
        try {
          localStorage.removeItem("bpos_general_cart");
          localStorage.removeItem("bpos_general_customer");
          localStorage.removeItem("bpos_general_discount_total");
          localStorage.removeItem("bpos_general_service_charge");
          localStorage.removeItem("bpos_general_note");
        } catch {}
        loadHolds();
        setTodaySales((prev) => prev + res.total);
        setTodayTxCount((prev) => prev + 1);
        publishCart({ updatedAt: Date.now(), invoiceNo: res.invoiceNo, lines: cartSnapshot.map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice, discountAmount: i.discountAmount })), subtotal, discountTotal, taxTotal, total, status: "PAID", source: "RETAIL" } as DisplayCart);
      } else {
        const invoiceNo = `OFF-${Date.now().toString(36).toUpperCase()}`;
        const saleId = crypto.randomUUID();
        await syncManager.createOfflineTransaction({
          entityType: "SALE", entityId: saleId,
          branchId: tenantInfo.branch.id,
          payload: { saleId, branchId: tenantInfo.branch.id, warehouseId: tenantInfo.warehouse.id, customerId: customerId || null, items: cart, payments, discountTotal, taxTotal, serviceCharge, note },
        });
        const localResult = makeOfflineResult(invoiceNo, cartSnapshot, total, paymentsSnapshot);
        setSaleSnapshot({ cart: cartSnapshot, payments: paymentsSnapshot, customerName: customerNameSnapshot });
        setResult(localResult);
        setCart([]); setCustomerId(""); setDiscountTotal(0); setServiceCharge(0); setNote("");
        setPayments([{ method: activePaymentMethod, amount: 0 }]);
        try {
          localStorage.removeItem("bpos_general_cart");
          localStorage.removeItem("bpos_general_customer");
        } catch {}
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetSale() {
    setCart([]); setCustomerId(""); setDiscountTotal(0); setServiceCharge(0); setNote("");
    setPayments([{ method: activePaymentMethod, amount: 0 }]);
    setResult(null); setSaleSnapshot(null); setResumingHoldId(null); setError(null); setShowExtras(false);
    try {
      localStorage.removeItem("bpos_general_cart");
      localStorage.removeItem("bpos_general_customer");
      localStorage.removeItem("bpos_general_discount_total");
      localStorage.removeItem("bpos_general_service_charge");
      localStorage.removeItem("bpos_general_note");
    } catch {}
    searchRef.current?.focus();
  }

  // ── Keyboard shortcuts ──
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;
  const actionsRef = useRef({ resetSale, holdSale, confirmSale, loadHolds, cartHasItems: () => cart.length > 0 });
  actionsRef.current = { resetSale, holdSale, confirmSale, loadHolds, cartHasItems: () => cart.length > 0 };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const plainKey = /^[A-Za-z0-9 ]$/.test(e.key);
      if ((tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") && plainKey) return;
      if (recordingAction) {
        e.preventDefault();
        const mods: string[] = [];
        if (e.ctrlKey) mods.push("Ctrl");
        if (e.altKey) mods.push("Alt");
        if (e.shiftKey) mods.push("Shift");
        if (e.metaKey) mods.push("Cmd");
        const keyName = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
        setDraftShortcuts((prev) => ({ ...prev, [recordingAction]: [...mods, keyName].join("+") }));
        setRecordingAction(null);
        return;
      }
      const map = shortcutsRef.current;
      for (const action of SHORTCUT_ACTIONS) {
        if (matchesBinding(e, map[action])) {
          e.preventDefault();
          switch (action) {
            case "search": searchRef.current?.focus(); searchRef.current?.select(); break;
            case "customer": setShowCustomerModal(true); break;
            case "discount": setShowExtras(true); break;
            case "payment": if (actionsRef.current.cartHasItems()) confirmSale(); break;
            case "hold": if (actionsRef.current.cartHasItems()) holdSale(); break;
            case "resume": loadHolds(); setShowHolds(true); break;
            case "return": setShowReturn(true); break;
          }
          return;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingAction]);

  // ── Hold / Resume ──
  async function loadHolds() {
    if (!tenantInfo?.branch?.id) return;
    if (isOnline()) {
      const data = await api.get<HeldSale[]>(`/api/v1/pos/holds?branchId=${tenantInfo.branch.id}`).catch(() => []);
      setHolds(data);
    }
  }

  useEffect(() => { if (tenantInfo) loadHolds(); }, [tenantInfo]);

  async function holdSale() {
    if (cart.length === 0) return;
    if (isOnline()) {
      await api.post("/api/v1/pos/holds", { branchId: tenantInfo?.branch?.id, customerId: customerId || null, items: cart, note });
    } else {
      await syncManager.createOfflineTransaction({ entityType: "HOLD", branchId: tenantInfo?.branch?.id, payload: { branchId: tenantInfo?.branch?.id, customerId: customerId || null, items: cart, note } });
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
    if (isOnline()) await api.del(`/api/v1/pos/holds/${id}`);
    loadHolds();
  }

  // ── Void / Return ──
  async function doVoid() {
    if (!voidSaleId) return;
    setActionSaving(true);
    try {
      if (isOnline()) await api.post(`/api/v1/pos/sales/${voidSaleId}/void`, { reason: voidReason });
      setShowVoid(false); setVoidSaleId(""); setVoidReason("");
    } catch (err: any) { alert(err.message); } finally { setActionSaving(false); }
  }

  async function doReturn() {
    if (!returnSaleId || !returnAmount) return;
    setActionSaving(true);
    try {
      if (isOnline()) {
        await api.post(`/api/v1/pos/sales/${returnSaleId}/return`, { branchId: tenantInfo?.branch?.id, warehouseId: tenantInfo?.warehouse?.id, refundAmount: Number(returnAmount), reason: returnReason, refundMethod: "CASH" });
      } else {
        await syncManager.createOfflineTransaction({ entityType: "RETURN", branchId: tenantInfo?.branch?.id, payload: { saleId: returnSaleId, branchId: tenantInfo?.branch?.id, refundAmount: Number(returnAmount), reason: returnReason, refundMethod: "CASH" } });
      }
      setShowReturn(false); setReturnSaleId(""); setReturnAmount(""); setReturnReason("");
    } catch (err: any) { alert(err.message); } finally { setActionSaving(false); }
  }

  // ── Stats ──
  const avgSale = todayTxCount > 0 ? todaySales / todayTxCount : 0;
  const itemsSold = cart.reduce((s, i) => s + i.qty, 0);

  // ── Filtered customers for modal ──
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 30);
    const t = customerSearch.toLowerCase();
    return customers.filter((c) => ((c as any).name || "").toLowerCase().includes(t) || ((c as any).phone || "").includes(t)).slice(0, 20);
  }, [customers, customerSearch]);

  // ── Receipt screen ──
  if (result) {
    return (
      <div className="mx-auto max-w-md">
        <ReceiptModal
          result={result}
          cart={saleSnapshot?.cart}
          payments={saleSnapshot?.payments}
          customerName={saleSnapshot?.customerName}
          cashierName={(openShift as any)?.cashierName || (openShift as any)?.user?.name || "Cashier"}
          onNewSale={resetSale}
        />
      </div>
    );
  }

  // ── MAIN RENDER ──────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen flex flex-col bg-[#F0F2FA] select-none overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── TOP HEADER ─────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-2.5 bg-white border-b border-slate-200 shadow-sm z-20 shrink-0">
        {/* Logo + Title */}
        <div className="flex items-center gap-2.5 mr-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-md">
            <ShoppingBag size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900">Retail POS</span>
              <span className="text-[10px] font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-1.5 py-0.5 rounded-full">Premium</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {tenantInfo?.branch?.name || "Main Branch"} · {tenantInfo?.warehouse?.name || "Warehouse"}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-xl relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Search product by name, SKU or barcode…"
            className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition"
          />
          <Scan size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadHolds(); setShowHolds(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            <Zap size={13} className="text-yellow-300" />
            Quick Actions
            <ChevronDown size={12} />
          </button>

          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:border-violet-300 hover:text-violet-600 transition"
          >
            <User size={13} />
            {customerName || "Add Customer"}
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:border-violet-300 transition">
            <Scan size={13} />
            Scan
          </button>
        </div>

        {/* Right: Date/Time + Cashier + Status */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <div className="text-right leading-tight hidden xl:block">
            <p className="text-xs font-bold text-slate-800">
              {currentTime.toLocaleDateString("en-BD", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p className="text-[10px] text-slate-400 tabular-nums">
              {currentTime.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
              <User size={12} className="text-white" />
            </div>
            <div className="leading-tight hidden lg:block">
              <p className="text-[11px] font-semibold text-slate-800">Cashier</p>
              <p className="text-[10px] text-slate-400">{(openShift as any)?.cashierName || (openShift as any)?.user?.name || "Operator"}</p>
            </div>
            <ChevronDown size={12} className="text-slate-400" />
          </div>

          <div className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold", online ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200")}>
            <span className={cn("w-2 h-2 rounded-full", online ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            {online ? "Online" : "Offline"}
          </div>
        </div>
      </header>

      {/* ── STATS ROW ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-2.5 bg-white border-b border-slate-100 shrink-0">
        {[
          { icon: TrendingUp, label: "Sales Today", value: fmt(todaySales), sub: `+${todayTxCount} transactions`, color: "text-violet-600", bg: "bg-violet-50" },
          { icon: BarChart2, label: "Transactions", value: todayTxCount.toString(), sub: "Total today", color: "text-blue-600", bg: "bg-blue-50" },
          { icon: Tag, label: "Avg. Sale", value: fmt(avgSale), sub: "Per transaction", color: "text-amber-600", bg: "bg-amber-50" },
          { icon: Package, label: "Items in Cart", value: itemsSold.toString(), sub: `${cart.length} line items`, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2.5 px-4 py-1.5 rounded-xl border border-slate-100 bg-white hover:border-violet-200 transition min-w-[140px]">
            <div className={cn("p-1.5 rounded-lg", stat.bg)}>
              <stat.icon size={14} className={stat.color} />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] text-slate-400 font-medium">{stat.label}</p>
              <p className="text-sm font-bold text-slate-900 tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}

        {/* AI Insight bubble */}
        <div className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200">
          <div className="p-1 rounded-lg bg-violet-100">
            <Cpu size={13} className="text-violet-600" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-semibold text-violet-700">AI Insights</p>
            <p className="text-[10px] text-violet-500">Peak hour approaching</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:border-violet-300 hover:text-violet-600 transition">
            <User size={12} />
            Add Customer
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:border-violet-300 hover:text-violet-600 transition">
            <Scan size={12} />
            Scan Barcode
          </button>
        </div>
      </div>

      {/* ── MAIN BODY ──────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT: Product Grid ───────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Category Tabs */}
          <div className="flex items-center gap-2 px-5 pt-3 pb-2 bg-[#F0F2FA] shrink-0 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                  activeCategory === cat
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-violet-300 hover:text-violet-600"
                )}
              >
                {cat}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Grid/List toggle placeholder */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                <button className="p-1 rounded bg-violet-100 text-violet-600" title="Grid view">
                  <BarChart2 size={13} />
                </button>
                <button className="p-1 rounded text-slate-400 hover:text-slate-600" title="List view">
                  <MoreHorizontal size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 pt-1">
              {filteredProducts.map((p) => {
                const stock = p.stockQty !== undefined ? Number(p.stockQty) : 50;
                const outOfStock = stock <= 0;
                const lowStock = stock > 0 && stock <= 5;
                const price = Number(p.sellingPrice);
                const inCart = cart.find((i) => i.productId === p.id);

                return (
                  <button
                    key={p.id}
                    disabled={outOfStock}
                    onClick={() => addProduct(p)}
                    className={cn(
                      "group relative flex flex-col rounded-2xl border bg-white text-left transition-all duration-200 overflow-hidden hover:shadow-lg",
                      outOfStock
                        ? "border-slate-200 opacity-50 cursor-not-allowed"
                        : inCart
                          ? "border-violet-400 ring-2 ring-violet-100 shadow-md"
                          : "border-slate-200 hover:border-violet-300 hover:ring-2 hover:ring-violet-100"
                    )}
                  >
                    {/* Image area */}
                    <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 h-32 w-full flex items-center justify-center overflow-hidden">
                      {(p as any).imageUrl || (p as any).image ? (
                        <img src={(p as any).imageUrl || (p as any).image} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-300">
                          <Package size={32} />
                        </div>
                      )}
                      {/* Stock badge */}
                      <div className="absolute top-2 right-2">
                        {outOfStock ? (
                          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Out</span>
                        ) : lowStock ? (
                          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{stock} left</span>
                        ) : (
                          <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{stock}</span>
                        )}
                      </div>
                      {/* In-cart badge */}
                      {inCart && (
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">{inCart.qty}</span>
                        </div>
                      )}
                      {/* Add button overlay */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shadow-lg">
                          <Plus size={14} className="text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                        SKU: {p.sku || "PROD"}
                      </p>
                      <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-violet-700 transition">
                        {p.name}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-extrabold text-violet-700 tabular-nums">
                          ৳{price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Star size={9} className="text-amber-400 fill-amber-400" />
                          <span className="text-[9px] text-slate-400">In Stock</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-slate-100 rounded-2xl text-slate-400 mb-3">
                    <Package size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No products found</p>
                  <p className="text-xs text-slate-400 mt-1">Try a different keyword or category</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Current Order Panel ───────────────────────────── */}
        <div className="flex flex-col w-[380px] shrink-0 bg-white border-l border-slate-200 shadow-xl">

          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-violet-600" />
              <span className="text-sm font-bold text-slate-900">Current Order</span>
              {cart.length > 0 && (
                <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.length} Items
                </span>
              )}
              {resumingHoldId && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Resumed</span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button title="Add Customer" onClick={() => setShowCustomerModal(true)} className="p-1.5 rounded-lg text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition"><User size={14} /></button>
              <button title="Hold sale" onClick={holdSale} disabled={cart.length === 0} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30 transition"><PauseCircle size={14} /></button>
              <button title="Held sales" onClick={() => { loadHolds(); setShowHolds(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"><PlayCircle size={14} /></button>
              <button title="Void" onClick={() => setShowVoid(true)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><XCircle size={14} /></button>
              <button title="Return" onClick={() => setShowReturn(true)} className="p-1.5 rounded-lg text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition"><RotateCcw size={14} /></button>
            </div>
          </div>

          {/* Cart Column Headers */}
          {cart.length > 0 && (
            <div className="flex items-center gap-2 px-5 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
              <span className="flex-1">Item</span>
              <span className="w-16 text-center">Price</span>
              <span className="w-16 text-center">Qty</span>
              <span className="w-16 text-right">Total</span>
              <span className="w-6" />
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <ShoppingCart size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Cart is empty</p>
                <p className="text-xs text-slate-300 mt-1">Select products from the left panel</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition group">
                  {/* Product thumb */}
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center shrink-0">
                    <Package size={14} className="text-violet-500" />
                  </div>
                  {/* Name + SKU */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.productId?.slice(0, 8)}</p>
                  </div>
                  {/* Price */}
                  <div className="w-14 text-center">
                    <p className="text-xs font-bold text-slate-700 tabular-nums">৳{item.unitPrice.toFixed(2)}</p>
                  </div>
                  {/* Qty stepper */}
                  <div className="flex items-center gap-1 w-16 justify-center">
                    <button onClick={() => handleQtyChange(idx, item.qty - 1)} className="w-5 h-5 rounded-md bg-slate-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition">
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-4 text-center tabular-nums">{item.qty}</span>
                    <button onClick={() => handleQtyChange(idx, item.qty + 1)} className="w-5 h-5 rounded-md bg-slate-200 hover:bg-violet-100 hover:text-violet-600 flex items-center justify-center transition">
                      <Plus size={10} />
                    </button>
                  </div>
                  {/* Total */}
                  <div className="w-16 text-right">
                    <p className="text-xs font-extrabold text-violet-700 tabular-nums">৳{item.lineTotal.toFixed(2)}</p>
                  </div>
                  {/* Delete */}
                  <button onClick={() => removeItem(idx)} className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bottom Section: Totals + Payment */}
          <div className="shrink-0 border-t border-slate-100 px-5 py-4 space-y-4">

            {/* Totals breakdown */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">৳{subtotal.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Discount</span>
                  <span className="tabular-nums font-medium">−৳{discountTotal.toFixed(2)}</span>
                </div>
              )}
              {taxTotal > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tax (5%)</span>
                  <span className="tabular-nums font-medium">৳{taxTotal.toFixed(2)}</span>
                </div>
              )}
              {serviceCharge > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Service Charge</span>
                  <span className="tabular-nums font-medium">+৳{serviceCharge.toFixed(2)}</span>
                </div>
              )}

              {/* Total Payable box */}
              <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-3 border border-violet-200 mt-2">
                <span className="text-sm font-semibold text-violet-700">Total Payable</span>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-violet-800 tabular-nums">{fmt(total)}</p>
                  {discountTotal > 0 && <p className="text-[10px] text-emerald-600 font-semibold">✓ You save ৳{discountTotal.toFixed(2)}</p>}
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.method}
                  onClick={() => { setActivePaymentMethod(pm.method); setPayments([{ method: pm.method, amount: total }]); }}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center transition-all",
                    activePaymentMethod === pm.method
                      ? "border-violet-400 bg-violet-50 text-violet-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-600"
                  )}
                >
                  <pm.icon size={15} />
                  <span className="text-[9px] font-semibold">{pm.label}</span>
                  <span className="text-[8px] text-slate-400">{pm.shortcut}</span>
                </button>
              ))}
            </div>

            {/* Extras toggle */}
            <button
              onClick={() => setShowExtras((v) => !v)}
              className="flex w-full items-center justify-between text-xs text-slate-400 hover:text-slate-600"
            >
              <span className="flex items-center gap-1"><Settings2 size={11} /> Charges & note</span>
              <ChevronDown size={11} className={showExtras ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {showExtras && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Discount</label>
                  <input type="number" min={0} step="0.01" value={discountTotal || ""} onChange={(e) => setDiscountTotal(Number(e.target.value))} className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Service</label>
                  <input type="number" min={0} step="0.01" value={serviceCharge || ""} onChange={(e) => setServiceCharge(Number(e.target.value))} className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Note</label>
                  <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={holdSale}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40 transition"
              >
                <PauseCircle size={14} />
                Save & Hold
              </button>
              <button
                onClick={resetSale}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 disabled:opacity-40 transition"
              >
                <Trash2 size={14} />
                Clear Order
              </button>
            </div>

            <button
              disabled={cart.length === 0 || submitting}
              onClick={confirmSale}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 transition-all"
            >
              {submitting ? (
                <RefreshCcw size={16} className="animate-spin" />
              ) : (
                <>
                  {online ? <CheckCircle2 size={16} /> : <CloudOff size={16} />}
                  Pay Now
                  {total > 0 && <span className="ml-auto tabular-nums">{fmt(total)}</span>}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTION BAR ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-5 py-2 bg-white border-t border-slate-200 shrink-0">
        {[
          { icon: PauseCircle, label: "Hold Orders", shortcut: "F10", onClick: () => { loadHolds(); setShowHolds(true); } },
          { icon: Clock, label: "Recent Orders", shortcut: "F11", onClick: () => {} },
          { icon: Tag, label: "Price Check", shortcut: null, onClick: () => {} },
          { icon: Package, label: "Stock Lookup", shortcut: null, onClick: () => {} },
          { icon: RotateCcw, label: "Return", shortcut: null, onClick: () => setShowReturn(true) },
          { icon: Tag, label: "Discount", shortcut: null, onClick: () => setShowExtras(true) },
          { icon: Keyboard, label: "Shortcuts", shortcut: null, onClick: () => { setDraftShortcuts(shortcuts); setShowShortcutSettings(true); } },
          { icon: Monitor, label: "Customer Display", shortcut: null, onClick: () => window.open("/pos/customer-display", "_blank", "width=1024,height=768") },
        ].map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-violet-600 transition group min-w-[64px]"
          >
            <action.icon size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium whitespace-nowrap">{action.label}</span>
            {action.shortcut && <span className="text-[9px] text-slate-400">{action.shortcut}</span>}
          </button>
        ))}
      </div>

      {/* ── MODALS ────────────────────────────────────────────────── */}

      {/* Customer Select Modal */}
      <CustomModal open={showCustomerModal} onClose={() => { setShowCustomerModal(false); setCustomerSearch(""); }} title="Select Customer">
        <div className="space-y-3">
          <input
            autoFocus
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            <button
              onClick={() => { setCustomerId(""); setShowCustomerModal(false); setCustomerSearch(""); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 hover:border-violet-300 hover:text-violet-600 transition"
            >
              <User size={14} /> Walk-in Customer
            </button>
            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCustomerId(c.id); setShowCustomerModal(false); setCustomerSearch(""); }}
                className={cn("w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition", customerId === c.id ? "border-violet-400 bg-violet-50 text-violet-700" : "border-slate-100 hover:border-violet-200 hover:bg-violet-50/50")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">
                    {((c as any).name || "?")[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800">{(c as any).name || (c as any).fullName}</p>
                    <p className="text-[10px] text-slate-400">{(c as any).phone || "No phone"}</p>
                  </div>
                </div>
                {customerId === c.id && <CheckCircle2 size={14} className="text-violet-600" />}
              </button>
            ))}
          </div>
        </div>
      </CustomModal>

      {/* Held Sales Modal */}
      <CustomModal open={showHolds} onClose={() => setShowHolds(false)} title="Held Sales">
        <div className="space-y-2">
          {holds.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No held sales</p>}
          {holds.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition">
              <div>
                <p className="text-sm font-semibold">{h.holdNo}</p>
                <p className="text-xs text-slate-400">{h.cartSnapshot.length} items · {new Date(h.createdAt).toLocaleTimeString()}</p>
                {h.note && <p className="text-xs text-slate-500">{h.note}</p>}
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
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Sale ID</label>
            <input value={voidSaleId} onChange={(e) => setVoidSaleId(e.target.value)} placeholder="Paste sale ID" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Reason</label>
            <input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Reason for void" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowVoid(false)}>Cancel</CustomButton>
            <CustomButton variant="danger" loading={actionSaving} onClick={doVoid}>Void Sale</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Return Modal */}
      <CustomModal open={showReturn} onClose={() => setShowReturn(false)} title="Return / Refund">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Sale ID</label>
            <input value={returnSaleId} onChange={(e) => setReturnSaleId(e.target.value)} placeholder="Paste sale ID" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Refund Amount</label>
            <input type="number" min={0} step="0.01" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Reason</label>
            <input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowReturn(false)}>Cancel</CustomButton>
            <CustomButton loading={actionSaving} onClick={doReturn}>Process Return</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Keyboard Shortcut Settings */}
      <CustomModal open={showShortcutSettings} onClose={() => setShowShortcutSettings(false)} title="Keyboard Shortcuts">
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-700">
            <Keyboard size={14} className="mt-0.5 shrink-0" />
            Click an action then press the key combination you want to assign.
          </p>
          <div className="space-y-1.5">
            {SHORTCUT_ACTIONS.map((action) => {
              const isRecording = recordingAction === action;
              return (
                <div key={action} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                  <span className="text-sm text-slate-700">{ACTION_LABELS[action]}</span>
                  <button
                    type="button"
                    onClick={() => setRecordingAction(isRecording ? null : action)}
                    className={`min-w-[92px] rounded-lg border px-3 py-1.5 text-center text-xs font-semibold transition ${isRecording ? "animate-pulse border-violet-400 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300"}`}
                  >
                    {isRecording ? "Press key…" : (draftShortcuts[action] ?? shortcuts[action])}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 pt-1">
            <CustomButton variant="outline" onClick={() => { setDraftShortcuts({ ...DEFAULT_SHORTCUTS }); setRecordingAction(null); }}>Reset to defaults</CustomButton>
            <div className="flex gap-2">
              <CustomButton variant="outline" onClick={() => setShowShortcutSettings(false)}>Cancel</CustomButton>
              <CustomButton onClick={() => { setShortcuts(draftShortcuts); saveShortcuts(draftShortcuts); setShowShortcutSettings(false); }}>Save Shortcuts</CustomButton>
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
