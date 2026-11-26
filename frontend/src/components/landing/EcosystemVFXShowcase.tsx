"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Barcode,
  Bluetooth,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Flame,
  IceCream,
  Layers,
  Monitor,
  PauseCircle,
  Pill,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Truck,
  Tv,
  UtensilsCrossed,
  Wifi,
  WifiOff,
  Wine,
  type LucideIcon,
} from "lucide-react";

const POS_MARQUEE_FEATURES: { icon: LucideIcon; label: string; tone: string }[] = [
  { icon: Barcode, label: "1D / 2D Barcode & Scale Scanning", tone: "text-sky-600" },
  { icon: WifiOff, label: "Offline IndexedDB Queue & Auto Sync", tone: "text-emerald-600" },
  { icon: Printer, label: "80mm / 58mm ESC/POS Thermal Receipt", tone: "text-cyan-600" },
  { icon: CreditCard, label: "Split Cash • Card • bKash • Nagad", tone: "text-pink-600" },
  { icon: PauseCircle, label: "Multi-Cart Hold & Recall (F8)", tone: "text-amber-600" },
  { icon: ChefHat, label: "Instant Kitchen KOT & Station Routing", tone: "text-orange-600" },
  { icon: Monitor, label: "Dual Customer Display + Dynamic QR", tone: "text-sky-600" },
  { icon: ShieldCheck, label: "RBAC Permissions & NBR Mushak 6.3", tone: "text-violet-600" },
];

