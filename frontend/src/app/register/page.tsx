"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth, ApiError } from "@/lib/auth";
import {
  Mail,
  Lock,
  Building,
  User,
  Phone,
  ArrowRight,
  ShoppingBag,
  Utensils,
  Pill,
  ShoppingCart,
  Truck,
  Factory,
  Sparkles,
  Wrench,
  Building2,
  Check,
  CheckCircle2,
  Globe,
  Smartphone,
  Flame,
  MessageSquare,
  ShieldCheck,
  ChefHat,
  LayoutGrid,
  QrCode,
  ScanBarcode,
  Gift,
  FileText,
  Network,
  Zap,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  Store,
} from "lucide-react";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";
import { siteConfig } from "@/config/site";

// ─── Business Categories ──────────────────────────────────────────────
export interface BusinessCategory {
  id: string;
  name: string;
  tagline: string;
  icon: any;
  color: string;
  primaryAddonsCategory: "RESTAURANT" | "RETAIL" | "PHARMACY" | "ALL";
}

const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: "RESTAURANT",
    name: "Restaurant & Cafe",
    tagline: "KDS, Floor Plan & Dine-In",
    icon: Utensils,
    color: "from-amber-500 to-orange-600",
    primaryAddonsCategory: "RESTAURANT",
  },
  {
    id: "RETAIL",
    name: "Retail & Apparel",
    tagline: "Omnichannel & Barcode",
    icon: ShoppingBag,
    color: "from-blue-500 to-indigo-600",
    primaryAddonsCategory: "RETAIL",
  },
  {
    id: "GROCERY",
    name: "Grocery & Supermarket",
    tagline: "Weight Scale & Fast Checkout",
    icon: ShoppingCart,
    color: "from-emerald-500 to-teal-600",
    primaryAddonsCategory: "RETAIL",
  },
  {
    id: "PHARMACY",
    name: "Pharmacy & Healthcare",
    tagline: "FEFO Batch & Prescriptions",
    icon: Pill,
    color: "from-rose-500 to-pink-600",
    primaryAddonsCategory: "PHARMACY",
  },
  {
    id: "WHOLESALE",
    name: "Wholesale & B2B",
    tagline: "Tier Pricing & Credit Ledger",
    icon: Truck,
    color: "from-violet-500 to-purple-600",
    primaryAddonsCategory: "RETAIL",
  },
  {
    id: "SALON",
    name: "Salon & Spa",
    tagline: "Staff Rosters & Chair Booking",
    icon: Sparkles,
    color: "from-pink-500 to-rose-600",
    primaryAddonsCategory: "ALL",
  },
  {
    id: "REPAIR",
    name: "Repair & Service",
    tagline: "Job Cards & Device Tracking",
    icon: Wrench,
    color: "from-amber-600 to-yellow-600",
    primaryAddonsCategory: "ALL",
  },
  {
    id: "MANUFACTURING",
    name: "Factory & Bakery",
    tagline: "BOM Recipe & Raw Materials",
    icon: Factory,
    color: "from-cyan-600 to-blue-700",
    primaryAddonsCategory: "ALL",
  },
  {
    id: "FRANCHISE",
    name: "Franchise Store",
    tagline: "Multi-Outlet Central Control",
    icon: Building2,
    color: "from-slate-700 to-slate-900",
    primaryAddonsCategory: "ALL",
  },
];

// ─── Fallback Plans if DB is Loading ─────────────────────────────────
interface PlanItem {
  id?: string;
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  maxUsers?: number;
  maxBranches?: number;
  maxPOS?: number;
  maxProducts?: number;
  maxStorageMB?: number;
  features: string[];
}

