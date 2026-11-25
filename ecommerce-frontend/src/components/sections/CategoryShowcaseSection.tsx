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
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: Shirt },
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: Smartphone },
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: Home },
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: Sparkles },
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: ShoppingBag },
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: Activity },
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: Gamepad2 },
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: Utensils },
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: Pill },
  { bg: "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-600 border border-slate-200/80 dark:border-zinc-800 group-hover:border-sky-300", icon: Layers },
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
    <section className="py-5 sm:py-7">
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            {badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                {badge}
              </span>
            )}
            <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDarkMode ? "!text-white" : "!text-slate-900"}`}>
              {title || "Shop by Category"}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-sky-600 dark:text-zinc-300 dark:hover:text-sky-400 transition-colors"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Department / Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {displayCats.map((cat, idx) => {
            const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
            const Icon = color.icon;
            return (
              <Link
                key={cat.id || idx}
                href={`/products?categoryId=${cat.id || ""}`}
                className={`group p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center justify-between border transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md ${
                  isDarkMode
                    ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white"
                    : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-105" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold line-clamp-1 group-hover:text-sky-600 transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Explore</span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
