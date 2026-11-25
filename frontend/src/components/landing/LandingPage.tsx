"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  LogIn,
  Menu,
  Package,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";
import {
  FALLBACK_ADDONS,
  FALLBACK_PLANS,
  fetchPublicPricing,
  formatPlanQuota,
  type AddonItem,
  type PlanItem,
} from "@/lib/subscription-catalog";
import { DashboardShowcaseVFX } from "@/components/landing/DashboardShowcaseVFX";
import { EcosystemVFXShowcase } from "@/components/landing/EcosystemVFXShowcase";
import { SubscriptionCheckoutModal } from "@/components/landing/SubscriptionCheckoutModal";

export function LandingPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const [plans, setPlans] = useState<PlanItem[]>(FALLBACK_PLANS);
  const [addons, setAddons] = useState<AddonItem[]>(FALLBACK_ADDONS);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("BUSINESS");
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("RESTAURANT");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<"pay" | "trial">("pay");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    fetchPublicPricing().then((res) => {
      if (!active) return;
      setPlans(res.plans);
      setAddons(res.addons);
    });
    return () => {
      active = false;
    };
  }, []);

  const openSubscriptionProcessor = ({
    planCode,
    businessType,
    mode = "pay",
  }: {
    planCode?: string;
    businessType?: string;
    mode?: "pay" | "trial";
  } = {}) => {
    if (planCode) setSelectedPlanCode(planCode);
    if (businessType) setSelectedBusinessType(businessType);
    setCheckoutMode(mode);
    setCheckoutOpen(true);
  };

  const isYearly = billingCycle === "YEARLY";

  return (
    <div className="min-h-screen w-full bg-[#f4f9ff] text-slate-900 flex flex-col selection:bg-sky-200 selection:text-sky-950">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FULL-WIDE LIGHT FROSTED GLASS NAVBAR                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-2xl border-b border-sky-200/80 shadow-sm shadow-sky-900/5"
            : "bg-white/65 backdrop-blur-xl border-b border-sky-100/80"
        }`}
      >
        <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-14 h-[72px] flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0 group">
            <Image
              src="/logos/salepay-logo-blue.png"
              alt="SalePay Enterprise"
              width={240}
              height={55}
              priority
              unoptimized
              className="h-11 sm:h-12 w-auto object-contain group-hover:scale-[1.02] transition-transform"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#pos-screens" className="hover:text-sky-600 transition">
              POS Screens
            </a>
            <a href="#features" className="hover:text-sky-600 transition">
              POS Features
            </a>
            <a href="#live-displays" className="hover:text-sky-600 transition">
              KOT &amp; Display
            </a>
            <a href="#mobile-app" className="hover:text-sky-600 transition">
              Mobile POS
            </a>
            <a href="#subscriptions" className="hover:text-sky-600 transition">
              Subscriptions
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {user && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-sm border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 transition"
              >
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </Link>
            )}

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-sm border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-sky-400 hover:text-sky-700 shadow-2xs transition"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </Link>

            <a
              href="#subscriptions"
              className="inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-sky-500/25 hover:brightness-110 transition"
            >
              <span>Subscribe</span>
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-sm border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-sm border border-sky-200 bg-white text-slate-700"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-sky-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-2 text-xs font-bold text-slate-700">
            <a
              href="#pos-screens"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded bg-sky-50/70 px-3 py-2"
            >
              POS Screens
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded bg-sky-50/70 px-3 py-2"
            >
              POS Features
            </a>
            <a
              href="#live-displays"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded bg-sky-50/70 px-3 py-2"
            >
              KOT &amp; Customer Display
            </a>
            <a
              href="#mobile-app"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded bg-sky-50/70 px-3 py-2"
            >
              Mobile App POS
            </a>
            <a
              href="#subscriptions"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded bg-gradient-to-r from-[#0284C7] to-[#38BDF8] px-3 py-2 text-center text-white"
            >
              View Subscriptions
            </a>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FULL-WIDE LIGHT SOFT BLUE WAVE HERO + 8 AUTO-RUNNING POS SCREENS    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="pos-screens"
        className="relative overflow-hidden bg-gradient-to-b from-[#eaf4ff] via-[#f2f8ff] to-[#ffffff] pt-24 pb-16 sm:pt-28 sm:pb-24"
      >
        {/* Silky Animated Floating Soft Blue Wave Glows */}
        <motion.div
          animate={{ x: [0, 35, -20, 0], y: [0, -24, 14, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-24 left-1/5 h-[440px] w-[440px] rounded-full bg-sky-300/35 blur-[110px]"
          aria-hidden
        />
        <motion.div
          animate={{ x: [0, -30, 20, 0], y: [0, 22, -16, 0], scale: [1, 0.95, 1.07, 1] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute top-28 right-1/6 h-[400px] w-[400px] rounded-full bg-cyan-200/45 blur-[110px]"
          aria-hidden
        />

        {/* Layered Soft Blue Ocean Wave Ribbons Across Hero */}
        <svg
          className="pointer-events-none absolute inset-x-0 top-12 w-full h-[460px] opacity-85"
          preserveAspectRatio="none"
          viewBox="0 0 1440 420"
          aria-hidden
        >
          <defs>
            <linearGradient id="softWave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.40" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="softWave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.18" />
            </linearGradient>
          </defs>
          <path
            d="M0,180 C280,80 540,260 880,150 C1140,65 1310,130 1440,90 L1440,420 L0,420 Z"
            fill="url(#softWave1)"
          />
          <path
            d="M0,250 C340,340 660,150 1020,240 C1230,290 1350,210 1440,185 L1440,420 L0,420 Z"
            fill="url(#softWave2)"
          />
          <path
            d="M0,180 C280,80 540,260 880,150 C1140,65 1310,130 1440,90"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2.5"
          />
        </svg>

        <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-14 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-4xl text-center space-y-5"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 backdrop-blur-md px-4 py-1.5 text-[11px] font-bold tracking-wide text-sky-700 shadow-xs">
              <Sparkles size={13} className="text-sky-600" />
              <span>8 Industry POS Registers • Live KOT &amp; Customer Display • 5 Mobile POS Apps</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.04] text-slate-900">
              Next-Gen{" "}
              <span className="bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#38bdf8] bg-clip-text text-transparent">
                Cloud &amp; Offline POS
              </span>{" "}
              Built to Move Fast.
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
              Experience 8 specialized POS counters running seamlessly across Web,
              Kitchen KOT, Dual Customer Displays &amp; Native Flutter Mobile Apps —
              activate your subscription directly below.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <a
                href="#subscriptions"
                className="inline-flex items-center gap-2 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-sky-500/25 hover:brightness-110 transition"
              >
                <span>Choose Subscription</span>
                <ArrowRight size={15} />
              </a>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-sm border border-sky-200 bg-white/95 px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-800 hover:border-sky-400 hover:text-sky-700 shadow-sm transition"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
            </div>
          </motion.div>

          {/* Full-Wide Auto-Cycling 8 POS Screens Showcase (Light Soft Blue Glass) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <DashboardShowcaseVFX
              onSelectVertical={(bt) =>
                openSubscriptionProcessor({
                  planCode: selectedPlanCode,
                  businessType: bt,
                  mode: "pay",
                })
              }
            />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FULL-WIDE POS FEATURES + LIVE KOT/CUSTOMER DISPLAY + MOBILE POS     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <EcosystemVFXShowcase />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SINGLE CRISP SOFT-BLUE WAVE SUBSCRIPTIONS SECTION                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="subscriptions"
        className="relative overflow-hidden bg-gradient-to-b from-[#e6f3ff] via-[#f2f8ff] to-[#eaf4ff] text-slate-900 py-20 sm:py-28 border-t border-sky-200/70"
      >
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-44 opacity-60"
          preserveAspectRatio="none"
          viewBox="0 0 1440 200"
          aria-hidden
        >
          <path
            d="M0,110 C380,20 740,180 1120,80 C1280,40 1380,85 1440,105 L1440,200 L0,200 Z"
            fill="rgba(186,230,253,0.45)"
          />
        </svg>

        <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-14 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-sky-200 px-3.5 py-1 text-[11px] font-bold text-sky-700 shadow-2xs">
                <CreditCard size={13} className="text-sky-600" />
                <span>Subscriptions &amp; Instant Activation</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                Pick a Plan &amp; Activate Directly
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Subscribe right from this section with SSLCommerz (Card, bKash,
                Nagad, Rocket) or submit a Free Trial request for your store.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white/90 p-1 shadow-2xs self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setBillingCycle("MONTHLY")}
                className={`rounded-md px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  billingCycle === "MONTHLY"
                    ? "bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("YEARLY")}
                className={`rounded-md px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  billingCycle === "YEARLY"
                    ? "bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Yearly</span>
                <span className="rounded bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                  Save 2 Months Free
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 items-stretch">
            {plans.map((plan) => {
              const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const savings = plan.monthlyPrice * 12 - plan.yearlyPrice;
              const isHighlighted = Boolean(plan.popular);

              return (
                <motion.div
                  key={plan.code}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4 }}
                  className={`relative rounded-2xl border p-7 sm:p-8 flex flex-col justify-between transition-all bg-white/95 backdrop-blur-xl ${
                    isHighlighted
                      ? "border-sky-500 ring-2 ring-sky-400/30 shadow-[0_28px_70px_-15px_rgba(2,132,199,0.22)]"
                      : "border-sky-200/80 shadow-[0_18px_45px_-15px_rgba(2,132,199,0.10)] hover:border-sky-300"
                  }`}
                >
                  {isHighlighted && (
                    <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0284C7] to-[#38BDF8] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                      <Sparkles size={11} />
                      Most Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-black text-slate-900">
                        {plan.name}
                      </h3>
                      <span className="rounded bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-mono font-bold text-sky-700">
                        {plan.code}
                      </span>
                    </div>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 min-h-[40px]">
                      {plan.description}
                    </p>

                    <div className="mt-5 pb-5 border-b border-sky-100">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black tracking-tight text-slate-900 tabular-nums">
                          ৳{displayPrice.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          /{isYearly ? "year" : "month"}
                        </span>
                      </div>
                      {isYearly && savings > 0 ? (
                        <p className="mt-1.5 text-xs font-bold text-emerald-700">
                          Save ৳{savings.toLocaleString()} annually
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-slate-500">
                          Instant activation • Cancel anytime
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 py-4 border-b border-sky-100 text-xs">
                      <div className="rounded-lg bg-[#f4f9ff] border border-sky-100 px-3 py-2 flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Building2 size={13} className="text-sky-600" />
                          Branches
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {formatPlanQuota(plan.maxBranches)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-[#f4f9ff] border border-sky-100 px-3 py-2 flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Store size={13} className="text-sky-600" />
                          POS
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {formatPlanQuota(plan.maxPOS)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-[#f4f9ff] border border-sky-100 px-3 py-2 flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Users size={13} className="text-sky-600" />
                          Staff
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {formatPlanQuota(plan.maxUsers)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-[#f4f9ff] border border-sky-100 px-3 py-2 flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Package size={13} className="text-sky-600" />
                          SKUs
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {formatPlanQuota(plan.maxProducts, 100000)}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-slate-700">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <CheckCircle2
                            size={16}
                            className="text-emerald-600 shrink-0 mt-0.5"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-7 pt-5 border-t border-sky-100 space-y-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        openSubscriptionProcessor({
                          planCode: plan.code,
                          mode: "pay",
                        })
                      }
                      className={`w-full flex items-center justify-center gap-2 rounded-sm py-3.5 text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                        isHighlighted
                          ? "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-md shadow-sky-500/25 hover:brightness-110"
                          : "bg-sky-900 text-white hover:bg-sky-800"
                      }`}
                    >
                      <span>Subscribe to {plan.name}</span>
                      <ArrowRight size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openSubscriptionProcessor({
                          planCode: plan.code,
                          mode: "trial",
                        })
                      }
                      className="w-full flex items-center justify-center gap-1.5 rounded-sm border border-sky-200 bg-[#f6faff] py-2.5 text-xs font-bold text-sky-800 hover:bg-sky-50 hover:border-sky-300 transition cursor-pointer"
                    >
                      <Clock size={13} />
                      <span>Request Free Trial</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* LIGHT SOFT BLUE FOOTER                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-white text-slate-600 border-t border-sky-200/80 py-8">
        <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-14 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/salepay-logo-blue.png"
              alt="SalePay Enterprise"
              width={180}
              height={42}
              unoptimized
              className="h-9 w-auto object-contain"
            />
            <span className="text-slate-300">•</span>
            <span>{siteConfig.description}</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <a href="#pos-screens" className="hover:text-sky-600 transition">
              POS Screens
            </a>
            <a href="#live-displays" className="hover:text-sky-600 transition">
              KOT &amp; Display
            </a>
            <a href="#mobile-app" className="hover:text-sky-600 transition">
              Mobile POS
            </a>
            <a href="#subscriptions" className="hover:text-sky-600 transition">
              Subscriptions
            </a>
            <Link href="/login" className="text-sky-600 font-bold hover:text-sky-700 transition">
              Sign In
            </Link>
            <span className="text-slate-400">© {siteConfig.name} {currentYear}</span>
            <a
              href={siteConfig.developerUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Developed by ${siteConfig.developerName}`}
              className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-[#f6faff] px-3 py-1 hover:border-sky-300 hover:bg-sky-50 transition"
            >
              <span className="text-[11px] font-medium text-slate-500">Developed by</span>
              <Image
                src="/logos/blue-oceans-tech-logo.png"
                alt={siteConfig.developerName}
                width={108}
                height={27}
                unoptimized
                className="h-5 w-auto object-contain"
              />
            </a>
          </div>
        </div>
      </footer>

      {checkoutOpen && (
        <SubscriptionCheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          plans={plans}
          addons={addons}
          initialPlanCode={selectedPlanCode}
          initialBillingCycle={billingCycle}
          initialBusinessType={selectedBusinessType}
          initialAddons={[]}
          initialMode={checkoutMode}
        />
      )}
    </div>
  );
}
