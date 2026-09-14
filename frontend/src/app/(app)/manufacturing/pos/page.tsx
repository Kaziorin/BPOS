"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search, ChevronDown, ChevronRight, MoreHorizontal,
  Plus, Minus, X, Pause, Printer, DollarSign, CreditCard,
  Smartphone, Receipt, Clock, LayoutGrid, List,
  UserPlus, ShoppingBag, FileText, Tag, Landmark,
  BarChart2, Truck, Star, ShoppingCart, ArrowRight,
  User, Check, Sparkles, RefreshCw, Zap, ShieldCheck,
} from "lucide-react";
import { CustomModal, CustomButton, CustomInput, CustomSelect } from "@/components/custom";

// ─── DATA & SCHEMAS ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",       label: "All Products",        emoji: "🧁", icon: "grid" },
  { id: "bread",     label: "Bread & Bakery",       emoji: "🍞" },
  { id: "cake",      label: "Cake & Pastry",        emoji: "🎂" },
  { id: "cookies",   label: "Cookies & Biscuits",   emoji: "🍪" },
  { id: "snacks",    label: "Snacks",               emoji: "🍿" },
  { id: "flour",     label: "Flour & Raw Material", emoji: "🌾" },
  { id: "beverage",  label: "Beverages",            emoji: "☕" },
  { id: "dairy",     label: "Dairy & Egg",          emoji: "🥚" },
  { id: "packaging", label: "Packaging",            emoji: "📦" },
];

