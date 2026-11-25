"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface RichTextSectionProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function RichTextSection({ section, isDarkMode = false }: RichTextSectionProps) {
  const {
    title = "Crafting Exceptional Quality Since 2018",
    subtitle = "Our mission is to empower everyday living through ethical sourcing, handcrafted excellence, and customer-first support.",
    badge = "OUR STORY & HERITAGE",
    settings = {},
  } = section;

  const points = settings.bulletPoints || [
    "100% Sustainable & ethically sourced materials",
    "Hand-inspected for highest quality control standards",
    "Direct-to-consumer transparent pricing with zero middlemen",
  ];

  return (
    <section className={`py-10 sm:py-14 transition-colors ${isDarkMode ? "bg-zinc-950 text-white" : "bg-white text-slate-900"}`}>
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        
        {/* Left image / media */}
        <div className="relative">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs border border-slate-200/80 dark:border-zinc-800">
            <img
              src={settings.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80"}
              alt={title}
              className="w-full h-72 sm:h-96 object-cover"
              loading="lazy"
            />
          </div>
          {settings.statsBadge && (
            <div className="absolute -bottom-3 -right-3 sm:bottom-6 sm:right-6 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white p-3.5 sm:p-4 rounded-xl shadow-md border border-slate-100 dark:border-zinc-800">
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                {settings.statsBadge.value || "50,000+"}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                {settings.statsBadge.label || "Delivered Orders"}
              </div>
            </div>
          )}
        </div>

        {/* Right content */}
        <div className="space-y-5">
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-semibold tracking-wide uppercase bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              <span>{badge}</span>
            </span>
          )}

          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${isDarkMode ? "!text-white" : "!text-slate-900"}`}>
            {title}
          </h2>

          <p className={`text-xs sm:text-sm lg:text-base leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-slate-600"}`}>
            {subtitle}
          </p>

          <ul className="space-y-2 pt-1">
            {points.map((pt: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className={isDarkMode ? "text-zinc-200" : "text-slate-700"}>{pt}</span>
              </li>
            ))}
          </ul>

          {settings.ctaText && (
            <div className="pt-2">
              <Link
                href={settings.ctaLink || "/products"}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-semibold text-xs shadow-2xs transition-colors"
              >
                <span>{settings.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
