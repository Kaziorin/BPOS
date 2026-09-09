"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  ShoppingBag,
  Wifi,
  WifiOff,
  CheckCircle2,
  QrCode,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Award,
  TrendingDown,
  CreditCard,
  Gift,
  ScanLine,
  Scale,
  ShieldCheck,
  Camera,
  Grid,
  Wallet,
  Layers,
} from "lucide-react";
import { subscribeCart, readCart, type DisplayCart } from "@/lib/customer-display";
import { isOnline } from "@/lib/offline/db";
import { cn } from "@/lib/cn";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomBadge } from "@/components/custom/CustomBadge";
import { CustomTabs } from "@/components/custom/CustomTabs";

const EMOJI_MAP: [string, string][] = [
  ["banana", "🍌"], ["apple", "🍎"], ["potato", "🥔"], ["onion", "🧅"],
  ["tomato", "🍅"], ["cucumber", "🥒"], ["carrot", "🥕"], ["rice", "🌾"],
  ["oil", "🫙"], ["milk", "🥛"], ["egg", "🥚"], ["sugar", "🍬"],
  ["atta", "🌾"], ["flour", "🌾"], ["lays", "🍟"], ["chips", "🍟"],
  ["cola", "🥤"], ["coca", "🥤"], ["pepsi", "🥤"], ["nescafe", "☕"],
  ["coffee", "☕"], ["tea", "🍵"], ["soap", "🧼"], ["detergent", "🧴"],
  ["tissue", "🧻"], ["water", "💧"], ["bread", "🍞"], ["butter", "🧈"],
  ["cheese", "🧀"], ["yogurt", "🫙"], ["fish", "🐟"], ["meat", "🥩"],
  ["chicken", "🍗"], ["mango", "🥭"], ["orange", "🍊"], ["lemon", "🍋"],
  ["salt", "🧂"], ["pepper", "🌶"], ["biscuit", "🍪"], ["chocolate", "🍫"],
  ["croissant", "🥐"], ["cake", "🍰"], ["pizza", "🍕"], ["ice cream", "🍨"],
];

function getEmoji(name: string) {
  const n = (name || "").toLowerCase();
  for (const [k, e] of EMOJI_MAP) if (n.includes(k)) return e;
  return "🛒";
}

// ── Web Audio API Beep Generator for Scan Audio Feedback ──
function playScanSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function playSuccessChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  } catch {}
}

