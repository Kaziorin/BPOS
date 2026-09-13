"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── ICONS ────────────────────────────────────────────────────────────────────
function Icon({ d, size = 16, className = "", strokeWidth = 1.8 }: { d: string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}
const SearchIcon = () => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />;
const UserIcon = () => <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />;
const GridIcon = () => <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" size={14} />;
const ListIcon = () => <Icon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" size={14} />;
const PlusIcon = ({ size = 14 }: { size?: number }) => <Icon d="M12 5v14M5 12h14" size={size} />;
const MinusIcon = ({ size = 14 }: { size?: number }) => <Icon d="M5 12h14" size={size} />;
const CloseIcon = () => <Icon d="M18 6L6 18M6 6l12 12" size={12} />;
const ChevronDownIcon = () => <Icon d="M6 9l6 6 6-6" size={14} />;
const ChevronRightIcon = () => <Icon d="M9 18l6-6-6-6" size={16} />;
const MoreIcon = () => <Icon d="M5 12h.01M12 12h.01M19 12h.01" size={18} strokeWidth={2.5} />;
const CartIcon = () => <Icon d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" size={16} />;
const PauseIcon = () => <Icon d="M6 4h4v16H6zM14 4h4v16h-4" size={14} />;
const PrinterIcon = () => <Icon d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" size={14} />;
const DollarIcon = () => <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" size={14} />;
const CreditCardIcon = () => <Icon d="M1 4h22v16H1zM1 10h22" size={14} />;
const PhoneIcon = () => <Icon d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.27 1.22 2 2 0 012.24.04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.93" size={14} />;
const FileTextIcon = () => <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" size={14} />;
const ReceiptIcon = () => <Icon d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM16 8H8M16 12H8M12 16H8" size={14} />;
const WarehouseIcon = () => <Icon d="M22 20V8.01a2 2 0 00-.78-1.57l-8-6a2 2 0 00-2.44 0l-8 6A2 2 0 002 8v12M6 20v-6h12v6M2 20h20" size={14} />;
const BarChartIcon = () => <Icon d="M12 20V10M18 20V4M6 20v-4" size={14} />;
const TruckIcon = () => <Icon d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" size={14} />;
const CommissionIcon = () => <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" size={14} />;
const ClockIcon = () => <Icon d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" size={14} />;

// ─── DATA ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All Products", emoji: "🧱" },
  { id: "bread", label: "Bread & Bakery", emoji: "🍞" },
  { id: "cake", label: "Cake & Pastry", emoji: "🎂" },
  { id: "cookies", label: "Cookies & Biscuits", emoji: "🍪" },
  { id: "snacks", label: "Snacks", emoji: "🍿" },
  { id: "flour", label: "Flour & Raw Material", emoji: "🌾" },
  { id: "beverage", label: "Beverages", emoji: "☕" },
  { id: "dairy", label: "Dairy & Egg", emoji: "🥚" },
  { id: "packaging", label: "Packaging", emoji: "📦" },
];

const ACTION_BTNS = [
  { label: "Add Customer", icon: UserIcon, color: "text-teal-600" },
  { label: "New Sale", icon: PlusIcon, color: "text-green-600" },
  { label: "Sales Order", icon: FileTextIcon, color: "text-green-600" },
  { label: "Quotation", icon: ReceiptIcon, color: "text-green-600" },
  { label: "Credit Sale", icon: CreditCardIcon, color: "text-green-600" },
  { label: "Hold Bill", icon: PauseIcon, color: "text-green-600" },
  { label: "Warehouse", icon: WarehouseIcon, color: "text-green-600" },
  { label: "Reports", icon: BarChartIcon, color: "text-green-600" },
];

const FOOTER_BTNS = [
  { label: "Quick Sale", key: "F9", icon: CartIcon },
  { label: "Sales Order", key: "F5", icon: FileTextIcon },
  { label: "Quotation", key: "F6", icon: ReceiptIcon },
  { label: "Customer", key: "F2", icon: UserIcon },
  { label: "Warehouse", key: "F3", icon: WarehouseIcon },
  { label: "Credit", key: "F4", icon: CreditCardIcon },
  { label: "Commission", key: "F8", icon: CommissionIcon },
  { label: "Delivery", key: "F10", icon: TruckIcon },
];

