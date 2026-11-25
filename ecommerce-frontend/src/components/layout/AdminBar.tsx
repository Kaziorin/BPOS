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
      <div className="bg-slate-950 text-slate-300 border-b border-slate-800 px-4 py-2 z-50 sticky top-0">
        <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide">
              Admin mode
            </span>
            <span className="hidden md:inline text-slate-400">
              Logged in as <strong className="text-slate-200 font-semibold">{adminUser?.name || adminUser?.email}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/setup"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-medium transition-colors"
            >
              <Sliders className="w-3 h-3" />
              <span>Customize store</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
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
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white font-medium text-xs shadow-lg hover:bg-slate-800 border border-slate-700 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span>Customize store</span>
        </Link>
      </div>
    </>
  );
}
