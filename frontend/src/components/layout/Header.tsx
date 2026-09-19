"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  ChevronDown,
  ShoppingCart,
  Building2,
  Search,
  Settings,
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { CommandPalette } from "./CommandPalette";
import { PosTerminalModal } from "./PosTerminalModal";

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [posModalOpen, setPosModalOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const Logo = siteConfig.logoIcon;

  useEffect(() => {
    const handleOpenPalette = () => setPaletteOpen(true);
    window.addEventListener("omni:open-command-palette", handleOpenPalette);
    return () => {
      window.removeEventListener("omni:open-command-palette", handleOpenPalette);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const isInsideMobile = mobileMenuRef.current?.contains(target);
      const isInsideDesktop = desktopMenuRef.current?.contains(target);
      if (!isInsideMobile && !isInsideDesktop) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format page title cleanly
  const cleanTitle =
    pathname === "/" || pathname === "/dashboard"
      ? "Dashboard"
      : pathname === "/retail-pos"
      ? "Retail POS"
      : pathname
          .split("/")
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "))
          .join(" / ");

  // Dynamic Role & Name from User / Database
  const displayRole = user?.roleName || user?.role || "Owner";
  const displayName = user?.name || "Super Administrator";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="relative flex h-16 shrink-0 items-center justify-between px-3 sm:px-4 md:px-6 z-30 select-none bg-transparent">
        {/* Dual Side Ocean Wave Curves Background */}
        <div className="pointer-events-none absolute inset-0 w-full h-full z-0 overflow-hidden">
          {/* Top-Left Ocean Blue Wave Curve (Behind Logo) */}
          <svg
            className="absolute left-0 top-0 h-full w-[320px] sm:w-[380px] md:w-[420px] lg:w-[450px]"
            viewBox="0 0 450 64"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="headerLeftWave" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="70%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            <path
              d="M 0,0 L 450,0 C 370,10 290,52 200,56 C 110,60 50,63 0,64 Z"
              fill="url(#headerLeftWave)"
            />
          </svg>

          {/* Top-Right Soft Sky/Ocean Blue Wave Curve */}
          <svg
            className="absolute right-0 top-0 h-full w-[240px] sm:w-[300px] md:w-[360px] lg:w-[400px]"
            viewBox="0 0 400 64"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="headerRightWave" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d="M 400,0 L 30,0 C 90,22 160,54 250,54 C 310,54 360,35 400,15 Z"
              fill="url(#headerRightWave)"
            />
          </svg>
        </div>

        {/* ── Mobile Layout (< lg) ── */}
        <div className="relative z-10 flex w-full items-center justify-between lg:hidden">
          {/* Mobile Left: Circular Hamburger + Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.dispatchEvent(new Event("omni:open-mobile-menu"))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0284c7] text-white hover:bg-[#0369a1] shadow-xs transition active:scale-95 cursor-pointer shrink-0 border border-white/40"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu size={16} className="stroke-[2.5]" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-white text-[#0284c7] border border-white/80 shadow-xs">
                <Logo size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-white text-xs tracking-tight leading-tight">{siteConfig.name}</span>
                <span className="text-[9px] text-sky-100/90 leading-tight">Smart • Fast • All Industries</span>
              </div>
            </Link>
          </div>

          {/* Mobile Right: Avatar Pill */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-sky-700 shadow-xs border border-white/80 hover:ring-2 hover:ring-white transition cursor-pointer"
              aria-label="User account menu"
            >
              {userInitial}
            </button>

            {/* Mobile Dropdown Menu */}
            {open && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-sky-100 bg-white p-2.5 shadow-2xl animate-[scale-in_140ms_ease-out]">
                <div className="flex items-center gap-2.5 rounded-lg bg-sky-50/80 border border-sky-100 p-2.5 mb-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-blue-500 text-xs font-bold text-white shadow-xs">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">{displayName}</p>
                    <p className="truncate text-[10.5px] text-sky-600">{user?.email || ""}</p>
                    <div className="mt-0.5">
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-sky-700 border border-sky-100 shadow-2xs">
                        <ShieldCheck size={10} className="mr-1 text-emerald-600" />
                        {displayRole}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5 text-xs">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                  >
                    <LayoutDashboard size={14} className="text-sky-600" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setPosModalOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={14} className="text-sky-600" />
                      <span>All POS Terminals</span>
                    </div>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700">
                      9 Modes
                    </span>
                  </button>
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                  >
                    <Settings size={14} className="text-sky-600" />
                    Store Settings
                  </Link>
                  <Link
                    href="/reports"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                  >
                    <FileText size={14} className="text-sky-600" />
                    Reports & Analytics
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white cursor-pointer shadow-2xs active:scale-95"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop Layout (lg+) ── */}
        <div className="relative z-10 hidden w-full items-center justify-between gap-3 lg:flex">
          {/* Left: Brand Logo Block (Over Ocean Blue Wave) + Circle Toggle + Branch Pill */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Brand Logo & Tagline Block */}
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 mr-2 group">
              <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl bg-white text-[#0284c7] border border-white/80 shadow-xs group-hover:scale-105 transition">
                <Logo size={20} />
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="font-bold text-white tracking-tight text-sm leading-tight drop-shadow-2xs">
                  {siteConfig.name}
                </span>
                <span className="text-[10px] text-sky-100/90 font-medium tracking-wide leading-tight">
                  Smart &bull; Fast &bull; All Industries
                </span>
              </div>
            </Link>

            {/* Circular Blue Hamburger Toggle Button */}
            <button
              onClick={() => window.dispatchEvent(new Event("bpos:toggle-sidebar"))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xs transition active:scale-95 cursor-pointer shrink-0 border border-white/40"
              title="Toggle Sidebar"
              aria-label="Toggle Sidebar"
            >
              <Menu size={16} className="stroke-[2.5]" />
            </button>

            {/* Branch / Terminal Pill Selector */}
            <div className="flex items-center gap-2 rounded-full border border-sky-100/80 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-white hover:border-sky-200 transition cursor-pointer">
              <Building2 size={14} className="text-[#0284c7] shrink-0" />
              <span className="text-slate-800 font-bold">Main Branch - Terminal-01</span>
              <ChevronDown size={13} className="text-slate-400 ml-0.5 shrink-0" />
            </div>
          </div>

          {/* Center: Global Search Pill */}
          <div className="flex-1 max-w-xs xl:max-w-md mx-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="w-full flex items-center gap-2.5 rounded-full border border-sky-100/80 bg-white/95 px-4.5 py-2 text-xs text-slate-600 shadow-xs hover:bg-white hover:border-sky-300 transition cursor-pointer group"
              title="Quick Search (Ctrl + K)"
            >
              <Search size={14} className="text-sky-600 group-hover:text-sky-700 shrink-0" />
              <span className="font-medium text-slate-400 truncate">Search pages, items, actions...</span>
            </button>
          </div>

          {/* Right: Quick POS Terminal Button + User Profile Pill */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick POS Terminal Action Button */}
            <button
              onClick={() => setPosModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0284c7] to-[#0369a1] px-4.5 py-2 text-xs font-bold text-white shadow-md shadow-sky-700/20 transition hover:brightness-105 active:scale-95 cursor-pointer shrink-0 border border-white/25"
              title="Access All POS Terminals"
            >
              <ShoppingCart size={14} className="stroke-[2.5]" />
              <span>POS Terminal</span>
              <ChevronDown size={13} className="opacity-80 ml-0.5 shrink-0" />
            </button>

            {/* User Profile Pill Card */}
            <div className="relative" ref={desktopMenuRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-2.5 rounded-full border border-sky-100/90 bg-white/95 pl-1.5 pr-3.5 py-1.5 shadow-xs transition hover:bg-white hover:border-sky-200 hover:shadow-md cursor-pointer",
                  open && "bg-white border-sky-400 ring-2 ring-sky-200"
                )}
                aria-expanded={open}
                aria-haspopup="true"
              >
                {/* Avatar Icon */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0284c7] text-xs font-bold text-white shadow-xs">
                  {userInitial}
                </div>

                {/* Name and Role */}
                <div className="text-left min-w-0 pr-0.5">
                  <p className="truncate text-xs font-bold text-slate-800 leading-tight">
                    {displayName}
                  </p>
                  <p className="truncate text-[10px] font-medium text-slate-400 leading-tight">
                    {displayRole}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronDown
                  size={13}
                  className={cn(
                    "text-slate-400 transition-transform shrink-0",
                    open && "rotate-180 text-sky-600"
                  )}
                />
              </button>

              {/* Desktop Profile Dropdown Card */}
              {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-sky-100 bg-white p-2.5 shadow-2xl animate-[scale-in_140ms_ease-out]">
                  <div className="flex items-center gap-3 rounded-lg bg-sky-50/80 border border-sky-100 p-3 mb-1.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-blue-500 text-xs font-bold text-white shadow-xs">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{displayName}</p>
                      <p className="truncate text-[11px] text-sky-600">{user?.email || ""}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[9.5px] font-bold text-sky-700 border border-sky-100 shadow-2xs">
                          <ShieldCheck size={10} className="mr-1 text-emerald-600" />
                          {displayRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium border-b border-slate-100 mb-1">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Building2 size={12} className="text-sky-600" /> Branch:
                    </span>
                    <span className="font-semibold text-slate-800">Main • Terminal-01</span>
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                    >
                      <LayoutDashboard size={14} className="text-sky-600" />
                      Dashboard
                    </Link>

                    <button
                      onClick={() => {
                        setOpen(false);
                        setPosModalOpen(true);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingCart size={14} className="text-sky-600" />
                        <span>All POS Terminals</span>
                      </div>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700">
                        9 Modes
                      </span>
                    </button>

                    <Link
                      href="/settings"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                    >
                      <Settings size={14} className="text-sky-600" />
                      Store Settings
                    </Link>

                    <Link
                      href="/reports"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                    >
                      <FileText size={14} className="text-sky-600" />
                      Reports & Analytics
                    </Link>

                    <button
                      onClick={() => {
                        setOpen(false);
                        setPaletteOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition text-left cursor-pointer"
                    >
                      <Search size={14} className="text-sky-600" />
                      Command Palette
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-2 mt-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        logout();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white cursor-pointer shadow-2xs active:scale-95"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
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

      {/* POS Terminals Hub Modal */}
      <PosTerminalModal isOpen={posModalOpen} onClose={() => setPosModalOpen(false)} />
    </>
  );
}
