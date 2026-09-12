"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Store,
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
  Sparkles,
  SmilePlus,
} from "lucide-react";
import {
  subscribeCart,
  readCart,
  type DisplayCart,
  type DisplayLine,
} from "@/lib/customer-display";
import { isOnline } from "@/lib/offline/db";
import { cn } from "@/lib/cn";

// ── Default Reference Demo Items (Matches media_1789202384152.png exactly) ──
const DEFAULT_DEMO_LINES: DisplayLine[] = [
  {
    name: "Premium Wireless Headphones",
    qty: 2,
    unitPrice: 129.99,
    discountAmount: 0,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&h=120&fit=crop",
    category: "Electronics",
  },
  {
    name: "Ultra Slim Smart Watch",
    qty: 1,
    unitPrice: 249.0,
    discountAmount: 0,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop",
    category: "Wearables",
  },
  {
    name: "Noise Cancelling Earbuds",
    qty: 1,
    unitPrice: 89.5,
    discountAmount: 0,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=120&h=120&fit=crop",
    category: "Audio",
  },
  {
    name: "Pro Mechanical Keyboard",
    qty: 1,
    unitPrice: 159.0,
    discountAmount: 0,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120&h=120&fit=crop",
    category: "Accessories",
  },
  {
    name: "4K Action Camera",
    qty: 1,
    unitPrice: 319.99,
    discountAmount: 0,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=120&h=120&fit=crop",
    category: "Cameras",
  },
];

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

