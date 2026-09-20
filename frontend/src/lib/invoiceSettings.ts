"use client";

export type InvoiceBusinessType = "retail" | "restaurant" | "grocery" | "pharmacy" | "wholesale" | "general";
export type InvoicePaperWidth = "80mm" | "58mm";

export interface InvoiceSettings {
  // General & Business Type
  businessType: InvoiceBusinessType;
  paperWidth: InvoicePaperWidth;

  // Header Details
  storeName: string;
  storeSubtitle: string;
  vatBinNo: string;
  phoneContact: string;
  address: string;

  // Footer & Policy Notes
  footerMessage: string;
  returnPolicyText: string;

  // Show / Hide Controls (Header & Meta)
  showStoreHeader: boolean;
  showStoreSubtitle: boolean;
  showVatBin: boolean;
  showPhoneContact: boolean;
  showInvoiceNo: boolean;
  showDateTime: boolean;
  showCustomer: boolean;
  showCashier: boolean;
  showOrderType: boolean;

  // Show / Hide Controls (Items Table)
  showItemSku: boolean;
  showUnitPrice: boolean;

  // Show / Hide Controls (Financial Totals)
  showSubtotal: boolean;
  showDiscount: boolean;
  showVatBreakdown: boolean;
  showServiceCharge: boolean;
  showNetPayable: boolean;
  showPaymentMethod: boolean;
  showPaidAmount: boolean;
  showChangeReturn: boolean;

  // Show / Hide Controls (Footer & Security)
  showBarcode: boolean;
  showQrCode: boolean;
  showReturnPolicy: boolean; // Must be false for restaurant!
  showFooterNote: boolean;
  showWatermark: boolean;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  businessType: "retail",
  paperWidth: "80mm",

  storeName: "BLUE OCEANS POS",
  storeSubtitle: "Dhaka Flagship Outlet • Counter #POS-01",
  vatBinNo: "002938194-0101 • Mushak-6.3",
  phoneContact: "+880 1711-000000",
  address: "Gulshan-1, Dhaka-1212",

  footerMessage: "Thank you for your business! Please visit us again.",
  returnPolicyText: "",

  showStoreHeader: true,
  showStoreSubtitle: true,
  showVatBin: true,
  showPhoneContact: false,
  showInvoiceNo: true,
  showDateTime: true,
  showCustomer: true,
  showCashier: true,
  showOrderType: true,

  showItemSku: true,
  showUnitPrice: true,

  showSubtotal: true,
  showDiscount: true,
  showVatBreakdown: true,
  showServiceCharge: true,
  showNetPayable: true,
  showPaymentMethod: true,
  showPaidAmount: true,
  showChangeReturn: true,

  showBarcode: true,
  showQrCode: false,
  showReturnPolicy: false,
  showFooterNote: true,
  showWatermark: true,
};

const STORAGE_KEY = "bpos_invoice_print_settings";
const SETTINGS_VERSION = "v2"; // bump when defaults change to clear old cache
const VERSION_KEY = "bpos_invoice_settings_version";

/**
 * Get current invoice settings from localStorage, merged with defaults.
 */
export function getInvoiceSettings(): InvoiceSettings {
  if (typeof window === "undefined") return DEFAULT_INVOICE_SETTINGS;
  try {
    // Clear cache if settings version changed (defaults were updated)
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== SETTINGS_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, SETTINGS_VERSION);
      return DEFAULT_INVOICE_SETTINGS;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INVOICE_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_INVOICE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_INVOICE_SETTINGS;
  }
}

/**
 * Save invoice settings to localStorage and trigger global update event.
 */
export function saveInvoiceSettings(settings: Partial<InvoiceSettings>): InvoiceSettings {
  if (typeof window === "undefined") return DEFAULT_INVOICE_SETTINGS;
  const current = getInvoiceSettings();
  const updated: InvoiceSettings = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(VERSION_KEY, SETTINGS_VERSION);
    window.dispatchEvent(new CustomEvent("invoice-settings-changed", { detail: updated }));
  } catch (err) {
    console.error("Failed to save invoice settings", err);
  }
  return updated;
}

/**
 * Reset settings to factory defaults.
 */
export function resetInvoiceSettings(): InvoiceSettings {
  if (typeof window === "undefined") return DEFAULT_INVOICE_SETTINGS;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("invoice-settings-changed", { detail: DEFAULT_INVOICE_SETTINGS }));
  } catch {}
  return DEFAULT_INVOICE_SETTINGS;
}