const FALLBACK_PLANS: PlanItem[] = [
  {
    code: "STARTER",
    name: "Starter",
    description: "Ideal for single outlet retail stores, cafes and emerging boutiques.",
    monthlyPrice: 990,
    yearlyPrice: 9900,
    maxUsers: 5,
    maxBranches: 1,
    maxPOS: 2,
    maxProducts: 1000,
    maxStorageMB: 500,
    features: [
      "1 Store / Outlet Location",
      "Up to 2 Active POS Registers",
      "Sales, Invoices & Receipt Printing",
      "Product Catalog (1,000 Items)",
      "Daily Cash Register & Shift Closures",
      "Customer Directory & Profiles",
    ],
  },
  {
    code: "BUSINESS",
    name: "Advance",
    popular: true,
    description: "Full ERP & Accounting power for scaling multi-branch retail and busy venues.",
    monthlyPrice: 2990,
    yearlyPrice: 29900,
    maxUsers: 25,
    maxBranches: 5,
    maxPOS: 10,
    maxProducts: 10000,
    maxStorageMB: 5000,
    features: [
      "Up to 5 Outlets / Branches",
      "Up to 10 High-Speed POS Counters",
      "Full Double-Entry Accounting & Ledger",
      "NBR VAT & Tax Computation (Mushak)",
      "Purchase Orders (PO) & Receiving (GRN)",
      "Customer Credit Ledger & Installments",
      "Employee Permissions & Shift Audit",
    ],
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "Unlimited power, dedicated cloud infrastructure and custom integrations.",
    monthlyPrice: 9990,
    yearlyPrice: 99900,
    maxUsers: 999,
    maxBranches: 999,
    maxPOS: 999,
    maxProducts: 999999,
    maxStorageMB: 50000,
    features: [
      "Unlimited Outlets & Warehouses",
      "Unlimited POS Register Terminals",
      "All 10 Industry Vertical Engines",
      "Multi-Warehouse Inter-Stock Transfer",
      "Automated Approval Workflow Engine",
      "REST API & Custom Webhook Hooks",
      "Dedicated High-Speed Database Cluster",
    ],
  },
];

// ─── Add-on Icon Resolver ─────────────────────────────────────────────
function resolveAddonIcon(iconName: string) {
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
    case "flame":
      return Flame;
    default:
      return Layers;
  }
}

interface AddonItem {
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

const registerSchema = Yup.object({
  businessName: Yup.string().required("Business name is required"),
  businessType: Yup.string().required("Please select a business category"),
  name: Yup.string().required("Owner name is required"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  phone: Yup.string().optional(),
});

export default function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<string>("BUSINESS");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Dynamic state from backend database
  const [plans, setPlans] = useState<PlanItem[]>(FALLBACK_PLANS);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loadingPricing, setLoadingPricing] = useState<boolean>(true);

