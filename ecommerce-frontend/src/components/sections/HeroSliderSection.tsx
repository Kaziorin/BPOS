"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Clock, Sparkles, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";
import { useTheme } from "@/context/ThemeContext";

interface HeroSliderProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function HeroSliderSection({ section, isDarkMode }: HeroSliderProps) {
  const { primaryColor, accentColor } = useTheme();
  const { title, subtitle, badge, settings } = section;
  const ctaText = settings?.ctaText || "Shop Now";
  const ctaLink = settings?.ctaLink || "/products";
  const heroImage = settings?.heroImage || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80";
  const sideDealTitle = settings?.sideDealTitle || "Flash Deal";
  const sideDealBadge = settings?.sideDealBadge || "Up to 70% OFF";
  const sideDealSubtitle = settings?.sideDealSubtitle || "Limited Time Only";
  const sideDealImage = settings?.sideDealImage || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80";

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 33 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 45, seconds: 30 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Main Hero Banner (Col 8) */}
          <div
            className={`lg:col-span-8 relative rounded-3xl overflow-hidden p-6 sm:p-10 flex flex-col justify-between shadow-xl transition-all ${
              isDarkMode
                ? "bg-gradient-to-r from-zinc-950 via-slate-900 to-stone-900 text-white border border-zinc-800"
                : "bg-gradient-to-r from-sky-50 via-indigo-50/60 to-purple-50 text-slate-900 border border-slate-200/80"
            }`}
            style={{ minHeight: "380px" }}
          >
            {/* Background image preview if available */}
            <div
              className="absolute inset-y-0 right-0 w-full sm:w-3/5 opacity-40 sm:opacity-90 bg-cover bg-center pointer-events-none mix-blend-multiply sm:mix-blend-normal transition-all"
              style={{
                backgroundImage: `url('${heroImage}')`,
                maskImage: "linear-gradient(to right, transparent, black 40%)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 40%)",
              }}
            />

            {/* Top Badge */}
            <div className="relative z-10">
              {badge && (
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-xs mb-4 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{badge}</span>
                </div>
              )}

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-md">
                {title || "Upgrade Your Everyday Style"}
              </h1>
              <p
                className={`mt-3 text-sm sm:text-base max-w-sm leading-relaxed ${
                  isDarkMode ? "text-zinc-300" : "text-slate-600"
                }`}
              >
                {subtitle || "Discover premium fashion, latest trends and exclusive deals — all in one place."}
              </p>
            </div>

            {/* Bottom Actions & Trust row */}
            <div className="relative z-10 pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={ctaLink}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Quick Feature strip */}
              <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-zinc-800 grid grid-cols-3 gap-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Free Shipping $50+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                  <span>7-Day Returns</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Flash Deal Card (Col 4) */}
          <div
            className={`lg:col-span-4 relative rounded-3xl overflow-hidden p-6 sm:p-7 flex flex-col justify-between shadow-xl text-white ${
              isDarkMode
                ? "bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 border border-purple-900/40"
                : "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900"
            }`}
          >
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
                  <span>{sideDealTitle}</span>
                </div>
                <span className="bg-rose-500/90 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase">
                  {sideDealBadge}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black mt-2 text-white">{sideDealSubtitle}</h2>

              {/* Product preview thumbnail */}
              <div className="relative my-4 h-32 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md flex items-center justify-center group">
                <img
                  src={sideDealImage}
                  alt="Deal product"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-3 text-xs font-semibold text-white/90">Premium Audio & Gear</span>
              </div>

              {/* Live Countdown Clock */}
              <div className="grid grid-cols-3 gap-2 text-center my-3">
                <div className="bg-white/15 backdrop-blur-md rounded-xl py-2 px-1 border border-white/10">
                  <span className="block text-lg font-black text-white">{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-300">Hrs</span>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl py-2 px-1 border border-white/10">
                  <span className="block text-lg font-black text-white">{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-300">Mins</span>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl py-2 px-1 border border-white/10">
                  <span className="block text-lg font-black text-white">{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-300">Secs</span>
                </div>
              </div>
            </div>

            <Link
              href="/products?filter=deals"
              className="mt-4 w-full py-3 rounded-full text-center text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-lg transition-all active:scale-95"
            >
              Shop Deals Now →
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
