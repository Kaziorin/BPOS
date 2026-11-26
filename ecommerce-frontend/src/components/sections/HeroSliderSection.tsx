"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Tag, Sparkles } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface HeroSliderProps {
  section: SectionItem;
  noticeSection?: SectionItem;
  isDarkMode?: boolean;
}

export default function HeroSliderSection({ section, noticeSection, isDarkMode }: HeroSliderProps) {
  const { title, subtitle, badge, settings } = section;
  const ctaText = settings?.ctaText || "Shop Now";
  const ctaLink = settings?.ctaLink || "/products";
  const heroImage =
    settings?.heroImage ||
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=80";
  const sideDealTitle = settings?.sideDealTitle || "Flash Deal";
  const sideDealBadge = settings?.sideDealBadge || "Up to 70% OFF";
  const sideDealSubtitle = settings?.sideDealSubtitle || "Limited time curated picks";
  const sideDealImage =
    settings?.sideDealImage ||
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80";

  const offerBadge = noticeSection?.badge || "Limited Offer";
  const offerTitle = noticeSection?.title || "Weekend Flash Sale: Up to 60% off trending collections";
  const offerSubtitle = noticeSection?.subtitle || "Use code SHOP2026 at checkout for instant savings.";
  const offerLink = noticeSection?.settings?.ctaLink || "/products";
  const offerCta = noticeSection?.settings?.ctaText || "Shop deals";

  return (
    <section className="relative overflow-hidden py-4 sm:py-6">
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
          {/* Card 1: Main Hero Banner (Col 8) */}
          <div
            className={`lg:col-span-8 relative rounded-2xl overflow-hidden p-7 sm:p-10 lg:p-12 flex flex-col justify-center border transition-all ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-800"
                : "bg-[#FAF5EE] border-orange-200/70"
            }`}
            style={{ minHeight: "430px" }}
          >
            {/* Right visual subject seamlessly blended */}
            <div
              className="absolute inset-y-0 right-0 w-full sm:w-[64%] opacity-55 sm:opacity-100 bg-cover bg-center pointer-events-none transition-all"
              style={{
                backgroundImage: `url('${heroImage}')`,
                maskImage: "linear-gradient(to right, transparent, black 20%)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 20%)",
              }}
            />

            {/* Soft left scrim for crisp text */}
            <div
              className={`absolute inset-0 pointer-events-none ${
                isDarkMode
                  ? "bg-gradient-to-r from-zinc-900 via-zinc-900/85 sm:via-zinc-900/55 to-transparent"
                  : "bg-gradient-to-r from-[#FAF5EE] via-[#FAF5EE]/90 sm:via-[#FAF5EE]/55 to-transparent"
              }`}
            />

            {/* Top Badge & Headings */}
            <div className="relative z-10 max-w-2xl">
              {badge && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${
                  isDarkMode
                    ? "bg-orange-500/20 border-orange-500/30 text-orange-300"
                    : "bg-orange-100/90 border-orange-200 text-orange-800"
                }`}>
                  <span className="capitalize">{badge.toLowerCase()}</span>
                </div>
              )}

              <h1
                className={`text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight leading-snug lg:whitespace-nowrap ${
                  isDarkMode ? "!text-white" : "!text-stone-900"
                }`}
              >
                {(() => {
                  const heading = title || "Upgrade Your Everyday Style";
                  const words = heading.trim().split(/\s+/);
                  if (words.length <= 2) return heading;
                  const head = words.slice(0, -2).join(" ");
                  const tail = words.slice(-2).join(" ");
                  return (
                    <>
                      {head}{" "}
                      <span className="text-orange-600">{tail}</span>
                    </>
                  );
                })()}
              </h1>
              <p
                className={`mt-3 text-xs sm:text-sm max-w-md leading-relaxed ${
                  isDarkMode ? "!text-zinc-300" : "!text-stone-700"
                }`}
              >
                {subtitle ||
                  "Discover authentic collections, daily essentials, and live store inventory delivered straight to your door."}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={ctaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition-colors"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/products?sort=popular"
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-semibold border transition-colors ${
                    isDarkMode
                      ? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                      : "border-orange-200 bg-white text-stone-800 hover:border-orange-600 hover:text-orange-700"
                  }`}
                >
                  <span>Popular items</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column (Col 4): 2 Balanced Stacked Cards */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-5">
            {/* Card 2 (Top-Right): Offer / Voucher Card */}
            <div className={`rounded-2xl p-5 sm:p-6 border flex flex-col justify-between gap-4 ${
              isDarkMode
                ? "bg-zinc-900 border-orange-900/50 text-white"
                : "bg-[#1C1917] border-stone-800 text-white"
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-600 text-white text-[11px] font-semibold">
                    <Sparkles className="w-3 h-3" />
                    {offerBadge}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/15">
                    SHOP2026
                  </span>
                </div>
                <span className="text-[11px] font-medium text-stone-400">Limited</span>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base font-bold leading-snug text-white">
                  {offerTitle}
                </h2>
                <p className="text-xs text-stone-300/90 leading-relaxed">
                  {offerSubtitle}
                </p>
              </div>

              <Link
                href={offerLink}
                className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span>{offerCta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3 (Bottom-Right): Featured / Flash Deal Card */}
            <div
              className={`flex-1 rounded-2xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between gap-3 border ${
                isDarkMode
                  ? "bg-zinc-900 border-zinc-800"
                  : "bg-white border-orange-200/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className={`text-base font-bold leading-tight ${isDarkMode ? "!text-white" : "!text-stone-900"}`}>
                    {sideDealTitle}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? "text-zinc-400" : "text-stone-600"}`}>
                    {sideDealSubtitle}
                  </p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded border shrink-0 ${
                  isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-stone-50 border-stone-200 text-stone-600"
                }`}>
                  Curated
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                <img
                  src={sideDealImage}
                  alt={sideDealTitle}
                  className="w-full h-full object-cover object-center hover:scale-103 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#1C1917]/90 text-white shadow-xs backdrop-blur-xs">
                  <Tag className="w-3 h-3 text-orange-400" />
                  {sideDealBadge}
                </span>
              </div>

              <Link
                href="/products"
                className={`w-full py-2.5 px-4 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  isDarkMode
                    ? "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                    : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600"
                }`}
              >
                <span>Browse collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