const PRODUCTS = [
  { id: 1, name: "White Bread", unit: "500g", price: 45, stock: 120, cat: "bread", badge: "Popular", badgeStyle: "bg-emerald-100 text-emerald-700", emoji: "🍞" },
  { id: 2, name: "Whole Wheat Bread", unit: "500g", price: 55, stock: 85, cat: "bread", badge: "Healthy", badgeStyle: "bg-sky-100 text-sky-700", emoji: "🍞" },
  { id: 3, name: "Burger Bun", unit: "1 pcs", price: 18, stock: 200, cat: "bread", badge: "Best Seller", badgeStyle: "bg-orange-100 text-orange-700", emoji: "🥐" },
  { id: 4, name: "Cake (Vanilla)", unit: "1 kg", price: 350, stock: 40, cat: "cake", badge: "New", badgeStyle: "bg-red-100 text-red-600", emoji: "🎂" },
  { id: 5, name: "Chocolate Cake", unit: "1 kg", price: 420, stock: 25, cat: "cake", badge: "", badgeStyle: "", emoji: "🍫" },
  { id: 6, name: "Croissant", unit: "1 pcs", price: 60, stock: 40, cat: "bread", badge: "", badgeStyle: "", emoji: "🥐" },
  { id: 7, name: "Danish Pastry", unit: "1 pcs", price: 55, stock: 45, cat: "cake", badge: "", badgeStyle: "", emoji: "🥐" },
  { id: 8, name: "Cookies (Chocolate Chip)", unit: "250g", price: 120, stock: 70, cat: "cookies", badge: "", badgeStyle: "", emoji: "🍪" },
  { id: 9, name: "Biscuits (Butter)", unit: "300g", price: 80, stock: 90, cat: "cookies", badge: "", badgeStyle: "", emoji: "🍪" },
  { id: 10, name: "Muffin", unit: "1 pcs", price: 40, stock: 55, cat: "cake", badge: "", badgeStyle: "", emoji: "🧁" },
  { id: 11, name: "Flour (All Purpose)", unit: "1 kg", price: 65, stock: 150, cat: "flour", badge: "", badgeStyle: "", emoji: "🌾" },
  { id: 12, name: "Yeast", unit: "500g", price: 160, stock: 35, cat: "flour", badge: "", badgeStyle: "", emoji: "🫙" },
  { id: 13, name: "Butter", unit: "200g", price: 190, stock: 50, cat: "dairy", badge: "", badgeStyle: "", emoji: "🧈" },
  { id: 14, name: "Milk Powder", unit: "500g", price: 320, stock: 50, cat: "dairy", badge: "", badgeStyle: "", emoji: "🥛" },
  { id: 15, name: "Cooking Oil", unit: "1 ltr", price: 180, stock: 60, cat: "flour", badge: "", badgeStyle: "", emoji: "🫙" },
  { id: 16, name: "Sugar", unit: "1 kg", price: 70, stock: 120, cat: "flour", badge: "", badgeStyle: "", emoji: "🍚" },
  { id: 17, name: "Salt", unit: "1 kg", price: 25, stock: 200, cat: "flour", badge: "", badgeStyle: "", emoji: "🧂" },
  { id: 18, name: "Instant Noodles", unit: "Pack (5 pcs)", price: 95, stock: 75, cat: "snacks", badge: "", badgeStyle: "", emoji: "🍜" },
];

type CartItem = {
  id: number; name: string; unit: string; price: number; stock: number;
  cat: string; badge: string; badgeStyle: string; emoji: string;
  qty: number; discount: number;
};

const INITIAL_CART: CartItem[] = [
  { ...PRODUCTS[0], qty: 2, discount: 5 },
  { ...PRODUCTS[2], qty: 5, discount: 0 },
  { ...PRODUCTS[3], qty: 1, discount: 10 },
  { ...PRODUCTS[4], qty: 1, discount: 0 },
  { ...PRODUCTS[7], qty: 2, discount: 5 },
  { ...PRODUCTS[12], qty: 1, discount: 0 },
  { ...PRODUCTS[14], qty: 1, discount: 2 },
];

