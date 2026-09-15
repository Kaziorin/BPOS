"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Search,
  ChevronUp,
  LayoutDashboard,
  ShoppingCart,
  Settings,
  FileText,
  LogOut,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { useDynamicNav, type NavItem, type NavChild } from "@/lib/dynamic-nav";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

function matchesPath(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function collect(item: NavItem): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  if (item.href && item.href !== "#" && item.href !== "/") out.push({ label: item.label, href: item.href });
  const walk = (children: NavChild[] | undefined) => {
    for (const c of children ?? []) {
      if (c.href && c.href !== "#") out.push({ label: c.label, href: c.href });
      walk(c.children);
    }
  };
  walk(item.children);
  return out;
}

/** Mobile nav: bottom bar for small screens (Menu on Left, Search in Center, Profile on Right)
 *  + left-opening drawer with full modules list and prominent logout. */
export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { navGroups, loading } = useDynamicNav();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const Logo = siteConfig.logoIcon;

  // Role display
  const displayRole =
    user?.roleName ||
    (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user?.role || "Super Admin");

  // Close drawer & profile dropdown on navigation
  useEffect(() => {
    onOpenChange(false);
    setProfileOpen(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Handle click outside profile dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Bottom bar on smaller screens (<lg): Left: Menu, Center: Search, Right: Profile Card */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sky-100 bg-white/95 backdrop-blur-md px-3 py-2 flex items-center justify-between gap-2 lg:hidden shadow-lg select-none">
        {/* Left: Sidebar / Menu Open Button */}
        <button
          onClick={() => onOpenChange(true)}
          className="flex items-center gap-1.5 rounded-md border border-sky-200/90 bg-sky-50/70 px-3 py-2 text-xs font-bold text-[#0284C7] hover:bg-[#E0F2FE] hover:text-[#0369A1] transition cursor-pointer shadow-2xs"
          aria-label="Open navigation drawer"
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>

        {/* Center: Search Button */}
        <button
          onClick={() => window.dispatchEvent(new Event("omni:open-command-palette"))}
          className="flex items-center gap-1.5 rounded-md border border-sky-200/90 bg-sky-50/50 px-3 py-2 text-xs font-semibold text-[#0284C7] hover:bg-[#E0F2FE] transition cursor-pointer shadow-2xs"
          aria-label="Search pages and items"
        >
          <Search size={15} />
          <span>Search</span>
        </button>

        {/* Right: Profile Card Button with Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-md border border-sky-200/90 bg-white/95 px-2.5 py-1.5 shadow-2xs hover:bg-[#E0F2FE] hover:border-[#0284C7] transition cursor-pointer",
              profileOpen && "bg-[#E0F2FE] border-[#0284C7]"
            )}
            aria-expanded={profileOpen}
            aria-label="User profile and settings"
          >
            {/* Avatar first */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-xs font-bold text-white shadow-2xs border border-white/60">
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            {/* Name and Role */}
            <div className="text-left min-w-0 max-w-[85px] xs:max-w-[120px]">
              <p className="truncate text-xs font-bold text-[#0369A1] leading-tight">
                {user?.name || "Admin"}
              </p>
              <p className="truncate text-[9.5px] font-semibold text-[#0284C7] leading-tight">
                {displayRole}
              </p>
            </div>
            <ChevronUp
              size={13}
              className={cn("text-[#0284C7] transition-transform shrink-0", profileOpen && "rotate-180 text-[#0369A1]")}
            />
          </button>

          {/* Mobile Profile Dropdown Card (Pops Upwards Above the Bottom Bar) */}
          {profileOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-64 origin-bottom-right rounded-md border border-sky-200/90 bg-white p-2 shadow-2xl z-50 animate-[scale-in_140ms_ease-out]">
              {/* Profile Header */}
              <div className="flex items-center gap-2.5 rounded-md bg-[#E0F2FE]/70 border border-sky-100 p-2.5 mb-1.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-xs font-bold text-white shadow-xs border border-white/80">
                  {user?.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-bold text-[#0369A1]">{user?.name || "Store Admin"}</p>
                  <p className="truncate text-[10.5px] text-[#0284C7]">{user?.email || "admin@blueoceans.pos"}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[9px] font-bold text-[#0284C7] border border-sky-200 shadow-2xs">
                      <ShieldCheck size={10} className="mr-1 text-emerald-600" />
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-0.5 text-xs">
                <Link
                  href="/dashboard"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 font-semibold text-[#0369A1] hover:bg-[#E0F2FE] hover:text-[#0284C7] transition"
                >
                  <LayoutDashboard size={14} className="text-[#0284C7]" />
                  Dashboard
                </Link>
                <Link
                  href="/retail-pos"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 font-semibold text-[#0369A1] hover:bg-[#E0F2FE] hover:text-[#0284C7] transition"
                >
                  <ShoppingCart size={14} className="text-[#0284C7]" />
                  Retail POS Screen
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 font-semibold text-[#0369A1] hover:bg-[#E0F2FE] hover:text-[#0284C7] transition"
                >
                  <Settings size={14} className="text-[#0284C7]" />
                  Store Settings
                </Link>
                <Link
                  href="/reports"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 font-semibold text-[#0369A1] hover:bg-[#E0F2FE] hover:text-[#0284C7] transition"
                >
                  <FileText size={14} className="text-[#0284C7]" />
                  Reports & Analytics
                </Link>
              </div>

              {/* Prominent Logout Button */}
              <div className="border-t border-sky-100 pt-2 mt-1.5">
                <button
                  onClick={logout}
                  className="flex w-full items-center justify-between gap-2 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <LogOut size={15} />
                    <span>Sign Out / Logout</span>
                  </div>
                  <span className="text-[10px] font-medium opacity-80">Exit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Full-menu drawer: Opens from LEFT (left-0, slide-right) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden animate-[fade-in_150ms_ease-out]">
          <div className="absolute inset-0 bg-sky-950/40 backdrop-blur-xs" onClick={() => onOpenChange(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl animate-[slide-right_200ms_ease-out]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-sky-100 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-4 py-3.5 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/20 border border-white/40 shadow-2xs">
                  <Logo size={18} className="text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold truncate leading-tight">{siteConfig.name}</span>
                  <span className="text-[10px] text-sky-100 font-medium">Navigation Menu</span>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* User Profile Card Inside Drawer */}
            <div className="border-b border-sky-100 bg-[#E0F2FE]/50 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-xs font-bold text-white shadow-2xs border border-white/80">
                  {user?.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-xs font-bold text-[#0369A1]">
                    {user?.name || "Store Admin"}
                  </span>
                  <span className="truncate text-[10.5px] text-[#0284C7] font-semibold">
                    {displayRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
              {loading && (
                <p className="px-3 py-6 text-center text-xs font-semibold text-[#0284C7]">
                  Loading modules…
                </p>
              )}
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <p className="px-2.5 text-[10px] font-bold uppercase tracking-widest text-[#0369A1]">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const links = collect(item);
                      return (
                        <div key={item.label} className="space-y-0.5">
                          {links.map((l) => {
                            const active = matchesPath(l.href, pathname);
                            return (
                              <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => onOpenChange(false)}
                                className={cn(
                                  "block rounded-md px-3 py-2 text-xs transition-colors",
                                  active
                                    ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] font-bold text-white shadow-2xs"
                                    : "text-[#0284C7] font-semibold hover:bg-[#E0F2FE] hover:text-[#0369A1]",
                                )}
                              >
                                {l.label}
                              </Link>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer with Branch Info & Logout Button */}
            <div className="border-t border-sky-100 bg-sky-50/50 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-[#0369A1] font-semibold">
                <Building2 size={13} className="text-[#0284C7]" />
                <span>Main Branch</span>
                <span className="text-sky-300">•</span>
                <span className="text-[#0284C7] font-normal">Terminal-01</span>
              </div>
              <button
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-rose-50 border border-rose-200 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white cursor-pointer shadow-2xs"
              >
                <LogOut size={14} />
                <span>Sign Out / Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
