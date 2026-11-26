"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Gem,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useWebsite } from "@/context/WebsiteContext";
import HeroVfxCanvas from "@/components/HeroVfxCanvas";

const PILLAR_ICONS = [Gem, ShieldCheck, Award];

const GUARANTEES = [
  {
    icon: CheckCircle2,
    title: "Strict Quality Assurance",
    desc: "Every product and service is carefully inspected to uphold our brand standards.",
  },
  {
    icon: Clock,
    title: "Consistent Availability",
    desc: `Reliable branch hours (${""}) and prompt assistance whenever you visit or inquire.`,
  },
  {
    icon: HeartHandshake,
    title: "Personalized Care",
    desc: "Attentive specialists ready to guide you toward the exact fit for your needs.",
  },
  {
    icon: Zap,
    title: "Seamless Experience",
    desc: "Modern operations and transparent communication from first inquiry to after-service.",
  },
];

export default function HighlightsPage() {
  const { site, products } = useWebsite();

  return (
    <div className="page-enter w-full">
      {/* VFX Hero Banner */}
      <section
        className="relative w-full overflow-hidden py-16 sm:py-22 text-white"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${site.accent}55 0%, transparent 45%), linear-gradient(135deg, #060913 0%, #0f172a 50%, ${site.accent} 100%)`,
        }}
      >
        <HeroVfxCanvas variant={site.heroBgStyle} accent={site.accent} />
        <div className="relative z-10 max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-white/90">
              <Sparkles className="w-3.5 h-3.5" />
              Why Choose {site.storeName}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
              Our Core Highlights &amp; Services
            </h1>
            <p className="text-white/85 text-base sm:text-lg max-w-2xl leading-relaxed">
              Crafted for {site.tagline} excellence at {site.storeName} — backed by {site.years} years of trust.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/showcase"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-950 font-extrabold text-sm shadow-xl hover:-translate-y-0.5 transition"
            >
              <span>Explore Showcase ({products.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm transition"
            >
              Book / Inquire
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic 3 Highlights Grid */}
      <section className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 py-14">
        <div className="grid md:grid-cols-3 gap-6">
          {site.highlights.map((h, i) => {
            const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length];
            return (
              <div
                key={i}
                className="card-3d bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl space-y-4 transition relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: site.accent }}
                />
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: site.accent }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    0{i + 1} • Pillar
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">{h[0]}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{h[1]}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Service Standards & Guarantees */}
      <section className="w-full bg-white border-y border-slate-200/80 py-14">
        <div className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 space-y-8">
          <div className="max-w-2xl">
            <div className="text-xs font-extrabold uppercase tracking-widest" style={{ color: site.accent }}>
              Service Guarantees
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Every Detail Designed Around Your Experience
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {GUARANTEES.map((g, idx) => {
              const Icon = g.icon;
              const desc = idx === 1 ? `Reliable branch hours (${site.hours}) and prompt assistance whenever you visit.` : g.desc;
              return (
                <div
                  key={idx}
                  className="card-3d rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 p-6 space-y-3 transition"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: site.accent }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">{g.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process & Bottom CTA */}
      <section className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 py-14 space-y-10">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["01", "Discover & Explore", `Browse our curated ${site.tagline} offerings online or at our flagship location.`],
            ["02", "Connect With Our Team", "Send an inquiry or visit us directly for personalized recommendations."],
            ["03", "Experience Excellence", `Enjoy authentic quality and dedicated support from ${site.storeName}.`],
          ].map(([step, title, text]) => (
            <div key={step} className="card-3d bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-2.5">
              <div className="text-xs font-black uppercase tracking-widest" style={{ color: site.accent }}>
                Step {step}
              </div>
              <h3 className="text-lg font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl"
          style={{ background: `linear-gradient(135deg, #060913 0%, #0f172a 45%, ${site.accent} 100%)` }}
        >
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-white/75">Ready To Experience More?</div>
            <h3 className="text-2xl sm:text-3xl font-black">Visit {site.storeName} or Send an Inquiry</h3>
            <p className="text-sm text-white/80">
              {site.address} • {site.phone}
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-950 font-extrabold text-sm shadow-lg hover:-translate-y-0.5 transition shrink-0"
          >
            <span>Book / Contact Us</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