const PAYMENT_METHODS = ["Cash", "Card", "Mobile Banking", "Credit", "Due", "Other"];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function BakeryPOSPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [payMethod, setPayMethod] = useState("Cash");
  const [addedId, setAddedId] = useState<number | null>(null);
  const [time, setTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredProducts = PRODUCTS.filter(p => {
    const matchCat = activeCategory === "all" || p.cat === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function addToCart(p: typeof PRODUCTS[0]) {
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 600);
    setCart(prev => {
      const exist = prev.find(c => c.id === p.id);
      if (exist) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1, discount: 0 }];
    });
  }

  function updateQty(id: number, delta: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  }

  function removeItem(id: number) {
    setCart(prev => prev.filter(c => c.id !== id));
  }

  const lineTotal = (item: CartItem) => item.price * item.qty * (1 - item.discount / 100);
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt = cart.reduce((s, c) => s + c.price * c.qty * (c.discount / 100), 0);
  const vatAmt = (subtotal - discountAmt) * 0.05;
  const grandTotal = subtotal - discountAmt + vatAmt;

  const fmt = (n: number) => `৳ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = time.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .bpos-pos * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .bpos-pos { height: 100vh; width: 100%; overflow: hidden; }

        /* Scrollbar */
        .slim-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .slim-scroll::-webkit-scrollbar-track { background: transparent; }
        .slim-scroll::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 10px; }
        .slim-scroll::-webkit-scrollbar-thumb:hover { background: #6ee7b7; }
        .no-scroll::-webkit-scrollbar { display: none; }
        .no-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        /* 3D Card */
        .card-3d {
          transform-style: preserve-3d;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-3d:hover {
          transform: translateY(-3px) rotateX(2deg);
          box-shadow: 0 12px 30px -5px rgba(16,185,129,0.18), 0 4px 10px -3px rgba(0,0,0,0.06);
        }

        /* Ripple Button */
        .ripple-btn { position: relative; overflow: hidden; }
        .ripple-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: white;
          opacity: 0;
          border-radius: inherit;
          transition: opacity 0.3s;
        }
        .ripple-btn:active::after { opacity: 0.15; }

        /* Add animation */
        @keyframes pop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        .pop-anim { animation: pop 0.3s ease; }

        /* Slide in */
        @keyframes slideInRight { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
        .slide-in { animation: slideInRight 0.25s ease; }

        /* Shimmer badge */
        @keyframes shimmer { 0%{background-position:-200px 0} 100%{background-position:200px 0} }

        /* Category active glow */
        .cat-active { box-shadow: 0 4px 20px rgba(22,101,52,0.35), inset 0 1px 0 rgba(255,255,255,0.15); }

        /* Process button glow */
        .process-btn {
          background: linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%);
          box-shadow: 0 6px 24px rgba(22,101,52,0.4), 0 2px 8px rgba(22,101,52,0.25);
          transition: all 0.25s ease;
        }
        .process-btn:hover {
          background: linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%);
          box-shadow: 0 10px 32px rgba(22,101,52,0.5), 0 4px 12px rgba(22,101,52,0.3);
          transform: translateY(-1px);
        }
        .process-btn:active { transform: scale(0.99); }

        /* Payment btn selected */
        .pay-selected {
          background: linear-gradient(135deg, #166534, #15803d) !important;
          color: white !important;
          box-shadow: 0 3px 12px rgba(22,101,52,0.4);
        }

        /* Header shadow */
        .header-shadow { box-shadow: 0 1px 0 #e5f3ec, 0 4px 20px rgba(0,0,0,0.04); }

        /* Product emoji bounce */
        .product-img { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .card-3d:hover .product-img { transform: scale(1.12) rotate(-3deg); }
      `}</style>

      <div className="bpos-pos bg-[#f0fdf4] flex flex-col -m-4 sm:-m-6 select-none">

        {/* ═══ HEADER ════════════════════════════════════════════════════════ */}
        <header className="flex-none bg-white header-shadow px-4 h-[56px] flex items-center justify-between gap-4 z-30 relative">
          {/* Logo */}
          <div className="flex items-center gap-3 w-[220px] flex-none">
            <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center shadow-md shadow-green-200/70 flex-none" style={{background:"linear-gradient(135deg,#166534,#16a34a)"}}>
              <span className="text-[18px]">🏭</span>
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-black text-green-900 tracking-tight">Manufacturing & Bakery</div>
              <div className="text-[9px] font-bold text-green-600 tracking-[0.15em] uppercase">POS SYSTEM</div>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-[440px] relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product by name, barcode, category..."
              className="w-full h-9 bg-slate-50 border border-slate-200 rounded-full pl-9 pr-20 text-[12.5px] outline-none focus:border-green-400 focus:bg-white transition-all placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-px rounded">Ctrl</span>
              <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-px rounded">K</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 flex-none">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center flex-none">
                <span className="text-[16px]">💰</span>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium leading-none mb-0.5">Today's Sales</div>
                <div className="text-[13px] font-black text-green-800 leading-none">৳ 18,450.00</div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-100"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-none">
                <span className="text-[16px]">📋</span>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium leading-none mb-0.5">Total Orders</div>
                <div className="text-[13px] font-black text-slate-800 leading-none">24</div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-100"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-none">
                <ClockIcon />
              </div>
              <div>
                <div className="text-[13px] font-black text-slate-800 leading-none">{timeStr}</div>
                <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{dateStr}</div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-100"></div>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-green-800 flex items-center justify-center text-white text-[14px] font-black shadow-md shadow-green-200 flex-none">A</div>
              <div>
                <div className="text-[13px] font-bold text-slate-800 leading-none">Admin</div>
                <div className="text-[10px] text-slate-400 leading-none mt-0.5">Administrator</div>
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        {/* ═══ MAIN BODY ═════════════════════════════════════════════════════ */}
        <div className="flex-1 min-h-0 flex gap-0 overflow-hidden">

          {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-4 pt-3 pb-[56px]">

            {/* Category Bar */}
            <div className="flex-none flex items-center gap-2 overflow-x-auto no-scroll pb-2">
              {CATEGORIES.map(c => {
                const isActive = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`flex-none flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-200 px-3 py-2 min-w-[88px] h-[64px] ripple-btn ${
                      isActive
                        ? "cat-active bg-green-800 border-green-800 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    <span className="text-[18px] leading-none">{c.emoji}</span>
                    <span className={`text-[10px] font-bold text-center leading-tight ${isActive ? "text-white" : "text-slate-700"}`}>{c.label}</span>
                  </button>
                );
              })}
              <button className="flex-none flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 px-3 py-2 min-w-[64px] h-[64px] transition-colors">
                <MoreIcon />
                <span className="text-[10px] font-bold text-slate-600">More</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex-none flex items-center gap-2 overflow-x-auto no-scroll py-2.5 border-b border-green-100/80">
              {ACTION_BTNS.map(btn => (
                <button
                  key={btn.label}
                  className="flex-none flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 hover:border-green-400 hover:bg-green-50 transition-all shadow-sm ripple-btn whitespace-nowrap"
                >
                  <span className={btn.color}><btn.icon /></span>
                  {btn.label}
                </button>
              ))}
              <button className="flex-none w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
                <MoreIcon />
              </button>
            </div>

            {/* Products Header */}
            <div className="flex-none flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[18px] font-black text-slate-800">Products</h2>
                <span className="text-[12px] font-semibold text-slate-500">({filteredProducts.length})</span>
                <button className="flex items-center gap-1 text-[12px] font-semibold text-green-700 hover:text-green-900 transition-colors ml-2">
                  View All <ChevronRightIcon />
                </button>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm cursor-pointer hover:border-green-300">
                  Sort by: <span className="text-slate-800 font-bold ml-1">Popular</span>
                  <span className="ml-1 text-slate-400"><ChevronDownIcon /></span>
                </div>
                <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors ${viewMode === "grid" ? "bg-green-800 text-white" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <GridIcon />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${viewMode === "list" ? "bg-green-800 text-white" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <ListIcon />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto slim-scroll">
              <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 pb-4">
                {filteredProducts.map(p => {
                  const isAdding = addedId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`card-3d bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer relative group ${isAdding ? "pop-anim" : ""}`}
                    >
                      {p.badge && (
                        <div className={`absolute top-2 left-2 z-10 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${p.badgeStyle}`}>
                          {p.badge}
                        </div>
                      )}

                      {/* Product Image Area */}
                      <div className="w-full aspect-square bg-gradient-to-br from-slate-50 to-green-50/30 flex items-center justify-center relative overflow-hidden">
                        <div className="product-img text-[52px] leading-none">{p.emoji}</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>

                      <div className="p-2.5">
                        <h3 className="text-[11.5px] font-bold text-slate-800 leading-tight line-clamp-1">{p.name}</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{p.unit}</p>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div>
                            <div className="text-[14px] font-black text-green-700">৳ {p.price.toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="flex items-center gap-1 text-[9.5px] font-semibold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            Stock: {p.stock}
                          </span>
                          <button
                            onClick={() => addToCart(p)}
                            className="ripple-btn flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-sm shadow-green-200/80 active:scale-95"
                          >
                            <PlusIcon size={10} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT CART PANEL ───────────────────────────────────────────── */}
          <div className="w-[400px] flex-none flex flex-col bg-white border-l border-slate-100 overflow-hidden" style={{boxShadow:"-4px 0 24px rgba(0,0,0,0.04)"}}>

            {/* Cart Header */}
            <div className="flex-none px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
                  <CartIcon />
                </div>
                <div>
                  <div className="text-[13.5px] font-black text-slate-800 leading-tight">Current Sale</div>
                  <div className="text-[10px] font-mono font-semibold text-slate-400">#POS-000124</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 text-[11px] font-bold rounded-lg hover:bg-green-100 transition-colors ripple-btn">
                  <PauseIcon /> Hold <span className="opacity-60">(F7)</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-lg hover:bg-red-100 transition-colors ripple-btn">
                  <CloseIcon /> Clear <span className="opacity-60">(F8)</span>
                </button>
              </div>
            </div>

            {/* Cart Table Head */}
            <div className="flex-none grid px-4 py-2 border-b border-slate-100 bg-slate-50/60" style={{gridTemplateColumns:"1fr 90px 70px 60px 70px 24px"}}>
              {["Item","Qty","Price","Discount","Total",""].map((h,i) => (
                <div key={i} className={`text-[10px] font-bold text-slate-400 uppercase tracking-wide ${i > 1 ? "text-right" : ""} ${i === 0 ? "" : i === 1 ? "text-center" : ""}`}>{h}</div>
              ))}
            </div>

            {/* Cart Items */}
            <div className="flex-1 min-h-0 overflow-y-auto slim-scroll py-1">
              {cart.map(item => {
                const total = lineTotal(item);
                const discAmt = item.price * item.qty * (item.discount / 100);
                return (
                  <div
                    key={item.id}
                    className="slide-in grid items-center px-3 py-2 hover:bg-slate-50/80 transition-colors border-b border-slate-50 group"
                    style={{gridTemplateColumns:"1fr 90px 70px 60px 70px 24px"}}
                  >
                    {/* Item */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 flex items-center justify-center flex-none text-[18px]">
                        {item.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-bold text-slate-800 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400">({item.unit})</div>
                        <div className="text-[9.5px] text-emerald-600 font-semibold">Stock: {item.stock}</div>
                      </div>
                    </div>

                    {/* Qty */}
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center hover:bg-green-100 transition-colors">
                        <MinusIcon size={10} />
                      </button>
                      <span className="w-6 text-center text-[12px] font-bold text-slate-800">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center hover:bg-green-100 transition-colors">
                        <PlusIcon size={10} />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right text-[11px] font-semibold text-slate-600">
                      ৳ {item.price.toFixed(2)}
                    </div>

                    {/* Discount */}
                    <div className="text-right">
                      {item.discount > 0 ? (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">{item.discount}%</span>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </div>

                    {/* Total */}
                    <div className="text-right text-[12px] font-black text-slate-800">
                      ৳ {total.toFixed(2)}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                );
              })}
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                  <span className="text-5xl mb-3">🛒</span>
                  <p className="text-sm font-semibold">Cart is empty</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="flex-none border-t border-slate-100 px-4 pt-3 pb-2 space-y-1.5 bg-white">
              <div className="flex justify-between text-[12.5px]">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-700">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[12.5px]">
                <span className="text-slate-500 font-medium">Discount</span>
                <span className="font-bold text-red-500">- {fmt(discountAmt)}</span>
              </div>
              <div className="flex justify-between text-[12.5px]">
                <span className="text-slate-500 font-medium">VAT (5%)</span>
                <span className="font-bold text-slate-700">{fmt(vatAmt)}</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-dashed border-slate-200 mt-1">
                <span className="text-[17px] font-black text-slate-800">Total</span>
                <span className="text-[22px] font-black text-green-700" style={{letterSpacing:"-0.02em"}}>
                  ৳ {grandTotal.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>

            {/* Customer Row */}
            <div className="flex-none px-4 py-2 flex items-center gap-2 border-t border-slate-100">
              <button className="flex-1 flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-600 hover:border-green-300 shadow-sm transition-colors">
                <span className="flex items-center gap-2"><UserIcon /> Walk-in Customer</span>
                <ChevronDownIcon />
              </button>
              <button className="flex-none flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-green-700 hover:bg-green-50 transition-colors shadow-sm bg-white">
                <PlusIcon size={12} /> Add Customer
              </button>
            </div>

            {/* Payment Methods */}
            <div className="flex-none px-4 pb-3 grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(pm => {
                const isActive = payMethod === pm;
                const icons: Record<string, JSX.Element> = {
                  "Cash": <DollarIcon />,
                  "Card": <CreditCardIcon />,
                  "Mobile Banking": <PhoneIcon />,
                  "Credit": <ReceiptIcon />,
                  "Due": <ClockIcon />,
                  "Other": <MoreIcon />,
                };
                const colors: Record<string, string> = {
                  "Credit": "text-purple-500",
                  "Due": "text-orange-500",
                  "Mobile Banking": "text-teal-500",
                  "Card": "text-blue-500",
                };
                return (
                  <button
                    key={pm}
                    onClick={() => setPayMethod(pm)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold border transition-all ripple-btn ${
                      isActive
                        ? "pay-selected border-transparent"
                        : `bg-white border-slate-200 hover:border-green-300 hover:bg-green-50 ${colors[pm] || "text-slate-600"}`
                    }`}
                  >
                    <span className={isActive ? "text-white" : (colors[pm] || "text-slate-500")}>{icons[pm]}</span>
                    <span className={isActive ? "text-white" : "text-slate-700"}>{pm}</span>
                  </button>
                );
              })}
            </div>

            {/* Process Sale Button */}
            <div className="flex-none px-4 pb-4">
              <button className="process-btn w-full flex items-center justify-between text-white rounded-xl px-5 py-4 ripple-btn">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <PrinterIcon />
                  </div>
                  <div className="text-left">
                    <div className="text-[14px] font-black leading-tight">Process Sale</div>
                    <div className="text-[10px] font-semibold opacity-70">(F9)</div>
                  </div>
                </div>
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
        <footer className="fixed bottom-0 left-0 right-0 h-[56px] bg-white border-t border-slate-200 flex items-center justify-between px-4 z-40" style={{boxShadow:"0 -1px 0 #e5f3ec, 0 -4px 16px rgba(0,0,0,0.04)"}}>
          <div className="flex items-center gap-1 overflow-x-auto no-scroll">
            {FOOTER_BTNS.map(btn => (
              <button
                key={btn.label}
                className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-green-800 hover:bg-green-50 transition-all text-[11px] font-semibold"
              >
                <span className="text-green-600"><btn.icon /></span>
                <span>{btn.label}</span>
                <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-px rounded font-bold">{btn.key}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-none">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-500">Online</span>
            <span className="text-[10px] text-slate-400">v1.0.0</span>
          </div>
        </footer>
      </div>
    </>
  );
}
