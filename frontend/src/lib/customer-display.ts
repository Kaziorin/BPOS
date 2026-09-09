"use client";

/**
 * Customer-facing display bridge (§27).
 *
 * The POS register publishes its live cart (lines + totals) to localStorage;
 * the customer display page (second screen / second tab) subscribes via the
 * `storage` event and renders the same cart in real time — no polling, no
 * server round-trip, and it keeps working offline.
 */

export interface DisplayLine {
  name: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
  uom?: string;
  sku?: string;
  category?: string;
  image?: string;
}

export interface DisplayCart {
  updatedAt: number;
  invoiceNo?: string;
  lines: DisplayLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  serviceCharge?: number;
  total: number;
  paidTotal?: number;
  changeTotal?: number;
  paymentMethod?: string;
  status: "IDLE" | "ACTIVE" | "PAID";
  customerName?: string;
  customerTier?: string;
  customerPoints?: number;
  pointsEarned?: number;
  merchantName?: string;
  cashierName?: string;
  laneNo?: string;
}

const KEY = "omni_pos_display_cart";

export function emptyDisplayCart(): DisplayCart {
  return {
    updatedAt: Date.now(),
    lines: [],
    subtotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    total: 0,
    status: "IDLE",
  };
}

export function publishCart(cart: DisplayCart): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    /* storage unavailable */
  }
}

export function readCart(): DisplayCart {
  if (typeof window === "undefined") return emptyDisplayCart();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyDisplayCart();
    return JSON.parse(raw) as DisplayCart;
  } catch {
    return emptyDisplayCart();
  }
}

export function subscribeCart(cb: (cart: DisplayCart) => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb(readCart());
  };
  window.addEventListener("storage", onStorage);
  // Storage events only fire in *other* tabs, so also poll cheaply for
  // same-tab navigation between /pos and /customer-display.
  const poll = window.setInterval(() => cb(readCart()), 1500);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.clearInterval(poll);
  };
}
