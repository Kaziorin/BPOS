"use client";

import React from "react";
import { Smartphone, Download, Check, Sparkles } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface AppDownloadSectionProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function AppDownloadSection({ section, isDarkMode = false }: AppDownloadSectionProps) {
  const {
    title = "Shop Faster & Smarter with our Mobile App",
    subtitle = "Get exclusive in-app vouchers, real-time delivery tracking and 1-tap reordering on iOS & Android.",
    badge = "MOBILE APP",
    settings = {},
  } = section;

  const appFeatures = settings.features || [
    "Exclusive 15% discount on your first in-app order",
    "Live GPS delivery tracking right to your doorstep",
    "Instant notifications on Flash sales & price drops",
  ];

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-7xl mx-auto rounded-3xl overflow-hidden p-8 sm:p-12 relative bg-gradient-to-r ${
        isDarkMode
          ? "from-slate-900 via-indigo-950 to-slate-900 border border-zinc-800 text-white"
          : "from-sky-900 via-blue-900 to-indigo-900 text-white shadow-xl"
      }`}>
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-sky-200 border border-white/20 backdrop-blur-md">
                <Smartphone className="w-3.5 h-3.5" />
                <span>{badge}</span>
              </span>
            )}
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-sky-100/80 text-sm sm:text-base max-w-lg leading-relaxed">
              {subtitle}
            </p>

            <ul className="space-y-2.5 text-xs sm:text-sm text-sky-100">
              {appFeatures.map((feat: string, i: number) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={settings.playStoreUrl || "#"}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/80 hover:bg-black border border-white/20 text-white transition-transform active:scale-95 shadow-lg"
              >
                <div className="text-2xl">📱</div>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Get it on</div>
                  <div className="text-sm font-black">Google Play</div>
                </div>
              </a>

              <a
                href={settings.appStoreUrl || "#"}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/80 hover:bg-black border border-white/20 text-white transition-transform active:scale-95 shadow-lg"
              >
                <div className="text-2xl"></div>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Download on</div>
                  <div className="text-sm font-black">App Store</div>
                </div>
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <img
                src={settings.mockupImage || "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&auto=format&fit=crop&q=80"}
                alt="Mobile App Demo"
                className="w-64 sm:w-72 rounded-3xl shadow-2xl border-4 border-white/20 transform rotate-1 hover:rotate-0 transition-transform duration-500"
              />
              <div className="absolute -bottom-4 -left-4 bg-white text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>4.9 ★ Rating on App Store</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
