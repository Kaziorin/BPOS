"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";

interface FaqSectionProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function FaqSection({ section, isDarkMode = false }: FaqSectionProps) {
  const {
    title = "Frequently Asked Questions",
    subtitle = "Got questions? We have got you covered with answers to everything you need to know.",
    badge = "HELP CENTER",
    settings = {},
  } = section;

  const defaultFaqs = [
    {
      q: "How fast is standard and express home delivery?",
      a: "Standard delivery inside city takes 24-48 hours. Express delivery is dispatched within 2 to 4 hours on business days.",
    },
    {
      q: "What payment methods are supported?",
      a: "We support Cash on Delivery (COD), bKash, Nagad, Rocket, Credit/Debit Cards, and Secure Online Banking.",
    },
    {
      q: "Can I return or exchange a product if I am not satisfied?",
      a: "Yes! We offer a hassle-free 7-day return and exchange policy for any damaged or non-fitting items in their original packaging.",
    },
    {
      q: "Are all products 100% authentic and genuine?",
      a: "Absolutely. All our products are sourced directly from authorized manufacturers and verified suppliers with official warranty.",
    },
  ];

  const faqs = settings.faqs || defaultFaqs;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={`py-12 px-4 sm:px-6 lg:px-8 transition-colors ${isDarkMode ? "bg-zinc-950 text-white" : "bg-white text-slate-900"}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{badge}</span>
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h2>
          {subtitle && (
            <p className={`text-sm ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>{subtitle}</p>
          )}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq: any, idx: number) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? isDarkMode
                      ? "bg-zinc-900/80 border-sky-500/40 shadow-md"
                      : "bg-sky-50/40 border-sky-300 shadow-sm"
                    : isDarkMode
                    ? "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
                    : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm sm:text-base gap-4"
                >
                  <span className={isOpen ? "text-sky-500 dark:text-sky-400" : ""}>{faq.q}</span>
                  <div className={`p-1 rounded-full shrink-0 ${isOpen ? "bg-sky-500 text-white" : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"}`}>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className={`px-4 pb-5 sm:px-5 text-xs sm:text-sm leading-relaxed border-t ${
                    isDarkMode ? "border-zinc-800/80 text-zinc-300" : "border-sky-100 text-slate-600"
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