const ACTION_BTNS = [
  { id: "customer", label: "Add Customer", Icon: UserPlus,   color: "text-teal-600" },
  { id: "sale",     label: "New Sale",     Icon: Plus,       color: "text-[#15803d]" },
  { id: "order",    label: "Sales Order",  Icon: FileText,   color: "text-[#15803d]" },
  { id: "quote",    label: "Quotation",    Icon: Tag,        color: "text-[#15803d]" },
  { id: "credit",   label: "Credit Sale",  Icon: CreditCard, color: "text-[#15803d]" },
  { id: "hold",     label: "Hold Bill",    Icon: Pause,      color: "text-[#15803d]" },
  { id: "wh",       label: "Warehouse",    Icon: Landmark,   color: "text-[#15803d]" },
  { id: "reports",  label: "Reports",      Icon: BarChart2,  color: "text-[#15803d]" },
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

const PRODUCTS = [
  { id: 1,  name: "White Bread",           unit: "500g",       price: 45,  stock: 120, maxStock: 150, cat: "bread",   badge: "Popular",    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200", emoji: "🍞", bgGradient: "from-amber-100/80 via-orange-50/60 to-yellow-100/40" },
  { id: 2,  name: "Whole Wheat Bread",     unit: "500g",       price: 55,  stock: 85,  maxStock: 120, cat: "bread",   badge: "Healthy",    badgeColor: "bg-sky-100 text-sky-800 border-sky-200",             emoji: "🍞", bgGradient: "from-amber-100/80 via-amber-50/60 to-yellow-50/40" },
  { id: 3,  name: "Burger Bun",            unit: "1 pcs",      price: 18,  stock: 200, maxStock: 250, cat: "bread",   badge: "Best Seller",badgeColor: "bg-amber-100 text-amber-800 border-amber-200",       emoji: "🥐", bgGradient: "from-yellow-100/80 via-amber-50/60 to-orange-50/40" },
  { id: 4,  name: "Cake (Vanilla)",        unit: "1 kg",       price: 350, stock: 40,  maxStock: 60,  cat: "cake",    badge: "New",        badgeColor: "bg-rose-100 text-rose-800 border-rose-200",         emoji: "🎂", bgGradient: "from-rose-100/80 via-pink-50/60 to-orange-50/40" },
  { id: 5,  name: "Chocolate Cake",        unit: "1 kg",       price: 420, stock: 25,  maxStock: 50,  cat: "cake",    badge: "Chef Special",badgeColor: "bg-purple-100 text-purple-800 border-purple-200",   emoji: "🍫", bgGradient: "from-purple-100/80 via-indigo-50/60 to-pink-50/40" },
  { id: 6,  name: "Croissant",             unit: "1 pcs",      price: 60,  stock: 40,  maxStock: 80,  cat: "bread",   badge: "",           badgeColor: "",                                                   emoji: "🥐", bgGradient: "from-amber-100/80 via-yellow-50/60 to-orange-50/40" },
  { id: 7,  name: "Danish Pastry",         unit: "1 pcs",      price: 55,  stock: 45,  maxStock: 80,  cat: "cake",    badge: "",           badgeColor: "",                                                   emoji: "🥐", bgGradient: "from-amber-100/80 via-rose-50/60 to-pink-50/40" },
  { id: 8,  name: "Cookies (Choco Chip)",  unit: "250g",       price: 120, stock: 70,  maxStock: 100, cat: "cookies", badge: "Hot",        badgeColor: "bg-orange-100 text-orange-800 border-orange-200",   emoji: "🍪", bgGradient: "from-orange-100/80 via-amber-50/60 to-yellow-50/40" },
  { id: 9,  name: "Biscuits (Butter)",     unit: "300g",       price: 80,  stock: 90,  maxStock: 120, cat: "cookies", badge: "",           badgeColor: "",                                                   emoji: "🍪", bgGradient: "from-amber-100/80 via-orange-50/60 to-yellow-50/40" },
  { id: 10, name: "Muffin (Blueberry)",    unit: "1 pcs",      price: 40,  stock: 55,  maxStock: 80,  cat: "cake",    badge: "",           badgeColor: "",                                                   emoji: "🧁", bgGradient: "from-purple-100/80 via-pink-50/60 to-rose-50/40" },
  { id: 11, name: "Flour (All Purpose)",   unit: "1 kg",       price: 65,  stock: 150, maxStock: 200, cat: "flour",   badge: "",           badgeColor: "",                                                   emoji: "🌾", bgGradient: "from-emerald-100/80 via-teal-50/60 to-green-50/40" },
  { id: 12, name: "Yeast (Active Dry)",    unit: "500g",       price: 160, stock: 35,  maxStock: 60,  cat: "flour",   badge: "",           badgeColor: "",                                                   emoji: "🫙", bgGradient: "from-teal-100/80 via-emerald-50/60 to-sky-50/40" },
  { id: 13, name: "Premium Butter",        unit: "200g",       price: 190, stock: 50,  maxStock: 75,  cat: "dairy",   badge: "Fresh",      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200", emoji: "🧈", bgGradient: "from-yellow-100/90 via-amber-50/70 to-emerald-50/40" },
  { id: 14, name: "Milk Powder",           unit: "500g",       price: 320, stock: 50,  maxStock: 80,  cat: "dairy",   badge: "",           badgeColor: "",                                                   emoji: "🥛", bgGradient: "from-sky-100/80 via-blue-50/60 to-teal-50/40" },
  { id: 15, name: "Cooking Oil",           unit: "1 ltr",      price: 180, stock: 60,  maxStock: 100, cat: "flour",   badge: "",           badgeColor: "",                                                   emoji: "🫙", bgGradient: "from-amber-100/80 via-yellow-50/60 to-orange-50/40" },
  { id: 16, name: "Refined Sugar",         unit: "1 kg",       price: 70,  stock: 120, maxStock: 180, cat: "flour",   badge: "",           badgeColor: "",                                                   emoji: "🍚", bgGradient: "from-slate-100/90 via-emerald-50/60 to-teal-50/40" },
  { id: 17, name: "Iodized Salt",          unit: "1 kg",       price: 25,  stock: 200, maxStock: 250, cat: "flour",   badge: "",           badgeColor: "",                                                   emoji: "🧂", bgGradient: "from-slate-100/90 via-sky-50/60 to-blue-50/40" },
  { id: 18, name: "Instant Noodles",       unit: "Pack (5 pcs)",price: 95, stock: 75,  maxStock: 100, cat: "snacks",  badge: "",           badgeColor: "",                                                   emoji: "🍜", bgGradient: "from-red-100/80 via-orange-50/60 to-amber-50/40" },
];

const PAYMENT_METHODS = [
  { key: "cash",   label: "Cash",           Icon: DollarSign,     color: "text-emerald-600" },
  { key: "card",   label: "Card / POS",     Icon: CreditCard,     color: "text-sky-600"     },
  { key: "mobile", label: "bKash/Nagad",    Icon: Smartphone,     color: "text-pink-600"    },
  { key: "credit", label: "Credit Sale",    Icon: Receipt,        color: "text-purple-600"  },
  { key: "due",    label: "Partial Due",    Icon: Clock,          color: "text-amber-600"   },
  { key: "other",  label: "Other",          Icon: MoreHorizontal, color: "text-slate-500"   },
];

type CartItem = typeof PRODUCTS[0] & { qty: number; discount: number };
type HeldSale = { id: string; time: string; note: string; items: CartItem[]; total: number };

const INITIAL_CART: CartItem[] = [
  { ...PRODUCTS[0],  qty: 2, discount: 5  },
  { ...PRODUCTS[2],  qty: 5, discount: 0  },
  { ...PRODUCTS[3],  qty: 1, discount: 10 },
  { ...PRODUCTS[7],  qty: 2, discount: 5  },
  { ...PRODUCTS[12], qty: 1, discount: 0  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function BakeryPOSPage() {
  const [activeCat, setActiveCat]           = useState("all");
  const [search, setSearch]                 = useState("");
  const [cart, setCart]                     = useState<CartItem[]>(INITIAL_CART);
  const [payMethod, setPayMethod]           = useState("cash");
  const [viewMode, setViewMode]             = useState<"grid"|"list">("grid");
  const [addedId, setAddedId]               = useState<number|null>(null);
  const [time, setTime]                     = useState(new Date());

  // Customers state
  const [customers, setCustomers]           = useState([
    { id: "walkin", name: "Walk-in Customer", phone: "" },
    { id: "c1", name: "Rahat Khan", phone: "01712345678" },
    { id: "c2", name: "Anika Rahman", phone: "01898765432" },
    { id: "c3", name: "Tanvir Ahmed", phone: "01911223344" },
  ]);
  const [selectedCust, setSelectedCust]     = useState("walkin");

  // Modals & Triggers
  const [showHoldModal, setShowHoldModal]   = useState(false);
  const [showCustModal, setShowCustModal]   = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [holdNote, setHoldNote]             = useState("");
  const [heldSales, setHeldSales]           = useState<HeldSale[]>([]);

  // Customer form inputs
  const [newCustName, setNewCustName]       = useState("");
  const [newCustPhone, setNewCustPhone]     = useState("");

  // Toast System
  const [toast, setToast]                   = useState<{ msg: string; type?: "success"|"info" } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const filtered = PRODUCTS.filter(p =>
    (activeCat === "all" || p.cat === activeCat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.cat.toLowerCase().includes(search.toLowerCase()))
  );

  function addToCart(p: typeof PRODUCTS[0]) {
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 500);
    setCart(prev => {
      const ex = prev.find(c => c.id === p.id);
      if (ex) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1, discount: 0 }];
    });
    triggerToast(`Added ${p.name} to cart`);
  }

  function updQty(id: number, d: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + d) } : c));
  }

  function remItem(id: number) {
    setCart(prev => prev.filter(c => c.id !== id));
  }

  function handleHoldSale() {
    if (cart.length === 0) return;
    const newHold: HeldSale = {
      id: `#HOLD-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      note: holdNote || "General Customer Order",
      items: [...cart],
      total: grandTotal,
    };
    setHeldSales(prev => [newHold, ...prev]);
    setCart([]);
    setHoldNote("");
    setShowHoldModal(false);
    triggerToast(`Order ${newHold.id} held successfully!`);
  }

  function restoreHeldSale(h: HeldSale) {
    setCart(h.items);
    setHeldSales(prev => prev.filter(x => x.id !== h.id));
    setShowHoldModal(false);
    triggerToast(`Restored held order ${h.id}`);
  }

  function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustName) return;
    const newC = {
      id: `c_${Date.now()}`,
      name: newCustName,
      phone: newCustPhone || "N/A",
    };
    setCustomers(prev => [...prev, newC]);
    setSelectedCust(newC.id);
    setNewCustName("");
    setNewCustPhone("");
    setShowCustModal(false);
    triggerToast(`Customer ${newC.name} added!`);
  }

  function handleCompleteCheckout() {
    setShowReceiptModal(false);
    setCart([]);
    triggerToast("Sale Completed & Receipt Printed! 🎉", "success");
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
        <div className="fixed top-4 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-950/95 via-emerald-900/95 to-teal-950/95 backdrop-blur-2xl text-white text-xs font-black rounded-2xl shadow-[0_12px_40px_rgba(4,120,87,0.45)] border border-emerald-400/40 animate-bounce">
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block shadow-[0_0_8px_#22c55e]" />
            </div>
            <div className="text-[9.5px] font-bold text-emerald-600 tracking-[0.12em] uppercase">Enterprise POS v2.0</div>
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
            className="w-full h-[38px] rounded-xl border border-emerald-200/90 bg-white/95 pl-9.5 pr-20 text-[12px] font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 shadow-sm"
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
          <div className="flex items-center gap-2.5 bg-white/90 border border-slate-200/80 rounded-xl px-3 h-[38px] shadow-sm hover:border-emerald-300 transition-all">
            <div className="w-6.5 h-6.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-none">
              <FileText size={14} className="text-emerald-700" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Today&apos;s Sales</div>
              <div className="text-[12px] font-black text-emerald-800 leading-none">৳ 18,450.00</div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="flex items-center gap-2.5 bg-white/90 border border-slate-200/80 rounded-xl px-3 h-[38px] shadow-sm hover:border-sky-300 transition-all">
            <div className="w-6.5 h-6.5 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center flex-none">
              <ShoppingBag size={14} className="text-sky-600" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Total Orders</div>
              <div className="text-[12px] font-black text-slate-800 leading-none">24 Orders</div>
            </div>
          </div>

          {/* Live Clock */}
          <div className="flex items-center gap-2.5 bg-white/90 border border-slate-200/80 rounded-xl px-3 h-[38px] shadow-sm hover:border-amber-300 transition-all">
            <div className="w-6.5 h-6.5 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-none">
              <Clock size={14} className="text-amber-600" />
            </div>
            <div>
              <div className="text-[12px] font-black text-slate-800 leading-none">{timeStr}</div>
              <div className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">{dateStr}</div>
            </div>
          </div>

          {/* Admin User */}
          <div className="flex items-center gap-2.5 bg-white/90 border border-slate-200/80 rounded-xl px-3 h-[38px] cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all">
            <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-emerald-800 to-green-700 flex items-center justify-center text-white text-[11px] font-black flex-none shadow-sm">A</div>
            <div>
              <div className="text-[11.5px] font-bold text-slate-800 leading-none">Admin</div>
              <div className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">Administrator</div>
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </div>
        </div>
      </header>

      {/* ═══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 flex gap-3 px-3.5 pb-2.5 pt-1.5 overflow-hidden z-10 relative">

        {/* ── LEFT PANEL (70%) ──────────────────────────────────────────────── */}
        <div className="w-[70%] min-w-0 flex flex-col bg-white/90 backdrop-blur-xl rounded-2xl border border-emerald-200/80 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)]">

          {/* Category Bar */}
          <div className="flex-none flex items-center gap-2 px-3.5 pt-2.5 pb-2 overflow-x-auto border-b border-slate-100"
               style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map(c => {
              const active = activeCat === c.id;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className={`flex-1 min-w-[82px] flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-1.5 h-[62px] transition-all duration-200 active:scale-95 ${
                    active
                      ? "bg-gradient-to-br from-emerald-700 via-emerald-800 to-green-900 border-emerald-600 text-white shadow-[0_8px_20px_rgba(21,128,61,0.35)] scale-[1.03] ring-2 ring-emerald-400/30"
                      : "bg-white border-slate-100 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60 hover:scale-[1.02] hover:shadow-sm"
                  }`}>
                  {c.id === "all" ? (
                    <LayoutGrid size={20} className={active ? "text-white" : "text-emerald-600"} />
                  ) : (
                    <span className="text-xl leading-none transform group-hover:scale-110 transition-transform">{c.emoji}</span>
                  )}
                  <span className={`text-[10px] font-bold text-center leading-tight whitespace-nowrap truncate max-w-full ${active ? "text-white" : "text-slate-700"}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
            <button className="flex-none sm:flex-1 min-w-[54px] flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-white text-emerald-600 hover:bg-emerald-50 px-2 py-1.5 h-[62px] transition-all hover:scale-105">
              <MoreHorizontal size={20} className="text-emerald-600" />
              <span className="text-[9.5px] font-bold text-slate-600">More</span>
            </button>
          </div>

          {/* Products Header */}
          <div className="flex-none flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[17px] font-black text-slate-800 flex items-center gap-2">
                Products
                <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                  {filtered.length}
                </span>
              </h2>
              {activeCat !== "all" && (
                <button onClick={() => setActiveCat("all")}
                  className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#15803d] font-bold text-[11px] px-3 py-0.5 rounded-full transition-colors ml-1 shadow-2xs">
                  View All <ArrowRight size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1 text-[11.5px] font-semibold text-slate-600 cursor-pointer hover:border-emerald-400 shadow-sm transition-all">
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
                    className={`bg-white rounded-2xl border border-slate-200/90 overflow-hidden cursor-pointer relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_35px_-6px_rgba(16,185,129,0.25)] hover:border-emerald-400 card-shine ${
                      isAdding ? "scale-[1.04] border-emerald-500 shadow-[0_0_22px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/50" : ""
                    } ${viewMode === "list" ? "flex items-center gap-3 p-2.5" : ""}`}>

                    {/* Floating +1 Particle Effect */}
                    {isAdding && (
                      <div className="absolute top-2 right-2 z-30 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-lg border border-emerald-300 animate-[floatUp_0.6s_ease-out_forwards] pointer-events-none flex items-center gap-0.5">
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
                        <div className="absolute top-2 right-2 z-10 text-[8px] font-black uppercase tracking-wider text-emerald-800 bg-white/85 backdrop-blur-sm border border-emerald-200/60 px-1.5 py-0.5 rounded-full shadow-2xs">
                          {p.cat}
                        </div>
                        {/* Circular Spotlight Disc */}
                        <div className="w-13 h-13 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center justify-center group-hover:scale-115 group-hover:bg-white group-hover:rotate-6 transition-all duration-300">
                          <span className="text-[34px] leading-none drop-shadow-sm">{p.emoji}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center flex-none border border-emerald-100 text-2xl shadow-2xs">
                        {p.emoji}
                      </div>
                    )}

                    {/* Info */}
                    <div className={viewMode === "grid" ? "p-2.5" : "flex-1 min-w-0"}>
                      <h3 className={`font-extrabold text-slate-800 leading-tight truncate group-hover:text-emerald-950 ${viewMode === "grid" ? "text-[12.5px]" : "text-[13.5px]"}`}>{p.name}</h3>
                      
                      <div className="flex items-center justify-between text-[9.5px] font-semibold text-slate-400 mt-1">
                        <span>{p.unit}</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                          <div className="bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-lg text-[13px] font-black shadow-2xs">
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
                          <span className="bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-lg text-[13px] font-black shadow-2xs">৳ {p.price.toFixed(2)}</span>
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
          <div className="flex-none flex items-center gap-2 px-3.5 py-2 bg-[#f4fbf6] border-t border-emerald-100/70 overflow-x-auto"
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
                  className="flex-1 min-w-[98px] h-[36px] flex items-center justify-center gap-1.5 px-2.5 bg-[#eef8f2] hover:bg-[#e2f3e8] hover:scale-[1.02] active:scale-[0.98] border border-emerald-100/60 rounded-xl text-[11.5px] font-bold text-emerald-950 transition-all whitespace-nowrap shadow-2xs">
                  {isFilled ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center flex-none shadow-xs">
                      <btn.Icon size={11} strokeWidth={2.5} />
                    </span>
                  ) : (
                    <btn.Icon size={14} className="text-emerald-700 flex-none" />
                  )}
                  {btn.label}
                </button>
              );
            })}
            <button className="flex-none h-[36px] px-3 bg-[#eef8f2] hover:bg-[#e2f3e8] hover:scale-105 border border-emerald-100/60 rounded-xl text-emerald-700 transition-all flex items-center justify-center shadow-2xs">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* ── LEFT PANEL FOOTER ───────────────────────────────────────────── */}
          <div className="flex-none p-2 bg-[#e8f7ee] border-t border-emerald-100 flex items-center gap-1.5 overflow-x-auto"
               style={{ scrollbarWidth: "none" }}>
            {FOOTER_BTNS.map(btn => (
              <button key={btn.id}
                onClick={() => {
                  if (btn.id === "quick_sale" && cart.length > 0) setShowReceiptModal(true);
                  else if (btn.id === "customer_modal") setShowCustModal(true);
                  else triggerToast(`Shortcut (${btn.key}): ${btn.label}`, "info");
                }}
                className="flex-1 min-w-[95px] h-[36px] flex items-center gap-1.5 px-2.5 bg-[#d9f2e3] hover:bg-[#cbebd7] hover:scale-[1.02] active:scale-[0.98] text-emerald-950 rounded-xl transition-all border border-emerald-200/50 whitespace-nowrap shadow-2xs">
                <btn.Icon size={14} className="text-emerald-700 flex-none" />
                <div className="text-left leading-none">
                  <div className="text-[10.5px] font-bold text-emerald-950 mb-0.5">{btn.label}</div>
                  <div className="text-[9px] font-semibold text-emerald-700/85">({btn.key})</div>
                </div>
              </button>
            ))}

            {/* Online Status Pill */}
            <div className="flex-none h-[36px] flex items-center gap-2 px-3 bg-[#d9f2e3] rounded-xl border border-emerald-200/50 whitespace-nowrap ml-auto shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-none shadow-[0_0_8px_#22c55e]" />
              <div className="text-left leading-none">
                <div className="text-[10.5px] font-bold text-emerald-950 mb-0.5">Online</div>
                <div className="text-[9px] font-semibold text-emerald-700/85">v2.0.0</div>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT CART PANEL (30%) ─────────────────────────────────────────── */}
        <div className="w-[30%] min-w-[350px] flex-none flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Cart Header */}
          <div className="flex-none px-3.5 py-3 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-emerald-50/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-center flex-none shadow-sm">
                <ShoppingCart size={16} className="text-emerald-700" />
              </div>
              <div>
                <div className="text-[13px] font-black text-slate-800 leading-tight flex items-center gap-1.5">
                  Current Sale
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shadow-[0_0_6px_#22c55e]" />
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-400">#POS-000124</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowHoldModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg hover:bg-emerald-100 transition-all shadow-2xs">
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
                  className="grid items-center px-3 py-2 hover:bg-emerald-50/50 border-b border-slate-50 group transition-all"
                  style={{ gridTemplateColumns: "1fr 72px 60px 52px 64px 20px" }}>
                  {/* Item */}
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center flex-none text-[16px] shadow-2xs group-hover:scale-110 transition-transform">
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
                      ? <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded shadow-2xs">{item.discount}%</span>
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
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2 border border-emerald-100 shadow-inner">
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
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-emerald-200/80 bg-emerald-50/80 -mx-3.5 px-3.5 py-2">
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
              className="flex-1 appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11.5px] font-semibold text-slate-700 outline-none cursor-pointer hover:border-emerald-300 transition-colors shadow-2xs">
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
            <button onClick={() => setShowCustModal(true)}
              className="flex-none flex items-center gap-1 border border-emerald-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-2xs bg-white whitespace-nowrap">
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
                      ? "bg-gradient-to-br from-emerald-800 to-green-700 border-emerald-800 text-white shadow-[0_4px_12px_rgba(21,128,61,0.3)] scale-[1.02]"
                      : "bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 hover:scale-[1.01]"
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
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <h4 className="text-xs font-bold text-emerald-950 mb-1">Hold Current Order</h4>
            <p className="text-xs text-emerald-700/80 mb-2">Save current cart items to resume later.</p>
            <div className="flex gap-2">
              <input
                value={holdNote}
                onChange={e => setHoldNote(e.target.value)}
                placeholder="Enter order note (e.g. Table 4, Phone Order)..."
                className="flex-1 px-3 py-2 text-xs border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
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
                  <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{h.id} — <span className="text-emerald-700">{h.note}</span></div>
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

      {/* ═══ ADD CUSTOMER MODAL ══════════════════════════════════════════════ */}
      <CustomModal open={showCustModal} onClose={() => setShowCustModal(false)} title="Add New Customer" size="sm">
        <form onSubmit={handleAddCustomer} className="space-y-3.5">
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
          <div className="flex gap-2 pt-3">
            <CustomButton variant="outline" fullWidth onClick={() => setShowCustModal(false)} type="button">
              Cancel
            </CustomButton>
            <CustomButton themeColor="emerald" fullWidth type="submit">
              Save Customer
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ═══ RECEIPT / CHECKOUT CONFIRMATION MODAL ═══════════════════════════ */}
      <CustomModal open={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Sale Invoice & Receipt" size="md">
        <div className="space-y-4">
          {/* Printable Receipt Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 shadow-inner">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">BPOS Bakery &amp; Manufacturing</h3>
              <p className="text-[10px] text-slate-500">Dhanmondi, Dhaka, Bangladesh</p>
              <p className="text-[10px] text-slate-500">Phone: +880 1700-000000</p>
              <div className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 inline-block px-2 py-0.5 rounded">
                TAX INVOICE #POS-000124
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between"><span>Customer:</span><span className="font-bold">{activeCustomerObj?.name}</span></div>
              <div className="flex justify-between"><span>Date/Time:</span><span>{dateStr} {timeStr}</span></div>
              <div className="flex justify-between"><span>Payment Method:</span><span className="font-bold uppercase text-emerald-700">{payMethod}</span></div>
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
