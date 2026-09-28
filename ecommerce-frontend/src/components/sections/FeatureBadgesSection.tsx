"use client";

import React from "react";
import { Truck, ShieldCheck, RotateCcw, Headphones, CreditCard, Sparkles } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface Props {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function FeatureBadgesSection({ section, isDarkMode }: Props) {
  const items = section.settings?.items || [
    { icon: "Truck", title: "Free Shipping", desc: "On orders over $50 / ৳500" },
    { icon: "ShieldCheck", title: "Secure Payment", desc: "100% secure checkout" },
    { icon: "RotateCcw", title: "Easy Returns", desc: "Within 7 days return policy" },
    { icon: "Headphones", title: "24/7 Support", desc: "Dedicated customer care" },
  ];

  const getIcon = (name: string) => {
    switch (name) {
      case "Truck":
        return <Truck className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case "RotateCcw":
        return <RotateCcw className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case "Headphones":
        return <Headphones className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case "CreditCard":
        return <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
    }
  };

  return (
    <section className="py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl border shadow-xs transition-colors ${
            isDarkMode
              ? "bg-zinc-900/60 border-zinc-800 text-white"
              : "bg-white border-slate-200/80 text-slate-800"
          }`}
        >
          {items.map((it: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3.5 p-2 rounded-xl">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isDarkMode ? "bg-zinc-800" : "bg-slate-100"
                }`}
              >
                {getIcon(it.icon)}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold tracking-tight">{it.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
