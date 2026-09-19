"use client";

import { siteConfig } from "@/config/site";
import { Waves, Mail, Phone, MapPin, Store } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 w-full select-none z-20 bg-white/95 backdrop-blur-md rounded-tl-2xl sm:rounded-tl-3xl border-t border-l border-sky-200/80 shadow-[0_-2px_12px_rgba(2,132,199,0.06)] overflow-hidden">
      {/* ── Background Wave Curves (Right Multi-Layer Ocean Waves) ── */}
      <div className="pointer-events-none absolute inset-0 w-full h-full z-0 overflow-hidden">
        {/* Right Corner Flowing 3-Layer Ocean Waves */}
        <svg
          className="absolute right-0 top-0 h-full w-[200px] sm:w-[280px] md:w-[360px] lg:w-[420px]"
          viewBox="0 0 420 48"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="footerRightL1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="footerRightL2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="footerRightL3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* Layer 1: Soft Cyan Back Wave */}
          <path d="M 0,48 C 120,48 200,16 420,0 L 420,48 Z" fill="url(#footerRightL1)" />
          {/* Layer 2: Mid Ocean Blue Wave */}
          <path d="M 80,48 C 170,48 250,22 420,8 L 420,48 Z" fill="url(#footerRightL2)" />
          {/* Layer 3: Vibrant Ocean Blue Front Wave */}
          <path d="M 160,48 C 230,48 290,30 420,16 L 420,48 Z" fill="url(#footerRightL3)" />
        </svg>
      </div>

      {/* ── Main Footer Bar Content (Matching Reference Screenshot) ── */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-2">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
          {/* Left: Brand Circle Badge + Name + Copyright */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pl-1 sm:pl-2">
            <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-[#0284c7] text-white shadow-xs">
              <Store size={13} className="stroke-[2.5]" />
            </div>
            <span className="font-bold text-[#0284c7] text-xs sm:text-[13px] tracking-tight">
              {siteConfig.name}
            </span>
            <span className="text-slate-300 hidden sm:inline text-xs">|</span>
            <span className="text-slate-500 text-[11px] hidden sm:inline font-normal">
              &copy; {currentYear} {siteConfig.name}. All rights reserved.
            </span>
          </div>

          {/* Middle: Contact Details (Email, Phone, Location) */}
          <div className="hidden lg:flex items-center gap-5 text-slate-600 text-[11px] font-medium">
            <div className="flex items-center gap-1.5 hover:text-[#0284c7] transition">
              <Mail size={13} className="text-[#0284c7] shrink-0" />
              <span>support@blueoceanspos.com</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-[#0284c7] transition">
              <Phone size={13} className="text-[#0284c7] shrink-0" />
              <span>+880 1730 000000</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-[#0284c7] transition">
              <MapPin size={13} className="text-[#0284c7] shrink-0" />
              <span>Dhaka, Bangladesh</span>
            </div>
          </div>

          {/* Right: Italicized Tagline + Wave Icon */}
          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0 pr-1">
            <span className="italic text-slate-600 sm:text-sky-800 text-[11px] font-medium">
              Smarter Business &bull; Better Tomorrow
            </span>
            <span className="flex items-center text-white drop-shadow-xs">
              <Waves size={14} className="stroke-[2.5] text-sky-100" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}















