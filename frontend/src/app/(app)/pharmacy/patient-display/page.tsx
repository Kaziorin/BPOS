"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Pill,
  Wifi,
  WifiOff,
  CheckCircle2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  AlertTriangle,
  ClipboardList,
  Thermometer,
  Activity,
  Clock,
  Star,
  PackageCheck,
  RefreshCw,
  QrCode,
  Award,
  Sparkles,
} from "lucide-react";
import { subscribeCart, readCart, type DisplayCart } from "@/lib/customer-display";
import { isOnline } from "@/lib/offline/db";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";

// ── Web Audio API Beep Generator ────────────────────────────────────────────
function playDispenseBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {}
}

function playCompletionChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.18, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.32);
    });
  } catch {}
}

// ── Vector QR Code Generator ────────────────────────────────────────────────
function qrSvg(payload: string, size = 160, darkColor = "#0e7490"): string {
  let seed = 0;
  for (const ch of payload) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const n = 25;
  const cells: boolean[][] = [];
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const inFinder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff" rx="14"/><g fill="${darkColor}">${rects.join("")}</g></svg>`;
}

function fmt(n: number): string {
  return `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Medicine Emoji Matcher ──────────────────────────────────────────────────
const MED_EMOJI_MAP: [string, string][] = [
  ["tablet", "💊"], ["capsule", "💊"], ["pill", "💊"], ["syrup", "🧴"],
  ["injection", "💉"], ["insulin", "💉"], ["drop", "💧"], ["cream", "🧴"],
  ["ointment", "🧴"], ["inhaler", "🫁"], ["salbutamol", "🫁"], ["paracetamol", "🌡️"],
  ["napa", "🌡️"], ["amox", "🦠"], ["antibiotic", "🦠"], ["metformin", "🩸"],
  ["vitamin", "⚗️"], ["zinc", "⚗️"], ["calcium", "🦴"], ["seclo", "🫁"],
];

function getMedEmoji(name: string): string {
  const n = (name || "").toLowerCase();
  for (const [k, e] of MED_EMOJI_MAP) if (n.includes(k)) return e;
  return "💊";
}

// ── Mobile Payment Buttons ──────────────────────────────────────────────────
function BkashBadge({ selected, onClick }: { selected?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none",
        selected
          ? "bg-[#e2136e] text-white border-[#e2136e] shadow-md scale-105"
          : "bg-white text-slate-700 border-slate-200 hover:border-[#e2136e]/50 hover:bg-pink-50/30"
      )}
    >
      <div className="w-4 h-4 rounded-full bg-white text-[#e2136e] font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
        b
      </div>
      <span className="text-xs font-black tracking-tight">bKash</span>
    </div>
  );
}

function NagadBadge({ selected, onClick }: { selected?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none",
        selected
          ? "bg-[#f04f23] text-white border-[#f04f23] shadow-md scale-105"
          : "bg-white text-slate-700 border-slate-200 hover:border-[#f04f23]/50 hover:bg-orange-50/30"
      )}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-amber-300 shrink-0 shadow-2xs" />
      <span className="text-xs font-black tracking-tight">Nagad</span>
    </div>
  );
}

function RocketBadge({ selected, onClick }: { selected?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none",
        selected
          ? "bg-[#8c3494] text-white border-[#8c3494] shadow-md scale-105"
          : "bg-white text-slate-700 border-slate-200 hover:border-[#8c3494]/50 hover:bg-purple-50/30"
      )}
    >
      <span className="text-xs">🚀</span>
      <span className="text-xs font-black tracking-tight">Rocket</span>
    </div>
  );
}

function UpayBadge({ selected, onClick }: { selected?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none",
        selected
          ? "bg-[#1b439b] text-white border-[#1b439b] shadow-md scale-105"
          : "bg-white text-slate-700 border-slate-200 hover:border-[#1b439b]/50 hover:bg-blue-50/30"
      )}
    >
      <span className="text-xs font-black tracking-tight text-amber-300">u</span>
      <span className="text-xs font-black tracking-tight">pay</span>
    </div>
  );
}

function VisaBadge({ selected, onClick }: { selected?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none",
        selected
          ? "bg-[#1a1f71] text-white border-[#1a1f71] shadow-md scale-105"
          : "bg-white text-slate-700 border-slate-200 hover:border-[#1a1f71]/50"
      )}
    >
      <span className="text-xs font-black italic tracking-wider text-[#f7b600]">VISA</span>
    </div>
  );
}

function MastercardBadge({ selected, onClick }: { selected?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none",
        selected
          ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
      )}
    >
      <div className="flex items-center -space-x-1.5 shrink-0">
        <div className="w-3.5 h-3.5 rounded-full bg-[#eb001b]" />
        <div className="w-3.5 h-3.5 rounded-full bg-[#f79e1b] opacity-90" />
      </div>
      <span className="text-xs font-black tracking-tight">Mastercard</span>
    </div>
  );
}

// ── Health Tip Slides for Idle Mode ─────────────────────────────────────────
const HEALTH_SLIDES = [
  {
    id: 1,
    tag: "💊 MEDICATION REMINDER",
    title: "Take Medicines on Schedule",
    desc: "Always take your prescribed medicines at regular intervals for optimal therapeutic effect. Do not alter doses without physician advice.",
    accent: "border-cyan-200 bg-cyan-50/70",
    icon: "⏰",
    color: "text-cyan-700",
  },
  {
    id: 2,
    tag: "🌡️ HEALTH & HYDRATION",
    title: "Hydration & Medicine Safety",
    desc: "Drink plenty of water when taking oral tablets or capsules to support proper dissolution and kidney health.",
    accent: "border-teal-200 bg-teal-50/70",
    icon: "💧",
    color: "text-teal-700",
  },
  {
    id: 3,
    tag: "🔒 BATCH & EXPIRY ASSURANCE",
    title: "FEFO Cold Chain Quality",
    desc: "Our pharmacy uses First-Expiry-First-Out (FEFO) batch tracking and temperature control to ensure 100% genuine, fresh medicines.",
    accent: "border-indigo-200 bg-indigo-50/70",
    icon: "🛡️",
    color: "text-indigo-700",
  },
  {
    id: 4,
    tag: "🏥 RX ADVISORY",
    title: "Complete Antibiotic Course",
    desc: "Finish the complete antibiotic course prescribed by your doctor, even if symptoms subside early, to prevent antibiotic resistance.",
    accent: "border-violet-200 bg-violet-50/70",
    icon: "✅",
    color: "text-violet-700",
  },
];

export default function PharmacyPatientDisplayPage() {
  const [cart, setCart] = useState<DisplayCart>(() => readCart());
  const [online, setOnline] = useState(true);
  const [showPaid, setShowPaid] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMobile, setSelectedMobile] = useState<string>("bKash");
  const [slideIndex, setSlideIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const prevLineCountRef = useRef(0);

  // Live Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      setCurrentDate(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  // Online / Offline Status
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

  // Subscribe to POS Cart Updates
  useEffect(() => {
    return subscribeCart((c) => {
      setCart(c);
      const isPaidNow = c.status === "PAID";
      setShowPaid(isPaidNow);

      if (isPaidNow && soundEnabled) {
        playCompletionChime();
      } else if (c.lines.length > prevLineCountRef.current && soundEnabled) {
        playDispenseBeep();
      }
      prevLineCountRef.current = c.lines.length;
    });
  }, [soundEnabled]);

  // Idle slide rotation
  useEffect(() => {
    if (cart.lines.length > 0) return;
    const t = setInterval(() => setSlideIndex((p) => (p + 1) % HEALTH_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [cart.lines.length]);

  // Fullscreen toggle
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

  const qrPayload = empty
    ? "https://bpos.app/pharmacy/patient-display?status=idle"
    : `upiqr://pay?pa=rx@bpos&pn=Pharmacy%20Dispense&am=${cart.total.toFixed(2)}&tn=${cart.invoiceNo || "RX"}&pm=${selectedMobile}`;

  const slide = HEALTH_SLIDES[slideIndex];

  return (
    <div
      className="relative flex flex-col justify-between h-screen w-screen bg-slate-50 text-slate-900 select-none overflow-hidden p-4 md:p-6"
      style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
    >
      {/* ══ CYAN/TEAL GRADIENT WAVE BACKDROP ══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top Upper Wave */}
        <svg className="absolute top-0 left-0 w-full h-[150px] opacity-100" viewBox="0 0 1200 150" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 1200 0 L 1200 70 C 920 145, 580 35, 280 125 C 140 145, 40 75, 0 90 Z" fill="url(#rx-top-wave-1)" />
          <defs>
            <linearGradient id="rx-top-wave-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(207, 250, 254, 0.95)" />
              <stop offset="50%" stopColor="rgba(204, 251, 241, 0.65)" />
              <stop offset="85%" stopColor="rgba(224, 242, 254, 0.25)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top Front Wave */}
        <svg className="absolute top-0 left-0 w-[78%] h-[120px] opacity-100" viewBox="0 0 1000 120" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 1000 0 L 1000 40 C 760 115, 480 25, 220 100 C 100 115, 30 50, 0 65 Z" fill="url(#rx-top-wave-2)" />
          <defs>
            <linearGradient id="rx-top-wave-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(165, 243, 252, 0.85)" />
              <stop offset="40%" stopColor="rgba(153, 246, 228, 0.55)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top-Left Glow Blob */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-teal-300/15 blur-3xl" />
      </div>

      {/* ════ TOP HEADER & STATUS BAR ════ */}
      <header className="relative z-10 rounded-[2rem] bg-white/80 backdrop-blur-md border border-cyan-200/70 shadow-2xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 transition-all">
        {/* Brand Logo & Lane Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 shrink-0">
            <HeartPulse size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{cart.merchantName || siteConfig.name || "MediCare Pharmacy"}</h1>
              <span className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                {cart.laneNo || "Rx COUNTER 01"}
              </span>
            </div>
            <p className="text-[10.5px] font-bold tracking-wider text-cyan-800 uppercase flex items-center gap-2 mt-0.5">
              <Pill size={12} className="text-cyan-600" />
              <span>PATIENT DISPENSE TERMINAL</span>
              <span>•</span>
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-extrabold normal-case tracking-normal", online ? "text-teal-700" : "text-amber-700")}>
                {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                {online ? "Rx Live Synced" : "Offline Mode"}
              </span>
            </p>
          </div>
        </div>

        {/* Center Clock & Date Pill */}
        <div className="hidden lg:flex items-center gap-3 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl px-4 py-2 border border-cyan-200/70 shadow-2xs absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
            <Clock size={16} strokeWidth={2.2} />
          </div>
          <div className="leading-tight text-center">
            <p className="text-sm font-black font-mono tracking-wider text-slate-900">{currentTime}</p>
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-cyan-800">{currentDate}</p>
          </div>
        </div>

        {/* Top Control Bar - Sound & Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50/90 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute beep sound" : "Enable beep sound"}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 transition"
            >
              {soundEnabled ? <Volume2 size={18} className="text-cyan-700" /> : <VolumeX size={18} className="text-slate-400" />}
            </button>
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xs hover:opacity-95 transition"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ════ PATIENT WELCOME BANNER ════ */}
      <div className="relative z-10 my-3 rounded-[2rem] bg-white/80 backdrop-blur-md border border-cyan-200/60 shadow-2xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
            {cart.customerName ? cart.customerName.charAt(0).toUpperCase() : "P"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-black text-slate-900 tracking-tight">
                {cart.customerName ? `Welcome, ${cart.customerName}` : "Welcome to the Pharmacy Dispense Counter"}
              </span>
              {cart.invoiceNo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-extrabold border border-cyan-200">
                  <ClipboardList size={11} /> Rx #{cart.invoiceNo}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
              {cart.customerName
                ? "Your prescribed medicines are being prepared and verified by the pharmacist."
                : "Please hand your prescription to the pharmacist — medicines will appear live on this screen."}
            </p>
          </div>
        </div>

        {lines.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-extrabold">
              <PackageCheck size={14} className="text-cyan-600" />
              {lines.length} {lines.length === 1 ? "Medicine" : "Medicines"}
            </div>
          </div>
        )}
      </div>

      {/* ════ MAIN CONTENT (Grid Layout) ════ */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">

        {/* ── LEFT: Medicine Items List ── */}
        <section className="lg:col-span-7 flex flex-col rounded-[2rem] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-cyan-50/70 to-teal-50/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center text-white shadow-xs">
                <Pill size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {showPaid ? "Dispensed Medicines" : "Prescription Items"}
                </h2>
                <p className="text-[10.5px] font-bold text-cyan-700 uppercase tracking-wider mt-0.5">
                  {empty ? "Awaiting prescription scan" : showPaid ? "Prescription dispense complete" : "Live item stream"}
                </p>
              </div>
            </div>
            {!empty && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-800 text-xs font-extrabold border border-cyan-200">
                <Activity size={13} className={showPaid ? "" : "animate-pulse text-cyan-600"} />
                {showPaid ? "Dispensed" : "Active"}
              </div>
            )}
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {empty ? (
              /* IDLE: Health Carousel */
              <div className="h-full flex flex-col items-center justify-center gap-4 p-4 text-center">
                <div className={cn("w-full max-w-md overflow-hidden rounded-2xl p-6 border-2 transition-all duration-700", slide.accent)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn("text-[11px] font-extrabold uppercase tracking-widest", slide.color)}>{slide.tag}</span>
                    <span className="text-3xl">{slide.icon}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{slide.title}</h3>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{slide.desc}</p>
                  <div className="flex items-center justify-center gap-1.5 pt-4">
                    {HEALTH_SLIDES.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSlideIndex(idx)}
                        className={cn("h-2 rounded-full transition-all", idx === slideIndex ? "w-6 bg-cyan-600" : "w-2 bg-slate-300 hover:bg-slate-400")}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Stethoscope size={15} className="text-cyan-600 animate-pulse" />
                    Waiting for prescription — items will display in real time
                  </div>
                </div>
              </div>
            ) : showPaid ? (
              /* PAID STATE */
              <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/20">
                  <CheckCircle2 size={44} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">Medicines Dispensed!</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1 max-w-sm mx-auto">
                    Prescription checkout complete. Please inspect your medicines before leaving the counter.
                  </p>
                </div>
                <div className="w-full max-w-sm p-4 rounded-2xl bg-cyan-50/80 border border-cyan-200 text-left space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex justify-between border-b border-cyan-200/80 pb-2">
                    <span className="text-slate-500">Receipt #</span>
                    <span className="font-mono text-cyan-800">{cart.invoiceNo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-900 font-extrabold">
                    <span>Total Amount Paid</span>
                    <span className="font-mono text-teal-700">{fmt(cart.paidTotal || cart.total)}</span>
                  </div>
                  <div className="pt-1 flex items-center gap-2 text-teal-800 text-[11px] font-bold">
                    <ShieldCheck size={15} className="text-teal-600 shrink-0" />
                    100% FEFO Batch Verified & Temperature Inspected
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE CART ITEMS */
              lines.map((item, idx) => {
                const linePrice = item.qty * item.unitPrice - (item.discountAmount || 0);
                const emoji = getMedEmoji(item.name);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:border-cyan-300 hover:shadow-xs transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200/60 text-2xl flex items-center justify-center shrink-0">
                        {emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-600 to-teal-600 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                            {item.qty}
                          </span>
                          <p className="font-extrabold text-slate-900 text-sm tracking-tight truncate">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className="font-semibold">{fmt(item.unitPrice)} / unit</span>
                          {item.uom && <span className="text-[10.5px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200/60">{item.uom}</span>}
                          {item.discountAmount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 text-[10px] font-extrabold">
                              -{fmt(item.discountAmount)} OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black font-mono text-slate-900 block">{fmt(linePrice)}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Line Total</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer status */}
          {!empty && !showPaid && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <RefreshCw size={13} className="text-cyan-600 animate-spin" style={{ animationDuration: "3s" }} />
                Real-time dispense feed synced with register
              </span>
              {cart.discountTotal > 0 && (
                <span className="text-teal-700 font-extrabold">
                  Savings: {fmt(cart.discountTotal)}
                </span>
              )}
            </div>
          )}
        </section>

        {/* ── RIGHT: Bill Summary & QR Code ── */}
        <section className="lg:col-span-5 flex flex-col gap-4">

          {/* Bill Summary Card */}
          <div className="rounded-[2rem] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-2xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Activity size={15} className="text-cyan-600" />
                Prescription Bill Summary
              </h3>
              {cart.invoiceNo && (
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200">
                  #{cart.invoiceNo}
                </span>
              )}
            </div>

            {/* Subtotal lines */}
            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono">{fmt(cart.subtotal)}</span>
              </div>
              {cart.discountTotal > 0 && (
                <div className="flex justify-between text-teal-700 font-extrabold">
                  <span>Discount Total</span>
                  <span className="font-mono">-{fmt(cart.discountTotal)}</span>
                </div>
              )}
              {cart.taxTotal > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>VAT (Mushak 6.3)</span>
                  <span className="font-mono">{fmt(cart.taxTotal)}</span>
                </div>
              )}
            </div>

            {/* Grand Total Box — Premium Cyan/Teal Gradient */}
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/20">
              <div className="relative">
                <div className="flex items-center justify-between text-[11px] font-black tracking-widest text-cyan-100 uppercase mb-1">
                  <span>Grand Total</span>
                  <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[10px]">BDT (৳)</span>
                </div>
                <p className="text-4xl font-black font-mono tracking-tight text-white">
                  {fmt(cart.total)}
                </p>
                {cart.discountTotal > 0 && (
                  <p className="text-xs font-bold text-cyan-100 flex items-center gap-1 mt-1.5">
                    <Star size={13} className="text-amber-300 fill-amber-300" />
                    You save {fmt(cart.discountTotal)} on this prescription
                  </p>
                )}
              </div>
            </div>

            {/* Mobile Payment Selector */}
            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Payment Gateway</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <BkashBadge selected={selectedMobile === "bKash"} onClick={() => setSelectedMobile("bKash")} />
                <NagadBadge selected={selectedMobile === "Nagad"} onClick={() => setSelectedMobile("Nagad")} />
                <RocketBadge selected={selectedMobile === "Rocket"} onClick={() => setSelectedMobile("Rocket")} />
                <UpayBadge selected={selectedMobile === "Upay"} onClick={() => setSelectedMobile("Upay")} />
                <VisaBadge selected={selectedMobile === "VISA"} onClick={() => setSelectedMobile("VISA")} />
                <MastercardBadge selected={selectedMobile === "Mastercard"} onClick={() => setSelectedMobile("Mastercard")} />
              </div>
            </div>
          </div>

          {/* QR Code & Safety Box */}
          <div className="rounded-[2rem] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-2xs p-4 flex flex-col items-center gap-3">
            <div className="flex items-center justify-between w-full">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <QrCode size={14} className="text-cyan-600" />
                Scan to Pay via QR
              </p>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                {selectedMobile}
              </span>
            </div>

            <div
              className="rounded-xl overflow-hidden border-2 border-cyan-200 shadow-sm"
              dangerouslySetInnerHTML={{ __html: qrSvg(qrPayload, 130) }}
            />

            <p className="text-[10px] font-bold text-slate-500 font-mono text-center">
              {empty ? "Scan for pharmacy digital card" : `Scan with ${selectedMobile} app to pay ${fmt(cart.total)}`}
            </p>
          </div>

          {/* FEFO Compliance Badge */}
          <div className="rounded-[2rem] bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/70 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Thermometer size={19} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-black text-teal-900">Cold Chain & FEFO Quality Guaranteed</p>
              <p className="text-[10.5px] text-teal-700 font-medium mt-0.5">
                All medicines are temperature-inspected and batch-verified before dispense.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ════ FOOTER ════ */}
      <footer className="relative z-10 mt-3 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200/60 px-5 py-2.5 flex items-center justify-between gap-4 text-[10.5px] font-bold text-slate-400">
        <div className="flex items-center gap-2">
          <HeartPulse size={13} className="text-cyan-600" />
          <span className="font-extrabold text-slate-700">{siteConfig.name} Pharmacy</span>
          <span>•</span>
          <span>Patient Dispense Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} className="text-amber-500" />
          <span>Follow doctor's instructions for medicine dosage & duration</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-teal-600" />
          <span>Mushak-6.3 Compliant • FEFO Batch Monitored</span>
        </div>
      </footer>
    </div>
  );
}
