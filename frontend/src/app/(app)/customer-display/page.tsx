"use client";

import Link from "next/link";
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
  ArrowLeft,
  Trash2,
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
import { useAuth } from "@/lib/auth";
import { getAccessiblePosTerminals, getTenantEntitlementContext } from "@/lib/pos-terminals";
import { cn } from "@/lib/cn";

const DEMO_EMOJIS = ["🎧", "⌚", "🎵", "⌨️", "🔋", "📦"];

type DisplayTheme = "ocean" | "orange";

const PAYMENT_HINTS: Record<"cash" | "card" | "qr" | "wallet" | "split", { title: string; subtitle: string }> = {
  cash: { title: "Pay with Cash at Counter", subtitle: "Counter change & receipt ready" },
  card: { title: "Tap or Insert Card", subtitle: "Visa, Mastercard & UnionPay accepted" },
  qr: { title: "Scan to Pay with bKash / Nagad", subtitle: "Instant & Secure Digital Payment" },
  wallet: { title: "Pay via Customer Wallet", subtitle: "Use store credit or points balance" },
  split: { title: "Split Payment Across Methods", subtitle: "Combine Cash, Card & Mobile Wallet" },
};

function LiveClockCapsule({ theme = "ocean" }: { theme?: DisplayTheme }) {
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

  const isOrange = theme === "orange";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-1.5 rounded-sm border transition-colors shadow-xs",
        isOrange ? "bg-orange-50/70 border-orange-200 text-gray-700" : "bg-brand-50/80 border-brand-border text-gray-700"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-sm text-sm",
          isOrange ? "bg-orange-100 text-orange-600" : "bg-brand-50 border border-brand-border text-brand-primary"
        )}
      >
        <Scale size={14} />
      </div>
      <div className="text-left leading-tight min-w-[110px]">
        <div className="text-[13px] font-black tracking-tight text-gray-700 tabular-nums">
          {clock ? (
            <>
              {clock.hh}:{clock.mm}:{clock.ss}{" "}
              <span className={cn("text-xs font-bold uppercase", isOrange ? "text-orange-600" : "text-brand-primary")}>
                {clock.ap}
              </span>
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

export default function CustomerDisplayPage() {
  const { user, subscription } = useAuth();
  const entCtx = getTenantEntitlementContext(user, subscription);
  const primaryTerminalHref = getAccessiblePosTerminals(user, subscription)[0]?.href || "/retail-pos";
  const hasRestaurant =
    entCtx.isSuperAdmin ||
    entCtx.businessType === "RESTAURANT" ||
    entCtx.enabledModules.has("restaurant") ||
    entCtx.enabledModules.has("restaurant_kds");

  const [cart, setCart] = useState<DisplayCart | null>(null);
  const [online, setOnline] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [colorTheme, setColorTheme] = useState<DisplayTheme>("ocean");
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
        if (nextLen > prevLen && soundRef.current) playDisplayScanSound(880);

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

  const handleClearLiveCart = () => {
    const empty: DisplayCart = {
      updatedAt: Date.now(),
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

  const liveLines = cart?.lines && cart.lines.length > 0 ? cart.lines : null;
  const isLive = Boolean(liveLines);
  const displayLines = liveLines || [];

  const subtotal = isLive
    ? cart?.subtotal ?? displayLines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
    : 0;
  const tax = isLive ? cart?.taxTotal ?? 0 : 0;
  const discount = isLive ? cart?.discountTotal ?? 0 : 0;
  const serviceCharge = isLive ? cart?.serviceCharge ?? 0 : 0;
  const total = isLive ? cart?.total ?? subtotal - discount + tax + serviceCharge : 0;

  const customerName = cart?.customerName || "Walk-in Customer";
  const customerTier = cart?.customerTier || "Member";
  const customerPoints = cart?.customerPoints ?? 0;
  const laneNo = cart?.tableNo || cart?.laneNo || "LANE 01";
  const merchantName =
    cart?.merchantName ||
    `SalePay ${entCtx.businessType === "RETAIL" ? "Retail" : entCtx.businessType.charAt(0) + entCtx.businessType.slice(1).toLowerCase()}`;

  const qrPayload = `bpos-pay-${laneNo}-${Math.round(total)}`;
  const isOrange = hasRestaurant && colorTheme === "orange";
  const activePaymentHint = PAYMENT_HINTS[selectedPayment];

  return (
    <>
      {showThankYou && (
        <div
          className={cn(
            "fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden",
            isOrange ? "" : "bg-brand-gradient"
          )}
          style={
            isOrange ? { background: "linear-gradient(135deg, #c2410c 0%, #ea580c 45%, #dc2626 100%)" } : undefined
          }
        >
          <div className="flex flex-col items-center gap-4 text-center px-6 sm:px-8 text-white animate-in zoom-in-95 duration-300">
            <div className="text-7xl sm:text-8xl leading-none animate-bounce">🙏</div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">Thank You!</h1>
            <p className="text-xl sm:text-2xl font-bold opacity-95">
              {customerName ? `ধন্যবাদ, ${customerName}!` : "Payment Received!"}
            </p>
            <p className="text-base sm:text-lg opacity-85">Thank you for shopping with us! Have a wonderful day.</p>
            <div className="mt-2 px-6 py-2.5 rounded-full bg-white/20 border border-white/30 backdrop-blur font-bold text-sm">
              {laneNo} • Amount Paid: {fmtDisplayMoney(total)}
            </div>
          </div>
        </div>
      )}

      <div
        id="customer-display-screen"
        className={cn(
          "min-h-screen lg:h-screen w-full flex flex-col justify-between overflow-y-auto lg:overflow-hidden p-3 sm:p-4 select-none",
          !isOrange && "bg-slate-50"
        )}
        style={
          isOrange
            ? { background: "linear-gradient(180deg, #ffedd5 0%, #fff7ed 15%, #f8fafc 100%)" }
            : undefined
        }
      >
        <div className="flex flex-col gap-2.5 sm:gap-3 flex-1 min-h-0 max-w-[1700px] w-full mx-auto">
          <header
            className={cn(
              "rounded-sm border bg-white shadow-xs px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0",
              isOrange ? "border-orange-200/80" : "border-brand-border"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-sm border shrink-0 transition-colors",
                  isOrange ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-brand-50 border-brand-border text-brand-primary"
                )}
              >
                {isOrange ? <Utensils size={20} /> : <Store size={20} />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-gray-700 text-base sm:text-lg leading-tight tracking-tight truncate">
                    {merchantName}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-sm text-[11px] font-black uppercase tracking-wider text-white",
                      isOrange ? "bg-orange-600" : "bg-brand-primary"
                    )}
                  >
                    {laneNo}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    CUSTOMER DISPLAY TERMINAL
                  </span>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-[11px] font-bold",
                      online ? (isOrange ? "text-orange-600" : "text-brand-primary") : "text-rose-500"
                    )}
                  >
                    {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {online ? (isLive ? "POS Live Synced" : "Standby · Waiting for POS") : "POS Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center">
              <LiveClockCapsule theme={isOrange ? "orange" : "ocean"} />
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Link
                href={primaryTerminalHref}
                className="flex items-center gap-1.5 h-9 px-3 rounded-sm border border-slate-200 bg-white text-gray-600 hover:text-brand-primary hover:border-brand-border text-xs font-bold transition shadow-xs cursor-pointer"
                title="Back to POS"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Back to POS</span>
              </Link>

              {isLive && (
                <button
                  onClick={handleClearLiveCart}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}

              {hasRestaurant && (
                <button
                  onClick={() => setColorTheme((c) => (c === "ocean" ? "orange" : "ocean"))}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-sm border border-slate-200 bg-slate-50 text-gray-600 hover:bg-white text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Toggle Display Accent"
                >
                  <Sparkles size={13} className={isOrange ? "text-orange-500" : "text-brand-primary"} />
                  <span>{isOrange ? "Orange" : "Ocean"}</span>
                </button>
              )}

              <button
                id="cdisp-sound"
                onClick={() => setSoundOn((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 bg-white text-gray-600 hover:text-brand-primary transition shadow-xs cursor-pointer"
                title={soundOn ? "Mute" : "Enable sound"}
              >
                {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <button
                id="cdisp-fullscreen"
                onClick={toggleFs}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-sm text-white transition shadow-xs cursor-pointer",
                  isOrange ? "bg-orange-600 hover:bg-orange-700" : "bg-brand-primary hover:bg-brand-dark"
                )}
                title="Toggle fullscreen"
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </header>

          <div
            className={cn(
              "rounded-sm border bg-white shadow-xs px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0",
              isOrange ? "border-orange-100" : "border-brand-border"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-sm font-black text-base shadow-xs shrink-0 border",
                  isOrange ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-brand-50 text-brand-dark border-brand-border"
                )}
              >
                {customerName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-gray-700 text-sm sm:text-base truncate">
                    Welcome back, {customerName}!
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-sm text-[11px] font-bold border",
                      isOrange ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-brand-50 text-brand-dark border-brand-border"
                    )}
                  >
                    {customerTier}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">Loyalty Balance: {customerPoints} Pts</div>
              </div>
            </div>

            {isLive ? (
              <span
                className={cn(
                  "px-3 py-1 rounded-sm text-xs font-black uppercase tracking-wider border shrink-0",
                  isOrange ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-brand-50 text-brand-dark border-brand-border"
                )}
              >
                🟢 Live Order Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-sm text-xs font-bold bg-slate-100 text-gray-500 border border-slate-200 shrink-0">
                Standby · Ready for Next Order
              </span>
            )}
          </div>

          <div className="grid grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0">
            <div
              className={cn(
                "col-span-12 lg:col-span-7 rounded-sm border bg-white shadow-xs p-4 flex flex-col min-h-[300px] lg:min-h-0 overflow-hidden",
                isOrange ? "border-orange-100" : "border-brand-border"
              )}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-sm border shrink-0",
                      isOrange ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-brand-50 border-brand-border text-brand-primary"
                    )}
                  >
                    <ShoppingBag size={17} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-gray-700 text-sm sm:text-base leading-none">Basket Items</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Live scan itemization</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "px-3 py-1 rounded-sm text-xs font-extrabold border",
                    isOrange ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-brand-50 text-brand-dark border-brand-border"
                  )}
                >
                  {displayLines.reduce((s, l) => s + l.qty, 0)} Items
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pt-2.5 pr-1 space-y-2">
                {displayLines.length === 0 ? (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center px-4 py-8">
                    <div className="w-12 h-12 rounded-sm bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                      <ShoppingBag size={22} />
                    </div>
                    <p className="text-sm font-bold text-gray-600">Ready for Next Customer</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Items scanned or added on your POS register will appear here automatically in real time.
                    </p>
                  </div>
                ) : (
                  displayLines.map((line, idx) => {
                  const lineTotal = (line.unitPrice - (line.discountAmount ?? 0)) * line.qty;

                  return (
                    <div
                      key={line.sku || `${line.name}-${idx}`}
                      className={cn(
                        "flex items-center justify-between p-2.5 sm:p-3 rounded-sm border border-slate-100 bg-white shadow-xs transition",
                        isOrange ? "hover:border-orange-200" : "hover:border-brand-border"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border text-xl",
                            isOrange ? "bg-orange-50 border-orange-200" : "bg-brand-50 border-brand-border"
                          )}
                        >
                          {DEMO_EMOJIS[idx % DEMO_EMOJIS.length]}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-sm bg-slate-900 text-white font-black text-xs shrink-0">
                              {line.qty}x
                            </span>
                            <h3 className="font-bold text-gray-700 text-sm leading-tight truncate">{line.name}</h3>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400 font-medium">{fmtDisplayMoney(line.unitPrice)} / unit</span>
                            {line.category && (
                              <span
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-sm font-semibold border",
                                  isOrange ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-brand-50 text-brand-dark border-brand-border"
                                )}
                              >
                                {line.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-black text-sm sm:text-base text-gray-700 tracking-tight tabular-nums">
                          {fmtDisplayMoney(lineTotal)}
                        </span>
                        <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase mt-0.5">TOTAL</span>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>

            <div
              className={cn(
                "col-span-12 lg:col-span-5 rounded-sm border bg-white shadow-xs p-4 flex flex-col justify-between min-h-0 lg:overflow-y-auto",
                isOrange ? "border-orange-100" : "border-brand-border"
              )}
            >
              <div>
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <CreditCard size={15} className={isOrange ? "text-orange-600" : "text-brand-primary"} />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">ORDER SUMMARY</span>
                </div>

                <div className="py-2.5 space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-700 tabular-nums">{fmtDisplayMoney(subtotal)}</span>
                  </div>

                  {tax > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">VAT / Tax</span>
                      <span className="font-bold text-gray-700 tabular-nums">{fmtDisplayMoney(tax)}</span>
                    </div>
                  )}

                  {serviceCharge > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Service Charge</span>
                      <span className="font-bold text-gray-700 tabular-nums">{fmtDisplayMoney(serviceCharge)}</span>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-600 font-semibold">🎁 Discount</span>
                      <span className="font-bold text-emerald-600 tabular-nums">-{fmtDisplayMoney(discount)}</span>
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    "rounded-sm p-3.5 sm:p-4 text-white shadow-md my-1.5",
                    isOrange ? "bg-orange-600" : "bg-brand-gradient"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-white/90">AMOUNT DUE</span>
                    <span className="text-xs font-bold text-white/90">BDT (৳)</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mt-1.5 tabular-nums">
                    {fmtDisplayMoney(total)}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">PAYMENT OPTIONS</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-sm border",
                        isOrange ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-brand-50 text-brand-dark border-brand-border"
                      )}
                    >
                      POS Checkout
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-2.5">
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
                            "py-1.5 rounded-sm text-xs font-bold transition-all text-center cursor-pointer border",
                            isActive
                              ? isOrange
                                ? "bg-orange-600 text-white border-transparent shadow-xs"
                                : "bg-brand-primary text-white border-transparent shadow-xs"
                              : "bg-slate-50 text-gray-600 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-sm border",
                      isOrange ? "border-orange-100 bg-orange-50/40" : "border-brand-border bg-brand-50/70"
                    )}
                  >
                    <div
                      className="rounded-sm border border-slate-200/90 bg-white p-2 shadow-xs"
                      dangerouslySetInnerHTML={{
                        __html: buildQrSvg(qrPayload, 124, isOrange ? "#ea580c" : "#0284c7"),
                      }}
                    />
                    <p className="text-xs font-bold text-gray-700 mt-2">{activePaymentHint.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{activePaymentHint.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-2.5 text-gray-400 text-xs font-medium border-t border-slate-100 mt-2.5">
                <SmilePlus size={14} className={isOrange ? "text-orange-500" : "text-brand-primary"} />
                <span>Thank you for shopping with us!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
