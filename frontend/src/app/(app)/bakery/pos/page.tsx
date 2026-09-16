"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, ChevronDown, ChevronRight, MoreHorizontal,
  Plus, Minus, X, Pause, Printer, DollarSign, CreditCard,
  Smartphone, Receipt, Clock, LayoutGrid, List,
  UserPlus, ShoppingBag, FileText, Tag, Landmark,
  BarChart2, Truck, Star, ShoppingCart, ArrowRight,
  User, Check, Sparkles, RefreshCw, Zap, ShieldCheck,
} from "lucide-react";
import { CustomModal, CustomButton, CustomInput, CustomSelect } from "@/components/custom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// ─── DATA TYPES & SCHEMAS ──────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  maxStock: number;
  cat: string;
  badge: string;
  badgeColor: string;
  emoji: string;
  bgGradient: string;
  sku: string;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

const ACTION_BTNS = [
  { id: "customer", label: "Add Customer", Icon: UserPlus,   color: "text-teal-600" },
  { id: "sale",     label: "New Sale",     Icon: Plus,       color: "text-amber-700" },
  { id: "order",    label: "Sales Order",  Icon: FileText,   color: "text-amber-700" },
  { id: "quote",    label: "Quotation",    Icon: Tag,        color: "text-amber-700" },
  { id: "credit",   label: "Credit Sale",  Icon: CreditCard, color: "text-amber-700" },
  { id: "hold",     label: "Hold Bill",    Icon: Pause,      color: "text-amber-700" },
  { id: "wh",       label: "Warehouse",    Icon: Landmark,   color: "text-amber-700" },
  { id: "reports",  label: "Reports",      Icon: BarChart2,  color: "text-amber-700" },
];

const FOOTER_BTNS = [
  { label: "Quick Sale",  key: "F9",  Icon: ShoppingCart, id: "quick_sale" },
  { label: "Sales Order", key: "F5",  Icon: FileText,   id: "sales_order" },
  { label: "Quotation",   key: "F6",  Icon: Receipt,    id: "quotation" },
  { label: "Customer",    key: "F2",  Icon: User,       id: "customer_modal" },
  { label: "Warehouse",   key: "F3",  Icon: Landmark,   id: "warehouse" },
  { label: "Credit",      key: "F4",  Icon: CreditCard, id: "credit" },
  { label: "Commission",  key: "F8",  Icon: Star,       id: "commission" },
  { label: "Delivery",    key: "F10", Icon: Truck,      id: "delivery" },
];

const PAYMENT_METHODS = [
  { key: "cash",   label: "Cash",           Icon: DollarSign,     color: "text-amber-600" },
  { key: "card",   label: "Card / POS",     Icon: CreditCard,     color: "text-slate-700"   },
  { key: "mobile", label: "bKash/Nagad",    Icon: Smartphone,     color: "text-pink-600"    },
  { key: "credit", label: "Credit Sale",    Icon: Receipt,        color: "text-purple-600"  },
  { key: "due",    label: "Partial Due",    Icon: Clock,          color: "text-amber-600"   },
  { key: "other",  label: "Other",          Icon: MoreHorizontal, color: "text-slate-500"   },
];

