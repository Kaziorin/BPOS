"use client";

import { useEffect, useMemo, useState } from "react";
import { QrCode, Wifi, WifiOff, ShoppingBag, CheckCircle2 } from "lucide-react";
import { subscribeCart, readCart, type DisplayCart } from "@/lib/customer-display";
import { isOnline } from "@/lib/offline/db";
import { cn } from "@/lib/cn";

/**
 * Customer-facing display (§27) — run on a second screen / second tab.
 * Renders the POS register's live cart (lines, qty, price, discount, total)
 * and shows a payment QR at checkout. Works while the register is offline too.
 */

function qrSvg(payload: string, size = 220): string {
  // Deterministic pseudo-random QR-ish matrix (decorative placeholder until a
  // gateway is wired) — visual stand-in for the payment code.
  let seed = 0;
  for (const ch of payload) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const cells: boolean[][] = [];
  const n = 25;
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const inFinder =
        (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      row.push(inFinder ? !((x + y) % 2 === 0 || x === 0 || y === 0 || x === 6 || y === 6) : (seed & 1) === 1);
    }
    cells.push(row);
  }
  const cell = size / n;
  const rects: string[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (cells[y][x]) rects.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#fff"/>${rects.join("")}</svg>`;
}

function fmt(n: number): string {
  return Number(n || 0).toFixed(2);
}

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<DisplayCart>(() => readCart());
  const [online, setOnline] = useState(true);
  const [showPaid, setShowPaid] = useState(false);

  useEffect(() => {
    setOnline(isOnline());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    return subscribeCart((c) => {
      setCart(c);
      setShowPaid(c.status === "PAID");
    });
  }, []);

  const lines = useMemo(() => cart.lines ?? [], [cart.lines]);
  const empty = lines.length === 0;

  // Payment QR payload (UPI-style placeholder payload from the register sale)
  const qrPayload = empty
    ? "omni://pos?state=idle"
    : `upiqr://pay?pa=merchant@omni&pn=OmniPOS&am=${fmt(cart.total)}&tn=${cart.invoiceNo ?? "SALE"}`;

  return (
    <div className="flex h-[calc(100vh-4rem)] items-stretch gap-6 overflow-hidden">
      {/* LEFT — Live itemized order */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary-600" />
            <span className="text-lg font-semibold text-gray-900">Your Order</span>
          </div>
          <span className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            online ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
          )}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? "Register connected" : "Register offline — order still counts"}
          </span>
        </div>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingBag size={44} className="text-gray-200" />
            <p className="text-lg font-medium text-gray-500">Your order will appear here</p>
            <p className="max-w-sm text-sm text-gray-400">
              Items scanned at the register show up live on this screen.
            </p>
          </div>
        ) : showPaid ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <CheckCircle2 size={56} className="text-emerald-500" />
            <p className="text-2xl font-bold text-gray-900">Payment complete</p>
            <p className="text-sm text-gray-500">Thank you! Your order is being prepared.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {lines.map((l, i) => (
                <div key={i} className="flex items-start justify-between gap-4 rounded-xl border border-gray-50 bg-gray-50/60 px-4 py-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">
                      {l.qty}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-medium text-gray-900">{l.name}</p>
                      <p className="text-sm text-gray-400 tabular-nums">
                        {fmt(l.unitPrice)} × {l.qty}
                        {l.discountAmount > 0 && (
                          <span className="ml-1 font-medium text-amber-500">−{fmt(l.discountAmount)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 tabular-nums">
                    {fmt(l.qty * l.unitPrice - l.discountAmount)}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t border-gray-100 px-6 py-4 text-base">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span className="tabular-nums">{fmt(cart.subtotal)}</span>
              </div>
              {cart.discountTotal > 0 && (
                <div className="flex justify-between font-medium text-amber-600">
                  <span>Discount</span><span className="tabular-nums">−{fmt(cart.discountTotal)}</span>
                </div>
              )}
              {cart.taxTotal > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>VAT</span><span className="tabular-nums">{fmt(cart.taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-2xl font-bold text-gray-900">
                <span>Total</span><span className="tabular-nums">{fmt(cart.total)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT — Payment QR */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <QrCode size={16} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Pay with QR</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-6">
          <div
            className="overflow-hidden rounded-2xl border-4 border-gray-900"
            dangerouslySetInnerHTML={{ __html: qrSvg(qrPayload) }}
          />
          <p className="text-center text-xs text-gray-400">
            Scan to pay {empty ? "" : `${fmt(cart.total)} `}at checkout
            <br />
            <span className="text-gray-300">(payment gateway QR — shown live at the register)</span>
          </p>
          {!empty && (
            <div className="w-full rounded-xl bg-gray-50 px-4 py-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Amount due</p>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{fmt(cart.total)}</p>
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 px-5 py-3 text-center text-[11px] text-gray-300">
          Updated {new Date(cart.updatedAt || Date.now()).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
