"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ReceiptModal } from "../../pos/ReceiptModal";
import { UniversalInvoiceModal } from "@/components/invoices/UniversalInvoiceModal";
import type { PaymentLine, SaleResult } from "../../pos/pos-types";
import { isOnline } from "@/lib/offline/db";
import { syncManager } from "@/lib/offline/sync";
import { publishCart } from "@/lib/customer-display";
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
import {
  SalesHistoryPanel,
  PrescriptionModal,
  AddDoctorModal,
  LoyaltyModal,
  QuickReturnModal,
  AddCustomerModal,
  AdvancedFilterPanel,
  PosToast,
  GenericAlternativesModal,
  HardwareSettingsModal,
  PaymentCheckoutModal,
  DEFAULT_HARDWARE_CONFIG,
  type HardwareConfig,
  type NotificationItem,
  type CheckoutPayMethod,
} from "@/components/pharmacy/PharmacyPOSModals";

// ─── Demo seed products (fallback when API is empty) ────────────────────────
const INITIAL_CART: RxCartItem[] = [];

function inferCategory(p: RegisterProduct): PharmaCat {
  const raw = `${p.categoryName || ""} ${p.name}`.toLowerCase();
  if (raw.includes("antibiotic") || raw.includes("amox") || raw.includes("cipro") || raw.includes("azith")) return "Antibiotics";
  if (raw.includes("pain") || raw.includes("napa") || raw.includes("paracetamol") || raw.includes("ibuprofen") || raw.includes("domstal")) return "Pain Relief";
  if (raw.includes("vitamin") || raw.includes("suppl") || raw.includes("zinc") || raw.includes("calcium")) return "Vitamins & Suppl.";
  if (raw.includes("skin") || raw.includes("cream") || raw.includes("ointment") || raw.includes("lotion")) return "Skin Care";
  if (raw.includes("diabet") || raw.includes("metformin") || raw.includes("insulin") || raw.includes("glime")) return "Diabetes Care";
  if (raw.includes("cardio") || raw.includes("heart") || raw.includes("atenolol") || raw.includes("amlodip")) return "Cardiovascular";
  if (raw.includes("gastro") || raw.includes("seclo") || raw.includes("omeprazole") || raw.includes("antacid") || raw.includes("esomeprazole") || raw.includes("ors")) return "Gastrointestinal";
  if (raw.includes("respir") || raw.includes("cough") || raw.includes("asthma") || raw.includes("inhal") || raw.includes("salbutamol")) return "Respiratory";
  if (raw.includes("eye") || raw.includes("ear") || raw.includes("drop")) return "Eye & Ear Care";
  return "Others";
}

// ─── Toast type ──────────────────────────────────────────────────────────────
interface ToastState {
  message: string;
  type: "success" | "error" | "info";
  key: number;
}

// ─── Advanced filter state ────────────────────────────────────────────────────
interface AdvFilter {
  minPrice: number;
  maxPrice: number;
  brand: string;
  inStockOnly: boolean;
}

