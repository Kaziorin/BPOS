"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  Building2,
  Loader2,
} from "lucide-react";
import { useDynamicNav, type NavItem, type NavChild } from "@/lib/dynamic-nav";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { CustomInput } from "@/components/custom/CustomInput";

// ─── Smart Route Active Helper ────────────────────────────────────────

function normalizeRoute(route: string): { path: string; query: string } {
  if (!route) return { path: "", query: "" };
  const [path, query] = route.split("?");
  return { path: path.replace(/\/$/, ""), query: query || "" };
}

function getFullCurrentPath(pathname: string): string {
  if (typeof window === "undefined") return pathname;
  return pathname + (window.location.search || "");
}

function isRouteActive(href: string, pathname: string, allHrefs: Set<string>): boolean {
  if (!href || href === "#") return false;

  const currentFull = getFullCurrentPath(pathname);
  const currentNorm = normalizeRoute(currentFull);
  const hrefNorm = normalizeRoute(href);

  if (hrefNorm.query) {
    return currentNorm.path === hrefNorm.path && currentNorm.query === hrefNorm.query;
  }

  if (currentNorm.path === hrefNorm.path) {
    return true;
  }

  if (currentNorm.path.startsWith(hrefNorm.path + "/")) {
    return true;
  }

  return false;
}

function isModuleActive(item: NavItem, pathname: string, allHrefs: Set<string>): boolean {
  if (isRouteActive(item.href, pathname, allHrefs)) return true;
  return (item.children ?? []).some(
    (c) =>
      isRouteActive(c.href, pathname, allHrefs) ||
      (c.children ?? []).some((s) => isRouteActive(s.href, pathname, allHrefs))
  );
}

function isChildActive(child: NavChild, pathname: string, allHrefs: Set<string>): boolean {
  if (isRouteActive(child.href, pathname, allHrefs)) return true;
  return (child.children ?? []).some((s) => isRouteActive(s.href, pathname, allHrefs));
}

/**
 * MobileNav:
 * 1. Bottom bar: ONLY Menu On/Off button + Search button.
 * 2. Full Drawer: Opens from LEFT with the EXACT SAME module/submenu flow as the big screen sidebar.
 */