const POS_SPOTLIGHT_FEATURES = [
  {
    icon: WifiOff,
    title: "Zero-Downtime Offline POS",
    desc: "Keep scanning barcodes, holding carts, and printing receipts even if store Wi-Fi drops. Every sale syncs automatically on reconnect.",
    badge: "IndexedDB Engine",
    gradient: "from-sky-50/90 via-white to-white",
    border: "border-sky-200/80",
    iconBg: "bg-sky-100 text-sky-700",
  },
  {
    icon: CreditCard,
    title: "Split Tender & MFS Checkout",
    desc: "Accept Cash, Visa/MasterCard, bKash, Nagad, or partial customer credit in a single checkout flow with automatic change calculation.",
    badge: "Omni-Payment",
    gradient: "from-cyan-50/90 via-white to-white",
    border: "border-cyan-200/80",
    iconBg: "bg-cyan-100 text-cyan-700",
  },
  {
    icon: Receipt,
    title: "Auto Double-Entry Accounting",
    desc: "Every POS invoice, COGS deduction, VAT tax, and supplier GRN posts balanced debit/credit journals in real time — zero manual tally.",
    badge: "Real-Time ERP",
    gradient: "from-blue-50/90 via-white to-white",
    border: "border-blue-200/80",
    iconBg: "bg-blue-100 text-blue-700",
  },
  {
    icon: Layers,
    title: "Keyboard Shortcuts & Rapid Billing",
    desc: "Power through rush hours with customizable F-key shortcuts (F2 Search, F8 Hold, F10 Settle) and instant customer lookup.",
    badge: "Speed First",
    gradient: "from-indigo-50/90 via-white to-white",
    border: "border-indigo-200/80",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
];

type SyncStage = 0 | 1 | 2;

const SYNC_STAGES: {
  id: SyncStage;
  kotStatus: "QUEUED" | "PREPARING" | "READY";
  kotProgress: number;
  customerTitle: string;
  customerSubtitle: string;
  paid: boolean;
}[] = [
  {
    id: 0,
    kotStatus: "QUEUED",
    kotProgress: 30,
    customerTitle: "Scanning Items at Counter #01",
    customerSubtitle: "Scan QR to pay via bKash / Nagad",
    paid: false,
  },
  {
    id: 1,
    kotStatus: "PREPARING",
    kotProgress: 70,
    customerTitle: "Preparing in Kitchen & Grill",
    customerSubtitle: "Chef Station Active • Live ETA 06m",
    paid: false,
  },
  {
    id: 2,
    kotStatus: "READY",
    kotProgress: 100,
    customerTitle: "Order Ready! Payment Confirmed",
    customerSubtitle: "Thank you for choosing SalePay",
    paid: true,
  },
];

const CUSTOMER_LINES = [
  { name: "Smoked Chicken Platter", qty: "2×", price: "৳2,140", emoji: "🍗" },
  { name: "Beef Tehari Royal", qty: "1×", price: "৳550", emoji: "🍛" },
  { name: "Iced Caramel Latte", qty: "2×", price: "৳680", emoji: "🥤" },
];

interface MobilePosSpec {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  gradient: string;
  icon: LucideIcon;
  categories: string[];
  items: { name: string; stock: string; price: string }[];
  cartCount: string;
  cartTotal: string;
}

// STRICTLY ONLY the 5 Mobile POS Screens built in mobile-app-pos
const MOBILE_POS_SCREENS: MobilePosSpec[] = [
  {
    id: "mobile-retail-pos",
    title: "Retail Mobile POS",
    subtitle: "Barcode Cart & Instant Drawer",
    accent: "#0ea5e9",
    gradient: "from-[#0284c7] to-[#38bdf8]",
    icon: ShoppingBag,
    categories: ["All", "Apparel", "Shoes", "Bags"],
    items: [
      { name: "Slim Denim Jacket", stock: "28 left", price: "৳2,490" },
      { name: "Oxford Cotton Shirt", stock: "64 left", price: "৳1,850" },
      { name: "Leather Crossbody", stock: "14 left", price: "৳3,200" },
    ],
    cartCount: "3 Items",
    cartTotal: "৳6,830",
  },
  {
    id: "mobile-restaurant-pos",
    title: "Restaurant Mobile POS",
    subtitle: "Table Orders & KOT Fire",
    accent: "#f97316",
    gradient: "from-[#ea580c] to-[#fb923c]",
    icon: UtensilsCrossed,
    categories: ["Dine-In", "Grill", "Biryani", "Drinks"],
    items: [
      { name: "Smoked Chicken Platter", stock: "Table T-04", price: "৳1,070" },
      { name: "Beef Tehari Royal", stock: "Kitchen", price: "৳550" },
      { name: "Iced Caramel Latte", stock: "Barista", price: "৳340" },
    ],
    cartCount: "Table T-04",
    cartTotal: "৳3,538",
  },
  {
    id: "mobile-pharmacy-pos",
    title: "Pharmacy Mobile POS",
    subtitle: "FEFO Batch & Rx Checkout",
    accent: "#06b6d4",
    gradient: "from-[#0891b2] to-[#22d3ee]",
    icon: Pill,
    categories: ["Tablets", "Capsules", "Syrup", "Devices"],
    items: [
      { name: "Napa Extend 665mg", stock: "Exp 09/27", price: "৳24" },
      { name: "Sergel 20mg Strip", stock: "Exp 11/26", price: "৳70" },
      { name: "Monas 10mg Strip", stock: "Exp 05/27", price: "৳175" },
    ],
    cartCount: "Rx #408",
    cartTotal: "৳387",
  },
  {
    id: "mobile-grocery-pos",
    title: "Grocery Mobile POS",
    subtitle: "Produce Scale & Quick Cart",
    accent: "#10b981",
    gradient: "from-[#059669] to-[#34d399]",
    icon: ShoppingCart,
    categories: ["Produce", "Staples", "Dairy", "Oil"],
    items: [
      { name: "Miniket Rice 5kg", stock: "EAN-8901", price: "৳430" },
      { name: "Alphonso Mango", stock: "2.45 kg", price: "৳441" },
      { name: "Olive Oil 1L Bottle", stock: "32 left", price: "৳1,450" },
    ],
    cartCount: "4 Items",
    cartTotal: "৳2,751",
  },
  {
    id: "mobile-wholesaler-pos",
    title: "Wholesaler Mobile POS",
    subtitle: "Carton Tiers & B2B Invoice",
    accent: "#2563eb",
    gradient: "from-[#1d4ed8] to-[#3b82f6]",
    icon: Truck,
    categories: ["Cartons", "50kg Sack", "Cases", "Tier A"],
    items: [
      { name: "Sunflower Oil Carton", stock: "25 Ctns", price: "৳72,000" },
      { name: "Basmati Rice 50kg", stock: "12 Sacks", price: "৳77,400" },
      { name: "Water Case 24×500ml", stock: "20 Cases", price: "৳7,200" },
    ],
    cartCount: "Dealer B2B",
    cartTotal: "৳1,56,600",
  },
];

const MOBILE_POS_FEATURES = [
  {
    icon: Bluetooth,
    title: "Bluetooth 80mm / 58mm Print",
    desc: "Pair any portable thermal printer for instant on-the-spot receipts.",
  },
  {
    icon: WifiOff,
    title: "Pocket Offline Queue",
    desc: "Continue billing inside basements or busy markets with auto cloud sync.",
  },
  {
    icon: Barcode,
    title: "Camera & USB Barcode Scan",
    desc: "Rapid product scan and search directly from phone or tablet.",
  },
  {
    icon: Receipt,
    title: "Live Sales History & EN / বাংলা",
    desc: "Switch UI between English & বাংলা and reprint live receipts anytime.",
  },
];

function MobilePhoneFrame({
  screen,
  variant,
}: {
  screen: MobilePosSpec;
  variant: "center" | "side";
}) {
  const Icon = screen.icon;
  const isCenter = variant === "center";

  return (
    <div
      className={`rounded-[2.4rem] border-[6px] bg-white overflow-hidden transition-all ${
        isCenter
          ? "w-[290px] sm:w-[320px] border-slate-800 shadow-[0_32px_70px_-14px_rgba(2,132,199,0.32)]"
          : "w-[240px] border-slate-300 opacity-75 scale-90 shadow-lg"
      }`}
    >
      {/* Notch */}
      <div className="px-5 pt-2.5 pb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-600 bg-white">
        <span>9:41</span>
        <span className="h-3.5 w-16 rounded-full bg-slate-900" />
        <span className="text-emerald-600 flex items-center gap-1">
          <Wifi size={9} /> 5G
        </span>
      </div>

      {/* POS Header inside Mobile Screen */}
      <div className={`bg-gradient-to-r ${screen.gradient} px-4 py-3 text-white`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shrink-0">
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black truncate">{screen.title}</p>
            <p className="text-[10px] text-white/90 truncate">{screen.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Light Authentic Mobile POS Catalog + Cart */}
      <div className="p-3.5 space-y-3 bg-[#f4f8ff] text-slate-800">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {screen.categories.map((cat, idx) => (
            <span
              key={cat}
              className={`rounded-md px-2 py-1 text-[9px] font-bold whitespace-nowrap ${
                idx === 0
                  ? `bg-gradient-to-r ${screen.gradient} text-white`
                  : "bg-white border border-sky-100 text-slate-600"
              }`}
            >
              {cat}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {screen.items.map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-sky-100 bg-white px-3 py-2.5 flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-slate-900 truncate">
                  {item.name}
                </p>
                <p className="text-[9px] text-slate-500">{item.stock}</p>
              </div>
              <span className="text-xs font-black text-sky-700 tabular-nums shrink-0">
                {item.price}
              </span>
            </div>
          ))}
        </div>

        {/* Sticky Mobile Cart Checkout Bar */}
        <div
          className={`rounded-xl bg-gradient-to-r ${screen.gradient} px-3.5 py-2.5 flex items-center justify-between text-white shadow-md`}
        >
          <div>
            <p className="text-[9px] font-semibold text-white/85">
              {screen.cartCount}
            </p>
            <p className="text-sm font-black tabular-nums">{screen.cartTotal}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1.5 text-[10px] font-extrabold">
            <Printer size={11} />
            <span>Checkout</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function EcosystemVFXShowcase() {
  const [syncStage, setSyncStage] = useState<SyncStage>(0);
  const [mobileIdx, setMobileIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSyncStage((prev) => ((prev + 1) % 3) as SyncStage);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMobileIdx((prev) => (prev + 1) % MOBILE_POS_SCREENS.length);
    }, 3300);
    return () => window.clearInterval(id);
  }, []);

  const stage = SYNC_STAGES[syncStage];
  const prevMobile =
    MOBILE_POS_SCREENS[
      (mobileIdx - 1 + MOBILE_POS_SCREENS.length) % MOBILE_POS_SCREENS.length
    ];
  const activeMobile = MOBILE_POS_SCREENS[mobileIdx];
  const nextMobile =
    MOBILE_POS_SCREENS[(mobileIdx + 1) % MOBILE_POS_SCREENS.length];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. LIGHT SOFT BLUE WAVE — ANIMATED POS FEATURES & KINETIC MARQUEE   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="features"
        className="relative overflow-hidden bg-gradient-to-b from-[#ffffff] via-[#f3f9ff] to-[#e9f4ff] py-16 sm:py-24 text-slate-900 border-t border-sky-100"
      >
        {/* Continuous Kinetic Light-Glass Marquee Ribbon */}
        <div className="mb-14 overflow-hidden border-y border-sky-200/70 bg-white/75 backdrop-blur-md py-3.5 shadow-2xs">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="flex w-max items-center gap-5 px-4"
          >
            {[...POS_MARQUEE_FEATURES, ...POS_MARQUEE_FEATURES].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.label}-${idx}`}
                  className="inline-flex items-center gap-2.5 rounded-full border border-sky-200/80 bg-[#f6fbff] px-4 py-1.5 text-xs font-bold text-slate-700 whitespace-nowrap shadow-2xs"
                >
                  <Icon size={14} className={item.tone} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-14 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-3 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3.5 py-1 text-[11px] font-bold text-sky-700 shadow-2xs">
                <Sparkles size={12} className="text-sky-600" />
                <span>POS Register Capabilities</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                Built for Speed at Every Checkout Counter
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Every terminal includes offline queueing, instant keyboard billing,
              split payments, and real-time ledger automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {POS_SPOTLIGHT_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  whileHover={{ y: -6 }}
                  className={`relative overflow-hidden rounded-2xl border ${feat.border} bg-gradient-to-b ${feat.gradient} p-6 sm:p-7 shadow-[0_14px_35px_-12px_rgba(2,132,199,0.12)] hover:shadow-[0_22px_50px_-12px_rgba(2,132,199,0.22)] transition-all`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${feat.iconBg}`}
                    >
                      <Icon size={22} />
                    </div>
                    <span className="rounded-full border border-sky-200/80 bg-white px-2.5 py-1 text-[10px] font-bold text-sky-800">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. SOFT BLUE WAVE — LIVE KOT + CUSTOMER DISPLAY VFX                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="live-displays"
        className="relative overflow-hidden bg-gradient-to-b from-[#e9f4ff] via-[#f2f8ff] to-[#ffffff] py-16 sm:py-24 text-slate-900 border-t border-sky-200/60"
      >
        {/* Decorative Flowing Soft Sky Wave Ribbons */}
        <svg
          className="pointer-events-none absolute inset-x-0 top-0 w-full h-56 opacity-60"
          preserveAspectRatio="none"
          viewBox="0 0 1440 240"
          aria-hidden
        >
          <path
            d="M0,96 C320,180 720,10 1080,100 C1280,150 1380,90 1440,64 L1440,0 L0,0 Z"
            fill="rgba(186,230,253,0.45)"
          />
          <path
            d="M0,128 C360,30 780,190 1140,80 C1300,30 1390,80 1440,104 L1440,0 L0,0 Z"
            fill="rgba(224,242,254,0.65)"
          />
        </svg>

        <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-14 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-3 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-[11px] font-bold text-orange-700 shadow-2xs">
                <Flame size={12} className="text-orange-600" />
                <span>Synchronized Counter Screens</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                Live KOT Kitchen Display &amp;{" "}
                <span className="bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#0284C7] bg-clip-text text-transparent">
                  Customer QR Display
                </span>
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-sky-700 shadow-xs self-start">
              <RefreshCw size={13} className="animate-spin text-sky-600" />
              <span>Real-Time Auto Sync Simulation</span>
            </div>
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-stretch">
            {/* Pulsing Sky Sync Connector Node */}
            <div
              className="pointer-events-none hidden lg:flex absolute left-[58.33%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center"
              aria-hidden
            >
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-sky-300 bg-white shadow-[0_10px_30px_rgba(2,132,199,0.28)]">
                <motion.div
                  animate={{ scale: [1, 1.65, 1], opacity: [0.85, 0, 0.85] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-sky-400"
                />
                <Wifi size={18} className="text-sky-600" />
              </div>
            </div>

            {/* LEFT 7 COLS: Light Frosted KOT Kitchen Board */}
            <div className="lg:col-span-7 rounded-2xl border border-sky-200/90 bg-white/90 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_24px_65px_-15px_rgba(2,132,199,0.16)] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
                    <ChefHat size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      KOT Kitchen Display System
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kitchen • Grill • Bar • Dessert Station Routing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-700">
                    <ChefHat size={11} /> Kitchen
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2.5 py-1 text-rose-700">
                    <Flame size={11} /> Grill
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-purple-700">
                    <Wine size={11} /> Bar
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-pink-50 border border-pink-200 px-2.5 py-1 text-pink-700">
                    <IceCream size={11} /> Dessert
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {(["QUEUED", "PREPARING", "READY"] as const).map((col) => {
                  const isActive = stage.kotStatus === col;
                  const pillTone =
                    col === "QUEUED"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : col === "PREPARING"
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700";

                  return (
                    <div
                      key={col}
                      className="rounded-xl border border-sky-100 bg-[#f6faff] p-3.5 min-h-[250px] flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between text-[11px] font-extrabold">
                        <span className={`rounded-md border px-2 py-0.5 ${pillTone}`}>
                          {col}
                        </span>
                        <span className="font-mono text-slate-400">
                          {isActive ? "Active" : "Synced"}
                        </span>
                      </div>

                      {isActive && (
                        <motion.div
                          layoutId="autoKotTicketCardLight"
                          transition={{ type: "spring", stiffness: 280, damping: 24 }}
                          className={`rounded-xl border bg-white p-3.5 space-y-2.5 shadow-lg ${
                            col === "READY"
                              ? "border-emerald-300 ring-2 ring-emerald-500/15"
                              : col === "PREPARING"
                              ? "border-sky-300 ring-2 ring-sky-500/15"
                              : "border-amber-300 ring-2 ring-amber-500/15"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-slate-900">
                              #KOT-408
                            </span>
                            <span className="rounded bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                              Table T-04
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px] text-slate-700 font-medium">
                            <div className="flex justify-between">
                              <span>2× Smoked Platter</span>
                              <span className="text-orange-600 font-bold">Grill</span>
                            </div>
                            <div className="flex justify-between">
                              <span>1× Beef Tehari</span>
                              <span className="text-amber-600 font-bold">Kitchen</span>
                            </div>
                            <div className="flex justify-between">
                              <span>2× Caramel Latte</span>
                              <span className="text-purple-600 font-bold">Bar</span>
                            </div>
                          </div>
                          <div className="space-y-1 pt-1">
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <motion.div
                                animate={{ width: `${stage.kotProgress}%` }}
                                transition={{ duration: 0.6 }}
                                className={`h-full rounded-full ${
                                  col === "READY"
                                    ? "bg-emerald-500"
                                    : col === "PREPARING"
                                    ? "bg-sky-500"
                                    : "bg-amber-500"
                                }`}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> {col === "READY" ? "Ready" : "06m"}
                              </span>
                              <span className="font-bold text-slate-700">{stage.kotProgress}%</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div className="rounded-lg border border-sky-100 bg-white p-2.5 text-[10px] text-slate-500">
                        <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                          <span>
                            {col === "QUEUED"
                              ? "#KOT-407 • Takeaway"
                              : col === "PREPARING"
                              ? "#KOT-406 • T-09"
                              : "#KOT-405 • T-02"}
                          </span>
                          <span>{col === "READY" ? "Served" : "Live"}</span>
                        </div>
                        <p className="truncate">
                          {col === "QUEUED"
                            ? "1× Pasta Alfredo, 2× Cold Brew"
                            : col === "PREPARING"
                            ? "3× Mutton Kacchi, 2× Firni"
                            : "2× Grilled Steak, 1× Soup"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-sky-200/80 bg-[#f4f9ff] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 font-bold text-sky-900">
                  <Tv size={15} className="text-sky-600" />
                  <span>Customer Overhead TV Display Sync</span>
                </span>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="rounded bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                    Preparing: #406
                  </span>
                  <span className="rounded bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-emerald-800 font-bold">
                    Ready: #{stage.kotStatus === "READY" ? 408 : 405}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLS: Customer Facing Display */}
            <div className="lg:col-span-5 rounded-2xl border border-sky-200/90 bg-white text-slate-800 shadow-[0_24px_65px_-15px_rgba(2,132,199,0.18)] overflow-hidden flex flex-col justify-between">
              <div className="bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] px-5 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Monitor size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black">Customer Facing Display</p>
                    <p className="text-[11px] text-sky-100">
                      Counter #01 • Live Synced Screen
                    </p>
                  </div>
                </div>
                <span className="rounded bg-white/20 px-2.5 py-1 text-[11px] font-mono font-bold">
                  LIVE MIRROR
                </span>
              </div>

              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between bg-[#f7fbff]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {stage.customerTitle}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        stage.paid
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {stage.paid ? "PAID" : "ACTIVE"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-sky-100 bg-white divide-y divide-slate-100 shadow-2xs">
                    {CUSTOMER_LINES.map((line) => (
                      <div
                        key={line.name}
                        className="px-3.5 py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg">{line.emoji}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {line.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Qty {line.qty}
                            </p>
                          </div>
                        </div>
                        <span className="font-extrabold text-slate-900 tabular-nums">
                          {line.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {stage.paid ? (
                    <motion.div
                      key="customer-paid-light"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-1.5"
                    >
                      <CheckCircle2
                        size={30}
                        className="mx-auto text-emerald-600"
                      />
                      <p className="text-base font-black text-emerald-950">
                        Payment Confirmed • ৳3,538
                      </p>
                      <p className="text-xs text-emerald-700 font-semibold">
                        {stage.customerSubtitle} • Token #408
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="customer-qr-light"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-xl border border-sky-200 bg-white p-4 flex items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1">
                          <QrCode size={12} />
                          Dynamic Pay QR
                        </p>
                        <p className="text-2xl font-black text-slate-900 tabular-nums">
                          ৳3,538
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {stage.customerSubtitle}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold">
                          <span className="rounded bg-pink-50 px-2 py-0.5 text-pink-700">
                            bKash
                          </span>
                          <span className="rounded bg-orange-50 px-2 py-0.5 text-orange-700">
                            Nagad
                          </span>
                          <span className="rounded bg-sky-50 px-2 py-0.5 text-sky-700">
                            Card
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-sky-100 bg-white p-2 shrink-0">
                        <QRCodeSVG
                          value="SALEPAY-KOT-408-3538"
                          size={82}
                          level="M"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. SOFT BLUE WAVE — MOBILE APP POS SCREENS (ONLY 5 POS SCREENS)     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="mobile-app"
        className="relative overflow-hidden bg-gradient-to-b from-[#ffffff] via-[#eef7ff] to-[#e6f3ff] py-16 sm:py-24 text-slate-900 border-t border-sky-100"
      >
        <motion.div
          animate={{
            background: `radial-gradient(circle at 65% 50%, ${activeMobile.accent}22 0%, transparent 55%)`,
          }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute inset-0"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-14">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-center">
            <div className="xl:col-span-5 space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3.5 py-1 text-[11px] font-bold text-sky-700 shadow-2xs">
                  <Smartphone size={13} className="text-sky-600" />
                  <span>Flutter Mobile POS Terminals</span>
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                  5 Mobile POS Apps.{" "}
                  <span className="bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] bg-clip-text text-transparent">
                    Always Synced.
                  </span>
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Retail, Restaurant, Pharmacy, Grocery &amp; Wholesaler mobile POS
                  registers auto-syncing with your cloud branches, Bluetooth thermal
                  printers, and live sales history.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {MOBILE_POS_FEATURES.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <motion.div
                      key={feat.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      className="rounded-xl border border-sky-200/80 bg-white/90 p-4 space-y-2 shadow-xs"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                        <Icon size={17} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {feat.title}
                      </h3>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {feat.desc}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="xl:col-span-7 flex flex-col items-center justify-center space-y-6">
              <div className="relative flex items-center justify-center gap-4 sm:gap-6 w-full py-4">
                <motion.div
                  key={`left-${prevMobile.id}`}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 0.75, x: 0 }}
                  transition={{ duration: 0.45 }}
                  className="hidden md:block -mr-10 lg:-mr-6"
                >
                  <MobilePhoneFrame screen={prevMobile} variant="side" />
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`center-${activeMobile.id}`}
                    initial={{ opacity: 0, y: 20, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.94 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-20"
                  >
                    <MobilePhoneFrame screen={activeMobile} variant="center" />
                  </motion.div>
                </AnimatePresence>

                <motion.div
                  key={`right-${nextMobile.id}`}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 0.75, x: 0 }}
                  transition={{ duration: 0.45 }}
                  className="hidden md:block -ml-10 lg:-ml-6"
                >
                  <MobilePhoneFrame screen={nextMobile} variant="side" />
                </motion.div>
              </div>

              <div className="flex items-center gap-2">
                {MOBILE_POS_SCREENS.map((s, idx) => (
                  <span
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === mobileIdx ? "w-7 bg-sky-600" : "w-1.5 bg-sky-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
