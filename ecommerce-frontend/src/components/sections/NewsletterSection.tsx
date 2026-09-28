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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`relative rounded-3xl overflow-hidden p-8 sm:p-12 shadow-xl ${
            isDarkMode
              ? "bg-gradient-to-r from-zinc-950 via-slate-900 to-indigo-950 border border-zinc-800 text-white"
              : "bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white"
          }`}
        >
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/40 px-3 py-1 rounded-full mb-3">
              VIP Club & Offers
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {title || "Subscribe to Our Newsletter"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-lg mx-auto">
              {subtitle || "Get the latest updates, exclusive deals and seasonal discounts delivered straight to your inbox."}
            </p>

            {isSubmitted ? (
              <div className="mt-6 p-4 rounded-2xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-300 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>You're subscribed! Check your inbox soon for your special gift voucher.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-400 backdrop-blur-md"
                />
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
                >
                  <span>{settings?.buttonText || "Subscribe"}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>We respect your privacy. No spam ever. Unsubscribe anytime.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
