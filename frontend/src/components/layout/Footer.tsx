"use client";

import { siteConfig } from "@/config/site";
import { Waves, Mail, Phone, MapPin, Store } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 w-full select-none z-20 bg-white/95 backdrop-blur-md rounded-tl-2xl border-t border-l border-sky-200/70 shadow-[0_-2px_10px_rgba(2,132,199,0.05)] overflow-hidden">
      {/* ── Prominent Multi-Layer Ocean Wave Accent on Right Corner ── */}
      <div className="pointer-events-none absolute right-0 inset-y-0 w-72 sm:w-96 md:w-[480px] lg:w-[600px] xl:w-[720px] z-0 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 720 48"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="footerCornerL1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.2" />
              <stop offset="40%" stopColor="#7dd3fc" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="footerCornerL2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="footerCornerL3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* Layer 1: Wide Sky Translucent Base Wave */}
          <path
            d="M 0,48 C 160,48 300,14 480,4 C 570,-1 640,5 720,0 L 720,48 Z"
            fill="url(#footerCornerL1)"
          />
          {/* Layer 2: Sweeping Mid Aqua/Cyan Wave */}
          <path
            d="M 120,48 C 260,48 400,18 540,8 C 610,3 670,7 720,3 L 720,48 Z"
            fill="url(#footerCornerL2)"
          />
          {/* Layer 3: Vibrant Signature Ocean Blue Front Wave */}
          <path
            d="M 260,48 C 380,48 480,20 580,10 C 640,4 685,7 720,5 L 720,48 Z"
            fill="url(#footerCornerL3)"
          />
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
          <div className="flex items-center gap-2 shrink-0 ml-auto pr-1">
            <span className="italic text-white drop-shadow-[0_1px_2px_rgba(2,132,199,0.5)] text-[10.5px] sm:text-[11px] font-semibold hidden sm:inline truncate">
              Smarter Business &bull; Better Tomorrow
            </span>
            <span className="flex items-center text-white drop-shadow-[0_1px_2px_rgba(2,132,199,0.5)]">
              <Waves size={14} className="stroke-[2.5] text-white" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
















