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
  notes?: string;
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
  // Restaurant-specific fields
  tableNo?: string;
  orderType?: string;
  guestCount?: number;
  source?: "RESTAURANT" | "RETAIL" | "WHOLESALE" | "GROCERY" | "PHARMACY";
}

const KEY = "omni_pos_display_cart";
const RESTAURANT_KEY = "bpos_restaurant_display_cart";

export function emptyDisplayCart(): DisplayCart {
  return {
    updatedAt: Date.now(),
    lines: [],
    subtotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    serviceCharge: 0,
    total: 0,
    status: "IDLE",
  };
}

export function publishCart(cart: DisplayCart): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("omni_pos_cart_updated", { detail: cart }));
    }
  } catch {
    /* storage unavailable */
  }
}

let restChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    restChannel = new BroadcastChannel("bpos_restaurant_display_channel");
  } catch (_) {}
}

export function publishRestaurantCart(cart: DisplayCart): void {
  try {
    const payload = { ...cart, source: "RESTAURANT" as const };
    localStorage.setItem(RESTAURANT_KEY, JSON.stringify(payload));
    localStorage.setItem(KEY, JSON.stringify(payload));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bpos_restaurant_cart_updated", { detail: payload }));
      window.dispatchEvent(new CustomEvent("omni_pos_cart_updated", { detail: payload }));
      try {
        restChannel?.postMessage(payload);
      } catch (_) {}
    }
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

export function readRestaurantCart(): DisplayCart {
  if (typeof window === "undefined") return emptyDisplayCart();
  try {
    // 1. Check dedicated restaurant display cart key
    const rawRest = localStorage.getItem(RESTAURANT_KEY);
    if (rawRest) {
      const parsed = JSON.parse(rawRest) as DisplayCart;
      if (parsed) return parsed;
    }

    // 2. Check general omni key if it originated from RESTAURANT
    const rawOmni = localStorage.getItem(KEY);
    if (rawOmni) {
      const parsed = JSON.parse(rawOmni) as DisplayCart;
      if (parsed?.source === "RESTAURANT") {
        return parsed;
      }
    }

    // 3. Fallback: Check active restaurant POS cart
    const rawCart = localStorage.getItem("bpos_restaurant_cart");
    if (rawCart) {
      const items = JSON.parse(rawCart);
      if (Array.isArray(items) && items.length > 0) {
        const subtotal = items.reduce((s: number, i: any) => s + (Number(i.unitPrice || 0) * Number(i.qty || 1)), 0);
        const tax = subtotal * 0.15;
        const service = subtotal * 0.04;
        const tblId = localStorage.getItem("bpos_restaurant_selected_table_id");
        return {
          updatedAt: Date.now(),
          source: "RESTAURANT",
          lines: items.map((i: any) => ({
            name: i.name || "Item",
            qty: Number(i.qty || 1),
            unitPrice: Number(i.unitPrice || 0),
            discountAmount: 0,
            sku: i.id,
            image: i.image,
            category: i.category,
          })),
          subtotal,
          discountTotal: 0,
          taxTotal: tax,
          serviceCharge: service,
          total: subtotal + tax + service,
          status: "ACTIVE",
          tableNo: tblId || undefined,
        };
      }
    }

    return emptyDisplayCart();
  } catch {
    return emptyDisplayCart();
  }
}

export function subscribeCart(cb: (cart: DisplayCart) => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb(readCart());
  };
  const onCustom = (e: any) => {
    if (e.detail) cb(e.detail);
    else cb(readCart());
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("omni_pos_cart_updated", onCustom);
  const poll = window.setInterval(() => cb(readCart()), 1000);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("omni_pos_cart_updated", onCustom);
    window.clearInterval(poll);
  };
}

export function subscribeRestaurantCart(cb: (cart: DisplayCart) => void): () => void {
  const handler = () => cb(readRestaurantCart());
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === RESTAURANT_KEY ||
      e.key === KEY ||
      e.key === "bpos_restaurant_cart" ||
      e.key === "bpos_restaurant_selected_table_id"
    ) {
      handler();
    }
  };
  const onCustom = (e: any) => {
    if (e.detail) cb(e.detail);
    else handler();
  };

  const onBc = (e: MessageEvent) => {
    if (e.data) cb(e.data);
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("bpos_restaurant_cart_updated", onCustom);
  window.addEventListener("omni_pos_cart_updated", onCustom);
  try {
    restChannel?.addEventListener("message", onBc);
  } catch (_) {}
  const poll = window.setInterval(handler, 400);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("bpos_restaurant_cart_updated", onCustom);
    window.removeEventListener("omni_pos_cart_updated", onCustom);
    try {
      restChannel?.removeEventListener("message", onBc);
    } catch (_) {}
    window.clearInterval(poll);
  };
}

