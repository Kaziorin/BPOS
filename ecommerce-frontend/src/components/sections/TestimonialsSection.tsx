"use client";

import React, { useState } from "react";
import { Star, Quote, CheckCircle } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface TestimonialsSectionProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

interface ReviewItem {
  name: string;
  role?: string;
  comment: string;
  rating?: number;
  avatar?: string;
}

export default function TestimonialsSection({ section, isDarkMode = false }: TestimonialsSectionProps) {
  const {
    title = "What Our Happy Customers Say",
    subtitle = "Trusted by 10,000+ satisfied customers across the country",
    badge = "VERIFIED REVIEWS",
    settings = {},
  } = section;

  const [avatarErrors, setAvatarErrors] = useState<Record<number, boolean>>({});

  const defaultReviews: ReviewItem[] = [
    {
      name: "Tanzim Ahmed",
      role: "Verified Buyer",
      comment:
        "Super fast delivery and authentic products! The packaging was top-notch and customer service resolved my question in minutes.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Sabrina Rahman",
      role: "Loyal Customer",
      comment:
        "Best online shopping experience by far! Huge variety, easy checkout, and the return policy gives complete peace of mind.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Farhan Hossain",
      role: "Business Owner",
      comment:
        "Extremely reliable quality and great discounts on wholesale orders. Highly recommend this store to everyone!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const reviews: ReviewItem[] = settings.reviews || defaultReviews;

  const heading = (title || "Loved by Happy Customers").trim();
  const words = heading.split(/\s+/);
  const splitCount = words.length > 2 ? 2 : 1;
  const headingHead = words.length > 1 ? words.slice(0, -splitCount).join(" ") : "";
  const headingTail = words.length > 1 ? words.slice(-splitCount).join(" ") : heading;

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "C";

  return (
    <section
      className={`py-10 sm:py-14 border-y transition-colors ${
        isDarkMode
          ? "bg-zinc-900 border-zinc-800"
          : "bg-white border-orange-100"
      }`}
    >
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        {/* Clean Centered Editorial Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          {badge && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wider uppercase mb-3 ${
                isDarkMode
                  ? "bg-orange-500/15 border-orange-500/30 !text-orange-300"
                  : "bg-[#FFF1E0] border-orange-200/80 !text-orange-700"
              }`}
            >
              <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
              <span>{badge}</span>
            </span>
          )}

          <h2
            className={`text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight leading-snug ${
              isDarkMode ? "!text-white" : "!text-stone-900"
            }`}
          >
            {headingHead ? (
              <>
                {headingHead}{" "}
                <span className="text-orange-600">{headingTail}</span>
              </>
            ) : (
              headingTail
            )}
          </h2>

          {subtitle && (
            <p className={`text-xs sm:text-sm mt-2 ${isDarkMode ? "!text-zinc-400" : "!text-stone-600"}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          {reviews.map((rev, idx) => {
            const showFallback = !rev.avatar || avatarErrors[idx];
            return (
              <article
                key={`${rev.name}-${idx}`}
                className={`rounded-2xl p-6 border flex flex-col justify-between transition-colors ${
                  isDarkMode
                    ? "bg-zinc-950 border-zinc-800 hover:border-orange-500/50"
                    : "bg-[#FAF5EE] border-orange-200/80 shadow-[0_2px_10px_-4px_rgba(234,88,12,0.06)] hover:bg-[#FFF7ED] hover:border-orange-300"
                }`}
              >
                <div>
                  {/* Top Rating & Quote Mark */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (rev.rating || 5)
                              ? "text-amber-500 fill-amber-500"
                              : isDarkMode
                              ? "text-zinc-700"
                              : "text-stone-300"
                          }`}
                        />
                      ))}
                    </div>

                    <Quote
                      aria-hidden="true"
                      className={`w-6 h-6 ${isDarkMode ? "text-orange-500/25" : "text-orange-300/80"}`}
                    />
                  </div>

                  {/* Quote Comment */}
                  <p
                    className={`text-sm leading-relaxed mb-6 ${
                      isDarkMode ? "!text-zinc-300" : "!text-stone-700"
                    }`}
                  >
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Author Footer */}
                <div
                  className={`flex items-center justify-between gap-3 pt-4 border-t ${
                    isDarkMode ? "border-zinc-800" : "border-orange-200/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {showFallback ? (
                      <div
                        aria-hidden="true"
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                          isDarkMode
                            ? "bg-zinc-800 border-zinc-700 !text-orange-400"
                            : "bg-[#FFF1E0] border-orange-200 !text-orange-700"
                        }`}
                      >
                        {getInitials(rev.name)}
                      </div>
                    ) : (
                      <img
                        src={rev.avatar}
                        alt=""
                        onError={() => setAvatarErrors((prev) => ({ ...prev, [idx]: true }))}
                        className={`w-10 h-10 rounded-full object-cover shrink-0 ring-2 ${
                          isDarkMode ? "ring-zinc-700" : "ring-orange-200"
                        }`}
                        loading="lazy"
                      />
                    )}

                    <div className="min-w-0">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isDarkMode ? "!text-white" : "!text-stone-900"
                        }`}
                      >
                        {rev.name}
                      </h4>
                      <span className={`text-xs block truncate ${isDarkMode ? "!text-zinc-400" : "!text-stone-500"}`}>
                        {rev.role || "Verified Buyer"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${
                      isDarkMode
                        ? "bg-zinc-900 border-zinc-700 !text-orange-300"
                        : "bg-white border-orange-200/80 !text-orange-700"
                    }`}
                  >
                    <CheckCircle className="w-3 h-3 text-orange-600" />
                    <span>Verified</span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
