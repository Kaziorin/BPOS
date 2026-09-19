"use client";

import { siteConfig } from "@/config/site";
import { Waves } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 w-full select-none z-20 overflow-hidden bg-transparent">
      {/* ── Prominent Light & Dark Ocean Waves Container ── */}
      <div className="relative w-full h-13 sm:h-14 flex items-end">
        {/* Full-Height Layered SVG Background */}
        <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 70"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Light Curve: Bright Sky & Cyan Gradient */}
              <linearGradient id="footerLightCurve" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.9" />
              </linearGradient>

              {/* Mid Curve: Vibrant Blue Gradient */}
              <linearGradient id="footerMidCurve" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="60%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              {/* Dark Curve: Deep Rich Ocean Navy Blue */}
              <linearGradient id="footerDarkCurve" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="45%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>
            </defs>

            {/* 1. Prominent Light Sky Wave (Sweeps high and creates visible light contrast) */}
            <path
              d="M 0,28 C 240,4 520,44 860,12 C 1080,-8 1260,26 1440,10 L 1440,70 L 0,70 Z"
              fill="url(#footerLightCurve)"
            />

            {/* 2. Vibrant Mid Ocean Blue Wave */}
            <path
              d="M 0,36 C 280,14 580,45 920,20 C 1140,4 1320,30 1440,20 L 1440,70 L 0,70 Z"
              fill="url(#footerMidCurve)"
            />

            {/* 3. Deep Dark Ocean Blue Wave (Main base) */}
            <path
              d="M 0,44 C 340,22 680,48 1020,28 C 1220,16 1360,36 1440,28 L 1440,70 L 0,70 Z"
              fill="url(#footerDarkCurve)"
            />
          </svg>
        </div>

        {/* ── Footer Text & Elements (Over Dark Blue Base) ── */}
        <div className="relative z-10 w-full px-4 sm:px-8 pb-1.5 sm:pb-2 pt-2 text-white">
          <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 text-xs">
            {/* Left: Brand Wave Icon + Name + Copyright */}
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-xs">
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-xs bg-white/20 text-sky-100 backdrop-blur-xs shadow-2xs">
                  <Waves size={11} className="stroke-[2.5]" />
                </span>
                <span className="font-bold text-xs tracking-tight text-white drop-shadow-2xs">{siteConfig.name}</span>
              </div>

              <span className="text-sky-200/50 hidden sm:inline text-xs font-light">|</span>

              <span className="text-sky-100/95 text-[11px] font-normal">
                &copy; {currentYear} {siteConfig.name}. All rights reserved.
              </span>
            </div>

            {/* Right: Tagline + Accent Icon */}
            <div className="flex items-center gap-1.5 text-sky-100/95 text-[11px] font-medium">
              <span>Smarter Business &bull; Better Tomorrow</span>
              <span className="flex items-center text-sky-200 ml-0.5">
                <Waves size={12} className="stroke-[2.5]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}






