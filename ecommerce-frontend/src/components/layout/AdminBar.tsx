"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Sliders, LayoutTemplate, Store, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminBar() {
  const { isAdmin, adminUser, logout } = useAuth();
  const pathname = usePathname();

  if (!isAdmin || pathname === "/setup") return null;

  return (
    <>
      {/* Top Admin Sticky Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white border-b border-indigo-500/30 px-4 py-2 z-50 sticky top-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              <span>Owner / Admin Mode</span>
            </span>
            <span className="hidden md:inline text-slate-300">
              Logged in as <strong className="text-white">{adminUser?.name || adminUser?.email}</strong> ({adminUser?.role})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/setup"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-md transition-transform hover:scale-105"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize Store / Setup</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Quick Setup Trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href="/setup"
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold text-xs shadow-2xl transition-transform hover:scale-110 active:scale-95 border-2 border-white/20 backdrop-blur-md"
        >
          <Sliders className="w-4 h-4 animate-spin" style={{ animationDuration: "6s" }} />
          <span>Edit Page / Setup</span>
        </Link>
      </div>
    </>
  );
}
