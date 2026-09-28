"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Leaf, Heart } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface Props {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function PromoSplitBannerSection({ section, isDarkMode }: Props) {
  const { title, subtitle, badge, settings } = section;
  const ctaText = settings?.ctaText || "Shop Now";
  const ctaLink = settings?.ctaLink || "/products";
  const sideCardTitle = settings?.sideCardTitle || "Smart Choices";
  const sideCardSubtitle = settings?.sideCardSubtitle || "for a Brighter Tomorrow";
  const image = settings?.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80";

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          
          {/* Main Banner (Col 8) */}
          <div
            className={`lg:col-span-8 relative rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-lg text-white ${
              isDarkMode
                ? "bg-gradient-to-r from-zinc-950 via-slate-900 to-indigo-950 border border-zinc-800"
                : "bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-900"
            }`}
            style={{ minHeight: "220px" }}
          >
            {/* Background image preview */}
            <div
              className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center opacity-40 pointer-events-none mix-blend-screen"
              style={{ backgroundImage: `url('${image}')` }}
            />

            <div className="relative z-10 max-w-md">
              {badge && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full mb-3">
                  <Sparkles className="w-3 h-3" />
                  <span>{badge}</span>
                </span>
              )}
              <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                {title || "Live Better With Premium Picks"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 line-clamp-2">
                {subtitle || "Top quality, trusted brands, unbeatable value guaranteed."}
              </p>
            </div>

            <div className="relative z-10 pt-4">
              <Link
                href={ctaLink}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all active:scale-95"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Side Card (Col 4) */}
          <div
            className={`lg:col-span-4 rounded-3xl p-6 flex flex-col justify-between border shadow-sm ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-800 text-white"
                : "bg-white border-slate-200/80 text-slate-900"
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                Value Promise
              </span>
              <h3 className="text-lg sm:text-xl font-black">{sideCardTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{sideCardSubtitle}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mb-1">
                  <Leaf className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">Sustainable</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mb-1">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">Trusted</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mb-1">
                  <Heart className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">Better Living</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
