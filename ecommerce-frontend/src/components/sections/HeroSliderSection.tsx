"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Tag, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface HeroSliderProps {
  section: SectionItem;
  noticeSection?: SectionItem;
  isDarkMode?: boolean;
}

interface HeroSlide {
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
}

export default function HeroSliderSection({ section, noticeSection, isDarkMode }: HeroSliderProps) {
  const { title, subtitle, badge, settings } = section;
  const ctaText = "Shop Now";
  const ctaLink = "/products?sort=newest";
  const heroImage =
    settings?.heroImage ||
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=80";
  const sideDealTitle = settings?.sideDealTitle || "Flash Deal";
  const sideDealBadge = settings?.sideDealBadge || "Up to 70% off";
  const sideDealImage =
    settings?.sideDealImage ||
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80";

  const slides: HeroSlide[] = [
    {
      badge: badge || "New Arrival",
      title: title || "Upgrade Your Everyday Style",
      subtitle:
        subtitle ||
        "Authentic collections and live store inventory delivered to your door.",
      ctaText,
      ctaLink,
      image: heroImage,
    },
    {
      badge: "Trending",
      title: "Curated Audio & Lifestyle",
      subtitle:
        "Top-rated essentials synced directly with real-time store stock.",
      ctaText,
      ctaLink,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80",
    },
    {
      badge: "Fresh Drops",
      title: "Everyday Living Made Better",
      subtitle:
        "New arrivals across every category with fast dispatch and COD checkout.",
      ctaText,
      ctaLink,
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("SHOP2026").catch(() => {});
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const currentSlide = slides[activeIndex];

  const renderTwoToneTitle = (heading: string) => {
    const words = heading.trim().split(/\s+/);
    if (words.length <= 2) return heading;
    return (
      <>
        {words.slice(0, -2).join(" ")}{" "}
        <span className="text-orange-600">{words.slice(-2).join(" ")}</span>
      </>
    );
  };

  const offerBadge = noticeSection?.badge || "Special Offer";
  const offerTitle = "Weekend Flash Sale";
  const offerLink = noticeSection?.settings?.ctaLink || "/products?sort=newest";
  const offerCta = noticeSection?.settings?.ctaText || "Shop deals";

  return (
    <section className="relative overflow-hidden py-4 sm:py-6">
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
          {/* Card 1: Auto-Infinite Main Hero Slider (Col 8) */}
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`group lg:col-span-8 relative rounded-2xl overflow-hidden p-7 sm:p-10 lg:p-12 flex flex-col justify-center border transition-all ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-800"
                : "bg-[#FAF5EE] border-orange-200/70"
            }`}
            style={{ minHeight: "420px" }}
          >
            {/* Slide Background Images with Smooth Crossfade */}
            {slides.map((s, idx) => (
              <div
                key={idx}
                className={`absolute inset-y-0 right-0 w-full sm:w-[64%] bg-cover bg-center pointer-events-none transition-opacity duration-700 ${
                  idx === activeIndex ? "opacity-55 sm:opacity-100" : "opacity-0"
                }`}
                style={{
                  backgroundImage: `url('${s.image}')`,
                  maskImage: "linear-gradient(to right, transparent, black 20%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent, black 20%)",
                }}
              />
            ))}

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
              {currentSlide.badge && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-4 ${
                  isDarkMode
                    ? "bg-orange-500/20 border-orange-500/30 text-orange-300"
                    : "bg-orange-100/90 border-orange-200 text-orange-800"
                }`}>
                  <span className="capitalize">{currentSlide.badge.toLowerCase()}</span>
                </div>
              )}

              <h1
                className={`text-2xl sm:text-3xl lg:text-[32px] font-semibold tracking-tight leading-snug lg:whitespace-nowrap ${
                  isDarkMode ? "!text-white" : "!text-stone-900"
                }`}
              >
                {renderTwoToneTitle(currentSlide.title)}
              </h1>
              <p
                className={`mt-2.5 text-xs sm:text-sm font-normal max-w-md leading-relaxed ${
                  isDarkMode ? "!text-zinc-300" : "!text-stone-600"
                }`}
              >
                {currentSlide.subtitle}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={currentSlide.ctaLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                >
                  <span>{currentSlide.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/products?sort=popular"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                    isDarkMode
                      ? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                      : "border-orange-200 bg-white text-stone-800 hover:border-orange-600 hover:text-orange-700"
                  }`}
                >
                  <span>Popular items</span>
                </Link>
              </div>
            </div>

            {/* Slider Prev/Next Controls (visible on hover) */}
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 border border-stone-200 text-stone-700 hover:text-orange-600 flex items-center justify-center shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => setActiveIndex((prev) => (prev + 1) % slides.length)}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 border border-stone-200 text-stone-700 hover:text-orange-600 flex items-center justify-center shadow-sm cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Slider Dots Indicator */}
            <div className="absolute bottom-4 right-5 z-20 flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeIndex
                      ? "w-6 bg-orange-600"
                      : "w-1.5 bg-stone-400/60 hover:bg-stone-600"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Column (Col 4): 2 Clean Balanced Cards */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-5">
            {/* Card 2 (Top-Right): Modern Split Offer Card */}
            <div
              className={`relative overflow-hidden rounded-2xl p-5 border flex items-center justify-between gap-4 ${
                isDarkMode
                  ? "bg-zinc-900 border-zinc-800 text-white"
                  : "bg-gradient-to-br from-[#FFF8F1] via-[#FFF1E0] to-[#FFE7CC] border-orange-200/90 text-stone-900 shadow-[0_2px_12px_-4px_rgba(234,88,12,0.08)]"
              }`}
            >
              {/* Subtle Ambient Glow Accent */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -right-10 -top-10 w-36 h-36 rounded-full blur-2xl ${
                  isDarkMode ? "bg-orange-500/10" : "bg-orange-300/25"
                }`}
              />

              <div className="relative z-10 min-w-0 flex-1">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide mb-2.5 ${
                    isDarkMode
                      ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                      : "bg-white/90 border-orange-200/80 text-orange-700 shadow-[0_1px_2px_rgba(234,88,12,0.06)]"
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{offerBadge}</span>
                </div>

                <h2
                  className={`text-xl sm:text-[21px] font-semibold tracking-tight leading-snug ${
                    isDarkMode ? "!text-white" : "!text-stone-900"
                  }`}
                >
                  {renderTwoToneTitle(offerTitle)}
                </h2>
                <p
                  className={`mt-1 text-xs font-medium ${
                    isDarkMode ? "!text-zinc-400" : "!text-stone-600"
                  }`}
                >
                  Instant discount at checkout
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-3.5">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Copy voucher code"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-xs font-mono font-semibold tracking-wide transition-all cursor-pointer ${
                      copiedCode
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                        : isDarkMode
                        ? "bg-zinc-800 border-zinc-700 text-zinc-100 hover:border-orange-500"
                        : "bg-white border-orange-300 !text-stone-900 shadow-xs hover:border-orange-600 hover:!text-orange-600"
                    }`}
                  >
                    <span>{copiedCode ? "Copied!" : "SHOP2026"}</span>
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3 opacity-65" />}
                  </button>

                  <Link
                    href={offerLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 !text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>{offerCta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Sculpted Layered Discount Ticket */}
              <div className="relative z-10 overflow-hidden w-[98px] py-3.5 px-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-400/50 !text-white shadow-md shadow-orange-600/20 flex flex-col items-center justify-center shrink-0 select-none">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-4 -right-4 w-12 h-12 rounded-full bg-white/15"
                />
                <span className="text-[10px] font-semibold tracking-widest uppercase text-orange-100 leading-none">
                  Up to
                </span>
                <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums my-1 !text-white">
                  60%
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-100 leading-none">
                  OFF
                </span>
              </div>
            </div>

            {/* Card 3 (Bottom-Right): Featured / Flash Deal Card */}
            <div
              className={`flex-1 rounded-2xl overflow-hidden p-5 flex flex-col justify-between gap-3 border ${
                isDarkMode
                  ? "bg-zinc-900 border-zinc-800"
                  : "bg-white border-orange-200/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className={`text-base font-semibold leading-tight ${isDarkMode ? "!text-white" : "!text-stone-900"}`}>
                  {sideDealTitle}
                </h3>
                <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-md">
                  {sideDealBadge}
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                <img
                  src={sideDealImage}
                  alt={sideDealTitle}
                  className="w-full h-full object-cover object-center hover:scale-103 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              <Link
                href="/products"
                className={`w-full py-2 px-4 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
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