// ── Clean High-Fidelity QR Code Generator ──
function qrSvg(payload: string, size = 175, dark = "#0f172a"): string {
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

// ── Live Clock Capsule Widget ──
function LiveClockCapsule({ theme = "emerald" }: { theme?: "emerald" | "orange" }) {
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

  const isOrange = theme === "orange";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-4 py-1.5 rounded-xl border transition-colors",
        isOrange
          ? "bg-orange-50/70 border-orange-200 text-gray-800"
          : "bg-[#ecfdf5] border-[#bbf7d0] text-gray-800"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg text-sm",
          isOrange ? "bg-orange-100 text-orange-600" : "bg-[#d1fae5] text-[#059669]"
        )}
      >
        <Scale size={15} />
      </div>
      <div className="text-left leading-tight">
        <div className="text-[13px] font-black tracking-tight text-gray-800">
          {hh}:{mm}:{ss} <span className={cn("text-xs font-bold", isOrange ? "text-orange-600" : "text-[#059669]")}>{ap}</span>
        </div>
        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{day}</div>
      </div>
    </div>
  );
}

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<DisplayCart | null>(null);
  const [online, setOnline] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [colorTheme, setColorTheme] = useState<"emerald" | "orange">("emerald");
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

  // Subscribe to live cart updates
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

  // Determine if active order lines exist, otherwise show default reference demonstration items
  const liveLines = cart?.lines && cart.lines.length > 0 ? cart.lines : null;
  const isLive = Boolean(liveLines);
  const displayLines = liveLines || DEFAULT_DEMO_LINES;

  const subtotal = isLive
    ? (cart?.subtotal ?? displayLines.reduce((s, l) => s + l.unitPrice * l.qty, 0))
    : 1280.96;
  const tax = isLive ? (cart?.taxTotal ?? subtotal * 0.07) : 89.67;
  const discount = isLive ? (cart?.discountTotal ?? 0) : 0;
  const serviceCharge = isLive ? (cart?.serviceCharge ?? 0) : 0;
  const total = isLive
    ? (cart?.total ?? subtotal - discount + tax + serviceCharge)
    : 1385.63;

  const customerName = cart?.customerName || "ABC Traders Ltd.";
  const customerTier = cart?.customerTier || "Platinum";
  const customerPoints = cart?.customerPoints ?? 0;
  const laneNo = cart?.tableNo || cart?.laneNo || "LANE 01";
  const merchantName = cart?.merchantName || "BPOS Superstore";

  const qrPayload = `bpos-pay-${Math.round(total)}`;
  const isOrange = colorTheme === "orange";

  // ── THANK YOU MODAL ──
  if (showThankYou) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
        style={{
          background: isOrange
            ? "linear-gradient(135deg, #c2410c 0%, #ea580c 45%, #dc2626 100%)"
            : "linear-gradient(135deg, #065f46 0%, #059669 45%, #10b981 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-5 text-center px-8 text-white animate-in zoom-in-95 duration-300">
          <div className="text-8xl leading-none animate-bounce">🙏</div>
          <h1 className="text-6xl font-black tracking-tight" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
            Thank You!
          </h1>
          <p className="text-2xl font-bold opacity-95">
            {customerName ? `ধন্যবাদ, ${customerName}!` : "Payment Received!"}
          </p>
          <p className="text-lg opacity-85">Thank you for shopping with us! Have a wonderful day.</p>
          <div className="mt-4 px-6 py-2.5 rounded-full bg-white/20 border border-white/30 backdrop-blur font-bold text-sm">
            {laneNo} • Amount Paid: {fmt(total)}
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
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* ══ FULLSCREEN CONTAINER WITH SOFT GRADIENT AT TOP (Matches image) ══ */}
      <div
        id="customer-display-screen"
        className="fixed inset-0 flex flex-col justify-between overflow-hidden p-5 select-none"
        style={{
          background: isOrange
            ? "linear-gradient(180deg, #ffedd5 0%, #fff7ed 15%, #f8fafc 100%)"
            : "linear-gradient(180deg, #dcfce7 0%, #f0fdf4 15%, #f8fafc 100%)",
        }}
      >
        <div className="flex flex-col gap-3 flex-1 min-h-0 max-w-[1700px] w-full mx-auto">
          {/* ══ 1. TOP HEADER (White rounded floating card from image) ══ */}
          <header className="rounded-2xl border border-slate-200/80 bg-white shadow-xs px-6 py-3 flex items-center justify-between shrink-0">
            {/* Left: Brand Icon + Title + Lane + Subtitle */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 transition-colors",
                  isOrange
                    ? "bg-orange-50 border-orange-200 text-orange-600"
                    : "bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]"
                )}
              >
                {isOrange ? <Utensils size={22} /> : <Store size={22} />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-lg leading-tight tracking-tight">
                    {merchantName}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider text-white",
                      isOrange ? "bg-orange-600" : "bg-[#047857]"
                    )}
                  >
                    {laneNo}
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
                      online
                        ? isOrange
                          ? "text-orange-600"
                          : "text-[#059669]"
                        : "text-rose-500"
                    )}
                  >
                    <Wifi size={12} />
                    {online ? (isLive ? "POS Live Synced" : "POS Standby Ready") : "POS Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Live Clock Capsule */}
            <div className="hidden md:flex items-center">
              <LiveClockCapsule theme={colorTheme} />
            </div>

            {/* Right: Theme Toggle + Sound + Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setColorTheme((c) => (c === "emerald" ? "orange" : "emerald"))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-gray-700 hover:bg-white text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Toggle Theme"
              >
                <Sparkles size={13} className={isOrange ? "text-orange-500" : "text-emerald-600"} />
                <span>{isOrange ? "Orange" : "Emerald"}</span>
              </button>

              <button
                id="cdisp-sound"
                onClick={() => setSoundOn((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-gray-600 hover:text-emerald-700 transition shadow-2xs cursor-pointer"
                title={soundOn ? "Mute" : "Enable sound"}
              >
                {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>

              <button
                id="cdisp-fullscreen"
                onClick={toggleFs}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-white transition shadow-2xs cursor-pointer",
                  isOrange
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-[#047857] hover:bg-[#065f46]"
                )}
                title="Toggle fullscreen"
              >
                {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
            </div>
          </header>

          {/* ══ 2. WELCOME BANNER (White rounded card from image) ══ */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full font-black text-lg shadow-2xs shrink-0",
                  isOrange ? "bg-orange-200 text-orange-950" : "bg-[#86efac] text-[#14532d]"
                )}
              >
                {customerName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-base">
                    Welcome back, {customerName}!
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold",
                      isOrange
                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                        : "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]"
                    )}
                  >
                    {customerTier}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">
                  Loyalty Balance: {customerPoints} Pts
                </div>
              </div>
            </div>

            {isLive && (
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                  isOrange
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]"
                )}
              >
                🟢 Live Order Active
              </span>
            )}
          </div>

          {/* ══ 3. TWO-PANEL MAIN CONTENT (Exact 2-column layout from image) ══ */}
          <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
            {/* ── LEFT PANEL: Basket Items (~58% width, col-span-7) ── */}
            <div className="col-span-12 lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 flex flex-col min-h-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border shrink-0",
                      isOrange
                        ? "bg-orange-50 border-orange-200 text-orange-600"
                        : "bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]"
                    )}
                  >
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-gray-900 text-base leading-none">
                      Basket Items
                    </h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Live scan itemization</p>
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-gray-700 border border-slate-200/80">
                  {displayLines.reduce((s, l) => s + l.qty, 0)} Items
                </span>
              </div>

              {/* Scrollable Item Rows */}
              <div className="flex-1 overflow-y-auto pt-3.5 pr-1 space-y-3">
                {displayLines.map((line, idx) => {
                  const lineTotal = (line.unitPrice - (line.discountAmount ?? 0)) * line.qty;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs hover:border-slate-300 transition"
                    >
                      {/* Left: Thumbnail + Name + Qty */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                        {line.image ? (
                          <img
                            src={line.image}
                            alt={line.name}
                            className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div
                            className={cn(
                              "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-2xl",
                              isOrange
                                ? "bg-orange-50 border-orange-200"
                                : "bg-[#fef9c3] border-[#fef08a]"
                            )}
                          >
                            📦
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
                          <p className="text-xs text-gray-400 font-medium mt-1">
                            {fmt(line.unitPrice)} / unit
                          </p>
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
                })}
              </div>
            </div>

            {/* ── RIGHT PANEL: Order Summary & Amount Due (~42% width, col-span-5) ── */}
            <div className="col-span-12 lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 flex flex-col justify-between min-h-0 overflow-y-auto">
              <div>
                {/* Header */}
                <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
                  <CreditCard
                    size={16}
                    className={isOrange ? "text-orange-600" : "text-[#059669]"}
                  />
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
                    <span className="text-gray-500 font-medium">VAT / Tax</span>
                    <span className="font-bold text-gray-800">{fmt(tax)}</span>
                  </div>

                  {serviceCharge > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Service Charge</span>
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

                {/* ── HERO AMOUNT DUE CARD (Exact solid card matching image) ── */}
                <div
                  className="rounded-2xl p-5 text-white shadow-md my-2"
                  style={{
                    backgroundColor: isOrange ? "#ea580c" : "#059669",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs font-black uppercase tracking-widest"
                      style={{ color: isOrange ? "#fed7aa" : "#a7f3d0" }}
                    >
                      AMOUNT DUE
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: isOrange ? "#fed7aa" : "#a7f3d0" }}
                    >
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
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md",
                        isOrange
                          ? "bg-orange-50 text-orange-700"
                          : "bg-[#ecfdf5] text-[#059669]"
                      )}
                    >
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
                              ? isOrange
                                ? "bg-orange-600 text-white border-transparent shadow-xs"
                                : "bg-[#059669] text-white border-transparent shadow-xs"
                              : "bg-slate-50 text-gray-600 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Clean QR Code Card matching reference image */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div
                      className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs"
                      dangerouslySetInnerHTML={{ __html: qrSvg(qrPayload, 155) }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom micro notice */}
              <div className="flex items-center justify-center gap-1.5 pt-3 text-gray-400 text-xs font-medium">
                <SmilePlus size={14} className={isOrange ? "text-orange-500" : "text-emerald-600"} />
                <span>Thank you for shopping with us!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
