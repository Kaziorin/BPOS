"use client";

import { siteConfig } from "@/config/site";
import { Waves, Mail, Phone, MapPin, Store } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 w-full select-none z-20 overflow-hidden bg-[#edf5fd]">
      {/* ── Main Footer Card with Left Tab Curve and Right Ocean Wave ── */}
      <div className="relative w-full bg-white/95 backdrop-blur-md border-t border-sky-200/60 shadow-[0_-2px_12px_rgba(2,132,199,0.06)]">
        {/* Left Curved Tab Ambient Background SVG */}
        <div className="pointer-events-none absolute inset-0 w-full h-full z-0 overflow-hidden">
          {/* Top-Left Soft Sky/Cyan Tab Glow Curve */}
          <svg
            className="absolute left-0 top-0 h-full w-[200px] sm:w-[280px]"
            viewBox="0 0 280 50"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft background curve matching the red-circled mock */}
            <path
              d="M 0,50 C 0,15 20,0 60,0 L 280,0 L 280,50 Z"
              fill="#ffffff"
            />
            <path
              d="M 0,50 C 0,15 20,0 60,0"
              stroke="#bae6fd"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>

          {/* Right Side: Flowing 3-Layer Ocean Waves (Exact match with screenshot) */}
          <svg
            className="absolute right-0 top-0 h-full w-[180px] sm:w-[260px] md:w-[320px] lg:w-[380px]"
            viewBox="0 0 380 50"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="footerRightL1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.75" />
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
            {/* Layer 1: Top Cyan Wave */}
            <path d="M 0,50 C 100,50 180,18 380,0 L 380,50 Z" fill="url(#footerRightL1)" />
            {/* Layer 2: Mid Ocean Blue Wave */}
            <path d="M 70,50 C 150,50 220,24 380,8 L 380,50 Z" fill="url(#footerRightL2)" />
            {/* Layer 3: Solid Ocean Blue Base */}
            <path d="M 140,50 C 200,50 260,32 380,18 L 380,50 Z" fill="url(#footerRightL3)" />
          </svg>
        </div>

        {/* ── Footer Bar Content ── */}
        <div className="relative z-10 w-full px-5 sm:px-8 lg:px-10 py-2 sm:py-2.5">
          <div className="mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
            {/* Left: Brand Circle Badge + Name + Copyright */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pl-1 sm:pl-3">
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
            <div className="hidden lg:flex items-center gap-6 text-slate-600 text-[11px] font-medium">
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
      </div>
    </footer>
  );
}














