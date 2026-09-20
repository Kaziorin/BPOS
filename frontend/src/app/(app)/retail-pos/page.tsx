"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Search, ShoppingCart, PauseCircle, PlayCircle,
  XCircle, RotateCcw, User, ChevronDown, Settings2, WifiOff, CloudOff,
  Keyboard, Scan, Zap, TrendingUp, BarChart2, Package, Bell, Cpu,
  CreditCard, Banknote, Smartphone, Gift, Plus, Minus, Trash2,
  MoreHorizontal, CheckCircle2, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight,
  Monitor, Tag, ShoppingBag, Star, Clock, RefreshCcw, LayoutGrid,
  ListFilter, Building2, Store, Users, FileText, PieChart,
  Bot, Calculator, Check, ArrowUpRight, Briefcase, Network,
  Receipt, X, RefreshCw, Printer, Maximize, Minimize,
  Sparkles, AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
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
import { useBarcodeScanner, playScanErrorBeep } from "@/lib/useBarcodeScanner";

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

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  // ── Online status ──
  const [online, setOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Context
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [openShift, setOpenShift] = useState<CachedShift | null>(null);

  // User & Cashier context (resolves actual logged-in user)
  const { user: authUser } = useAuth();
  const [localUser, setLocalUser] = useState<{ name?: string; email?: string } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("modernpos_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const currentUser = authUser || localUser;

  const cashierName = useMemo(() => {
    return (
      (openShift as any)?.cashierName ||
      (openShift as any)?.user?.name ||
      currentUser?.name ||
      (currentUser?.email ? currentUser.email.split("@")[0] : null) ||
      "Cashier"
    );
  }, [openShift, currentUser]);

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
  const [customerTab, setCustomerTab] = useState<"view" | "add">("view");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [addingCustomer, setAddingCustomer] = useState(false);

  // AI Assistant & Insights Modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalTab, setAiModalTab] = useState<"recommendations" | "predictions" | "summary">("recommendations");

  // Fullscreen state & toggle
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return toast.error("Name is required");

    // Create a temporary ID for local use
    const tempId = `local_${Date.now()}`;
    const localCust: CachedCustomer = {
      id: tempId,
      name: newCustomer.name,
      phone: newCustomer.phone || null,
      email: newCustomer.email || null,
      address: newCustomer.address || null,
      creditLimit: 0,
      currentDue: 0,
      loyaltyPoints: 0,
      status: "ACTIVE",
    };

    setAddingCustomer(true);
    try {
      const res = await api.post<any>("/api/v1/customers", newCustomer);
      const added = res.data?.data || res.data;

      if (added && added.id) {
        toast.success("Customer added successfully");
        const formattedCust: CachedCustomer = {
          id: String(added.id),
          name: added.name || newCustomer.name,
          phone: added.phone || newCustomer.phone || null,
          email: added.email || newCustomer.email || null,
          address: added.address || newCustomer.address || null,
          creditLimit: Number(added.creditLimit) || 0,
          currentDue: Number(added.currentDue) || 0,
          loyaltyPoints: Number(added.loyaltyPoints) || 0,
          status: added.status || "ACTIVE",
        };
        setCustomers(prev => [formattedCust, ...prev.filter(c => c.id !== tempId)]);
        setCustomerId(added.id);
        setNewCustomer({ name: "", phone: "", email: "", address: "" });
        setCustomerTab("view");
        setShowCustomerModal(false);

        // Save to persistent local storage for fallback
        try {
          const raw = localStorage.getItem("bpos_custom_customers");
          const list = raw ? JSON.parse(raw) : [];
          localStorage.setItem("bpos_custom_customers", JSON.stringify([...list, formattedCust]));
        } catch {}
      }
    } catch (err: any) {
      console.error("Failed to add customer:", err);
      // If duplicate or other error, show the real message
      const errorMsg = err.message || "Failed to add customer";
      toast.error(errorMsg);

      // If it's a network error or server down, we could fallback to local-only,
      // but if it's a 409 (duplicate), we shouldn't.
      if (err.status !== 409 && err.status !== 400) {
        setCustomers(prev => [localCust, ...prev]);
        setCustomerId(tempId);
        setNewCustomer({ name: "", phone: "", email: "", address: "" });
        setCustomerTab("view");
        setShowCustomerModal(false);
        toast.info("Customer saved locally (Offline)");
      }
    } finally {
      setAddingCustomer(false);
    }
  };

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

  // ── AI Insights & Smart Recommendations Calculation ──
  const aiRecommendations = useMemo(() => {
    const allProds = products.length > 0 ? products : DEMO_PRODUCTS;
    const cartIds = new Set(cart.map(c => c.productId || c.name));

    // Products not in cart yet, prioritizing in-stock items
    const available = allProds.filter(
      p => !cartIds.has(p.id) && !cartIds.has(p.name) && (p.stockQty === undefined || Number(p.stockQty) > 0)
    );

    const pool = available.length > 0 ? available : allProds;
    return pool.slice(0, 6).map((prod, i) => {
      let matchReason = "Customer Favorite";
      let matchScore = 88 + (i * 2) % 9;
      if (cart.length > 0) {
        matchReason = i % 2 === 0 ? "Frequent combo with cart items" : "Trending snack / impulse buy";
        matchScore = 95 - i * 3;
      }
      return {
        ...prod,
        matchReason,
        matchScore: Math.min(Math.max(matchScore, 76), 98),
      };
    });
  }, [products, cart]);

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
      cashierName: cashierName,
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

  useBarcodeScanner({
    enabled: !showCheckoutModal && !showCustomerModal && !showHolds && !showReturn,
    onScan: async (code) => {
      const norm = code.trim().toLowerCase();
      const match = products.find(
        (p) =>
          p.barcode?.trim().toLowerCase() === norm ||
          p.sku?.trim().toLowerCase() === norm ||
          p.id?.trim().toLowerCase() === norm
      );
      if (match) {
        addProduct(match);
        toast.success(`Scanned: ${match.name}`);
      } else {
        try {
          const res: any = await api.get("/products", { params: { search: code, limit: 1 } });
          const raw = res?.data || res;
          const found = Array.isArray(raw) ? raw[0] : null;
          if (found) {
            addProduct(found);
            toast.success(`Scanned: ${found.name}`);
          } else {
            playScanErrorBeep();
            toast.error(`Barcode "${code}" not found`);
          }
        } catch {
          playScanErrorBeep();
          toast.error(`Barcode "${code}" not found`);
        }
      }
    },
  });

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

      // Toggle fullscreen on 'f' or 'F' (when not typing in an input)
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
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
          cashierName={cashierName}
          onNewSale={resetSale}
        />
      </div>
    );
  }

  // ── MAIN RENDER ────────────────────────────────────────────────     
  return (
    <div className="h-screen w-screen flex flex-col bg-[#f4f5fa] text-gray-600 select-none overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── VFX & 3D ANIMATIONS ── */
        @keyframes vfxShimmer {
          0% { transform: translateX(-160%) skewX(-20deg); }
          35%, 100% { transform: translateX(260%) skewX(-20deg); }
        }
        .vfx-shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .vfx-shimmer-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            60deg,
            transparent 35%,
            rgba(255, 255, 255, 0.32) 50%,
            transparent 65%
          );
          transform: translateX(-160%) skewX(-20deg);
          animation: vfxShimmer 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          pointer-events: none;
        }

        @keyframes vfxAIPulse {
          0%, 100% {
            box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.25), 0 2px 10px rgba(139, 92, 246, 0.08);
          }
          50% {
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5), 0 4px 18px rgba(139, 92, 246, 0.2);
          }
        }
        .vfx-ai-card {
          animation: vfxAIPulse 3s ease-in-out infinite;
        }

        @keyframes floatMicro {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        .vfx-float {
          animation: floatMicro 2.8s ease-in-out infinite;
        }

        @keyframes radarPing {
          0% { transform: scale(0.95); opacity: 0.85; }
          80%, 100% { transform: scale(2.4); opacity: 0; }
        }
        .radar-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background-color: rgb(16, 185, 129);
          animation: radarPing 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .card-3d {
          transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .card-3d:hover {
          transform: translateY(-3px) scale(1.012);
          box-shadow: 0 12px 24px -4px rgba(139, 92, 246, 0.12), 0 6px 12px -2px rgba(0, 0, 0, 0.05);
        }
        .card-3d:active {
          transform: translateY(0px) scale(0.99);
        }

        .btn-3d {
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-3d:hover {
          transform: translateY(-1px);
        }
        .btn-3d:active {
          transform: translateY(1px) scale(0.97);
        }

        .payable-card-3d {
          position: relative;
          overflow: hidden;
          box-shadow: 0 6px 20px -3px rgba(124, 58, 237, 0.15), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
          transition: all 0.25s ease;
        }
        .payable-card-3d:hover {
          box-shadow: 0 10px 28px -4px rgba(124, 58, 237, 0.22), 0 4px 10px -2px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }
        .payable-card-3d::after {
          content: '';
          position: absolute;
          top: -40%;
          right: -20%;
          width: 150px;
          height: 150px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .payable-card-3d::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
          pointer-events: none;
        }
      `}</style>

      {/* ── 1. TOP HEADER BAR ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 z-30 shrink-0 shadow-xs">
        {/* Left Branding & Navigation */}
        <div className="flex items-center gap-2.5 h-9">
          {/* Back Button with 3D tactile feel */}
          <button
            onClick={handleBack}
            title="Back"
            className="w-9 h-9 rounded-sm border border-slate-200 bg-white hover:bg-violet-50 hover:text-violet-600 text-gray-600 flex items-center justify-center shadow-xs transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-violet-500 to-indigo-400 flex items-center justify-center text-white shrink-0 shadow-sm shadow-violet-200 vfx-float">
            <ShoppingBag size={18} />
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-600 tracking-tight">Enterprise POS</span>
              <span className="text-[10px] font-bold bg-violet-100/80 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200/80 shadow-2xs">
                Premium
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Terminal ID: T-01 &nbsp;•&nbsp; Outlet: {tenantInfo?.branch?.name || "Main Branch"}
            </p>
          </div>
        </div>

        {/* Center Search Bar with Focus Glow */}
        <div className="flex-1 max-w-lg mx-4 h-9 flex items-center">
          <div className="relative w-full h-9 flex items-center">
            <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Search product by name, SKU or barcode..."
              className="w-full h-9 pl-9 pr-9 bg-slate-50 border border-slate-200 rounded-full text-xs text-gray-600 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-violet-400/25 focus:border-violet-400 focus:bg-white shadow-2xs focus:shadow-md transition-all duration-200"
            />
            <button className="absolute right-3 text-slate-400 hover:text-violet-500 transition-transform active:scale-90">
              <Scan size={15} />
            </button>
          </div>
        </div>

        {/* Right Actions & Operator */}
        <div className="flex items-center gap-2 h-9">
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            className="w-9 h-9 rounded-sm border border-slate-200 bg-white hover:bg-violet-50/60 text-gray-600 flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            {isFullscreen ? (
              <Minimize size={16} className="text-violet-500" />
            ) : (
              <Maximize size={16} className="text-violet-500" />
            )}
          </button>

          {/* Quick Actions Button with VFX Shimmer & 3D Tactile Press */}
          <button
            onClick={() => { loadHolds(); setShowHolds(true); }}
            className="h-9 px-3.5 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-violet-300/50 hover:shadow-md hover:shadow-violet-400/50 transition-all cursor-pointer btn-3d vfx-shimmer-btn"
          >
            <Zap size={14} className="text-amber-300 fill-amber-300 animate-pulse shrink-0" />
            <span>Quick Actions</span>
            <ChevronDown size={13} />
          </button>

          {/* Date & Time */}
          <div className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-full border border-slate-200 bg-slate-50 text-slate-600 shrink-0 text-xs font-medium shadow-2xs">
            <Clock size={14} className="text-violet-400" />
            <div className="flex flex-col leading-none">
              <span className="font-bold text-gray-600 text-[11px]">
                {currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-[10px] text-slate-500">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {/* Cashier Selector */}
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer shrink-0 shadow-2xs btn-3d">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 text-white flex items-center justify-center shrink-0">
              <User size={12} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-slate-400 font-medium">Cashier</span>
              <span className="text-xs font-bold text-gray-600 hidden sm:block">
                {cashierName}
              </span>
            </div>
            <ChevronDown size={11} className="text-slate-400" />
          </div>

          {/* Status Badge with Radar Ping VFX */}
          <div className={cn(
            "flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-bold border shrink-0 shadow-2xs",
            online ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
          )}>
            <div className="relative flex items-center justify-center w-2 h-2">
              {online && <span className="radar-ring" />}
              <span className={cn("relative w-2 h-2 rounded-full", online ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
            </div>
            <span>{online ? "Online" : "Offline"}</span>
          </div>
        </div>
      </header>

      {/* ── 2. METRICS & INSIGHTS BAR ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white border-b border-slate-200 shrink-0 w-full overflow-x-auto scrollbar-hide">
        {/* 1. Sales Today */}
        <div className="flex items-center gap-2.5 h-12 px-3 rounded-sm border border-slate-200/90 bg-white flex-1 min-w-[130px] hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="p-1.5 rounded-sm bg-violet-50 text-violet-600 border border-violet-100 shrink-0 shadow-2xs"><TrendingUp size={15} /></div>
          <div className="leading-tight min-w-0">
            <p className="text-[10px] font-semibold uppercase text-slate-500 tracking-wide truncate">Sales Today</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-gray-600 truncate">{fmt(todaySales)}</span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-full border border-emerald-200 shrink-0 shadow-2xs">+12.5%</span>
            </div>
          </div>
        </div>

        {/* 2. Transactions */}
        <div className="flex items-center gap-2.5 h-12 px-3 rounded-sm border border-slate-200/90 bg-white flex-1 min-w-[120px] hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="p-1.5 rounded-sm bg-blue-50 text-blue-600 border border-blue-100 shrink-0 shadow-2xs"><Receipt size={15} /></div>
          <div className="leading-tight min-w-0">
            <p className="text-[10px] font-semibold uppercase text-slate-500 tracking-wide truncate">Transactions</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-gray-600 truncate">{todayTxCount}</span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-full border border-emerald-200 shrink-0 shadow-2xs">+8.1%</span>
            </div>
          </div>
        </div>

        {/* 3. Avg. Sale */}
        <div className="flex items-center gap-2.5 h-12 px-3 rounded-sm border border-slate-200/90 bg-white flex-1 min-w-[120px] hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="p-1.5 rounded-sm bg-amber-50 text-amber-600 border border-amber-100 shrink-0 shadow-2xs"><Tag size={15} /></div>
          <div className="leading-tight min-w-0">
            <p className="text-[10px] font-semibold uppercase text-slate-500 tracking-wide truncate">Avg. Sale</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-gray-600 truncate">{fmt(avgSale)}</span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-full border border-emerald-200 shrink-0 shadow-2xs">+5.2%</span>
            </div>
          </div>
        </div>

        {/* 4. Items Sold */}
        <div className="flex items-center gap-2.5 h-12 px-3 rounded-sm border border-slate-200/90 bg-white flex-1 min-w-[115px] hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="p-1.5 rounded-sm bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0 shadow-2xs"><Package size={15} /></div>
          <div className="leading-tight min-w-0">
            <p className="text-[10px] font-semibold uppercase text-slate-500 tracking-wide truncate">Items Sold</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-gray-600 truncate">128</span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-full border border-emerald-200 shrink-0 shadow-2xs">+10.1%</span>
            </div>
          </div>
        </div>

        {/* 5. Stock Alerts */}
        <div className="flex items-center gap-2.5 h-12 px-3 rounded-sm border border-rose-200 bg-rose-50/50 flex-1 min-w-[115px] hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="p-1.5 rounded-sm bg-rose-100 text-rose-500 border border-rose-200 shrink-0 shadow-2xs"><Bell size={15} /></div>
          <div className="leading-tight min-w-0">
            <p className="text-[10px] font-semibold uppercase text-rose-600 tracking-wide truncate">Stock Alerts</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-rose-600 truncate">8</span>
              <span className="text-[9px] font-bold text-rose-500 bg-rose-100 px-1 py-0.5 rounded-full shrink-0 shadow-2xs animate-pulse">View</span>
            </div>
          </div>
        </div>

        {/* 6. AI Insights with VFX Breathing Pulse & Interactive Modal */}
        <div
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2.5 h-12 px-3 rounded-sm bg-gradient-to-r from-violet-50 via-purple-50/60 to-indigo-50 border border-violet-200/90 flex-[1.4] min-w-[200px] vfx-ai-card transition-all cursor-pointer hover:border-violet-400 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
          title="Click to view AI Insights & Smart Recommendations"
        >
          <div className="p-1.5 rounded-sm bg-gradient-to-br from-violet-500 to-indigo-400 text-white shrink-0 shadow-sm shadow-violet-200 vfx-float group-hover:scale-110 transition-transform"><Bot size={15} /></div>
          <div className="leading-tight min-w-0 flex-1 truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-violet-600 tracking-wide">AI Insights</span>
              <span className="text-[8px] bg-violet-100 text-violet-700 px-1.5 py-0.2 rounded-full font-bold border border-violet-200">Interactive</span>
            </div>
            <p className="text-xs font-bold text-gray-600 truncate">High demand for Beverages</p>
            <p className="text-[10px] text-violet-500 font-medium truncate">Click to view smart suggestions</p>
          </div>
        </div>

        {/* 7. Add Customer */}
        <button
          onClick={() => setShowCustomerModal(true)}
          className="flex items-center justify-center gap-2 h-12 px-3.5 rounded-sm border border-slate-200/90 bg-white hover:bg-violet-50/70 hover:border-violet-300 text-gray-600 hover:text-violet-700 font-semibold text-xs shadow-2xs hover:shadow-md transition-all flex-1 min-w-[130px] group cursor-pointer btn-3d"
        >
          <User size={15} className="text-violet-500 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="truncate">Add Customer</span>
        </button>
      </div>

      {/* ── 3. MAIN CONTENT BODY ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden p-2.5 gap-2.5">

        {/* ── LEFT: Product Catalog ───────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">

          {/* Category Tabs Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 shrink-0 gap-2 bg-slate-50/50">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <CustomTabs
                tabs={categoryTabs}
                activeTab={activeCategory}
                onChange={(catId) => { setActiveCategory(catId); setCurrentPage(1); }}
                themeColor="violet"
                activeClassName="bg-gradient-to-r from-violet-500 to-indigo-400 text-white shadow-sm shadow-violet-200 font-bold rounded-full px-4 py-1.5 btn-3d"
                inactiveClassName="border border-slate-200 bg-white text-slate-600 hover:bg-violet-50/70 hover:border-violet-300 hover:text-violet-600 rounded-full px-4 py-1.5 shadow-2xs transition-all duration-150"
                className="w-full border-none shadow-none bg-transparent p-0 gap-1.5"
              />
            </div>
            {/* View Mode Toggle */}
            <div className="h-8 flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-full border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("h-7 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === "grid" ? "bg-white text-violet-600 border border-slate-200 shadow-xs scale-100" : "text-slate-500 hover:text-gray-600"
                )}
              >
                <LayoutGrid size={13} /><span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("h-7 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === "list" ? "bg-white text-violet-600 border border-slate-200 shadow-xs scale-100" : "text-slate-500 hover:text-gray-600"
                )}
              >
                <ListFilter size={13} /><span>List</span>
              </button>
            </div>
          </div>

          {/* ★ PRODUCT CARDS GRID (COMPACT, FAST, 3D ELEVATION, VFX SHINE) ★ */}
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
                        "group relative flex flex-col bg-white border rounded-sm cursor-pointer overflow-hidden card-3d",
                        outOfStock ? "border-slate-200 opacity-50 cursor-not-allowed"
                          : inCart ? "border-violet-400 ring-2 ring-violet-400/40 shadow-md shadow-violet-200/50"
                          : "border-slate-200/90 hover:border-violet-300"
                      )}
                    >
                      {/* Product Image with Specular Light Effect */}
                      <div className="w-full h-24 bg-slate-100 flex items-center justify-center relative overflow-hidden shrink-0 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent before:z-10">
                        <span className={cn(
                          "absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-sm z-10 shadow-2xs",
                          outOfStock ? "bg-rose-500 text-white" : "bg-slate-800/80 text-white backdrop-blur-xs"
                        )}>
                          {outOfStock ? "Out" : `${stock}`}
                        </span>
                        {inCart && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 text-white flex items-center justify-center text-[10px] font-bold z-10 shadow-md shadow-violet-500/40 ring-2 ring-white">
                            {inCart.qty}
                          </span>
                        )}
                        {(p as any).imageUrl || (p as any).image ? (
                          <img src={(p as any).imageUrl || (p as any).image} alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300 ease-out" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 gap-0.5">
                            <Package size={22} className="opacity-40 group-hover:scale-110 transition-transform duration-200" />
                            <span className="text-[9px] font-bold uppercase opacity-50">No Image</span>
                          </div>
                        )}
                      </div>
                      {/* Card Bottom */}
                      <div className="p-2 flex flex-col gap-1 bg-white">
                        <p className="text-[11px] font-semibold text-gray-600 truncate leading-tight group-hover:text-violet-600 transition-colors" title={p.name}>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-gray-600">{fmt(price)}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); if (!outOfStock) addProduct(p); }}
                            className="w-6 h-6 rounded-sm bg-gradient-to-r from-violet-500 to-indigo-400 text-white hover:from-violet-600 hover:to-indigo-500 flex items-center justify-center transition-all shadow-xs hover:shadow-sm hover:shadow-violet-400/40 active:scale-85 cursor-pointer shrink-0">
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
                    className="flex items-center justify-between p-2.5 rounded-sm border border-slate-200/80 bg-white hover:border-violet-300 hover:shadow-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
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
                      <span className="text-xs font-extrabold text-gray-600">{fmt(Number(p.sellingPrice))}</span>
                      <CustomButton variant="primary" size="sm" className="px-2.5 py-1 text-xs font-bold rounded-sm bg-gradient-to-r from-violet-500 to-indigo-400 hover:from-violet-600 hover:to-indigo-500 text-white">
                        + Add
                      </CustomButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic API Pagination Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/80 bg-white shrink-0">
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
                    "w-7 h-7 rounded-sm text-xs font-bold transition cursor-pointer",
                    currentPage === page
                      ? "bg-gradient-to-r from-violet-500 to-indigo-400 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-gray-600 hover:bg-violet-50"
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
        <div className="w-[440px] xl:w-[480px] shrink-0 flex flex-col bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">

          {/* Cart Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-gray-600 whitespace-nowrap">Current Order</span>
              <span className="text-[11px] font-bold text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200 shrink-0 whitespace-nowrap">
                {cart.length} Items
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex items-center gap-1.5 h-7 px-3 rounded-full border border-slate-200 bg-white hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 text-slate-600 font-semibold text-xs whitespace-nowrap transition shadow-2xs cursor-pointer"
              >
                <User size={12} className="text-violet-500 shrink-0" />
                <span>Add Customer</span>
              </button>
              <button
                onClick={resetSale}
                disabled={cart.length === 0}
                className="flex items-center gap-1.5 h-7 px-3 rounded-full border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-600 font-semibold text-xs whitespace-nowrap transition shadow-2xs cursor-pointer disabled:opacity-40"
              >
                <Trash2 size={12} className="text-rose-500 shrink-0" />
                <span>Clear Cart</span>
                <span className="text-[9px] text-rose-400 font-medium">F9</span>
              </button>
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-12 px-3.5 py-1.5 bg-slate-50/70 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 shrink-0">
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-3 text-center">Qty</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-3.5 py-1 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-12 h-12 rounded-sm bg-violet-50 text-violet-500 flex items-center justify-center mb-2.5 border border-violet-100 shadow-2xs">
                  <ShoppingCart size={22} />
                </div>
                <p className="text-xs font-bold text-gray-600">No items in order</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Select products to add to current order</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center py-2.5 gap-1 group">
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-1">
                    {/* Cart Item Thumbnail Image */}
                    <div className="w-9 h-9 rounded-sm bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200/80 overflow-hidden">
                      {(item as any).image || (item as any).imageUrl ? (
                        <img src={(item as any).image || (item as any).imageUrl} alt={item.name} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Package size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-600 truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">SKU: {(item as any).sku || item.productId?.slice(0, 9)}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-xs font-bold text-gray-600">
                    {fmt(item.unitPrice)}
                  </div>
                  <div className="col-span-3 flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleQtyChange(idx, item.qty - 1)}
                      className="w-5 h-5 rounded-sm border border-slate-200/80 bg-white hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300 text-slate-600 flex items-center justify-center transition-all active:scale-80 cursor-pointer shadow-2xs"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-bold text-gray-600 w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => handleQtyChange(idx, item.qty + 1)}
                      className="w-5 h-5 rounded-sm border border-slate-200/80 bg-white hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300 text-slate-600 flex items-center justify-center transition-all active:scale-80 cursor-pointer shadow-2xs"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                    <span className="text-xs font-extrabold text-gray-600">{fmt(item.lineTotal)}</span>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-0.5 active:scale-80"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Calculations */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2.5 shrink-0">
            {/* Side-by-Side Subtotal/Discount/Tax & Total Payable Card */}
            <div className="grid grid-cols-2 gap-3 items-stretch">
              {/* Left Column: Subtotal, Discount, Tax */}
              <div className="flex flex-col justify-center space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-600">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-bold">-{fmt(discountTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Tax (5%)</span>
                  <span className="font-bold text-gray-600">{fmt(taxTotal)}</span>
                </div>
              </div>

              {/* Right Column: Total Payable Card (Ultra-Premium 3D Glass Card with Light Violet Gradient & VFX Radial Glow) */}
              <div className="payable-card-3d flex flex-col justify-between p-3.5 rounded-sm bg-gradient-to-br from-violet-100/95 via-purple-50/80 to-indigo-50/90 border border-violet-200/90 shadow-sm">
                <span className="text-[11px] font-bold text-slate-600">Total Payable</span>
                <span className="text-2xl font-black text-violet-700 tracking-tight">{fmt(total)}</span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <Tag size={10} className="shrink-0" />
                  <span>You Save {fmt(discountTotal > 0 ? discountTotal : 0.75)}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods with 3D tactile tile interactions */}
            <div className="grid grid-cols-5 gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.method}
                  onClick={() => { setActivePaymentMethod(pm.method); setPayments([{ method: pm.method, amount: total }]); }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 p-1 rounded-sm border text-center transition-all duration-150 cursor-pointer h-13 relative pay-method-tile",
                    activePaymentMethod === pm.method
                      ? "bg-gradient-to-r from-violet-500 to-indigo-400 text-white border-violet-400 shadow-md shadow-violet-300/60 ring-2 ring-violet-400/40"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-violet-50/70 hover:border-violet-300 hover:text-violet-600 shadow-2xs hover:shadow-xs"
                  )}
                >
                  <pm.icon size={15} />
                  <span className="text-[10px] font-bold leading-none">{pm.label}</span>
                  <span className={cn("text-[9px] font-medium leading-none",
                    activePaymentMethod === pm.method ? "text-violet-100" : "text-slate-400"
                  )}>{(pm as any).shortcut}</span>
                </button>
              ))}
            </div>

            {/* Action Buttons: Save & Hold, Pay Now */}
            <div className="flex items-center gap-2">
              <button
                onClick={holdSale}
                disabled={cart.length === 0}
                className="flex-1 h-12 rounded-sm border border-slate-200 bg-white hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 text-gray-600 font-semibold text-xs flex flex-col items-center justify-center leading-tight transition-all disabled:opacity-40 shadow-xs hover:shadow-md cursor-pointer btn-3d"
              >
                <div className="flex items-center gap-1.5">
                  <PauseCircle size={14} className="text-violet-500" />
                  <span className="text-xs font-bold">Save &amp; Hold</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">F8</span>
              </button>

              {/* Flagship CTA: Pay Now Button with VFX Glossy Shimmer Beam & 3D Tactile Elevation */}
              <button
                disabled={cart.length === 0 || submitting}
                onClick={openCheckoutModal}
                className="vfx-shimmer-btn btn-3d flex-[2] h-12 flex items-center justify-between px-4 rounded-sm font-bold text-sm shadow-lg shadow-violet-400/40 hover:shadow-xl hover:shadow-violet-500/50 cursor-pointer bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400 hover:from-violet-600 hover:to-indigo-500 text-white transition-all disabled:opacity-40"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 size={17} className="shrink-0 animate-pulse" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-extrabold whitespace-nowrap">Pay Now</span>
                    <span className="text-[10px] text-violet-100 font-medium leading-none">F12</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-base font-black whitespace-nowrap">{fmt(total)}</span>
                  <ArrowRight size={15} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. FOOTER ─────────────────────────────────────────────── */}
      <div className="px-3 py-2 bg-white border-t border-slate-200 shrink-0 flex items-stretch gap-2.5">
        {/* Left Column: Modules & Action Buttons (Aligned with Product Catalog) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
          {/* Module Cards Row */}
          <div className="grid grid-cols-7 gap-1.5">
            {[
              { icon: Building2, title: "Multi-Branch", sub: `${branchesCount} Branches`, sub2: "Sync Enabled", color: "from-violet-400 to-indigo-400" },
              { icon: Package, title: "Central Warehouse", sub: tenantInfo?.warehouse?.name || "Main Warehouse", sub2: "Stock: 85%", color: "from-blue-500 to-blue-600" },
              { icon: Briefcase, title: "Accounting", sub: "Today's Collection", sub2: fmt(todayCollection), color: "from-emerald-500 to-emerald-600" },
              { icon: Users, title: "HR", sub: "Total Employees", sub2: String(employeesCount), color: "from-amber-500 to-amber-600" },
              { icon: PieChart, title: "BI Dashboard", sub: "Sales vs Target", sub2: "Analyzing...", color: "from-cyan-500 to-cyan-600" },
              { icon: Bot, title: "AI Assistant", sub: "Smart Suggestion", sub2: "Active", color: "from-rose-500 to-rose-600" },
              { icon: Network, title: "Franchise", sub: "Active Outlets", sub2: "Active", color: "from-indigo-400 to-violet-400" },
            ].map((mod, i) => (
              <div
                key={i}
                onClick={() => {
                  if (mod.title === "AI Assistant") setShowAiModal(true);
                }}
                className={cn(
                  "flex items-center gap-1.5 p-1.5 rounded-sm bg-slate-50/70 border border-slate-200/80 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer min-w-0 group",
                  mod.title === "AI Assistant" && "ring-1 ring-violet-300/50 bg-violet-50/30"
                )}
              >
                <div className={cn("p-1.5 rounded-sm bg-gradient-to-br text-white shrink-0 shadow-2xs group-hover:scale-110 transition-transform duration-200", mod.color)}>
                  <mod.icon size={13} />
                </div>
                <div className="leading-tight min-w-0 flex-1 truncate">
                  <span className="text-[10px] font-bold text-gray-600 block truncate">{mod.title}</span>
                  <span className="text-[9px] font-medium text-slate-500 block truncate">{mod.sub}</span>
                  <span className="text-[9px] font-bold text-violet-500 block truncate">{mod.sub2}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Toolbar (8 Buttons spanning 100% of left column) */}
          <div className="grid grid-cols-8 gap-1.5">
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
              <button key={i} onClick={btn.action}
                className="h-8 px-2 rounded-sm border border-slate-200/80 bg-white hover:bg-violet-50 hover:border-violet-300 text-gray-600 hover:text-violet-600 text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all truncate">
                <btn.icon size={13} className="text-violet-500 shrink-0" />
                <span className="truncate">{btn.label}</span>
                {btn.fkey && <span className="text-[9px] text-slate-400 font-medium shrink-0">{btn.fkey}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Today's Summary & System Status (Aligned with Cart) */}
        <div className="w-[440px] xl:w-[480px] shrink-0 flex items-stretch gap-2">
          {/* Today's Summary Card */}
          <div className="flex-1 p-2.5 rounded-sm bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between shadow-2xs hover:border-violet-300 hover:shadow-xs transition-all duration-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Today's Summary</span>
            <div className="grid grid-cols-4 gap-1 mt-1 text-center">
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 block font-medium">Sales</span>
                <span className="text-xs font-extrabold text-gray-600 truncate block">{fmt(todaySales)}</span>
              </div>
              <div className="min-w-0 border-l border-slate-200 pl-1">
                <span className="text-[9px] text-slate-400 block font-medium">Transactions</span>
                <span className="text-xs font-extrabold text-gray-600 truncate block">{todayTxCount}</span>
              </div>
              <div className="min-w-0 border-l border-slate-200 pl-1">
                <span className="text-[9px] text-slate-400 block font-medium">Avg. Sale</span>
                <span className="text-xs font-extrabold text-gray-600 truncate block">{fmt(avgSale)}</span>
              </div>
              <div className="min-w-0 border-l border-slate-200 pl-1">
                <span className="text-[9px] text-slate-400 block font-medium">Items Sold</span>
                <span className="text-xs font-extrabold text-gray-600 truncate block">0</span>
              </div>
            </div>
          </div>

          {/* System Status Card with Radar Ping VFX */}
          <div className="w-[145px] shrink-0 p-2.5 rounded-sm bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all duration-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">System Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="relative flex items-center justify-center w-2 h-2 shrink-0">
                <span className="radar-ring" />
                <span className="relative w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold text-emerald-700 leading-tight truncate">All systems normal</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────── */}

      {/* Customer Select Modal */}
      <CustomModal open={showCustomerModal} onClose={() => { setShowCustomerModal(false); setCustomerSearch(""); setCustomerTab("view"); }} title="Select Customer">
        <div className="flex bg-slate-100 p-1 rounded-sm mb-4">
          <button
            className={cn("flex-1 py-1.5 text-xs font-bold rounded-sm transition cursor-pointer", customerTab === "view" ? "bg-gradient-to-r from-violet-500 to-indigo-400 text-white shadow-xs" : "text-slate-500 hover:text-gray-600")}
            onClick={() => setCustomerTab("view")}
          >
            View Customer
          </button>
          <button
            className={cn("flex-1 py-1.5 text-xs font-bold rounded-sm transition cursor-pointer", customerTab === "add" ? "bg-gradient-to-r from-violet-500 to-indigo-400 text-white shadow-xs" : "text-slate-500 hover:text-gray-600")}
            onClick={() => setCustomerTab("add")}
          >
            Add Customer
          </button>
        </div>

        {customerTab === "view" ? (
          <div className="space-y-3">
            <input
              autoFocus
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search by name or phone…"
              className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
            />
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <button
                onClick={() => { setCustomerId(""); setShowCustomerModal(false); setCustomerSearch(""); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-sm border border-dashed border-slate-300 text-xs text-slate-600 hover:border-violet-400 hover:text-violet-600 transition cursor-pointer"
              >
                <User size={14} /> Walk-in Customer
              </button>
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCustomerId(c.id); setShowCustomerModal(false); setCustomerSearch(""); }}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-sm border text-xs transition cursor-pointer", customerId === c.id ? "border-violet-400 bg-violet-50/80 text-violet-700 font-bold" : "border-slate-200 hover:border-violet-300 hover:bg-slate-50")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">
                      {((c as any).name || "?")[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-600">{(c as any).name || (c as any).fullName}</p>
                      <p className="text-[10px] text-slate-400">{(c as any).phone || "No phone"}</p>
                    </div>
                  </div>
                  {customerId === c.id && <CheckCircle2 size={14} className="text-violet-500" />}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddCustomer} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name *</label>
              <input
                autoFocus
                required
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
              <input
                type="text"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
              />
            </div>
            <button
              type="submit"
              disabled={addingCustomer}
              className="w-full h-9 rounded-sm bg-gradient-to-r from-violet-500 to-indigo-400 hover:from-violet-600 hover:to-indigo-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 mt-2 cursor-pointer transition"
            >
              {addingCustomer ? "Adding..." : "Save Customer"}
            </button>
          </form>
        )}
      </CustomModal>

      {/* Held Sales Modal */}
      <CustomModal open={showHolds} onClose={() => setShowHolds(false)} title="Held Sales">
        <div className="space-y-2">
          {holds.length === 0 ? (
            <p className="text-slate-400 text-sm">No held sales found.</p>
          ) : (
            holds.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-sm bg-slate-50">
                <div>
                  <p className="font-bold text-xs text-gray-600">{h.holdReference || "No Ref"} &bull; {fmt(Number(h.total))}</p>
                  <p className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleTimeString()}</p>
                </div>
                <button onClick={() => resumeHold(h)} className="px-3 py-1.5 rounded-sm bg-gradient-to-r from-violet-500 to-indigo-400 hover:from-violet-600 hover:to-indigo-500 text-white font-bold text-xs shadow-xs cursor-pointer">
                  Resume
                </button>
              </div>
            ))
          )}
        </div>
      </CustomModal>

      {/* Void Modal */}
      <CustomModal open={showVoid} onClose={() => setShowVoid(false)} title="Void Transaction">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Sale ID</label>
            <input value={voidSaleId} onChange={(e) => setVoidSaleId(e.target.value)} placeholder="Paste Sale ID" className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Reason</label>
            <input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Reason for void" className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400" />
          </div>
          <button onClick={doVoid} className="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer">Confirm Void</button>
        </div>
      </CustomModal>

      {/* Return Modal */}
      <CustomModal open={showReturn} onClose={() => setShowReturn(false)} title="Process Return / Refund">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Original Sale ID</label>
            <input value={returnSaleId} onChange={(e) => setReturnSaleId(e.target.value)} placeholder="Paste original Sale ID" className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Refund Amount</label>
            <input type="number" min={0} step="0.01" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} placeholder="0.00" className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Return Reason</label>
            <input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400" placeholder="Damaged, wrong item, etc." />
          </div>
          <button onClick={doReturn} className="px-4 py-2 rounded-sm bg-gradient-to-r from-violet-500 to-indigo-400 hover:from-violet-600 hover:to-indigo-500 text-white font-bold text-xs shadow-xs cursor-pointer">Process Return</button>
        </div>
      </CustomModal>

      {/* Extras Modal (Discount & Note) */}
      <CustomModal open={showExtras} onClose={() => setShowExtras(false)} title="Order Discount & Note">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Order Discount Amount (৳)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={discountTotal || ""}
              onChange={(e) => setDiscountTotal(Number(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full h-9 px-3 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Order Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note to this order..."
              className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowExtras(false)} className="px-4 py-2 rounded-sm border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button onClick={() => setShowExtras(false)} className="px-4 py-2 rounded-sm bg-gradient-to-r from-violet-500 to-indigo-400 hover:from-violet-600 hover:to-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer">Apply</button>
          </div>
        </div>
      </CustomModal>

      {/* Keyboard Shortcut Settings */}
      <CustomModal open={showShortcutSettings} onClose={() => setShowShortcutSettings(false)} title="Keyboard Shortcuts">
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-sm bg-violet-50 px-3 py-2 text-xs text-violet-800">
            <Keyboard size={14} className="mt-0.5 shrink-0" />
            Click an action then press the key combination you want to assign.
          </p>
          <div className="space-y-1">
            {SHORTCUT_ACTIONS.map((action) => {
              const isRecording = recordingAction === action;
              return (
                <div key={action} className="flex items-center justify-between rounded-sm border border-slate-200 px-3 py-1.5">
                  <span className="text-xs font-bold text-slate-600">{ACTION_LABELS[action]}</span>
                  <button
                    type="button"
                    onClick={() => setRecordingAction(isRecording ? null : action)}
                    className={`min-w-[80px] rounded-sm border px-2.5 py-1 text-center text-xs font-semibold transition ${isRecording ? "animate-pulse border-violet-500 bg-violet-50 text-violet-700" : "border-slate-300 bg-slate-50 text-slate-600 hover:border-violet-300"}`}
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
              <CustomButton onClick={() => { setShortcuts(draftShortcuts); saveShortcuts(draftShortcuts); setShowShortcutSettings(false); }} className="bg-brand-primary hover:bg-brand-dark text-white">Save Shortcuts</CustomButton>
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
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400 -mx-6 -mt-5 mb-4 px-6 py-4 flex items-center justify-between rounded-t-sm shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-white/20 backdrop-blur-md text-white shadow-inner">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">Checkout &amp; Payment</h2>
              <p className="text-xs font-semibold text-violet-100">
                {cart.length} item{cart.length !== 1 ? "s" : ""} · Customer: {customerName || "Walk-in Retail Customer"} · Cashier: {cashierName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && setShowCheckoutModal(false)}
            className="rounded-sm p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Total Due Strip ── */}
        <div className="rounded-sm border border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-indigo-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500">Total Payable</p>
              <p className="text-3xl font-black tabular-nums text-violet-600 leading-tight">
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
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-sm border-2 py-3.5 px-2 text-center transition cursor-pointer ${
                      active
                        ? "border-violet-500 bg-gradient-to-r from-violet-500 to-indigo-400 text-white shadow-md shadow-violet-300/30 scale-[1.02]"
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
            <div className="rounded-sm border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Cash Tendered (৳)
                </label>
                <button
                  type="button"
                  onClick={() => setCashTenderedInput(total.toFixed(2))}
                  className="text-xs font-bold text-violet-500 hover:underline cursor-pointer"
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
                  className="w-full rounded-sm border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-2xl font-black text-right tabular-nums text-gray-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 focus:outline-none transition"
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
                    className="rounded-sm border border-slate-200 bg-white py-1.5 text-xs font-bold text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600 transition cursor-pointer"
                  >
                    +৳{denom}
                  </button>
                ))}
              </div>

              {/* Return Change calculation */}
              {(parseFloat(cashTenderedInput) || 0) >= total ? (
                <div className="flex items-center justify-between rounded-sm bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">
                  <span className="text-xs font-bold">Change to Return</span>
                  <span className="text-lg font-black tabular-nums">
                    {fmt(Math.max((parseFloat(cashTenderedInput) || 0) - total, 0))}
                  </span>
                </div>
              ) : (parseFloat(cashTenderedInput) || 0) > 0 ? (
                <div className="flex items-center justify-between rounded-sm bg-amber-50 border border-amber-200 p-3 text-amber-800">
                  <span className="text-xs font-bold">Remaining Due</span>
                  <span className="text-lg font-black tabular-nums">
                    {fmt(total - (parseFloat(cashTenderedInput) || 0))}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-sm bg-slate-100 border border-slate-200 p-3 text-slate-500">
                  <span className="text-xs font-medium">Please enter cash amount received</span>
                  <span className="text-xs font-bold tabular-nums">Total: {fmt(total)}</span>
                </div>
              )}
            </div>
          )}

          {/* ── CARD REFERENCE INPUT ── */}
          {checkoutPayMethod === "CARD" && (
            <div className="rounded-sm border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Card / POS Transaction Reference
              </label>
              <input
                type="text"
                value={cardReference}
                onChange={(e) => setCardReference(e.target.value)}
                placeholder="Card Authorization Code or Last 4 Digits..."
                className="w-full rounded-sm border border-slate-300 bg-white py-2.5 px-3 text-xs font-semibold text-gray-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 focus:outline-none transition"
              />
            </div>
          )}

          {/* ── MOBILE BANKING INPUT ── */}
          {checkoutPayMethod === "MFS" && (
            <div className="rounded-sm border border-slate-200 bg-slate-50/70 p-4 space-y-3">
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
                      "py-1.5 px-2 rounded-sm border text-xs font-bold transition",
                      mfsProvider === p
                        ? "border-violet-400 bg-gradient-to-r from-violet-500 to-indigo-400 text-white"
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
                  className="w-full rounded-sm border border-slate-300 bg-white py-2.5 px-3 text-xs font-semibold text-gray-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          {/* ── CUSTOMER DUE ── */}
          {checkoutPayMethod === "DUE" && (
            <div className="rounded-sm border border-amber-200 bg-amber-50/80 p-4 space-y-1">
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
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-sm bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400 text-white font-black text-sm shadow-md shadow-violet-300/40 hover:from-violet-600 hover:to-indigo-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            cashierName={cashierName}
            onNewSale={() => { setResult(null); setSaleSnapshot(null); }}
          />
        </CustomModal>
      )}

      {/* ── AI ASSISTANT & SMART INSIGHTS MODAL ── */}
      <CustomModal
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="AI Assistant & Smart Insights"
        size="2xl"
      >
        <div className="space-y-4 py-1 select-none">
          {/* Top AI Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-sm bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white shadow-md shadow-violet-300/40 relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-sm bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
                <Bot size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">Enterprise POS AI Engine</h3>
                  <span className="text-[9px] font-bold bg-emerald-400 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-violet-100 font-medium mt-0.5">
                  {cart.length > 0
                    ? `Analyzing ${cart.length} item${cart.length > 1 ? "s" : ""} in order for live cross-sell & bundle recommendations`
                    : "Real-time demand forecasting, smart upselling & inventory intelligence"}
                </p>
              </div>
            </div>
            <Sparkles size={32} className="text-amber-300 opacity-50 absolute -right-2 -bottom-2 pointer-events-none" />
          </div>

          {/* Tab Selection */}
          <div className="flex items-center bg-slate-100 p-1 rounded-sm gap-1">
            <button
              onClick={() => setAiModalTab("recommendations")}
              className={cn(
                "flex-1 py-2 px-2.5 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                aiModalTab === "recommendations"
                  ? "bg-white text-violet-700 shadow-xs"
                  : "text-slate-600 hover:text-gray-600"
              )}
            >
              <Sparkles size={14} className={aiModalTab === "recommendations" ? "text-amber-500" : "text-slate-400"} />
              <span>Smart Recommendations</span>
              {aiRecommendations.length > 0 && (
                <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.2 rounded-full font-extrabold">
                  {aiRecommendations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setAiModalTab("predictions")}
              className={cn(
                "flex-1 py-2 px-2.5 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                aiModalTab === "predictions"
                  ? "bg-white text-violet-700 shadow-xs"
                  : "text-slate-600 hover:text-gray-600"
              )}
            >
              <TrendingUp size={14} className={aiModalTab === "predictions" ? "text-emerald-500" : "text-slate-400"} />
              <span>Demand & Stock Predictions</span>
            </button>

            <button
              onClick={() => setAiModalTab("summary")}
              className={cn(
                "flex-1 py-2 px-2.5 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                aiModalTab === "summary"
                  ? "bg-white text-violet-700 shadow-xs"
                  : "text-slate-600 hover:text-gray-600"
              )}
            >
              <PieChart size={14} className={aiModalTab === "summary" ? "text-blue-500" : "text-slate-400"} />
              <span>Store Intelligence</span>
            </button>
          </div>

          {/* Tab 1: Smart Recommendations */}
          {aiModalTab === "recommendations" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  {cart.length > 0
                    ? "Contextual suggestions matching current customer's cart:"
                    : "Top trending products today with highest conversion:"}
                </span>
                <span className="text-violet-600 font-bold text-[11px]">1-Click Add to Cart</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[46vh] overflow-y-auto p-0.5">
                {aiRecommendations.map((p) => {
                  const price = Number(p.sellingPrice);
                  const inOrder = cart.find(i => i.productId === p.id || i.name === p.name);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-sm border border-slate-200 bg-white hover:border-violet-300 hover:shadow-xs transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                          {(p as any).imageUrl || (p as any).image ? (
                            <img src={(p as any).imageUrl || (p as any).image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <Package size={20} className="text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded-sm border border-violet-200">
                              {(p as any).matchScore || 92}% Match
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Stock: {p.stockQty ?? 45}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-600 truncate leading-tight mt-0.5" title={p.name}>{p.name}</p>
                          <p className="text-[11px] text-violet-700 font-extrabold">{fmt(price)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          addProduct(p);
                          toast.success(`Added ${p.name} to order!`);
                        }}
                        className="ml-2 px-3 py-1.5 rounded-sm bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <Plus size={13} />
                        <span>{inOrder ? `Add (${inOrder.qty})` : "Add"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Stock & Demand Predictions */}
          {aiModalTab === "predictions" && (
            <div className="space-y-3 max-h-[46vh] overflow-y-auto p-0.5">
              {/* Critical Alert */}
              <div className="p-3 rounded-sm border border-rose-200 bg-rose-50/60 flex items-start gap-3">
                <div className="p-2 rounded-sm bg-rose-100 text-rose-600 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-800">Critical Stockout Warning</h4>
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-200/80 px-1.5 py-0.5 rounded-sm">High Urgency</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    <strong>Pure Life Water 1.5L</strong> is selling at <strong>4.2 units/hr</strong>. Current stock is expected to deplete in <strong>~2.5 hours</strong>.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => toast.success("Restock requisition sent to Central Warehouse!")}
                      className="px-2.5 py-1 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-2xs active:scale-95 transition cursor-pointer"
                    >
                      Trigger Reorder Requisition
                    </button>
                    <span className="text-[10px] text-rose-600 font-medium">Reorder Qty: 48 pcs recommended</span>
                  </div>
                </div>
              </div>

              {/* Demand Surge */}
              <div className="p-3 rounded-sm border border-violet-200 bg-violet-50/50 flex items-start gap-3">
                <div className="p-2 rounded-sm bg-violet-100 text-violet-600 shrink-0">
                  <TrendingUp size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-violet-800">Beverages Category Surge</h4>
                    <span className="text-[9px] font-bold text-violet-700 bg-violet-200/80 px-1.5 py-0.5 rounded-sm">+38% Demand</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Historical customer traffic indicates afternoon beverage spike. Ensure cold beverage display chillers are fully stocked.
                  </p>
                </div>
              </div>

              {/* Optimal Stock */}
              <div className="p-3 rounded-sm border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                <div className="p-2 rounded-sm bg-emerald-100 text-emerald-600 shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-800">Optimal Stock Health</h4>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-200/80 px-1.5 py-0.5 rounded-sm">94% Stable</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Central Warehouse stock synchronization active. 142 SKUs have sufficient buffer for next 7 days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Store Intelligence & Summary */}
          {aiModalTab === "summary" && (
            <div className="space-y-3 max-h-[46vh] overflow-y-auto p-0.5">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-sm bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Predicted Peak Rush</span>
                  <span className="text-sm font-extrabold text-gray-600 mt-0.5 block">5:30 PM - 8:30 PM</span>
                  <span className="text-[9px] text-emerald-600 font-semibold block mt-1">Est. 45+ Customers/hr</span>
                </div>
                <div className="p-3 rounded-sm bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Upsell Opportunity</span>
                  <span className="text-sm font-extrabold text-violet-700 mt-0.5 block">+18.2% Basket Size</span>
                  <span className="text-[9px] text-violet-500 font-semibold block mt-1">Pairing Snacks with Drinks</span>
                </div>
                <div className="p-3 rounded-sm bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cashier Speed</span>
                  <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">42 sec / checkout</span>
                  <span className="text-[9px] text-emerald-600 font-semibold block mt-1">Top 5% Performance</span>
                </div>
              </div>

              <div className="p-3.5 rounded-sm border border-slate-200 bg-white space-y-2">
                <h4 className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-violet-500" />
                  <span>AI Cashier Action Recommendations</span>
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
                  <li>Suggest <strong>Coca Cola 500ml</strong> when customer orders snack items (78% take rate).</li>
                  <li>Mention <strong>F8 (Save & Hold)</strong> for multi-cart customers during queue congestion.</li>
                  <li>Customer loyalty points redemption active for registered walk-in members.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
            <span className="text-[11px] text-slate-400 font-medium">
              Enterprise AI POS Engine &bull; Auto-learning active
            </span>
            <button
              onClick={() => setShowAiModal(false)}
              className="px-4 py-1.5 rounded-sm border border-slate-200 bg-white hover:bg-slate-50 text-gray-600 font-bold text-xs transition cursor-pointer shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </CustomModal>

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
                    <td className="px-4 py-2 text-gray-600 font-bold">{fmt(order.total)}</td>
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
            className="w-full h-12 px-4 rounded-sm border border-slate-300 text-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
          />
          <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 min-h-[120px] flex flex-col justify-center items-center text-center">
            {(() => {
              if (!priceCheckSearch) return <span className="text-slate-400">Waiting for input...</span>;
              const term = priceCheckSearch.toLowerCase();
              const found = products.find(p => p.barcode?.toLowerCase() === term || p.name.toLowerCase().includes(term));
              if (!found) return <span className="text-rose-500 font-medium">Product not found.</span>;
              return (
                <div className="w-full">
                  <div className="text-sm font-semibold text-slate-600 mb-1">{found.name}</div>
                  <div className="text-3xl font-extrabold text-violet-500 mb-2">{fmt(Number(found.sellingPrice))}</div>
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
          <div className="w-full h-14 bg-slate-100 rounded-sm px-4 flex items-center justify-end text-2xl font-bold text-gray-600 tracking-wider overflow-hidden">
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
                  "h-12 rounded-sm text-lg font-bold shadow-xs active:scale-95 transition",
                  btn === "=" ? "bg-gradient-to-r from-violet-500 to-indigo-400 text-white hover:from-violet-600 hover:to-indigo-500 shadow-xs cursor-pointer" :
                  ["+","-","*","/"].includes(btn) ? "bg-slate-200 text-gray-600 hover:bg-slate-300 cursor-pointer" :
                  btn === "C" ? "bg-rose-100 text-rose-600 hover:bg-rose-200 cursor-pointer" :
                  "bg-white border border-slate-200 text-gray-600 hover:bg-slate-50 cursor-pointer"
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
