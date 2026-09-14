"use client";

import React, { useState, useEffect } from "react";
import {
  Search, ChevronDown, ChevronRight, MoreHorizontal,
  Plus, Minus, X, Pause, Printer, DollarSign, CreditCard,
  Smartphone, Receipt, Clock, LayoutGrid, List,
  UserPlus, ShoppingBag, FileText, Tag, Landmark,
  BarChart2, Truck, Star, ShoppingCart, ArrowRight,
  User,
} from "lucide-react";
import { CustomModal, CustomButton, CustomInput, CustomSelect } from "@/components/custom";

// ─── DATA ─────────────────────────────────────────────────────────────────────
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
  { label: "Add Customer", Icon: UserPlus,    color: "text-teal-600" },
  { label: "New Sale",     Icon: Plus,        color: "text-green-700" },
  { label: "Sales Order",  Icon: FileText,    color: "text-green-700" },
  { label: "Quotation",    Icon: Tag,         color: "text-green-700" },
  { label: "Credit Sale",  Icon: CreditCard,  color: "text-green-700" },
  { label: "Hold Bill",    Icon: Pause,       color: "text-green-700" },
  { label: "Warehouse",    Icon: Landmark,    color: "text-green-700" },
  { label: "Reports",      Icon: BarChart2,   color: "text-green-700" },
];

const FOOTER_BTNS = [
  { label: "Quick Sale",  key: "F9",  Icon: ShoppingCart },
  { label: "Sales Order", key: "F5",  Icon: FileText },
  { label: "Quotation",   key: "F6",  Icon: Receipt },
  { label: "Customer",    key: "F2",  Icon: User },
  { label: "Warehouse",   key: "F3",  Icon: Landmark },
  { label: "Credit",      key: "F4",  Icon: CreditCard },
  { label: "Commission",  key: "F8",  Icon: Star },
  { label: "Delivery",    key: "F10", Icon: Truck },
];

const PRODUCTS = [
  { id: 1,  name: "White Bread",           unit: "500g",       price: 45,  stock: 120, cat: "bread",   badge: "Popular",    badgeColor: "bg-green-100 text-green-700",   emoji: "🍞" },
  { id: 2,  name: "Whole Wheat Bread",     unit: "500g",       price: 55,  stock: 85,  cat: "bread",   badge: "Healthy",    badgeColor: "bg-sky-100 text-sky-700",        emoji: "🍞" },
  { id: 3,  name: "Burger Bun",            unit: "1 pcs",      price: 18,  stock: 200, cat: "bread",   badge: "Best Seller",badgeColor: "bg-orange-100 text-orange-700",  emoji: "🥐" },
  { id: 4,  name: "Cake (Vanilla)",        unit: "1 kg",       price: 350, stock: 40,  cat: "cake",    badge: "New",        badgeColor: "bg-red-100 text-red-600",        emoji: "🎂" },
  { id: 5,  name: "Chocolate Cake",        unit: "1 kg",       price: 420, stock: 25,  cat: "cake",    badge: "",           badgeColor: "",                               emoji: "🍫" },
  { id: 6,  name: "Croissant",             unit: "1 pcs",      price: 60,  stock: 40,  cat: "bread",   badge: "",           badgeColor: "",                               emoji: "🥐" },
  { id: 7,  name: "Danish Pastry",         unit: "1 pcs",      price: 55,  stock: 45,  cat: "cake",    badge: "",           badgeColor: "",                               emoji: "🥐" },
  { id: 8,  name: "Cookies (Choco Chip)",  unit: "250g",       price: 120, stock: 70,  cat: "cookies", badge: "",           badgeColor: "",                               emoji: "🍪" },
  { id: 9,  name: "Biscuits (Butter)",     unit: "300g",       price: 80,  stock: 90,  cat: "cookies", badge: "",           badgeColor: "",                               emoji: "🍪" },
  { id: 10, name: "Muffin",                unit: "1 pcs",      price: 40,  stock: 55,  cat: "cake",    badge: "",           badgeColor: "",                               emoji: "🧁" },
  { id: 11, name: "Flour (All Purpose)",   unit: "1 kg",       price: 65,  stock: 150, cat: "flour",   badge: "",           badgeColor: "",                               emoji: "🌾" },
  { id: 12, name: "Yeast",                 unit: "500g",       price: 160, stock: 35,  cat: "flour",   badge: "",           badgeColor: "",                               emoji: "🫙" },
  { id: 13, name: "Butter",                unit: "200g",       price: 190, stock: 50,  cat: "dairy",   badge: "",           badgeColor: "",                               emoji: "🧈" },
  { id: 14, name: "Milk Powder",           unit: "500g",       price: 320, stock: 50,  cat: "dairy",   badge: "",           badgeColor: "",                               emoji: "🥛" },
  { id: 15, name: "Cooking Oil",           unit: "1 ltr",      price: 180, stock: 60,  cat: "flour",   badge: "",           badgeColor: "",                               emoji: "🫙" },
  { id: 16, name: "Sugar",                 unit: "1 kg",       price: 70,  stock: 120, cat: "flour",   badge: "",           badgeColor: "",                               emoji: "🍚" },
  { id: 17, name: "Salt",                  unit: "1 kg",       price: 25,  stock: 200, cat: "flour",   badge: "",           badgeColor: "",                               emoji: "🧂" },
  { id: 18, name: "Instant Noodles",       unit: "Pack (5 pcs)",price: 95, stock: 75,  cat: "snacks",  badge: "",           badgeColor: "",                               emoji: "🍜" },
];

