"use client";

import React from "react";
import { Truck, ShieldCheck, RotateCcw, Headphones, CreditCard, Sparkles } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface Props {
  section: SectionItem;
  isDarkMode?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  CreditCard,
};

interface FeatureBadgeItem {
  icon: string;
  title: string;
  desc: string;
}

export default function FeatureBadgesSection({ section, isDarkMode }: Props) {
  const items: FeatureBadgeItem[] = section.settings?.items || [
    { icon: "Truck", title: "Free Shipping", desc: "On orders over $50 / ৳500" },
    { icon: "ShieldCheck", title: "Secure Payment", desc: "100% secure checkout" },
    { icon: "RotateCcw", title: "Easy Returns", desc: "Within 7 days return policy" },
    { icon: "Headphones", title: "24/7 Support", desc: "Dedicated support team" },
  ];

  return (
    <section
      className={`py-6 sm:py-8 border-y transition-colors ${
        isDarkMode
          ? "bg-zinc-950 border-zinc-800"
          : "bg-[#FFF7ED] border-orange-200/70"
      }`}
    >
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {items.map((it, idx) => {
            const Icon = ICON_MAP[it.icon] || Sparkles;
            return (
              <div
                key={`${it.title}-${idx}`}
                className={`rounded-2xl px-5 py-4 sm:py-5 border flex items-center gap-4 transition-colors ${
                  isDarkMode
                    ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    : "bg-white border-orange-200/75 shadow-[0_2px_12px_-4px_rgba(234,88,12,0.07)] hover:border-orange-300"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 !text-white shadow-sm shadow-orange-600/20 ring-4 flex items-center justify-center shrink-0 ${
                    isDarkMode ? "ring-orange-500/10" : "ring-orange-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4
                    className={`text-sm sm:text-[15px] font-semibold tracking-tight leading-snug ${
                      isDarkMode ? "!text-zinc-300" : "!text-stone-700"
                    }`}
                  >
                    {it.title}
                  </h4>
                  <p
                    className={`mt-0.5 text-xs font-medium leading-relaxed ${
                      isDarkMode ? "!text-zinc-400" : "!text-stone-600"
                    }`}
                  >
                    {it.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
