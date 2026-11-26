"use client";

import React from "react";
import { useWebsite } from "@/context/WebsiteContext";

export default function HighlightsPage() {
  const { site } = useWebsite();

  return (
    <div className="page-enter w-full">
      <section
        className="w-full py-16 text-white"
        style={{ background: `linear-gradient(135deg, #0f172a 0%, ${site.accent} 100%)` }}
      >
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-xs font-bold uppercase tracking-widest text-white/75 mb-2">Why Choose Us</div>
          <h1 className="text-4xl sm:text-5xl font-black">Our Core Highlights &amp; Services</h1>
          <p className="text-white/85 mt-3 max-w-2xl text-base">
            Crafted for {site.preset.label} excellence at {site.storeName}.
          </p>
        </div>
      </section>
      <section className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 grid md:grid-cols-3 gap-6">
        {site.highlights.map((h, i) => (
          <div key={i} className="card-3d bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow"
              style={{ backgroundColor: site.accent }}
            >
              0{i + 1}
            </div>
            <h3 className="text-xl font-black text-slate-900">{h[0]}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{h[1]}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
