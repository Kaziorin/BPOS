"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface Props {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function FeaturedCollectionsSection({ section, isDarkMode }: Props) {
  const { title, subtitle, badge, settings } = section;
  const layout = settings?.layout || "bento_3";
  const cards = settings?.cards || [
    {
      title: "Men's Fashion",
      subtitle: "Modern Looks for Modern Men",
      cta: "Shop Now",
      link: "/products?category=Fashion",
      image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80",
      bg: "from-slate-900 to-slate-800 text-white",
    },
    {
      title: "Electronics",
      subtitle: "Latest Tech for a Smarter Life",
      cta: "Shop Now",
      link: "/products?category=Electronics",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80",
      bg: "from-blue-900 to-indigo-900 text-white",
    },
    {
      title: "Home & Living",
      subtitle: "Stylish Homes, Happier You",
      cta: "Shop Now",
      link: "/products?category=Home",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
      bg: "from-amber-900/90 to-stone-900 text-white",
    },
  ];

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            {badge && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block mb-1">
                {badge}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {title || "Featured Collections"}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">{subtitle}</p>
            )}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Bento / Grid */}
        <div
          className={`grid gap-4 sm:gap-5 ${
            layout === "grid_4" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
          }`}
        >
          {cards.map((c: any, idx: number) => (
            <Link
              key={idx}
              href={c.link || "/products"}
              className="group relative rounded-3xl overflow-hidden p-6 sm:p-7 flex flex-col justify-between shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5"
              style={{ minHeight: "220px" }}
            >
              {/* Background image & gradient overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${c.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 group-hover:from-black/90 transition-colors" />

              {/* Top info */}
              <div className="relative z-10">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full mb-2">
                  Collection
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-200 transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">{c.subtitle}</p>
              </div>

              {/* Bottom CTA */}
              <div className="relative z-10 pt-4">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  <span>{c.cta || "Shop Now"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
