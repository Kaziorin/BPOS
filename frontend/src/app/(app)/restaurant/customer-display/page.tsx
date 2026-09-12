"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Utensils,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CreditCard,
  ShoppingBag,
  Scale,
  Award,
  SmilePlus,
  Flame,
  Clock,
  Sparkles,
  PlusCircle,
  Trash2,
} from "lucide-react";
import {
  subscribeRestaurantCart,
  readRestaurantCart,
  publishRestaurantCart,
  type DisplayCart,
  type DisplayLine,
} from "@/lib/customer-display";
import { isOnline } from "@/lib/offline/db";
import { cn } from "@/lib/cn";

// ── Currency Formatter ──
function fmt(n: number): string {
  return `৳${Number(n || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Audio Feedback ──
function playScanSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
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
      gain.gain.setValueAtTime(0.18, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.28);
    });
  } catch {}
}

// ── Food Emoji Mapper ──
const FOOD_EMOJIS = ["🍛", "🍜", "🥘", "🍗", "🥩", "🍱", "🥗", "🍲", "🍔", "🍕", "🧆", "🥙", "🍣", "🥞"];
function getFoodEmoji(name: string, idx: number): string {
  const n = (name || "").toLowerCase();
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger") || n.includes("sandwich")) return "🍔";
  if (n.includes("rice") || n.includes("biryani") || n.includes("platter")) return "🍚";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("beef") || n.includes("steak") || n.includes("mutton")) return "🥩";
  if (n.includes("fish") || n.includes("prawn") || n.includes("shrimp")) return "🐟";
  if (n.includes("salad")) return "🥗";
  if (n.includes("soup")) return "🥣";
  if (n.includes("cake") || n.includes("dessert") || n.includes("sweet")) return "🍰";
  if (n.includes("coffee") || n.includes("tea")) return "☕";
  if (n.includes("juice") || n.includes("drink") || n.includes("beverage") || n.includes("coke")) return "🥤";
  return FOOD_EMOJIS[idx % FOOD_EMOJIS.length];
}

// ── High-Fidelity QR Code Generator ──
function qrSvg(payload: string, size = 165, dark = "#1e293b"): string {
  let seed = 0;
  for (const ch of payload) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const n = 21;
  const cells: boolean[][] = [];
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const f = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      if (f) {
        const b =
          x === 0 ||
          x === 6 ||
          y === 0 ||
          y === 6 ||
          (x >= n - 7 && (x === n - 7 || x === n - 1)) ||
          (y >= n - 7 && (y === n - 7 || y === n - 1));
        const c =
          (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
          (x >= n - 5 && x <= n - 3 && y >= 2 && y <= 4) ||
          (x >= 2 && x <= 4 && y >= n - 5 && y <= n - 3);
        row.push(b || c);
      } else row.push((seed & 1) === 1);
    }
    cells.push(row);
  }
  const cell = size / n;
  const rects = cells.flatMap((row, y) =>
    row.map((on, x) =>
      on
        ? `<rect x="${(x * cell).toFixed(1)}" y="${(y * cell).toFixed(1)}" width="${cell.toFixed(
            1
          )}" height="${cell.toFixed(1)}" rx="1.5"/>`
        : ""
    )
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff" rx="14"/><g fill="${dark}">${rects}</g></svg>`;
}

// ── Live Clock Capsule Widget (Restaurant Theme) ──
function LiveClockCapsule() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(t.getHours() % 12 || 12).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");
  const ap = t.getHours() >= 12 ? "pm" : "am";
  const day = t
    .toLocaleDateString("en-BD", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-xl border bg-orange-50/80 border-orange-200/90 text-gray-800 shadow-2xs">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600 text-sm">
        <Scale size={15} />
      </div>
      <div className="text-left leading-tight">
        <div className="text-[13px] font-black tracking-tight text-gray-800">
          {hh}:{mm}:{ss} <span className="text-xs font-bold text-orange-600">{ap}</span>
        </div>
        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{day}</div>
      </div>
    </div>
  );
}

