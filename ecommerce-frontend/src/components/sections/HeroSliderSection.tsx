"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Tag, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";
import { useTheme } from "@/context/ThemeContext";

interface HeroSliderProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function HeroSliderSection({ section, isDarkMode }: HeroSliderProps) {
  const { primaryColor } = useTheme();
  const { title, subtitle, badge, settings } = section;
  const ctaText = settings?.ctaText || "Explore products";
  const ctaLink = settings?.ctaLink || "/products";
  const heroImage =
    settings?.heroImage ||
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=80";
  const sideDealTitle = settings?.sideDealTitle || "Featured Collection";
  const sideDealBadge = settings?.sideDealBadge || "Special Value";
  const sideDealSubtitle = settings?.sideDealSubtitle || "Curated seasonal picks";
  const sideDealImage =
    settings?.sideDealImage ||
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80";

  return (
    <section className="relative overflow-hidden py-3 sm:py-5">
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
          {/* Main Hero Banner (Col 8) */}
          <div
            className={`lg:col-span-8 relative rounded-2xl sm:rounded-3xl overflow-hidden p-6 sm:p-10 lg:p-12 flex flex-col justify-between border transition-all ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-800"
                : "bg-slate-50 border-slate-200"
            }`}
            style={{ minHeight: "380px" }}
          >
            {/* Background image preview if available */}
            <div
              className="absolute inset-y-0 right-0 w-full sm:w-3/5 opacity-40 sm:opacity-90 bg-cover bg-center pointer-events-none transition-all"
              style={{
                backgroundImage: `url('${heroImage}')`,
                maskImage: "linear-gradient(to right, transparent, black 25%)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 25%)",
              }}
            />

            {/* High-Contrast Frosted Scrim Overlay on the Left for 100% Crystal-Clear Text */}
            <div
              className={`absolute inset-0 pointer-events-none ${
                isDarkMode
                  ? "bg-gradient-to-r from-zinc-900 via-zinc-900/90 sm:via-zinc-900/75 to-transparent"
                  : "bg-gradient-to-r from-slate-50 via-slate-50/95 sm:via-slate-50/80 to-transparent"
              }`}
            />

            {/* Top Badge & Headings */}
            <div className="relative z-10 max-w-xl">
              {badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-4 shadow-2xs">
                  <Tag className="w-3 h-3" />
                  <span>{badge}</span>
                </div>
              )}

              <h1
                className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight ${
                  isDarkMode ? "!text-white" : "!text-slate-900"
                }`}
              >
                {title || "Upgrade Your Everyday Style"}
              </h1>
              <p
                className={`mt-3 text-xs sm:text-sm lg:text-base max-w-lg leading-relaxed ${
                  isDarkMode ? "!text-zinc-300" : "!text-slate-600"
                }`}
              >
                {subtitle ||
                  "Discover premium lifestyle goods, daily essentials, and curated collections backed by real-time inventory sync."}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 pt-6 sm:pt-8">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={ctaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold shadow-2xs text-white bg-slate-900 hover:bg-sky-600 transition-colors"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/products?sort=popular"
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold border transition-colors ${
                    isDarkMode
                      ? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <span>Popular items</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Side Promo Card (Col 4) */}
          <div
            className={`lg:col-span-4 relative rounded-2xl sm:rounded-3xl overflow-hidden p-6 flex flex-col justify-between border ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-800"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  {sideDealBadge}
                </span>
                <span className="text-xs text-slate-500">Curated</span>
              </div>
              <h3 className={`text-lg font-bold ${isDarkMode ? "!text-white" : "!text-slate-900"}`}>
                {sideDealTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{sideDealSubtitle}</p>
            </div>

            <div className="my-4 aspect-video sm:aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs">
              <img
                src={sideDealImage}
                alt={sideDealTitle}
                className="w-full h-full object-cover hover:scale-103 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            <Link
              href="/products"
              className={`w-full py-2.5 px-4 text-center rounded-xl border text-xs font-semibold transition-colors ${
                isDarkMode
                  ? "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              Browse collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
