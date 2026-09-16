export type GlobalThemeId =
  | "ocean-teal"
  | "retail"
  | "restaurant"
  | "pharmacy"
  | "grocery"
  | "wholesale"
  | "manufacturing"
  | "salon"
  | "repair"
  | "franchise"
  | "royal-sapphire"
  | "midnight-violet"
  | "slate-charcoal";

export interface GlobalThemeConfig {
  id: GlobalThemeId;
  name: string;
  subtitle: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  previewBg: string;
  description: string;
}

export const GLOBAL_THEMES: Record<GlobalThemeId, GlobalThemeConfig> = {
  "ocean-teal": {
    id: "ocean-teal",
    name: "Blue Ocean (Default)",
    subtitle: "Modern Ocean Azure · Clean",
    primaryHex: "#0284C7",
    secondaryHex: "#0369A1",
    accentHex: "#38BDF8",
    previewBg: "from-sky-600 via-blue-600 to-sky-900",
    description: "Blue Ocean executive theme with vibrant ocean azure gradients, high readability, and clean modern card styling.",
  },
  retail: {
    id: "retail",
    name: "Retail & Apparel Blue",
    subtitle: "Modern Store & Kiosk",
    primaryHex: "#3B82F6",
    secondaryHex: "#2563EB",
    accentHex: "#8B5CF6",
    previewBg: "from-blue-600 via-indigo-600 to-slate-900",
    description: "Modern retail blue theme with barcode matrix, customer loyalty, and checkout kiosk styling.",
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurant Flame Orange",
    subtitle: "Dining & Kitchen KDS",
    primaryHex: "#EA580C",
    secondaryHex: "#F97316",
    accentHex: "#F59E0B",
    previewBg: "from-orange-600 via-amber-600 to-stone-900",
    description: "Warm culinary flame orange theme with table mapping and KDS status indicators.",
  },
  pharmacy: {
    id: "pharmacy",
    name: "Pharmacy Clinical Cyan",
    subtitle: "Healthcare & FEFO Expiry",
    primaryHex: "#06B6D4",
    secondaryHex: "#0891B2",
    accentHex: "#3B82F6",
    previewBg: "from-cyan-600 via-teal-600 to-slate-900",
    description: "Clean medical cyan theme with FEFO expiry and prescription handling.",
  },
  grocery: {
    id: "grocery",
    name: "Grocery Organic Emerald",
    subtitle: "Fresh Produce & Scale Barcodes",
    primaryHex: "#10B981",
    secondaryHex: "#059669",
    accentHex: "#84CC16",
    previewBg: "from-emerald-600 via-green-600 to-slate-900",
    description: "Fresh green organic theme with scale barcode scanning and batch tracking.",
  },
  wholesale: {
    id: "wholesale",
    name: "Wholesale Action Blue",
    subtitle: "B2B Bulk Tiered Credit",
    primaryHex: "#0066FF",
    secondaryHex: "#0052CC",
    accentHex: "#3B82F6",
    previewBg: "from-blue-700 via-cyan-700 to-slate-900",
    description: "Vibrant B2B blue theme for bulk tier pricing and credit ledger management.",
  },
  manufacturing: {
    id: "manufacturing",
    name: "Manufacturing Amber Gold",
    subtitle: "Recipe BOM & Work Orders",
    primaryHex: "#F59E0B",
    secondaryHex: "#D97706",
    accentHex: "#B45309",
    previewBg: "from-amber-600 via-orange-600 to-zinc-900",
    description: "Industrial amber gold theme with work orders and raw material BOM management.",
  },
  salon: {
    id: "salon",
    name: "Salon Glamour Rose",
    subtitle: "Spa Beauty & Stylist Appointments",
    primaryHex: "#F43F5E",
    secondaryHex: "#E11D48",
    accentHex: "#EC4899",
    previewBg: "from-rose-600 via-pink-600 to-slate-900",
    description: "Luxurious rose pink theme for appointment scheduling and stylist commissions.",
  },
  repair: {
    id: "repair",
    name: "Repair Electric Violet",
    subtitle: "Tech Jobs & Device IMEI",
    primaryHex: "#8B5CF6",
    secondaryHex: "#7C3AED",
    accentHex: "#6366F1",
    previewBg: "from-violet-600 via-purple-600 to-slate-900",
    description: "Tech repair violet theme with job cards, device IMEI, and warranty tracking.",
  },
  franchise: {
    id: "franchise",
    name: "Franchise Corporate Slate",
    subtitle: "Multi-Branch Royalty Sync",
    primaryHex: "#475569",
    secondaryHex: "#334155",
    accentHex: "#0F172A",
    previewBg: "from-slate-700 via-slate-800 to-slate-950",
    description: "Corporate slate theme for multi-branch sync and royalty reporting.",
  },
  "royal-sapphire": {
    id: "royal-sapphire",
    name: "Royal Sapphire",
    subtitle: "Modern Ocean Azure",
    primaryHex: "#3B9ADF",
    secondaryHex: "#1669ac",
    accentHex: "#60b5f6",
    previewBg: "from-sky-900 via-blue-900 to-slate-900",
    description: "Executive ocean azure blue theme for enterprise management and multi-branch stores.",
  },
  "midnight-violet": {
    id: "midnight-violet",
    name: "Midnight Violet",
    subtitle: "Luxury Deep Purple",
    primaryHex: "#7c3aed",
    secondaryHex: "#6d28d9",
    accentHex: "#8b5cf6",
    previewBg: "from-violet-900 via-purple-950 to-slate-900",
    description: "Sophisticated deep violet theme tailored for boutique salons, spas, and fashion retail.",
  },
  "slate-charcoal": {
    id: "slate-charcoal",
    name: "Slate Charcoal",
    subtitle: "Minimalist Modern Dark",
    primaryHex: "#475569",
    secondaryHex: "#334155",
    accentHex: "#64748b",
    previewBg: "from-slate-800 via-zinc-900 to-black",
    description: "High-contrast minimalist dark slate layout with ultra-clean precision styling.",
  },
};

