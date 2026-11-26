"use client";

import Link from "next/link";
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
  ArrowLeft,
} from "lucide-react";
import {
  subscribeCart,
  readCart,
  publishCart,
  fmtDisplayMoney,
  playDisplayScanSound,
  playDisplaySuccessChime,
  buildQrSvg,
  formatDisplayClock,
  type DisplayCart,
} from "@/lib/customer-display";
import { isOnline } from "@/lib/offline/db";
import { cn } from "@/lib/cn";

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

const PAYMENT_HINTS: Record<"cash" | "card" | "qr" | "wallet" | "split", { title: string; subtitle: string }> = {
  cash: { title: "Pay with Cash at Counter", subtitle: "Counter change receipt ready upon payment" },
  card: { title: "Tap or Insert Card on Terminal", subtitle: "Visa, Mastercard & UnionPay accepted" },
  qr: { title: "Scan to Pay with bKash / Nagad", subtitle: "Instant & Secure Digital Payment" },
  wallet: { title: "Pay via Store Credit / Wallet", subtitle: "Redeem wallet balance or loyalty points" },
  split: { title: "Split Payment Across Methods", subtitle: "Combine Cash, Card & Mobile Wallet" },
};

function LiveClockWidget() {
  const [clock, setClock] = useState<{ hh: string; mm: string; ss: string; ap: string; day: string } | null>(null);

  useEffect(() => {
    const update = () => setClock(formatDisplayClock(new Date()));
    const init = window.setTimeout(update, 0);
    const id = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(init);
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-sm border bg-brand-50/80 border-brand-border text-gray-700 shadow-xs">
      <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand-50 border border-brand-border text-brand-primary text-sm">
        <Scale size={14} />
      </div>
      <div className="text-left leading-tight min-w-[110px]">
        <div className="text-[13px] font-black tracking-tight text-gray-700 tabular-nums">
          {clock ? (
            <>
              {clock.hh}:{clock.mm}:{clock.ss}{" "}
              <span className="text-xs font-bold text-brand-primary uppercase">{clock.ap}</span>
            </>
          ) : (
            "--:--:--"
          )}
        </div>
        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{clock?.day || "READY"}</div>
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
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);
  const paidRef = useRef(false);

  useEffect(() => {
    const syncNetwork = () => setOnline(isOnline());
    const init = window.setTimeout(syncNetwork, 0);
    const id = window.setInterval(syncNetwork, 5000);
    return () => {
      window.clearTimeout(init);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const init = window.setTimeout(() => setCart(readCart()), 0);
    const unsub = subscribeCart((data) => {
      setCart((prev) => {
        const prevLen = prev?.lines?.length ?? 0;
        const nextLen = data?.lines?.length ?? 0;
        if (nextLen > prevLen && soundRef.current) playDisplayScanSound(1046.5);

        const wasPaid = paidRef.current;
        const isPaid = data?.status === "PAID";
        if (!wasPaid && isPaid) {
          if (soundRef.current) playDisplaySuccessChime();
          setShowThankYou(true);
          window.setTimeout(() => setShowThankYou(false), 9000);
        }
        paidRef.current = isPaid;
        return data;
      });
    });
    return () => {
      window.clearTimeout(init);
      unsub?.();
    };
  }, []);

  const toggleFs = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  }, []);

  const handleClearCart = () => {
    const empty: DisplayCart = {
      updatedAt: Date.now(),
      source: "RETAIL",
      lines: [],
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      total: 0,
      status: "IDLE",
    };
    publishCart(empty);
    setCart(empty);
  };

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
  const merchantName = cart?.merchantName || "SalePay Retail";
  const qrPayload = `bpos-retail-payment-${laneNo}-${Math.round(total)}`;
  const activePaymentHint = PAYMENT_HINTS[selectedPayment];

  return (
    <>
      {showThankYou && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden bg-brand-gradient">
          <div className="flex flex-col items-center gap-4 text-center px-6 sm:px-8 text-white">
            <div className="text-7xl sm:text-8xl leading-none animate-bounce">🛍️</div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">Thank You!</h1>
            <p className="text-xl sm:text-2xl font-bold opacity-95">
              {customerName ? `ধন্যবাদ, ${customerName}!` : "Payment Successful!"}
            </p>
            <p className="text-base sm:text-lg opacity-85">Thank you for shopping with us! Come back soon.</p>
            <div className="mt-2 px-6 py-2.5 rounded-full bg-white/20 border border-white/30 backdrop-blur font-bold text-sm">
              Lane {laneNo} • Total Paid: {fmtDisplayMoney(total)}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
              <Star size={14} className="text-amber-300 fill-amber-300" />
              <span className="text-sm font-semibold">+{Math.floor(total / 10)} loyalty points earned!</span>
            </div>
          </div>
        </div>
      )}

      <div
        id="retail-customer-display"
        className="min-h-screen lg:h-screen w-full flex flex-col justify-between overflow-y-auto lg:overflow-hidden p-3 sm:p-4 select-none bg-slate-50"
      >
        <div className="flex flex-col gap-2.5 sm:gap-3 flex-1 min-h-0 max-w-[1700px] w-full mx-auto">
          <header className="rounded-sm border border-brand-border bg-white shadow-sm px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border shrink-0 bg-brand-50 border-brand-border text-brand-primary shadow-xs">
                <ShoppingBag size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-gray-700 text-base sm:text-lg leading-tight tracking-tight truncate">
                    {merchantName}
                  </span>
                  <span className="px-2 py-0.5 rounded-sm text-[11px] font-black uppercase tracking-wider text-white bg-brand-primary shadow-xs">
                    Lane {laneNo}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    CUSTOMER DISPLAY TERMINAL
                  </span>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className={cn("flex items-center gap-1 text-[11px] font-bold", online ? "text-brand-primary" : "text-rose-500")}>
                    {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {online ? (hasItems ? "POS Live Synced" : "POS Connected • Live") : "POS Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center">
              <LiveClockWidget />
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Link
                href="/retail-pos"
                className="flex items-center gap-1.5 h-9 px-3 rounded-sm border border-slate-200 bg-white text-gray-600 hover:text-brand-primary hover:border-brand-border text-xs font-bold transition shadow-xs cursor-pointer"
                title="Back to Retail POS"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Back to POS</span>
              </Link>

              {hasItems && (
                <button
                  onClick={handleClearCart}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}

              <button
                id="rcd-sound"
                onClick={() => setSoundOn((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 bg-white text-gray-600 hover:text-brand-primary hover:border-brand-border transition shadow-xs cursor-pointer"
                title={soundOn ? "Mute" : "Enable sound"}
              >
                {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <button
                id="rcd-fullscreen"
                onClick={toggleFs}
                className="flex h-9 w-9 items-center justify-center rounded-sm bg-brand-primary hover:bg-brand-dark text-white transition shadow-xs cursor-pointer"
                title="Toggle fullscreen"
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </header>

          <div className="rounded-sm border border-brand-border bg-white shadow-sm px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm font-black text-base shadow-xs shrink-0 bg-brand-50 text-brand-dark border border-brand-border">
                {(customerName || "G")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-gray-700 text-sm sm:text-base truncate">
                    {customerName ? `Welcome back, ${customerName}!` : "Welcome, Valued Customer!"}
                  </span>
                  <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-brand-50 text-brand-dark border border-brand-border">
                    {customerTier}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                  {customerPoints > 0 && (
                    <span className="flex items-center gap-1">
                      <Award size={11} className="text-brand-primary" /> {customerPoints} Points Balance
                    </span>
                  )}
                  {customerPoints > 0 && <span>•</span>}
                  <span>Cashier: {cashierName}</span>
                  <span>•</span>
                  <span>Lane {laneNo}</span>
                </div>
              </div>
            </div>

            {hasItems ? (
              <span className="px-3 py-1 rounded-sm text-xs font-black uppercase tracking-wider bg-brand-50 text-brand-dark border border-brand-border shrink-0">
                🟢 Live Order Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-sm text-xs font-bold bg-slate-100 text-gray-500 border border-slate-200 shrink-0">
                Waiting for scan…
              </span>
            )}
          </div>

          <div className="grid grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0">
            <div className="col-span-12 lg:col-span-7 rounded-sm border border-brand-border bg-white shadow-sm p-4 flex flex-col min-h-[300px] lg:min-h-0 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm border shrink-0 bg-brand-50 border-brand-border text-brand-primary shadow-xs">
                    <ShoppingCart size={17} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-gray-700 text-sm sm:text-base leading-none">Basket Items</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Live scan itemization</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-sm text-xs font-extrabold bg-brand-50 text-brand-dark border border-brand-border">
                  {lines.reduce((s, l) => s + l.qty, 0)} {lines.reduce((s, l) => s + l.qty, 0) === 1 ? "Item" : "Items"}
                </span>
              </div>

              {hasItems && (
                <div className="hidden sm:flex items-center gap-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 border-b border-slate-100">
                  <span className="w-12 shrink-0">Item</span>
                  <span className="flex-1">Name</span>
                  <span className="w-16 text-center">Price</span>
                  <span className="w-10 text-center">Qty</span>
                  <span className="w-20 text-right">Total</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pt-2.5 pr-1 space-y-2">
                {hasItems ? (
                  lines.map((line, idx) => {
                    const lineTotal = (line.unitPrice - (line.discountAmount ?? 0)) * line.qty;
                    return (
                      <div
                        key={line.sku || `${line.name}-${idx}`}
                        className="flex items-center gap-3 p-2.5 sm:p-3 rounded-sm border border-slate-100 bg-white shadow-xs hover:border-brand-border transition"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-brand-border bg-brand-50 text-xl shadow-xs">
                          {getProductEmoji(line.name, idx)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-700 text-sm leading-tight truncate">{line.name}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {line.sku && (
                              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
                                <Barcode size={9} /> {line.sku}
                              </span>
                            )}
                            {line.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-sm bg-brand-50 text-brand-dark font-semibold border border-brand-border">
                                {line.category}
                              </span>
                            )}
                            {line.discountAmount > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 flex items-center gap-0.5">
                                <Tag size={8} /> -৳{line.discountAmount.toFixed(2)} off
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="hidden sm:block w-16 text-center shrink-0">
                          <p className="text-xs font-bold text-gray-600 tabular-nums">৳{line.unitPrice.toFixed(2)}</p>
                          <p className="text-[9px] text-gray-400">each</p>
                        </div>

                        <div className="w-10 flex justify-center shrink-0">
                          <span className="px-2 py-0.5 rounded-sm bg-slate-900 text-white font-black text-xs">
                            {line.qty}x
                          </span>
                        </div>

                        <div className="w-20 text-right shrink-0">
                          <span className="font-black text-sm sm:text-base text-gray-700 tracking-tight tabular-nums">
                            {fmtDisplayMoney(lineTotal)}
                          </span>
                          <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase mt-0.5">TOTAL</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6 text-gray-400">
                    <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-brand-50 border border-brand-border text-brand-primary mb-3 shadow-xs">
                      <ShoppingCart size={28} />
                    </div>
                    <h3 className="font-extrabold text-gray-600 text-base">Your Basket is Empty</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                      Please place your items on the counter. Products scanned at the register will appear here live in real time.
                    </p>
                    <div className="mt-4 px-3.5 py-1.5 rounded-sm bg-brand-50 text-brand-dark border border-brand-border text-xs font-bold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-brand-primary animate-ping" />
                      Live Terminal Ready • Lane {laneNo}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5 rounded-sm border border-brand-border bg-white shadow-sm p-4 flex flex-col justify-between min-h-0 lg:overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <CreditCard size={15} className="text-brand-primary" />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">ORDER SUMMARY</span>
                </div>

                <div className="py-2.5 space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-700 tabular-nums">{fmtDisplayMoney(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-600 font-semibold">🎁 Discount</span>
                      <span className="font-bold text-emerald-600 tabular-nums">−{fmtDisplayMoney(discount)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">VAT / Tax</span>
                      <span className="font-bold text-gray-700 tabular-nums">{fmtDisplayMoney(tax)}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-sm p-3.5 sm:p-4 text-white shadow-md my-1.5 bg-brand-gradient">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-white/90">TOTAL PAYABLE</span>
                    <span className="text-xs font-bold text-white/90">BDT (৳)</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mt-1.5 tabular-nums">
                    {fmtDisplayMoney(total)}
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-emerald-200 text-xs font-bold">
                      <Sparkles size={12} />
                      You save {fmtDisplayMoney(discount)} today!
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">PAYMENT OPTIONS</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-brand-50 text-brand-dark border border-brand-border">
                      POS Checkout
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-2.5">
                    {(["cash", "card", "qr", "wallet", "split"] as const).map((m) => {
                      const labels: Record<string, string> = { cash: "Cash", card: "Card", qr: "UPI / QR", wallet: "Wallet", split: "Split" };
                      const isActive = selectedPayment === m;
                      return (
                        <button
                          key={m}
                          id={`rcd-tab-${m}`}
                          onClick={() => setSelectedPayment(m)}
                          className={cn(
                            "py-1.5 rounded-sm text-xs font-bold transition-all text-center cursor-pointer border",
                            isActive
                              ? "bg-brand-primary text-white border-transparent shadow-xs"
                              : "bg-slate-50 text-gray-600 border-slate-200 hover:bg-brand-50 hover:text-brand-primary hover:border-brand-border"
                          )}
                        >
                          {labels[m]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-sm border border-brand-border bg-brand-50/70">
                    <div
                      className="rounded-sm border border-brand-border bg-white p-2 shadow-xs"
                      dangerouslySetInnerHTML={{ __html: buildQrSvg(qrPayload, 124, "#0284c7") }}
                    />
                    <p className="text-xs font-bold text-gray-700 mt-2">{activePaymentHint.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{activePaymentHint.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-2.5 text-gray-400 text-xs font-medium border-t border-slate-100 mt-2.5">
                <SmilePlus size={14} className="text-brand-primary" />
                <span>Thank you for shopping with us!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
