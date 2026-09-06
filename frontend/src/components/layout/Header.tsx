"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, ChevronDown, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { navGroups } from "@/lib/nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/** Best page title for the current route — exact match first, then the
 *  longest matching prefix (nested routes inherit their section label). */
function useCurrentTitle() {
  const pathname = usePathname();
  let best = "";
  let bestLen = -1;
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href === pathname) return item.label;
      if (item.href !== "#" && pathname.startsWith(item.href + "/") && item.href.length > bestLen) {
        best = item.label;
        bestLen = item.href.length;
      }
    }
  }
  // Route-level fallbacks for pages not in the static nav (register screens etc.)
  const routes: Record<string, string> = {
    "/pos": "POS / New Sale",
    "/pharmacy": "Pharmacy Register",
    "/customer-display": "Customer Display",
  };
  for (const [href, label] of Object.entries(routes)) {
    if (pathname === href || pathname.startsWith(href + "/")) return label;
  }
  return best || siteConfig.name;
}

export function Header() {
  const { user, logout } = useAuth();
  const title = useCurrentTitle();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* Mobile menu button — opens the drawer (Sidebar is hidden below lg) */}
        <button
          onClick={() => window.dispatchEvent(new Event("omni:open-mobile-menu"))}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">{title}</h1>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-gray-50"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <ChevronDown
            size={15}
            className={cn("text-gray-400 transition-transform", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-20 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg animate-[scale-in_140ms_ease-out]">
            <div className="border-b border-gray-100 px-3.5 py-2.5">
              <p className="truncate text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
