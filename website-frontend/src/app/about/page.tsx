"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock,
  Compass,
  HeartHandshake,
  Layers,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useWebsite } from "@/context/WebsiteContext";
import HeroVfxCanvas from "@/components/HeroVfxCanvas";

const CORE_VALUES = [
  {
    icon: ShieldCheck,
    title: "Verified Quality",
    desc: "Every offering undergoes strict quality checks so customers always receive authentic excellence.",
  },
  {
    icon: HeartHandshake,
    title: "Customer-First Care",
    desc: "Warm, attentive service before, during, and after every visit or inquiry.",
  },
  {
    icon: Award,
    title: "Trusted Craftsmanship",
    desc: "Built on years of industry expertise, consistency, and attention to detail.",
  },
  {
    icon: Sparkles,
    title: "Modern Experience",
    desc: "Seamless branch operations paired with a clean, transparent brand experience.",
  },
];

export default function AboutPage() {
  const { site, products, categories } = useWebsite();

  const milestones = [
    {
      step: "01",
      title: "Foundation & Vision",
      desc: `${site.storeName} started with a clear promise: deliver reliable quality and memorable service in ${site.tagline}.`,
    },
    {
      step: "02",
      title: "Growing Portfolio",
      desc: `Expanded to ${products.length > 0 ? products.length : "dozens of"} curated offerings across ${categories.length > 0 ? categories.length : "multiple"} specialized categories.`,
    },
    {
      step: "03",
      title: `${site.years} Years of Trust`,
      desc: "Continuous innovation, loyal community trust, and dedicated support at our flagship location.",
    },
  ];

  return (
    <div className="page-enter w-full">
      {/* Hero Banner with 3D VFX */}
      <section
        className="relative w-full overflow-hidden text-white py-16 sm:py-20"
        style={{ background: `linear-gradient(135deg, #0b1120 0%, #0f172a 45%, ${site.accent} 100%)` }}
      >
        <HeroVfxCanvas />
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-white/90">
              <Sparkles className="w-3.5 h-3.5" />
              About Our Brand
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
              {site.aboutTitle}
            </h1>
            <p className="text-white/85 text-base sm:text-lg max-w-2xl leading-relaxed">
              {site.storeName} — {site.tagline}. {site.aboutText}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/showcase"
                className="px-6 py-3 rounded-xl bg-white text-slate-950 text-sm font-extrabold shadow-lg hover:-translate-y-0.5 transition"
              >
                Explore Showcase
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-bold transition"
              >
                Visit or Contact Us
              </Link>
            </div>
          </div>

          {/* Glass 3D Brand Summary Card */}
          <div className="lg:col-span-5">
            <div className="card-3d rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-center gap-3.5 border-b border-white/15 pb-4">
                <img
                  src={site.logoUrl || "/logos/salepay-logo-blue.png"}
                  alt={site.storeName}
                  onError={(e) => {
                    e.currentTarget.src = "/logos/salepay-logo-blue.png";
                  }}
                  className="h-10 w-auto max-w-[120px] object-contain rounded-lg bg-white px-2 py-1"
                />
                <div>
                  <div className="font-extrabold text-base text-white">{site.storeName}</div>
                  <div className="text-xs text-white/75 uppercase tracking-wider font-semibold">
                    {site.tagline}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-black/25 border border-white/10 p-3.5">
                  <div className="text-2xl font-black text-white">{site.years}</div>
                  <div className="text-[11px] text-white/75 font-semibold mt-0.5">Years Exp.</div>
                </div>
                <div className="rounded-2xl bg-black/25 border border-white/10 p-3.5">
                  <div className="text-2xl font-black text-white">{products.length}</div>
                  <div className="text-[11px] text-white/75 font-semibold mt-0.5">Offerings</div>
                </div>
                <div className="rounded-2xl bg-black/25 border border-white/10 p-3.5">
                  <div className="text-2xl font-black text-white">{categories.length}</div>
                  <div className="text-[11px] text-white/75 font-semibold mt-0.5">Categories</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-white/85 pt-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-white/70" />
                  <span>{site.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0 text-white/70" />
                  <span>{site.hours}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story, Pillars & Mission/Vision */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-14 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: site.accent }}>
            <Layers className="w-4 h-4" />
            Our Story &amp; Promise
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Building Lasting Relationships Through Quality
          </h2>
          <p className="text-slate-600 leading-relaxed text-base">{site.aboutText}</p>

          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            {site.highlights.map((h, i) => (
              <div
                key={i}
                className="card-3d bg-slate-50 hover:bg-white rounded-2xl p-5 border border-slate-200 transition"
              >
                <div
                  className="text-[11px] font-black uppercase tracking-wider mb-1.5"
                  style={{ color: site.accent }}
                >
                  0{i + 1} • Pillar
                </div>
                <div className="font-extrabold text-sm text-slate-900">{h[0]}</div>
                <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{h[1]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5">
          <div className="card-3d bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-2.5">
            <div className="inline-flex p-2.5 rounded-xl bg-slate-100" style={{ color: site.accent }}>
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Our Mission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To deliver consistent value, authentic products, and attentive hospitality to every customer who walks through our doors or connects with {site.storeName}.
            </p>
          </div>

          <div className="card-3d bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-2.5">
            <div className="inline-flex p-2.5 rounded-xl bg-slate-100" style={{ color: site.accent }}>
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Our Vision</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To be the most trusted and admired destination in {site.tagline}, known for transparency, quality, and modern customer experience.
            </p>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Flagship Desk</div>
            <div className="flex items-center gap-2.5 text-sm font-bold">
              <Phone className="w-4 h-4 text-sky-400" />
              <span>{site.phone}</span>
            </div>
            <div className="text-xs text-slate-300">{site.email}</div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="w-full bg-white border-y border-slate-200/80 py-14">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 space-y-8">
          <div className="max-w-2xl">
            <div className="text-xs font-extrabold uppercase tracking-wider" style={{ color: site.accent }}>
              Why Choose {site.storeName}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Standards That Define Everything We Do
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CORE_VALUES.map((val, idx) => {
              const Icon = val.icon;
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
                  <h3 className="font-extrabold text-base text-slate-900">{val.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Journey Milestones + CTA */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-14 space-y-10">
        <div className="grid md:grid-cols-3 gap-6">
          {milestones.map((m) => (
            <div
              key={m.step}
              className="card-3d bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100"
                  style={{ color: site.accent }}
                >
                  Milestone {m.step}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">{m.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl"
          style={{ background: `linear-gradient(120deg, #0f172a 0%, ${site.accent} 100%)` }}
        >
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-black">Want to know more or visit our branch?</h3>
            <p className="text-sm text-white/85">
              Reach out to {site.storeName} for reservations, product inquiries, partnerships, or flagship branch directions.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3.5 rounded-xl bg-white text-slate-950 font-extrabold text-sm shadow-lg hover:-translate-y-0.5 transition shrink-0"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
