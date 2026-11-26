"use client";

import React, { useState } from "react";
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

function renderBrandLogo(brand: BrandItem, isDarkMode?: boolean) {
  const key = brand.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  switch (key) {
    case "apple":
      return (
        <span className={`inline-flex items-center gap-2 ${isDarkMode ? "text-zinc-100" : "text-[#1D1D1F]"}`}>
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current shrink-0" aria-hidden="true">
            <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
          </svg>
          <span className="text-xl font-semibold tracking-tight">Apple</span>
        </span>
      );

    case "samsung":
      return (
        <svg viewBox="0 0 144 38" className="w-32 h-9 shrink-0" aria-hidden="true">
          <ellipse
            cx="72"
            cy="19"
            rx="66"
            ry="15"
            transform="rotate(-7 72 19)"
            fill={isDarkMode ? "#2563EB" : "#1428A0"}
          />
          <text
            x="72"
            y="24"
            textAnchor="middle"
            fontSize="14.5"
            fontWeight="900"
            letterSpacing="2"
            fill="#FFFFFF"
            fontFamily="sans-serif"
          >
            SAMSUNG
          </text>
        </svg>
      );

    case "nike":
      return (
        <span className={`inline-flex items-center gap-1.5 ${isDarkMode ? "text-white" : "text-[#111111]"}`}>
          <svg viewBox="0 0 64 24" className="w-11 h-5 fill-current shrink-0" aria-hidden="true">
            <path d="M18.4 20.6C12.1 22.8 6.4 21.5 3.5 17.5.9 13.8 1.5 7.9 6 2.4c-1.5 3.7-1.6 7.5.5 9.8 2.4 2.6 6.8 2.6 12.9.8L62 1.2 18.4 20.6z" />
          </svg>
          <span className="text-xl font-black italic tracking-tighter">NIKE</span>
        </span>
      );

    case "adidas":
      return (
        <span className={`inline-flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#000000]"}`}>
          <svg viewBox="0 0 36 24" className="w-8 h-6 fill-current shrink-0" aria-hidden="true">
            <path d="M7.5 22L2 14.5l4.4-2.5L13.2 22H7.5zm10.1 0L9.7 9.8l4.4-2.5L23.4 22h-5.8zm10.2 0L17.4 5l4.4-2.5L33.5 22h-5.7z" />
          </svg>
          <span className="text-xl font-extrabold tracking-tight lowercase">adidas</span>
        </span>
      );

    case "loreal":
      return (
        <span className={`inline-flex flex-col items-center leading-none ${isDarkMode ? "text-zinc-100" : "text-[#1C1917]"}`}>
          <span className="text-lg sm:text-xl font-serif font-bold tracking-[0.18em] uppercase">
            L&apos;ORÉAL
          </span>
          <span className="text-[9px] font-semibold tracking-[0.38em] text-[#B45309] mt-0.5">
            PARIS
          </span>
        </span>
      );

    case "pg":
      return (
        <span className={`inline-flex items-center gap-1.5 ${isDarkMode ? "text-sky-400" : "text-[#003DA5]"}`}>
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <text x="12" y="15.5" textAnchor="middle" fontSize="9.5" fontWeight="900" fontFamily="serif" fill="currentColor">
              P&amp;G
            </text>
          </svg>
          <span className="text-xl font-black tracking-tight font-serif">P&amp;G</span>
        </span>
      );

    case "cocacola":
      return (
        <span className={`inline-flex flex-col items-center leading-none ${isDarkMode ? "text-rose-500" : "text-[#F40009]"}`}>
          <span className="text-xl sm:text-2xl font-serif italic font-bold tracking-tight">
            Coca-Cola
          </span>
          <svg viewBox="0 0 100 10" className="w-24 h-2 stroke-current fill-none -mt-0.5" aria-hidden="true">
            <path d="M4 6 Q 35 1, 96 5" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </span>
      );

    case "sony":
      return (
        <span className={`text-xl sm:text-2xl font-serif font-black tracking-[0.22em] uppercase ${isDarkMode ? "text-white" : "text-[#111111]"}`}>
          SONY
        </span>
      );

    default: {
      const raw = (brand.logo || "").trim();
      const label = !raw || raw === "\uF8FF" || raw === "" ? brand.name : raw;
      return (
        <span className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDarkMode ? "text-zinc-200" : "text-stone-800"}`}>
          {label}
        </span>
      );
    }
  }
}

export default function BrandsCarouselSection({ section, isDarkMode }: Props) {
  const { title, subtitle, settings } = section;
  const [isPaused, setIsPaused] = useState(false);

  const brands: BrandItem[] = settings?.brands || [
    { name: "Apple" },
    { name: "Samsung" },
    { name: "Nike" },
    { name: "Adidas" },
    { name: "L'Oreal" },
    { name: "P&G" },
    { name: "Coca-Cola" },
    { name: "Sony" },
  ];

  const repeatFactor = Math.max(1, Math.ceil(8 / brands.length));
  const halfTrack = Array.from({ length: repeatFactor }, () => brands).flat();
  const loopBrands = [...halfTrack, ...halfTrack];
  const durationSeconds = Math.max(26, halfTrack.length * 3.8);

  const heading = (title || "Shop by Top Brands").trim();
  const words = heading.split(/\s+/);
  const headingHead = words.length > 1 ? words.slice(0, -1).join(" ") : "";
  const headingTail = words.length > 1 ? words[words.length - 1] : heading;

  return (
    <section className={`py-8 sm:py-10 ${isDarkMode ? "bg-zinc-950" : "bg-[#FAF8F5]"}`}>
      <style>{`
        @keyframes brandInfiniteScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

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

        {/* Floating Card-Free Auto-Infinite Brand Logo Slider */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative overflow-hidden py-3"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
          }}
        >
          <div
            className="flex w-max items-center gap-12 sm:gap-16 pr-12 sm:pr-16"
            style={{
              animationName: "brandInfiniteScroll",
              animationDuration: `${durationSeconds}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationPlayState: isPaused ? "paused" : "running",
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
          >
            {loopBrands.map((b, idx) => (
              <Link
                key={`${b.name}-${idx}`}
                href={`/products?search=${encodeURIComponent(b.name)}`}
                aria-label={b.name}
                className="shrink-0 inline-flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-105 transition-all select-none whitespace-nowrap"
              >
                {renderBrandLogo(b, isDarkMode)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
