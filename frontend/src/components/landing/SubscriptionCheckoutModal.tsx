"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  ArrowRight,
  Building,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";
import {
  SslPaymentModal,
  type SslPaymentSuccessData,
} from "@/components/payment/SslPaymentModal";
import { ApiError, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  BUSINESS_CATEGORIES,
  resolveAddonIcon,
  type AddonItem,
  type PlanItem,
} from "@/lib/subscription-catalog";

export interface SubscriptionCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  plans: PlanItem[];
  addons: AddonItem[];
  initialPlanCode: string;
  initialBillingCycle: "MONTHLY" | "YEARLY";
  initialBusinessType: string;
  initialAddons: string[];
  initialMode?: "pay" | "trial";
}

const checkoutSchema = Yup.object({
  businessName: Yup.string().trim().required("Store or business name is required"),
  businessType: Yup.string().required("Select a business category"),
  name: Yup.string().trim().required("Owner or manager name is required"),
  email: Yup.string().trim().email("Enter a valid email address").required("Email is required"),
  phone: Yup.string().trim().optional(),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export function SubscriptionCheckoutModal({
  open,
  onClose,
  plans,
  addons,
  initialPlanCode,
  initialBillingCycle,
  initialBusinessType,
  initialAddons,
  initialMode = "pay",
}: SubscriptionCheckoutModalProps) {
  const { user, subscription, register } = useAuth();

  const [workspaceAction, setWorkspaceAction] = useState<"new" | "upgrade">("new");
  const [selectedPlanCode, setSelectedPlanCode] = useState(initialPlanCode || "BUSINESS");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">(initialBillingCycle);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(initialAddons);
  const [activationMode, setActivationMode] = useState<"pay" | "trial">(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Trial state
  const [trialDays, setTrialDays] = useState<7 | 14 | 30>(14);
  const [trialNote, setTrialNote] = useState("");
  const [trialSuccess, setTrialSuccess] = useState(false);

  // Upgrade state (logged-in user)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Processing & errors
  const [error, setError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showSslModal, setShowSslModal] = useState(false);
  const [sslOrderId, setSslOrderId] = useState("SUB-NEW-0001");

  const formik = useFormik({
    initialValues: {
      businessName: "",
      businessType: initialBusinessType || "RESTAURANT",
      name: "",
      email: "",
      phone: "",
      password: "",
    },
    validationSchema: checkoutSchema,
    onSubmit: async () => {
      // Handled explicitly via handleProcessAction
    },
  });

  const currentPlan = useMemo(
    () => plans.find((p) => p.code === selectedPlanCode) || plans[0],
    [plans, selectedPlanCode]
  );

  const selectedCategory = useMemo(
    () =>
      BUSINESS_CATEGORIES.find((c) => c.id === formik.values.businessType) ||
      BUSINESS_CATEGORIES[0],
    [formik.values.businessType]
  );

  const { industryAddons, universalAddons } = useMemo(() => {
    const primaryCat = selectedCategory.primaryAddonsCategory;
    const ind = addons.filter((a) => {
      if (primaryCat === "ALL") return false;
      return a.industry === primaryCat;
    });
    const uni = addons.filter((a) => a.industry === "ALL");
    return { industryAddons: ind, universalAddons: uni };
  }, [addons, selectedCategory]);

  const selectedAddonObjects = useMemo(
    () =>
      selectedAddons
        .map((code) => addons.find((a) => a.code === code))
        .filter(Boolean) as AddonItem[],
    [selectedAddons, addons]
  );

  const isYearly = billingCycle === "YEARLY";
  const planPrice = currentPlan
    ? isYearly
      ? currentPlan.yearlyPrice
      : currentPlan.monthlyPrice
    : 0;

  const addonsTotal = useMemo(() => {
    if (workspaceAction === "upgrade") return 0;
    return selectedAddonObjects.reduce(
      (sum, item) => sum + (isYearly ? item.yearlyPrice : item.monthlyPrice),
      0
    );
  }, [selectedAddonObjects, isYearly, workspaceAction]);

  const totalDue = planPrice + addonsTotal;

  const storeSlug = useMemo(() => {
    const raw = formik.values.businessName || "my-store";
    return (
      raw
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "my-store"
    );
  }, [formik.values.businessName]);

  const handleBusinessTypeChange = (nextType: string) => {
    formik.setFieldValue("businessType", nextType);
    const nextCat = BUSINESS_CATEGORIES.find((c) => c.id === nextType);
    const allowedIndustry = nextCat?.primaryAddonsCategory || "ALL";
    setSelectedAddons((prev) =>
      prev.filter((code) => {
        const item = addons.find((a) => a.code === code);
        if (!item) return false;
        return item.industry === "ALL" || item.industry === allowedIndustry;
      })
    );
  };

  const toggleAddon = (code: string) => {
    setSelectedAddons((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  const validateAccountForm = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched({
        businessName: true,
        businessType: true,
        name: true,
        email: true,
        phone: true,
        password: true,
      });
      setError("Please fill in your store and administrator account details to continue.");
      return false;
    }
    return true;
  };

  const openPaymentGateway = () => {
    setSslOrderId(
      `SUB-${storeSlug.toUpperCase().slice(0, 8)}-${Date.now().toString().slice(-4)}`
    );
    setShowSslModal(true);
  };

  const handleProcessAction = async () => {
    setError(null);

    if (workspaceAction === "upgrade" && user) {
      openPaymentGateway();
      return;
    }

    const valid = await validateAccountForm();
    if (!valid) return;

    if (activationMode === "pay") {
      openPaymentGateway();
      return;
    }

    // Free Trial Request flow directly from landing page
    setIsProvisioning(true);
    try {
      await register({
        ...formik.values,
        planCode: currentPlan?.code || selectedPlanCode,
        selectedAddons,
        requestTrial: true,
        trialNote:
          trialNote.trim() ||
          `Requested ${trialDays}-day free trial for ${selectedCategory.name}.`,
      });
      setTrialSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to submit trial request right now. Please try again."
      );
    } finally {
      setIsProvisioning(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: SslPaymentSuccessData) => {
    setError(null);
    setIsProvisioning(true);

    try {
      if (workspaceAction === "upgrade" && user) {
        if (currentPlan?.id) {
          await api.patch("/api/v1/saas/subscription", {
            planId: currentPlan.id,
            billingCycle,
          });
        }
        await api.post("/api/v1/saas/subscription/pay", {
          subscriptionId: subscription?.id,
          transactionId: paymentData.transactionId,
          amount: paymentData.amount,
        });

        try {
          const meRes = await api.get<{
            data?: { subscription?: unknown };
            subscription?: unknown;
          }>("/auth/me");
          const updatedSub = meRes?.data?.subscription || meRes?.subscription;
          if (updatedSub) {
            localStorage.setItem("modernpos_subscription", JSON.stringify(updatedSub));
          }
        } catch {
          // Non-fatal refresh error; subscription already updated on server
        }

        setUpgradeSuccess(true);
        return;
      }

      await register({
        ...formik.values,
        planCode: currentPlan?.code || selectedPlanCode,
        selectedAddons,
        paymentDetails: {
          trxId: paymentData.transactionId,
          method: paymentData.method,
          amount: paymentData.amount,
          status: "PAID",
        },
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Payment succeeded, but provisioning failed. Please check your email or sign in."
      );
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <>
      <CustomModal
        open={open}
        onClose={onClose}
        size="5xl"
        themeColor="primary"
        icon={<CreditCard size={18} />}
        title={`Subscribe to ${currentPlan?.name || "Blue Oceans"} Plan`}
        subtitle="Configure your industry vertical, add-ons & activate your cloud workspace directly."
      >
        {trialSuccess ? (
          <div className="py-10 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 size={34} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Trial Request Submitted!
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your workspace for{" "}
              <span className="font-bold text-slate-900">
                {formik.values.businessName}
              </span>{" "}
              has been registered and your {trialDays}-day trial request is queued for
              administrator approval.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-sm bg-brand-gradient px-5 py-2.5 text-xs font-bold text-white shadow-brand-button hover:brightness-110 transition"
              >
                <span>Open Workspace</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <span>Go to Sign In</span>
              </Link>
            </div>
          </div>
        ) : upgradeSuccess ? (
          <div className="py-10 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 size={34} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Subscription Upgraded & Active!
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your workspace is now active on the{" "}
              <span className="font-bold text-slate-900">{currentPlan?.name}</span>{" "}
              plan ({billingCycle.toLowerCase()}).
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-sm bg-brand-gradient px-6 py-2.5 text-xs font-bold text-white shadow-brand-button hover:brightness-110 transition"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN: Plan, Industry, Add-ons, Account ── */}
            <div className="lg:col-span-7 space-y-5">
              {user && (
                <div className="rounded-md border border-sky-200 bg-sky-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-sky-900 block">
                      Signed in as {user.name || user.email}
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Current Plan: {subscription?.planName || "Active Store"} (
                      {subscription?.status || "ACTIVE"})
                    </span>
                  </div>
                  <div className="inline-flex rounded-sm border border-sky-200 bg-white p-0.5 text-[11px] font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setWorkspaceAction("upgrade");
                        setError(null);
                      }}
                      className={`px-3 py-1.5 rounded-xs transition cursor-pointer ${
                        workspaceAction === "upgrade"
                          ? "bg-sky-600 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Upgrade Current Store
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWorkspaceAction("new");
                        setError(null);
                      }}
                      className={`px-3 py-1.5 rounded-xs transition cursor-pointer ${
                        workspaceAction === "new"
                          ? "bg-sky-600 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Provision New Store
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Plan Tier & Billing Cycle */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Subscription Tier & Cycle
                  </label>
                  <div className="inline-flex items-center rounded-sm border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("MONTHLY")}
                      className={`px-2.5 py-1 rounded-xs transition cursor-pointer ${
                        billingCycle === "MONTHLY"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("YEARLY")}
                      className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
                        billingCycle === "YEARLY"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>Yearly</span>
                      <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-700">
                        2 Mo Free
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {plans.map((plan) => {
                    const isSelected = plan.code === currentPlan?.code;
                    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                    return (
                      <button
                        key={plan.code}
                        type="button"
                        onClick={() => setSelectedPlanCode(plan.code)}
                        className={`relative rounded-md border p-3 text-left transition cursor-pointer ${
                          isSelected
                            ? "border-sky-600 bg-sky-50/70 ring-1 ring-sky-600/30 shadow-2xs"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">
                            {plan.name}
                          </span>
                          {isSelected ? (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-white">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          ) : plan.popular ? (
                            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">
                              Popular
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1.5 flex items-baseline gap-1">
                          <span className="text-base font-black text-slate-900 tabular-nums">
                            ৳{price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            /{isYearly ? "yr" : "mo"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {workspaceAction === "new" && (
                <>
                  {/* 2. Business Category */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        2. Industry Vertical
                      </label>
                      <span className="text-[11px] font-semibold text-sky-700">
                        {selectedCategory.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BUSINESS_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const active = formik.values.businessType === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleBusinessTypeChange(cat.id)}
                            className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition cursor-pointer ${
                              active
                                ? "border-sky-600 bg-sky-50/70 text-slate-900 ring-1 ring-sky-600/20"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${
                                active
                                  ? "bg-sky-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <Icon size={14} />
                            </span>
                            <span className="text-[11px] font-bold leading-tight truncate">
                              {cat.shortName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Industry & Universal Add-ons */}
                  {(industryAddons.length > 0 || universalAddons.length > 0) && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          3. Optional Add-on Modules
                        </label>
                        <span className="text-[11px] text-slate-500">
                          {selectedAddons.length} selected
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                        {[...industryAddons, ...universalAddons].map((addon) => {
                          const checked = selectedAddons.includes(addon.code);
                          const Icon = resolveAddonIcon(addon.icon);
                          const price = isYearly
                            ? addon.yearlyPrice
                            : addon.monthlyPrice;
                          return (
                            <button
                              key={addon.code}
                              type="button"
                              onClick={() => toggleAddon(addon.code)}
                              className={`flex items-center justify-between gap-2 rounded-md border p-2.5 text-left transition cursor-pointer ${
                                checked
                                  ? "border-sky-600 bg-sky-50/60"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${
                                    checked
                                      ? "bg-sky-600 text-white"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  <Icon size={14} />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-slate-800 truncate">
                                    {addon.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate">
                                    +৳{price.toLocaleString()}/{isYearly ? "yr" : "mo"}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  checked
                                    ? "border-sky-600 bg-sky-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {checked && <Check size={10} strokeWidth={3} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Store & Owner Credentials */}
                  <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        4. Store & Administrator Account
                      </label>
                      <span className="text-[10px] font-mono text-sky-700 truncate max-w-[200px]">
                        {storeSlug}.blueoceanspos.com
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <CustomInput
                        label="Store / Business Name"
                        name="businessName"
                        required
                        darkMode={false}
                        value={formik.values.businessName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.businessName
                            ? formik.errors.businessName
                            : undefined
                        }
                        placeholder="e.g. Dhaka Fresh Mart"
                        leftIcon={<Building size={14} />}
                      />

                      <CustomInput
                        label="Owner / Manager Name"
                        name="name"
                        required
                        darkMode={false}
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.name ? formik.errors.name : undefined}
                        placeholder="e.g. Tariq Hasan"
                        leftIcon={<User size={14} />}
                      />

                      <CustomInput
                        label="Login Email"
                        name="email"
                        type="email"
                        required
                        darkMode={false}
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.email ? formik.errors.email : undefined
                        }
                        placeholder="owner@company.com"
                        leftIcon={<Mail size={14} />}
                      />

                      <CustomInput
                        label="Phone Number"
                        name="phone"
                        darkMode={false}
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.phone ? formik.errors.phone : undefined
                        }
                        placeholder="+8801700000000"
                        leftIcon={<Phone size={14} />}
                      />
                    </div>

                    <CustomInput
                      label="Master Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      darkMode={false}
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.password ? formik.errors.password : undefined
                      }
                      placeholder="Minimum 6 characters"
                      leftIcon={<Lock size={14} />}
                      rightIcon={
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                  </div>
                </>
              )}
            </div>

            {/* ── RIGHT COLUMN: Order Summary & Payment Processing ── */}
            <div className="lg:col-span-5 space-y-4 rounded-md border border-slate-200 bg-white p-5 shadow-2xs lg:sticky lg:top-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-sky-600" />
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Order Summary
                  </h4>
                </div>
                <span className="rounded bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                  {isYearly ? "Annual Billing" : "Monthly Billing"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {workspaceAction === "new" && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Business Vertical</span>
                    <span className="font-bold text-slate-900">
                      {selectedCategory.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-700 font-medium pt-1">
                  <span>
                    {currentPlan?.name} Plan ({isYearly ? "Yearly" : "Monthly"})
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    ৳{planPrice.toLocaleString()}
                  </span>
                </div>

                {workspaceAction === "new" &&
                  selectedAddonObjects.map((addon) => {
                    const price = isYearly
                      ? addon.yearlyPrice
                      : addon.monthlyPrice;
                    return (
                      <div
                        key={addon.code}
                        className="flex items-center justify-between text-slate-500 pl-2"
                      >
                        <span className="truncate pr-2">+ {addon.name}</span>
                        <span className="tabular-nums font-semibold text-slate-700 shrink-0">
                          ৳{price.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Total Subscription
                  </span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    ৳{totalDue.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">
                    /{isYearly ? "year" : "month"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    {activationMode === "trial" && workspaceAction === "new"
                      ? "Due Today"
                      : "Instant Checkout"}
                  </span>
                  <span className="text-base font-extrabold text-[#e92929] font-mono">
                    ৳
                    {activationMode === "trial" && workspaceAction === "new"
                      ? "0"
                      : totalDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {workspaceAction === "new" && (
                <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setActivationMode("pay");
                      setError(null);
                    }}
                    className={`rounded py-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activationMode === "pay"
                        ? "bg-white text-sky-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CreditCard size={13} />
                    <span>Pay & Activate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivationMode("trial");
                      setError(null);
                    }}
                    className={`rounded py-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activationMode === "trial"
                        ? "bg-white text-sky-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Clock size={13} />
                    <span>Request Free Trial</span>
                  </button>
                </div>
              )}

              {workspaceAction === "new" && activationMode === "trial" && (
                <div className="space-y-3 rounded-md border border-sky-200 bg-sky-50/60 p-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Requested Evaluation Period
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([7, 14, 30] as const).map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setTrialDays(days)}
                          className={`rounded border py-1.5 text-xs font-bold transition cursor-pointer ${
                            trialDays === days
                              ? "border-sky-600 bg-white text-sky-800 shadow-2xs"
                              : "border-slate-200 bg-white/60 text-slate-600"
                          }`}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Business Note (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={trialNote}
                      onChange={(e) => setTrialNote(e.target.value)}
                      placeholder="Tell us about your outlets or hardware needs..."
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 space-y-1">
                  <p>{error}</p>
                  {error.toLowerCase().includes("already exists") && (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
                    >
                      <span>Sign in to your existing account</span>
                      <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              )}

              <CustomButton
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                loading={isProvisioning}
                onClick={handleProcessAction}
              >
                {workspaceAction === "upgrade" ? (
                  <>
                    <Sparkles size={15} />
                    <span>Pay ৳{totalDue.toLocaleString()} & Upgrade Plan</span>
                  </>
                ) : activationMode === "pay" ? (
                  <>
                    <CreditCard size={15} />
                    <span>
                      {isProvisioning
                        ? "Activating Workspace..."
                        : `Pay ৳${totalDue.toLocaleString()} & Activate`}
                    </span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>
                      {isProvisioning
                        ? "Submitting Request..."
                        : `Submit ${trialDays}-Day Trial Request`}
                    </span>
                  </>
                )}
              </CustomButton>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Lock size={11} className="text-slate-400" />
                  SSLCommerz Secured
                </span>
                <Link
                  href="/login"
                  className="font-semibold text-sky-700 hover:underline"
                >
                  Already subscribed? Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      <SslPaymentModal
        open={showSslModal}
        onClose={() => setShowSslModal(false)}
        amount={totalDue}
        orderId={sslOrderId}
        customerName={
          workspaceAction === "upgrade" && user
            ? user.name || user.email
            : formik.values.name || formik.values.businessName || "New Merchant"
        }
        customerEmail={
          workspaceAction === "upgrade" && user
            ? user.email
            : formik.values.email || "merchant@blueoceanspos.com"
        }
        customerPhone={formik.values.phone || "01700000000"}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
