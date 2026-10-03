"use client";

import React from "react";
import { Star, Quote, CheckCircle } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface TestimonialsSectionProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function TestimonialsSection({ section, isDarkMode = false }: TestimonialsSectionProps) {
  const { title = "What Our Happy Customers Say", subtitle = "Trusted by 10,000+ satisfied customers across the country", badge = "TESTIMONIALS", settings = {} } = section;

  const defaultReviews = [
    {
      name: "Tanzim Ahmed",
      role: "Verified Buyer",
      comment: "Super fast delivery and authentic products! The packaging was top-notch and customer service resolved my question in minutes.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Sabrina Rahman",
      role: "Loyal Customer",
      comment: "Best online shopping experience by far! Huge variety, easy checkout, and the return policy gives complete peace of mind.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Farhan Hossain",
      role: "Business Owner",
      comment: "Extremely reliable quality and great discounts on wholesale orders. Highly recommend this store to everyone!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const reviews = settings.reviews || defaultReviews;

  return (
    <section className={`py-12 px-4 sm:px-6 lg:px-8 transition-colors ${isDarkMode ? "bg-zinc-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Star className="w-3 h-3 fill-amber-500" />
              <span>{badge}</span>
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h2>
          {subtitle && (
            <p className={`text-sm ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>{subtitle}</p>
          )}
        </div>

        {/* Reviews Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev: any, idx: number) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border transition-all duration-300 relative hover:-translate-y-1 shadow-sm hover:shadow-xl ${
                isDarkMode
                  ? "bg-zinc-900/70 border-zinc-800 hover:border-amber-500/40 text-white"
                  : "bg-white border-slate-200/80 hover:border-sky-400 text-slate-800"
              }`}
            >
              <Quote className="w-8 h-8 text-sky-500/20 dark:text-amber-400/20 absolute top-5 right-5" />

              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < (rev.rating || 5)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300 dark:text-zinc-700"
                    }`}
                  />
                ))}
              </div>

              <p className={`text-sm italic leading-relaxed mb-6 ${isDarkMode ? "text-zinc-300" : "text-slate-600"}`}>
                "{rev.comment}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <img
                  src={rev.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                  alt={rev.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500/30 dark:ring-amber-500/30"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold">{rev.name}</h4>
                    <CheckCircle className="w-3.5 h-3.5 text-sky-500 dark:text-amber-400" />
                  </div>
                  <span className={`text-[11px] ${isDarkMode ? "text-zinc-500" : "text-slate-400"}`}>
                    {rev.role || "Verified Buyer"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