export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { navGroups, loading } = useDynamicNav();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const Logo = siteConfig.logoIcon;

  // Dynamic Role from User / Database
  const displayRole = user?.roleName || user?.role || "Staff";

  // Collect all hrefs for route checking
  const allHrefs = useMemo(() => {
    const set = new Set<string>();
    for (const g of navGroups) {
      for (const item of g.items) {
        if (item.href && item.href !== "#") set.add(item.href);
        for (const c of item.children ?? []) {
          if (c.href && c.href !== "#") set.add(c.href);
          for (const s of c.children ?? []) {
            if (s.href && s.href !== "#") set.add(s.href);
          }
        }
      }
    }
    return set;
  }, [navGroups]);

  // Auto-expand active modules on navigation
  useEffect(() => {
    let activeMod: string | null = null;
    let activeItem: string | null = null;

    for (const group of navGroups) {
      for (const item of group.items) {
        if (isModuleActive(item, pathname, allHrefs)) {
          activeMod = item.label;
          for (const child of item.children ?? []) {
            if (isChildActive(child, pathname, allHrefs)) {
              activeItem = child.label;
              break;
            }
          }
          break;
        }
      }
      if (activeMod) break;
    }

    if (activeMod) {
      setExpandedModules(new Set([activeMod]));
      if (activeItem) setExpandedItems(new Set([activeItem]));
    }
  }, [pathname, navGroups, allHrefs]);

  // Toggle Module accordion: strictly only ONE module open at any time
  const toggleModule = (label: string) => {
    setExpandedModules((prev) => {
      const next = new Set<string>();
      if (!prev.has(label)) {
        next.add(label);
      }
      setExpandedItems(new Set<string>());
      return next;
    });
  };

  // Toggle Sub-child accordion: strictly only ONE sub-child open at any time
  const toggleItem = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set<string>();
      if (!prev.has(label)) {
        next.add(label);
      }
      return next;
    });
  };

  // Filter modules based on search
  const filteredNavGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const q = searchQuery.toLowerCase();

    return navGroups
      .map((group) => {
        const matchingItems = group.items
          .map((item) => {
            const matchesItem = item.label.toLowerCase().includes(q);
            const matchingChildren = (item.children ?? []).filter(
              (c) =>
                c.label.toLowerCase().includes(q) ||
                (c.children ?? []).some((s) => s.label.toLowerCase().includes(q))
            );

            if (matchesItem || matchingChildren.length > 0) {
              return {
                ...item,
                children: matchingChildren.length > 0 ? matchingChildren : item.children,
              };
            }
            return null;
          })
          .filter(Boolean) as NavItem[];

        return { ...group, items: matchingItems };
      })
      .filter((g) => g.items.length > 0);
  }, [navGroups, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Bottom Bar on Smaller Screens (< lg) ── */}
      {/* Icon button for Menu on Left + Search bar taking full remaining width */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-light bg-white/95 backdrop-blur-md px-3 py-2 flex items-center gap-2.5 lg:hidden shadow-lg select-none">
        {/* Left: Menu On/Off Icon Button */}
        <button
          onClick={() => onOpenChange(!open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-brand-border bg-brand-50 text-brand-primary hover:bg-brand-100 hover:text-brand-dark transition cursor-pointer shadow-2xs"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          title={open ? "Close navigation menu" : "Open navigation menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Right: Search Bar Taking Full Remaining Width */}
        <button
          onClick={() => window.dispatchEvent(new Event("omni:open-command-palette"))}
          className="flex flex-1 h-10 items-center justify-between gap-2 px-3.5 rounded-sm border border-brand-border bg-white text-xs text-slate-500 hover:bg-brand-50 hover:border-brand-primary transition cursor-pointer shadow-none min-w-0"
          aria-label="Search pages and items"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search size={15} className="text-brand-primary shrink-0" />
            <span className="truncate font-medium text-slate-600">Search pages, items, actions...</span>
          </div>
        </button>
      </nav>

      {/* ── Full-Menu Drawer (Opens from the LEFT) ── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden animate-[fade-in_150ms_ease-out]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => onOpenChange(false)}
          />

          {/* Drawer Container (left-0, slides in from left) */}
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs sm:max-w-sm flex-col bg-white shadow-2xl animate-[slide-right_200ms_ease-out]">
            {/* Drawer Brand Header */}
            <div className="flex items-center justify-between border-b border-brand-light bg-white px-4 py-3.5">
              <Link
                href="/dashboard"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 min-w-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-white border border-white/60 shadow-2xs">
                  <Logo size={19} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-bold text-brand-dark tracking-tight text-sm">
                    {siteConfig.name}
                  </span>
                  <span className="truncate text-[10px] text-brand-primary font-semibold tracking-wide">
                    Smart · Fast · All Industries
                  </span>
                </div>
              </Link>
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition cursor-pointer shadow-2xs"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Menu Search Box (same as big screen sidebar) */}
            <div className="px-3 pt-3 pb-1 border-b border-brand-light">
              <div className="relative flex items-center">
                <Search size={14} className="pointer-events-none absolute left-3 text-brand-primary" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-sm border border-brand-border bg-white pl-9 pr-8 py-1.5 text-xs text-gray-600 placeholder:text-slate-400 outline-none focus:outline-none focus:border-brand-primary focus:ring-0 shadow-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-slate-400 hover:text-gray-600 transition cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Groups & Modules (Same flow as big screen sidebar) */}
            <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1 no-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 size={20} className="animate-spin text-brand-primary" />
                  <span className="text-xs font-medium">Loading navigation...</span>
                </div>
              ) : filteredNavGroups.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-slate-400">
                  No matching menus found.
                </div>
              ) : (
                filteredNavGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    {/* Module Items */}
                    {group.items.map((item, idx) => {
                      const Icon = item.icon;
                      const hasChildren = !!item.children?.length;
                      const active = isModuleActive(item, pathname, allHrefs);
                      const moduleExpanded = isSearching || expandedModules.has(item.label);

                      // Single direct link (no sub-children)
                      if (!hasChildren) {
                        return (
                          <Link
                            key={`${group.title}-${item.label}-${idx}`}
                            href={item.href}
                            onClick={() => onOpenChange(false)}
                            className={cn(
                              "group flex items-center justify-between rounded-sm px-3 py-2 text-xs transition-all duration-200",
                              active
                                ? "bg-brand-gradient text-white font-bold shadow-2xs"
                                : "text-brand-primary font-semibold hover:bg-brand-50 hover:text-brand-dark"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                size={16}
                                className={cn(
                                  "shrink-0",
                                  active ? "text-white" : "text-brand-primary"
                                )}
                              />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span
                                className={cn(
                                  "shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-sm",
                                  active
                                    ? "bg-white/20 text-white"
                                    : "bg-brand-100 text-brand-primary border border-brand-border"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      }

                      // Accordion Module with children (Same flow as desktop)
                      return (
                        <div key={`${group.title}-${item.label}-${idx}`} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => toggleModule(item.label)}
                            className={cn(
                              "group flex w-full items-center justify-between rounded-sm px-3 py-2 text-xs transition-all duration-200 cursor-pointer",
                              active
                                ? "bg-brand-gradient text-white font-bold"
                                : moduleExpanded
                                ? "text-brand-primary font-bold bg-brand-50"
                                : "text-brand-primary font-semibold hover:bg-brand-50 hover:text-brand-dark"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Icon
                                size={16}
                                className={cn(
                                  "shrink-0",
                                  active ? "text-white" : "text-brand-primary"
                                )}
                              />
                              <span className="truncate text-left">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.badge && (
                                <span
                                  className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded-sm",
                                    active
                                      ? "bg-white/20 text-white"
                                      : "bg-brand-100 text-brand-primary border border-brand-border"
                                  )}
                                >
                                  {item.badge}
                                </span>
                              )}
                              <ChevronDown
                                size={14}
                                className={cn(
                                  "transition-transform duration-200",
                                  active ? "text-white" : "text-brand-primary",
                                  moduleExpanded && "rotate-180"
                                )}
                              />
                            </div>
                          </button>

                          {/* Expanded Module Submenu Children */}
                          {moduleExpanded && item.children && (
                            <div className="ml-3 pl-2.5 border-l-2 border-brand-border my-1 space-y-0.5">
                              {item.children.map((child) => {
                                const ChildIcon = child.icon;
                                const hasSub = !!child.children?.length;
                                const childActive = isChildActive(child, pathname, allHrefs);
                                const exactActive = isRouteActive(child.href, pathname, allHrefs);
                                const itemExpanded = isSearching || expandedItems.has(child.label);

                                if (hasSub) {
                                  return (
                                    <div key={child.label} className="space-y-0.5">
                                      <button
                                        type="button"
                                        onClick={() => toggleItem(child.label)}
                                        className={cn(
                                          "group flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs transition-all duration-150 cursor-pointer",
                                          childActive
                                            ? "font-bold text-white bg-brand-gradient"
                                            : itemExpanded
                                            ? "text-brand-primary font-bold bg-brand-50"
                                            : "text-brand-primary font-semibold hover:bg-brand-50 hover:text-brand-dark"
                                        )}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <ChildIcon
                                            size={13}
                                            className={cn(
                                              "shrink-0",
                                              childActive ? "text-white" : "text-brand-primary"
                                            )}
                                          />
                                          <span className="truncate">{child.label}</span>
                                        </div>
                                        <ChevronDown
                                          size={12}
                                          className={cn(
                                            "transition-transform duration-150",
                                            childActive ? "text-white" : "text-brand-primary",
                                            itemExpanded && "rotate-180"
                                          )}
                                        />
                                      </button>

                                      {/* Nested sub-children */}
                                      {itemExpanded && (
                                        <div className="ml-3 pl-2 border-l border-brand-border my-0.5 space-y-0.5">
                                          {child.children!.map((sub) => {
                                            const SubIcon = sub.icon;
                                            const subActive = isRouteActive(sub.href, pathname, allHrefs);
                                            return (
                                              <Link
                                                key={sub.href}
                                                href={sub.href}
                                                onClick={() => onOpenChange(false)}
                                                className={cn(
                                                  "group flex items-center gap-2 rounded-sm px-2 py-1.5 text-[11px] font-semibold transition-all duration-150",
                                                  subActive
                                                    ? "font-bold text-white bg-brand-gradient"
                                                    : "text-brand-primary hover:bg-brand-50 hover:text-brand-dark"
                                                )}
                                              >
                                                <SubIcon
                                                  size={11}
                                                  className={cn(
                                                    "shrink-0",
                                                    subActive ? "text-white" : "text-brand-primary"
                                                  )}
                                                />
                                                <span className="truncate">{sub.label}</span>
                                              </Link>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={() => onOpenChange(false)}
                                    className={cn(
                                      "group flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs transition-all duration-150",
                                      exactActive
                                        ? "bg-brand-gradient text-white font-bold"
                                        : "text-brand-primary font-semibold hover:bg-brand-50 hover:text-brand-dark"
                                    )}
                                  >
                                    <ChildIcon
                                      size={13}
                                      className={cn(
                                        "shrink-0",
                                        exactActive ? "text-white" : "text-brand-primary"
                                      )}
                                    />
                                    <span className="truncate">{child.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </nav>

            {/* Drawer Footer with Branch info & Direct Logout Button */}
            <div className="border-t border-brand-light bg-brand-50/60 p-3 space-y-2">
              <div className="flex items-center justify-between rounded-sm border border-brand-light bg-white p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-xs font-bold text-white shadow-2xs">
                    {(user?.name || "A")[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs font-bold text-brand-dark">
                      {user?.name || "Administrator"}
                    </span>
                    <span className="truncate text-[10px] text-brand-primary font-semibold">
                      {displayRole}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <Building2 size={11} className="text-brand-primary" />
                  <span>Terminal-01</span>
                </div>
              </div>

              {/* Prominent Sign Out Button */}
              <button
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-rose-50 border border-rose-200 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white cursor-pointer shadow-2xs"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