// ── Vector QR Code Generator ──
function qrSvg(payload: string, size = 190, darkColor = "#0f172a"): string {
  let seed = 0;
  for (const ch of payload) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const n = 25;
  const cells: boolean[][] = [];
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const inFinder =
        (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      if (inFinder) {
        const border = x === 0 || x === 6 || y === 0 || y === 6 || (x >= n - 7 && (x === n - 7 || x === n - 1)) || (y >= n - 7 && (y === n - 7 || y === n - 1));
        const center = (x >= 2 && x <= 4 && y >= 2 && y <= 4) || (x >= n - 5 && x <= n - 3 && y >= 2 && y <= 4) || (x >= 2 && x <= 4 && y >= n - 5 && y <= n - 3);
        row.push(border || center);
      } else {
        row.push((seed & 1) === 1);
      }
    }
    cells.push(row);
  }
  const cell = size / n;
  const rects: string[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (cells[y][x]) {
        rects.push(`<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="1.5" />`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff" rx="16"/><g fill="${darkColor}">${rects.join("")}</g></svg>`;
}

function fmt(n: number): string {
  return `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getTierTone(tierName?: string): "green" | "amber" | "gray" | "primary" {
  const t = (tierName || "").toUpperCase();
  if (t.includes("VIP")) return "primary";
  if (t.includes("GOLD")) return "amber";
  if (t.includes("SILVER")) return "gray";
  return "green";
}

// ── Promo Slides for Idle Mode ──
const PROMO_SLIDES = [
  {
    id: 1,
    tag: "PRODUCE SPECIAL",
    badge: "15% OFF",
    title: "Fresh Farm Fruits & Produce",
    desc: "Get 15% discount on all weight-based produce at the checkout counter today!",
    accent: "border-[#bbe664] bg-emerald-50/60",
    badgeTone: "green" as const,
  },
  {
    id: 2,
    tag: "INSTANT CASHBACK",
    badge: "CASHBACK",
    title: "Pay via Digital QR Wallet",
    desc: "Scan the customer display QR code for 10% instant cashback up to ৳200.",
    accent: "border-emerald-200 bg-emerald-50/60",
    badgeTone: "green" as const,
  },
  {
    id: 3,
    tag: "LOYALTY PROGRAM",
    badge: "REWARDS",
    title: "Earn 1 Point per ৳100 Spent",
    desc: "Redeem your points on future checkouts and unlock exclusive member benefits.",
    accent: "border-amber-200 bg-amber-50/60",
    badgeTone: "amber" as const,
  },
];

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<DisplayCart>(() => readCart());
  const [online, setOnline] = useState(true);
  const [showPaid, setShowPaid] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePayMethod, setActivePayMethod] = useState<string>("UPI / QR");
  const [promoIndex, setPromoIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const prevLineCountRef = useRef(0);

  // Live Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      setCurrentDate(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline Status Listener
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

  // Subscribe to 100% REAL-TIME POS cart updates
  useEffect(() => {
    return subscribeCart((c) => {
      setCart(c);
      const isPaidNow = c.status === "PAID";
      setShowPaid(isPaidNow);

      if (isPaidNow && soundEnabled) {
        playSuccessChime();
      } else if (c.lines.length > prevLineCountRef.current && soundEnabled) {
        playScanSound();
      }
      prevLineCountRef.current = c.lines.length;
    });
  }, [soundEnabled]);

  // Auto Rotation for Idle Promos when cart is empty
  useEffect(() => {
    if (cart.lines.length > 0) return;
    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [cart.lines.length]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const lines = useMemo(() => cart.lines ?? [], [cart.lines]);
  const empty = lines.length === 0;

  // QR Code Payload
  const qrPayload = empty
    ? "https://bpos.app/customer-display?status=idle"
    : `upiqr://pay?pa=merchant@bpos&pn=BPOS%20Superstore&am=${cart.total.toFixed(2)}&tn=${cart.invoiceNo || "SALE"}&pm=${activePayMethod}`;

  return (
    <div
      className="relative flex flex-col justify-between h-screen w-screen bg-white text-slate-900 select-none overflow-hidden p-4 md:p-6"
      style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
    >
      {/* ══ EXACT RGBA(230, 247, 199) WAVE BACKDROP ══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top Upper Soft Wave */}
        <svg className="absolute top-0 left-0 w-full h-[140px] opacity-100" viewBox="0 0 1200 140" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 1200 0 L 1200 65 C 920 135, 580 30, 280 115 C 140 135, 40 70, 0 85 Z" fill="url(#cd-top-mint-wave-rgba)" />
          <defs>
            <linearGradient id="cd-top-mint-wave-rgba" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(230, 247, 199, 0.95)" />
              <stop offset="50%" stopColor="rgba(230, 247, 199, 0.6)" />
              <stop offset="85%" stopColor="rgba(240, 253, 225, 0.25)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top Main Front Wave */}
        <svg className="absolute top-0 left-0 w-[78%] h-[115px] opacity-100" viewBox="0 0 1000 115" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 1000 0 L 1000 35 C 760 110, 480 20, 220 95 C 100 110, 30 45, 0 60 Z" fill="url(#cd-top-lime-vivid-rgba)" />
          <defs>
            <linearGradient id="cd-top-lime-vivid-rgba" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(230, 247, 199, 1)" />
              <stop offset="40%" stopColor="rgba(230, 247, 199, 0.75)" />
              <stop offset="75%" stopColor="rgba(240, 253, 225, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top-Left Soft Glow Wave */}
        <svg className="absolute top-0 left-0 w-[52%] h-[85px] opacity-95" viewBox="0 0 700 85" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 700 0 L 700 25 C 500 80, 300 15, 120 70 C 50 80, 10 30, 0 40 Z" fill="url(#cd-top-lime-glow-rgba)" />
          <defs>
            <linearGradient id="cd-top-lime-glow-rgba" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(230, 247, 199, 0.9)" />
              <stop offset="45%" stopColor="rgba(230, 247, 199, 0.5)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ════ TOP HEADER & STATUS BAR ════ */}
      <header className="relative z-10 rounded-[2rem] bg-white/75 backdrop-blur-md border border-emerald-300/50 shadow-2xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 transition-all">
        {/* Brand Logo & Lane Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-11 h-11 rounded-xl bg-white border border-emerald-400 text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
            <ShoppingBag size={22} strokeWidth={2.2} />
            <div className="absolute -top-1 -right-1 text-xs">🌿</div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{cart.merchantName || "BPOS Superstore"}</h1>
              <span className="bg-emerald-700 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-2xs">
                {cart.laneNo || "LANE 01"}
              </span>
            </div>
            <p className="text-[10.5px] font-bold tracking-wider text-emerald-800 uppercase flex items-center gap-2 mt-0.5">
              <span>CUSTOMER DISPLAY TERMINAL</span>
              <span>•</span>
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-extrabold normal-case tracking-normal", online ? "text-emerald-700" : "text-amber-700")}>
                {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                {online ? "POS Live Synced" : "Offline Register"}
              </span>
            </p>
          </div>
        </div>

        {/* Center Clock & Date Pill - Dead Centered in Header */}
        <div className="hidden lg:flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-emerald-300/80 shadow-2xs absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
            <Scale size={16} strokeWidth={2.2} />
          </div>
          <div className="leading-tight text-center">
            <p className="text-sm font-black font-mono tracking-wider text-slate-900">{currentTime}</p>
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-800">{currentDate}</p>
          </div>
        </div>

        {/* Top Control Bar - Volume & Fullscreen Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-1 border border-emerald-300/80 shadow-2xs">
            <CustomButton
              size="sm"
              variant="outline"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute scan sound" : "Enable scan sound"}
              className="w-9 h-9 p-0 rounded-lg border-none hover:bg-emerald-50"
            >
              {soundEnabled ? <Volume2 size={18} className="text-emerald-700" /> : <VolumeX size={18} className="text-slate-400" />}
            </CustomButton>

            <CustomButton
              size="sm"
              variant="primary"
              themeColor="emerald"
              onClick={toggleFullscreen}
              className="w-9 h-9 p-0 rounded-lg"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </CustomButton>
          </div>
        </div>
      </header>

      {/* ════ CUSTOMER WELCOME BANNER ════ */}
      <div className="relative z-10 my-3 rounded-[1.75rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] p-4 flex items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#bbe664] to-[#a3e635] text-slate-900 font-black text-lg flex items-center justify-center shadow-md shrink-0">
            {cart.customerName ? cart.customerName.charAt(0).toUpperCase() : "G"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-black text-slate-900 tracking-tight truncate">
                {cart.customerName ? `Welcome back, ${cart.customerName}!` : "Welcome! Thank you for shopping with us."}
              </span>
              {cart.customerName && (
                <CustomBadge tone={getTierTone(cart.customerTier)}>
                  {cart.customerTier || "Member"}
                </CustomBadge>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
              {cart.customerName
                ? `Loyalty Balance: ${cart.customerPoints || 0} Pts ${cart.pointsEarned ? `(Earn +${cart.pointsEarned} Pts on this purchase)` : ""}`
                : "Ask cashier to join our Loyalty Club & earn points on every checkout!"}
            </p>
          </div>
        </div>

        {cart.discountTotal > 0 && (
          <CustomBadge tone="amber" className="hidden sm:inline-flex px-3 py-1 text-xs font-bold">
            Savings: {fmt(cart.discountTotal)}
          </CustomBadge>
        )}
      </div>

      {/* ════ MAIN CONTENT AREA (GRID) ════ */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0 py-1">
        {/* ── LEFT SECTION (COLS 1-7): Itemized Live Order OR Promo Carousel ── */}
        <section className="lg:col-span-7 flex flex-col rounded-[2rem] bg-white border border-slate-200/80 shadow-sm overflow-hidden min-h-[440px]">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Basket Items</h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Live scan itemization</p>
              </div>
            </div>

            <CustomBadge tone="gray" className="px-3 py-1 font-bold">
              {lines.length} {lines.length === 1 ? "Item" : "Items"}
            </CustomBadge>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
            {empty ? (
              /* IDLE STATE: System Aesthetic Promotion Carousel */
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-5">
                <div className={cn(
                  "relative w-full max-w-lg overflow-hidden rounded-2xl p-6 border transition-all duration-500",
                  PROMO_SLIDES[promoIndex].accent
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <CustomBadge tone={PROMO_SLIDES[promoIndex].badgeTone}>
                      {PROMO_SLIDES[promoIndex].tag}
                    </CustomBadge>
                    <span className="text-xs font-bold text-slate-700">
                      {PROMO_SLIDES[promoIndex].badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {PROMO_SLIDES[promoIndex].title}
                  </h3>
                  <p className="text-xs font-medium text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                    {PROMO_SLIDES[promoIndex].desc}
                  </p>

                  <div className="flex items-center justify-center gap-1.5 pt-4">
                    {PROMO_SLIDES.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPromoIndex(idx)}
                        className={cn(
                          "h-2 rounded-full transition-all cursor-pointer",
                          idx === promoIndex ? "w-6 bg-emerald-600" : "w-2 bg-slate-300 hover:bg-slate-400"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <ScanLine size={16} className="text-emerald-600 animate-pulse" />
                  Ready to scan • Items appear live on screen
                </div>
              </div>
            ) : showPaid ? (
              /* PAID STATE: Payment Completed Celebration & Digital Slip Preview */
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                  <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">Payment Complete</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Thank you for shopping with us!</p>
                </div>

                <div className="w-full max-w-md p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-500 border-b border-slate-200 pb-2">
                    <span>Invoice: {cart.invoiceNo || "N/A"}</span>
                    <span>Method: {cart.paymentMethod || "CASH"}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-slate-900">
                    <span>Total Paid</span>
                    <span className="font-mono text-emerald-600">{fmt(cart.paidTotal || cart.total)}</span>
                  </div>

                  {cart.changeTotal !== undefined && cart.changeTotal > 0 && (
                    <div className="flex justify-between text-xs font-bold text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <span>Change Due</span>
                      <span className="font-mono">{fmt(cart.changeTotal)}</span>
                    </div>
                  )}

                  {cart.pointsEarned ? (
                    <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Award size={16} /> Points Earned:</span>
                      <span>+{cart.pointsEarned} Pts</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              /* ACTIVE CART STATE: Live scanned item list with Product Image / Avatar Support */
              lines.map((item, idx) => {
                const linePrice = item.qty * item.unitPrice - (item.discountAmount || 0);
                const emoji = getEmoji(item.name);
                const rawImg = item.image || (item as any).imageUrl;
                const formattedSrc = rawImg ? (rawImg.startsWith("/") ? `http://localhost:4000${rawImg}` : rawImg) : null;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {formattedSrc ? (
                        <img
                          src={formattedSrc}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-200/80 shrink-0 bg-slate-50 shadow-2xs"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector(".fallback-emoji")) {
                              const fallback = document.createElement("div");
                              fallback.className = "fallback-emoji w-12 h-12 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] text-[#15803d] font-bold text-xl flex items-center justify-center shrink-0 shadow-2xs";
                              fallback.innerText = emoji;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] text-[#15803d] font-bold text-xl flex items-center justify-center shrink-0 shadow-2xs">
                          {emoji}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {item.qty}x
                          </span>
                          <p className="font-bold text-slate-900 text-sm tracking-tight truncate">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>{fmt(item.unitPrice)} / {item.uom || "unit"}</span>
                          {item.discountAmount > 0 && (
                            <CustomBadge tone="red" className="py-0 px-1.5 text-[10px]">
                              −{fmt(item.discountAmount)} OFF
                            </CustomBadge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-bold font-mono text-slate-900 block">{fmt(linePrice)}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!empty && !showPaid && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 text-xs font-semibold text-slate-500">
              <span>Scanned items update automatically</span>
              {cart.discountTotal > 0 && (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Gift size={15} /> Total Savings: {fmt(cart.discountTotal)}
                </span>
              )}
            </div>
          )}
        </section>

        {/* ── RIGHT SECTION (COLS 8-12): Order Summary & Dynamic Payment QR ── */}
        <section className="lg:col-span-5 flex flex-col justify-between space-y-5">
          {/* Top Payment & Summary Card */}
          <div className="rounded-[2rem] bg-white border border-slate-200/80 shadow-sm p-5 md:p-6 flex flex-col justify-between flex-1 space-y-5">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-600" /> Order Summary
                </h3>
                {cart.invoiceNo && (
                  <CustomBadge tone="gray" className="font-mono">
                    #{cart.invoiceNo}
                  </CustomBadge>
                )}
              </div>

              {/* Subtotal & Line Details */}
              <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-mono">{fmt(cart.subtotal)}</span>
                </div>

                {cart.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Discount</span>
                    <span className="font-mono">−{fmt(cart.discountTotal)}</span>
                  </div>
                )}

                {cart.taxTotal > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>VAT / Tax</span>
                    <span className="font-mono">{fmt(cart.taxTotal)}</span>
                  </div>
                )}

                {cart.serviceCharge ? (
                  <div className="flex justify-between text-slate-500">
                    <span>Service Charge</span>
                    <span className="font-mono">{fmt(cart.serviceCharge)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* MASSIVE GRAND TOTAL DISPLAY — EXACT POS EMERALD GRADIENT THEME */}
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-black tracking-widest text-[#bbe664] uppercase">
                <span>Amount Due</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px]">BDT (৳)</span>
              </div>
              <p className="text-4xl lg:text-5xl font-black font-mono tracking-tight text-white pt-1 drop-shadow-sm">
                {fmt(cart.total)}
              </p>
              {cart.discountTotal > 0 && (
                <p className="text-xs font-bold text-[#bbe664] flex items-center gap-1 pt-1.5">
                  <TrendingDown size={14} /> You save {fmt(cart.discountTotal)} today
                </p>
              )}
            </div>

            {/* LIVE DIGITAL PAYMENT QR & CustomTabs Payment Method Selector matching POS PAY_CFG */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Options</span>
                <CustomBadge tone="green" className="text-[10px]">
                  POS Checkout
                </CustomBadge>
              </div>

              {/* Exact POS Payment Method Tabs */}
              <CustomTabs
                tabs={[
                  { id: "Cash", label: "Cash" },
                  { id: "Card", label: "Card" },
                  { id: "UPI / QR", label: "UPI / QR" },
                  { id: "Wallet", label: "Wallet" },
                  { id: "Split Payment", label: "Split" },
                ]}
                activeTab={activePayMethod}
                onChange={(id) => setActivePayMethod(id)}
                themeColor="emerald"
                variant="solid"
              />

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div
                  className="p-2 bg-white rounded-xl shadow-2xs border border-slate-100"
                  dangerouslySetInnerHTML={{ __html: qrSvg(qrPayload, 160, "#0f172a") }}
                />

                <div className="text-center space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                    <QrCode size={14} className="text-emerald-600" /> Scan for {activePayMethod} Payment
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {empty ? "Scan to pair wallet" : `Amount due: ${fmt(cart.total)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Badge */}
          <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Encrypted Real-Time Terminal • Powered by BPOS</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function roundTo2(val: number): number {
  return Math.round(val * 100) / 100;
}
