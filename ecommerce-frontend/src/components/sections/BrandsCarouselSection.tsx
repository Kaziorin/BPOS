"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface Props {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function BrandsCarouselSection({ section, isDarkMode }: Props) {
  const { title, subtitle, settings } = section;
  const brands = settings?.brands || [
    { name: "Apple", logo: "" },
    { name: "Samsung", logo: "SAMSUNG" },
    { name: "Nike", logo: "NIKE" },
    { name: "Adidas", logo: "adidas" },
    { name: "L'Oreal", logo: "L'ORÉAL" },
    { name: "P&G", logo: "P&G" },
    { name: "Coca-Cola", logo: "Coca-Cola" },
    { name: "Sony", logo: "SONY" },
  ];

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {title || "Shop by Top Brands"}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
          >
            <span>View All Brands</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Brands Carousel / Bar */}
        <div
          className={`grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3 p-4 rounded-2xl border shadow-xs ${
            isDarkMode
              ? "bg-zinc-900 border-zinc-800 text-white"
              : "bg-white border-slate-200/80 text-slate-800"
          }`}
        >
          {brands.map((b: any, idx: number) => (
            <Link
              key={idx}
              href={`/products?search=${encodeURIComponent(b.name)}`}
              className={`p-3 rounded-xl flex items-center justify-center font-black tracking-tight text-sm sm:text-base border transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? "bg-zinc-800/80 border-zinc-700/60 hover:border-zinc-500 text-zinc-200"
                  : "bg-slate-50 border-slate-100 hover:border-sky-300 hover:bg-sky-50/40 text-slate-700"
              }`}
            >
              <span className="truncate">{b.logo || b.name}</span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
