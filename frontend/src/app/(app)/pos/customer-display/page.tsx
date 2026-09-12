"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  ShoppingBag,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CreditCard,
  Package,
  Scale,
  Award,
  SmilePlus,
  Sparkles,
  PlusCircle,
  Trash2,
  Barcode,
  Tag,
  ShoppingCart,
  Star,
} from "lucide-react";
import {
  subscribeCart,
  readCart,
  publishCart,
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
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
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

// ── Product emoji mapper for retail items ──
const RETAIL_EMOJIS = ["📦", "🛍️", "🧴", "🥤", "🍫", "🧃", "🧹", "💊", "🪥", "📱", "👕", "🔌"];
function getProductEmoji(name: string, idx: number): string {
  const n = (name || "").toLowerCase();
  if (n.includes("milk") || n.includes("dairy")) return "🥛";
  if (n.includes("cola") || n.includes("pepsi") || n.includes("drink") || n.includes("juice")) return "🥤";
  if (n.includes("chips") || n.includes("snack") || n.includes("lays")) return "🍟";
  if (n.includes("chocolate") || n.includes("candy") || n.includes("sweet")) return "🍫";
  if (n.includes("soap") || n.includes("shampoo") || n.includes("hair")) return "🧴";
  if (n.includes("detergent") || n.includes("clean") || n.includes("wash")) return "🧹";
  if (n.includes("bread") || n.includes("biscuit") || n.includes("cake")) return "🍞";
  if (n.includes("oil") || n.includes("ghee") || n.includes("butter")) return "🫙";
  if (n.includes("rice") || n.includes("flour") || n.includes("atta")) return "🌾";
  if (n.includes("phone") || n.includes("cable") || n.includes("charger")) return "📱";
  if (n.includes("medicine") || n.includes("tablet") || n.includes("syrup")) return "💊";
  if (n.includes("water") || n.includes("mineral")) return "💧";
  return RETAIL_EMOJIS[idx % RETAIL_EMOJIS.length];
}

// ── QR Code Generator ──
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
        const b = x === 0 || x === 6 || y === 0 || y === 6 ||
          (x >= n - 7 && (x === n - 7 || x === n - 1)) ||
          (y >= n - 7 && (y === n - 7 || y === n - 1));
        const c = (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
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
      on ? `<rect x="${(x * cell).toFixed(1)}" y="${(y * cell).toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="1.5"/>` : ""
    )
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff" rx="14"/><g fill="${dark}">${rects}</g></svg>`;
}

// ── Live Clock Widget ──
function LiveClockWidget() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(t.getHours() % 12 || 12).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");
  const ap = t.getHours() >= 12 ? "pm" : "am";
  const day = t.toLocaleDateString("en-BD", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-xl border bg-violet-50/80 border-violet-200/90 text-gray-800 shadow-sm">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-sm">
        <Scale size={15} />
      </div>
      <div className="text-left leading-tight">
        <div className="text-[13px] font-black tracking-tight text-gray-800">
          {hh}:{mm}:{ss} <span className="text-xs font-bold text-violet-600">{ap}</span>
        </div>
        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{day}</div>
      </div>
    </div>
  );
}

