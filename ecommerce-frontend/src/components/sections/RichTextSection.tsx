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
    <section className={`py-12 px-4 sm:px-6 lg:px-8 transition-colors ${isDarkMode ? "bg-zinc-950 text-white" : "bg-white text-slate-900"}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        
        {/* Left image / media */}
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800">
            <img
              src={settings.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80"}
              alt={title}
              className="w-full h-80 sm:h-96 object-cover"
            />
          </div>
          {settings.statsBadge && (
            <div className="absolute -bottom-4 -right-4 sm:bottom-6 sm:right-6 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-800">
              <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">
                {settings.statsBadge.value || "50,000+"}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                {settings.statsBadge.label || "Delivered Orders"}
              </div>
            </div>
          )}
        </div>

        {/* Right content */}
        <div className="space-y-6">
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{badge}</span>
            </span>
          )}

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {title}
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-slate-600"}`}>
            {subtitle}
          </p>

          <ul className="space-y-2.5">
            {points.map((pt: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className={isDarkMode ? "text-zinc-200" : "text-slate-700"}>{pt}</span>
              </li>
            ))}
          </ul>

          {settings.ctaText && (
            <div className="pt-2">
              <Link
                href={settings.ctaLink || "/products"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-600/20 transition-transform active:scale-95"
              >
                <span>{settings.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
