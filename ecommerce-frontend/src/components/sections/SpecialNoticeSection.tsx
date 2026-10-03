"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Bell, Sparkles, Tag } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface SpecialNoticeSectionProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function SpecialNoticeSection({ section, isDarkMode = false }: SpecialNoticeSectionProps) {
  const {
    title = "⚡ Exclusive Weekend Mega Flash Sale: Up to 60% OFF Across All Departments!",
    subtitle = "Use voucher code BLUE2026 at checkout for extra 15% discount on prepaid orders.",
    badge = "ANNOUNCEMENT",
    settings = {},
  } = section;

  return (
    <section className="py-4 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-7xl mx-auto rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border transition-all ${
        settings.themeStyle === "amber"
          ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
          : settings.themeStyle === "emerald"
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
          : settings.themeStyle === "rose"
          ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
          : "bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-purple-500/15 border-sky-500/30 text-slate-900 dark:text-white"
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {badge && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500 text-white">
                  {badge}
                </span>
              )}
              <h3 className="text-xs sm:text-sm font-bold">{title}</h3>
            </div>
            {subtitle && (
              <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {settings.ctaText && (
          <Link
            href={settings.ctaLink || "/products"}
            className="shrink-0 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <span>{settings.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}
