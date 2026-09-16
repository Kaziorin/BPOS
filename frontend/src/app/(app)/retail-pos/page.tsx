"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ShoppingCart, PauseCircle, PlayCircle,
  XCircle, RotateCcw, User, ChevronDown, Settings2, WifiOff, CloudOff,
  Keyboard, Scan, Zap, TrendingUp, BarChart2, Package, Bell, Cpu,
  CreditCard, Banknote, Smartphone, Gift, Plus, Minus, Trash2,
  MoreHorizontal, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight,
  Monitor, Tag, ShoppingBag, Star, Clock, RefreshCcw, LayoutGrid,
  ListFilter, Building2, Store, Users, FileText, PieChart,
  Bot, Calculator, Check, ArrowUpRight, Briefcase, Network,
  Receipt, X, RefreshCw, Printer
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomTabs, type TabItem } from "@/components/custom/CustomTabs";
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

// ── Currency Formatter ─────────────────────────────────────────────
function fmt(n: number): string {
  return `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Category List ──────────────────────────────────────────────────
const STANDARD_CATEGORIES = ["All", "Beverages", "Snacks", "Grocery", "Personal Care", "Household", "Dairy", "Frozen"];

function getCategories(products: CachedProduct[], apiCats: { id: string; name: string }[]): string[] {
  const cats = new Set<string>(["All"]);
  if (Array.isArray(apiCats) && apiCats.length > 0) {
    apiCats.forEach((c) => {
      if (c && c.name) cats.add(c.name);
    });
  }
  products.forEach((p) => {
    const cat = (p as any).category?.name || (p as any).categoryName || (typeof (p as any).category === "string" ? (p as any).category : null);
    if (cat) cats.add(cat);
  });
  if (cats.size <= 1) {
    STANDARD_CATEGORIES.forEach((c) => cats.add(c));
  }
  return Array.from(cats);
}

// ── Demo Products matching retail database seed ────────────────────
const DEMO_PRODUCTS: CachedProduct[] = [];

// Initial demo cart items with full image URLs
const INITIAL_DEMO_CART: CartItem[] = [];

// ── Payment Methods ────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { method: "CASH", label: "Cash", shortcut: "F3", icon: Banknote },
  { method: "CARD", label: "Card", shortcut: "F4", icon: CreditCard },
  { method: "MOBILE_PAY", label: "Mobile Pay", shortcut: "F5", icon: Smartphone },
  { method: "GIFT_CARD", label: "Gift Card", shortcut: "F6", icon: Gift },
  { method: "MORE", label: "More", shortcut: "F7", icon: MoreHorizontal },
];

export default function PosPage() {
  const router = useRouter();

  // ── Online status ──
  const [online, setOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Quick actions dropdown
  const [showQuickActions, setShowQuickActions] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // Context
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [openShift, setOpenShift] = useState<CachedShift | null>(null);

  // Product search & category view
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<CachedProduct[]>(DEMO_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cart (restored from localStorage if available, otherwise demo cart)
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_DEMO_CART;
    try {
      const saved = localStorage.getItem("bpos_general_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_DEMO_CART;
    } catch { return INITIAL_DEMO_CART; }
  });
  const [customerId, setCustomerId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem("bpos_general_customer") || ""; } catch { return ""; }
  });
  const [customers, setCustomers] = useState<CachedCustomer[]>([]);
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  // Payment
  const [activePaymentMethod, setActivePaymentMethod] = useState("CASH");
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 0 }]);

  // ── Checkout & Payment Modal (Matching Restaurant POS) ──
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPayMethod, setCheckoutPayMethod] = useState<"CASH" | "CARD" | "MFS" | "DUE">("CASH");
  const [cashTenderedInput, setCashTenderedInput] = useState<string>("");
  const [cardReference, setCardReference] = useState<string>("");
  const [mfsProvider, setMfsProvider] = useState<string>("bKash");
  const [mfsTrxId, setMfsTrxId] = useState<string>("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Stats matching reference screenshot
  const [todaySales, setTodaySales] = useState(0);
  const [todayTxCount, setTodayTxCount] = useState(0);
  const [todayCollection, setTodayCollection] = useState(0);
  const [branchesCount, setBranchesCount] = useState(1);
  const [employeesCount, setEmployeesCount] = useState(1);

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

  // ── Quick actions outside click listener ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) {
        setShowQuickActions(false);
      }
    }
    if (showQuickActions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showQuickActions]);

  // Categories state from API
  const [apiCategories, setApiCategories] = useState<{ id: string; name: string }[]>([]);

  // ── Extra Features State ──
  const [showRecentOrders, setShowRecentOrders] = useState(false);
  const [recentOrdersList, setRecentOrdersList] = useState<any[]>([]);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [priceCheckSearch, setPriceCheckSearch] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState("");

  const fetchRecentOrders = useCallback(async () => {
    try {
      if (isOnline()) {
        const res = await api.get<any>("/api/v1/pos/sales");
        if (res.data?.data) {
           setRecentOrdersList(res.data.data.slice(0, 10));
        } else if (Array.isArray(res.data)) {
           setRecentOrdersList(res.data.slice(0, 10));
        }
      }
    } catch (e) {}
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
        const catRes = await api.get<any>("/v1/products/categories").catch(() => api.get<any>("/api/v1/products/categories"));
        const catRows = Array.isArray(catRes?.data?.data)
          ? catRes.data.data
          : Array.isArray(catRes?.data)
          ? catRes.data
          : Array.isArray(catRes)
          ? catRes
          : [];
        setApiCategories(catRows);
      } catch {
        setApiCategories([]);
      }

      try {
        const [prods, batches] = await Promise.all([fetchAllProducts(), fetchBatches()]);
        const loaded = applyBatchStock(prods, batches) as unknown as CachedProduct[];
        if (Array.isArray(loaded) && loaded.length > 0) {
          setProducts(loaded);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      }

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

      try {
        const stats = await api.get<any>("/api/v1/pos/stats/today").catch(() => null);
        if (stats) {
          setTodaySales(stats.totalSales || stats.revenue || 0);
          setTodayTxCount(stats.transactionCount || stats.count || 0);
          setTodayCollection(stats.paidTotal || 0);
          if (stats.branchesCount) setBranchesCount(stats.branchesCount);
          if (stats.employeesCount) setEmployeesCount(stats.employeesCount);
        }
      } catch {}
    } else {
      const cache = await getOfflineCache();
      if (cache && cache.products && cache.products.length > 0) {
        setProducts(cache.products);
        setCustomers(cache.customers || []);
        if (cache.openShifts?.length) setOpenShift(cache.openShifts[0]);
      } else {
        setProducts([]);
        setCustomers([]);
      }
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtered products by category & search ──
  const filteredProducts = useMemo(() => {
    let base = products.length > 0 ? products : DEMO_PRODUCTS;
    if (search.trim()) {
      const term = search.toLowerCase();
      base = base.filter(
        (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || (p.barcode && p.barcode.toLowerCase().includes(term)),
      );
    }
    if (activeCategory !== "All") {
      base = base.filter((p) => {
        const catName = (p as any).category?.name || (p as any).categoryName || (typeof (p as any).category === "string" ? (p as any).category : null);
        return catName === activeCategory || (p as any).categoryId === activeCategory || (p as any).category === activeCategory;
      });
    }
    return base;
  }, [products, search, activeCategory]);

  const categories = useMemo(() => getCategories(products.length > 0 ? products : DEMO_PRODUCTS, apiCategories), [products, apiCategories]);

  // Category Tab Items for CustomTabs component
  const categoryTabs: TabItem[] = useMemo(() => {
    return categories.map((cat) => ({
      id: cat,
      label: cat,
    }));
  }, [categories]);

  // Dynamic API Pagination (10 products per page)
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // ── Totals ──
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.lineTotal, 0), [cart]);
  const TAX_RATE = 0.05; // 5% tax
  const taxable = Math.max(subtotal - discountTotal, 0);
  const taxTotal = taxable * TAX_RATE;
  const total = Math.max(taxable + taxTotal + serviceCharge, 0);

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
      const idx = prev.findIndex((i) => (i.productId === p.id || i.name === p.name) && !i.variantId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = calcLine({ ...updated[idx], qty: updated[idx].qty + 1 });
        return updated;
      }
      return [...prev, calcLine({
        productId: p.id, variantId: null,
        name: p.name, qty: 1,
        unitPrice: Number(p.sellingPrice),
        discountAmount: 0, lineTotal: Number(p.sellingPrice),
        image: (p as any).imageUrl || (p as any).image,
      } as any)];
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
  function openCheckoutModal() {
    if (cart.length === 0) return;
    setCheckoutPayMethod(
      activePaymentMethod === "CARD" ? "CARD" :
      activePaymentMethod === "MOBILE_PAY" ? "MFS" :
      activePaymentMethod === "DUE" ? "DUE" : "CASH"
    );
    setCashTenderedInput("0");
    setCardReference("");
    setMfsTrxId("");
    setShowCheckoutModal(true);
  }

  async function confirmSale(methodOverride?: string, tenderedAmount?: number) {
    if (cart.length === 0) return;
    setError(null);
    setSubmitting(true);

    const onlineNow = isOnline();
    try {
      const cartSnapshot = [...cart];
      const payMethod = methodOverride || (checkoutPayMethod === "MFS" ? "MOBILE_PAY" : checkoutPayMethod) || activePaymentMethod;
      const finalTendered =
        payMethod === "CASH" && tenderedAmount !== undefined && tenderedAmount > 0
          ? tenderedAmount
          : total;
      const changeAmount = Math.max(finalTendered - total, 0);

      const paymentsSnapshot: PaymentLine[] = [{ method: payMethod, amount: finalTendered }];
      const customerNameSnapshot = selectedCustomer
        ? (selectedCustomer as any).name || (selectedCustomer as any).fullName || "Walk-in Retail Customer"
        : "Walk-in Retail Customer";

      const branchId = tenantInfo?.branch?.id || "default-branch";
      const warehouseId = tenantInfo?.warehouse?.id || "default-warehouse";

      let saleRes: SaleResult;

      if (onlineNow && tenantInfo?.branch?.id) {
        const res = await api.post<SaleResult>("/api/v1/pos/confirm", {
          branchId,
          warehouseId,
          customerId: customerId || null,
          items: cart,
          payments: paymentsSnapshot,
          discountTotal,
          taxTotal,
          serviceCharge,
          note,
          heldSaleId: resumingHoldId ?? undefined,
        }).catch(() => null);

        saleRes = res || makeOfflineResult(`INV-${Date.now().toString(36).toUpperCase()}`, cartSnapshot, total, paymentsSnapshot);
        (saleRes as any).change = changeAmount;
        (saleRes as any).changeAmount = changeAmount;
        setSaleSnapshot({ cart: cartSnapshot, payments: paymentsSnapshot, customerName: customerNameSnapshot });
        setResult(saleRes);
      } else {
        const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;
        const saleId = crypto.randomUUID();
        await syncManager.createOfflineTransaction({
          entityType: "SALE", entityId: saleId,
          branchId,
          payload: { saleId, branchId, warehouseId, customerId: customerId || null, items: cart, payments: paymentsSnapshot, discountTotal, taxTotal, serviceCharge, note },
        }).catch(() => {});
        const localResult = makeOfflineResult(invoiceNo, cartSnapshot, total, paymentsSnapshot);
        (localResult as any).change = changeAmount;
        (localResult as any).changeAmount = changeAmount;
        setSaleSnapshot({ cart: cartSnapshot, payments: paymentsSnapshot, customerName: customerNameSnapshot });
        setResult(localResult);
      }

      setCart([]); setCustomerId(""); setDiscountTotal(0); setServiceCharge(0); setNote("");
      setPayments([{ method: activePaymentMethod, amount: 0 }]);
      try {
        localStorage.removeItem("bpos_general_cart");
        localStorage.removeItem("bpos_general_customer");
      } catch {}
      setTodaySales((prev) => prev + total);
      setTodayTxCount((prev) => prev + 1);
      setShowCheckoutModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to confirm sale");
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
    } catch {}
    searchRef.current?.focus();
  }

  // ── Keyboard shortcuts ──
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;
  const actionsRef = useRef({ resetSale, holdSale, openCheckoutModal, confirmSale, loadHolds, cartHasItems: () => cart.length > 0 });
  actionsRef.current = { resetSale, holdSale, openCheckoutModal, confirmSale, loadHolds, cartHasItems: () => cart.length > 0 };

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
            case "payment": if (actionsRef.current.cartHasItems()) openCheckoutModal(); break;
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

  async function loadHolds() {
    if (!tenantInfo?.branch?.id) return;
    if (isOnline()) {
      try {
        const res: any = await api.get(`/api/v1/pos/holds?branchId=${tenantInfo.branch.id}`).catch(() => []);
        const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
        const mapped = (Array.isArray(list) ? list : []).map((h: any) => {
          let items: any[] = [];
          if (h.cartSnapshot) {
            try {
              items = typeof h.cartSnapshot === "string" ? JSON.parse(h.cartSnapshot) : h.cartSnapshot;
            } catch {}
          }
          return {
            id: String(h.id),
            holdNo: h.holdNo || `#HOLD-${String(h.id).slice(0, 4)}`,
            createdAt: h.createdAt || new Date().toISOString(),
            cartSnapshot: Array.isArray(items) ? items : (Array.isArray(h.items) ? h.items : []),
            customerId: h.customerId,
            note: h.note,
          };
        });
        setHolds(mapped);
      } catch {
        setHolds([]);
      }
    }
  }

  useEffect(() => { if (tenantInfo) loadHolds(); }, [tenantInfo]);

  async function holdSale() {
    if (cart.length === 0) return;
    if (isOnline() && tenantInfo?.branch?.id) {
      await api.post("/api/v1/pos/holds", { branchId: tenantInfo?.branch?.id, customerId: customerId || null, items: cart, note }).catch(() => {});
    } else {
      await syncManager.createOfflineTransaction({ entityType: "HOLD", branchId: tenantInfo?.branch?.id, payload: { branchId: tenantInfo?.branch?.id, customerId: customerId || null, items: cart, note } }).catch(() => {});
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
    if (isOnline()) await api.del(`/api/v1/pos/holds/${id}`).catch(() => {});
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
      }
      setShowReturn(false); setReturnSaleId(""); setReturnAmount(""); setReturnReason("");
    } catch (err: any) { alert(err.message); } finally { setActionSaving(false); }
  }

  // ── Stats ──
  const avgSale = todayTxCount > 0 ? todaySales / todayTxCount : 0;

  // ── Filtered customers for modal ──
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 30);
    const t = customerSearch.toLowerCase();
    return customers.filter((c) => ((c as any).name || "").toLowerCase().includes(t) || ((c as any).phone || "").includes(t)).slice(0, 20);
  }, [customers, customerSearch]);

  // ── Receipt Modal Screen ──
  if (result) {
    return (
      <div className="mx-auto max-w-md p-6">
        <ReceiptModal
          result={result}
          cart={saleSnapshot?.cart}
          payments={saleSnapshot?.payments}
          customerName={saleSnapshot?.customerName}
          cashierName={(openShift as any)?.cashierName || (openShift as any)?.user?.name || "John Smith"}
          onNewSale={resetSale}
        />
      </div>
    );
  }

  // ── MAIN RENDER ─────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen flex flex-col bg-[#f4f5fb] text-slate-900 select-none overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── 1. TOP HEADER BAR ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 z-30 shrink-0 shadow-sm">
        {/* Left Branding */}
        <div className="flex items-center gap-2.5 h-9">
          <div className="w-8 h-8 rounded-md bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <ShoppingBag size={18} />
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-800 tracking-tight">Enterprise POS</span>
              <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-full border border-violet-200">
                Premium
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Terminal ID: T-01 &nbsp;•&nbsp; Outlet: {tenantInfo?.branch?.name || "Main Branch"}
            </p>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-lg mx-4 h-9 flex items-center">
          <div className="relative w-full h-9 flex items-center">
            <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Search product by name, SKU or barcode..."
              className="w-full h-9 pl-9 pr-9 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
            />
            <button className="absolute right-2.5 text-slate-400 hover:text-violet-600 transition">
              <Scan size={15} />
            </button>
          </div>
        </div>

        {/* Right Actions & Operator */}
        <div className="flex items-center gap-2 h-9">
          {/* Quick Actions Button & Dropdown */}
          <div className="relative" ref={quickActionsRef}>
            <button
              type="button"
              onClick={() => setShowQuickActions((v) => !v)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 shadow-2xs px-3 py-1.5 transition cursor-pointer"
            >
              <Zap size={14} className="text-amber-300 fill-amber-300" />
              <span>Quick Actions</span>
              <ChevronDown size={13} className={cn("transition-transform duration-150", showQuickActions && "rotate-180")} />
            </button>

            {showQuickActions && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-sm shadow-xl py-1.5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Quick Actions</span>
                  <span className="text-teal-600 font-bold">Retail POS</span>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => { setShowQuickActions(false); loadHolds(); setShowHolds(true); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <PauseCircle size={14} className="text-teal-600" />
                      <span>Held Sales</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F4</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowQuickActions(false); setShowReturn(true); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw size={14} className="text-teal-600" />
                      <span>Return / Refund</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F8</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowQuickActions(false); setShowVoid(true); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 size={14} className="text-rose-500" />
                      <span>Void Transaction</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F9</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowQuickActions(false); setShowCustomerModal(true); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-teal-600" />
                      <span>Customer Lookup</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F3</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowQuickActions(false); setShowShortcutSettings(true); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Keyboard size={14} className="text-teal-600" />
                      <span>Shortcuts Settings</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F1</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    type="button"
                    onClick={() => { setShowQuickActions(false); window.open("/retail-pos/customer-display", "_blank"); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-teal-600" />
                      <span>Customer Display</span>
                    </div>
                    <span className="text-[10px] text-teal-700 font-bold">Launch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowQuickActions(false); router.push("/retail-pos/price-checker"); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Scan size={14} className="text-teal-600" />
                      <span>Price Checker</span>
                    </div>
                    <span className="text-[10px] text-teal-700 font-bold">Open</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-slate-200 bg-slate-50 text-gray-600 shrink-0 shadow-2xs text-xs font-medium">
            <Clock size={14} className="text-teal-600" />
            <span className="font-bold text-gray-600">
              {currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="text-[11px] text-gray-500">
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Cashier Selector */}
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shrink-0 shadow-2xs">
            <div className="w-5 h-5 rounded bg-teal-600 text-white flex items-center justify-center shrink-0">
              <User size={12} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-slate-400 font-medium">Cashier</span>
              <span className="text-xs font-bold text-slate-700 hidden sm:block">
                {(openShift as any)?.cashierName || (openShift as any)?.user?.name || "John Smith"}
              </span>
            </div>
            <ChevronDown size={11} className="text-slate-400" />
          </div>

          {/* Status Badge */}
          <div className={cn(
            "flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-bold border shrink-0 shadow-2xs",
            online ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
          )}>
            <span className={cn("w-2 h-2 rounded-full animate-pulse", online ? "bg-emerald-500" : "bg-rose-500")} />
            <span>{online ? "Online" : "Offline"}</span>
          </div>
        </div>
      </header>

      {/* ── 2. METRICS & INSIGHTS BAR (Teal Primary Theme) ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shrink-0 gap-2.5">
        {/* Metric Cards */}
        <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
          {/* Sales Today */}
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-sm border border-slate-200 bg-white shrink-0 min-w-[145px] shadow-2xs hover:border-teal-300 transition">
            <div className="p-1.5 rounded bg-teal-50 text-teal-600 border border-teal-200/60 shrink-0">
              <TrendingUp size={15} />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase text-gray-600 tracking-wide">Sales Today</p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-slate-900">{fmt(todaySales)}</span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/60">
                  +12.5%
                </span>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-sm border border-slate-200 bg-white shrink-0 min-w-[135px] shadow-2xs hover:border-teal-300 transition">
            <div className="p-1.5 rounded bg-teal-50 text-teal-600 border border-teal-200/60 shrink-0">
              <BarChart2 size={15} />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase text-gray-600 tracking-wide">Transactions</p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-slate-900">{todayTxCount}</span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/60">
                  +8.3%
                </span>
              </div>
            </div>
          </div>

          {/* Avg. Sale */}
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-sm border border-slate-200 bg-white shrink-0 min-w-[135px] shadow-2xs hover:border-teal-300 transition">
            <div className="p-1.5 rounded bg-teal-50 text-teal-600 border border-teal-200/60 shrink-0">
              <Tag size={15} />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase text-gray-600 tracking-wide">Avg. Sale</p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-slate-900">{fmt(avgSale)}</span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/60">
                  +5.2%
                </span>
              </div>
            </div>
          </div>

          {/* Items Sold */}
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-sm border border-slate-200 bg-white shrink-0 min-w-[130px] shadow-2xs hover:border-teal-300 transition">
            <div className="p-1.5 rounded bg-teal-50 text-teal-600 border border-teal-200/60 shrink-0">
              <Package size={15} />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase text-gray-600 tracking-wide">Items Sold</p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-slate-900">128</span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/60">
                  +10.1%
                </span>
              </div>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-sm border border-rose-200 bg-rose-50/40 shrink-0 min-w-[120px] shadow-2xs">
            <div className="p-1.5 rounded bg-rose-100 text-rose-600 shrink-0">
              <Bell size={15} />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase text-rose-600 tracking-wide">Stock Alerts</p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-rose-800">8</span>
                <span className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">View</span>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="hidden xl:flex items-center gap-2.5 h-11 px-3 rounded-sm bg-teal-50/60 border border-teal-200/80 shrink-0 min-w-[220px]">
            <div className="p-1.5 rounded bg-teal-600 text-white shrink-0 shadow-2xs">
              <Bot size={15} />
            </div>
            <div className="leading-tight truncate">
              <span className="text-[10px] font-extrabold uppercase text-teal-700 block tracking-wide">AI Insights</span>
              <p className="text-xs font-bold text-gray-600 truncate">High demand for Beverages</p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 h-9 shrink-0">
          <CustomButton
            variant="outline"
            size="sm"
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center gap-1.5 text-gray-600 border-slate-200 hover:bg-slate-50 font-bold rounded-sm px-3 py-1.5 text-xs shadow-2xs"
          >
            <User size={14} className="text-teal-600" />
            <span>Add Customer</span>
          </CustomButton>
          <CustomButton
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-gray-600 border-slate-200 hover:bg-slate-50 font-bold rounded-sm px-3 py-1.5 text-xs shadow-2xs"
          >
            <Scan size={14} className="text-teal-600" />
            <span>Scan Barcode</span>
          </CustomButton>
        </div>
      </div>

      {/* ── 3. MAIN CONTENT BODY ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden p-2.5 gap-2.5">

        {/* ── LEFT: Product Catalog ───────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 bg-white rounded-sm border border-slate-200 shadow-2xs overflow-hidden">

          {/* Category Tabs Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 shrink-0 gap-2 bg-slate-50/50">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <CustomTabs
                tabs={categoryTabs}
                activeTab={activeCategory}
                onChange={(catId) => { setActiveCategory(catId); setCurrentPage(1); }}
                themeColor="purple"
                inactiveClassName="border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                className="w-full border-none shadow-none bg-transparent p-0"
              />
            </div>
            {/* View Mode Toggle */}
            <div className="h-8 flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-sm border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("h-7 px-2.5 rounded-md text-xs font-bold transition flex items-center gap-1",
                  viewMode === "grid" ? "bg-white text-violet-600 border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <LayoutGrid size={13} /><span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("h-7 px-2.5 rounded-md text-xs font-bold transition flex items-center gap-1",
                  viewMode === "list" ? "bg-white text-violet-600 border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <ListFilter size={13} /><span>List</span>
              </button>
            </div>
          </div>

          {/* ★ PRODUCT CARDS GRID (COMPACT, FAST, PERFECTLY SIZED) ★ */}
          <div className="flex-1 overflow-y-auto p-3 bg-slate-50/30">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {paginatedProducts.map((p) => {
                  const stock = p.stockQty !== undefined ? Number(p.stockQty) : 45;
                  const outOfStock = stock <= 0;
                  const price = Number(p.sellingPrice);
                  const inCart = cart.find((i) => i.productId === p.id || i.name === p.name);

                  return (
                    <div
                      key={p.id}
                      onClick={() => !outOfStock && addProduct(p)}
                      className={cn(
                        "group relative flex flex-col bg-white border rounded-sm transition-all duration-200 cursor-pointer overflow-hidden shadow-2xs hover:shadow-md justify-between",
                        outOfStock
                          ? "border-slate-200 opacity-50 cursor-not-allowed"
                          : inCart
                            ? "border-teal-600 ring-2 ring-teal-500/20 shadow-xs"
                            : "border-slate-200 hover:border-teal-400"
                      )}
                    >
                      {/* Product Image */}
                      <div className="w-full h-24 bg-slate-100 flex items-center justify-center relative overflow-hidden shrink-0">
                        <span className={cn(
                          "absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10",
                          outOfStock ? "bg-rose-500 text-white" : "bg-slate-800/80 text-white"
                        )}>
                          {outOfStock ? "Out" : `${stock}`}
                        </span>
                        {inCart && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold z-10 shadow-md">
                            {inCart.qty}
                          </span>
                        )}
                        {(p as any).imageUrl || (p as any).image ? (
                          <img src={(p as any).imageUrl || (p as any).image} alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 gap-0.5">
                            <Package size={22} className="opacity-40" />
                            <span className="text-[9px] font-bold uppercase opacity-50">No Image</span>
                          </div>
                        )}
                      </div>
                      {/* Card Bottom */}
                      <div className="p-2 flex flex-col gap-1 bg-white">
                        <p className="text-[11px] font-semibold text-slate-700 truncate leading-tight group-hover:text-violet-700 transition-colors" title={p.name}>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">{fmt(price)}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); if (!outOfStock) addProduct(p); }}
                            className="w-6 h-6 rounded-lg bg-violet-600 text-white hover:bg-violet-700 flex items-center justify-center transition-all shadow-sm cursor-pointer shrink-0">
                            <Plus size={13} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", outOfStock ? "bg-rose-500" : "bg-emerald-500")} />
                          <span className={cn("text-[10px] font-medium", outOfStock ? "text-rose-500" : "text-emerald-600")}>
                            {outOfStock ? "Out of Stock" : "In Stock"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {paginatedProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addProduct(p)}
                    className="flex items-center justify-between p-2.5 rounded-sm border border-slate-200 bg-white hover:border-teal-400 hover:shadow-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                        {(p as any).imageUrl ? (
                          <img src={(p as any).imageUrl} alt={p.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package size={18} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-600">{p.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">Stock: {p.stockQty ?? 45}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-slate-900">{fmt(Number(p.sellingPrice))}</span>
                      <button type="button" className="px-2.5 py-1 text-xs font-bold rounded-sm bg-teal-600 hover:bg-teal-700 text-white transition shadow-2xs">
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic API Pagination Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-white shrink-0">
            <span className="text-xs font-bold text-gray-600">
              Showing {paginatedProducts.length} of {filteredProducts.length} products (Page {currentPage} of {totalPages})
            </span>
            <div className="flex items-center gap-1.5">
              <CustomButton
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-2 py-1 text-xs font-bold rounded-sm border-slate-200 text-gray-600 disabled:opacity-40"
              >
                <ChevronLeft size={14} className="mr-0.5" /> Prev
              </CustomButton>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-7 h-7 rounded text-xs font-bold transition cursor-pointer",
                    currentPage === page
                      ? "bg-teal-600 text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-gray-600 hover:bg-slate-50"
                  )}
                >
                  {page}
                </button>
              ))}
              <CustomButton
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-2 py-1 text-xs font-bold rounded-sm border-slate-200 text-gray-600 disabled:opacity-40"
              >
                Next <ChevronRight size={14} className="ml-0.5" />
              </CustomButton>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Current Order Panel ──────────────────────────── */}
        <div className="w-[380px] shrink-0 flex flex-col bg-white rounded-sm border border-slate-200 shadow-2xs overflow-hidden">

          {/* Cart Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-slate-800 whitespace-nowrap">Current Order</span>
              <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200 shrink-0 whitespace-nowrap">
                {cart.length} Items
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs whitespace-nowrap transition shadow-2xs cursor-pointer"
              >
                <User size={12} className="text-violet-600 shrink-0" />
                <span>Add Customer</span>
              </button>
              <button
                onClick={resetSale}
                disabled={cart.length === 0}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-600 font-semibold text-xs whitespace-nowrap transition shadow-2xs cursor-pointer disabled:opacity-40"
              >
                <Trash2 size={12} className="text-rose-500 shrink-0" />
                <span>Clear Cart</span>
                <span className="text-[9px] text-rose-400 font-medium">F9</span>
              </button>
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-12 px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 shrink-0">
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-3 text-center">Qty</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-3.5 py-1 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2.5 border border-violet-100 shadow-2xs">
                  <ShoppingCart size={22} />
                </div>
                <p className="text-xs font-bold text-slate-700">No items in order</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Select products to add to current order</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center py-2.5 gap-1 group">
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-1">
                    {/* Cart Item Thumbnail Image */}
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200 overflow-hidden">
                      {(item as any).image || (item as any).imageUrl ? (
                        <img src={(item as any).image || (item as any).imageUrl} alt={item.name} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Package size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">SKU: {(item as any).sku || item.productId?.slice(0, 9)}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-xs font-bold text-slate-700">
                    {fmt(item.unitPrice)}
                  </div>
                  <div className="col-span-3 flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleQtyChange(idx, item.qty - 1)}
                      className="w-5 h-5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-bold text-slate-900 w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => handleQtyChange(idx, item.qty + 1)}
                      className="w-5 h-5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900">{fmt(item.lineTotal)}</span>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-slate-300 hover:text-rose-500 transition cursor-pointer p-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Calculations */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/40 space-y-2.5 shrink-0">
            {/* Side-by-Side Subtotal/Discount/Tax & Total Payable Card */}
            <div className="grid grid-cols-2 gap-3 items-stretch">
              {/* Left Column: Subtotal, Discount, Tax */}
              <div className="flex flex-col justify-center space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-bold">-{fmt(discountTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Tax (5%)</span>
                  <span className="font-bold text-slate-900">{fmt(taxTotal)}</span>
                </div>
              </div>

            {/* Total Payable Card */}
            <div className="flex items-center justify-between p-3 rounded-md bg-white border border-slate-200 shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">Total Payable</span>
                {discountTotal > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 inline-flex items-center gap-0.5 mt-0.5">
                    <Check size={10} /> You Save {fmt(discountTotal)}
                  </span>
                )}
              </div>
              <span className="text-xl font-black text-teal-600">{fmt(total)}</span>
            </div>
          </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-5 gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.method}
                  onClick={() => { setActivePaymentMethod(pm.method); setPayments([{ method: pm.method, amount: total }]); }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-sm border text-center transition-all cursor-pointer h-12",
                    activePaymentMethod === pm.method
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  )}
                >
                  <pm.icon size={15} />
                  <span className="text-[10px] font-bold leading-none">{pm.label}</span>
                  <span className={cn("text-[9px] font-medium leading-none",
                    activePaymentMethod === pm.method ? "text-violet-200" : "text-slate-400"
                  )}>{(pm as any).shortcut}</span>
                </button>
              ))}
            </div>

            {/* Action Buttons: Save & Hold, Pay Now */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={holdSale}
                disabled={cart.length === 0}
                className="w-full text-teal-700 border border-teal-200 bg-teal-50/50 hover:bg-teal-100 font-bold rounded-sm py-2 text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PauseCircle size={14} />
                <span>Hold Sale</span>
              </button>
              <CustomButton
                variant="danger"
                size="sm"
                onClick={resetSale}
                disabled={cart.length === 0}
                className="w-full font-bold rounded-sm py-2 text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Clear Order</span>
              </CustomButton>
            </div>

            {/* Pay Now CTA */}
            <button
              type="button"
              disabled={cart.length === 0 || submitting}
              onClick={() => confirmSale()}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-extrabold text-sm shadow-md cursor-pointer bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>Pay Now</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{fmt(total)}</span>
                <ArrowRight size={15} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. FOOTER ─────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 shrink-0 space-y-2">
        {/* Module Cards — Row 1 (Retail Teal Theme) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {[
            { icon: Store, title: "Active Outlet", sub: tenantInfo?.branch?.name || "Main Branch", sub2: "Sync Active" },
            { icon: Building2, title: "Warehouse", sub: tenantInfo?.warehouse?.name || "Main Warehouse", sub2: "Stock Synced" },
            { icon: Package, title: "Catalog", sub: `${products.length} Products`, sub2: "Dynamic API" },
            { icon: Users, title: "Customers", sub: `${customers.length} Registered`, sub2: "Active Directory" },
            { icon: Clock, title: "Register Shift", sub: openShift?.shiftNo || "Shift #1", sub2: openShift?.status || "OPEN" },
            { icon: Bot, title: "AI Assistant", sub: "Auto Stock Alert", sub2: "Optimal Levels" },
            { icon: CheckCircle2, title: "POS Status", sub: online ? "Online" : "Offline", sub2: "Fast Mode" },
          ].map((mod, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-sm bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition cursor-pointer">
              <div className="p-1 rounded bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                <mod.icon size={14} />
              </div>
              <div className="leading-tight min-w-0">
                <span className="text-[11px] font-bold text-gray-700 block truncate">{mod.title}</span>
                <span className="text-[10px] font-medium text-gray-500 block truncate">{mod.sub}</span>
                <span className="text-[10px] font-extrabold text-teal-700 block truncate">{mod.sub2}</span>
              </div>
            </div>
          ))}
        </div>

          {/* Bottom Toolbar & Summary Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Bottom Toolbar (8 Buttons) */}
            <div className="grid grid-cols-8 gap-1.5 flex-1">
              {[
                { label: "Hold Orders", fkey: "F10", icon: PauseCircle, action: () => { loadHolds(); setShowHolds(true); } },
                { label: "Recent Orders", fkey: "F11", icon: Clock, action: () => { fetchRecentOrders(); setShowRecentOrders(true); } },
                { label: "Price Check", fkey: "", icon: Search, action: () => { setPriceCheckSearch(""); setShowPriceCheck(true); } },
                { label: "Stock Lookup", fkey: "", icon: Package, action: () => { setPriceCheckSearch(""); setShowPriceCheck(true); } },
                { label: "Return", fkey: "", icon: RotateCcw, action: () => setShowReturn(true) },
                { label: "Discount", fkey: "", icon: Tag, action: () => setShowExtras(true) },
                { label: "Note", fkey: "", icon: FileText, action: () => setShowExtras(true) },
                { label: "Calculator", fkey: "", icon: Calculator, action: () => setShowCalculator(true) },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className="h-7.5 px-3 rounded-sm border border-slate-200 bg-white hover:bg-teal-50/80 hover:border-teal-400 text-slate-700 hover:text-teal-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition whitespace-nowrap"
                >
                  <btn.icon size={13} className="text-teal-600 shrink-0" />
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Today's Summary + System Status */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-3 px-3 py-1 rounded-sm bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Summary</span>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-500 font-medium">Sales</p>
                    <p className="text-xs font-extrabold text-slate-900">{fmt(todaySales)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-500 font-medium">Txns</p>
                    <p className="text-xs font-extrabold text-slate-900">{todayTxCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-500 font-medium">Avg. Sale</p>
                    <p className="text-xs font-extrabold text-slate-900">{fmt(avgSale)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Status</span>
                <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                  <CheckCircle2 size={13} />
                  <span>Normal</span>
                </div>
              </div>
            </div>
          </div>
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
            className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button
              onClick={() => { setCustomerId(""); setShowCustomerModal(false); setCustomerSearch(""); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-sm border border-dashed border-slate-300 text-xs text-gray-600 hover:border-teal-400 hover:text-teal-600 transition cursor-pointer"
            >
              <User size={14} /> Walk-in Customer
            </button>
            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCustomerId(c.id); setShowCustomerModal(false); setCustomerSearch(""); }}
                className={cn("w-full flex items-center justify-between px-3 py-2 rounded-sm border text-xs transition cursor-pointer", customerId === c.id ? "border-teal-600 bg-teal-50 text-teal-800 font-bold" : "border-slate-200 hover:border-teal-300 hover:bg-slate-50")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold">
                    {((c as any).name || "?")[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900">{(c as any).name || (c as any).fullName}</p>
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
          {(!Array.isArray(holds) || holds.length === 0) && <p className="py-6 text-center text-xs text-slate-500">No held sales found</p>}
          {Array.isArray(holds) && holds.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-sm border border-slate-200 p-3 hover:bg-slate-50 transition">
              <div>
                <p className="text-xs font-semibold text-slate-800">{h.holdNo}</p>
                <p className="text-[11px] text-slate-500">{(Array.isArray(h.cartSnapshot) ? h.cartSnapshot.length : 0)} items · {new Date(h.createdAt).toLocaleTimeString()}</p>
                {h.note && <p className="text-[11px] text-slate-400">{h.note}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => resumeHold(h)} className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition">Resume</button>
                <button onClick={() => deleteHold(h.id)} className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </CustomModal>

      {/* Void Modal */}
      <CustomModal open={showVoid} onClose={() => setShowVoid(false)} title="Void Sale">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Sale ID</label>
            <input value={voidSaleId} onChange={(e) => setVoidSaleId(e.target.value)} placeholder="Paste sale ID" className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Reason</label>
            <input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Reason for void" className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowVoid(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={doVoid} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">Void Sale</button>
          </div>
        </div>
      </CustomModal>

      {/* Return Modal */}
      <CustomModal open={showReturn} onClose={() => setShowReturn(false)} title="Return / Refund">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Sale ID</label>
            <input value={returnSaleId} onChange={(e) => setReturnSaleId(e.target.value)} placeholder="Paste sale ID" className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Refund Amount</label>
            <input type="number" min={0} step="0.01" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Reason</label>
            <input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowReturn(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={doReturn} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold">Process Return</button>
          </div>
        </div>
      </CustomModal>

      {/* Discount / Note Modal */}
      <CustomModal open={showExtras} onClose={() => setShowExtras(false)} title="Discount & Note">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Order Discount (৳)</label>
            <input
              type="number" min={0} step="0.01"
              value={discountTotal || ""}
              onChange={(e) => setDiscountTotal(Number(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Order Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note to this order..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowExtras(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={() => setShowExtras(false)} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold">Apply</button>
          </div>
        </div>
      </CustomModal>

      {/* Keyboard Shortcut Settings */}
      <CustomModal open={showShortcutSettings} onClose={() => setShowShortcutSettings(false)} title="Keyboard Shortcuts">
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-sm bg-teal-50 px-3 py-2 text-xs text-teal-800">
            <Keyboard size={14} className="mt-0.5 shrink-0" />
            Click an action then press the key combination you want to assign.
          </p>
          <div className="space-y-1">
            {SHORTCUT_ACTIONS.map((action) => {
              const isRecording = recordingAction === action;
              return (
                <div key={action} className="flex items-center justify-between rounded-sm border border-slate-200 px-3 py-1.5">
                  <span className="text-xs font-bold text-gray-600">{ACTION_LABELS[action]}</span>
                  <button
                    type="button"
                    onClick={() => setRecordingAction(isRecording ? null : action)}
                    className={`min-w-[80px] rounded-sm border px-2.5 py-1 text-center text-xs font-semibold transition ${isRecording ? "animate-pulse border-teal-600 bg-teal-50 text-teal-700" : "border-slate-300 bg-slate-50 text-gray-600 hover:border-teal-400"}`}
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
              <CustomButton onClick={() => { setShortcuts(draftShortcuts); saveShortcuts(draftShortcuts); setShowShortcutSettings(false); }} className="bg-teal-600 hover:bg-teal-700 text-white">Save Shortcuts</CustomButton>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* ── RETAIL PAYMENT CHECKOUT MODAL (MATCHING RESTAURANT POS) ── */}
      <CustomModal
        open={showCheckoutModal}
        onClose={() => !submitting && setShowCheckoutModal(false)}
        title=""
        size="md"
      >
        {/* ── Violet Header ── */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 -mx-6 -mt-5 mb-4 px-6 py-4 flex items-center justify-between rounded-t-md shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">Checkout &amp; Payment</h2>
              <p className="text-xs font-semibold text-violet-100">
                {cart.length} item{cart.length !== 1 ? "s" : ""} · Customer: {customerName || "Walk-in Retail Customer"} · Cashier: {(openShift as any)?.cashierName || (openShift as any)?.user?.name || "John Smith"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && setShowCheckoutModal(false)}
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Total Due Strip ── */}
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Payable</p>
              <p className="text-3xl font-black tabular-nums text-violet-700 leading-tight">
                {fmt(total)}
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 space-y-1 text-right">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Subtotal:</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between gap-4 text-emerald-600">
                  <span>Discount:</span>
                  <span>−{fmt(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Tax (5%):</span>
                <span>{fmt(taxTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment Options ── */}
        <div className="space-y-4 pt-3">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "CASH", label: "Cash", icon: Banknote },
                { id: "CARD", label: "Card / POS", icon: CreditCard },
                { id: "MFS", label: "Mobile Banking", icon: Smartphone },
                { id: "DUE", label: "Customer Due", icon: Receipt },
              ].map(({ id, label, icon: Icon }) => {
                const active = checkoutPayMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCheckoutPayMethod(id as any)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 py-3.5 px-2 text-center transition cursor-pointer ${
                      active
                        ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-500/20 scale-[1.02]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/50"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-[11px] font-black">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── CASH TENDERING INPUT & DENOMINATIONS ── */}
          {checkoutPayMethod === "CASH" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Cash Tendered (৳)
                </label>
                <button
                  type="button"
                  onClick={() => setCashTenderedInput(total.toFixed(2))}
                  className="text-xs font-bold text-violet-600 hover:underline cursor-pointer"
                >
                  Exact Amount
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">৳</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  value={cashTenderedInput}
                  onChange={(e) => setCashTenderedInput(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = parseFloat(cashTenderedInput) || 0;
                      if (val >= total && !submitting) {
                        confirmSale("CASH", val);
                      }
                    }
                  }}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-2xl font-black text-right tabular-nums text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition"
                />
              </div>

              {/* Presets */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                {[10, 20, 50, 100, 500].map((denom) => (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(cashTenderedInput) || 0;
                      setCashTenderedInput((cur + denom).toFixed(2));
                    }}
                    className="rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-bold text-slate-700 hover:bg-violet-50 hover:border-violet-300 transition cursor-pointer"
                  >
                    +৳{denom}
                  </button>
                ))}
              </div>

              {/* Return Change calculation */}
              {(parseFloat(cashTenderedInput) || 0) >= total ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">
                  <span className="text-xs font-bold">Change to Return</span>
                  <span className="text-lg font-black tabular-nums">
                    {fmt(Math.max((parseFloat(cashTenderedInput) || 0) - total, 0))}
                  </span>
                </div>
              ) : (parseFloat(cashTenderedInput) || 0) > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800">
                  <span className="text-xs font-bold">Remaining Due</span>
                  <span className="text-lg font-black tabular-nums">
                    {fmt(total - (parseFloat(cashTenderedInput) || 0))}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl bg-slate-100 border border-slate-200 p-3 text-slate-500">
                  <span className="text-xs font-medium">Please enter cash amount received</span>
                  <span className="text-xs font-bold tabular-nums">Total: {fmt(total)}</span>
                </div>
              )}
            </div>
          )}

          {/* ── CARD REFERENCE INPUT ── */}
          {checkoutPayMethod === "CARD" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Card / POS Transaction Reference
              </label>
              <input
                type="text"
                value={cardReference}
                onChange={(e) => setCardReference(e.target.value)}
                placeholder="Card Authorization Code or Last 4 Digits..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs font-semibold text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition"
              />
            </div>
          )}

          {/* ── MOBILE BANKING INPUT ── */}
          {checkoutPayMethod === "MFS" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Mobile Banking Provider
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["bKash", "Nagad", "Rocket", "Upay"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMfsProvider(p)}
                    className={cn(
                      "py-1.5 px-2 rounded-lg border text-xs font-bold transition",
                      mfsProvider === p
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Transaction ID (TrxID)
                </label>
                <input
                  type="text"
                  value={mfsTrxId}
                  onChange={(e) => setMfsTrxId(e.target.value)}
                  placeholder="Enter TrxID (e.g. 9J4K2L8X)..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs font-semibold text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          {/* ── CUSTOMER DUE ── */}
          {checkoutPayMethod === "DUE" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-1">
              <p className="text-xs font-bold text-amber-900">Customer Credit / Due Sale</p>
              <p className="text-[11px] text-amber-700">
                The total amount ({fmt(total)}) will be recorded as receivable against {customerName || "Walk-in Retail Customer"}.
              </p>
            </div>
          )}

          {/* ── ACTION BUTTON ── */}
          <div className="pt-2">
            <button
              type="button"
              disabled={
                submitting ||
                (checkoutPayMethod === "CASH" &&
                  (parseFloat(cashTenderedInput) || 0) < total)
              }
              onClick={() => {
                const tendered = parseFloat(cashTenderedInput) || total;
                const payLineMethod = checkoutPayMethod === "MFS" ? "MOBILE_PAY" : checkoutPayMethod;
                confirmSale(payLineMethod, tendered);
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Processing Sale...
                </>
              ) : checkoutPayMethod === "CASH" && (parseFloat(cashTenderedInput) || 0) < total ? (
                <>
                  <CheckCircle2 size={18} /> Enter Tendered Cash ({fmt(total)})
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Complete Sale ({fmt(total)})
                </>
              )}
            </button>
          </div>
        </div>
      </CustomModal>

      {/* ── RECEIPT MODAL ── */}
      {result && (
        <CustomModal
          open={!!result}
          onClose={() => { setResult(null); setSaleSnapshot(null); }}
          title=""
          size="md"
        >
          <ReceiptModal
            result={result}
            cart={saleSnapshot?.cart || []}
            payments={saleSnapshot?.payments || []}
            customerName={saleSnapshot?.customerName}
            cashierName={(openShift as any)?.cashierName || (openShift as any)?.user?.name || "John Smith"}
            onNewSale={() => { setResult(null); setSaleSnapshot(null); }}
          />
        </CustomModal>
      )}

      {/* Recent Orders Modal */}
      <CustomModal open={showRecentOrders} onClose={() => setShowRecentOrders(false)} title="Recent Orders" size="lg">
        <div className="max-h-[60vh] overflow-y-auto">
          {recentOrdersList.length === 0 ? (
            <div className="text-center text-slate-500 py-10">No recent orders found.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Paid</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrdersList.map((order: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{new Date(order.createdAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-2 text-slate-700 font-bold">{fmt(order.total)}</td>
                    <td className="px-4 py-2 text-emerald-600 font-semibold">{fmt(order.paidTotal)}</td>
                    <td className="px-4 py-2 text-slate-500">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CustomModal>

      {/* Price / Stock Check Modal */}
      <CustomModal open={showPriceCheck} onClose={() => setShowPriceCheck(false)} title="Price & Stock Check" size="sm">
        <div className="space-y-4 py-2">
          <input
            autoFocus
            type="text"
            value={priceCheckSearch}
            onChange={(e) => setPriceCheckSearch(e.target.value)}
            placeholder="Scan barcode or type name..."
            className="w-full h-12 px-4 rounded-xl border border-slate-300 text-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
          />
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[120px] flex flex-col justify-center items-center text-center">
            {(() => {
              if (!priceCheckSearch) return <span className="text-slate-400">Waiting for input...</span>;
              const term = priceCheckSearch.toLowerCase();
              const found = products.find(p => p.barcode?.toLowerCase() === term || p.name.toLowerCase().includes(term));
              if (!found) return <span className="text-rose-500 font-medium">Product not found.</span>;
              return (
                <div className="w-full">
                  <div className="text-sm font-semibold text-slate-600 mb-1">{found.name}</div>
                  <div className="text-3xl font-extrabold text-violet-600 mb-2">{fmt(Number(found.sellingPrice))}</div>
                  <div className="text-sm font-medium text-slate-500">
                    Stock: <span className="text-emerald-600 font-bold">{found.stockQty} {found.unit}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </CustomModal>

      {/* Calculator Modal */}
      <CustomModal open={showCalculator} onClose={() => setShowCalculator(false)} title="Calculator" size="sm">
        <div className="w-full max-w-[280px] mx-auto space-y-2">
          <div className="w-full h-14 bg-slate-100 rounded-xl px-4 flex items-center justify-end text-2xl font-bold text-slate-800 tracking-wider overflow-hidden">
            {calcInput || "0"}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["7","8","9","/","4","5","6","*","1","2","3","-","C","0","=","+"].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === "C") setCalcInput("");
                  else if (btn === "=") {
                    try { setCalcInput(String(eval(calcInput))); } catch { setCalcInput("Error"); }
                  } else {
                    setCalcInput(prev => (prev === "Error" || prev === "0" ? btn : prev + btn));
                  }
                }}
                className={cn(
                  "h-12 rounded-xl text-lg font-bold shadow-xs active:scale-95 transition",
                  btn === "=" ? "bg-violet-600 text-white hover:bg-violet-700" :
                  ["+","-","*","/"].includes(btn) ? "bg-slate-200 text-slate-700 hover:bg-slate-300" :
                  btn === "C" ? "bg-rose-100 text-rose-600 hover:bg-rose-200" :
                  "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                )}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