const PAYMENT_METHODS = [
  { key: "cash",   label: "Cash",           Icon: DollarSign,  color: "text-green-600"  },
  { key: "card",   label: "Card",           Icon: CreditCard,  color: "text-blue-600"   },
  { key: "mobile", label: "Mobile Banking", Icon: Smartphone,  color: "text-teal-600"   },
  { key: "credit", label: "Credit",         Icon: Receipt,     color: "text-purple-600" },
  { key: "due",    label: "Due",            Icon: Clock,       color: "text-orange-600" },
  { key: "other",  label: "Other",          Icon: MoreHorizontal, color: "text-slate-500" },
];

type CartItem = typeof PRODUCTS[0] & { qty: number; discount: number };

const INITIAL_CART: CartItem[] = [
  { ...PRODUCTS[0],  qty: 2, discount: 5  },
  { ...PRODUCTS[2],  qty: 5, discount: 0  },
  { ...PRODUCTS[3],  qty: 1, discount: 10 },
  { ...PRODUCTS[4],  qty: 1, discount: 0  },
  { ...PRODUCTS[7],  qty: 2, discount: 5  },
  { ...PRODUCTS[12], qty: 1, discount: 0  },
  { ...PRODUCTS[14], qty: 1, discount: 2  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function BakeryPOSPage() {
  const [activeCat, setActiveCat]     = useState("all");
  const [search, setSearch]           = useState("");
  const [cart, setCart]               = useState<CartItem[]>(INITIAL_CART);
  const [payMethod, setPayMethod]     = useState("cash");
  const [viewMode, setViewMode]       = useState<"grid"|"list">("grid");
  const [addedId, setAddedId]         = useState<number|null>(null);
  const [time, setTime]               = useState(new Date());
  const [showHoldModal, setShowHoldModal] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = PRODUCTS.filter(p =>
    (activeCat === "all" || p.cat === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(p: typeof PRODUCTS[0]) {
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 500);
    setCart(prev => {
      const ex = prev.find(c => c.id === p.id);
      if (ex) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1, discount: 0 }];
    });
  }
  function updQty(id: number, d: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + d) } : c));
  }
  function remItem(id: number) { setCart(prev => prev.filter(c => c.id !== id)); }

  const lineTotal  = (i: CartItem) => i.price * i.qty * (1 - i.discount / 100);
  const subtotal   = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discAmt    = cart.reduce((s, c) => s + c.price * c.qty * (c.discount / 100), 0);
  const vatAmt     = (subtotal - discAmt) * 0.05;
  const grandTotal = subtotal - discAmt + vatAmt;

  const fmt    = (n: number) => `৳ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = time.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f0fdf4] select-none overflow-hidden"
         style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="flex-none h-[64px] bg-[#f0fdf4] flex items-center gap-4 px-5 z-30">

        {/* Logo — directly on background, no box */}
        <div className="flex items-center gap-2.5 flex-none">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-none"
               style={{ background: "linear-gradient(135deg, #166534, #16a34a)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"
                 strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-black text-green-900 leading-tight tracking-tight">Manufacturing &amp; Bakery</div>
            <div className="text-[9.5px] font-bold text-green-600 tracking-[0.1em] uppercase">POS System</div>
          </div>
        </div>

        {/* Search — white card box */}
        <div className="flex-1 relative max-w-[480px] mx-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product by name, barcode, category..."
            className="w-full h-[46px] rounded-2xl border border-slate-200 bg-white pl-10 pr-24 text-[12.5px] outline-none focus:border-green-400 transition-all placeholder:text-slate-400 shadow-sm"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">Ctrl</kbd>
            <kbd className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">K</kbd>
          </div>
        </div>

        {/* Stats — white card boxes */}
        <div className="flex items-center gap-2.5 flex-none ml-auto">
          {/* Today's Sales */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-[46px]"
               style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-none">
              <FileText size={13} className="text-green-600" />
            </div>
            <div>
              <div className="text-[9.5px] text-slate-400 font-semibold leading-none mb-0.5">Today&apos;s Sales</div>
              <div className="text-[12.5px] font-black text-green-800 leading-none">৳ 18,450.00</div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-[46px]"
               style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-none">
              <ShoppingBag size={13} className="text-blue-500" />
            </div>
            <div>
              <div className="text-[9.5px] text-slate-400 font-semibold leading-none mb-0.5">Total Orders</div>
              <div className="text-[12.5px] font-black text-slate-800 leading-none">24</div>
            </div>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-[46px]"
               style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-none">
              <Clock size={13} className="text-slate-500" />
            </div>
            <div>
              <div className="text-[12.5px] font-black text-slate-800 leading-none">{timeStr}</div>
              <div className="text-[9.5px] text-slate-400 font-medium leading-none mt-0.5">{dateStr}</div>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-[46px] cursor-pointer hover:border-green-300 transition-colors"
               style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-white text-[13px] font-black flex-none shadow-md">A</div>
            <div>
              <div className="text-[12.5px] font-bold text-slate-800 leading-none">Admin</div>
              <div className="text-[9.5px] text-slate-400 leading-none mt-0.5">Administrator</div>
            </div>
            <ChevronDown size={13} className="text-slate-400 ml-1" />
          </div>
        </div>
      </header>

      {/* ═══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 flex gap-3 px-4 pb-3 pt-1 overflow-hidden">

        {/* ── LEFT PANEL ────────────────────────────────────────────────────── */}
        <div className="w-[70%] min-w-0 flex flex-col bg-white/70 backdrop-blur-md rounded-3xl border border-green-200/80 overflow-hidden shadow-sm">

          {/* Category Bar */}
          <div className="flex-none flex items-center gap-2 px-4 pt-3.5 pb-2.5 overflow-x-auto border-b border-slate-100/80"
               style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map(c => {
              const active = activeCat === c.id;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className={`flex-1 min-w-[76px] flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2 h-[68px] transition-all duration-200 ${
                    active
                      ? "bg-emerald-700 border-emerald-700 text-white shadow-md shadow-emerald-700/20"
                      : "bg-white border-slate-100 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50 shadow-sm"
                  }`}>
                  {c.id === "all" ? (
                    <LayoutGrid size={22} className={active ? "text-white" : "text-emerald-600"} />
                  ) : (
                    <span className="text-xl leading-none">{c.emoji}</span>
                  )}
                  <span className={`text-[10px] font-bold text-center leading-tight whitespace-nowrap truncate max-w-full ${active ? "text-white" : "text-slate-700"}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
            <button className="flex-none sm:flex-1 min-w-[56px] flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-white text-emerald-600 hover:bg-slate-50 px-2 py-2 h-[68px] transition-colors shadow-sm">
              <MoreHorizontal size={20} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-slate-600">More</span>
            </button>
          </div>

          {/* Products Header */}
          <div className="flex-none flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-black text-slate-800">Products</h2>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
              <button className="flex items-center gap-1 bg-[#eef8f2] hover:bg-[#e2f3e8] border border-emerald-100 text-[#15803d] font-bold text-[11px] px-3 py-1 rounded-full transition-colors ml-1">
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 cursor-pointer hover:border-emerald-300 shadow-sm">
                <span>Sort by: <strong className="text-slate-800 font-bold ml-1">Popular</strong></span>
                <ChevronDown size={13} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-xl transition-all shadow-sm ${
                    viewMode === "grid" ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-400 hover:text-slate-700"
                  }`}>
                  <LayoutGrid size={15} />
                </button>
                <button onClick={() => setViewMode("list")}
                  className={`p-2 rounded-xl transition-all shadow-sm ${
                    viewMode === "list" ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-400 hover:text-slate-700"
                  }`}>
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3"
               style={{ scrollbarWidth: "thin", scrollbarColor: "#bbf7d0 transparent" }}>
            <div className={`${viewMode === "grid"
              ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5"
              : "flex flex-col gap-2"} pb-2`}>
              {filtered.map(p => {
                const isAdding = addedId === p.id;
                return (
                  <div key={p.id}
                    className={`bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer relative group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-100/60 hover:border-green-200 ${isAdding ? "scale-[1.03] border-green-400" : ""} ${viewMode === "list" ? "flex items-center gap-3 p-2.5" : ""}`}>

                    {/* Badge */}
                    {p.badge && (
                      <div className={`absolute top-2 left-2 z-10 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                        {p.badge}
                      </div>
                    )}

                    {/* Image Area */}
                    {viewMode === "grid" ? (
                      <div className="w-full h-[92px] bg-gradient-to-br from-green-50 to-emerald-50/30 flex items-center justify-center relative overflow-hidden">
                        <span className="text-[38px] leading-none transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">{p.emoji}</span>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center flex-none border border-green-100 text-xl">
                        {p.emoji}
                      </div>
                    )}

                    {/* Info */}
                    <div className={viewMode === "grid" ? "p-2" : "flex-1 min-w-0"}>
                      <h3 className={`font-bold text-slate-800 leading-tight truncate ${viewMode === "grid" ? "text-[11px]" : "text-[12px]"}`}>{p.name}</h3>
                      <p className="text-[9.5px] text-slate-400 font-medium mt-0.5">{p.unit}</p>

                      {viewMode === "grid" ? (
                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-50">
                          <div>
                            <div className="text-[12.5px] font-black text-emerald-700 leading-none">৳ {p.price.toFixed(2)}</div>
                            <div className="flex items-center gap-1 text-[8.5px] font-semibold text-emerald-600 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              Stock: {p.stock}
                            </div>
                          </div>
                          <button onClick={() => addToCart(p)}
                            title="Add to Cart"
                            className="w-7 h-7 rounded-full bg-emerald-700 hover:bg-emerald-800 active:scale-90 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-700/25 flex-none">
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[13px] font-black text-emerald-700">৳ {p.price.toFixed(2)}</span>
                          <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Stock: {p.stock}
                          </span>
                          <button onClick={() => addToCart(p)}
                            title="Add to Cart"
                            className="ml-auto w-7 h-7 rounded-full bg-emerald-700 hover:bg-emerald-800 active:scale-90 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-700/25 flex-none">
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
          <div className="flex-none flex items-center gap-2 px-4 py-2.5 bg-[#f4fbf6] border-t border-emerald-100/70 overflow-x-auto"
               style={{ scrollbarWidth: "none" }}>
            {ACTION_BTNS.map(btn => {
              const isFilled = btn.label === "New Sale" || btn.label === "Hold Bill";
              return (
                <button key={btn.label}
                  className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-2.5 py-1.5 bg-[#eef8f2] hover:bg-[#e2f3e8] border border-emerald-100/60 rounded-xl text-[11.5px] font-bold text-emerald-950 transition-all whitespace-nowrap shadow-sm">
                  {isFilled ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center flex-none">
                      <btn.Icon size={11} strokeWidth={2.5} />
                    </span>
                  ) : (
                    <btn.Icon size={15} className="text-emerald-700 flex-none" />
                  )}
                  {btn.label}
                </button>
              );
            })}
            <button className="flex-none px-3 py-1.5 bg-[#eef8f2] hover:bg-[#e2f3e8] border border-emerald-100/60 rounded-xl text-emerald-700 transition-colors flex items-center justify-center shadow-sm">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* ── LEFT PANEL FOOTER ───────────────────────────────────────────── */}
          <div className="flex-none p-2 bg-[#e8f7ee] border-t border-green-100 flex items-center gap-1.5 overflow-x-auto"
               style={{ scrollbarWidth: "none" }}>
            {FOOTER_BTNS.map(btn => (
              <button key={btn.label}
                className="flex-1 min-w-[98px] flex items-center gap-2 px-2.5 py-1.5 bg-[#d9f2e3] hover:bg-[#cbebd7] active:scale-[0.98] text-emerald-950 rounded-xl transition-all border border-emerald-200/40 whitespace-nowrap">
                <btn.Icon size={15} className="text-emerald-700 flex-none" />
                <div className="text-left leading-none">
                  <div className="text-[10.5px] font-bold text-emerald-950 mb-0.5">{btn.label}</div>
                  <div className="text-[9px] font-semibold text-emerald-700/85">({btn.key})</div>
                </div>
              </button>
            ))}

            {/* Online Status Pill */}
            <div className="flex-none flex items-center gap-2 px-3 py-1.5 bg-[#d9f2e3] rounded-xl border border-emerald-200/40 whitespace-nowrap ml-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-none" />
              <div className="text-left leading-none">
                <div className="text-[10.5px] font-bold text-emerald-950 mb-0.5">Online</div>
                <div className="text-[9px] font-semibold text-emerald-700/85">v1.0.0</div>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT CART PANEL ──────────────────────────────────────────────── */}
        <div className="w-[30%] min-w-[360px] flex-none flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">

          {/* Cart Header */}
          <div className="flex-none px-4 pt-3.5 pb-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center flex-none">
                <ShoppingCart size={16} className="text-green-700" />
              </div>
              <div>
                <div className="text-[13.5px] font-black text-slate-800 leading-tight">Current Sale</div>
                <div className="text-[10px] font-mono font-semibold text-slate-400">#POS-000124</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowHoldModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 text-[11px] font-bold rounded-lg hover:bg-green-100 transition-colors">
                <Pause size={11} /> Hold <span className="opacity-60">(F7)</span>
              </button>
              <button onClick={() => setCart([])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-lg hover:bg-red-100 transition-colors">
                <X size={11} /> Clear <span className="opacity-60">(F8)</span>
              </button>
            </div>
          </div>

          {/* Cart Table Head */}
          <div className="flex-none grid px-3 py-2 border-b border-slate-100 bg-slate-100/60"
               style={{ gridTemplateColumns: "1fr 80px 64px 60px 68px 20px" }}>
            {["Item","Qty","Price","Discount","Total",""].map((h, i) => (
              <div key={i} className={`text-[9.5px] font-bold text-slate-400 uppercase tracking-wide ${i >= 2 ? "text-right" : ""} ${i === 1 ? "text-center" : ""}`}>{h}</div>
            ))}
          </div>

          {/* Cart Items */}
          <div className="flex-1 min-h-0 overflow-y-auto"
               style={{ scrollbarWidth: "thin", scrollbarColor: "#bbf7d0 transparent" }}>
            {cart.map(item => {
              const total = lineTotal(item);
              return (
                <div key={item.id}
                  className="grid items-center px-3 py-2 hover:bg-slate-50/80 border-b border-slate-50 group transition-colors"
                  style={{ gridTemplateColumns: "1fr 80px 64px 60px 68px 20px" }}>
                  {/* Item */}
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 flex items-center justify-center flex-none text-[17px]">
                      {item.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-800 truncate leading-tight">{item.name}</div>
                      <div className="text-[9.5px] text-slate-400">{item.unit}</div>
                      <div className="text-[9px] text-emerald-600 font-semibold">Stock: {item.stock}</div>
                    </div>
                  </div>
                  {/* Qty */}
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => updQty(item.id, -1)}
                      className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center hover:bg-green-100 text-slate-600 transition-colors">
                      <Minus size={9} />
                    </button>
                    <span className="w-5 text-center text-[12px] font-bold text-slate-800">{item.qty}</span>
                    <button onClick={() => updQty(item.id, 1)}
                      className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center hover:bg-green-100 text-slate-600 transition-colors">
                      <Plus size={9} />
                    </button>
                  </div>
                  {/* Price */}
                  <div className="text-right text-[10.5px] font-semibold text-slate-600">৳ {item.price.toFixed(2)}</div>
                  {/* Discount */}
                  <div className="text-right">
                    {item.discount > 0
                      ? <span className="text-[9.5px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">{item.discount}%</span>
                      : <span className="text-[11px] text-slate-300">—</span>}
                  </div>
                  {/* Total */}
                  <div className="text-right text-[11.5px] font-black text-slate-800">৳ {total.toFixed(2)}</div>
                  {/* Remove */}
                  <button onClick={() => remItem(item.id)}
                    className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100">
                    <X size={11} />
                  </button>
                </div>
              );
            })}
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-slate-300">
                <ShoppingCart size={40} strokeWidth={1.5} />
                <p className="text-sm font-semibold mt-3">Cart is empty</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="flex-none border-t border-slate-100 px-4 pt-3 pb-2 bg-slate-50/30">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-700">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500 font-medium">Discount</span>
                <span className="font-bold text-red-500">- {fmt(discAmt)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500 font-medium">VAT (5%)</span>
                <span className="font-bold text-slate-700">{fmt(vatAmt)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-slate-200">
              <span className="text-[16px] font-black text-slate-800">Total</span>
              <span className="text-[22px] font-black text-green-700" style={{ letterSpacing: "-0.03em" }}>
                ৳ {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Customer Row */}
          <div className="flex-none px-4 py-2 flex items-center gap-2 border-t border-slate-100">
            <select className="flex-1 appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11.5px] font-semibold text-slate-600 outline-none cursor-pointer hover:border-green-300 transition-colors shadow-sm">
              <option>Walk-in Customer</option>
            </select>
            <button className="flex-none flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-green-700 hover:bg-green-50 transition-colors shadow-sm bg-white whitespace-nowrap">
              <Plus size={11} /> Add Customer
            </button>
          </div>

          {/* Payment Methods */}
          <div className="flex-none px-4 pb-2.5 grid grid-cols-3 gap-1.5">
            {PAYMENT_METHODS.map(pm => {
              const active = payMethod === pm.key;
              return (
                <button key={pm.key} onClick={() => setPayMethod(pm.key)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[10.5px] font-bold border transition-all ${
                    active
                      ? "bg-green-800 border-green-800 text-white shadow-md shadow-green-900/20"
                      : "bg-white border-slate-200 hover:border-green-300 hover:bg-green-50 text-slate-700"
                  }`}>
                  <pm.Icon size={12} className={active ? "text-white" : pm.color} />
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── RIGHT PANEL FOOTER (PROCESS SALE) ──────────────────────────── */}
          <div className="flex-none p-3.5 bg-slate-50/80 border-t border-slate-100">
            <button className="w-full flex items-center justify-between text-white rounded-2xl px-5 py-3.5 transition-all active:scale-[0.99]"
                    style={{ background: "linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)", boxShadow: "0 6px 24px rgba(22,101,52,0.35), 0 2px 8px rgba(22,101,52,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Printer size={14} />
                </div>
                <div className="text-left">
                  <div className="text-[14px] font-black leading-tight">Process Sale</div>
                  <div className="text-[9.5px] font-semibold opacity-70">(F9)</div>
                </div>
              </div>
              <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </div>

      {/* ═══ HOLD MODAL ══════════════════════════════════════════════════════ */}
      <CustomModal open={showHoldModal} onClose={() => setShowHoldModal(false)} title="Hold Current Sale" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Add a note to identify this held sale later.</p>
          <CustomInput label="Hold Note" placeholder="e.g. Table 3 order..." />
          <div className="flex gap-2 pt-2">
            <CustomButton variant="outline" fullWidth onClick={() => setShowHoldModal(false)}>Cancel</CustomButton>
            <CustomButton themeColor="emerald" fullWidth onClick={() => setShowHoldModal(false)}>Hold Sale</CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

