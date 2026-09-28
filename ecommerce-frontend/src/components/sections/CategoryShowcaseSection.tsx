"use client";

import React from "react";
import Link from "next/link";
import {
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  ShoppingBag,
  Activity,
  Gamepad2,
  MoreHorizontal,
  ChevronRight,
  Layers,
  Utensils,
  Pill,
} from "lucide-react";
import { CategoryItem } from "@/lib/api";
import { SectionItem } from "@/lib/builderTypes";

interface Props {
  section: SectionItem;
  categories: CategoryItem[];
  isDarkMode?: boolean;
}

const CATEGORY_COLORS = [
  { bg: "bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-300", icon: Shirt },
  { bg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300", icon: Smartphone },
  { bg: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300", icon: Home },
  { bg: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300", icon: Sparkles },
  { bg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300", icon: ShoppingBag },
  { bg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-300", icon: Activity },
  { bg: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300", icon: Gamepad2 },
  { bg: "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300", icon: Utensils },
  { bg: "bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300", icon: Pill },
  { bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", icon: Layers },
];

export default function CategoryShowcaseSection({ section, categories, isDarkMode }: Props) {
  const { title, subtitle, badge, settings } = section;
  const style = settings?.style || "circles"; // 'circles' | 'cards' | 'pills'
  const limit = settings?.limit || 8;

  // Fallback demo categories if DB has none yet
  const displayCats =
    categories && categories.length > 0
      ? categories.slice(0, limit)
      : [
          { id: "1", name: "Fashion", code: "fashion" },
          { id: "2", name: "Electronics", code: "electronics" },
          { id: "3", name: "Home & Living", code: "home" },
          { id: "4", name: "Beauty & Care", code: "beauty" },
          { id: "5", name: "Groceries", code: "grocery" },
          { id: "6", name: "Sports & Outdoor", code: "sports" },
          { id: "7", name: "Toys & Baby", code: "toys" },
          { id: "8", name: "Pharmacy", code: "pharmacy" },
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
              {title || "Shop by Category"}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">{subtitle}</p>
            )}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Circular ShopEase Style (Screenshot 1 & 5) */}
        {style === "circles" && (
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6 text-center">
            {displayCats.map((cat, idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const Icon = color.icon;
              return (
                <Link
                  key={cat.id || idx}
                  href={`/products?categoryId=${cat.id || ""}`}
                  className="group flex flex-col items-center gap-2.5 transition-transform hover:-translate-y-1.5 duration-300"
                >
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 ${color.bg}`}
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-110 duration-300" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 hidden sm:block">Explore</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Card Style (Screenshot 2 & 3) */}
        {style === "cards" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {displayCats.map((cat, idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const Icon = color.icon;
              return (
                <Link
                  key={cat.id || idx}
                  href={`/products?categoryId=${cat.id || ""}`}
                  className={`group p-4 rounded-2xl flex flex-col items-center text-center justify-center border shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${
                    isDarkMode
                      ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                      : "bg-white border-slate-200/80 hover:border-sky-300"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${color.bg}`}>
                    <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-sky-600 line-clamp-1">
                    {cat.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        )}

        {/* Rounded Pills Style */}
        {style === "pills" && (
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            {displayCats.map((cat, idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const Icon = color.icon;
              return (
                <Link
                  key={cat.id || idx}
                  href={`/products?categoryId=${cat.id || ""}`}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border transition-all duration-200 hover:scale-105 ${
                    isDarkMode
                      ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700"
                      : "bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-sky-50/50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
