"use client";

import { siteConfig } from "@/config/site";
import { Waves } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 w-full select-none z-20 overflow-hidden bg-transparent">
      {/* ── Layered Ocean Waves on Top of Footer ── */}
      <div className="relative w-full h-8 sm:h-10 pointer-events-none -mb-[1px]">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Wave Layer 1: Soft Cyan Translucent Back Wave */}
          <path
            d="M 0,32 C 240,8 480,48 720,24 C 960,0 1200,42 1440,20 L 1440,60 L 0,60 Z"
            fill="#38bdf8"
            fillOpacity="0.4"
          />

          {/* Wave Layer 2: Medium Ocean Blue Mid Wave */}
          <path
            d="M 0,40 C 320,18 640,48 960,28 C 1200,12 1360,38 1440,30 L 1440,60 L 0,60 Z"
            fill="#0ea5e9"
            fillOpacity="0.65"
          />

          {/* Wave Layer 3: Solid Ocean Blue Front Wave */}
          <path
            d="M 0,46 C 360,26 720,52 1080,36 C 1260,24 1380,44 1440,38 L 1440,60 L 0,60 Z"
            fill="#0284c7"
          />
        </svg>
      </div>

      {/* ── Main Ocean Blue Footer Bar ── */}
      <div className="w-full bg-[#0284c7] px-6 sm:px-12 py-3 sm:py-3.5 text-white shadow-lg">
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-6 text-xs">
          {/* Left: Brand Icon + Name + Copyright */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-sky-100 backdrop-blur-xs">
                <Waves size={13} className="stroke-[2.5]" />
              </span>
              <span className="font-bold text-sm tracking-tight">{siteConfig.name}</span>
            </div>

            <span className="text-sky-200/50 hidden sm:inline text-xs font-light">|</span>

            <span className="text-sky-100/90 text-xs font-normal">
              &copy; {currentYear} {siteConfig.name}. All rights reserved.
            </span>
          </div>

          {/* Right: Tagline + Ocean Waves Accent */}
          <div className="flex items-center gap-2 text-sky-100/95 text-xs font-medium">
            <span>Smarter Business &bull; Better Tomorrow</span>
            <span className="flex items-center text-sky-200 ml-1">
              <Waves size={14} className="stroke-[2.5]" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