type CartItem = Product & { qty: number; discount: number };
type HeldSale = { id: string; holdNo?: string; time: string; note: string; items: CartItem[]; total: number };

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function BakeryTerminalPage() {
  const { user } = useAuth();
  const [activeCat, setActiveCat]           = useState("all");
  const [search, setSearch]                 = useState("");
  const [cart, setCart]                     = useState<CartItem[]>([]);
  const [payMethod, setPayMethod]           = useState("cash");
  const [viewMode, setViewMode]             = useState<"grid"|"list">("grid");
  const [addedId, setAddedId]               = useState<string|null>(null);
  const [time, setTime]                     = useState(new Date());

  // Backend Dynamic Data States
  const [products, setProducts]             = useState<Product[]>([]);
  const [categories, setCategories]         = useState<Category[]>([
    { id: "all", label: "All Products", emoji: "🧁" },
  ]);
  const [customers, setCustomers]           = useState<Customer[]>([
    { id: "walkin", name: "Walk-in Customer", phone: "" },
  ]);
  const [selectedCust, setSelectedCust]     = useState("walkin");
  const [heldSales, setHeldSales]           = useState<HeldSale[]>([]);

  // System Stats
  const [todaySales, setTodaySales]         = useState(0);
  const [todayOrders, setTodayOrders]       = useState(0);
  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [lastInvoiceNo, setLastInvoiceNo]   = useState("#BKR-000101");

  // Modals & Triggers
  const [showHoldModal, setShowHoldModal]   = useState(false);
  const [showCustModal, setShowCustModal]   = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [holdNote, setHoldNote]             = useState("");

  // Customer form & tab inputs
  const [custModalTab, setCustModalTab]     = useState<"view"|"add">("view");
  const [custSearchQuery, setCustSearchQuery] = useState("");
  const [newCustName, setNewCustName]       = useState("");
  const [newCustPhone, setNewCustPhone]     = useState("");
  const [newCustEmail, setNewCustEmail]     = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");

  // Toast System
  const [toast, setToast]                   = useState<{ msg: string; type?: "success"|"info" } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── FETCH BACKEND DATA ────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const res: any = await api.get("/api/v1/products?limit=200");
      const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        const mapped: Product[] = list.map((p: any) => {
          let attr: any = {};
          if (p.attributes) {
            try {
              attr = typeof p.attributes === "string" ? JSON.parse(p.attributes) : p.attributes;
            } catch { /* ignore */ }
          }
          const stockVal = Number(p.totalStock ?? p.stockQty ?? 100);
          return {
            id: String(p.id),
            name: p.name || "Product",
            unit: p.unit?.name || attr.unit || "pcs",
            price: Number(p.sellingPrice || 0),
            cost: Number(p.costPrice || 0),
            stock: stockVal,
            maxStock: Math.max(stockVal, 150),
            cat: p.category?.id || (p.category?.name ? p.category.name.toLowerCase() : "bread"),
            badge: attr.badge || "",
            badgeColor: attr.badgeColor || "bg-emerald-100 text-amber-800 border-emerald-200",
            emoji: attr.emoji || "🧁",
            bgGradient: attr.bgGradient || "from-amber-100/80 via-orange-50/60 to-yellow-100/40",
            sku: p.sku || "",
          };
        });
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res: any = await api.get("/api/v1/products/categories");
      const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        const mapped: Category[] = list.map((c: any) => ({
          id: String(c.id),
          label: c.name || "Category",
          emoji: c.icon || "🧁",
        }));
        setCategories([{ id: "all", label: "All Products", emoji: "🧁" }, ...mapped]);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res: any = await api.get("/api/v1/customers?limit=200");
      const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        const mapped: Customer[] = list.map((c: any) => ({
          id: String(c.id),
          name: c.name || "Customer",
          phone: c.phone || "",
          email: c.email || "",
          address: c.address || "",
        }));
        setCustomers([{ id: "walkin", name: "Walk-in Customer", phone: "", email: "", address: "" }, ...mapped]);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  }, []);

  const fetchHeldSales = useCallback(async () => {
    try {
      const res: any = await api.get("/api/v1/pos/holds");
      const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        const mapped: HeldSale[] = list.map((h: any) => {
          let items: CartItem[] = [];
          if (h.cartSnapshot) {
            try {
              items = typeof h.cartSnapshot === "string" ? JSON.parse(h.cartSnapshot) : h.cartSnapshot;
            } catch { /* ignore */ }
          }
          const tot = items.reduce((s, i) => s + (i.price * i.qty * (1 - (i.discount || 0) / 100)), 0);
          const formattedTime = h.createdAt ? new Date(h.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently";
          return {
            id: String(h.id),
            holdNo: h.holdNo || `#HOLD-${h.id.slice(0, 4)}`,
            time: formattedTime,
            note: h.note || "General Order",
            items,
            total: tot,
          };
        });
        setHeldSales(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch held sales:", err);
    }
  }, []);

  const fetchTodayStats = useCallback(async () => {
    try {
      const res: any = await api.get("/api/v1/pos/sales?limit=100");
      const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        const todayStr = new Date().toISOString().split("T")[0];
        let totRev = 0;
        let count = 0;
        list.forEach((s: any) => {
          if (s.createdAt && s.createdAt.startsWith(todayStr)) {
            totRev += Number(s.total || s.grandTotal || 0);
            count += 1;
          }
        });
        setTodaySales(totRev);
        setTodayOrders(count);
      }
    } catch (err) {
      console.error("Failed to fetch sales stats:", err);
      setTodaySales(0);
      setTodayOrders(0);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      await Promise.allSettled([
        fetchProducts(),
        fetchCategories(),
        fetchCustomers(),
        fetchHeldSales(),
        fetchTodayStats(),
      ]);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [fetchProducts, fetchCategories, fetchCustomers, fetchHeldSales, fetchTodayStats]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0) setShowReceiptModal(true);
        else triggerToast("Cart is empty! Add products to process sale.", "info");
      } else if (e.key === "F7") {
        e.preventDefault();
        setShowHoldModal(true);
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) {
          setCart([]);
          triggerToast("Cart cleared!", "info");
        }
      } else if (e.key === "F2") {
        e.preventDefault();
        setShowCustModal(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart]);

  function triggerToast(msg: string, type: "success"|"info" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  const filtered = products.filter(p =>
    (activeCat === "all" || p.cat === activeCat || p.cat.toLowerCase() === activeCat.toLowerCase()) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.cat.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  function addToCart(p: Product) {
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 500);
    setCart(prev => {
      const ex = prev.find(c => c.id === p.id);
      if (ex) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1, discount: 0 }];
    });
    triggerToast(`Added ${p.name} to cart`);
  }

  function updQty(id: string, d: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + d) } : c));
  }

  function remItem(id: string) {
    setCart(prev => prev.filter(c => c.id !== id));
  }

  async function handleHoldSale() {
    if (cart.length === 0) return;
    try {
      const res: any = await api.post("/api/v1/pos/holds", {
        items: cart,
        note: holdNote || "General Customer Order",
        customerId: selectedCust === "walkin" ? null : selectedCust,
      });
      const holdNo = res?.data?.holdNo || res?.holdNo || `#HOLD-${Math.floor(1000 + Math.random() * 9000)}`;
      await fetchHeldSales();
      setCart([]);
      setHoldNote("");
      setShowHoldModal(false);
      triggerToast(`Order ${holdNo} held successfully!`);
    } catch (err: any) {
      console.error("Failed to hold sale via API:", err);
      const newHold: HeldSale = {
        id: `h_${Date.now()}`,
        holdNo: `#HOLD-${Math.floor(1000 + Math.random() * 9000)}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        note: holdNote || "General Order",
        items: [...cart],
        total: grandTotal,
      };
      setHeldSales(prev => [newHold, ...prev]);
      setCart([]);
      setHoldNote("");
      setShowHoldModal(false);
      triggerToast(`Order ${newHold.holdNo} held!`);
    }
  }

  async function restoreHeldSale(h: HeldSale) {
    try {
      if (!h.id.startsWith("h_")) {
        await api.del(`/api/v1/pos/holds/${h.id}`);
      }
    } catch (err) {
      console.error("Failed to delete hold:", err);
    }
    setCart(h.items);
    setHeldSales(prev => prev.filter(x => x.id !== h.id));
    setShowHoldModal(false);
    triggerToast(`Restored held order ${h.holdNo || h.id}`);
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustName) return;
    try {
      const res: any = await api.post("/api/v1/customers", {
        name: newCustName,
        phone: newCustPhone || undefined,
        email: newCustEmail || undefined,
        address: newCustAddress || undefined,
      });
      const saved = res?.data ?? res;
      const createdCust: Customer = {
        id: String(saved.id || `c_${Date.now()}`),
        name: saved.name || newCustName,
        phone: saved.phone || newCustPhone || "",
        email: saved.email || newCustEmail || "",
        address: saved.address || newCustAddress || "",
      };
      setCustomers(prev => [...prev, createdCust]);
      setSelectedCust(createdCust.id);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setNewCustAddress("");
      setShowCustModal(false);
      triggerToast(`Customer ${createdCust.name} added & selected!`);
    } catch (err: any) {
      console.error("Failed to create customer:", err);
      const fallbackCust: Customer = {
        id: `c_${Date.now()}`,
        name: newCustName,
        phone: newCustPhone || "",
        email: newCustEmail || "",
        address: newCustAddress || "",
      };
      setCustomers(prev => [...prev, fallbackCust]);
      setSelectedCust(fallbackCust.id);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setNewCustAddress("");
      setShowCustModal(false);
      triggerToast(`Customer ${fallbackCust.name} added & selected!`);
    }
  }

  async function handleCompleteCheckout() {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const res: any = await api.post("/api/v1/pos/confirm", {
        customerId: selectedCust === "walkin" ? null : selectedCust,
        customerName: activeCustomerObj?.name,
        customerPhone: activeCustomerObj?.phone,
        items: cart.map(i => ({
          productId: i.id,
          name: i.name,
          qty: i.qty,
          unitPrice: i.price,
          discountAmount: i.price * i.qty * (i.discount / 100),
        })),
        paymentMethod: payMethod.toUpperCase(),
        subtotal,
        discountTotal: discAmt,
        taxTotal: vatAmt,
        grandTotal,
        total: grandTotal,
      });

      const invNo = res?.data?.invoiceNo || res?.invoiceNo || `#INV-${Math.floor(100000 + Math.random() * 900000)}`;
      setLastInvoiceNo(invNo);
      setShowReceiptModal(false);
      setCart([]);
      triggerToast(`Sale ${invNo} Completed & Stock Updated! 🎉`, "success");
      
      // Refresh stock levels and today stats from backend
      fetchProducts();
      fetchTodayStats();
    } catch (err: any) {
      console.error("Complete checkout error:", err);
      const msg = err?.message || "Checkout failed";
      triggerToast(`Checkout Error: ${msg}`, "info");
    } finally {
      setSubmitting(false);
    }
  }

  const lineTotal  = (i: CartItem) => i.price * i.qty * (1 - i.discount / 100);
  const subtotal   = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discAmt    = cart.reduce((s, c) => s + c.price * c.qty * (c.discount / 100), 0);
  const vatAmt     = (subtotal - discAmt) * 0.05;
  const grandTotal = subtotal - discAmt + vatAmt;

  const fmt     = (n: number) => `৳ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = time.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });

  const activeCustomerObj = customers.find(c => c.id === selectedCust);

  return (
    <div className="fixed inset-0 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/60 via-[#f0fdf4] to-emerald-50/80 select-none overflow-hidden"
         style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ═══ GLOBAL VFX KEYFRAMES & SHIMMER STYLES ═══════════════════════════ */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-38px) scale(1.3); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(110deg, #15803d 0%, #16a34a 30%, #4ade80 50%, #16a34a 70%, #15803d 100%);
          background-size: 200% 100%;
          animation: shimmer 3s infinite linear;
        }
        .card-shine::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: translateX(-100%);
          transition: transform 0.7s ease;
          pointer-events: none;
        }
        .card-shine:hover::after {
          transform: translateX(100%);
        }
      `}</style>

      {/* ═══ AMBIENT BACKGROUND GLOW ORBS ════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 left-1/4 w-[450px] h-[450px] bg-emerald-400/25 rounded-full blur-3xl animate-[pulseGlow_7s_infinite_ease-in-out]" />
        <div className="absolute top-1/3 right-10 w-[380px] h-[380px] bg-teal-300/20 rounded-full blur-3xl animate-[pulseGlow_9s_infinite_ease-in-out_2s]" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-green-500/15 rounded-full blur-3xl animate-[pulseGlow_8s_infinite_ease-in-out_4s]" />
      </div>

      {/* ═══ TOAST NOTIFICATION VFX ══════════════════════════════════════════ */}
      {toast && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-950/95 via-emerald-900/95 to-teal-950/95 backdrop-blur-2xl text-white text-xs font-black rounded-sm shadow-[0_12px_40px_rgba(4,120,87,0.45)] border border-amber-400/40 animate-bounce">
          <div className="relative flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <Sparkles size={18} className="text-emerald-300 relative z-10 animate-spin" />
          </div>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="flex-none h-[60px] bg-white/85 backdrop-blur-xl flex items-center gap-3 px-4 z-30 border-b border-emerald-200/60 shadow-[0_4px_20px_-2px_rgba(16,185,129,0.06)] relative">

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-none group cursor-pointer">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.4)] flex-none transform group-hover:rotate-6 group-hover:scale-105 transition-all duration-300 relative overflow-hidden"
               style={{ background: "linear-gradient(135deg, #15803d 0%, #16a34a 50%, #059669 100%)" }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent animate-pulse" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
          <div>
            <div className="text-[14px] font-black text-emerald-950 leading-tight tracking-tight flex items-center gap-1.5">
              Manufacturing &amp; Bakery
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block shadow-[0_0_8px_#22c55e]" />
            </div>
            <div className="text-[9.5px] font-bold text-amber-600 tracking-[0.12em] uppercase">Enterprise POS v2.0</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 relative max-w-[450px] mx-2">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name, category... (Ctrl+K)"
            className="w-full h-[38px] rounded-xl border border-amber-200 bg-white/95 pl-9.5 pr-20 text-[12px] font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 shadow-sm"
          />
          {search ? (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">Ctrl</kbd>
              <kbd className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">K</kbd>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 flex-none ml-auto">
          {/* Today's Sales */}
          <div className="flex items-center gap-2.5 bg-white/90 border border-slate-200 rounded-xl px-3 h-[38px] shadow-sm hover:border-amber-300 transition-all">
            <div className="w-6.5 h-6.5 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-none">
              <FileText size={14} className="text-amber-700" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Today&apos;s Sales</div>
              <div className="text-[12px] font-black text-amber-800 leading-none">{fmt(todaySales)}</div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="flex items-center gap-2.5 bg-white/90 border border-slate-200 rounded-xl px-3 h-[38px] shadow-sm hover:border-slate-300 transition-all">
            <div className="w-6.5 h-6.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-none">
              <ShoppingBag size={14} className="text-slate-700" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Total Orders</div>
              <div className="text-[12px] font-black text-slate-800 leading-none">{todayOrders} Orders</div>
            </div>
          </div>

          {/* Live Clock */}
          <div className="flex items-center gap-2.5 bg-white/90 border border-slate-200 rounded-xl px-3 h-[38px] shadow-sm hover:border-amber-300 transition-all">
            <div className="w-6.5 h-6.5 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-none">
              <Clock size={14} className="text-amber-600" />
            </div>
            <div>
              <div className="text-[12px] font-black text-slate-800 leading-none">{timeStr}</div>
              <div className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">{dateStr}</div>
            </div>
          </div>

          {/* Admin User */}
          <div className="flex items-center gap-2.5 bg-white/90 border border-slate-200 rounded-xl px-3 h-[38px] cursor-pointer hover:border-amber-400 hover:shadow-md transition-all">
            <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white text-[11px] font-black flex-none shadow-sm">
              {(user?.name || "Admin").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-[11.5px] font-bold text-slate-800 leading-none">{user?.name || "Admin"}</div>
              <div className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">{user?.role || "Administrator"}</div>
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </div>
        </div>
      </header>

      {/* ═══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 flex gap-3 px-3.5 pb-2.5 pt-1.5 overflow-hidden z-10 relative">

        {/* ── LEFT PANEL (70%) ──────────────────────────────────────────────── */}
        <div className="w-[70%] min-w-0 flex flex-col bg-white/90 backdrop-blur-xl rounded-sm border border-emerald-200/80 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)]">

          {/* Category Bar */}
          <div className="flex-none flex items-center gap-2 px-3.5 pt-2.5 pb-2 overflow-x-auto border-b border-slate-100"
               style={{ scrollbarWidth: "none" }}>
            {categories.map(c => {
              const active = activeCat === c.id;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className={`flex-1 min-w-[82px] flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-1.5 h-[62px] transition-all duration-200 active:scale-95 ${
                    active
                      ? "bg-gradient-to-br from-emerald-700 via-emerald-800 to-green-900 border-emerald-600 text-white shadow-[0_8px_20px_rgba(21,128,61,0.35)] scale-[1.03] ring-2 ring-emerald-400/30"
                      : "bg-white border-slate-100 text-slate-700 hover:border-amber-300 hover:bg-amber-50/60 hover:scale-[1.02] hover:shadow-sm"
                  }`}>
                  {c.id === "all" ? (
                    <LayoutGrid size={20} className={active ? "text-white" : "text-amber-600"} />
                  ) : (
                    <span className="text-xl leading-none transform group-hover:scale-110 transition-transform">{c.emoji}</span>
                  )}
                  <span className={`text-[10px] font-bold text-center leading-tight whitespace-nowrap truncate max-w-full ${active ? "text-white" : "text-slate-700"}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
            <button className="flex-none sm:flex-1 min-w-[54px] flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-white text-amber-600 hover:bg-amber-50 px-2 py-1.5 h-[62px] transition-all hover:scale-105">
              <MoreHorizontal size={20} className="text-amber-600" />
              <span className="text-[9.5px] font-bold text-slate-600">More</span>
            </button>
          </div>

          {/* Products Header */}
          <div className="flex-none flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[17px] font-black text-slate-800 flex items-center gap-2">
                Products
                <span className="text-[10.5px] font-bold text-amber-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                  {filtered.length}
                </span>
              </h2>
              {activeCat !== "all" && (
                <button onClick={() => setActiveCat("all")}
                  className="flex items-center gap-1 bg-amber-50 hover:bg-emerald-100 border border-emerald-200 text-amber-700 font-bold text-[11px] px-3 py-0.5 rounded-full transition-colors ml-1 shadow-2xs">
                  View All <ArrowRight size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1 text-[11.5px] font-semibold text-slate-600 cursor-pointer hover:border-amber-400 shadow-sm transition-all">
                <span>Sort by: <strong className="text-slate-800 font-bold ml-1">Popular</strong></span>
                <ChevronDown size={13} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-0.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                <button onClick={() => setViewMode("grid")}
                  className={`p-1 rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
                  }`}>
                  <LayoutGrid size={14} />
                </button>
                <button onClick={() => setViewMode("list")}
                  className={`p-1 rounded-lg transition-all ${
                    viewMode === "list" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
                  }`}>
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3.5 pb-2"
               style={{ scrollbarWidth: "thin", scrollbarColor: "#bbf7d0 transparent" }}>
            <div className={`${viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5"
              : "flex flex-col gap-2"} pb-1`}>
              {filtered.map(p => {
                const isAdding = addedId === p.id;
                const stockRatio = Math.min(100, (p.stock / (p.maxStock || 150)) * 100);
                return (
                  <div key={p.id}
                    onClick={() => addToCart(p)}
                    className={`bg-white rounded-sm border border-slate-200/90 overflow-hidden cursor-pointer relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_35px_-6px_rgba(245,158,11,0.25)] hover:border-amber-400 card-shine ${
                      isAdding ? "scale-[1.04] border-emerald-500 shadow-[0_0_22px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/50" : ""
                    } ${viewMode === "list" ? "flex items-center gap-3 p-2.5" : ""}`}>

                    {/* Floating +1 Particle Effect */}
                    {isAdding && (
                      <div className="absolute top-2 right-2 z-30 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-lg border border-amber-300 animate-[floatUp_0.6s_ease-out_forwards] pointer-events-none flex items-center gap-0.5">
                        <Sparkles size={10} /> +1
                      </div>
                    )}

                    {/* Badge */}
                    {p.badge && (
                      <div className={`absolute top-2 left-2 z-10 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs ${p.badgeColor}`}>
                        {p.badge}
                      </div>
                    )}

                    {/* Image Area */}
                    {viewMode === "grid" ? (
                      <div className={`w-full h-[96px] bg-gradient-to-br ${p.bgGradient || "from-emerald-50 via-teal-50/40 to-green-50/70"} flex items-center justify-center relative overflow-hidden group-hover:brightness-105 transition-all`}>
                        {/* Category Tag Top Right */}
                        <div className="absolute top-2 right-2 z-10 text-[8px] font-black uppercase tracking-wider text-amber-800 bg-white/85 backdrop-blur-sm border border-emerald-200/60 px-1.5 py-0.5 rounded-full shadow-2xs">
                          {p.cat}
                        </div>
                        {/* Circular Spotlight Disc */}
                        <div className="w-13 h-13 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center justify-center group-hover:scale-115 group-hover:bg-white group-hover:rotate-6 transition-all duration-300">
                          <span className="text-[34px] leading-none drop-shadow-sm">{p.emoji}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center flex-none border border-amber-100 text-2xl shadow-2xs">
                        {p.emoji}
                      </div>
                    )}

                    {/* Info */}
                    <div className={viewMode === "grid" ? "p-2.5" : "flex-1 min-w-0"}>
                      <h3 className={`font-extrabold text-slate-800 leading-tight truncate group-hover:text-emerald-950 ${viewMode === "grid" ? "text-[12.5px]" : "text-[13.5px]"}`}>{p.name}</h3>
                      
                      <div className="flex items-center justify-between text-[9.5px] font-semibold text-slate-400 mt-1">
                        <span>{p.unit}</span>
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {p.stock} in stock
                        </span>
                      </div>

                      {/* Visual Stock Level Progress Bar */}
                      {viewMode === "grid" && (
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5 flex shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-500 ${
                            stockRatio > 50 ? "bg-gradient-to-r from-emerald-500 to-green-400" : stockRatio > 20 ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-gradient-to-r from-rose-500 to-red-400"
                          }`} style={{ width: `${Math.max(12, stockRatio)}%` }} />
                        </div>
                      )}

                      {viewMode === "grid" ? (
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                          <div className="bg-amber-50/90 border border-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-lg text-[13px] font-black shadow-2xs">
                            ৳ {p.price.toFixed(2)}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                            title="Add to Cart"
                            className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-emerald-700 to-green-600 hover:from-emerald-800 hover:to-green-700 active:scale-90 text-white flex items-center justify-center transition-all shadow-[0_4px_14px_rgba(21,128,61,0.35)] group-hover:scale-110 group-hover:shadow-[0_6px_18px_rgba(21,128,61,0.45)] flex-none">
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="bg-amber-50/90 border border-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-lg text-[13px] font-black shadow-2xs">৳ {p.price.toFixed(2)}</span>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                            title="Add to Cart"
                            className="ml-auto w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-emerald-700 to-green-600 hover:from-emerald-800 hover:to-green-700 active:scale-90 text-white flex items-center justify-center transition-all shadow-[0_4px_14px_rgba(21,128,61,0.35)] flex-none">
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons (Moved above Footer) */}
          <div className="flex-none flex items-center gap-2 px-3.5 py-2 bg-[#f4fbf6] border-t border-amber-100/70 overflow-x-auto"
               style={{ scrollbarWidth: "none" }}>
            {ACTION_BTNS.map(btn => {
              const isFilled = btn.label === "New Sale" || btn.label === "Hold Bill";
              return (
                <button key={btn.id}
                  onClick={() => {
                    if (btn.id === "customer") setShowCustModal(true);
                    else if (btn.id === "hold") setShowHoldModal(true);
                    else triggerToast(`Triggered ${btn.label}`, "info");
                  }}
                  className="flex-1 min-w-[98px] h-[36px] flex items-center justify-center gap-1.5 px-2.5 bg-[#eef8f2] hover:bg-[#e2f3e8] hover:scale-[1.02] active:scale-[0.98] border border-amber-100/60 rounded-xl text-[11.5px] font-bold text-emerald-950 transition-all whitespace-nowrap shadow-2xs">
                  {isFilled ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center flex-none shadow-xs">
                      <btn.Icon size={11} strokeWidth={2.5} />
                    </span>
                  ) : (
                    <btn.Icon size={14} className="text-amber-700 flex-none" />
                  )}
                  {btn.label}
                </button>
              );
            })}
            <button className="flex-none h-[36px] px-3 bg-[#eef8f2] hover:bg-[#e2f3e8] hover:scale-105 border border-amber-100/60 rounded-xl text-amber-700 transition-all flex items-center justify-center shadow-2xs">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* ── LEFT PANEL FOOTER ───────────────────────────────────────────── */}
          <div className="flex-none p-2 bg-[#e8f7ee] border-t border-amber-100 flex items-center gap-1.5 overflow-x-auto"
               style={{ scrollbarWidth: "none" }}>
            {FOOTER_BTNS.map(btn => (
              <button key={btn.id}
                onClick={() => {
                  if (btn.id === "quick_sale" && cart.length > 0) setShowReceiptModal(true);
                  else if (btn.id === "customer_modal") setShowCustModal(true);
                  else triggerToast(`Shortcut (${btn.key}): ${btn.label}`, "info");
                }}
                className="flex-1 min-w-[95px] h-[36px] flex items-center gap-1.5 px-2.5 bg-[#d9f2e3] hover:bg-[#cbebd7] hover:scale-[1.02] active:scale-[0.98] text-emerald-950 rounded-xl transition-all border border-emerald-200/50 whitespace-nowrap shadow-2xs">
                <btn.Icon size={14} className="text-amber-700 flex-none" />
                <div className="text-left leading-none">
                  <div className="text-[10.5px] font-bold text-emerald-950 mb-0.5">{btn.label}</div>
                  <div className="text-[9px] font-semibold text-amber-700/85">({btn.key})</div>
                </div>
              </button>
            ))}

            {/* Online Status Pill */}
            <div className="flex-none h-[36px] flex items-center gap-2 px-3 bg-[#d9f2e3] rounded-xl border border-emerald-200/50 whitespace-nowrap ml-auto shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-none shadow-[0_0_8px_#22c55e]" />
              <div className="text-left leading-none">
                <div className="text-[10.5px] font-bold text-emerald-950 mb-0.5">Online</div>
                <div className="text-[9px] font-semibold text-amber-700/85">v2.0.0</div>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT CART PANEL (30%) ─────────────────────────────────────────── */}
        <div className="w-[30%] min-w-[350px] flex-none flex flex-col bg-white/95 backdrop-blur-xl rounded-sm border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Cart Header */}
          <div className="flex-none px-3.5 py-3 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-emerald-50/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-center flex-none shadow-sm">
                <ShoppingCart size={16} className="text-amber-700" />
              </div>
              <div>
                <div className="text-[13px] font-black text-slate-800 leading-tight flex items-center gap-1.5">
                  Current Sale
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse shadow-[0_0_6px_#22c55e]" />
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-400">#POS-000124</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowHoldModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-emerald-200 text-amber-800 text-[11px] font-bold rounded-lg hover:bg-emerald-100 transition-all shadow-2xs">
                <Pause size={11} /> Hold <span className="opacity-60">(F7)</span>
              </button>
              <button onClick={() => {
                  if (cart.length > 0) { setCart([]); triggerToast("Cart Cleared", "info"); }
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-lg hover:bg-rose-100 transition-all shadow-2xs">
                <X size={11} /> Clear <span className="opacity-60">(F8)</span>
              </button>
            </div>
          </div>

          {/* Cart Table Head */}
          <div className="flex-none grid px-3 py-2 border-b border-slate-100 bg-slate-100/70"
               style={{ gridTemplateColumns: "1fr 72px 60px 52px 64px 20px" }}>
            {["Item","Qty","Price","Disc","Total",""].map((h, i) => (
              <div key={i} className={`text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider ${i >= 2 ? "text-right" : ""} ${i === 1 ? "text-center" : ""}`}>{h}</div>
            ))}
          </div>

          {/* Cart Items */}
          <div className="flex-1 min-h-0 overflow-y-auto"
               style={{ scrollbarWidth: "thin", scrollbarColor: "#bbf7d0 transparent" }}>
            {cart.map(item => {
              const total = lineTotal(item);
              return (
                <div key={item.id}
                  className="grid items-center px-3 py-2 hover:bg-amber-50/50 border-b border-slate-50 group transition-all"
                  style={{ gridTemplateColumns: "1fr 72px 60px 52px 64px 20px" }}>
                  {/* Item */}
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-amber-100 flex items-center justify-center flex-none text-[16px] shadow-2xs group-hover:scale-110 transition-transform">
                      {item.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-800 truncate leading-tight">{item.name}</div>
                      <div className="text-[9.5px] text-slate-400 font-medium">{item.unit}</div>
                    </div>
                  </div>
                  {/* Qty */}
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => updQty(item.id, -1)}
                      className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center hover:bg-emerald-200 text-slate-700 active:scale-95 transition-all">
                      <Minus size={9} />
                    </button>
                    <span className="w-4 text-center text-[11.5px] font-bold text-slate-800">{item.qty}</span>
                    <button onClick={() => updQty(item.id, 1)}
                      className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center hover:bg-emerald-200 text-slate-700 active:scale-95 transition-all">
                      <Plus size={9} />
                    </button>
                  </div>
                  {/* Price */}
                  <div className="text-right text-[10.5px] font-semibold text-slate-600">৳ {item.price.toFixed(2)}</div>
                  {/* Discount */}
                  <div className="text-right">
                    {item.discount > 0
                      ? <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-emerald-200 px-1 py-0.5 rounded shadow-2xs">{item.discount}%</span>
                      : <span className="text-[10px] text-slate-300">—</span>}
                  </div>
                  {/* Total */}
                  <div className="text-right text-[11px] font-black text-slate-900">৳ {total.toFixed(2)}</div>
                  {/* Remove */}
                  <button onClick={() => remItem(item.id)}
                    className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100">
                    <X size={11} />
                  </button>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-2 border border-amber-100 shadow-inner">
                  <ShoppingCart size={22} strokeWidth={1.5} />
                </div>
                <h4 className="text-xs font-bold text-slate-700">Cart is Empty</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 max-w-[180px]">Click any product card to start building this sale.</p>
              </div>
            )}
          </div>

          {/* Summary Box */}
          <div className="flex-none border-t border-slate-100 px-3.5 pt-2.5 pb-2 bg-gradient-to-b from-white via-emerald-50/20 to-emerald-50/50">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-800">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500 font-medium">Discount</span>
                <span className="font-bold text-rose-500">- {fmt(discAmt)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500 font-medium">VAT (5%)</span>
                <span className="font-bold text-slate-800">{fmt(vatAmt)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-emerald-200/80 bg-amber-50/80 -mx-3.5 px-3.5 py-2">
              <span className="text-[14.5px] font-black text-emerald-950">Grand Total</span>
              <span className="text-[22px] font-black bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-700 bg-clip-text text-transparent tracking-tight">
                ৳ {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Customer Selection Row */}
          <div className="flex-none px-3.5 py-2 flex items-center gap-2 border-t border-slate-100 bg-white">
            <select
              value={selectedCust}
              onChange={e => setSelectedCust(e.target.value)}
              className="flex-1 appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11.5px] font-semibold text-slate-700 outline-none cursor-pointer hover:border-amber-300 transition-colors shadow-2xs">
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
            <button onClick={() => setShowCustModal(true)}
              className="flex-none flex items-center gap-1 border border-emerald-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-50 transition-colors shadow-2xs bg-white whitespace-nowrap">
              <UserPlus size={12} /> Add
            </button>
          </div>

          {/* Payment Methods Grid */}
          <div className="flex-none px-3.5 pb-2.5 grid grid-cols-3 gap-1.5 bg-white">
            {PAYMENT_METHODS.map(pm => {
              const active = payMethod === pm.key;
              return (
                <button key={pm.key} onClick={() => setPayMethod(pm.key)}
                  className={`flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-xl text-[10.5px] font-bold border transition-all ${
                    active
                      ? "bg-gradient-to-br from-amber-500 to-yellow-600 border-emerald-800 text-white shadow-[0_4px_12px_rgba(21,128,61,0.3)] scale-[1.02]"
                      : "bg-slate-50 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-slate-700 hover:scale-[1.01]"
                  }`}>
                  <pm.Icon size={12} className={active ? "text-white" : pm.color} />
                  <span className="truncate">{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── RIGHT PANEL FOOTER (PROCESS SALE BUTTON WITH SHIMMER VFX) ────── */}
          <div className="flex-none p-3 bg-slate-50/90 border-t border-slate-100">
            <button onClick={() => {
                if (cart.length > 0) setShowReceiptModal(true);
                else triggerToast("Please add items to cart first!", "info");
              }}
              className="w-full flex items-center justify-between text-white rounded-xl px-4 py-3 transition-all active:scale-[0.98] group relative overflow-hidden animate-shimmer shadow-[0_8px_25px_rgba(21,128,61,0.35)] hover:shadow-[0_12px_30px_rgba(22,163,74,0.45)]">
              <div className="flex items-center gap-2.5 relative z-10">
                <div className="w-8.5 h-8.5 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <Printer size={16} />
                </div>
                <div className="text-left">
                  <div className="text-[14px] font-black leading-tight tracking-wide">Process Sale</div>
                  <div className="text-[10px] font-semibold opacity-90">Shortcut Key (F9)</div>
                </div>
              </div>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform relative z-10" />
            </button>
          </div>

        </div>
      </div>

      {/* ═══ HOLD SALE MODAL ═════════════════════════════════════════════════ */}
      <CustomModal open={showHoldModal} onClose={() => setShowHoldModal(false)} title="Hold Sale & Saved Bills" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-sm">
            <h4 className="text-xs font-bold text-emerald-950 mb-1">Hold Current Order</h4>
            <p className="text-xs text-amber-700/80 mb-2">Save current cart items to resume later.</p>
            <div className="flex gap-2">
              <input
                value={holdNote}
                onChange={e => setHoldNote(e.target.value)}
                placeholder="Enter order note (e.g. Table 4, Phone Order)..."
                className="flex-1 px-3 py-2 text-xs border border-emerald-200 rounded-xl outline-none focus:border-amber-500 bg-white"
              />
              <CustomButton themeColor="emerald" onClick={handleHoldSale} disabled={cart.length === 0}>
                Hold Cart
              </CustomButton>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-2">Held Orders ({heldSales.length})</h4>
            {heldSales.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">No orders currently held.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {heldSales.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-300 transition-colors">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{h.id} — <span className="text-amber-700">{h.note}</span></div>
                      <div className="text-[10px] text-slate-400">{h.items.length} Items • Saved at {h.time}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-800">{fmt(h.total)}</span>
                      <button onClick={() => restoreHeldSale(h)} className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors">
                        Resume
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CustomModal>

      {/* ═══ CUSTOMER MANAGEMENT MODAL ═══════════════════════════════════════ */}
      <CustomModal open={showCustModal} onClose={() => setShowCustModal(false)} title="Customer Directory & Management" size="md">
        <div className="space-y-4">

          {/* Tab Navigation Buttons */}
          <div className="flex border-b border-amber-100 gap-2">
            <button
              type="button"
              onClick={() => setCustModalTab("view")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold border-b-2 transition-all ${
                custModalTab === "view"
                  ? "border-emerald-700 text-emerald-900 bg-amber-50/80 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}>
              <User size={14} className="text-amber-700" />
              View Customers ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setCustModalTab("add")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold border-b-2 transition-all ${
                custModalTab === "add"
                  ? "border-emerald-700 text-emerald-900 bg-amber-50/80 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}>
              <UserPlus size={14} className="text-amber-700" />
              Add Customer
            </button>
          </div>

          {/* TAB 1: VIEW & SEARCH CUSTOMERS */}
          {custModalTab === "view" && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={custSearchQuery}
                  onChange={e => setCustSearchQuery(e.target.value)}
                  placeholder="Search customer by name or phone number..."
                  className="w-full h-9 pl-9 pr-8 text-xs font-medium border border-emerald-200 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white"
                />
                {custSearchQuery && (
                  <button onClick={() => setCustSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Customer Cards List */}
              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {customers
                  .filter(c =>
                    c.name.toLowerCase().includes(custSearchQuery.toLowerCase()) ||
                    (c.phone && c.phone.includes(custSearchQuery))
                  )
                  .map(c => {
                    const isSelected = selectedCust === c.id;
                    return (
                      <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-amber-50/90 border-amber-300 shadow-2xs ring-1 ring-emerald-400/50"
                          : "bg-slate-50/70 border-slate-200 hover:bg-amber-50/40 hover:border-amber-200"
                      }`}>
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-800">{c.name}</span>
                            {isSelected && (
                              <span className="text-[9px] font-bold text-amber-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-slate-500 mt-0.5 font-medium">
                            {c.phone && <span>📞 {c.phone}</span>}
                            {c.email && <span>✉️ {c.email}</span>}
                            {c.address && <span className="truncate max-w-[180px]">📍 {c.address}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCust(c.id);
                            setShowCustModal(false);
                            triggerToast(`Selected ${c.name}`);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-none ${
                            isSelected
                              ? "bg-emerald-700 text-white shadow-xs"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-amber-500 hover:text-white hover:border-emerald-600"
                          }`}>
                          {isSelected ? "Active" : "Select"}
                        </button>
                      </div>
                    );
                  })}

                {customers.filter(c =>
                  c.name.toLowerCase().includes(custSearchQuery.toLowerCase()) ||
                  (c.phone && c.phone.includes(custSearchQuery))
                ).length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No customer matching "{custSearchQuery}" found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADD NEW CUSTOMER FORM */}
          {custModalTab === "add" && (
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <CustomInput
                label="Customer Name *"
                placeholder="e.g. Abul Kalam"
                value={newCustName}
                onChange={e => setNewCustName(e.target.value)}
                required
              />
              <CustomInput
                label="Phone Number"
                placeholder="e.g. 01700000000"
                value={newCustPhone}
                onChange={e => setNewCustPhone(e.target.value)}
              />
              <CustomInput
                label="Email Address"
                placeholder="e.g. customer@example.com"
                type="email"
                value={newCustEmail}
                onChange={e => setNewCustEmail(e.target.value)}
              />
              <CustomInput
                label="Address"
                placeholder="e.g. House 12, Road 4, Dhanmondi, Dhaka"
                value={newCustAddress}
                onChange={e => setNewCustAddress(e.target.value)}
              />

              <div className="flex gap-2 pt-2">
                <CustomButton variant="outline" fullWidth onClick={() => setShowCustModal(false)} type="button">
                  Cancel
                </CustomButton>
                <CustomButton themeColor="emerald" fullWidth type="submit">
                  Save Customer
                </CustomButton>
              </div>
            </form>
          )}

        </div>
      </CustomModal>

      {/* ═══ RECEIPT / CHECKOUT CONFIRMATION MODAL ═══════════════════════════ */}
      <CustomModal open={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Sale Invoice & Receipt" size="md">
        <div className="space-y-4">
          {/* Printable Receipt Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm font-mono text-xs text-slate-800 shadow-inner">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">BPOS Bakery &amp; Manufacturing</h3>
              <p className="text-[10px] text-slate-500">Dhanmondi, Dhaka, Bangladesh</p>
              <p className="text-[10px] text-slate-500">Phone: +880 1700-000000</p>
              <div className="mt-2 text-[10px] font-bold text-amber-800 bg-emerald-100 inline-block px-2 py-0.5 rounded">
                TAX INVOICE {lastInvoiceNo}
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between"><span>Customer:</span><span className="font-bold">{activeCustomerObj?.name}</span></div>
              <div className="flex justify-between"><span>Date/Time:</span><span>{dateStr} {timeStr}</span></div>
              <div className="flex justify-between"><span>Payment Method:</span><span className="font-bold uppercase text-amber-700">{payMethod}</span></div>
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-[11px]">
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-[9.5px] text-slate-500">{item.qty} x ৳ {item.price.toFixed(2)}</div>
                  </div>
                  <div className="font-bold">৳ {lineTotal(item).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-rose-600"><span>Discount:</span><span>- {fmt(discAmt)}</span></div>
              <div className="flex justify-between"><span>VAT (5%):</span><span>{fmt(vatAmt)}</span></div>
              <div className="flex justify-between text-sm font-black text-emerald-900 pt-1 border-t border-slate-300">
                <span>GRAND TOTAL:</span>
                <span>{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <CustomButton variant="outline" fullWidth onClick={() => setShowReceiptModal(false)}>
              Cancel
            </CustomButton>
            <CustomButton themeColor="emerald" fullWidth onClick={handleCompleteCheckout}>
              <Printer size={16} className="mr-1.5" /> Print &amp; Complete (F9)
            </CustomButton>
          </div>
        </div>
      </CustomModal>

    </div>
  );
}