export default function PharmacyPOSPage() {
  const { user } = useAuth();

  // ─── Core state ─────────────────────────────────────────────────────────
  const [ctx, setCtx] = useState<RegisterContext>({ branch: null, warehouse: null, currency: "BDT" });
  const [products, setProducts] = useState<RegisterProduct[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string | null }[]>([]);
  const [customerId, setCustomerId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem("bpos_pharmacy_customer") || ""; } catch { return ""; }
  });
  const [cart, setCart] = useState<RxCartItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_CART;
    try {
      const saved = localStorage.getItem("bpos_pharmacy_cart");
      return saved ? JSON.parse(saved) : INITIAL_CART;
    } catch {
      return INITIAL_CART;
    }
  });
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 0 }]);
  const [payMethod, setPayMethod] = useState<PayMethod>(() => {
    if (typeof window === "undefined") return "CASH";
    try { return (localStorage.getItem("bpos_pharmacy_pay_method") as PayMethod) || "CASH"; } catch { return "CASH"; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [online, setOnline] = useState(true);
  const [note, setNote] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem("bpos_pharmacy_note") || ""; } catch { return ""; }
  });
  const [discountTotal, setDiscountTotal] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try { return Number(localStorage.getItem("bpos_pharmacy_discount_total")) || 0; } catch { return 0; }
  });
  const [discountInput, setDiscountInput] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem("bpos_pharmacy_discount_input") || ""; } catch { return ""; }
  });
  const [discountApplied, setDiscountApplied] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("bpos_pharmacy_discount_applied") === "true"; } catch { return false; }
  });
  const [rxMode, setRxMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try { return localStorage.getItem("bpos_rx_mode") !== "false"; } catch { return true; }
  });
  const [now, setNow] = useState(() => new Date());
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("bpos_dark_mode") === "true"; } catch { return false; }
  });
  const [hardwareOpen, setHardwareOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig>(() => {
    if (typeof window === "undefined") return DEFAULT_HARDWARE_CONFIG;
    try {
      const saved = localStorage.getItem("bpos_hardware_config");
      return saved ? JSON.parse(saved) : DEFAULT_HARDWARE_CONFIG;
    } catch {
      return DEFAULT_HARDWARE_CONFIG;
    }
  });

  // ─── Notifications state ──────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // ─── Search / filter ────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [category, setCategory] = useState<PharmaCat>("All");
  const [gridFilter, setGridFilter] = useState<GridFilter>("All Medicines");
  const [sortBy, setSortBy] = useState<SortBy>("name-asc");
  const [advFilter, setAdvFilter] = useState<AdvFilter>({ minPrice: 0, maxPrice: Infinity, brand: "", inStockOnly: false });
  const searchRef = useRef<HTMLInputElement>(null);

  // ─── Held bills ─────────────────────────────────────────────────────────
  const [heldBills, setHeldBills] = useState<{ id: string; items: RxCartItem[]; discountTotal: number; note: string }[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("bpos_pharmacy_held_bills");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ─── FEFO batch picker ────────────────────────────────────────────────────
  const [pickerFor, setPickerFor] = useState<RegisterProduct | null>(null);
  const [pickerBatch, setPickerBatch] = useState<BatchRow | null>(null);

  // ─── Modal open state ─────────────────────────────────────────────────────
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [advFilterOpen, setAdvFilterOpen] = useState(false);
  const [genericsOpen, setGenericsOpen] = useState(false);

  // ─── Last added product (for generic alternative banner) ──────────────────
  const [lastAddedProduct, setLastAddedProduct] = useState<RegisterProduct | null>(null);

  // ─── Toast ────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState | null>(null);
  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type, key: Date.now() });
  }

  // ─── Dark Mode Document Class Sync ───────────────────────────────────────
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // ─── Dynamic Notifications Generator ─────────────────────────────────────
  useEffect(() => {
    const list: NotificationItem[] = [];
    const lowStock = products.filter((p) => (p.stockQty ?? 0) > 0 && (p.stockQty ?? 0) <= 15);
    if (lowStock.length > 0) {
      list.push({
        id: "low-stock",
        type: "warning",
        title: "Low Stock Alert",
        body: `${lowStock[0].name} — only ${lowStock[0].stockQty} units left`,
        time: "Just now",
        read: false,
      });
    }
    const expiring = products.filter((p) => p.name.includes("Metformin") || p.name.includes("Napa"));
    if (expiring.length > 0) {
      list.push({
        id: "expiry-alert",
        type: "error",
        title: "Expiry Warning",
        body: `${expiring[0].name} — batch expiring within 30 days`,
        time: "5 min ago",
        read: false,
      });
    }
    list.push({
      id: "sync-status",
      type: "info",
      title: "Sync Status",
      body: online ? "Live backend synchronization active" : "Offline mode — sales cached locally",
      time: "10 min ago",
      read: true,
    });
    setNotifications(list);
  }, [products, online]);

  // ─── Effects ──────────────────────────────────────────────────────────────
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

  // ─── LocalStorage Persistence ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (cart.length > 0) {
        localStorage.setItem("bpos_pharmacy_cart", JSON.stringify(cart));
      } else {
        localStorage.removeItem("bpos_pharmacy_cart");
      }
      if (customerId) {
        localStorage.setItem("bpos_pharmacy_customer", customerId);
      } else {
        localStorage.removeItem("bpos_pharmacy_customer");
      }
      if (note) {
        localStorage.setItem("bpos_pharmacy_note", note);
      } else {
        localStorage.removeItem("bpos_pharmacy_note");
      }
      if (payMethod) {
        localStorage.setItem("bpos_pharmacy_pay_method", payMethod);
      }
      if (discountTotal > 0) {
        localStorage.setItem("bpos_pharmacy_discount_total", discountTotal.toString());
      } else {
        localStorage.removeItem("bpos_pharmacy_discount_total");
      }
      if (discountInput) {
        localStorage.setItem("bpos_pharmacy_discount_input", discountInput);
      } else {
        localStorage.removeItem("bpos_pharmacy_discount_input");
      }
      localStorage.setItem("bpos_pharmacy_discount_applied", discountApplied ? "true" : "false");
      if (heldBills.length > 0) {
        localStorage.setItem("bpos_pharmacy_held_bills", JSON.stringify(heldBills));
      } else {
        localStorage.removeItem("bpos_pharmacy_held_bills");
      }
    } catch {}
  }, [cart, customerId, note, payMethod, discountTotal, discountInput, discountApplied, heldBills]);

  const loadData = useCallback(async () => {
    try {
      const [c, prods, bts] = await Promise.all([
        fetchRegisterContext().catch((err) => {
          console.warn("Failed to fetch register context", err);
          return { branch: null, warehouse: null, currency: "BDT" };
        }),
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
      const res = await api.get<any>("/api/v1/customers?limit=500");
      const list = res.data ?? (Array.isArray(res) ? res : res?.data || []);
      let localCusts: any[] = [];
      try {
        const raw = localStorage.getItem("bpos_custom_customers");
        if (raw) localCusts = JSON.parse(raw);
      } catch {}

      const mergedMap = new Map();
      (Array.isArray(list) ? list : []).forEach((c: any) => {
        if (c && c.id) mergedMap.set(c.id, { id: c.id, name: c.name, phone: c.phone || null, address: c.address || null });
      });
      localCusts.forEach((c: any) => {
        if (c && c.id) mergedMap.set(c.id, c);
      });
      setCustomers(Array.from(mergedMap.values()));
    } catch {
      let localCusts: any[] = [];
      try {
        const raw = localStorage.getItem("bpos_custom_customers");
        if (raw) localCusts = JSON.parse(raw);
      } catch {}
      setCustomers(localCusts);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const byProduct = useMemo(() => groupBatchesByProduct(batches), [batches]);

  // ─── Product filtering ────────────────────────────────────────────────────
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

    // Grid filters
    if (gridFilter === "Popular") list = [...list].sort((a, b) => (b.stockQty ?? 0) - (a.stockQty ?? 0));
    else if (gridFilter === "Low Stock") list = list.filter((p) => (p.stockQty ?? 0) > 0 && (p.stockQty ?? 0) <= 15);
    else if (gridFilter === "Expiring Soon") list = list.filter((p) => p.name.includes("Metformin") || p.name.includes("Napa"));
    else if (gridFilter === "Prescription Required") list = list.filter((p) => /rx|prescription|omeprazole|esomeprazole/i.test(p.categoryName || p.name));
    else if (gridFilter === "Generic Available") list = list.filter((_, i) => i % 2 === 0);

    // Advanced filters
    if (advFilter.inStockOnly) list = list.filter((p) => (p.stockQty ?? 0) > 0);
    if (advFilter.brand) list = list.filter((p) => (p.brandName || "").toLowerCase().includes(advFilter.brand.toLowerCase()));
    if (advFilter.minPrice > 0) list = list.filter((p) => p.sellingPrice >= advFilter.minPrice);
    if (advFilter.maxPrice !== Infinity) list = list.filter((p) => p.sellingPrice <= advFilter.maxPrice);

    // Sort
    if (sortBy === "name-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === "price-asc") list = [...list].sort((a, b) => a.sellingPrice - b.sellingPrice);
    else if (sortBy === "price-desc") list = [...list].sort((a, b) => b.sellingPrice - a.sellingPrice);
    else if (sortBy === "stock") list = [...list].sort((a, b) => (b.stockQty ?? 0) - (a.stockQty ?? 0));

    return list;
  }, [products, search, category, gridFilter, sortBy, advFilter]);

  // ─── Generic alternatives for lastAddedProduct ────────────────────────────
  const genericAlternatives = useMemo(() => {
    if (!lastAddedProduct) return [];
    // Extract first meaningful word(s) from the product name (the drug name)
    const baseName = lastAddedProduct.name
      .toLowerCase()
      .replace(/\d+mg|\d+ml|\d+mcg|tablet|capsule|syrup|injection|cream|ointment|drop/gi, "")
      .trim()
      .split(/\s+/)[0];
    if (!baseName || baseName.length < 3) return [];

    return products.filter((p) =>
      p.id !== lastAddedProduct.id &&
      p.name.toLowerCase().includes(baseName) &&
      (p.stockQty ?? 0) > 0
    ).sort((a, b) => a.sellingPrice - b.sellingPrice);
  }, [lastAddedProduct, products]);

  // ─── Totals ───────────────────────────────────────────────────────────────
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

  // ─── Publish live cart to Patient Display bridge ────────────────────────────
  useEffect(() => {
    const selectedCust = customers.find((c) => c.id === customerId);
    publishCart({
      updatedAt: Date.now(),
      lines: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        discountAmount: i.discountAmount,
        category: i.unitLabel || "Medicine",
        uom: i.batchNo ? `Batch: ${i.batchNo}` : undefined,
        sku: i.sku,
      })),
      subtotal,
      discountTotal: totalDiscount,
      taxTotal: vatAmount,
      total,
      status: result ? "PAID" : cart.length > 0 ? "ACTIVE" : "IDLE",
      customerName: selectedCust?.name || "Walk-in Patient",
      merchantName: ctx.branch?.name || "MediCare Central Pharmacy",
      cashierName: user?.name || user?.email || "Pharmacist",
      laneNo: "Rx Counter 01",
      invoiceNo: result?.saleId ? `INV-${result.saleId.slice(0, 8).toUpperCase()}` : undefined,
    });
  }, [cart, subtotal, totalDiscount, vatAmount, total, customerId, customers, result, ctx.branch?.name, user?.name, user?.email]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (!["F1", "F2", "F3", "F6", "F8"].includes(e.key)) return;
      }
      if (e.key === "F1") { e.preventDefault(); void confirmSale(); }
      if (e.key === "F2" || e.key === "F3") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F6" || e.key === "F8") { e.preventDefault(); holdBill(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, total, submitting]);

  // ─── Cart helpers ─────────────────────────────────────────────────────────
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
    // Track for generic banner
    setLastAddedProduct(p);
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
          sku: p.sku,
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
      if (match) { tapProduct(match); return; }
      if (visibleProducts.length === 1) tapProduct(visibleProducts[0]);
    }
  }

  // ─── Discount ─────────────────────────────────────────────────────────────
  function applyDiscount() {
    const val = Number(discountInput) || 0;
    if (val <= 0) {
      setDiscountTotal(0);
      setDiscountApplied(false);
      return;
    }
    const discountAmt = Math.min((subtotal * val) / 100, subtotal);
    setDiscountTotal(discountAmt);
    setDiscountApplied(true);
    showToast(`${val}% discount applied — ৳${discountAmt.toFixed(2)} off`, "success");
  }

  // ─── Hold Bill ────────────────────────────────────────────────────────────
  function holdBill() {
    if (cart.length === 0) return;
    setHeldBills((prev) => [...prev, { id: crypto.randomUUID(), items: cart, discountTotal, note }]);
    setCart([]);
    setDiscountTotal(0);
    setDiscountApplied(false);
    setDiscountInput("");
    setNote("");
    showToast("Bill held successfully", "info");
  }

  function handleResumeHeldBill() {
    const last = heldBills[heldBills.length - 1];
    if (!last) return;
    setCart(last.items);
    setDiscountTotal(last.discountTotal);
    setNote(last.note);
    setDiscountApplied(last.discountTotal > 0);
    setHeldBills((prev) => prev.slice(0, -1));
    showToast("Held bill resumed", "info");
  }

  // ─── Sale ─────────────────────────────────────────────────────────────────
  async function confirmSale(tenderedAmount?: number) {
    if (cart.length === 0 || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const paidAmt = (tenderedAmount !== undefined && tenderedAmount > 0) ? tenderedAmount : total;
      const finalPayments = payments.map(p => 
        ({ ...p, amount: (tenderedAmount !== undefined && tenderedAmount > 0) ? tenderedAmount : (p.amount === 0 ? total : p.amount) })
      );

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
              batchNo: i.batchNo ?? null,
            })),
            payments: finalPayments,
            discountTotal,
            note,
          });
          const apiData = res?.data ?? res;
          if (apiData && (apiData.saleId || apiData.id || apiData.invoiceNo)) {
            saleRes = {
              saleId: apiData.saleId || apiData.id,
              invoiceNo: apiData.invoiceNo,
              invoiceId: apiData.invoiceId || apiData.saleId || apiData.id,
              total: Number(apiData.total ?? total),
              paidTotal: Number(paidAmt),
              dueTotal: Number(apiData.dueTotal ?? 0),
              paymentIds: apiData.paymentIds ?? [],
            };
          }
        } catch (apiErr: any) {
          console.warn("Online sale confirm failed, falling back to local transaction generation", apiErr);
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
              payments: finalPayments,
              discountTotal,
              note,
            },
          });
        }
        saleRes = {
          saleId,
          invoiceNo: `INV-${Date.now().toString(36).toUpperCase()}`,
          invoiceId: crypto.randomUUID(),
          total,
          paidTotal: Number(paidAmt),
          dueTotal: Math.max(total - paidAmt, 0),
          paymentIds: [],
        };
      }

      setResult(saleRes);
      // Do NOT resetSale() here; the ReceiptModal will call it when dismissed
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
    setDiscountApplied(false);
    setDiscountInput("");
    setPayments([{ method: "CASH", amount: 0 }]);
    setPayMethod("CASH");
    setResult(null);
    setNote("");
    setError(null);
    try {
      localStorage.removeItem("bpos_pharmacy_cart");
      localStorage.removeItem("bpos_pharmacy_customer");
      localStorage.removeItem("bpos_pharmacy_note");
      localStorage.removeItem("bpos_pharmacy_discount_total");
      localStorage.removeItem("bpos_pharmacy_discount_input");
      localStorage.removeItem("bpos_pharmacy_discount_applied");
      localStorage.setItem("bpos_pharmacy_pay_method", "CASH");
    } catch {}
    searchRef.current?.focus();
  }

  // ─── Quick Actions (bottom 8 buttons) ────────────────────────────────────
  function handleQuickAction(actionId: string) {
    switch (actionId) {
      case "rx": setPrescriptionOpen(true); break;
      case "doctor": setAddDoctorOpen(true); break;
      case "refill": {
        if (heldBills.length > 0) handleResumeHeldBill();
        else showToast("No held bills to refill", "info");
        break;
      }
      case "loyalty": setLoyaltyOpen(true); break;
      case "note": document.getElementById("pharma-note")?.focus(); break;
      case "return": setReturnOpen(true); break;
      case "sales-history": setSalesHistoryOpen(true); break;
      case "open-drawer": {
        showToast("🗄️ Cash drawer opened!", "success");
        break;
      }
      // Header quick action pills
      case "scan-rx": setPrescriptionOpen(true); break;
      case "scan-barcode": searchRef.current?.focus(); break;
      case "quick-refill": {
        if (heldBills.length > 0) handleResumeHeldBill();
        else searchRef.current?.focus();
        break;
      }
      case "add-medicine": searchRef.current?.focus(); break;
      default: searchRef.current?.focus();
    }
  }

  // ─── Prescription attach ──────────────────────────────────────────────────
  function handleAttachPrescription(rxNo: string, doctorName: string, notes: string) {
    const rxNote = [rxNo && `Rx: ${rxNo}`, doctorName && `Dr: ${doctorName}`, notes && `Notes: ${notes}`].filter(Boolean).join(" | ");
    if (rxNote) setNote((n) => (n ? `${n} | ${rxNote}` : rxNote));
    showToast("Prescription attached to sale", "success");
  }

  // ─── Doctor save ──────────────────────────────────────────────────────────
  function handleSaveDoctor(doctor: { name: string; regNo: string; specialty: string }) {
    const doctorNote = `Dr: ${doctor.name}${doctor.regNo ? ` (${doctor.regNo})` : ""} — ${doctor.specialty}`;
    setNote((n) => (n ? `${n} | ${doctorNote}` : doctorNote));
    showToast(`Dr. ${doctor.name} added to sale`, "success");
  }

  // ─── Return ───────────────────────────────────────────────────────────────
  function handleReturn(returns: { productId: string; name: string; qty: number; unitPrice: number }[]) {
    setCart((prev) =>
      prev
        .map((item) => {
          const r = returns.find((x) => x.productId === item.productId);
          if (!r) return item;
          const newQty = item.qty - r.qty;
          if (newQty <= 0) return null;
          return calcLine({ ...item, qty: newQty });
        })
        .filter(Boolean) as RxCartItem[],
    );
    const totalRefund = returns.reduce((s, r) => s + r.qty * r.unitPrice, 0);
    showToast(`Return processed — ৳${totalRefund.toFixed(2)} refund`, "success");
  }

  // ─── Add Customer ─────────────────────────────────────────────────────────
  async function handleAddCustomer(customer: { id: string; name: string; phone: string | null; address?: string | null }) {
    setCustomers((prev) => [...prev, customer]);
    setCustomerId(customer.id);

    try {
      const raw = localStorage.getItem("bpos_custom_customers");
      const list = raw ? JSON.parse(raw) : [];
      localStorage.setItem("bpos_custom_customers", JSON.stringify([...list, customer]));
    } catch {}

    try {
      const res = await api.post<any>("/api/v1/customers", {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      });
      if (res?.data?.id || res?.id) {
        const realId = res.data?.id || res.id;
        setCustomerId(realId);
        setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, id: realId } : c)));
      }
    } catch (err) {
      console.warn("Could not save customer to backend API, saved locally", err);
    }

    showToast(`Customer "${customer.name}" added`, "success");
  }

  // ─── Loyalty redeem ───────────────────────────────────────────────────────
  function handleLoyaltyRedeem(points: number) {
    const discountAmt = points * 0.5;
    setDiscountTotal((prev) => prev + discountAmt);
    setDiscountApplied(true);
    showToast(`${points} loyalty points redeemed — ৳${discountAmt.toFixed(2)} off`, "success");
  }

  // ─── Misc ─────────────────────────────────────────────────────────────────
  const cashierName = user?.name || user?.email || "Ahmed R.";
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", weekday: "long" });

  if (result) {
    const activeCust = customers.find(c => c.id === customerId);
    return (
      <div className="mx-auto flex h-screen items-center justify-center max-w-md p-4">
        <ReceiptModal 
          result={result} 
          cart={cart} 
          payments={payments.map(p => p.amount === 0 ? { ...p, amount: total } : p)} 
          cashierName={cashierName}
          customerName={activeCust?.name || "Walk-in Retail Customer"}
          onNewSale={resetSale} 
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-col overflow-hidden p-2 gap-2 select-none",
        darkMode ? "bg-slate-900" : "bg-[#f1f5f9]",
      )}
      style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
    >
      {/* ═══ MAIN BODY ═══ */}
      <div className="flex min-h-0 flex-1 gap-2 overflow-hidden">
        {/* Left Card */}
        <div className={cn(
          "flex w-full lg:w-[70%] shrink-0 flex-col overflow-hidden rounded-2xl border shadow-2xs",
          darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200/80 bg-white",
        )}>
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
            onCustomerClick={() => setAddCustomerOpen(true)}
            handleSearchKeyDown={handleSearchKeyDown}
            onAdvancedFilter={() => setAdvFilterOpen(true)}
            darkMode={darkMode}
            onToggleDarkMode={() => {
              setDarkMode((v) => {
                const next = !v;
                try { localStorage.setItem("bpos_dark_mode", String(next)); } catch {}
                return next;
              });
            }}
            rxMode={rxMode}
            onOpenHardwareSettings={() => setHardwareOpen(true)}
            lastAddedProduct={lastAddedProduct}
            genericAlternatives={genericAlternatives}
            onViewAlternatives={() => setGenericsOpen(true)}
          />
        </div>

        {/* Right Card */}
        <div className={cn(
          "flex w-full lg:w-[30%] shrink-0 flex-col overflow-hidden rounded-2xl border shadow-2xs",
          darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200/80 bg-white",
        )}>
          <PharmacyPOSRightPanel
            rxMode={rxMode}
            setRxMode={(val) => {
              const next = typeof val === "function" ? val(rxMode) : val;
              setRxMode(next);
              try { localStorage.setItem("bpos_rx_mode", String(next)); } catch {}
              showToast(next ? "Rx Mode ON — Prescription safety active" : "Rx Mode OFF — OTC handling active", "info");
            }}
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
            discountApplied={discountApplied}
            note={note}
            setNote={setNote}
            payMethod={payMethod}
            setPayMethod={setPayMethod}
            onQty={onQty}
            onRemove={onRemove}
            onClearCart={() => setCart([])}
            holdBill={holdBill}
            onOpenCheckout={() => setCheckoutOpen(true)}
            submitting={submitting}
            error={error}
            cashierName={cashierName}
            terminalName="PC-01"
            onAddCustomer={() => setAddCustomerOpen(true)}
            notifications={notifications}
            onMarkAllReadNotifications={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
            onClearAllNotifications={() => setNotifications([])}
            onDismissNotification={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
            onOpenHardwareSettings={() => setHardwareOpen(true)}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className={cn(
        "flex-none rounded-2xl border shadow-2xs overflow-hidden",
        darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200/80 bg-white",
      )}>
        <PharmacyPOSFooter
          timeStr={timeStr}
          dateStr={dateStr}
          cashierName={cashierName}
          terminalName="PC-01"
          online={online}
          lastBackupTime="11:30 AM"
          heldBillsCount={heldBills.length}
          onResumeHeldBill={handleResumeHeldBill}
          onSalesHistory={() => setSalesHistoryOpen(true)}
          onOpenDrawer={() => showToast("🗄️ Cash drawer opened!", "success")}
          darkMode={darkMode}
        />
      </div>

      {/* ═══ FEFO BATCH PICKER MODAL ═══ */}
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

      {/* ═══ ALL FEATURE MODALS ═══ */}
      <SalesHistoryPanel open={salesHistoryOpen} onClose={() => setSalesHistoryOpen(false)} />

      <PrescriptionModal
        open={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        onAttach={handleAttachPrescription}
      />

      <AddDoctorModal
        open={addDoctorOpen}
        onClose={() => setAddDoctorOpen(false)}
        onSave={handleSaveDoctor}
      />

      <LoyaltyModal
        open={loyaltyOpen}
        onClose={() => setLoyaltyOpen(false)}
        customerName={customers.find((c) => c.id === customerId)?.name ?? "Walk-in"}
        currentPoints={240}
        onRedeem={handleLoyaltyRedeem}
      />

      <QuickReturnModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        cart={cart}
        onReturn={handleReturn}
      />

      <AddCustomerModal
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSave={handleAddCustomer}
        customers={customers}
        selectedCustomerId={customerId}
        onSelectCustomer={(id) => setCustomerId(id)}
        darkMode={darkMode}
      />

      <AdvancedFilterPanel
        open={advFilterOpen}
        onClose={() => setAdvFilterOpen(false)}
        onApply={(f) => setAdvFilter(f)}
      />

      <GenericAlternativesModal
        open={genericsOpen}
        onClose={() => setGenericsOpen(false)}
        originalProduct={lastAddedProduct}
        alternatives={genericAlternatives}
        onSelectAlternative={(alt) => {
          tapProduct(alt);
          showToast(`✅ Added generic: ${alt.name}`, "success");
        }}
      />

      <HardwareSettingsModal
        open={hardwareOpen}
        onClose={() => setHardwareOpen(false)}
        config={hardwareConfig}
        onSaveConfig={(cfg) => {
          setHardwareConfig(cfg);
          try { localStorage.setItem("bpos_hardware_config", JSON.stringify(cfg)); } catch {}
          showToast("⚙️ Hardware settings saved successfully!", "success");
        }}
      />

      <PaymentCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={total}
        subtotal={subtotal}
        totalDiscount={totalDiscount}
        vatAmount={vatAmount}
        itemCount={itemCount}
        customerName={customers.find((c) => c.id === customerId)?.name || "Walk-in"}
        cashierName={cashierName}
        payMethod={payMethod as CheckoutPayMethod}
        onChangePayMethod={(m) => setPayMethod(m as PayMethod)}
        onConfirm={(cashTendered, _printReceipt) => {
          setCheckoutOpen(false);
          void confirmSale(cashTendered);
        }}
        submitting={submitting}
        darkMode={darkMode}
      />

      {/* ═══ TOAST ═══ */}
      {toast && (
        <PosToast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
