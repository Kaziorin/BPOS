"use client";

import { siteConfig } from "@/config/site";
import { Waves } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 w-full select-none z-20 bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#075985] text-white border-t border-sky-400/30 shadow-md">
      <div className="w-full px-4 sm:px-6 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4 text-xs">
        {/* Left: Brand + Copyright */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-xs">
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-sm bg-white/20 text-white backdrop-blur-xs">
              <Waves size={11} className="stroke-[2.5]" />
            </span>
            <span>{siteConfig.name}</span>
          </div>

          <span className="text-sky-200/40 hidden sm:inline text-xs">|</span>

          <span className="text-sky-100/85 text-[11px]">
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </span>
        </div>

        {/* Right: Tagline + Accent */}
        <div className="flex items-center gap-2 text-sky-100/90 text-[11px] font-medium">
          <span>Smarter Business &bull; Better Tomorrow</span>
          <span className="flex items-center text-sky-200/80">
            <Waves size={12} className="stroke-[2.2]" />
          </span>
        </div>
      </div>
    </footer>
  );
}
