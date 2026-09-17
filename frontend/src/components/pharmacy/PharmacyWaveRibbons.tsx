"use client";

import React from "react";

export function PharmacyWaveRibbons() {
  return (
    <>
      {/* Ambient luminous glow on left & right */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 12% 25%, rgba(255, 255, 255, 0.20) 0%, transparent 55%), radial-gradient(ellipse at 88% 30%, rgba(255, 255, 255, 0.28) 0%, transparent 60%)",
        }}
      />

      {/* Silky Wave Ribbons Flowing from Center to Right */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-65"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1000 200"
      >
        <defs>
          <linearGradient id="pharmacyWave1" x1="30%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="35%" stopColor="#5EEAD4" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#99F6E4" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#CCFBF1" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="pharmacyWave2" x1="45%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#99F6E4" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {/* Wave 1: Flowing smooth organic wave rising from center toward right */}
        <path
          d="M 380,200 C 440,160 480,95 560,95 C 660,95 720,150 820,120 C 900,95 950,55 1020,45 L 1020,200 L 380,200 Z"
          fill="url(#pharmacyWave1)"
        />
        {/* Wave 2: Overlapping silky layer flowing across center-right */}
        <path
          d="M 430,200 C 490,140 540,75 620,80 C 720,85 780,140 880,105 C 940,85 980,60 1020,75 L 1020,200 L 430,200 Z"
          fill="url(#pharmacyWave2)"
        />
        {/* Crest shimmer curve */}
        <path
          d="M 490,115 C 540,82 590,80 640,85 C 720,95 790,135 870,110"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth="2"
          fill="none"
        />
      </svg>

      {/* Specular shimmer highlight near center wave peak */}
      <div
        className="pointer-events-none absolute left-[51%] top-[35%] h-1.5 w-1.5 rounded-full bg-white opacity-85"
        style={{
          boxShadow: "0 0 10px 3px rgba(255, 255, 255, 0.95)",
        }}
      />
    </>
  );
}
