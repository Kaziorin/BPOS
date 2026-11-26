import {
  Building2,
  ChefHat,
  Factory,
  FileText,
  Gift,
  Globe,
  Layers,
  LayoutGrid,
  MessageSquare,
  Network,
  Pill,
  QrCode,
  ScanBarcode,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Truck,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface BusinessCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  highlight: string;
  icon: LucideIcon;
  primaryAddonsCategory: "RESTAURANT" | "RETAIL" | "PHARMACY" | "ALL";
  accentClass: string;
}

export interface PlanItem {
  id?: string;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  maxUsers?: number;
  maxBranches?: number;
  maxWarehouses?: number;
  maxPOS?: number;
  maxProducts?: number;
  maxStorageMB?: number;
  maxAPICallsDaily?: number;
  maxAIQueriesDaily?: number;
  features: string[];
}

export interface AddonItem {
  id?: string;
  code: string;
  name: string;
  description: string;
  industry: "RESTAURANT" | "RETAIL" | "PHARMACY" | "ALL" | string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon?: string;
  badge?: string;
  features?: string[];
  sortOrder?: number;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: "RESTAURANT",
    name: "Restaurant & Cafe",
    shortName: "Restaurant",
    description: "Dine-in floor plans, kitchen KDS tickets, table billing & recipe costing.",
    highlight: "Floor Plan + KDS + QR Menu",
    icon: Utensils,
    primaryAddonsCategory: "RESTAURANT",
    accentClass: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    id: "RETAIL",
    name: "Retail & Apparel",
    shortName: "Retail",
    description: "Barcode scanning, size/color variants, price checker & fast thermal POS.",
    highlight: "Variants + Loyalty + Barcodes",
    icon: ShoppingBag,
    primaryAddonsCategory: "RETAIL",
    accentClass: "text-violet-600 bg-violet-50 border-violet-200",
  },
  {
    id: "GROCERY",
    name: "Grocery & Supermarket",
    shortName: "Grocery",
    description: "Weighing scale barcodes, quick-hold lanes, expiry & multi-unit stock.",
    highlight: "Fast Checkout + Bulk Stock",
    icon: ShoppingCart,
    primaryAddonsCategory: "RETAIL",
    accentClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    id: "PHARMACY",
    name: "Pharmacy & Medicine",
    shortName: "Pharmacy",
    description: "Batch expiry alerts, DGDA compliance, generic substitution & patient display.",
    highlight: "Batch Expiry + Rx Compliance",
    icon: Pill,
    primaryAddonsCategory: "PHARMACY",
    accentClass: "text-cyan-600 bg-cyan-50 border-cyan-200",
  },
  {
    id: "WHOLESALE",
    name: "Wholesale & Distribution",
    shortName: "Wholesale",
    description: "Tiered price lists, carton/unit packs, B2B credit aging & dispatch orders.",
    highlight: "B2B Credit + Tiered Pricing",
    icon: Truck,
    primaryAddonsCategory: "RETAIL",
    accentClass: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    id: "SALON",
    name: "Salon & Spa",
    shortName: "Salon",
    description: "Stylist commissions, chair booking queue & service package billing.",
    highlight: "Bookings + Staff Commission",
    icon: Sparkles,
    primaryAddonsCategory: "ALL",
    accentClass: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    id: "REPAIR",
    name: "Repair & Service",
    shortName: "Repair",
    description: "Diagnostic job cards, serial warranty tracking, RMA & spare parts ledger.",
    highlight: "Job Cards + Serial Tracking",
    icon: Wrench,
    primaryAddonsCategory: "ALL",
    accentClass: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    id: "MANUFACTURING",
    name: "Bakery & Production",
    shortName: "Bakery",
    description: "Bill of materials, production batches, landed cost & raw material control.",
    highlight: "BOM + Production Costing",
    icon: Factory,
    primaryAddonsCategory: "ALL",
    accentClass: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    id: "FRANCHISE",
    name: "Franchise & Multi-Outlet",
    shortName: "Franchise",
    description: "Centralized SKU catalog, inter-branch transfers & executive oversight.",
    highlight: "Multi-Outlet Governance",
    icon: Building2,
    primaryAddonsCategory: "ALL",
    accentClass: "text-slate-700 bg-slate-100 border-slate-300",
  },
];

