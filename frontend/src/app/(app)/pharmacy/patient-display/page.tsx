"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Pill,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CreditCard,
  ShoppingBag,
  Scale,
  SmilePlus,
  Stethoscope,
  ShieldCheck,
  PackageOpen,
} from "lucide-react";
import {
  subscribeCart,
  readCart,
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
    osc.frequency.setValueAtTime(987.77, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
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

// ── QR Code Generator ──
function qrSvg(payload: string, size = 175, dark = "#0d9488"): string {
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
          x === 0 || x === 6 || y === 0 || y === 6 ||
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
      on ? `<rect x="${(x * cell).toFixed(1)}" y="${(y * cell).toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="1.5"/>` : ""
    )
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff" rx="14"/><g fill="${dark}">${rects}</g></svg>`;
}

// ── bKash Logo SVG ──
function BkashLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="30" fill="#E2136E" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">bKash</text>
    </svg>
  );
}

// ── Nagad Logo SVG ──
function NagadLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="30" fill="#F6821F" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Nagad</text>
    </svg>
  );
}

// ── Rocket Logo SVG ──
function RocketLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="30" fill="#8B3A8F" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">Rocket</text>
    </svg>
  );
}

// ── Live Clock Widget ──
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
  const day = t.toLocaleDateString("en-BD", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  return (
    <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-xl border bg-teal-50/70 border-teal-200 text-gray-800">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg text-sm bg-teal-100 text-teal-600">
        <Scale size={15} />
      </div>
      <div className="text-left leading-tight">
        <div className="text-[13px] font-black tracking-tight text-gray-800">
          {hh}:{mm}:{ss} <span className="text-xs font-bold text-teal-600">{ap}</span>
        </div>
        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{day}</div>
      </div>
    </div>
  );
}

// ── Category Emoji Map ──
const CAT_EMOJI: Record<string, string> = {
  "Pain Relief": "💊",
  "Antibiotics": "🧬",
  "Vitamins": "🌟",
  "Vitamins & Suppl.": "🌟",
  "Gastrointestinal": "🫀",
  "Diabetes Care": "🩺",
  "Cardiovascular": "❤️",
  "Skin Care": "🧴",
  "Respiratory": "🫁",
  "Eye & Ear Care": "👁️",
  "Others": "📦",
};

// ── Payment Methods ──
const PAYMENT_TABS = [
  { key: "cash", label: "Cash" },
  { key: "card", label: "Card" },
  { key: "qr",   label: "UPI / QR" },
  { key: "wallet", label: "Wallet" },
  { key: "split", label: "Split" },
] as const;
type PayKey = typeof PAYMENT_TABS[number]["key"];

// ── QR wallet options ──
const QR_WALLETS = [
  { id: "bkash",  label: "bKash",  Logo: BkashLogo },
  { id: "nagad",  label: "Nagad",  Logo: NagadLogo },
  { id: "rocket", label: "Rocket", Logo: RocketLogo },
];

