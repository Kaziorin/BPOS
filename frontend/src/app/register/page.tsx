"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth, ApiError } from "@/lib/auth";
import {
  Building,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
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
  ChefHat,
  LayoutGrid,
  QrCode,
  Globe,
  ScanBarcode,
  Gift,
  FileText,
  MessageSquare,
  Smartphone,
  Network,
  Layers,
  ShieldCheck,
  CreditCard,
  Clock,
  Send,
  HelpCircle,
} from "lucide-react";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { SslPaymentModal, type SslPaymentSuccessData } from "@/components/payment/SslPaymentModal";

// ─── Step Tabs Definition ─────────────────────────────────────────────
const WIZARD_STEPS = [
  { id: "category", label: "1. Business Type", icon: Building },
  { id: "plan", label: "2. Plan Tier", icon: CreditCard },
  { id: "addons", label: "3. Industry Add-ons", icon: Layers },
  { id: "account", label: "4. Store Profile", icon: User },
] as const;

type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

// ─── Business Categories ──────────────────────────────────────────────
export interface BusinessCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  primaryAddonsCategory: "RESTAURANT" | "RETAIL" | "PHARMACY" | "ALL";
}

const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: "RESTAURANT",
    name: "Restaurant & Cafe",
    description: "Dine-in tables, kitchen tickets & food counter",
    icon: Utensils,
    primaryAddonsCategory: "RESTAURANT",
  },
  {
    id: "RETAIL",
    name: "Retail & Apparel",
    description: "Barcode scanning, variants & clothing retail",
    icon: ShoppingBag,
    primaryAddonsCategory: "RETAIL",
  },
  {
    id: "GROCERY",
    name: "Grocery & Supermarket",
    description: "Scale integration, fast checkout & bulk stock",
    icon: ShoppingCart,
    primaryAddonsCategory: "RETAIL",
  },
  {
    id: "PHARMACY",
    name: "Pharmacy & Medicine",
    description: "Batch expiry, DGDA compliance & prescriptions",
    icon: Pill,
    primaryAddonsCategory: "PHARMACY",
  },
  {
    id: "WHOLESALE",
    name: "Wholesale & Distribution",
    description: "Tiered pricing, carton packs & B2B credit ledger",
    icon: Truck,
    primaryAddonsCategory: "RETAIL",
  },
  {
    id: "SALON",
    name: "Salon & Spa",
    description: "Stylist commissions, chair bookings & service queue",
    icon: Sparkles,
    primaryAddonsCategory: "ALL",
  },
  {
    id: "REPAIR",
    name: "Repair & Service",
    description: "Job cards, service status tracking & spare parts",
    icon: Wrench,
    primaryAddonsCategory: "ALL",
  },
  {
    id: "MANUFACTURING",
    name: "Bakery & Production",
    description: "Bill of materials, recipe costing & batches",
    icon: Factory,
    primaryAddonsCategory: "ALL",
  },
  {
    id: "FRANCHISE",
    name: "Franchise & Multi-Outlet",
    description: "Centralized catalogue & branch audit oversight",
    icon: Building2,
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
  features: string[];
}

const FALLBACK_PLANS: PlanItem[] = [
  {
    code: "STARTER",
    name: "Starter",
    description: "For single-location stores, kiosks, and emerging shops.",
    monthlyPrice: 990,
    yearlyPrice: 9900,
    maxUsers: 5,
    maxBranches: 1,
    maxPOS: 2,
    maxProducts: 1000,
    features: [
      "1 branch / store location",
      "Up to 2 POS terminals",
      "Sales, invoicing & receipt printing",
      "Up to 1,000 product items",
      "Daily cash register & shifts",
      "Customer directory",
    ],
  },
  {
    code: "BUSINESS",
    name: "Advance",
    popular: true,
    description: "For growing multi-outlet businesses requiring accounting and controls.",
    monthlyPrice: 2990,
    yearlyPrice: 29900,
    maxUsers: 25,
    maxBranches: 5,
    maxPOS: 10,
    maxProducts: 10000,
    features: [
      "Up to 5 branch locations",
      "Up to 10 POS terminals",
      "Double-entry accounting & balance sheet",
      "VAT calculation & Mushak reports",
      "Purchase orders & supplier receiving",
      "Customer credit ledger & installments",
      "Staff role permissions & audit log",
    ],
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "For enterprise scale operations, custom integrations, and high volumes.",
    monthlyPrice: 9990,
    yearlyPrice: 99900,
    maxUsers: 999,
    maxBranches: 999,
    maxPOS: 999,
    maxProducts: 999999,
    features: [
      "Unlimited branches & warehouses",
      "Unlimited POS terminals",
      "All industry vertical modules",
      "Inter-branch stock transfers",
      "Approval workflow engine",
      "REST API access",
      "Dedicated database instance",
    ],
  },
];

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
  businessName: Yup.string().required("Enter your business name"),
  businessType: Yup.string().required("Select a business type"),
  name: Yup.string().required("Enter owner or manager name"),
  email: Yup.string().email("Enter a valid email address").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  phone: Yup.string().optional(),
});

