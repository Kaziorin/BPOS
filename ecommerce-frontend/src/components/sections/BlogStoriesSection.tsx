"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronRight } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface Props {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function BlogStoriesSection({ section, isDarkMode }: Props) {
  const { title, subtitle, settings } = section;
  const articles = [
    {
      title: "10 Best Tech Gadgets & Essentials You Should Buy in 2026",
      desc: "Comprehensive review of the highest rated devices with true value.",
      date: "Aug 12, 2026",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "How to Build a Capsule Wardrobe on a Budget",
      desc: "Timeless fashion hacks and essential outfits for every modern season.",
      date: "Aug 10, 2026",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "Healthy Living Tips for a Better Tomorrow",
      desc: "Nutrition, fitness and organic lifestyle advice backed by real experts.",
      date: "Aug 8, 2026",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "Smart Home Essentials for Modern Living",
      desc: "Turn your living space into an intelligent, energy-saving haven.",
      date: "Aug 5, 2026",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {title || "Latest From Our Blog"}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">{subtitle}</p>
            )}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {articles.map((art, idx) => (
            <div
              key={idx}
              className={`group rounded-2xl overflow-hidden border p-3.5 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode
                  ? "bg-zinc-900 border-zinc-800 text-white"
                  : "bg-white border-slate-200/80 text-slate-900"
              }`}
            >
              <div>
                <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 mb-3">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 mb-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{art.date}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold line-clamp-2 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 line-clamp-2">
                  {art.desc}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:text-sky-700 dark:text-sky-400">
                  <span>Read More</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