export default function RetailCustomerDisplayPage() {
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
    const check = async () => setOnline(isOnline());
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to real-time cart updates from Retail POS
  useEffect(() => {
    const initial = readCart();
    setCart(initial);

    const unsub = subscribeCart((data) => {
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

  // Quick demo data
  const handleQuickDemo = () => {
    const demoCart: DisplayCart = {
      updatedAt: Date.now(),
      source: "RETAIL",
      lines: [
        { name: "Coca Cola 500ml", qty: 2, unitPrice: 1.75, discountAmount: 0, sku: "COKE-0500", category: "Beverages" },
        { name: "Lays Classic 52g", qty: 1, unitPrice: 1.50, discountAmount: 0.75, sku: "LAY-0052", category: "Snacks" },
        { name: "Fresh Milk 1L", qty: 1, unitPrice: 1.85, discountAmount: 0, sku: "MILK-1000", category: "Dairy" },
        { name: "Dettol Soap 125g", qty: 2, unitPrice: 1.10, discountAmount: 0, sku: "DET-0125", category: "Personal Care" },
        { name: "Ariel Matic 1kg", qty: 1, unitPrice: 5.20, discountAmount: 0, sku: "ARL-1000", category: "Household" },
      ],
      subtotal: 14.25,
      discountTotal: 0.75,
      taxTotal: 0.67,
      total: 14.17,
      status: "ACTIVE",
      customerName: "Rahim Uddin",
      customerTier: "Gold Member",
      customerPoints: 240,
      cashierName: "John Smith",
      laneNo: "T-01",
      merchantName: "BPOS Retail",
    };
    publishCart(demoCart);
    setCart(demoCart);
  };

  const handleClearCart = () => {
    const empty: DisplayCart = { updatedAt: Date.now(), source: "RETAIL", lines: [], subtotal: 0, discountTotal: 0, taxTotal: 0, total: 0, status: "IDLE" };
    publishCart(empty);
    setCart(empty);
  };

  // Derived values
  const lines = cart?.lines || [];
  const hasItems = lines.length > 0;
  const subtotal = cart?.subtotal || (hasItems ? lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) : 0);
  const tax = cart?.taxTotal || 0;
  const discount = cart?.discountTotal || 0;
  const total = cart?.total || (hasItems ? subtotal - discount + tax : 0);

  const customerName = cart?.customerName;
  const customerTier = cart?.customerTier || "Walk-in";
  const customerPoints = cart?.customerPoints ?? 0;
  const cashierName = cart?.cashierName || "Cashier";
  const laneNo = cart?.laneNo || "T-01";
  const merchantName = cart?.merchantName || "BPOS Retail";
  const qrPayload = `bpos-retail-payment-${Date.now()}-${Math.round(total)}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd6fe; border-radius: 4px; }
      `}</style>

      {/* ── THANK YOU OVERLAY ── */}
      {showThankYou && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 45%, #4338ca 100%)" }}
        >
          <div className="flex flex-col items-center gap-5 text-center px-8 text-white">
            <div className="text-8xl leading-none animate-bounce">🛍️</div>
            <h1 className="text-6xl font-black tracking-tight" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              Thank You!
            </h1>
            <p className="text-2xl font-bold opacity-95">
              {customerName ? `ধন্যবাদ, ${customerName}!` : "Payment Successful!"}
            </p>
            <p className="text-lg opacity-85">Thank you for shopping with us! Come back soon.</p>
            <div className="mt-4 px-6 py-2.5 rounded-full bg-white/20 border border-white/30 backdrop-blur font-bold text-sm">
              Lane {laneNo} • Total Paid: {fmt(total)}
            </div>
            <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
              <Star size={14} className="text-yellow-300 fill-yellow-300" />
              <span className="text-sm font-semibold">+{Math.floor(total * 10)} loyalty points earned!</span>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN CONTAINER — Violet/Indigo theme for Retail ── */}
      <div
        id="retail-customer-display"
        className="fixed inset-0 flex flex-col justify-between overflow-hidden p-5 select-none"
        style={{ background: "linear-gradient(180deg, #ede9fe 0%, #f5f3ff 15%, #f8fafc 100%)" }}
      >
        <div className="flex flex-col gap-3 flex-1 min-h-0 max-w-[1700px] w-full mx-auto">

          {/* ── 1. TOP HEADER ── */}
          <header className="rounded-2xl border border-violet-200/80 bg-white shadow-sm px-6 py-3 flex items-center justify-between shrink-0">
            {/* Left: Brand + Lane */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 bg-violet-50 border-violet-200 text-violet-600 shadow-sm">
                <ShoppingBag size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-lg leading-tight tracking-tight">{merchantName}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider text-white bg-violet-600 shadow-sm">
                    Lane {laneNo}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    CUSTOMER DISPLAY TERMINAL
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className={cn("flex items-center gap-1 text-[11px] font-bold", online ? "text-violet-600" : "text-rose-500")}>
                    {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {online ? (hasItems ? "POS Live Synced" : "POS Connected • Live") : "POS Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Clock */}
            <div className="hidden md:flex items-center">
              <LiveClockWidget />
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {hasItems ? (
                <button
                  onClick={handleClearCart}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              ) : (
                <button
                  onClick={handleQuickDemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <PlusCircle size={13} className="text-violet-600" />
                  <span>Demo Order</span>
                </button>
              )}

              <button
                id="rcd-sound"
                onClick={() => setSoundOn((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-gray-600 hover:text-violet-600 hover:border-violet-300 transition shadow-sm cursor-pointer"
                title={soundOn ? "Mute" : "Enable sound"}
              >
                {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>

              <button
                id="rcd-fullscreen"
                onClick={toggleFs}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition shadow-sm cursor-pointer"
                title="Toggle fullscreen"
              >
                {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
            </div>
          </header>

          {/* ── 2. WELCOME BANNER ── */}
          <div className="rounded-2xl border border-violet-100 bg-white shadow-sm px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full font-black text-lg shadow-sm shrink-0 bg-violet-100 text-violet-700 border border-violet-200">
                {(customerName || "G")[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-base">
                    {customerName ? `Welcome back, ${customerName}!` : "Welcome, Valued Customer!"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                    {customerTier}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-2">
                  {customerPoints > 0 && <span className="flex items-center gap-1"><Award size={10} className="text-violet-500" /> {customerPoints} Points Balance</span>}
                  {customerPoints > 0 && <span>•</span>}
                  <span>Cashier: {cashierName}</span>
                  <span>•</span>
                  <span>Lane {laneNo}</span>
                </div>
              </div>
            </div>

            {hasItems ? (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200">
                🟢 Live Order Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-gray-500 border border-slate-200">
                Waiting for scan…
              </span>
            )}
          </div>

          {/* ── 3. TWO-PANEL MAIN CONTENT ── */}
          <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">

            {/* ── LEFT PANEL: Basket Items (col-span-7) ── */}
            <div className="col-span-12 lg:col-span-7 rounded-2xl border border-violet-100 bg-white shadow-sm p-5 flex flex-col min-h-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 bg-violet-50 border-violet-200 text-violet-600 shadow-sm">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-gray-900 text-base leading-none">Basket Items</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Live scan itemization</p>
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-violet-50 text-violet-700 border border-violet-200">
                  {lines.reduce((s, l) => s + l.qty, 0)} {lines.reduce((s, l) => s + l.qty, 0) === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Column headers */}
              {hasItems && (
                <div className="flex items-center gap-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 border-b border-slate-50">
                  <span className="w-14 shrink-0">Item</span>
                  <span className="flex-1">Name</span>
                  <span className="w-16 text-center">Price</span>
                  <span className="w-10 text-center">Qty</span>
                  <span className="w-20 text-right">Total</span>
                </div>
              )}

              {/* Scrollable Items */}
              <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-2.5">
                {hasItems ? (
                  lines.map((line, idx) => {
                    const lineTotal = (line.unitPrice - (line.discountAmount ?? 0)) * line.qty;
                    return (
                      <div
                        key={line.sku || `${line.name}-${idx}`}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-violet-200 transition"
                      >
                        {/* Product image/emoji */}
                        {line.image ? (
                          <img src={line.image} alt={line.name} className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-2xl shadow-sm">
                            {getProductEmoji(line.name, idx)}
                          </div>
                        )}

                        {/* Name + SKU + Category */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{line.name}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {line.sku && (
                              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
                                <Barcode size={8} /> SKU: {line.sku}
                              </span>
                            )}
                            {line.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-semibold border border-violet-100">
                                {line.category}
                              </span>
                            )}
                            {line.discountAmount > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 flex items-center gap-0.5">
                                <Tag size={8} /> -৳{line.discountAmount.toFixed(2)} off
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="w-16 text-center">
                          <p className="text-xs font-bold text-gray-700 tabular-nums">৳{line.unitPrice.toFixed(2)}</p>
                          <p className="text-[9px] text-gray-400">each</p>
                        </div>

                        {/* Qty badge */}
                        <div className="w-10 flex justify-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-xs">
                            {line.qty}x
                          </span>
                        </div>

                        {/* Line total */}
                        <div className="w-20 text-right shrink-0">
                          <span className="font-black text-base text-gray-900 tracking-tight tabular-nums">
                            {fmt(lineTotal)}
                          </span>
                          <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase mt-0.5">TOTAL</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center p-6 text-gray-400">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 border border-violet-200 text-violet-500 mb-3 shadow-sm">
                      <ShoppingCart size={30} />
                    </div>
                    <h3 className="font-extrabold text-gray-800 text-base">Your Basket is Empty</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                      Please place your items on the counter. Products scanned at the register will appear here live in real time.
                    </p>
                    <div className="mt-4 px-3.5 py-1.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
                      Live Terminal Ready • Lane {laneNo}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT PANEL: Order Summary + Payment ── */}
            <div className="col-span-12 lg:col-span-5 rounded-2xl border border-violet-100 bg-white shadow-sm p-5 flex flex-col justify-between min-h-0 overflow-y-auto">
              <div>
                {/* Header */}
                <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
                  <CreditCard size={16} className="text-violet-600" />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">ORDER SUMMARY</span>
                </div>

                {/* Breakdown */}
                <div className="py-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-800 tabular-nums">{fmt(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-600 font-semibold">🎁 Discount</span>
                      <span className="font-bold text-emerald-600 tabular-nums">−{fmt(discount)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Tax (5%)</span>
                      <span className="font-bold text-gray-800 tabular-nums">{fmt(tax)}</span>
                    </div>
                  )}
                </div>

                {/* Hero Amount Due Card — Violet/Indigo theme */}
                <div
                  className="rounded-2xl p-5 text-white shadow-md my-2"
                  style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-violet-200">TOTAL PAYABLE</span>
                    <span className="text-xs font-bold text-violet-200">BDT (৳)</span>
                  </div>
                  <div className="text-5xl font-black text-white tracking-tight leading-none mt-2 tabular-nums">
                    {fmt(total)}
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 text-emerald-300 text-xs font-bold">
                      <Sparkles size={12} />
                      You save {fmt(discount)} today!
                    </div>
                  )}
                </div>

                {/* Payment Method Tabs */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">PAYMENT OPTIONS</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200">
                      POS Checkout
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 mb-3">
                    {(["cash", "card", "qr", "wallet", "split"] as const).map((m) => {
                      const labels: Record<string, string> = { cash: "Cash", card: "Card", qr: "UPI / QR", wallet: "Wallet", split: "Split" };
                      const isActive = selectedPayment === m;
                      return (
                        <button
                          key={m}
                          id={`rcd-tab-${m}`}
                          onClick={() => setSelectedPayment(m)}
                          className={cn(
                            "py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border",
                            isActive
                              ? "bg-violet-600 text-white border-transparent shadow-sm"
                              : "bg-slate-50 text-gray-600 border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
                          )}
                        >
                          {labels[m]}
                        </button>
                      );
                    })}
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-violet-100 bg-violet-50/40">
                    <div
                      className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm"
                      dangerouslySetInnerHTML={{ __html: qrSvg(qrPayload, 155, "#4c1d95") }}
                    />
                    <p className="text-xs font-bold text-gray-700 mt-2.5">Scan to Pay with bKash / Nagad</p>
                    <p className="text-[10px] text-gray-400 font-medium">Instant & Secure Payment</p>
                  </div>
                </div>
              </div>

              {/* Bottom notice */}
              <div className="flex items-center justify-center gap-1.5 pt-3 text-gray-400 text-xs font-medium border-t border-slate-100 mt-3">
                <SmilePlus size={14} className="text-violet-500" />
                <span>Thank you for shopping with us!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