export const FALLBACK_PLANS: PlanItem[] = [
  {
    code: "STARTER",
    name: "Starter",
    description: "For single-location stores, kiosks, and emerging shops launching fast.",
    monthlyPrice: 990,
    yearlyPrice: 9900,
    maxUsers: 5,
    maxBranches: 1,
    maxWarehouses: 1,
    maxPOS: 2,
    maxProducts: 1000,
    features: [
      "1 branch / store location",
      "Up to 2 POS terminals",
      "Offline-first IndexedDB sales & sync",
      "Sales, invoicing & 80mm thermal receipts",
      "Up to 1,000 product SKUs",
      "Daily cash register & shift close",
      "Customer directory & basic reports",
    ],
  },
  {
    code: "BUSINESS",
    name: "Advance",
    popular: true,
    description: "For growing multi-outlet businesses requiring accounting, VAT & controls.",
    monthlyPrice: 2990,
    yearlyPrice: 29900,
    maxUsers: 25,
    maxBranches: 5,
    maxWarehouses: 5,
    maxPOS: 10,
    maxProducts: 10000,
    features: [
      "Up to 5 branch locations & warehouses",
      "Up to 10 POS terminals",
      "Double-entry accounting, P&L & balance sheet",
      "NBR VAT calculation & Mushak 6.3 reports",
      "Purchase orders, GRNs & supplier dues",
      "Customer credit ledger & EMI installments",
      "Staff RBAC permissions & security audit log",
    ],
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "For enterprise chains, high-volume outlets & custom ERP workflows.",
    monthlyPrice: 9990,
    yearlyPrice: 99900,
    maxUsers: 999,
    maxBranches: 999,
    maxWarehouses: 999,
    maxPOS: 999,
    maxProducts: 999999,
    features: [
      "Unlimited branches & warehouses",
      "Unlimited POS terminals & registers",
      "All 9 industry vertical hubs unlocked",
      "Inter-branch stock transfers & landed costs",
      "Maker-checker approval workflow engine",
      "REST API access & AI business assistant",
      "Priority SLA & dedicated onboarding",
    ],
  },
];

export const FALLBACK_ADDONS: AddonItem[] = [
  {
    code: "kds_display",
    name: "Kitchen Display System (KDS)",
    description: "Live kitchen prep queue with station routing and order-ready alerts.",
    industry: "RESTAURANT",
    monthlyPrice: 490,
    yearlyPrice: 4900,
    icon: "ChefHat",
    badge: "Restaurant",
  },
  {
    code: "qr_table_ordering",
    name: "Table Floor Plan & QR Menu",
    description: "Interactive table occupancy map with contactless QR ordering.",
    industry: "RESTAURANT",
    monthlyPrice: 390,
    yearlyPrice: 3900,
    icon: "QrCode",
    badge: "Popular",
  },
  {
    code: "barcode_label_studio",
    name: "Barcode & Price Tag Studio",
    description: "Custom shelf labels, hang tags and batch thermal barcode printing.",
    industry: "RETAIL",
    monthlyPrice: 350,
    yearlyPrice: 3500,
    icon: "ScanBarcode",
    badge: "Retail",
  },
  {
    code: "dgda_batch_expiry",
    name: "Batch Expiry & Rx Compliance",
    description: "FEFO medicine alerts, batch recall tracking and prescription logs.",
    industry: "PHARMACY",
    monthlyPrice: 450,
    yearlyPrice: 4500,
    icon: "Pill",
    badge: "Pharmacy",
  },
  {
    code: "sms_notifications",
    name: "Automated SMS & Invoice Alerts",
    description: "Instant payment receipts, due reminders and OTP verification via SMS.",
    industry: "ALL",
    monthlyPrice: 300,
    yearlyPrice: 3000,
    icon: "MessageSquare",
    badge: "Universal",
  },
  {
    code: "ecommerce_storefront",
    name: "Online Storefront Sync",
    description: "Real-time catalog and inventory sync with your web storefront.",
    industry: "ALL",
    monthlyPrice: 790,
    yearlyPrice: 7900,
    icon: "Globe",
    badge: "Omnichannel",
  },
  {
    code: "website_builder",
    name: "Dynamic Business Website",
    description: "Industry-tailored dynamic website with live catalog, online ordering & custom branding.",
    industry: "ALL",
    monthlyPrice: 790,
    yearlyPrice: 7900,
    icon: "Globe",
    badge: "Website",
  },
];