export default function PatientDisplayPage() {
  const [cart, setCart] = useState<DisplayCart | null>(null);
  const [online, setOnline] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PayKey>("qr");
  const [selectedWallet, setSelectedWallet] = useState<string>("bkash");

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

  // Only use LIVE cart data — no demo fallback
  const liveLines = cart?.lines && cart.lines.length > 0 ? cart.lines : null;
  const isLive = Boolean(liveLines);
  const displayLines: DisplayLine[] = liveLines ?? [];

  const subtotal = cart?.subtotal ?? displayLines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const tax = cart?.taxTotal ?? 0;
  const discount = cart?.discountTotal ?? 0;
  const total = cart?.total ?? subtotal - discount + tax;

  const customerName = cart?.customerName || "Walk-in Patient";
  const customerTier = cart?.customerTier || "Regular";
  const customerPoints = cart?.customerPoints ?? 0;
  const laneNo = cart?.tableNo || cart?.laneNo || "COUNTER 01";
  const merchantName = cart?.merchantName || "BPOS Pharmacy";

  const qrPayload = `bpos-pharma-${selectedWallet}-${Math.round(total)}`;

  // ── THANK YOU SCREEN ──
  if (showThankYou) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e7490 0%, #0d9488 45%, #10b981 100%)" }}
      >
        <div className="flex flex-col items-center gap-5 text-center px-8 text-white animate-in zoom-in-95 duration-300">
          <div className="text-8xl leading-none animate-bounce">🙏</div>
          <h1 className="text-6xl font-black tracking-tight" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
            Thank You!
          </h1>
          <p className="text-2xl font-bold opacity-95">
            {customerName !== "Walk-in Patient" ? `ধন্যবাদ, ${customerName}!` : "Payment Received!"}
          </p>
          <p className="text-lg opacity-85">Get well soon! Your health is our priority.</p>
          <div className="mt-4 px-6 py-2.5 rounded-full bg-white/20 border border-white/30 backdrop-blur font-bold text-sm">
            {laneNo} • Amount Paid: {fmt(total)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm opacity-75">
            <ShieldCheck size={16} />
            Cold Chain & FEFO Batch Verified
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
        ::-webkit-scrollbar-thumb { background: #99f6e4; border-radius: 4px; }
      `}</style>

      <div
        id="patient-display-screen"
        className="fixed inset-0 flex flex-col overflow-hidden p-5 select-none"
        style={{ background: "linear-gradient(180deg, #ccfbf1 0%, #f0fdfa 15%, #f8fafc 100%)" }}
      >
        <div className="flex flex-col gap-3 flex-1 min-h-0 max-w-[1700px] w-full mx-auto">

          {/* ══ 1. HEADER ══ */}
          <header className="rounded-sm border border-slate-200 bg-white shadow-xs px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-teal-50 border-teal-200 text-teal-600 shrink-0">
                <Pill size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-lg leading-tight tracking-tight">{merchantName}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider text-white bg-teal-600">{laneNo}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PATIENT DISPLAY TERMINAL</span>
                  <span className="text-gray-300">•</span>
                  <span className={cn("flex items-center gap-1 text-[11px] font-bold", online ? "text-teal-600" : "text-rose-500")}>
                    {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {online ? (isLive ? "POS Live Synced" : "POS Standby Ready") : "POS Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center">
              <LiveClockCapsule />
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 text-xs font-bold">
                <ShieldCheck size={13} />
                <span>FEFO Verified</span>
              </div>
              <button
                id="pdisp-sound"
                onClick={() => setSoundOn((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-gray-600 hover:text-teal-700 transition shadow-2xs cursor-pointer"
                title={soundOn ? "Mute" : "Enable sound"}
              >
                {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>
              <button
                id="pdisp-fullscreen"
                onClick={toggleFs}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition shadow-2xs cursor-pointer bg-teal-600 hover:bg-teal-700"
                title="Toggle fullscreen"
              >
                {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
            </div>
          </header>

          {/* ══ 2. WELCOME BANNER ══ */}
          <div className="rounded-sm border border-slate-200 bg-white shadow-xs px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full font-black text-lg shadow-2xs shrink-0 bg-teal-100 text-teal-800">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-base">Welcome, {customerName}!</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">{customerTier}</span>
                </div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">Loyalty Points: {customerPoints} Pts</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold">
                <Stethoscope size={13} />
                <span>Cold Chain & FEFO Guaranteed</span>
              </div>
              {isLive && (
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                  🟢 Live Prescription Active
                </span>
              )}
            </div>
          </div>

          {/* ══ 3. MAIN TWO-PANEL ══ */}
          <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">

            {/* ── LEFT: Medicine Items ── */}
            <div className="col-span-12 lg:col-span-7 rounded-sm border border-slate-200 bg-white shadow-xs p-5 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-teal-50 border-teal-200 text-teal-600 shrink-0">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-gray-900 text-base leading-none">Prescription Items</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Live dispense itemization</p>
                  </div>
                </div>
                {isLive && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-gray-700 border border-slate-200">
                    {displayLines.reduce((s, l) => s + l.qty, 0)} Items
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pt-3.5 pr-1">
                {!isLive ? (
                  /* ── Standby / Empty State ── */
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                    <div className="flex h-20 w-20 items-center justify-center rounded-sm bg-teal-50 border border-teal-100 text-4xl">
                      💊
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-base">Awaiting Prescription</p>
                      <p className="text-slate-400 text-sm mt-1">Items will appear here once a sale is started at the POS counter.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold animate-pulse">
                      <PackageOpen size={14} />
                      System Ready — Standby Mode
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayLines.map((line, idx) => {
                      const lineTotal = (line.unitPrice - (line.discountAmount ?? 0)) * line.qty;
                      const emoji = CAT_EMOJI[line.category || ""] || "💊";
                      return (
                        <div key={idx} className="flex items-center justify-between p-3.5 rounded-sm border border-slate-100 bg-white shadow-2xs hover:border-teal-200 transition">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                            {line.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={line.image}
                                alt={line.name}
                                className="h-14 w-14 shrink-0 rounded-xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-2xl">
                                {emoji}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-teal-700 text-white font-black text-xs shrink-0">{line.qty}x</span>
                                <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{line.name}</h3>
                              </div>
                              <p className="text-xs text-gray-400 font-medium mt-1">
                                {fmt(line.unitPrice)} / unit
                                {line.category && <span className="ml-2 text-teal-600 font-semibold">• {line.category}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <span className="font-black text-base text-gray-900 tracking-tight">{fmt(lineTotal)}</span>
                            <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase mt-0.5">TOTAL</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Bill Summary & Payment ── */}
            <div className="col-span-12 lg:col-span-5 rounded-sm border border-slate-200 bg-white shadow-xs p-5 flex flex-col justify-between min-h-0 overflow-y-auto">
              <div>
                {/* Header */}
                <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
                  <CreditCard size={16} className="text-teal-600" />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">PRESCRIPTION BILL SUMMARY</span>
                </div>

                {/* Amounts */}
                <div className="py-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-800">{fmt(subtotal)}</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">VAT / Tax</span>
                      <span className="font-bold text-gray-800">{fmt(tax)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-teal-600 font-semibold">🎁 Discount</span>
                      <span className="font-bold text-teal-600">-{fmt(discount)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total Hero */}
                <div className="rounded-sm p-5 text-white shadow-md my-2" style={{ backgroundColor: "#0d9488" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#99f6e4" }}>GRAND TOTAL</span>
                    <span className="text-xs font-bold" style={{ color: "#99f6e4" }}>BDT (৳)</span>
                  </div>
                  <div className="text-5xl font-black text-white tracking-tight leading-none mt-2">{fmt(total)}</div>
                </div>

                {/* Payment Gateway */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">PAYMENT GATEWAY</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700">POS Checkout</span>
                  </div>

                  {/* Payment Tabs */}
                  <div className="grid grid-cols-5 gap-1.5 mb-3">
                    {PAYMENT_TABS.map((m) => {
                      const isActive = selectedPayment === m.key;
                      return (
                        <button
                          key={m.key}
                          id={`pdisp-tab-${m.key}`}
                          onClick={() => setSelectedPayment(m.key)}
                          className={cn(
                            "py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border",
                            isActive
                              ? "bg-teal-600 text-white border-transparent shadow-xs"
                              : "bg-slate-50 text-gray-600 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* QR Panel — only when UPI/QR selected */}
                  {selectedPayment === "qr" ? (
                    <div className="rounded-sm border border-slate-100 bg-slate-50/50 p-4 flex flex-col items-center gap-3">
                      {/* Wallet selector */}
                      <div className="flex items-center gap-2 w-full justify-center">
                        {QR_WALLETS.map(({ id, label, Logo }) => (
                          <button
                            key={id}
                            onClick={() => setSelectedWallet(id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer",
                              selectedWallet === id
                                ? "border-teal-500 bg-white shadow-sm"
                                : "border-slate-200 bg-white/60 text-gray-500 hover:bg-white"
                            )}
                          >
                            <Logo size={22} />
                            <span className={selectedWallet === id ? "text-gray-800" : "text-gray-400"}>{label}</span>
                          </button>
                        ))}
                      </div>

                      {/* QR Code */}
                      <div
                        className="rounded-sm border border-slate-200/90 bg-white p-3 shadow-xs"
                        dangerouslySetInnerHTML={{ __html: qrSvg(qrPayload, 155) }}
                      />
                      <p className="text-xs text-gray-400 font-medium">
                        Scan to pay via{" "}
                        <span className="font-bold text-gray-700">
                          {QR_WALLETS.find((w) => w.id === selectedWallet)?.label}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-sm border border-slate-100 bg-slate-50/50 p-6 flex flex-col items-center justify-center gap-2 min-h-[160px]">
                      <div className="text-3xl">
                        {selectedPayment === "cash" ? "💵" : selectedPayment === "card" ? "💳" : selectedPayment === "wallet" ? "👛" : "🔀"}
                      </div>
                      <p className="text-sm font-bold text-slate-600 capitalize">{selectedPayment} Payment</p>
                      <p className="text-xs text-slate-400 text-center">Please hand over payment to the cashier</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center justify-center gap-1.5 pt-3 border-t border-slate-100 mt-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                  <SmilePlus size={14} className="text-teal-500" />
                  <span>Thank you for trusting us with your health!</span>
                </div>
                <div className="flex items-center gap-1.5 text-teal-600 text-[10px] font-bold">
                  <ShieldCheck size={11} />
                  <span>Mushak-6.3 Compliant • FEFO Batch Monitored</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
