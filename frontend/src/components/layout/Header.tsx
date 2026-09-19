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

  // Format page title cleanly ("Dashboard" instead of "Executive Dashboard")
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

  // Dynamic Role from User / Database
  const displayRole = user?.roleName || user?.role || "Staff";

  return (
    <>
      <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-brand-light bg-white px-3 sm:px-4 md:px-6 shadow-2xs z-30 select-none">
        {/* Dynamic theme ambient glow */}
        <div
          className="pointer-events-none absolute inset-0 w-full h-full z-0 overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 0% 0%, var(--theme-primary-100, #bae6fd) 0%, transparent 50%),
              radial-gradient(ellipse at 100% 100%, var(--theme-primary-200, #7dd3fc) 0%, transparent 50%)
            `,
            opacity: 0.45,
          }}
        />

        {/* ── Mobile Layout (< lg) ── */}
        <div className="relative z-10 flex w-full items-center justify-between lg:hidden">
          {/* Mobile Left: Hamburger + Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event("omni:open-mobile-menu"))}
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-brand-border bg-brand-50/70 text-brand-primary hover:bg-brand-100 hover:border-brand-primary hover:text-brand-dark transition shadow-2xs cursor-pointer shrink-0"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu size={18} className="stroke-[2.2]" />
            </button>
            <Link href="/dashboard" className="flex items-center">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-white border border-white/60 shadow-2xs">
                <Logo size={19} />
              </div>
            </Link>
          </div>

          {/* Mobile Center: Page Name */}
          <div className="flex-1 text-center px-2 min-w-0">
            <h1 className="truncate text-base font-bold text-brand-dark tracking-tight">
              {cleanTitle || siteConfig.name}
            </h1>
          </div>

          {/* Mobile Right: ONLY Avatar Icon (Click opens dropdown) */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-xs font-bold text-white shadow-2xs border border-white/60 hover:ring-2 hover:ring-brand-primary transition cursor-pointer"
              aria-label="User account menu"
            >
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </button>

            {/* Mobile Dropdown Menu (Pops Down from Avatar) */}
            {open && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-sm border border-brand-border bg-white p-2 shadow-2xl animate-[scale-in_140ms_ease-out]">
                {/* Profile Header */}
                <div className="flex items-center gap-2.5 rounded-sm bg-brand-50 border border-brand-light p-2.5 mb-1.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-xs font-bold text-white shadow-xs border border-white/80">
                    {user?.name?.[0]?.toUpperCase() ?? "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-bold text-brand-dark">{user?.name || "Store Admin"}</p>
                    <p className="truncate text-[10.5px] text-brand-primary">{user?.email || ""}</p>
                    <div className="mt-0.5">
                      <span className="inline-flex items-center rounded-sm bg-white px-1.5 py-0.5 text-[9px] font-bold text-brand-primary border border-brand-border shadow-2xs">
                        <ShieldCheck size={10} className="mr-1 text-emerald-600" />
                        {displayRole}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-0.5 text-xs">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 font-semibold text-brand-dark hover:bg-brand-100 hover:text-brand-primary transition"
                  >
                    <LayoutDashboard size={14} className="text-brand-primary" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setPosModalOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 font-semibold text-brand-dark hover:bg-brand-100 hover:text-brand-primary transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={14} className="text-brand-primary" />
                      <span>All POS Terminals</span>
                    </div>
                    <span className="rounded-sm bg-brand-100 px-1.5 py-0.5 text-[9.5px] font-bold text-brand-primary">
                      9 Modes
                    </span>
                  </button>
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 font-semibold text-brand-dark hover:bg-brand-100 hover:text-brand-primary transition"
                  >
                    <Settings size={14} className="text-brand-primary" />
                    Store Settings
                  </Link>
                  <Link
                    href="/reports"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 font-semibold text-brand-dark hover:bg-brand-100 hover:text-brand-primary transition"
                  >
                    <FileText size={14} className="text-brand-primary" />
                    Reports & Analytics
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="border-t border-brand-light pt-2 mt-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-sm bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white cursor-pointer shadow-2xs active:scale-95"
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
        <div className="relative z-10 hidden w-full items-center justify-between gap-4 lg:flex">
          {/* Desktop Left: Hamburger Toggle + Page Title + Branch Badge */}
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => window.dispatchEvent(new Event("bpos:toggle-sidebar"))}
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-brand-border bg-brand-50/70 text-brand-primary hover:bg-brand-100 hover:border-brand-primary hover:text-brand-dark transition shadow-2xs cursor-pointer shrink-0"
              title="Toggle Sidebar (Collapse / Expand)"
              aria-label="Toggle Sidebar"
            >
              <Menu size={18} className="stroke-[2.2]" />
            </button>

            <h1 className="truncate text-base font-bold text-brand-dark sm:text-lg tracking-tight">
              {cleanTitle || siteConfig.name}
            </h1>

            {/* Store / Branch Badge */}
            <div className="hidden items-center gap-1.5 rounded-sm border border-brand-border bg-brand-50/60 px-2.5 py-1 text-xs font-semibold text-brand-dark shadow-2xs xl:flex">
              <Building2 size={12} className="text-brand-primary" />
              <span>Main Branch</span>
              <span className="text-brand-accent">•</span>
              <span className="text-brand-primary font-normal">Terminal-01</span>
            </div>
          </div>

          {/* Desktop Right: Search + POS Shortcut + Profile Card */}
          <div className="flex items-center gap-3">
            {/* Global Search Button */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-sm border border-brand-border bg-brand-50/50 px-3 py-1.5 text-xs text-brand-primary hover:border-brand-primary hover:bg-brand-100 transition cursor-pointer shadow-2xs"
              title="Search"
            >
              <Search size={14} className="text-brand-primary shrink-0" />
              <span className="font-medium">Search pages, items, actions...</span>
            </button>

            {/* Quick POS action button - Opens All POS Terminals */}
            <button
              onClick={() => setPosModalOpen(true)}
              className="flex items-center gap-1.5 rounded-sm bg-brand-gradient px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:brightness-105 cursor-pointer"
              title="Access All POS Terminals & Counters"
            >
              <ShoppingCart size={13} />
              <span>POS Terminals</span>
              <ChevronDown size={12} className="opacity-80 ml-0.5" />
            </button>

            {/* Desktop User Profile Card (Avatar first, then Name & Role, Dropdown on click) */}
            <div className="relative" ref={desktopMenuRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-sm border border-brand-border bg-white/95 px-2.5 py-1.5 shadow-2xs transition hover:bg-brand-50 hover:border-brand-primary cursor-pointer",
                  open && "bg-brand-50 border-brand-primary ring-2 ring-brand-border/40"
                )}
                aria-expanded={open}
                aria-haspopup="true"
              >
                {/* 1. Avatar icon FIRST */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-xs font-bold text-white shadow-2xs border border-white/60">
                  {user?.name?.[0]?.toUpperCase() ?? "A"}
                </div>

                {/* 2. Then Name and Role */}
                <div className="text-left min-w-0 max-w-[140px] xl:max-w-[180px]">
                  <p className="truncate text-xs font-bold text-brand-dark leading-tight">
                    {user?.name || "Store Admin"}
                  </p>
                  <p className="truncate text-[10.5px] font-semibold text-brand-primary leading-tight">
                    {displayRole}
                  </p>
                </div>

                {/* 3. Chevron indicator */}
                <ChevronDown
                  size={14}
                  className={cn(
                    "text-brand-primary transition-transform shrink-0",
                    open && "rotate-180 text-brand-dark"
                  )}
                />
              </button>

              {/* Desktop Profile Dropdown Card */}
              {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-sm border border-brand-border bg-white p-2 shadow-2xl animate-[scale-in_140ms_ease-out]">
                  {/* User Profile Header Card */}
                  <div className="flex items-center gap-3 rounded-sm bg-brand-50 border border-brand-light p-3 mb-1.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-sm font-bold text-white shadow-xs border border-white/80">
                      {user?.name?.[0]?.toUpperCase() ?? "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-brand-dark">{user?.name || "Store Admin"}</p>
                      <p className="truncate text-[11px] text-brand-primary">{user?.email || ""}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-sm bg-white px-2 py-0.5 text-[9.5px] font-bold text-brand-primary border border-brand-border shadow-2xs">
                          <ShieldCheck size={10} className="mr-1 text-emerald-600" />
                          {displayRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Branch / Terminal Context */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-brand-primary font-medium border-b border-brand-light mb-1">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Building2 size={12} className="text-brand-primary" /> Branch:
                    </span>
                    <span className="font-semibold text-brand-dark">Main • Terminal-01</span>
                  </div>

                  {/* Quick Action Navigation Links */}
                  <div className="space-y-0.5">
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-xs font-semibold text-brand-dark hover:bg-brand-100 hover:text-brand-primary transition"
                    >
                      <LayoutDashboard size={14} className="text-brand-primary" />
                      Dashboard
                    </Link>

                    <button
                      onClick={() => {
                        setOpen(false);
                        setPosModalOpen(true);
                      }}
                      className="flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-xs font-semibold text-brand-dark hover:bg-brand-100 hover:text-brand-primary transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingCart size={14} className="text-brand-primary" />
                        <span>All POS Terminals</span>
                      </div>
                      <span className="rounded-sm bg-brand-100 px-1.5 py-0.5 text-[9.5px] font-bold text-brand-primary">
                        9 Modes
                      </span>
                    </button>

                    <Link
                      href="/settings"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-xs font-semibold text-brand-dark hover:bg-brand-100 hover:text-brand-primary transition"
                    >
                      <Settings size={14} className="text-brand-primary" />
                      Store Settings
                    </Link>

                    <Link
                      href="/reports"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-xs font-semibold text-brand-dark hover:bg-brand-100 hover:text-brand-primary transition"
                    >
                      <FileText size={14} className="text-brand-primary" />
                      Reports & Analytics
                    </Link>

                    <button
                      onClick={() => {
                        setOpen(false);
                        setPaletteOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-xs font-semibold text-brand-dark hover:bg-brand-100 hover:text-brand-primary transition text-left cursor-pointer"
                    >
                      <Search size={14} className="text-brand-primary" />
                      Command Palette
                    </button>
                  </div>

                  {/* Sign Out Button - Highly visible and prominent */}
                  <div className="border-t border-brand-light pt-2 mt-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        logout();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-sm bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white cursor-pointer shadow-2xs active:scale-95"
                    >
                      <LogOut size={15} />
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

      {/* POS Terminals & Live Counters Hub Modal */}
      <PosTerminalModal isOpen={posModalOpen} onClose={() => setPosModalOpen(false)} />
    </>
  );
}
