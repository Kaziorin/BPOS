"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { useWebsite } from "@/context/WebsiteContext";
import HeroVfxCanvas from "@/components/HeroVfxCanvas";

const HIGHLIGHT_ICONS = [Sparkles, ShieldCheck, Award];

export default function HomePage() {
  const { site, products, categories } = useWebsite();
  const [slideIdx, setSlideIdx] = useState(0);

  const isSliderActive = site.heroBgStyle === "slider" && site.heroImages.length > 0;

  useEffect(() => {
    if (!isSliderActive || site.heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % site.heroImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isSliderActive, site.heroImages.length]);

  useEffect(() => {
    if (slideIdx >= site.heroImages.length) setSlideIdx(0);
  }, [site.heroImages.length, slideIdx]);

  return (
    <div className="page-enter w-full">
      {/* Premium 3D + VFX / Auto-Sliding Banner Hero */}
      <section
        className="relative w-full overflow-hidden pt-20 pb-28 sm:pt-28 sm:pb-36 text-white"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${site.accent}55 0%, transparent 45%), linear-gradient(135deg, #060913 0%, #0f172a 50%, ${site.accent} 100%)`,
        }}
      >
        {isSliderActive ? (
          <>
            {site.heroImages.map((imgUrl, idx) => {
              const active = idx === slideIdx;
              return (
                <div
                  key={`${imgUrl.slice(0, 32)}-${idx}`}
                  className={`absolute inset-0 transition-all duration-1000 ease-out pointer-events-none ${active ? "opacity-100 scale-105" : "opacity-0 scale-100"
                    }`}
                >
                  <img src={imgUrl} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              );
            })}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40 pointer-events-none" />
          </>
        ) : (
          <HeroVfxCanvas variant={site.heroBgStyle} accent={site.accent} />
        )}
        <div
          className="vfx-orb absolute -top-28 -right-24 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ backgroundColor: site.accent }}
        />
        <div className="vfx-orb absolute -bottom-32 -left-24 w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none bg-sky-400/20" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-extrabold bg-white/10 border border-white/20 backdrop-blur-md shadow-sm">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: site.accent }}
              />
              <span>{site.pill}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-tight leading-[1.05]">
              {site.title}
            </h1>

            <p className="text-base sm:text-xl text-white/80 max-w-2xl leading-relaxed font-normal">
              {site.desc}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/showcase"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white text-slate-950 font-extrabold text-sm shadow-2xl hover:-translate-y-0.5 hover:shadow-white/20 transition"
              >
                <span>{site.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm backdrop-blur transition"
              >
                Our Story
              </Link>
            </div>

            {/* Sleek Trust Strip */}
            <div className="pt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-semibold text-white/75 border-t border-white/15">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{site.years} Years of Excellence</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>4.9/5 Customer Satisfaction</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>100% Authentic &amp; Verified</span>
              </div>
              {isSliderActive && site.heroImages.length > 1 && (
                <div className="ml-auto flex items-center gap-1.5">
                  {site.heroImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSlideIdx(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all ${idx === slideIdx ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Overlapping Elevated 3D Highlights */}
      <section className="relative z-20 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 -mt-12 pb-14 grid md:grid-cols-3 gap-6">
        {site.highlights.map((h, i) => {
          const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
          return (
            <Link
              key={i}
              href="/highlights"
              className="group card-3d bg-white rounded-3xl p-7 border border-slate-200/90 shadow-lg hover:shadow-2xl space-y-3 block transition"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: site.accent }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition">
                  0{i + 1} • Highlight
                </span>
              </div>
              <div className="font-extrabold text-lg text-slate-900 pt-1">{h[0]}</div>
              <div className="text-sm text-slate-600 leading-relaxed">{h[1]}</div>
            </Link>
          );
        })}
      </section>

      {/* Editorial Brand Story Section */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 pb-16">
        <div className="bg-white rounded-[32px] border border-slate-200/90 p-8 sm:p-12 shadow-sm grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <div
              className="card-3d rounded-3xl p-8 text-white space-y-6 shadow-xl relative overflow-hidden"
              style={{
                background: `linear-gradient(145deg, #0f172a 0%, ${site.accent} 100%)`,
              }}
            >
              <div className="flex items-center justify-between">
                <img
                  src={site.logoUrl || "/logos/salepay-logo-blue.png"}
                  alt={site.storeName}
                  onError={(e) => {
                    e.currentTarget.src = "/logos/salepay-logo-blue.png";
                  }}
                  className="h-10 w-auto max-w-[130px] object-contain rounded-xl bg-white px-2.5 py-1.5 shadow"
                />
                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-bold">
                  {site.years} Years
                </span>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/70 font-bold">
                  {site.tagline}
                </div>
                <div className="text-2xl font-black mt-1">{site.storeName}</div>
              </div>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {categories.slice(0, 5).map((cat) => (
                    <span
                      key={cat.id}
                      className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold text-white/95"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div
              className="text-xs font-extrabold uppercase tracking-widest"
              style={{ color: site.accent }}
            >
              About {site.storeName}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              {site.aboutTitle}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">{site.aboutText}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/showcase"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-95 transition"
                style={{ backgroundColor: site.accent }}
              >
                <span>Explore Showcase ({products.length})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-900 font-bold text-sm hover:bg-slate-200 transition"
              >
                Read Full Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Showcase Preview */}
      <section className="w-full bg-white border-y border-slate-200/80 py-16">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div
                className="text-xs font-extrabold uppercase tracking-widest"
                style={{ color: site.accent }}
              >
                Curated For You
              </div>
              <h2 className="text-3xl font-black text-slate-900 mt-1">
                {site.preset.catalogHeading}
              </h2>
            </div>
            <Link
              href="/showcase"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold hover:underline"
              style={{ color: site.accent }}
            >
              <span>View Full Showcase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {products.length > 0
              ? products.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href="/showcase"
                  className="group card-3d bg-slate-50 hover:bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl flex flex-col transition"
                >
                  <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <span className="text-3xl font-black text-slate-300">SP</span>
                    )}
                  </div>
                  <div className="p-5 space-y-1.5">
                    <div
                      className="text-[10px] font-extrabold uppercase tracking-wider"
                      style={{ color: site.accent }}
                    >
                      {p.categoryName || "Featured"}
                    </div>
                    <div className="font-bold text-sm text-slate-900 line-clamp-1">
                      {p.name}
                    </div>
                    <div className="font-black text-base text-slate-900">
                      ৳{Number(p.sellingPrice || p.price || 0).toFixed(0)}
                    </div>
                  </div>
                </Link>
              ))
              : site.highlights.map((h, i) => (
                <Link
                  key={i}
                  href="/showcase"
                  className="card-3d bg-slate-50 hover:bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2.5 block transition"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
                    style={{ backgroundColor: site.accent }}
                  >
                    0{i + 1}
                  </div>
                  <div className="font-extrabold text-sm text-slate-900">{h[0]}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{h[1]}</div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Trust Metrics & Testimonials */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-16 space-y-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            [site.years, "Years Experience"],
            ["10K+", "Happy Guests & Clients"],
            [`${products.length || 50}+`, "Curated Offerings"],
            ["4.9★", "Customer Rating"],
          ].map(([val, label]) => (
            <div
              key={label}
              className="card-3d bg-white rounded-3xl border border-slate-200 p-7 text-center shadow-sm"
            >
              <div className="text-3xl sm:text-4xl font-black" style={{ color: site.accent }}>
                {val}
              </div>
              <div className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-wider">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            [
              "Exceptional quality, warm hospitality, and consistent excellence every time we visit.",
              "Tariq Hasan",
              "Regular Patron",
            ],
            [
              "Super clean environment, attentive staff, and transparent standards. Highly recommended!",
              "Nusrat Jahan",
              "Verified Client",
            ],
            [
              "Always our first choice in town. Prompt service and an unforgettable brand experience.",
              "Mahmudul Karim",
              "Corporate Guest",
            ],
          ].map(([quote, author, role]) => (
            <div
              key={author}
              className="card-3d bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-amber-400 text-sm tracking-wide">★★★★★</div>
                  <Quote className="w-5 h-5 text-slate-200" />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">“{quote}”</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-extrabold text-slate-900">{author}</div>
                <div className="text-[11px] text-slate-400 font-semibold">{role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 pb-16">
        <div
          className="relative overflow-hidden rounded-[32px] p-8 sm:p-14 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-2xl"
          style={{ background: `linear-gradient(135deg, #060913 0%, #0f172a 45%, ${site.accent} 100%)` }}
        >
          <div className="space-y-2.5 max-w-2xl relative z-10">
            <div className="text-xs font-extrabold uppercase tracking-widest text-white/75">
              Visit or Connect Today
            </div>
            <h3 className="text-2xl sm:text-4xl font-black leading-tight">
              Experience {site.storeName} in Person
            </h3>
            <p className="text-sm text-white/80">
              {site.address} • {site.hours} • {site.phone}
            </p>
          </div>
          <Link
            href="/contact"
            className="relative z-10 inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white text-slate-950 font-extrabold text-sm shadow-xl hover:-translate-y-0.5 transition shrink-0"
          >
            <span>Book / Contact Us</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
