"use client";

import { siteConfig } from "@/config/site";
import { Waves } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 w-full select-none z-20 overflow-hidden bg-transparent">
      {/* ── Prominent 3-Layer Ocean Waves (Full Width with Consistent Height) ── */}
      <div className="relative w-full h-15 sm:h-16 flex items-end">
        {/* Full-Height Distinct 3-Layer SVG Curves */}
        <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 90"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Layer 1: Bright Sky Cyan Gradient */}
              <linearGradient id="distinctWaveL1" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>

              {/* Layer 2: Vibrant Mid Ocean Blue Gradient */}
              <linearGradient id="distinctWaveL2" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* Layer 3: Deep Navy Ocean Blue Gradient (Main Base) */}
              <linearGradient id="distinctWaveL3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#034d77" />
                <stop offset="50%" stopColor="#026197" />
                <stop offset="100%" stopColor="#034d77" />
              </linearGradient>
            </defs>

            {/* ── 1. Top Distinct Layer: Bright Sky Cyan (High Left Peak) ── */}
            <path
              d="M 0,0 C 220,6 460,26 740,26 C 1020,26 1240,16 1440,10 L 1440,90 L 0,90 Z"
              fill="url(#distinctWaveL1)"
            />

            {/* ── 2. Middle Distinct Layer: Vibrant Ocean Blue (14px Offset) ── */}
            <path
              d="M 0,14 C 240,18 480,38 760,38 C 1040,38 1260,28 1440,22 L 1440,90 L 0,90 Z"
              fill="url(#distinctWaveL2)"
            />

            {/* ── 3. Base Distinct Layer: Deep Ocean Navy (Main Base with Ample Text Space) ── */}
            <path
              d="M 0,28 C 260,30 500,50 780,50 C 1060,50 1280,40 1440,34 L 1440,90 L 0,90 Z"
              fill="url(#distinctWaveL3)"
            />
          </svg>
        </div>

        {/* ── Footer Text & Elements (Crystal Clear Typography) ── */}
        <div className="relative z-10 w-full px-4 sm:px-8 pb-2.5 sm:pb-3 pt-3 text-white">
          <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-6 text-xs">
            {/* Left: Brand Icon + Name + Copyright */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-white backdrop-blur-xs shadow-2xs">
                  <Waves size={12} className="stroke-[2.5]" />
                </span>
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white drop-shadow-xs">
                  {siteConfig.name}
                </span>
              </div>

              <span className="text-sky-300/50 hidden sm:inline text-xs font-light">|</span>

              <span className="text-sky-100/95 text-[11px] sm:text-xs font-medium drop-shadow-2xs">
                &copy; {currentYear} {siteConfig.name}. All rights reserved.
              </span>
            </div>

            {/* Right: Tagline + Status Waves Icon */}
            <div className="flex items-center gap-2 text-sky-100 text-[11px] sm:text-xs font-semibold drop-shadow-2xs">
              <span>Smarter Business &bull; Better Tomorrow</span>
              <span className="flex items-center text-sky-200">
                <Waves size={13} className="stroke-[2.5]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}








