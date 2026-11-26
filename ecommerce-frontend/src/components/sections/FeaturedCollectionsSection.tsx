"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { ProductItem } from "@/lib/api";
import { SectionItem } from "@/lib/builderTypes";
import ProductGridSection from "@/components/sections/ProductGridSection";

interface Props {
  section: SectionItem;
  products?: ProductItem[];
  isDarkMode?: boolean;
}

interface CollectionCard {
  title: string;
  subtitle?: string;
  cta?: string;
  link?: string;
  image: string;
}

export default function FeaturedCollectionsSection({ section, products = [], isDarkMode }: Props) {
  if (products.length > 0) {
    return (
      <ProductGridSection
        section={{
          ...section,
          settings: {
            ...section.settings,
            limit: section.settings?.limit || 6,
            columns: 6,
          },
        }}
        products={products}
        isDarkMode={isDarkMode}
        hideCategoryTabs
      />
    );
  }

  const { title, subtitle, settings } = section;
  const layout = settings?.layout || "bento_3";
  const cards: CollectionCard[] = settings?.cards || [
    {
      title: "Men's Fashion",
      subtitle: "Modern Looks for Modern Men",
      cta: "Shop Now",
      link: "/products?category=Fashion",
      image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80",
    },
    {
      title: "Electronics",
      subtitle: "Latest Tech for a Smarter Life",
      cta: "Shop Now",
      link: "/products?category=Electronics",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop&q=80",
    },
    {
      title: "Home & Living",
      subtitle: "Stylish Homes, Happier You",
      cta: "Shop Now",
      link: "/products?category=Home",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
    },
  ];

  const heading = (title || "Featured Collections").trim();
  const words = heading.split(/\s+/);
  const headingHead = words.length > 1 ? words.slice(0, -1).join(" ") : "";
  const headingTail = words.length > 1 ? words[words.length - 1] : heading;

  const isBentoThree = layout !== "grid_4" && cards.length === 3;

  const renderCard = (c: CollectionCard, idx: number, featured = false) => (
    <Link
      key={`${c.title}-${idx}`}
      href={c.link || "/products"}
      className={`group relative rounded-2xl overflow-hidden flex flex-col justify-between p-5 sm:p-6 border transition-colors ${
        featured ? "min-h-[260px] lg:min-h-[360px]" : "min-h-[172px] flex-1"
      } ${
        isDarkMode
          ? "border-zinc-800 bg-zinc-900"
          : "border-orange-200/60 bg-stone-900 shadow-[0_4px_16px_-6px_rgba(28,25,23,0.12)]"
      }`}
    >
      {/* Full-Bleed Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url('${c.image}')` }}
      />

      {/* Strong Bottom Scrim for Sharp Text Legibility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-black/10"
      />

      {/* Top-Right Subtle Corner Arrow Badge */}
      <div className="relative z-10 flex justify-end">
        <span className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/25 !text-white flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-600 transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>

      {/* Bottom Copy & CTA Aligned Over Dark Gradient */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-3 pt-6">
        <div className="min-w-0">
          <h3
            className={`font-semibold tracking-tight leading-snug !text-white ${
              featured ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
            }`}
          >
            {c.title}
          </h3>
          {c.subtitle && (
            <p className="text-xs sm:text-[13px] !text-stone-200 mt-0.5 line-clamp-1">
              {c.subtitle}
            </p>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white group-hover:bg-orange-600 !text-stone-900 group-hover:!text-white text-xs font-semibold shadow-sm transition-colors shrink-0">
          <span>{c.cta || "Shop Now"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );

  return (
    <section className={`py-8 sm:py-10 ${isDarkMode ? "bg-zinc-950" : "bg-[#FAF8F5]"}`}>
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        {/* Clean Section Header */}
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2
              className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                isDarkMode ? "!text-white" : "!text-stone-900"
              }`}
            >
              {headingHead ? (
                <>
                  {headingHead}{" "}
                  <span className="text-orange-600">{headingTail}</span>
                </>
              ) : (
                headingTail
              )}
            </h2>
            {subtitle && (
              <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "!text-zinc-400" : "!text-stone-600"}`}>
                {subtitle}
              </p>
            )}
          </div>

          <Link
            href="/products"
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-700 !text-zinc-200 hover:border-orange-500 hover:!text-orange-400"
                : "bg-[#FFF1E0] border-orange-200/80 !text-orange-700 hover:bg-orange-600 hover:!text-white hover:border-orange-600"
            }`}
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Modern Asymmetric Bento Layout (3 items) or Balanced Grid */}
        {isBentoThree ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
            <div className="lg:col-span-6 flex">
              <div className="w-full flex flex-col">
                {renderCard(cards[0], 0, true)}
              </div>
            </div>
            <div className="lg:col-span-6 flex flex-col gap-4 lg:gap-5">
              {cards.slice(1).map((c, idx) => renderCard(c, idx + 1, false))}
            </div>
          </div>
        ) : (
          <div
            className={`grid gap-4 lg:gap-5 ${
              layout === "grid_4" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
            }`}
          >
            {cards.map((c, idx) => renderCard(c, idx, true))}
          </div>
        )}
      </div>
    </section>
  );
}
