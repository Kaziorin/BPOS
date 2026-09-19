"use client";

import { siteConfig } from "@/config/site";
import { Waves } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 w-full select-none z-20 overflow-hidden bg-transparent">
      {/* ── Dynamic Varying-Gap 3-Layer Ocean Waves ── */}
      <div className="relative w-full h-14 sm:h-15 flex items-end">
        {/* Full-Height Dynamic SVG Waves with Non-Uniform Gaps */}
        <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 90"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Layer 1: Bright Sky Cyan (Translucent Glowing Top Crest) */}
              <linearGradient id="dynamicWaveL1" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#7dd3fc" stopOpacity="0.85" />
                <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.75" />
              </linearGradient>

              {/* Layer 2: Vibrant Mid Ocean Blue */}
              <linearGradient id="dynamicWaveL2" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#0ea5e9" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#0284c7" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              {/* Layer 3: Deep Signature Ocean Blue Base */}
              <linearGradient id="dynamicWaveL3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>

            {/* ── 1. Top Wave: Dramatic high crests on left and right-center ── */}
            <path
              d="M 0,0 C 220,0 340,32 540,32 C 740,32 860,6 1060,8 C 1220,10 1340,22 1440,16 L 1440,90 L 0,90 Z"
              fill="url(#dynamicWaveL1)"
            />

            {/* ── 2. Middle Wave: Drops deeper in right-center for huge color flare gap ── */}
            <path
              d="M 0,16 C 200,18 400,26 620,28 C 840,30 960,46 1160,44 C 1280,42 1360,32 1440,28 L 1440,90 L 0,90 Z"
              fill="url(#dynamicWaveL2)"
            />

            {/* ── 3. Base Wave: Smooth baseline supporting text perfectly ── */}
            <path
              d="M 0,34 C 240,36 460,42 720,40 C 980,38 1220,44 1440,36 L 1440,90 L 0,90 Z"
              fill="url(#dynamicWaveL3)"
            />
          </svg>
        </div>

        {/* ── Footer Content ── */}
        <div className="relative z-10 w-full px-4 sm:px-8 pb-2 sm:pb-2.5 pt-3 text-white">
          <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-6 text-xs">
            {/* Left: Brand Icon + Name + Copyright */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 text-white backdrop-blur-xs shadow-2xs">
                  <Waves size={12} className="stroke-[2.5]" />
                </span>
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white drop-shadow-xs">
                  {siteConfig.name}
                </span>
              </div>

              <span className="text-sky-200/50 hidden sm:inline text-xs font-light">|</span>

              <span className="text-sky-100/95 text-[11px] sm:text-xs font-medium drop-shadow-2xs">
                &copy; {currentYear} {siteConfig.name}. All rights reserved.
              </span>
            </div>

            {/* Right: Tagline + Status Accent Icon */}
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