export function resolveAddonIcon(iconName?: string): LucideIcon {
  switch (iconName?.toLowerCase()) {
    case "chefhat":
      return ChefHat;
    case "layoutgrid":
    case "table":
      return LayoutGrid;
    case "qrcode":
      return QrCode;
    case "globe":
      return Globe;
    case "scanbarcode":
    case "barcode":
      return ScanBarcode;
    case "gift":
      return Gift;
    case "pill":
      return Pill;
    case "filetext":
      return FileText;
    case "messagesquare":
    case "sms":
      return MessageSquare;
    case "smartphone":
      return Smartphone;
    case "network":
      return Network;
    default:
      return Layers;
  }
}

export function formatPlanQuota(value?: number, unlimitedThreshold = 900): string {
  if (value === undefined || value === null) return "—";
  if (value >= unlimitedThreshold) return "Unlimited";
  return value.toLocaleString("en-US");
}

export async function fetchPublicPricing(): Promise<{
  plans: PlanItem[];
  addons: AddonItem[];
  fromApi: boolean;
}> {
  try {
    const res = await fetch("/api/auth/pricing", { cache: "no-store" });
    if (!res.ok) {
      return { plans: FALLBACK_PLANS, addons: FALLBACK_ADDONS, fromApi: false };
    }
    const body = await res.json();
    const payload = body?.data || body || {};

    const rawPlans = Array.isArray(payload.plans) && payload.plans.length > 0 ? payload.plans : null;
    const plans: PlanItem[] = rawPlans
      ? rawPlans.map((p: Record<string, unknown>) => {
          const code = String(p.code || "").toUpperCase();
          const fallback = FALLBACK_PLANS.find((f) => f.code === code);
          const maxUsers = typeof p.maxUsers === "number" ? p.maxUsers : fallback?.maxUsers;
          const maxBranches = typeof p.maxBranches === "number" ? p.maxBranches : fallback?.maxBranches;
          const maxWarehouses = typeof p.maxWarehouses === "number" ? p.maxWarehouses : fallback?.maxWarehouses;
          const maxPOS = typeof p.maxPOS === "number" ? p.maxPOS : fallback?.maxPOS;
          const maxProducts = typeof p.maxProducts === "number" ? p.maxProducts : fallback?.maxProducts;
          return {
            id: typeof p.id === "string" ? p.id : undefined,
            code,
            name: (typeof p.name === "string" && p.name) || fallback?.name || code,
            description: (typeof p.description === "string" && p.description) || fallback?.description || "",
            monthlyPrice: Number(p.monthlyPrice ?? fallback?.monthlyPrice ?? 0),
            yearlyPrice: Number(p.yearlyPrice ?? fallback?.yearlyPrice ?? 0),
            popular: code === "BUSINESS" || code === "ADVANCE",
            maxUsers,
            maxBranches,
            maxWarehouses,
            maxPOS,
            maxProducts,
            maxStorageMB: typeof p.maxStorageMB === "number" ? p.maxStorageMB : undefined,
            maxAPICallsDaily: typeof p.maxAPICallsDaily === "number" ? p.maxAPICallsDaily : undefined,
            maxAIQueriesDaily: typeof p.maxAIQueriesDaily === "number" ? p.maxAIQueriesDaily : undefined,
            features:
              fallback?.features || [
                `${formatPlanQuota(maxBranches)} branch locations`,
                `${formatPlanQuota(maxPOS)} POS terminals`,
                `${formatPlanQuota(maxUsers)} staff users`,
                `${formatPlanQuota(maxProducts, 100000)} product SKUs`,
              ],
          };
        })
      : FALLBACK_PLANS;

    const rawAddons = Array.isArray(payload.addons) && payload.addons.length > 0 ? payload.addons : null;
    const addons: AddonItem[] = rawAddons
      ? rawAddons.map((a: Record<string, unknown>) => ({
          id: typeof a.id === "string" ? a.id : undefined,
          code: String(a.code || ""),
          name: String(a.name || ""),
          description: typeof a.description === "string" ? a.description : "",
          industry: String(a.industry || "ALL").toUpperCase(),
          monthlyPrice: Number(a.monthlyPrice || 0),
          yearlyPrice: Number(a.yearlyPrice || 0),
          icon: typeof a.icon === "string" ? a.icon : "Layers",
          badge: typeof a.badge === "string" ? a.badge : "",
          features: Array.isArray(a.features) ? (a.features as string[]) : [],
          sortOrder: typeof a.sortOrder === "number" ? a.sortOrder : 0,
        }))
      : FALLBACK_ADDONS;

    return { plans, addons, fromApi: true };
  } catch {
    return { plans: FALLBACK_PLANS, addons: FALLBACK_ADDONS, fromApi: false };
  }
}
