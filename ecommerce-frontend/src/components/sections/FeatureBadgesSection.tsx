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
    { icon: "Truck", title: "Free Shipping", desc: "On orders over ৳500" },
    { icon: "ShieldCheck", title: "Secure Payment", desc: "100% verified checkout" },
    { icon: "RotateCcw", title: "Easy Returns", desc: "7-day return guarantee" },
    { icon: "Headphones", title: "Dedicated Support", desc: "Live customer assistance" },
  ];

  const getIcon = (name: string) => {
    switch (name) {
      case "Truck":
        return <Truck className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "RotateCcw":
        return <RotateCcw className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "Headphones":
        return <Headphones className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "CreditCard":
        return <CreditCard className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
    }
  };

  return (
    <section className="py-2 sm:py-3">
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-5 rounded-2xl border shadow-2xs transition-colors ${
            isDarkMode
              ? "bg-zinc-900 border-zinc-800 text-white"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          {items.map((it: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3.5 p-1.5">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                  isDarkMode
                    ? "bg-zinc-800 border-zinc-700 text-sky-400"
                    : "bg-slate-50 border-slate-100 text-sky-600"
                }`}
              >
                {getIcon(it.icon)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold tracking-tight truncate">
                  {it.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                  {it.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