export function getGlobalThemeConfig(themeId: GlobalThemeId = "ocean-teal"): GlobalThemeConfig {
  return GLOBAL_THEMES[themeId] || GLOBAL_THEMES["ocean-teal"];
}

export type VerticalThemeId =
  | "restaurant"
  | "grocery"
  | "pharmacy"
  | "retail"
  | "wholesale"
  | "salon"
  | "manufacturing"
  | "repair"
  | "franchise";

export interface VerticalThemeConfig {
  id: VerticalThemeId;
  name: string;
  primaryHex: string;
  accentHex: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const VERTICAL_THEMES: Record<VerticalThemeId, VerticalThemeConfig> = {
  restaurant: {
    id: "restaurant",
    name: "Restaurant & Culinary",
    primaryHex: "#ea580c", // Flame Orange
    accentHex: "#f59e0b",
    badgeBg: "bg-orange-500/10 border-orange-500/30",
    badgeText: "text-orange-400",
    description: "Warm culinary theme with vibrant orange highlights & KDS status indicators.",
  },
  grocery: {
    id: "grocery",
    name: "Grocery & Supermarket",
    primaryHex: "#10b981", // Emerald Green
    accentHex: "#84cc16",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30",
    badgeText: "text-emerald-400",
    description: "Fresh green organic theme with barcode scan & batch tracking.",
  },
  pharmacy: {
    id: "pharmacy",
    name: "Pharmacy & Health",
    primaryHex: "#06b6d4", // Clinical Cyan
    accentHex: "#3b82f6",
    badgeBg: "bg-cyan-500/10 border-cyan-500/30",
    badgeText: "text-cyan-400",
    description: "Clean medical cyan theme with FEFO expiry & prescription handling.",
  },
  retail: {
    id: "retail",
    name: "Retail & Apparel",
    primaryHex: "#3b82f6", // Royal Blue
    accentHex: "#8b5cf6",
    badgeBg: "bg-blue-500/10 border-blue-500/30",
    badgeText: "text-blue-400",
    description: "Modern retail blue theme with variant matrix & checkout kiosk.",
  },
  wholesale: {
    id: "wholesale",
    name: "Wholesale & Distribution",
    primaryHex: "#0066ff", // Action Blue (POS mock)
    accentHex: "#3b82f6",
    badgeBg: "bg-blue-500/10 border-blue-500/30",
    badgeText: "text-blue-500",
    description: "Vibrant B2B blue theme for bulk tier pricing & credit ledger.",
  },
  salon: {
    id: "salon",
    name: "Salon & Beauty Spa",
    primaryHex: "#f43f5e", // Glamour Rose
    accentHex: "#ec4899",
    badgeBg: "bg-rose-500/10 border-rose-500/30",
    badgeText: "text-rose-400",
    description: "Luxurious rose pink theme for appointments & stylist commissions.",
  },
  manufacturing: {
    id: "manufacturing",
    name: "Manufacturing & Bakery",
    primaryHex: "#f59e0b", // Amber Gold
    accentHex: "#d97706",
    badgeBg: "bg-amber-500/10 border-amber-500/30",
    badgeText: "text-amber-400",
    description: "Industrial amber gold theme with work orders & raw material BOM.",
  },
  repair: {
    id: "repair",
    name: "Repair & Service Center",
    primaryHex: "#8b5cf6", // Electric Violet
    accentHex: "#6366f1",
    badgeBg: "bg-violet-500/10 border-violet-500/30",
    badgeText: "text-violet-400",
    description: "Tech repair violet theme with job cards & device IMEI tracking.",
  },
  franchise: {
    id: "franchise",
    name: "Franchise & Multi-Store",
    primaryHex: "#475569", // Slate Navy
    accentHex: "#0f172a",
    badgeBg: "bg-slate-500/10 border-slate-500/30",
    badgeText: "text-slate-400",
    description: "Corporate slate theme for multi-branch sync & royalty reporting.",
  },
};

export function getThemeConfig(themeId: VerticalThemeId = "restaurant"): VerticalThemeConfig {
  return VERTICAL_THEMES[themeId] || VERTICAL_THEMES.restaurant;
}

