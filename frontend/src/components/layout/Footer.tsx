"use client";

import { siteConfig } from "@/config/site";
import { Waves, Mail, Phone, MapPin, Store } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 w-full select-none z-20 bg-white/95 backdrop-blur-md rounded-tl-2xl border-t border-l border-sky-200/70 shadow-[0_-2px_10px_rgba(2,132,199,0.05)] overflow-hidden">
      {/* ── Background Wave Accent on Far Right Corner ── */}
      <div className="pointer-events-none absolute right-0 inset-y-0 w-44 sm:w-64 md:w-80 z-0 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 320 44"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="footerCornerL1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="footerCornerL2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="footerCornerL3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          {/* Layer 1: Soft Sky Wave */}
          <path d="M 0,44 C 100,44 180,14 320,0 L 320,44 Z" fill="url(#footerCornerL1)" />
          {/* Layer 2: Mid Aqua Wave */}
          <path d="M 60,44 C 140,44 210,20 320,6 L 320,44 Z" fill="url(#footerCornerL2)" />
          {/* Layer 3: Vibrant Ocean Blue Front Wave */}
          <path d="M 120,44 C 190,44 250,26 320,12 L 320,44 Z" fill="url(#footerCornerL3)" />
        </svg>
      </div>

      {/* ── Main Footer Single-Line Bar (No Wrapping) ── */}
      <div className="relative z-10 w-full px-3.5 sm:px-6 py-1.5 sm:py-2">
        <div className="mx-auto flex items-center justify-between gap-3 text-xs flex-nowrap min-w-0">
          {/* Left: Brand Icon + Name + Copyright */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0284c7] text-white shadow-2xs">
              <Store size={12} className="stroke-[2.5]" />
            </div>
            <span className="font-bold text-[#0284c7] text-xs sm:text-[13px] tracking-tight shrink-0">
              {siteConfig.name}
            </span>
            <span className="text-slate-300 hidden sm:inline text-xs">|</span>
            <span className="text-slate-500 text-[11px] hidden sm:inline truncate font-normal">
              &copy; {currentYear} {siteConfig.name}. All rights reserved.
            </span>
          </div>

          {/* Middle: Contact Info (Adapts smoothly, only on wider layouts to prevent cramped layout) */}
          <div className="hidden xl:flex items-center gap-4 2xl:gap-6 text-slate-600 text-[11px] font-medium shrink min-w-0 truncate">
            <div className="flex items-center gap-1.5 shrink-0 hover:text-[#0284c7] transition">
              <Mail size={12} className="text-[#0284c7] shrink-0" />
              <span className="truncate">support@blueoceanspos.com</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 hover:text-[#0284c7] transition">
              <Phone size={12} className="text-[#0284c7] shrink-0" />
              <span>+880 1730 000000</span>
            </div>
            <div className="hidden 2xl:flex items-center gap-1.5 shrink-0 hover:text-[#0284c7] transition">
              <MapPin size={12} className="text-[#0284c7] shrink-0" />
              <span>Dhaka, Bangladesh</span>
            </div>
          </div>

          {/* Right: Tagline + Status Waves */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <span className="italic text-slate-600 text-[10.5px] sm:text-[11px] font-medium hidden sm:inline truncate">
              Smarter Business &bull; Better Tomorrow
            </span>
            <span className="flex items-center text-white drop-shadow-2xs">
              <Waves size={13} className="stroke-[2.5] text-sky-100" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
















