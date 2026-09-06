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
      : pathname === "/pos"
      ? "POS / Retail Counter"
      : pathname
          .split("/")
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "))
          .join(" / ");

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 shadow-2xs z-20">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => window.dispatchEvent(new Event("omni:open-mobile-menu"))}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
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
          <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 md:flex">
            <Building2 size={12} className="text-primary-600" />
            <span>Main Branch</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-normal">Terminal-01</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Global Search / Command Bar Trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-100/80 transition"
          >
            <Search size={14} className="text-slate-400" />
            <span className="hidden sm:inline">Search pages, items, actions...</span>
            <span className="sm:hidden">Search</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 border border-slate-200 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          {/* Real-time Sync & Connectivity Status Indicator */}
          <div
            title={online ? "Connected to Backend & Cloud Sync" : "Offline mode active — transactions cached locally"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition",
              online
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                : "bg-amber-50 text-amber-700 border border-amber-200/70 animate-pulse"
            )}
          >
            {online ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
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
          {pathname !== "/pos" && (
            <Link
              href="/pos"
              className="hidden items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-primary-700 sm:flex"
            >
              <ShoppingCart size={13} />
              <span>Express POS</span>
            </Link>
          )}

          {/* User profile dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl p-1 sm:px-2.5 sm:py-1.5 transition hover:bg-slate-100"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name || "Store Admin"}</p>
                <p className="text-[11px] font-medium text-primary-700">{user?.role || "Administrator"}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 text-sm font-bold text-white shadow-xs">
                {user?.name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <ChevronDown
                size={14}
                className={cn("text-slate-400 transition-transform hidden sm:block", open && "rotate-180")}
              />
            </button>

            {open && (
              <div className="absolute right-0 top-full z-30 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-[scale-in_140ms_ease-out]">
                <div className="border-b border-slate-100 px-3.5 py-3 bg-slate-50/70 rounded-xl mb-1">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.name || "OmniPOS Admin"}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || "admin@blueoceans.pos"}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700 border border-primary-200/50">
                    {user?.role || "Super Admin"}
                  </span>
                </div>
                <div className="p-1 space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Building2 size={14} className="text-slate-400" />
                    Store Settings
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Sparkles size={14} className="text-primary-600" />
                    Executive Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 rounded-lg bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