export default function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStepId>("category");
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStepId>>(new Set());

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<string>("BUSINESS");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Dynamic pricing state from MySQL database
  const [plans, setPlans] = useState<PlanItem[]>(FALLBACK_PLANS);
  const [addons, setAddons] = useState<AddonItem[]>([]);

  useEffect(() => {
    async function loadPricing() {
      try {
        const body = await api.get<any>("/auth/pricing");
        const d = body?.data || body || {};
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
                  features: existing?.features || [
                    `${p.maxBranches || 1} branches`,
                    `${p.maxPOS || 2} POS terminals`,
                    `${p.maxUsers || 5} staff users`,
                    `${(p.maxProducts || 1000).toLocaleString()} products`,
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
      } catch (err) {
        console.warn("Pricing endpoint error, using defaults:", err);
      }
    }
    loadPricing();
  }, []);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTrialRequestModal, setShowTrialRequestModal] = useState(false);
  const [trialReason, setTrialReason] = useState("");
  const [trialDaysRequested, setTrialDaysRequested] = useState(14);
  const [trialSubmitted, setTrialSubmitted] = useState(false);
  const [submittingTrial, setSubmittingTrial] = useState(false);

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
    onSubmit: async () => {
      setError(null);
      // Open SSLCommerz Gateway modal to complete commercial activation
      setShowPaymentModal(true);
    },
  });

  const handlePaymentSuccess = async (paymentData: SslPaymentSuccessData) => {
    setError(null);
    try {
      await register({
        ...formik.values,
        planCode: selectedPlan,
        selectedAddons,
        paymentDetails: {
          trxId: paymentData.transactionId,
          method: paymentData.method,
          amount: paymentData.amount,
          status: "PAID",
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed after payment verification.");
    }
  };

  const handleTrialRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmittingTrial(true);
    try {
      await register({
        ...formik.values,
        planCode: selectedPlan,
        selectedAddons,
        requestTrial: true,
        trialNote: trialReason || `Requested ${trialDaysRequested} days trial for evaluation.`,
      });
      setTrialSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit trial request. Please verify credentials.");
    } finally {
      setSubmittingTrial(false);
    }
  };

  const selectedCategoryObj = useMemo(
    () =>
      BUSINESS_CATEGORIES.find((b) => b.id === formik.values.businessType) ||
      BUSINESS_CATEGORIES[0],
    [formik.values.businessType]
  );

  // Filter Add-ons Strictly by Selected Business Type
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

  const currentPlanObj = useMemo(
    () => plans.find((p) => p.code === selectedPlan) || plans[0] || FALLBACK_PLANS[0],
    [plans, selectedPlan]
  );

  const isYearly = billingCycle === "YEARLY";
  const planPrice = isYearly ? currentPlanObj.yearlyPrice : currentPlanObj.monthlyPrice;

  const selectedAddonsList = useMemo(() => {
    return selectedAddons
      .map((code) => addons.find((item) => item.code === code))
      .filter(Boolean) as AddonItem[];
  }, [selectedAddons, addons]);

  const addonsPriceTotal = useMemo(() => {
    return selectedAddonsList.reduce((sum, a) => {
      const price = isYearly ? a.yearlyPrice : a.monthlyPrice;
      return sum + price;
    }, 0);
  }, [selectedAddonsList, isYearly]);

  const totalPrice = planPrice + addonsPriceTotal;

  // Subdomain Slug Preview
  const storeSlug = useMemo(() => {
    const raw = formik.values.businessName || "store";
    const cleaned = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return cleaned || "store";
  }, [formik.values.businessName]);

  // Step Navigation Logic (Like Onboarding)
  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  const goToNextStep = () => {
    setError(null);
    if (currentStep === "category") {
      setCompletedSteps((prev) => new Set([...prev, "category"]));
      setCurrentStep("plan");
    } else if (currentStep === "plan") {
      setCompletedSteps((prev) => new Set([...prev, "plan"]));
      setCurrentStep("addons");
    } else if (currentStep === "addons") {
      setCompletedSteps((prev) => new Set([...prev, "addons"]));
      setCurrentStep("account");
    }
  };

  const goToPrevStep = () => {
    setError(null);
    if (currentStepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fb] text-slate-800 flex flex-col py-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20">
      {/* Expanded Container — Fully Fills Widescreen Monitors Without Massive Side Empty Gaps */}
      <div className="w-full max-w-[1680px] mx-auto space-y-5">
        {/* Top Header Bar */}
        <header className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3.5">
            <Link href="/" className="shrink-0">
              <Image
                src="/logos/salepay-logo-blue.png"
                alt="SalePay Enterprise"
                width={200}
                height={46}
                priority
                unoptimized
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </Link>
            <div className="border-l border-slate-200 pl-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                  Self-Service Onboarding
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Instant Cloud Store Provisioning • Official Enterprise POS Gateway Activation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="text-sky-600 hover:text-sky-700 font-semibold px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </header>

        {/* ── Stepper Navigation Tabs (Like /onboarding) ── */}
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {WIZARD_STEPS.map((step, idx) => {
              const isCurrent = currentStep === step.id;
              const isCompleted = completedSteps.has(step.id);

              // Helpful context subtitle for each tab
              let subLabel = "";
              if (step.id === "category") subLabel = selectedCategoryObj.name;
              else if (step.id === "plan") subLabel = `${currentPlanObj.name} (৳${planPrice.toLocaleString()})`;
              else if (step.id === "addons") subLabel = `${selectedAddons.length} addons chosen`;
              else if (step.id === "account") subLabel = formik.values.businessName ? "Ready" : "Pending";

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-md text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? "border border-sky-500 bg-sky-50/80 text-sky-950 font-semibold shadow-2xs ring-1 ring-sky-500/20"
                      : isCompleted
                      ? "border border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                      : "border border-transparent bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                      isCurrent
                        ? "bg-sky-600 text-white"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate font-normal">
                      {subLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Two-Column Stage Layout ── */}
        <form onSubmit={formik.handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ══ LEFT STAGE: Current Active Tab Content (7 or 8 columns) ══ */}
            <div className="lg:col-span-8 space-y-6">
              {/* TAB 1: BUSINESS CATEGORY */}
              {currentStep === "category" && (
                <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Step 1: Choose Your Business Category
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        SalePay adapts menus, order screens, and addons to your specific industry.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded">
                      {selectedCategoryObj.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {BUSINESS_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = formik.values.businessType === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleBusinessTypeChange(cat.id)}
                          className={`flex flex-col p-3.5 rounded-md border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "border-sky-600 bg-sky-50/70 text-slate-900 ring-1 ring-sky-600/30 shadow-2xs"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`p-2 rounded ${
                                isSelected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <Icon size={18} />
                            </span>
                            {isSelected && <Check size={16} className="text-sky-600" />}
                          </div>
                          <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                          <span className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {cat.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="flex items-center gap-2 px-5 py-2.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Continue to Plan Tier</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </section>
              )}

              {/* TAB 2: SUBSCRIPTION PLAN */}
              {currentStep === "plan" && (
                <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Step 2: Choose Subscription Tier
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Plans scale with your outlets, registers, and inventory. Direct gateway activation.
                      </p>
                    </div>

                    {/* Monthly vs Yearly Switcher */}
                    <div className="flex items-center gap-1 p-0.5 rounded bg-slate-100 border border-slate-200 self-start sm:self-auto text-xs">
                      <button
                        type="button"
                        onClick={() => setBillingCycle("MONTHLY")}
                        className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                          billingCycle === "MONTHLY"
                            ? "bg-white text-slate-900 font-semibold shadow-2xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle("YEARLY")}
                        className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                          billingCycle === "YEARLY"
                            ? "bg-white text-slate-900 font-semibold shadow-2xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <span>Yearly</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded font-medium">
                          Save 2 Months Free
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {plans.map((plan) => {
                      const isSelected = selectedPlan === plan.code;
                      const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                      const unitLabel = isYearly ? "/ year" : "/ month";
                      const yearlySavings = plan.monthlyPrice * 12 - plan.yearlyPrice;

                      return (
                        <div
                          key={plan.code}
                          onClick={() => setSelectedPlan(plan.code)}
                          className={`flex flex-col justify-between p-4 rounded-md border transition-colors cursor-pointer ${
                            isSelected
                              ? "border-sky-600 bg-sky-50/40 text-slate-900 ring-1 ring-sky-600/30 shadow-2xs"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-slate-900">{plan.name}</span>
                              {isSelected ? (
                                <span className="text-sky-700 text-xs font-semibold bg-sky-100/70 border border-sky-200 px-1.5 py-0.2 rounded">
                                  Active
                                </span>
                              ) : plan.popular ? (
                                <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-medium">
                                  Recommended
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-baseline gap-1 mt-2 mb-0.5">
                              <span className="text-2xl font-bold tabular-nums text-slate-900">
                                ৳{displayPrice.toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">{unitLabel}</span>
                            </div>

                            {isYearly ? (
                              <p className="text-[11px] text-emerald-700 font-medium mb-3">
                                12 months access (Save ৳{yearlySavings.toLocaleString()})
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-500 mb-3">
                                Billed monthly • Cancel anytime
                              </p>
                            )}

                            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                              {plan.description}
                            </p>

                            <ul className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                              {plan.features.map((feat, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <Check size={13} className="text-emerald-600 shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Instant Access</span>
                            <span className="text-slate-700 font-semibold">Gateway Checkout</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goToPrevStep}
                      className="flex items-center gap-1.5 px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="flex items-center gap-2 px-5 py-2.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Continue to Add-ons</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </section>
              )}

              {/* TAB 3: ADD-ON MODULES */}
              {currentStep === "addons" && (
                <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Step 3: Add-ons for {selectedCategoryObj.name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Only relevant extensions for your category are shown. Can be toggled on/off anytime.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                      {selectedAddons.length} selected
                    </span>
                  </div>

                  {/* Industry Extensions */}
                  {industryAddons.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-800 block">
                        Industry extensions for {selectedCategoryObj.name}:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {industryAddons.map((addon) => {
                          const isSelected = selectedAddons.includes(addon.code);
                          const Icon = resolveAddonIcon(addon.icon || "Layers");
                          const price = isYearly ? addon.yearlyPrice : addon.monthlyPrice;
                          const unit = isYearly ? "/yr" : "/mo";

                          return (
                            <div
                              key={addon.code}
                              onClick={() => toggleAddon(addon.code)}
                              className={`p-3.5 rounded-md border flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                                isSelected
                                  ? "border-sky-600 bg-sky-50/60 ring-1 ring-sky-600/30 shadow-2xs"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <span className={`p-2 rounded shrink-0 mt-0.5 ${
                                  isSelected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
                                }`}>
                                  <Icon size={16} />
                                </span>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-900 block">
                                    {addon.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 mt-1 block line-clamp-2 leading-relaxed">
                                    {addon.description}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end shrink-0 pl-2">
                                <span className="text-xs font-bold tabular-nums text-slate-800">
                                  +৳{price.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{unit}</span>
                                <div
                                  className={`mt-1.5 h-4 w-4 rounded border flex items-center justify-center ${
                                    isSelected
                                      ? "border-sky-600 bg-sky-600 text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {isSelected && <Check size={11} strokeWidth={3} />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* General / Universal Add-ons */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-800 block">
                      Universal tools (all store types):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {universalAddons.map((addon) => {
                        const isSelected = selectedAddons.includes(addon.code);
                        const Icon = resolveAddonIcon(addon.icon || "Layers");
                        const price = isYearly ? addon.yearlyPrice : addon.monthlyPrice;
                        const unit = isYearly ? "/yr" : "/mo";

                        return (
                          <div
                            key={addon.code}
                            onClick={() => toggleAddon(addon.code)}
                            className={`p-3 rounded-md border flex flex-col justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "border-sky-600 bg-sky-50/60 ring-1 ring-sky-600/30 shadow-2xs"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Icon size={16} className={isSelected ? "text-sky-600" : "text-slate-400"} />
                              <span className="text-xs font-bold tabular-nums text-slate-800">
                                +৳{price.toLocaleString()}{unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">
                                {addon.name}
                              </span>
                              <span className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {addon.description}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goToPrevStep}
                      className="flex items-center gap-1.5 px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="flex items-center gap-2 px-5 py-2.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Continue to Store Profile</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </section>
              )}

              {/* TAB 4: STORE & OWNER DETAILS */}
              {currentStep === "account" && (
                <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-900">
                      Step 4: Store and Administrator Login
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your master credentials for accessing POS and executive backoffice.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <CustomInput
                        label="Store / Business Name *"
                        name="businessName"
                        darkMode={false}
                        rounded="sm"
                        value={formik.values.businessName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.businessName ? formik.errors.businessName : undefined}
                        placeholder="e.g. Mughal Kitchen"
                        leftIcon={<Building size={15} />}
                      />
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <span>Workspace URL:</span>
                        <span className="text-sky-700 font-semibold">{storeSlug}.salepay.io</span>
                      </div>
                    </div>

                    <CustomInput
                      label="Owner / Manager Name *"
                      name="name"
                      darkMode={false}
                      rounded="sm"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name ? formik.errors.name : undefined}
                      placeholder="e.g. Kazi Orin"
                      leftIcon={<User size={15} />}
                    />

                    <CustomInput
                      label="Login Email Address *"
                      name="email"
                      type="email"
                      darkMode={false}
                      rounded="sm"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.email ? formik.errors.email : undefined}
                      placeholder="owner@domain.com"
                      leftIcon={<Mail size={15} />}
                    />

                    <CustomInput
                      label="Official Contact Phone"
                      name="phone"
                      darkMode={false}
                      rounded="sm"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.phone ? formik.errors.phone : undefined}
                      placeholder="+8801700000000"
                      leftIcon={<Phone size={15} />}
                    />
                  </div>

                  <div>
                    <CustomInput
                      label="Master Account Password *"
                      name="password"
                      type="password"
                      darkMode={false}
                      rounded="sm"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.password ? formik.errors.password : undefined}
                      placeholder="At least 6 characters"
                      leftIcon={<Lock size={15} />}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goToPrevStep}
                      className="flex items-center gap-1.5 px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>
                    <CustomButton
                      type="submit"
                      loading={formik.isSubmitting}
                      size="md"
                      variant="primary"
                      className="font-bold px-6 py-2.5 text-xs rounded bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-xs"
                    >
                      {formik.isSubmitting ? "Provisioning Database..." : `Pay ৳${totalPrice.toLocaleString()} & Activate Store`}
                      <ArrowRight size={14} className="ml-1.5 inline" />
                    </CustomButton>
                  </div>
                </section>
              )}
            </div>

            {/* ══ RIGHT SIDEBAR: Live Order & Trial Receipt (4 columns) ══ */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-900">Subscription Summary</h3>
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                    Commercial Plan
                  </span>
                </div>

                {/* Selected Details */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-500">Business Type:</span>
                    <span className="font-semibold text-slate-900">{selectedCategoryObj.name}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-500">Workspace Slug:</span>
                    <span className="font-mono text-sky-700 font-semibold">{storeSlug}</span>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-slate-700 font-medium">
                    <span>{currentPlanObj.name} Plan ({isYearly ? "Yearly" : "Monthly"})</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      ৳{planPrice.toLocaleString()}{isYearly ? "/yr" : "/mo"}
                    </span>
                  </div>

                  {selectedAddonsList.map((a) => {
                    const price = isYearly ? a.yearlyPrice : a.monthlyPrice;
                    const unit = isYearly ? "/yr" : "/mo";
                    return (
                      <div key={a.code} className="flex justify-between items-center text-slate-500 pl-2">
                        <span>+ {a.name}</span>
                        <span className="tabular-nums font-medium text-slate-700">
                          ৳{price.toLocaleString()}{unit}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Total Line */}
                <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Subscription Total</span>
                    <span className="text-lg font-bold tabular-nums text-slate-900">
                      ৳{totalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-normal ml-1">
                      {isYearly ? "/ year" : "/ month"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Due Now</span>
                    <span className="text-base font-bold text-[#e92929] font-mono">
                      ৳{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {isYearly && (
                  <div className="rounded bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-800 font-medium">
                    ✓ Annual plan includes 2 months completely free.
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {error}
                  </div>
                )}

                {/* Dynamic Step-Aware Action Button (Cannot prematurely launch before Step 4) */}
                {currentStep === "category" && (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="w-full flex items-center justify-center gap-2 font-bold py-3 text-xs rounded bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Next: Choose Plan Tier</span>
                    <ArrowRight size={15} />
                  </button>
                )}

                {currentStep === "plan" && (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="w-full flex items-center justify-center gap-2 font-bold py-3 text-xs rounded bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Next: Select Add-ons</span>
                    <ArrowRight size={15} />
                  </button>
                )}

                {currentStep === "addons" && (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="w-full flex items-center justify-center gap-2 font-bold py-3 text-xs rounded bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Next: Store Profile & Login</span>
                    <ArrowRight size={15} />
                  </button>
                )}

                {currentStep === "account" && (
                  <div className="space-y-2.5">
                    <CustomButton
                      type="submit"
                      loading={formik.isSubmitting}
                      size="lg"
                      variant="primary"
                      className="w-full font-bold py-3 text-xs rounded bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CreditCard size={15} />
                      <span>{formik.isSubmitting ? "Provisioning Database..." : `Pay ৳${totalPrice.toLocaleString()} & Activate`}</span>
                    </CustomButton>

                    <button
                      type="button"
                      onClick={() => {
                        const errs = Object.keys(formik.errors);
                        if (errs.length > 0) {
                          formik.handleSubmit();
                          return;
                        }
                        setShowTrialRequestModal(true);
                      }}
                      className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-slate-50 rounded border border-dashed border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Clock size={13} className="text-slate-400" />
                      <span>Need a Free Trial? Request Trial Access</span>
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 text-center leading-normal">
                  Step {currentStepIndex + 1} of 4 • Complete all sections to activate your workspace.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* ── SSLCommerz Dummy Payment Gateway Modal ── */}
        <SslPaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={totalPrice}
          orderId={`SUB-${storeSlug.toUpperCase().slice(0, 8)}-${Date.now().toString().slice(-4)}`}
          customerName={formik.values.name || formik.values.businessName}
          customerEmail={formik.values.email}
          customerPhone={formik.values.phone}
          onSuccess={handlePaymentSuccess}
        />

        {/* ── Request Free Trial Modal (Admin Approval Required) ── */}
        <CustomModal
          open={showTrialRequestModal}
          onClose={() => {
            setShowTrialRequestModal(false);
            setTrialSubmitted(false);
          }}
          title="Request Free Trial Access"
        >
          {trialSubmitted ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Trial Request Submitted!</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Your request has been forwarded to SalePay Administration. An administrator will review your store profile and assign your trial days.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <span>Go to Login</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTrialRequestSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
                <HelpCircle size={18} className="text-sky-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Default registrations do not include automatic trials. You can submit a request below stating your business requirements. Store administrators decide and allocate trial periods.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Requested Trial Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setTrialDaysRequested(days)}
                      className={`py-2 rounded-md text-xs font-bold border transition cursor-pointer ${
                        trialDaysRequested === days
                          ? "bg-sky-50 border-sky-600 text-sky-800 shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Business Evaluation Note / Purpose
                </label>
                <textarea
                  rows={3}
                  required
                  value={trialReason}
                  onChange={(e) => setTrialReason(e.target.value)}
                  placeholder="e.g. We operate a multi-counter retail shop and wish to test receipt printing and barcode scanning with our team before purchasing."
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {error && (
                <p className="text-xs text-rose-600 font-semibold">{error}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTrialRequestModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTrial}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingTrial ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Submit Request to Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </CustomModal>
      </div>
    </div>
  );
}
