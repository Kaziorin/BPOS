"use client";

import Link from "next/link";
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
  SmilePlus,
  PlusCircle,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import {
  subscribeRestaurantCart,
  readRestaurantCart,
  publishRestaurantCart,
  fmtDisplayMoney,
  playDisplayScanSound,
  playDisplaySuccessChime,
  buildQrSvg,
  formatDisplayClock,
  type DisplayCart,
} from "@/lib/customer-display";
import { isOnline } from "@/lib/offline/db";
import { cn } from "@/lib/cn";

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

const PAYMENT_HINTS: Record<"cash" | "card" | "qr" | "wallet" | "split", { title: string; subtitle: string }> = {
  cash: { title: "Pay Cash at Counter / Table", subtitle: "Server will bring change & printed bill" },
  card: { title: "Card Terminal Available", subtitle: "Visa, Mastercard & Contactless accepted" },
  qr: { title: "Scan to Pay with bKash / Nagad", subtitle: "Instant & Secure Payment" },
  wallet: { title: "Pay via Dining Wallet", subtitle: "Apply loyalty points or member balance" },
  split: { title: "Split Bill Equally", subtitle: "Split across guests or payment methods" },
};

function LiveClockCapsule() {
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
    <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-sm border bg-orange-50/80 border-orange-200/90 text-gray-700 shadow-xs">
      <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-orange-100 text-orange-600 text-sm">
        <Scale size={14} />
      </div>
      <div className="text-left leading-tight min-w-[110px]">
        <div className="text-[13px] font-black tracking-tight text-gray-700 tabular-nums">
          {clock ? (
            <>
              {clock.hh}:{clock.mm}:{clock.ss}{" "}
              <span className="text-xs font-bold text-orange-600 uppercase">{clock.ap}</span>
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

export default function RestaurantCustomerDisplayPage() {
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
    const init = window.setTimeout(() => setCart(readRestaurantCart()), 0);
    const unsub = subscribeRestaurantCart((data) => {
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

  const lines = cart?.lines || [];
  const hasItems = lines.length > 0;
  const subtotal = cart?.subtotal || (hasItems ? lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) : 0);
  const tax = cart?.taxTotal || 0;
  const taxableBase = cart?.taxableBase;
  const inclusiveTax = cart?.inclusiveTax || 0;
  const discount = cart?.discountTotal || 0;
  const serviceCharge = cart?.serviceCharge || 0;
  const total = cart?.total || (hasItems ? subtotal - discount + tax + serviceCharge : 0);

  const customerName = cart?.customerName;
  const customerTier = cart?.customerTier || "Dine-In";
  const customerPoints = cart?.customerPoints ?? 0;
  const tableNo = cart?.tableNo || (cart?.orderType ? cart.orderType.replace("_", " ") : "TABLE 01");
  const merchantName = cart?.merchantName || "BPOS Restaurant";
  const cashierName = cart?.cashierName || "Waiter";
  const qrPayload = `bpos-restaurant-bill-${cart?.updatedAt || "standby"}-${Math.round(total)}`;
  const activePaymentHint = PAYMENT_HINTS[selectedPayment];

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

  return (
    <>
      {showThankYou && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 45%, #dc2626 100%)" }}
        >
          <div className="flex flex-col items-center gap-4 text-center px-6 sm:px-8 text-white animate-in zoom-in-95 duration-300">
            <div className="text-7xl sm:text-8xl leading-none animate-bounce">🙏</div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">Thank You!</h1>
            <p className="text-xl sm:text-2xl font-bold opacity-95">
              {customerName ? `ধন্যবাদ, ${customerName}!` : "Payment Successful!"}
            </p>
            <p className="text-base sm:text-lg opacity-85">Thank you for dining with us! Enjoy your meal.</p>
            <div className="mt-2 px-6 py-2.5 rounded-full bg-white/20 border border-white/30 backdrop-blur font-bold text-sm">
              {tableNo} • Total Paid: {fmtDisplayMoney(total)}
            </div>
          </div>
        </div>
      )}

      <div
        id="restaurant-customer-display"
        className="min-h-screen lg:h-screen w-full flex flex-col justify-between overflow-y-auto lg:overflow-hidden p-3 sm:p-4 select-none"
        style={{ background: "linear-gradient(180deg, #ffedd5 0%, #fff7ed 15%, #f8fafc 100%)" }}
      >
        <div className="flex flex-col gap-2.5 sm:gap-3 flex-1 min-h-0 max-w-[1700px] w-full mx-auto">
          <header className="rounded-sm border border-orange-200/80 bg-white shadow-xs px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border shrink-0 bg-orange-50 border-orange-200 text-orange-600 shadow-xs">
                <Utensils size={20} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-gray-700 text-base sm:text-lg leading-tight tracking-tight truncate">
                    {merchantName}
                  </span>
                  <span className="px-2 py-0.5 rounded-sm text-[11px] font-black uppercase tracking-wider text-white bg-orange-600 shadow-xs">
                    {tableNo}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    CUSTOMER DISPLAY TERMINAL
                  </span>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className={cn("flex items-center gap-1 text-[11px] font-bold", online ? "text-orange-600" : "text-rose-500")}>
                    {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {online ? (hasItems ? "POS Live Synced" : "POS Connected • Live") : "POS Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center">
              <LiveClockCapsule />
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Link
                href="/restaurant/pos"
                className="flex items-center gap-1.5 h-9 px-3 rounded-sm border border-slate-200 bg-white text-gray-600 hover:text-orange-600 hover:border-orange-200 text-xs font-bold transition shadow-xs cursor-pointer"
                title="Back to Restaurant POS"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Back to POS</span>
              </Link>

              {hasItems ? (
                <button
                  onClick={handleClearCart}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Clear Cart"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              ) : (
                <button
                  onClick={handleQuickDemo}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-sm border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Load sample restaurant order"
                >
                  <PlusCircle size={13} className="text-orange-600" />
                  <span>Demo Order</span>
                </button>
              )}

              <button
                id="cdisp-sound"
                onClick={() => setSoundOn((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 bg-white text-gray-600 hover:text-orange-600 hover:border-orange-300 transition shadow-xs cursor-pointer"
                title={soundOn ? "Mute" : "Enable sound"}
              >
                {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <button
                id="cdisp-fullscreen"
                onClick={toggleFs}
                className="flex h-9 w-9 items-center justify-center rounded-sm bg-orange-600 hover:bg-orange-700 text-white transition shadow-xs cursor-pointer"
                title="Toggle fullscreen"
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </header>

          <div className="rounded-sm border border-orange-100 bg-white shadow-xs px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full font-black text-base shadow-xs shrink-0 bg-orange-100 text-orange-700 border border-orange-200">
                {(customerName || tableNo || "G").charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-gray-700 text-sm sm:text-base truncate">
                    {customerName ? `Welcome back, ${customerName}!` : `Welcome to ${tableNo}!`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    {customerTier}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Loyalty Balance: {customerPoints} Pts</span>
                  <span>•</span>
                  <span>Server: {cashierName}</span>
                </div>
              </div>
            </div>

            {hasItems ? (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 shrink-0">
                🟢 Live Order Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-gray-500 border border-slate-200 shrink-0">
                Waiting for order scan…
              </span>
            )}
          </div>

          <div className="grid grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0">
            <div className="col-span-12 lg:col-span-7 rounded-sm border border-orange-100 bg-white shadow-xs p-4 flex flex-col min-h-[300px] lg:min-h-0 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm border shrink-0 bg-orange-50 border-orange-200 text-orange-600 shadow-xs">
                    <ShoppingBag size={17} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-gray-700 text-sm sm:text-base leading-none">Basket Items</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Live scan itemization</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
                  {lines.reduce((s, l) => s + l.qty, 0)} {lines.reduce((s, l) => s + l.qty, 0) === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pt-2.5 pr-1 space-y-2">
                {hasItems ? (
                  lines.map((line, idx) => {
                    const lineTotal = (line.unitPrice - (line.discountAmount ?? 0)) * line.qty;

                    return (
                      <div
                        key={line.sku || `${line.name}-${idx}`}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-sm border border-slate-100 bg-white shadow-xs hover:border-orange-200 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-orange-200 bg-orange-50 text-xl shadow-xs">
                            {getFoodEmoji(line.name, idx)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-sm bg-slate-900 text-white font-black text-xs shrink-0">
                                {line.qty}x
                              </span>
                              <h3 className="font-bold text-gray-700 text-sm leading-tight truncate">{line.name}</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400 font-medium">{fmtDisplayMoney(line.unitPrice)} / unit</span>
                              {line.category && (
                                <span className="text-[10px] px-2 py-0.5 rounded-sm bg-orange-50 text-orange-700 font-semibold border border-orange-100">
                                  {line.category}
                                </span>
                              )}
                              {line.notes && (
                                <span className="text-[10px] px-2 py-0.5 rounded-sm bg-slate-100 text-gray-600 font-medium truncate max-w-[200px]">
                                  {line.notes}
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
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6 text-gray-400">
                    <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-orange-50 border border-orange-200 text-orange-500 mb-3 shadow-xs">
                      <Utensils size={28} />
                    </div>
                    <h3 className="font-extrabold text-gray-600 text-base">Your Basket is Empty</h3>
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

            <div className="col-span-12 lg:col-span-5 rounded-sm border border-orange-100 bg-white shadow-xs p-4 flex flex-col justify-between min-h-0 lg:overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <CreditCard size={15} className="text-orange-600" />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">ORDER SUMMARY</span>
                </div>

                <div className="py-2.5 space-y-1.5">
                  {inclusiveTax > 0 ? (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Base Price (Net)</span>
                        <span className="font-bold text-gray-700 tabular-nums">
                          {fmtDisplayMoney(taxableBase !== undefined ? taxableBase : Math.max(0, subtotal - inclusiveTax))}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-emerald-600 font-semibold">🎁 Discount</span>
                          <span className="font-bold text-emerald-600 tabular-nums">−{fmtDisplayMoney(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">
                          VAT / Tax <span className="text-xs text-emerald-600 font-semibold">(Incl.)</span>
                        </span>
                        <span className="font-bold text-emerald-600 tabular-nums">+{fmtDisplayMoney(tax)}</span>
                      </div>
                    </>
                  ) : (
                    <>
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
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">VAT / Tax</span>
                        <span className="font-bold text-gray-700 tabular-nums">+{fmtDisplayMoney(tax)}</span>
                      </div>
                    </>
                  )}

                  {serviceCharge > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Service Charge</span>
                      <span className="font-bold text-gray-700 tabular-nums">+{fmtDisplayMoney(serviceCharge)}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-sm p-3.5 sm:p-4 text-white shadow-md my-1.5 bg-orange-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-orange-100 block">AMOUNT DUE</span>
                      {inclusiveTax > 0 && (
                        <span className="text-[11px] font-medium text-white/90">
                          (Includes {fmtDisplayMoney(inclusiveTax)} VAT)
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-orange-100">BDT (৳)</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mt-1.5 tabular-nums">
                    {fmtDisplayMoney(total)}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">PAYMENT OPTIONS</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-orange-50 text-orange-700 border border-orange-200">
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
                              ? "bg-orange-600 text-white border-transparent shadow-xs"
                              : "bg-slate-50 text-gray-600 border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                          )}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-sm border border-orange-100 bg-orange-50/40">
                    <div
                      className="rounded-sm border border-slate-200/90 bg-white p-2 shadow-xs"
                      dangerouslySetInnerHTML={{ __html: buildQrSvg(qrPayload, 124, "#ea580c") }}
                    />
                    <p className="text-xs font-bold text-gray-700 mt-2">{activePaymentHint.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{activePaymentHint.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-2.5 text-gray-400 text-xs font-medium border-t border-slate-100 mt-2.5">
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
