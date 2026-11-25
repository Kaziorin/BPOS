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
  const ctaText = settings?.ctaText || "Explore Products";
  const ctaLink = settings?.ctaLink || "/products";
  const heroImage =
    settings?.heroImage ||
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80";
  const sideDealTitle = settings?.sideDealTitle || "Featured Collection";
  const sideDealBadge = settings?.sideDealBadge || "Special Value";
  const sideDealSubtitle = settings?.sideDealSubtitle || "Curated seasonal picks";
  const sideDealImage =
    settings?.sideDealImage ||
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80";

  return (
    <section className="relative overflow-hidden py-4 sm:py-5">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Main Hero Banner (Col 8) */}
          <div
            className={`lg:col-span-8 relative rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-2xs border transition-all ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-800 text-white"
                : "bg-slate-50 border-slate-200 text-slate-900"
            }`}
            style={{ minHeight: "360px" }}
          >
            {/* Background image preview if available */}
            <div
              className="absolute inset-y-0 right-0 w-full sm:w-1/2 opacity-30 sm:opacity-85 bg-cover bg-center pointer-events-none transition-all"
              style={{
                backgroundImage: `url('${heroImage}')`,
                maskImage: "linear-gradient(to right, transparent, black 30%)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 30%)",
              }}
            />

            {/* Top Badge */}
            <div className="relative z-10 max-w-lg">
              {badge && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-sky-600 text-white mb-3">
                  <Tag className="w-3 h-3" />
                  <span>{badge}</span>
                </div>
              )}

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {title || "Upgrade Your Everyday Style"}
              </h1>
              <p
                className={`mt-2.5 text-xs sm:text-sm max-w-md leading-relaxed ${
                  isDarkMode ? "text-zinc-300" : "text-slate-600"
                }`}
              >
                {subtitle ||
                  "Discover premium fashion, lifestyle goods, and daily essentials backed by real-time POS stock sync."}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={ctaLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold shadow-2xs text-white bg-sky-600 hover:bg-sky-700 transition-colors"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/products?sort=popular"
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                    isDarkMode
                      ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>Popular items</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Side Promo Card (Col 4) */}
          <div
            className={`lg:col-span-4 relative rounded-2xl overflow-hidden p-5 flex flex-col justify-between shadow-2xs border ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-800 text-white"
                : "bg-slate-50 border-slate-200 text-slate-900"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                  {sideDealBadge}
                </span>
                <span className="text-[11px] text-slate-500">Curated</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {sideDealTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{sideDealSubtitle}</p>
            </div>

            <div className="my-3 aspect-video sm:aspect-square lg:aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white">
              <img
                src={sideDealImage}
                alt={sideDealTitle}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <Link
              href="/products"
              className="w-full py-2 px-3 text-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Browse collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
