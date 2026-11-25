"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, ShieldCheck } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";
import toast from "react-hot-toast";

interface Props {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function NewsletterSection({ section, isDarkMode }: Props) {
  const { title, subtitle, settings } = section;
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsSubmitted(true);
    toast.success("Thank you for subscribing to our newsletter!");
  };

  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        <div
          className={`relative rounded-2xl overflow-hidden p-6 sm:p-10 shadow-sm border ${
            isDarkMode
              ? "bg-zinc-900 border-zinc-800 text-white"
              : "bg-slate-900 border-slate-800 text-white"
          }`}
        >
          <div className="relative z-10 max-w-xl mx-auto text-center">
            <span className="inline-block text-[10px] font-semibold tracking-wide uppercase text-slate-300 bg-white/10 border border-white/10 px-2.5 py-0.5 rounded mb-3">
              Special offers & updates
            </span>
            <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              {title || "Subscribe to our newsletter"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
              {subtitle || "Get curated updates, product drops, and exclusive discounts delivered to your inbox."}
            </p>

            {isSubmitted ? (
              <div className="mt-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>You're subscribed! Check your inbox soon for your welcome offer.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-hidden focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>{settings?.buttonText || "Subscribe"}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>We respect your privacy. No spam ever.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
