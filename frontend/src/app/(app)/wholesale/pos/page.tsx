"use client";

import { Suspense } from "react";
import PosPage from "../../pos/page";

/**
 * Wholesale & B2B Dedicated POS Entry Point.
 * This ensures the URL is clean (/wholesale/pos) while reusing
 * the high-performance shared POS engine.
 */
export default function WholesalePOSPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Initializing Wholesale Register...</p>
        </div>
      </div>
    }>
      {/* Reusing the shared POS engine but forcing the wholesale vertical behavior */}
      <PosPage />
    </Suspense>
  );
}
