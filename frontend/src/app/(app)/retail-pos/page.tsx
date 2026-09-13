"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search, ShoppingCart, PauseCircle, PlayCircle,
  XCircle, RotateCcw, User, ChevronDown, Settings2, WifiOff, CloudOff,
  Keyboard, Scan, Zap, TrendingUp, BarChart2, Package, Bell, Cpu,
  CreditCard, Banknote, Smartphone, Gift, Plus, Minus, Trash2,
  MoreHorizontal, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight,
  Monitor, Tag, ShoppingBag, Star, Clock, RefreshCcw, LayoutGrid,
  ListFilter, Building2, Store, Users, FileText, PieChart,
  Bot, Calculator, Check, ArrowUpRight
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
  return `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
const DEMO_PRODUCTS: CachedProduct[] = [
  {
    id: "demo-1",
    sku: "WTR-0015",
    name: "Pure Life Water 1.5L",
    sellingPrice: "1.20",
    costPrice: "0.80",
    stockQty: "45",
    unit: "pcs",
    productType: "SINGLE",
    status: "ACTIVE",
    category: "Beverages",
    categoryName: "Beverages",
    barcode: "WTR-0015",
    imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80",
  } as any,
  {
    id: "demo-2",
    sku: "COKE-0500",
    name: "Coca Cola 500ml",
    sellingPrice: "1.75",
    costPrice: "1.10",
    stockQty: "80",
    unit: "pcs",
    productType: "SINGLE",
    status: "ACTIVE",
    category: "Beverages",
    categoryName: "Beverages",
    barcode: "COKE-0500",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
  } as any,
  {
    id: "demo-3",
    sku: "LAY-0052",
    name: "Lays Classic 52g",
    sellingPrice: "1.50",
    costPrice: "0.90",
    stockQty: "30",
    unit: "pcs",
    productType: "SINGLE",
    status: "ACTIVE",
    category: "Snacks",
    categoryName: "Snacks",
    barcode: "LAY-0052",
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
  } as any,
  {
    id: "demo-4",
    sku: "MILK-1000",
    name: "Fresh Milk 1L",
    sellingPrice: "1.85",
    costPrice: "1.30",
    stockQty: "25",
    unit: "pcs",
    productType: "SINGLE",
    status: "ACTIVE",
    category: "Dairy",
    categoryName: "Dairy",
    barcode: "MILK-1000",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
  } as any,
  {
    id: "demo-5",
    sku: "HNS-0400",
    name: "H&S Shampoo 400ml",
    sellingPrice: "4.50",
    costPrice: "3.00",
    stockQty: "18",
    unit: "pcs",
    productType: "SINGLE",
    status: "ACTIVE",
    category: "Personal Care",
    categoryName: "Personal Care",
    barcode: "HNS-0400",
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80",
  } as any,
];

// Initial demo cart items with full image URLs
const INITIAL_DEMO_CART: CartItem[] = [
  { productId: "demo-2", variantId: null, name: "Coca Cola 500ml", qty: 2, unitPrice: 1.75, discountAmount: 0, lineTotal: 3.50, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80" } as any,
  { productId: "demo-3", variantId: null, name: "Lays Classic 52g", qty: 1, unitPrice: 1.50, discountAmount: 0, lineTotal: 1.50, image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80" } as any,
  { productId: "demo-4", variantId: null, name: "Fresh Milk 1L", qty: 1, unitPrice: 1.85, discountAmount: 0, lineTotal: 1.85, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80" } as any,
  { productId: "demo-6", variantId: null, name: "Dettol Soap 125g", qty: 2, unitPrice: 1.10, discountAmount: 0, lineTotal: 2.20, image: "https://images.unsplash.com/photo-1607006482602-765180037159?w=300&auto=format&fit=crop&q=80" } as any,
  { productId: "demo-10", variantId: null, name: "Ariel Matic 1kg", qty: 1, unitPrice: 5.20, discountAmount: 0, lineTotal: 5.20, image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=300&auto=format&fit=crop&q=80" } as any,
];

// ── Payment Methods ────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { method: "CASH", label: "Cash", icon: Banknote },
  { method: "CARD", label: "Card", icon: CreditCard },
  { method: "MOBILE_PAY", label: "Mobile Pay", icon: Smartphone },
  { method: "GIFT_CARD", label: "Gift Card", icon: Gift },
  { method: "MORE", label: "More", icon: MoreHorizontal },
];

export default function PosPage() {
  // ── Online status ──
  const [online, setOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // Cart (Default to empty array; restored from localStorage if available)
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
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [note, setNote] = useState<string>("");

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

  // Stats matching reference screenshot
  const [todaySales, setTodaySales] = useState(1248.75);
  const [todayTxCount, setTodayTxCount] = useState(36);

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
          setProducts(DEMO_PRODUCTS);
        }
      } catch {
        setProducts(DEMO_PRODUCTS);
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
        if (stats && (stats.totalSales || stats.revenue)) {
          setTodaySales(stats.totalSales || stats.revenue);
          setTodayTxCount(stats.transactionCount || stats.count || 36);
        }
      } catch {}
    } else {
      const cache = await getOfflineCache();
      if (cache && cache.products && cache.products.length > 0) {
        setProducts(cache.products);
        setCustomers(cache.customers || []);
        if (cache.openShifts?.length) setOpenShift(cache.openShifts[0]);
      } else {
        setProducts(DEMO_PRODUCTS);
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
  async function confirmSale() {
    if (cart.length === 0) return;
    setError(null);
    setSubmitting(true);

    const onlineNow = isOnline();
    try {
      const cartSnapshot = [...cart];
      const paymentsSnapshot = [...payments];
      const customerNameSnapshot = selectedCustomer
        ? (selectedCustomer as any).name || (selectedCustomer as any).fullName || "John Smith"
        : "Walk-in Retail Customer";

      const branchId = tenantInfo?.branch?.id || "default-branch";
      const warehouseId = tenantInfo?.warehouse?.id || "default-warehouse";

      if (onlineNow && tenantInfo?.branch?.id) {
        const res = await api.post<SaleResult>("/api/v1/pos/confirm", {
          branchId,
          warehouseId,
          customerId: customerId || null,
          items: cart,
          payments,
          discountTotal,
          taxTotal,
          serviceCharge,
          note,
          heldSaleId: resumingHoldId ?? undefined,
        }).catch(() => null);

        const saleRes = res || makeOfflineResult(`INV-${Date.now().toString(36).toUpperCase()}`, cartSnapshot, total, paymentsSnapshot);
        setSaleSnapshot({ cart: cartSnapshot, payments: paymentsSnapshot, customerName: customerNameSnapshot });
        setResult(saleRes);
      } else {
        const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;
        const saleId = crypto.randomUUID();
        await syncManager.createOfflineTransaction({
          entityType: "SALE", entityId: saleId,
          branchId,
          payload: { saleId, branchId, warehouseId, customerId: customerId || null, items: cart, payments, discountTotal, taxTotal, serviceCharge, note },
        }).catch(() => {});
        const localResult = makeOfflineResult(invoiceNo, cartSnapshot, total, paymentsSnapshot);
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
  const avgSale = todayTxCount > 0 ? todaySales / todayTxCount : 34.69;

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

      {/* ── 1. TOP HEADER BAR ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 z-30 shrink-0 shadow-2xs">
        {/* Left Branding */}
        <div className="flex items-center gap-2.5 h-9">
          <div className="w-8 h-8 rounded-md bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <ShoppingBag size={18} />
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-600 tracking-tight">Enterprise POS</span>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200/60">
                Premium
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Terminal ID: T-01 &nbsp;•&nbsp; Outlet: {tenantInfo?.branch?.name || "Main Branch"}
            </p>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-md mx-4 h-9 flex items-center">
          <div className="relative w-full h-9 flex items-center">
            <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Search product by name, SKU or barcode..."
              className="w-full h-9 pl-9 pr-9 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
            />
            <button className="absolute right-2.5 text-slate-400 hover:text-teal-600 transition">
              <Scan size={15} />
            </button>
          </div>
        </div>

        {/* Right Actions & Operator */}
        <div className="flex items-center gap-2 h-9">
          {/* Quick Actions Button */}
          <CustomButton
            variant="primary"
            size="sm"
            onClick={() => { loadHolds(); setShowHolds(true); }}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-md flex items-center gap-1.5 shadow-2xs px-3 py-1.5"
          >
            <Zap size={14} className="text-amber-300 fill-amber-300" />
            <span>Quick Actions</span>
            <ChevronDown size={13} />
          </CustomButton>

          {/* Date & Time */}
          <div className="hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-gray-600 shrink-0 shadow-2xs text-xs font-medium">
            <Clock size={14} className="text-teal-600" />
            <span className="font-bold text-gray-600">
              {currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="text-[11px] text-gray-500">
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Cashier Selector */}
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shrink-0 shadow-2xs">
            <div className="w-5 h-5 rounded bg-teal-600 text-white flex items-center justify-center shrink-0">
              <User size={12} />
            </div>
            <span className="text-xs font-bold text-gray-600 hidden sm:block">
              {(openShift as any)?.cashierName || (openShift as any)?.user?.name || "John Smith"}
            </span>
            <ChevronDown size={12} className="text-slate-400" />
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
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-md border border-slate-200 bg-white shrink-0 min-w-[145px] shadow-2xs hover:border-teal-300 transition">
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
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-md border border-slate-200 bg-white shrink-0 min-w-[135px] shadow-2xs hover:border-teal-300 transition">
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
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-md border border-slate-200 bg-white shrink-0 min-w-[135px] shadow-2xs hover:border-teal-300 transition">
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
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-md border border-slate-200 bg-white shrink-0 min-w-[130px] shadow-2xs hover:border-teal-300 transition">
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
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-md border border-rose-200 bg-rose-50/40 shrink-0 min-w-[120px] shadow-2xs">
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
          <div className="hidden xl:flex items-center gap-2.5 h-11 px-3 rounded-md bg-teal-50/60 border border-teal-200/80 shrink-0 min-w-[220px]">
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
            className="flex items-center gap-1.5 text-gray-600 border-slate-200 hover:bg-slate-50 font-bold rounded-md px-3 py-1.5 text-xs shadow-2xs"
          >
            <User size={14} className="text-teal-600" />
            <span>Add Customer</span>
          </CustomButton>
          <CustomButton
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-gray-600 border-slate-200 hover:bg-slate-50 font-bold rounded-md px-3 py-1.5 text-xs shadow-2xs"
          >
            <Scan size={14} className="text-teal-600" />
            <span>Scan Barcode</span>
          </CustomButton>
        </div>
      </div>

      {/* ── 3. MAIN CONTENT BODY ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden p-2.5 gap-2.5">

        {/* ── LEFT: Product Catalog ───────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">

          {/* Category Tabs Bar using CustomTabs component */}
          <div className="flex items-center justify-between p-2 border-b border-slate-200 shrink-0 gap-2 bg-slate-50/50">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <CustomTabs
                tabs={categoryTabs}
                activeTab={activeCategory}
                onChange={(catId) => { setActiveCategory(catId); setCurrentPage(1); }}
                themeColor="teal"
                inactiveClassName="border border-slate-200 bg-white text-gray-600 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                className="w-full border-none shadow-none bg-transparent p-0"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="h-8 flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-7 px-2.5 rounded text-xs font-bold transition flex items-center gap-1",
                  viewMode === "grid" ? "bg-white text-teal-600 border border-slate-200 shadow-2xs" : "text-gray-600 hover:text-slate-900"
                )}
              >
                <LayoutGrid size={13} />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-7 px-2.5 rounded text-xs font-bold transition flex items-center gap-1",
                  viewMode === "list" ? "bg-white text-teal-600 border border-slate-200 shadow-2xs" : "text-gray-600 hover:text-slate-900"
                )}
              >
                <ListFilter size={13} />
                <span>List</span>
              </button>
            </div>
          </div>

          {/* ★ PRODUCT CARDS GRID (COMPACT, FAST, PERFECTLY SIZED) ★ */}
          <div className="flex-1 overflow-y-auto p-2.5 bg-slate-50/30">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
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
                        "group relative flex flex-col bg-white border rounded-md transition-all duration-200 cursor-pointer overflow-hidden shadow-2xs hover:shadow-md justify-between",
                        outOfStock
                          ? "border-slate-200 opacity-50 cursor-not-allowed"
                          : inCart
                            ? "border-teal-600 ring-2 ring-teal-500/20 shadow-xs"
                            : "border-slate-200 hover:border-teal-400"
                      )}
                    >
                      {/* Top Image Container: Edge-to-Edge fill with Top-Left Stock Badge */}
                      <div className="w-full h-22 sm:h-26 bg-slate-100 flex items-center justify-center relative overflow-hidden shrink-0 border-b border-slate-100">
                        {/* Top Left Stock Count Badge */}
                        <span className={cn(
                          "absolute top-1 left-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded border z-10 shadow-2xs",
                          outOfStock
                            ? "bg-rose-600 text-white border-rose-700"
                            : "bg-slate-900 text-white border-slate-700"
                        )}>
                          {outOfStock ? "Out of Stock" : `Stock: ${stock}`}
                        </span>

                        {(p as any).imageUrl || (p as any).image ? (
                          <img
                            src={(p as any).imageUrl || (p as any).image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-0.5 select-none">
                            <Package size={20} className="text-slate-400 opacity-60" />
                            <span className="text-[9px] font-bold tracking-tight text-slate-400 uppercase">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Box: Title + Price on Left + Plus button on Right */}
                      <div className="p-1.5 flex flex-col justify-between flex-1 gap-1 bg-white">
                        <p className="text-[11px] font-bold text-gray-600 truncate leading-tight group-hover:text-teal-600 transition-colors" title={p.name}>
                          {p.name}
                        </p>

                        {/* Bottom Row: Price on Left, Plus button on Right */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">
                          <span className="text-xs font-extrabold text-slate-900 tracking-tight">{fmt(price)}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (!outOfStock) addProduct(p); }}
                            className="w-5.5 h-5.5 rounded bg-teal-600 text-white hover:bg-teal-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
                          >
                            <Plus size={12} />
                          </button>
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
                    className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-white hover:border-teal-400 hover:shadow-xs transition cursor-pointer"
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
                      <CustomButton variant="primary" size="sm" className="px-2.5 py-1 text-xs font-bold rounded-md bg-teal-600 hover:bg-teal-700">
                        + Add
                      </CustomButton>
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
                className="px-2 py-1 text-xs font-bold rounded-md border-slate-200 text-gray-600 disabled:opacity-40"
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
                className="px-2 py-1 text-xs font-bold rounded-md border-slate-200 text-gray-600 disabled:opacity-40"
              >
                Next <ChevronRight size={14} className="ml-0.5" />
              </CustomButton>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Current Order Panel ──────────────────────────── */}
        <div className="w-[380px] shrink-0 flex flex-col bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">

          {/* Cart Header (Simplified: Title + Badge Only, NO redundant customer/barcode buttons) */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-600">Current Order</span>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">
                {cart.length} Items
              </span>
            </div>
            {customerName && (
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {customerName}
              </span>
            )}
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-12 px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-gray-600 shrink-0">
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-3 text-center">Qty</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-4 py-1 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-10 h-10 rounded bg-teal-50 text-teal-600 flex items-center justify-center mb-2 border border-teal-200/60">
                  <ShoppingCart size={20} />
                </div>
                <p className="text-xs font-bold text-gray-600">No items in order</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Select products to add to current order</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center py-2 gap-1 group">
                  <div className="col-span-5 flex items-center gap-2">
                    {/* Cart Item Thumbnail Image */}
                    <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200 overflow-hidden">
                      {(item as any).image || (item as any).imageUrl ? (
                        <img src={(item as any).image || (item as any).imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={14} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-600 truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">SKU: {item.productId?.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-xs font-bold text-gray-600">
                    {fmt(item.unitPrice)}
                  </div>
                  <div className="col-span-3 flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleQtyChange(idx, item.qty - 1)}
                      className="w-5 h-5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-gray-600 flex items-center justify-center transition"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-bold text-slate-900 w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => handleQtyChange(idx, item.qty + 1)}
                      className="w-5 h-5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-gray-600 flex items-center justify-center transition"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-1">
                    <span className="text-xs font-extrabold text-slate-900">{fmt(item.lineTotal)}</span>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Calculations */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2 shrink-0">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-600 font-bold">
                <span>Subtotal</span>
                <span className="font-extrabold text-slate-900">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount</span>
                <span>-{fmt(discountTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-bold">
                <span>Tax (5%)</span>
                <span className="font-extrabold text-slate-900">{fmt(taxTotal)}</span>
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

            {/* Payment Methods */}
            <div className="grid grid-cols-5 gap-1">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.method}
                  onClick={() => { setActivePaymentMethod(pm.method); setPayments([{ method: pm.method, amount: total }]); }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-md border text-center transition-all cursor-pointer h-12",
                    activePaymentMethod === pm.method
                      ? "bg-teal-600 text-white border-teal-600 shadow-2xs font-bold"
                      : "bg-white text-gray-600 border-slate-200 hover:bg-slate-50 font-medium"
                  )}
                >
                  <pm.icon size={15} />
                  <span className="text-[10px] leading-none">{pm.label}</span>
                </button>
              ))}
            </div>

            {/* Action Buttons using CustomButton */}
            <div className="grid grid-cols-2 gap-2">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={holdSale}
                disabled={cart.length === 0}
                className="w-full text-teal-700 border-teal-200 bg-teal-50/50 hover:bg-teal-100 font-bold rounded-md py-2 text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <PauseCircle size={14} />
                <span>Hold Sale</span>
              </CustomButton>
              <CustomButton
                variant="danger"
                size="sm"
                onClick={resetSale}
                disabled={cart.length === 0}
                className="w-full font-bold rounded-md py-2 text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Clear Order</span>
              </CustomButton>
            </div>

            {/* Pay Now CTA using CustomButton (Retail Theme Color) */}
            <CustomButton
              variant="primary"
              size="lg"
              disabled={cart.length === 0 || submitting}
              onClick={confirmSale}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-md font-extrabold text-sm shadow-md cursor-pointer bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>Pay Now</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{fmt(total)}</span>
                <ArrowRight size={15} />
              </div>
            </CustomButton>
          </div>
        </div>
      </div>

      {/* ── 4. FOOTER ─────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 shrink-0 space-y-2">
        {/* Module Cards — Row 1 (Retail Teal Theme, Rounded-MD) */}
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
            <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition cursor-pointer">
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

        {/* Bottom Toolbar — Row 2 (Horizontal Pills + Summary) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5 border-t border-slate-200">
          {/* Action Buttons — Horizontal Layout Pill Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: "Hold Orders", icon: PauseCircle, action: () => { loadHolds(); setShowHolds(true); } },
              { label: "Recent Orders", icon: Clock, action: () => {} },
              { label: "Price Check", icon: Search, action: () => {} },
              { label: "Stock Lookup", icon: Package, action: () => {} },
              { label: "Return", icon: RotateCcw, action: () => setShowReturn(true) },
              { label: "Discount", icon: Tag, action: () => setShowExtras(true) },
              { label: "Note", icon: FileText, action: () => setShowExtras(true) },
              { label: "Calculator", icon: Calculator, action: () => {} },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                className="h-7.5 px-3 rounded-md border border-slate-200 bg-white hover:bg-teal-50/80 hover:border-teal-400 text-slate-700 hover:text-teal-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition whitespace-nowrap"
              >
                <btn.icon size={13} className="text-teal-600 shrink-0" />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Today's Summary + System Status */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-3 px-3 py-1 rounded-md bg-slate-50 border border-slate-200">
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

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
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
            className="w-full h-9 px-3 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button
              onClick={() => { setCustomerId(""); setShowCustomerModal(false); setCustomerSearch(""); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-slate-300 text-xs text-gray-600 hover:border-teal-400 hover:text-teal-600 transition cursor-pointer"
            >
              <User size={14} /> Walk-in Customer
            </button>
            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCustomerId(c.id); setShowCustomerModal(false); setCustomerSearch(""); }}
                className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition cursor-pointer", customerId === c.id ? "border-teal-600 bg-teal-50 text-teal-800 font-bold" : "border-slate-200 hover:border-teal-300 hover:bg-slate-50")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                    {((c as any).name || "?")[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900">{(c as any).name || (c as any).fullName}</p>
                    <p className="text-[10px] text-gray-500">{(c as any).phone || "No phone"}</p>
                  </div>
                </div>
                {customerId === c.id && <CheckCircle2 size={14} className="text-teal-600" />}
              </button>
            ))}
          </div>
        </div>
      </CustomModal>

      {/* Held Sales Modal */}
      <CustomModal open={showHolds} onClose={() => setShowHolds(false)} title="Held Sales">
        <div className="space-y-2">
          {holds.length === 0 && <p className="py-6 text-center text-xs text-gray-500">No held sales found</p>}
          {holds.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 hover:bg-slate-50 transition">
              <div>
                <p className="text-xs font-semibold">{h.holdNo}</p>
                <p className="text-[11px] text-gray-500">{h.cartSnapshot.length} items · {new Date(h.createdAt).toLocaleTimeString()}</p>
                {h.note && <p className="text-[11px] text-gray-500">{h.note}</p>}
              </div>
              <div className="flex gap-2">
                <CustomButton size="sm" onClick={() => resumeHold(h)} className="bg-teal-600 hover:bg-teal-700 text-white">Resume</CustomButton>
                <CustomButton size="sm" variant="danger" onClick={() => deleteHold(h.id)}>Delete</CustomButton>
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
            <input value={voidSaleId} onChange={(e) => setVoidSaleId(e.target.value)} placeholder="Paste sale ID" className="w-full h-9 px-3 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Reason</label>
            <input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Reason for void" className="w-full h-9 px-3 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowVoid(false)}>Cancel</CustomButton>
            <CustomButton variant="danger" loading={actionSaving} onClick={doVoid}>Void Sale</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Return Modal */}
      <CustomModal open={showReturn} onClose={() => setShowReturn(false)} title="Return / Refund">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Sale ID</label>
            <input value={returnSaleId} onChange={(e) => setReturnSaleId(e.target.value)} placeholder="Paste sale ID" className="w-full h-9 px-3 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Refund Amount</label>
            <input type="number" min={0} step="0.01" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Reason</label>
            <input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-teal-600" />
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowReturn(false)}>Cancel</CustomButton>
            <CustomButton loading={actionSaving} onClick={doReturn} className="bg-teal-600 hover:bg-teal-700 text-white">Process Return</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Keyboard Shortcut Settings */}
      <CustomModal open={showShortcutSettings} onClose={() => setShowShortcutSettings(false)} title="Keyboard Shortcuts">
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-md bg-teal-50 px-3 py-2 text-xs text-teal-800">
            <Keyboard size={14} className="mt-0.5 shrink-0" />
            Click an action then press the key combination you want to assign.
          </p>
          <div className="space-y-1">
            {SHORTCUT_ACTIONS.map((action) => {
              const isRecording = recordingAction === action;
              return (
                <div key={action} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-1.5">
                  <span className="text-xs font-bold text-gray-600">{ACTION_LABELS[action]}</span>
                  <button
                    type="button"
                    onClick={() => setRecordingAction(isRecording ? null : action)}
                    className={`min-w-[80px] rounded-md border px-2.5 py-1 text-center text-xs font-semibold transition ${isRecording ? "animate-pulse border-teal-600 bg-teal-50 text-teal-700" : "border-slate-300 bg-slate-50 text-gray-600 hover:border-teal-400"}`}
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
    </div>
  );
}
