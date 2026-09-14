export type GlobalThemeId =
  | "ocean-teal"
  | "royal-sapphire"
  | "emerald-mint"
  | "midnight-violet"
  | "warm-amber"
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
    name: "OmniPOS Teal (Default)",
    subtitle: "Modern Clean Professional",
    primaryHex: "#14B8A6",
    secondaryHex: "#0EA5A0",
    accentHex: "#6366F1",
    previewBg: "from-teal-600 via-emerald-600 to-indigo-900",
    description: "A perfect balance of trust and freshness, designed for all industries — Restaurant, Pharmacy, Grocery, Retail, Wholesale, Salon and more.",
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
  "emerald-mint": {
    id: "emerald-mint",
    name: "Emerald Mint",
    subtitle: "Fresh Organic Green",
    primaryHex: "#059669",
    secondaryHex: "#047857",
    accentHex: "#10b981",
    previewBg: "from-emerald-900 via-teal-950 to-slate-900",
    description: "Clean organic emerald theme ideal for grocery, health, and fresh product counters.",
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
  "warm-amber": {
    id: "warm-amber",
    name: "Warm Amber",
    subtitle: "Craft Copper & Bronze",
    primaryHex: "#d97706",
    secondaryHex: "#b45309",
    accentHex: "#f59e0b",
    previewBg: "from-amber-900 via-orange-950 to-slate-900",
    description: "Warm craft copper and amber palette perfect for dining, cafes, and artisan bakeries.",
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