export default function RestaurantCustomerDisplayPage() {
  const [cart, setCart] = useState<DisplayCart | null>(null);
  const [online, setOnline] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<"cash" | "card" | "qr" | "wallet" | "split">("qr");

  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const paidRef = useRef(false);

  // Network check
  useEffect(() => {
    const check = async () => setOnline(await isOnline());
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to real-time cart updates from Restaurant POS
  useEffect(() => {
    const initial = readRestaurantCart();
    setCart(initial);

    const unsub = subscribeRestaurantCart((data) => {
      setCart((prev) => {
        const prevLen = prev?.lines?.length ?? 0;
        const nextLen = data?.lines?.length ?? 0;
        if (nextLen > prevLen && soundRef.current) playScanSound();

        const wasPaid = paidRef.current;
        const isPaid = data?.status === "PAID";
        if (!wasPaid && isPaid) {
          if (soundRef.current) playSuccessChime();
          setShowThankYou(true);
          setTimeout(() => setShowThankYou(false), 9000);
        }
        paidRef.current = isPaid;
        return data;
      });
    });
    return () => unsub?.();
  }, []);

  // Fullscreen toggle
  const toggleFs = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  }, []);

  // Dynamic values directly from real-time cart
  const lines = cart?.lines || [];
  const hasItems = lines.length > 0;
  const subtotal = cart?.subtotal || (hasItems ? lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) : 0);
  const tax = cart?.taxTotal || (hasItems ? subtotal * 0.15 : 0);
  const discount = cart?.discountTotal || 0;
  const serviceCharge = cart?.serviceCharge || (hasItems ? subtotal * 0.04 : 0);
  const total = cart?.total || (hasItems ? subtotal - discount + tax + serviceCharge : 0);

  const customerName = cart?.customerName;
  const customerTier = cart?.customerTier || "Dine-In";
  const customerPoints = cart?.customerPoints ?? 0;
  const tableNo = cart?.tableNo || (cart?.orderType ? cart.orderType.replace("_", " ") : "TABLE 01");
  const merchantName = cart?.merchantName || "BPOS Restaurant";
  const cashierName = cart?.cashierName || "Waiter";
  const qrPayload = `bpos-restaurant-bill-${Date.now()}-${Math.round(total)}`;

  // Quick helper to populate demo food items if user wants to test immediately
  const handleQuickDemo = () => {
    const demoCart: DisplayCart = {
      updatedAt: Date.now(),
      source: "RESTAURANT",
      lines: [
        { name: "Chef's Special Kacchi Biryani", qty: 2, unitPrice: 380, discountAmount: 0, category: "Main Course" },
        { name: "Grilled BBQ Chicken Quarter", qty: 1, unitPrice: 220, discountAmount: 0, category: "Grilled" },
        { name: "Special Garlic Naan", qty: 3, unitPrice: 45, discountAmount: 0, category: "Bread" },
        { name: "Fresh Mint Lemonade", qty: 2, unitPrice: 90, discountAmount: 0, category: "Beverage" },
      ],
      subtotal: 1295,
      discountTotal: 50,
      taxTotal: 186.75,
      serviceCharge: 49.8,
      total: 1481.55,
      status: "ACTIVE",
      customerName: "Rahim Uddin",
      customerTier: "Gold Member",
      customerPoints: 120,
      tableNo: "Table 04",
      orderType: "DINE_IN",
      cashierName: "Staff 1",
    };
    publishRestaurantCart(demoCart);
    setCart(demoCart);
  };

  const handleClearCart = () => {
    const empty: DisplayCart = {
      updatedAt: Date.now(),
      source: "RESTAURANT",
      lines: [],
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      serviceCharge: 0,
      total: 0,
      status: "IDLE",
    };
    publishRestaurantCart(empty);
    setCart(empty);
  };

  // ── THANK YOU MODAL ──
  if (showThankYou) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #c2410c 0%, #ea580c 45%, #dc2626 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-5 text-center px-8 text-white animate-in zoom-in-95 duration-300">
          <div className="text-8xl leading-none animate-bounce">🙏</div>
          <h1 className="text-6xl font-black tracking-tight" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
            Thank You!
          </h1>
          <p className="text-2xl font-bold opacity-95">
            {customerName ? `ধন্যবাদ, ${customerName}!` : "Payment Successful!"}
          </p>
          <p className="text-lg opacity-85">Thank you for dining with us! Enjoy your meal.</p>
          <div className="mt-4 px-6 py-2.5 rounded-full bg-white/20 border border-white/30 backdrop-blur font-bold text-sm">
            {tableNo} • Total Paid: {fmt(total)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #fed7aa; border-radius: 4px; }
      `}</style>

      {/* ══ FULLSCREEN CONTAINER WITH RESTAURANT COLOR PATTERN (#ea580c / #ffedd5 / #fff7ed) ══ */}
      <div
        id="restaurant-customer-display"
        className="fixed inset-0 flex flex-col justify-between overflow-hidden p-5 select-none"
        style={{
          background: "linear-gradient(180deg, #ffedd5 0%, #fff7ed 15%, #f8fafc 100%)",
        }}
      >
        <div className="flex flex-col gap-3 flex-1 min-h-0 max-w-[1700px] w-full mx-auto">
          {/* ══ 1. TOP HEADER (White rounded floating card matching reference layout) ══ */}
          <header className="rounded-2xl border border-orange-200/80 bg-white shadow-xs px-6 py-3 flex items-center justify-between shrink-0">
            {/* Left: Brand Icon + Title + Table/Lane + Subtitle */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 bg-orange-50 border-orange-200 text-orange-600 shadow-2xs">
                <Utensils size={22} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-lg leading-tight tracking-tight">
                    {merchantName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider text-white bg-orange-600 shadow-2xs">
                    {tableNo}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    CUSTOMER DISPLAY TERMINAL
                  </span>
                  <span className="text-gray-300">•</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-[11px] font-bold",
                      online ? "text-orange-600" : "text-rose-500"
                    )}
                  >
                    <Wifi size={12} />
                    {online ? (hasItems ? "POS Live Synced" : "POS Connected • Live") : "POS Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Live Clock Capsule */}
            <div className="hidden md:flex items-center">
              <LiveClockCapsule />
            </div>

            {/* Right: Quick Demo + Sound + Fullscreen */}
            <div className="flex items-center gap-2">
              {hasItems ? (
                <button
                  onClick={handleClearCart}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition shadow-2xs cursor-pointer"
                  title="Clear Cart"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              ) : (
                <button
                  onClick={handleQuickDemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold transition shadow-2xs cursor-pointer"
                  title="Load sample restaurant order"
                >
                  <PlusCircle size={13} className="text-orange-600" />
                  <span>Demo Order</span>
                </button>
              )}

              <button
                id="cdisp-sound"
                onClick={() => setSoundOn((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-gray-600 hover:text-orange-600 hover:border-orange-300 transition shadow-2xs cursor-pointer"
                title={soundOn ? "Mute" : "Enable sound"}
              >
                {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>

              <button
                id="cdisp-fullscreen"
                onClick={toggleFs}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition shadow-2xs cursor-pointer"
                title="Toggle fullscreen"
              >
                {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
            </div>
          </header>

          {/* ══ 2. WELCOME BANNER (White rounded card with Restaurant Orange Accent) ══ */}
          <div className="rounded-2xl border border-orange-100 bg-white shadow-xs px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full font-black text-lg shadow-2xs shrink-0 bg-orange-100 text-orange-700 border border-orange-200">
                {(customerName || tableNo || "G").charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-base">
                    {customerName ? `Welcome back, ${customerName}!` : `Welcome to ${tableNo}!`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    {customerTier}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-2">
                  <span>Loyalty Balance: {customerPoints} Pts</span>
                  <span>•</span>
                  <span>Server: {cashierName}</span>
                </div>
              </div>
            </div>

            {hasItems ? (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
                🟢 Live Order Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-gray-500 border border-slate-200">
                Waiting for order scan…
              </span>
            )}
          </div>

          {/* ══ 3. TWO-PANEL MAIN CONTENT (Exact 2-column layout from image) ══ */}
          <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
            {/* ── LEFT PANEL: Basket Items (~58% width, col-span-7) ── */}
            <div className="col-span-12 lg:col-span-7 rounded-2xl border border-orange-100 bg-white shadow-xs p-5 flex flex-col min-h-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 bg-orange-50 border-orange-200 text-orange-600 shadow-2xs">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-gray-900 text-base leading-none">
                      Basket Items
                    </h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Live scan itemization</p>
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
                  {lines.reduce((s, l) => s + l.qty, 0)} {lines.reduce((s, l) => s + l.qty, 0) === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Scrollable Item Rows */}
              <div className="flex-1 overflow-y-auto pt-3.5 pr-1 space-y-3">
                {hasItems ? (
                  lines.map((line, idx) => {
                    const lineTotal = (line.unitPrice - (line.discountAmount ?? 0)) * line.qty;

                    return (
                      <div
                        key={line.sku || `${line.name}-${idx}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs hover:border-orange-200 transition"
                      >
                        {/* Left: Food Emoji/Image + Name + Qty */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                          {line.image ? (
                            <img
                              src={line.image}
                              alt={line.name}
                              className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-2xl shadow-2xs">
                              {getFoodEmoji(line.name, idx)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-xs shrink-0">
                                {line.qty}x
                              </span>
                              <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                                {line.name}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400 font-medium">
                                {fmt(line.unitPrice)} / unit
                              </span>
                              {line.category && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-semibold border border-orange-100">
                                  {line.category}
                                </span>
                              )}
                              {line.notes && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-gray-600 font-medium truncate max-w-[200px]">
                                  {line.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Line Total + TOTAL caption */}
                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-black text-base text-gray-900 tracking-tight">
                            {fmt(lineTotal)}
                          </span>
                          <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase mt-0.5">
                            TOTAL
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Empty state when no items in POS */
                  <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center p-6 text-gray-400">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200 text-orange-500 mb-3 shadow-2xs">
                      <Utensils size={30} />
                    </div>
                    <h3 className="font-extrabold text-gray-800 text-base">Your Basket is Empty</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                      Please wait for the server to take your order. Items added in POS will appear here live in real time.
                    </p>
                    <div className="mt-4 px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                      Live Terminal Ready • {tableNo}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT PANEL: Order Summary & Amount Due (~42% width, col-span-5) ── */}
            <div className="col-span-12 lg:col-span-5 rounded-2xl border border-orange-100 bg-white shadow-xs p-5 flex flex-col justify-between min-h-0 overflow-y-auto">
              <div>
                {/* Header */}
                <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
                  <CreditCard size={16} className="text-orange-600" />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    ORDER SUMMARY
                  </span>
                </div>

                {/* Subtotal / Tax rows */}
                <div className="py-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-800">{fmt(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">VAT / Tax (15%)</span>
                    <span className="font-bold text-gray-800">{fmt(tax)}</span>
                  </div>

                  {serviceCharge > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Service Charge (4%)</span>
                      <span className="font-bold text-gray-800">{fmt(serviceCharge)}</span>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-600 font-semibold">🎁 Discount</span>
                      <span className="font-bold text-emerald-600">-{fmt(discount)}</span>
                    </div>
                  )}
                </div>

                {/* ── HERO AMOUNT DUE CARD (Rich Restaurant Orange Theme) ── */}
                <div
                  className="rounded-2xl p-5 text-white shadow-md my-2"
                  style={{
                    backgroundColor: "#ea580c",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-orange-100">
                      AMOUNT DUE
                    </span>
                    <span className="text-xs font-bold text-orange-100">
                      BDT (৳)
                    </span>
                  </div>
                  <div className="text-5xl font-black text-white tracking-tight leading-none mt-2">
                    {fmt(total)}
                  </div>
                </div>

                {/* ── PAYMENT OPTIONS (5 button tabs matching image) ── */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                      PAYMENT OPTIONS
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                      POS Checkout
                    </span>
                  </div>

                  {/* 5 Tab buttons */}
                  <div className="grid grid-cols-5 gap-1.5 mb-3">
                    {(
                      [
                        { key: "cash", label: "Cash" },
                        { key: "card", label: "Card" },
                        { key: "qr", label: "UPI / QR" },
                        { key: "wallet", label: "Wallet" },
                        { key: "split", label: "Split" },
                      ] as const
                    ).map((m) => {
                      const isActive = selectedPayment === m.key;
                      return (
                        <button
                          key={m.key}
                          id={`cdisp-tab-${m.key}`}
                          onClick={() => setSelectedPayment(m.key)}
                          className={cn(
                            "py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border",
                            isActive
                              ? "bg-orange-600 text-white border-transparent shadow-xs"
                              : "bg-slate-50 text-gray-600 border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                          )}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Clean QR Code Card matching reference image */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-orange-100 bg-orange-50/40">
                    <div
                      className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs"
                      dangerouslySetInnerHTML={{ __html: qrSvg(qrPayload, 155) }}
                    />
                    <p className="text-xs font-bold text-gray-700 mt-2.5">Scan to Pay with bKash / Nagad</p>
                    <p className="text-[10px] text-gray-400 font-medium">Instant & Secure Payment</p>
                  </div>
                </div>
              </div>

              {/* Bottom micro notice */}
              <div className="flex items-center justify-center gap-1.5 pt-3 text-gray-400 text-xs font-medium border-t border-slate-100">
                <SmilePlus size={14} className="text-orange-500" />
                <span>Thank you for dining with us!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
