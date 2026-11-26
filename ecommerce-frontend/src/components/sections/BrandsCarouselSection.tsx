"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface Props {
  section: SectionItem;
  isDarkMode?: boolean;
}

interface BrandItem {
  name: string;
  logo?: string;
}

function resolveBrandWordmark(brand: BrandItem): string {
  const raw = (brand.logo || "").trim();
  if (!raw || raw === "\uF8FF" || raw === "") {
    return brand.name.toUpperCase();
  }
  return raw;
}

export default function BrandsCarouselSection({ section, isDarkMode }: Props) {
  const { title, subtitle, settings } = section;
  const brands: BrandItem[] = settings?.brands || [
    { name: "Apple", logo: "APPLE" },
    { name: "Samsung", logo: "SAMSUNG" },
    { name: "Nike", logo: "NIKE" },
    { name: "Adidas", logo: "adidas" },
    { name: "L'Oreal", logo: "L'ORÉAL" },
    { name: "P&G", logo: "P&G" },
    { name: "Coca-Cola", logo: "Coca-Cola" },
    { name: "Sony", logo: "SONY" },
  ];

  const heading = (title || "Shop by Top Brands").trim();
  const words = heading.split(/\s+/);
  const headingHead = words.length > 1 ? words.slice(0, -1).join(" ") : "";
  const headingTail = words.length > 1 ? words[words.length - 1] : heading;

  return (
    <section className={`py-8 sm:py-10 ${isDarkMode ? "bg-zinc-950" : "bg-[#FAF8F5]"}`}>
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        {/* Clean Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
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
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 self-start sm:self-auto ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-700 !text-zinc-200 hover:border-orange-500 hover:!text-orange-400"
                : "bg-[#FFF1E0] border-orange-200/80 !text-orange-700 hover:bg-orange-600 hover:!text-white hover:border-orange-600"
            }`}
          >
            <span>View All Brands</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Modern Individual Brand Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-3.5">
          {brands.map((b, idx) => {
            const wordmark = resolveBrandWordmark(b);
            const initial = b.name.trim().charAt(0).toUpperCase() || "B";
            return (
              <Link
                key={`${b.name}-${idx}`}
                href={`/products?search=${encodeURIComponent(b.name)}`}
                className={`group rounded-2xl p-4 sm:p-5 border flex flex-col items-center justify-center gap-2.5 text-center transition-colors ${
                  isDarkMode
                    ? "bg-zinc-900 border-zinc-800 hover:border-orange-500/60"
                    : "bg-white border-orange-200/75 shadow-[0_2px_10px_-4px_rgba(28,25,23,0.05)] hover:border-orange-400 hover:bg-[#FFF9F2]"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold transition-colors ${
                    isDarkMode
                      ? "bg-zinc-800 border-zinc-700 !text-orange-400 group-hover:bg-orange-600 group-hover:!text-white group-hover:border-orange-600"
                      : "bg-[#FFF1E0] border-orange-200/80 !text-orange-600 group-hover:bg-orange-600 group-hover:!text-white group-hover:border-orange-600"
                  }`}
                >
                  {initial}
                </span>

                <span
                  className={`text-sm font-bold tracking-tight truncate max-w-full transition-colors ${
                    isDarkMode
                      ? "!text-zinc-200 group-hover:!text-white"
                      : "!text-stone-800 group-hover:!text-orange-700"
                  }`}
                >
                  {wordmark}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