  // ─── Fetch Dynamic Plans & Add-ons from MySQL Database ────────────────
  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch("/api/auth/pricing");
        if (res.ok) {
          const body = await res.json();
          const d = body.data || body;
          if (Array.isArray(d.plans) && d.plans.length > 0) {
            setPlans(
              d.plans.map((p: any) => {
                const existing = FALLBACK_PLANS.find((f) => f.code === p.code);
                return {
                  id: p.id,
                  code: p.code,
                  name: p.name,
                  description: p.description || existing?.description || "",
                  monthlyPrice: Number(p.monthlyPrice) || 0,
                  yearlyPrice: Number(p.yearlyPrice) || 0,
                  popular: p.code === "BUSINESS" || p.code === "ADVANCE",
                  maxUsers: p.maxUsers,
                  maxBranches: p.maxBranches,
                  maxPOS: p.maxPOS,
                  maxProducts: p.maxProducts,
                  maxStorageMB: p.maxStorageMB,
                  features: existing?.features || [
                    `${p.maxBranches || 1} Branches / Outlets`,
                    `${p.maxPOS || 2} POS Registers`,
                    `${p.maxUsers || 5} User Accounts`,
                    `${(p.maxProducts || 1000).toLocaleString()} Products Catalog`,
                  ],
                };
              })
            );
          }
          if (Array.isArray(d.addons) && d.addons.length > 0) {
            setAddons(
              d.addons.map((a: any) => ({
                id: a.id,
                code: a.code,
                name: a.name,
                description: a.description || "",
                industry: (a.industry || "ALL").toUpperCase(),
                monthlyPrice: Number(a.monthlyPrice) || 0,
                yearlyPrice: Number(a.yearlyPrice) || 0,
                icon: a.icon || "Layers",
                badge: a.badge || "",
                features: Array.isArray(a.features) ? a.features : [],
                sortOrder: a.sortOrder || 0,
              }))
            );
          }
        }
      } catch (err) {
        console.warn("Pricing endpoint load error, using default plans/addons:", err);
      } finally {
        setLoadingPricing(false);
      }
    }
    loadPricing();
  }, []);

  const formik = useFormik({
    initialValues: {
      businessName: "",
      businessType: "RESTAURANT",
      name: "",
      email: "",
      password: "",
      phone: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        await register({
          ...values,
          planCode: selectedPlan,
          selectedAddons,
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const selectedCategoryObj = useMemo(
    () =>
      BUSINESS_CATEGORIES.find((b) => b.id === formik.values.businessType) ||
      BUSINESS_CATEGORIES[0],
    [formik.values.businessType]
  );

  // ─── Filter Add-ons Strictly By Business Type ────────────────────────
  // 1. Industry-specific addons (ONLY matches the selected industry)
  // 2. Universal addons (available for everyone)
  const { industryAddons, universalAddons } = useMemo(() => {
    const primaryCat = selectedCategoryObj.primaryAddonsCategory;

    const indList = addons.filter((a) => {
      if (primaryCat === "RESTAURANT") return a.industry === "RESTAURANT";
      if (primaryCat === "RETAIL") return a.industry === "RETAIL";
      if (primaryCat === "PHARMACY") return a.industry === "PHARMACY";
      return false;
    });

    const uniList = addons.filter((a) => a.industry === "ALL");
    return { industryAddons: indList, universalAddons: uniList };
  }, [addons, selectedCategoryObj]);

  // Clean up selected addons if business category changed to prevent incompatible addons
  const handleBusinessTypeChange = (newType: string) => {
    formik.setFieldValue("businessType", newType);
    const newCat = BUSINESS_CATEGORIES.find((b) => b.id === newType);
    const allowedIndustry = newCat?.primaryAddonsCategory || "ALL";

    setSelectedAddons((prev) =>
      prev.filter((addonCode) => {
        const item = addons.find((a) => a.code === addonCode);
        if (!item) return false;
        if (item.industry === "ALL") return true;
        return item.industry === allowedIndustry;
      })
    );
  };

  const toggleAddon = (addonCode: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonCode) ? prev.filter((code) => code !== addonCode) : [...prev, addonCode]
    );
  };

  // ─── Live Calculation ────────────────────────────────────────────────
  const currentPlanObj = useMemo(
    () => plans.find((p) => p.code === selectedPlan) || plans[0] || FALLBACK_PLANS[0],
    [plans, selectedPlan]
  );

  const planPrice = useMemo(() => {
    if (billingCycle === "YEARLY") {
      return Math.round(currentPlanObj.yearlyPrice / 12);
    }
    return currentPlanObj.monthlyPrice;
  }, [currentPlanObj, billingCycle]);

  const addonsPriceTotal = useMemo(() => {
    return selectedAddons.reduce((sum, code) => {
      const a = addons.find((item) => item.code === code);
      if (!a) return sum;
      if (billingCycle === "YEARLY") {
        return sum + Math.round(a.yearlyPrice / 12);
      }
      return sum + a.monthlyPrice;
    }, 0);
  }, [selectedAddons, addons, billingCycle]);

  const totalMonthlyEquivalent = planPrice + addonsPriceTotal;

  // Store Subdomain slug preview
  const storeSlug = useMemo(() => {
    const raw = formik.values.businessName || "my-brand";
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);
  }, [formik.values.businessName]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden select-none">
      {/* Dynamic Background Mesh Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.18)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* Brand Top Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-sky-400 hover:bg-white/10 transition mb-4 shadow-sm"
          >
            <siteConfig.logoIcon size={16} />
            <span>Blue Oceans Cloud POS & Omnichannel SaaS</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live Production
            </span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Launch Your Store with a 14-Day Free Trial
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Choose your industry vertical, select your scale tier, and customize with modular add-ons.
            Zero setup fees. No credit card required.
          </p>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 bg-slate-900/60 p-2 rounded-xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-slate-950 font-bold text-[10px]">
              1
            </span>
            <span className="text-xs font-bold truncate">Business Type</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
              2
            </span>
            <span className="text-xs font-bold truncate">Subscription Tier</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
              3
            </span>
            <span className="text-xs font-bold truncate">Industry Add-ons</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
              4
            </span>
            <span className="text-xs font-bold truncate">Account & Launch</span>
          </div>
        </div>

        {/* The Form */}
        <form onSubmit={formik.handleSubmit} className="space-y-8">
          {/* ══════════════════════════════════════════════════════════════
              SECTION 1: BUSINESS CATEGORY SELECTION
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-5 sm:p-7 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500 text-slate-950 text-xs font-black">
                    1
                  </span>
                  Select Your Business Vertical
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  The system automatically adapts POS screens, workflow engines, and relevant add-ons.
                </p>
              </div>
              <span className="self-start sm:self-auto text-[11px] font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2.5 py-1 rounded-full">
                {selectedCategoryObj.name} Selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
              {BUSINESS_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formik.values.businessType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleBusinessTypeChange(cat.id)}
                    className={`group relative flex flex-col p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500/50"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${cat.color} text-white shadow-sm`}
                      >
                        <Icon size={18} />
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? "border-sky-400 bg-sky-500 text-slate-950"
                            : "border-slate-700 group-hover:border-slate-500"
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-sky-300 transition">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                      {cat.tagline}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 2: DYNAMIC SUBSCRIPTION PLANS (FROM DATABASE)
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-5 sm:p-7 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500 text-slate-950 text-xs font-black">
                    2
                  </span>
                  Choose Subscription Plan
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time database pricing. Free 14-day trial included on every tier.
                </p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBillingCycle("MONTHLY")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    billingCycle === "MONTHLY"
                      ? "bg-sky-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("YEARLY")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    billingCycle === "YEARLY"
                      ? "bg-sky-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>Yearly</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.code;
                const displayPrice =
                  billingCycle === "YEARLY"
                    ? Math.round(plan.yearlyPrice / 12)
                    : plan.monthlyPrice;

                return (
                  <div
                    key={plan.code}
                    onClick={() => setSelectedPlan(plan.code)}
                    className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-sky-500 bg-slate-950/90 shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/50"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/40"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                        Most Popular
                      </span>
                    )}

                    <div>
                      {/* Plan Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-extrabold uppercase tracking-wider text-white">
                          {plan.name}
                        </span>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-sky-400 bg-sky-500 text-slate-950"
                              : "border-slate-700"
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white">
                            ৳{displayPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">/ month</span>
                        </div>
                        {billingCycle === "YEARLY" && (
                          <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                            Billed ৳{plan.yearlyPrice.toLocaleString()} yearly (2 months free)
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                        {plan.description}
                      </p>

                      {/* Quotas Chips */}
                      <div className="grid grid-cols-2 gap-1.5 mb-4 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300">
                        <div>
                          <span className="text-slate-500 block">Outlets:</span>
                          <span className="font-bold text-white">
                            {plan.maxBranches === 999 ? "Unlimited" : plan.maxBranches || 1}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">POS Counters:</span>
                          <span className="font-bold text-white">
                            {plan.maxPOS === 999 ? "Unlimited" : plan.maxPOS || 2}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Users:</span>
                          <span className="font-bold text-white">
                            {plan.maxUsers === 999 ? "Unlimited" : plan.maxUsers || 5}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Products:</span>
                          <span className="font-bold text-white">
                            {plan.maxProducts === 999999
                              ? "Unlimited"
                              : (plan.maxProducts || 1000).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 text-xs text-slate-300">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 leading-tight">
                            <CheckCircle2 size={13} className="text-sky-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>14-Day Free Access</span>
                      <span className="font-bold text-sky-400">৳0 Due Today</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 3: INDUSTRY-SPECIFIC & UNIVERSAL ADD-ONS
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-5 sm:p-7 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500 text-slate-950 text-xs font-black">
                    3
                  </span>
                  Select Add-on Modules for {selectedCategoryObj.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Modular extensions. Only relevant tools for your business category are displayed.
                </p>
              </div>
              <span className="self-start sm:self-auto text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                {selectedAddons.length} Selected
              </span>
            </div>

            {/* 3A: Industry Specific Add-ons */}
            {industryAddons.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Recommended Exclusively for {selectedCategoryObj.name}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {industryAddons.map((addon) => {
                    const isSelected = selectedAddons.includes(addon.code);
                    const Icon = resolveAddonIcon(addon.icon || "Layers");
                    const displayAddonPrice =
                      billingCycle === "YEARLY"
                        ? Math.round(addon.yearlyPrice / 12)
                        : addon.monthlyPrice;

                    return (
                      <div
                        key={addon.code}
                        onClick={() => toggleAddon(addon.code)}
                        className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-slate-950/90 shadow-md ring-1 ring-amber-500/40"
                            : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected
                                  ? "bg-amber-500 text-slate-950 font-bold"
                                  : "bg-slate-800 text-amber-400"
                              }`}
                            >
                              <Icon size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                                  {addon.name}
                                </span>
                                {addon.badge && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {addon.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                                {addon.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-xs font-black text-white">
                              +৳{displayAddonPrice.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-slate-400">/mo</span>
                            <div
                              className={`mt-1.5 h-4 w-4 rounded border flex items-center justify-center ${
                                isSelected
                                  ? "border-amber-400 bg-amber-500 text-slate-950"
                                  : "border-slate-700"
                              }`}
                            >
                              {isSelected && <Check size={10} strokeWidth={3} />}
                            </div>
                          </div>
                        </div>

                        {addon.features && addon.features.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                            {addon.features.map((f, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-slate-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                              >
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3B: Universal Power-Up Add-ons */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                  Universal Scale & Growth Tools (Available for All Outlets)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {universalAddons.map((addon) => {
                  const isSelected = selectedAddons.includes(addon.code);
                  const Icon = resolveAddonIcon(addon.icon || "Layers");
                  const displayAddonPrice =
                    billingCycle === "YEARLY"
                      ? Math.round(addon.yearlyPrice / 12)
                      : addon.monthlyPrice;

                  return (
                    <div
                      key={addon.code}
                      onClick={() => toggleAddon(addon.code)}
                      className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-sky-500 bg-slate-950/90 shadow-md ring-1 ring-sky-500/40"
                          : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected
                              ? "bg-sky-500 text-slate-950 font-bold"
                              : "bg-slate-800 text-sky-400"
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-white">
                            +৳{displayAddonPrice.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400">/mo</span>
                          <div
                            className={`mt-1 h-3.5 w-3.5 rounded border flex items-center justify-center ${
                              isSelected
                                ? "border-sky-400 bg-sky-500 text-slate-950"
                                : "border-slate-700"
                            }`}
                          >
                            {isSelected && <Check size={9} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-white group-hover:text-sky-300 transition block leading-tight">
                          {addon.name}
                        </span>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-2">
                          {addon.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 4: OWNER CREDENTIALS & STORE SETUP
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-5 sm:p-7 shadow-xl">
            <div className="mb-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500 text-slate-950 text-xs font-black">
                  4
                </span>
                Store Profile & Admin Login Credentials
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set up your primary workspace URL and root administrator password.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <CustomInput
                  label="Store / Business Name *"
                  name="businessName"
                  rounded="lg"
                  value={formik.values.businessName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.businessName ? formik.errors.businessName : undefined}
                  placeholder="e.g. Sultan's Dine & Kitchen"
                  leftIcon={<Building size={16} />}
                />
                {/* Live Subdomain Preview */}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="text-slate-500">Workspace URL:</span>
                  <span className="font-mono text-sky-400 font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    https://{storeSlug}.blueoceanspos.com
                  </span>
                </div>
              </div>

              <CustomInput
                label="Owner / Managing Director Name *"
                name="name"
                rounded="lg"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name ? formik.errors.name : undefined}
                placeholder="e.g. Kazi Orin"
                leftIcon={<User size={16} />}
              />

              <CustomInput
                label="Root Admin Email Address *"
                name="email"
                type="email"
                rounded="lg"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email ? formik.errors.email : undefined}
                placeholder="owner@sultansdine.com"
                leftIcon={<Mail size={16} />}
              />

              <CustomInput
                label="Official Phone / Mobile"
                name="phone"
                rounded="lg"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone ? formik.errors.phone : undefined}
                placeholder="+8801700000000"
                leftIcon={<Phone size={16} />}
              />
            </div>

            <div className="mt-4">
              <CustomInput
                label="Master Security Password *"
                name="password"
                type="password"
                rounded="lg"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password ? formik.errors.password : undefined}
                placeholder="At least 6 characters"
                leftIcon={<Lock size={16} />}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 5: LIVE ORDER BREAKDOWN & TRIAL GUARANTEE
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-br from-slate-900 to-sky-950/60 p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 text-slate-950 shrink-0 shadow-lg shadow-sky-500/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">
                    14-Day Full Commercial Free Trial
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ৳0 Due Today
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  Active Tier: <span className="font-bold text-white">{currentPlanObj.name}</span> • Vertical:{" "}
                  <span className="font-bold text-white">{selectedCategoryObj.name}</span> • Add-ons:{" "}
                  <span className="font-bold text-white">{selectedAddons.length} chosen</span>. Cancel anytime.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end shrink-0 w-full md:w-auto">
              <div className="text-center md:text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Standard Rate After 14 Days
                </span>
                <div className="flex items-baseline gap-1 justify-center md:justify-end">
                  <span className="text-2xl font-black text-white">
                    ৳{totalMonthlyEquivalent.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ month</span>
                </div>
              </div>

              <CustomButton
                type="submit"
                loading={formik.isSubmitting}
                size="lg"
                variant="primary"
                className="mt-3 w-full md:w-auto font-black px-8 py-3.5 rounded-xl shadow-lg shadow-sky-500/20 bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 hover:brightness-110 cursor-pointer"
              >
                {formik.isSubmitting ? "Provisioning Database Workspace..." : "Start Free Trial Now"}
                <ArrowRight size={16} className="ml-2 inline" />
              </CustomButton>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-300 font-semibold text-center">
              {error}
            </div>
          )}

          <div className="text-center pb-8">
            <span className="text-xs text-slate-400">Already registered your business workspace? </span>
            <Link href="/login" className="text-xs font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2">
              Sign In to Terminal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
