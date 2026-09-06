"use client";

/**
 * POS keyboard shortcuts (§27 — UI/UX principles).
 *
 * Defaults follow the spec: F1 Search · F2 Customer · F3 Discount ·
 * F4 Payment · F5 Hold · F6 Resume · F7 Return. Every binding is
 * user-configurable and persisted per-browser in localStorage.
 */

export type PosShortcutAction =
  | "search"
  | "customer"
  | "discount"
  | "payment"
  | "hold"
  | "resume"
  | "return";

export const SHORTCUT_ACTIONS: PosShortcutAction[] = [
  "search",
  "customer",
  "discount",
  "payment",
  "hold",
  "resume",
  "return",
];

export const ACTION_LABELS: Record<PosShortcutAction, string> = {
  search: "Search / Scan barcode",
  customer: "Select customer",
  discount: "Discount",
  payment: "Payment / Checkout",
  hold: "Hold sale",
  resume: "Resume held sale",
  return: "Return / Refund",
};

export const DEFAULT_SHORTCUTS: Record<PosShortcutAction, string> = {
  search: "F1",
  customer: "F2",
  discount: "F3",
  payment: "F4",
  hold: "F5",
  resume: "F6",
  return: "F7",
};

const STORAGE_KEY = "omni_pos_shortcuts";

export function loadShortcuts(): Record<PosShortcutAction, string> {
  if (typeof window === "undefined") return { ...DEFAULT_SHORTCUTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SHORTCUTS };
    const parsed = JSON.parse(raw) as Partial<Record<PosShortcutAction, string>>;
    const merged: Record<PosShortcutAction, string> = { ...DEFAULT_SHORTCUTS };
    for (const a of SHORTCUT_ACTIONS) {
      if (parsed[a]) merged[a] = parsed[a];
    }
    return merged;
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
}

export function saveShortcuts(map: Record<PosShortcutAction, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
}

/** True when the event matches a binding like "F1" or "Ctrl+P". */
export function matchesBinding(e: KeyboardEvent, binding: string): boolean {
  const parts = binding.split("+").map((p) => p.trim().toUpperCase());
  const key = parts[parts.length - 1];
  const mods = parts.slice(0, -1);
  if (e.key.toUpperCase() !== key) return false;
  const hasCtrl = mods.includes("CTRL") || mods.includes("CONTROL");
  const hasAlt = mods.includes("ALT");
  const hasShift = mods.includes("SHIFT");
  const hasMeta = mods.includes("META") || mods.includes("CMD") || mods.includes("WIN");
  return e.ctrlKey === hasCtrl && e.altKey === hasAlt &&
    e.shiftKey === hasShift && e.metaKey === hasMeta;
}

/** Readable, ordered list of current bindings for the hint bar / settings. */
export function bindingList(map: Record<PosShortcutAction, string>) {
  return SHORTCUT_ACTIONS.map((action) => ({
    action,
    label: ACTION_LABELS[action],
    binding: map[action],
  }));
}
