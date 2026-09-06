"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, ShoppingCart, Package, Pill, Menu, X } from "lucide-react";
import { useDynamicNav, type NavItem, type NavChild } from "@/lib/dynamic-nav";
import { cn } from "@/lib/cn";

const PRIMARY: { label: string; href: string; icon: typeof LayoutDashboard }[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "POS", href: "/pos", icon: ShoppingCart },
  { label: "Pharmacy", href: "/pharmacy", icon: Pill },
  { label: "Stock", href: "/inventory/stock", icon: Package },
];

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

/** Mobile nav (§27): bottom bar for the register/quick screens + a drawer
 *  with the full dynamic menu. Visible below lg, where the Sidebar is hidden.
 *  `open`/`onOpenChange` let the Header hamburger drive the same drawer. */
export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const pathname = usePathname();
  const { navGroups, loading } = useDynamicNav();

  // Close drawer on navigation
  useEffect(() => { onOpenChange(false); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Bottom quick bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {PRIMARY.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                matchesPath(href, pathname) ? "text-primary-600" : "text-gray-500",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <button
            onClick={() => onOpenChange(true)}
            className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-gray-500"
          >
            <Menu size={18} />
            Menu
          </button>
        </div>
      </nav>

      {/* Full-menu drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
              <span className="text-sm font-semibold text-gray-900">All modules</span>
              <button onClick={() => onOpenChange(false)} className="rounded p-1 text-gray-400 hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {loading && <p className="px-3 py-6 text-center text-sm text-gray-400">Loading…</p>}
              {navGroups.map((group) => (
                <div key={group.title} className="mb-2">
                  <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const links = collect(item);
                      return (
                        <div key={item.label} className="rounded-xl">
                          {links.map((l) => (
                            <Link
                              key={l.href}
                              href={l.href}
                              className={cn(
                                "block rounded-lg px-3 py-2 text-sm",
                                matchesPath(l.href, pathname)
                                  ? "bg-primary-50 font-medium text-primary-700"
                                  : "text-gray-600 hover:bg-gray-50",
                              )}
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
