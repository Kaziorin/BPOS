"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  ChevronDown,
  Menu,
  ShoppingCart,
  WifiOff,
  Building2,
  Sparkles,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { isOnline } from "@/lib/offline/db";
import { CommandPalette } from "./CommandPalette";

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOnline(isOnline());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    const handleOpenPalette = () => setPaletteOpen(true);
    window.addEventListener("omni:open-command-palette", handleOpenPalette);

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("omni:open-command-palette", handleOpenPalette);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format page title nicely
  const cleanTitle =
    pathname === "/" || pathname === "/dashboard"
      ? "Executive Dashboard"
      : pathname === "/retail-pos"
      ? "Retail POS"
      : pathname
          .split("/")
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "))
          .join(" / ");

  return (
    <>
      <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-sky-100 bg-white px-4 sm:px-6 shadow-sm z-20 text-slate-800 overflow-hidden">
        {/* Ocean Breeze subtle top gradient glow */}
        <div
          className="pointer-events-none absolute inset-0 w-full h-full z-0"
          style={{
            background: `
              radial-gradient(ellipse at 0% 0%, rgba(186, 230, 253, 0.50) 0%, transparent 50%),
              radial-gradient(ellipse at 100% 100%, rgba(125, 211, 252, 0.20) 0%, transparent 50%)
            `,
          }}
        />

        <div className="relative z-10 flex w-full items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => window.dispatchEvent(new Event("omni:open-mobile-menu"))}
              className="rounded-md p-2 text-slate-700 transition hover:bg-sky-100/60 hover:text-slate-900 lg:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>
            <div>
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg tracking-tight">
                {cleanTitle || siteConfig.name}
              </h1>
            </div>

            {/* Store / Branch Chip */}
            <div className="hidden items-center gap-1.5 rounded-md border border-sky-200/90 bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs md:flex">
              <Building2 size={12} className="text-[#0284C7]" />
              <span>Main Branch</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-normal">Terminal-01</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Global Search / Command Bar Trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-md border border-sky-200/90 bg-white/90 px-3 py-1.5 text-xs text-slate-700 hover:border-[#0284C7] hover:bg-white transition cursor-pointer shadow-2xs"
            >
              <Search size={14} className="text-[#0284C7]" />
              <span className="hidden sm:inline">Search pages, items, actions...</span>
              <span className="sm:hidden">Search</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-sky-100/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-800 border border-sky-200 shadow-2xs">
                Ctrl+K
              </kbd>
            </button>

            {/* Real-time Sync & Connectivity Status Indicator */}
            <div
              title={online ? "Connected to Backend & Cloud Sync" : "Offline mode active — transactions cached locally"}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition shadow-2xs",
                online
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
              )}
            >
              {online ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span className="hidden sm:inline">Live Sync</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} />
                  <span>Offline Mode</span>
                </>
              )}
            </div>

            {/* Quick POS action button if not already on POS screen */}
            {pathname !== "/retail-pos" && (
              <Link
                href="/retail-pos"
                className="hidden items-center gap-1.5 rounded-md bg-gradient-to-r from-[#38BDF8] via-[#0284C7] to-[#0369A1] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-sky-500/25 transition hover:brightness-105 sm:flex"
              >
                <ShoppingCart size={13} />
                <span>Express POS</span>
              </Link>
            )}

            {/* User profile dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md p-1 sm:px-2.5 sm:py-1.5 transition hover:bg-sky-100/60 cursor-pointer"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name || "Store Admin"}</p>
                  <p className="text-[11px] font-semibold text-[#0284C7]">{user?.role || "Administrator"}</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-[#38BDF8] to-[#0284C7] text-sm font-bold text-white shadow-xs">
                  {user?.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <ChevronDown
                  size={14}
                  className={cn("text-slate-600 transition-transform hidden sm:block", open && "rotate-180 text-sky-700")}
                />
              </button>

              {open && (
                <div className="absolute right-0 top-full z-30 mt-2 w-56 origin-top-right overflow-hidden rounded-md border border-sky-200/90 bg-white p-1.5 shadow-xl animate-[scale-in_140ms_ease-out]">
                  <div className="border-b border-sky-100 px-3.5 py-3 bg-sky-50/80 rounded-md mb-1">
                    <p className="truncate text-sm font-bold text-slate-900">{user?.name || "OmniPOS Admin"}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email || "admin@blueoceans.pos"}</p>
                    <span className="mt-1.5 inline-block rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
                      {user?.role || "Super Admin"}
                    </span>
                  </div>
                  <div className="p-1 space-y-0.5">
                    <Link
                      href="/settings"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50/80 hover:text-sky-950 transition"
                    >
                      <Building2 size={14} className="text-[#0284C7]" />
                      Store Settings
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50/80 hover:text-sky-950 transition"
                    >
                      <Sparkles size={14} className="text-[#0284C7]" />
                      Executive Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100/80 cursor-pointer"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
