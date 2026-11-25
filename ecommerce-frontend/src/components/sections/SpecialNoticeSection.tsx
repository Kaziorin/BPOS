"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface SpecialNoticeSectionProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function SpecialNoticeSection({ section, isDarkMode = false }: SpecialNoticeSectionProps) {
  const {
    title = "Weekend flash sale: Up to 60% off across trending collections",
    subtitle = "Use voucher code SHOP2026 for instant checkout savings.",
    badge = "Offer",
    settings = {},
  } = section;

  return (
    <section className="py-3 px-4 sm:px-6 lg:px-8">
      <div
        className={`max-w-[1720px] 2xl:max-w-[1800px] mx-auto rounded-xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 border transition-all ${
          isDarkMode
            ? "bg-zinc-900 border-zinc-800 text-white"
            : "bg-slate-50 border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isDarkMode
                ? "bg-zinc-800 border-zinc-700 text-sky-400"
                : "bg-white border-slate-200 text-sky-600 shadow-2xs"
            }`}
          >
            <Bell className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {badge && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-600 text-white">
                  {badge}
                </span>
              )}
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {settings.ctaText && (
          <Link
            href={settings.ctaLink || "/products"}
            className="shrink-0 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <span>{settings.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}
