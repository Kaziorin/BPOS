"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Coffee,
  Croissant,
  CakeSlice,
  Cookie,
  Milk,
  Wheat,
  Package,
  Shirt,
  Smartphone,
  Home,
  Sparkles,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import { CategoryItem } from "@/lib/api";
import { SectionItem } from "@/lib/builderTypes";

interface Props {
  section: SectionItem;
  categories: CategoryItem[];
  isDarkMode?: boolean;
}

const CATEGORY_ICON_RULES: Array<{ match: RegExp; icon: React.ComponentType<{ className?: string }> }> = [
  { match: /all|everything/i, icon: LayoutGrid },
  { match: /beverage|drink|coffee|tea|juice|soda/i, icon: Coffee },
  { match: /bread|bakery|bun|croissant/i, icon: Croissant },
  { match: /cake|pastry|dessert|sweet/i, icon: CakeSlice },
  { match: /cookie|biscuit|cracker|snack/i, icon: Cookie },
  { match: /dairy|egg|milk|cheese|butter|yogurt/i, icon: Milk },
  { match: /flour|raw|grain|wheat|rice|grocery/i, icon: Wheat },
  { match: /packag|box|wrap|bag|container/i, icon: Package },
  { match: /food|meal|kitchen|utensil|restaurant/i, icon: Utensils },
  { match: /fashion|cloth|wear|apparel|shirt/i, icon: Shirt },
  { match: /electronic|tech|phone|gadget|audio/i, icon: Smartphone },
  { match: /home|living|decor|furniture/i, icon: Home },
  { match: /beauty|care|skin|cosmetic/i, icon: Sparkles },
];

const CAPSULE_THEMES = [
  { pill: "bg-[#FFF3E6] border-orange-200 hover:bg-[#FFE8D1] hover:border-orange-300", icon: "bg-orange-600" },
  { pill: "bg-[#FEF7E6] border-amber-200/90 hover:bg-amber-100/80 hover:border-amber-300", icon: "bg-amber-500" },
  { pill: "bg-[#FFF1F3] border-rose-200/80 hover:bg-rose-100/75 hover:border-rose-300", icon: "bg-rose-500" },
  { pill: "bg-[#ECFDF5] border-emerald-200/80 hover:bg-emerald-100/70 hover:border-emerald-300", icon: "bg-emerald-600" },
  { pill: "bg-[#F0F9FF] border-sky-200/80 hover:bg-sky-100/75 hover:border-sky-300", icon: "bg-sky-600" },
  { pill: "bg-[#F5F3FF] border-violet-200/80 hover:bg-violet-100/75 hover:border-violet-300", icon: "bg-violet-500" },
  { pill: "bg-[#F7F3EE] border-stone-300/80 hover:bg-stone-200/70 hover:border-stone-400", icon: "bg-stone-800" },
  { pill: "bg-[#FFF2EE] border-orange-300/75 hover:bg-orange-100/80 hover:border-orange-400", icon: "bg-[#EA580C]" },
];

function getCategoryIcon(name: string) {
  const rule = CATEGORY_ICON_RULES.find((r) => r.match.test(name));
  return rule ? rule.icon : ShoppingBag;
}

export default function CategoryShowcaseSection({ section, categories, isDarkMode }: Props) {
  const { title, settings } = section;
  const limit = settings?.limit || 24;

  const baseCats =
    categories && categories.length > 0
      ? categories.slice(0, limit)
      : [
          { id: "1", name: "All Products", code: "all" },
          { id: "2", name: "Beverages", code: "beverages" },
          { id: "3", name: "Bread & Bakery", code: "bakery" },
          { id: "4", name: "Cake & Pastry", code: "cake" },
          { id: "5", name: "Cookies & Biscuits", code: "cookies" },
          { id: "6", name: "Dairy & Egg", code: "dairy" },
          { id: "7", name: "Flour & Raw Material", code: "flour" },
          { id: "8", name: "Packaging", code: "packaging" },
        ];

  const [isPaused, setIsPaused] = useState(false);

  // Ensure half-track fills wide desktops seamlessly before doubling for -50% loop
  const repeatFactor = Math.max(1, Math.ceil(8 / baseCats.length));
  const halfTrack = Array.from({ length: repeatFactor }, () => baseCats).flat();
  const loopCats = [...halfTrack, ...halfTrack];
  const durationSeconds = Math.max(28, halfTrack.length * 4);

  const heading = (title || "Shop by Category").trim();
  const words = heading.split(/\s+/);
  const headingHead = words.length > 1 ? words.slice(0, -1).join(" ") : "";
  const headingTail = words.length > 1 ? words[words.length - 1] : heading;

  return (
    <section
      className={`py-8 sm:py-10 border-b transition-colors ${
        isDarkMode
          ? "bg-zinc-950 border-zinc-800"
          : "bg-white border-orange-100"
      }`}
    >
      <style>{`
        @keyframes categoryInfiniteScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        {/* Clean Section Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
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
        </div>

        {/* Auto-Infinite Category Slider (pauses reliably on hover) */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 2.5%, black 97.5%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 2.5%, black 97.5%, transparent)",
          }}
        >
          <div
            className="flex w-max gap-3 sm:gap-3.5 pr-3 sm:pr-3.5"
            style={{
              animationName: "categoryInfiniteScroll",
              animationDuration: `${durationSeconds}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationPlayState: isPaused ? "paused" : "running",
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
          >
            {loopCats.map((cat, idx) => {
              const Icon = getCategoryIcon(cat.name);
              const theme = CAPSULE_THEMES[(idx % halfTrack.length) % CAPSULE_THEMES.length];
              return (
                <Link
                  key={`${cat.id || cat.name}-${idx}`}
                  href={`/products?categoryId=${cat.id || ""}`}
                  className={`group shrink-0 inline-flex items-center gap-3 pl-2 pr-5 py-2 rounded-full border transition-colors whitespace-nowrap ${
                    isDarkMode
                      ? "bg-zinc-900 border-zinc-800 hover:border-orange-500/60"
                      : theme.pill
                  }`}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full !text-white flex items-center justify-center shrink-0 shadow-xs ring-2 transition-transform duration-200 group-hover:scale-105 ${
                      isDarkMode ? "ring-zinc-800" : "ring-white"
                    } ${theme.icon}`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-semibold tracking-tight transition-colors whitespace-nowrap ${
                      isDarkMode ? "!text-zinc-200 group-hover:!text-white" : "!text-stone-800"
                    }`}
                  >
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
