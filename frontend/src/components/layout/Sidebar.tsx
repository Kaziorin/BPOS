"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ChevronDown, LogOut, Loader2, Search, X,
} from "lucide-react";
import { useDynamicNav, type NavItem, type NavChild } from "@/lib/dynamic-nav";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "modernpos_sidebar_collapsed";
const EXPANDED_KEY = "modernpos_sidebar_expanded";

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

  // 1. Route specifies a query parameter (e.g. /documents?type=invoice)
  if (hrefNorm.query) {
    return currentNorm.path === hrefNorm.path && currentNorm.query === hrefNorm.query;
  }

  // 2. Exact path match
  if (currentNorm.path === hrefNorm.path) {
    if (currentNorm.query) {
      const exactQueryMatchExists = Array.from(allHrefs).some((other) => {
        const otherNorm = normalizeRoute(other);
        return (
          otherNorm.path === currentNorm.path &&
          otherNorm.query &&
          otherNorm.query === currentNorm.query
        );
      });
      if (exactQueryMatchExists) return false;
    }
    return true;
  }

  // 3. Sub-route prefix match (e.g. /products/123 when href is /products)
  if (currentNorm.path.startsWith(hrefNorm.path + "/")) {
    const exactOrLongerMatchExists = Array.from(allHrefs).some((other) => {
      const otherNorm = normalizeRoute(other);
      if (otherNorm.path === currentNorm.path) return true;
      if (
        otherNorm.path.startsWith(hrefNorm.path + "/") &&
        currentNorm.path.startsWith(otherNorm.path + "/") &&
        otherNorm.path.length > hrefNorm.path.length
      ) {
        return true;
      }
      return false;
    });

    if (exactOrLongerMatchExists) return false;
    return true;
  }

  return false;
}

function isModuleActive(item: NavItem, pathname: string, allHrefs: Set<string>): boolean {
  if (isRouteActive(item.href, pathname, allHrefs)) return true;
  return (item.children ?? []).some((c) =>
    isRouteActive(c.href, pathname, allHrefs) ||
    (c.children ?? []).some((s) => isRouteActive(s.href, pathname, allHrefs)),
  );
}

function isChildActive(child: NavChild, pathname: string, allHrefs: Set<string>): boolean {
  if (isRouteActive(child.href, pathname, allHrefs)) return true;
  return (child.children ?? []).some((s) => isRouteActive(s.href, pathname, allHrefs));
}

// ─── Sidebar Component ───────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { navGroups, loading } = useDynamicNav();

  const [collapsed, setCollapsed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeFlyout, setActiveFlyout] = useState<{
    item: NavItem;
    top: number;
  } | null>(null);

  const flyoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const collapsedNavRef = useRef<HTMLElement | null>(null);
  const expandedNavRef = useRef<HTMLElement | null>(null);

  // Dynamic Role from User / Database
  const displayRole = user?.roleName || user?.role || "Staff";

  // Close flyout when route changes
  useEffect(() => {
    setActiveFlyout(null);
  }, [pathname]);

  // Collect all active hrefs in the nav system to prevent double active highlights
  const allHrefs = useMemo(() => {
    const set = new Set<string>();
    for (const group of navGroups) {
      for (const mod of group.items) {
        if (mod.href && mod.href !== "#") set.add(mod.href);
        for (const child of mod.children ?? []) {
          if (child.href && child.href !== "#") set.add(child.href);
          for (const sub of child.children ?? []) {
            if (sub.href && sub.href !== "#") set.add(sub.href);
          }
        }
      }
    }
    return set;
  }, [navGroups]);

  // Restore collapsed state on mount and enable animations afterwards
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      setCollapsed(true);
    }
    try {
      const saved = localStorage.getItem(EXPANDED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { modules: string[]; items: string[] };
        const lastMod = (parsed.modules ?? []).slice(-1);
        const lastItem = (parsed.items ?? []).slice(-1);
        setExpandedModules(new Set(lastMod));
        setExpandedItems(new Set(lastItem));
      }
    } catch {}

    // Enable smooth CSS transitions after initial state restoration
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-expand only the current active module + active menuItem
  useEffect(() => {
    if (navGroups.length === 0) return;

    let activeMod: string | null = null;
    let activeItem: string | null = null;

    for (const group of navGroups) {
      for (const mod of group.items) {
        if (isModuleActive(mod, pathname, allHrefs)) {
          activeMod = mod.label;
          for (const child of mod.children ?? []) {
            if (isChildActive(child, pathname, allHrefs) && child.children?.length) {
              activeItem = child.href;
              break;
            }
          }
          break;
        }
      }
      if (activeMod) break;
    }

    if (activeMod) {
      const nextMods = new Set([activeMod]);
      const nextItems = activeItem ? new Set([activeItem]) : new Set<string>();
      setExpandedModules(nextMods);
      setExpandedItems(nextItems);
      persist(nextMods, nextItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navGroups, allHrefs]);

  function persist(mods: Set<string>, items: Set<string>) {
    localStorage.setItem(
      EXPANDED_KEY,
      JSON.stringify({ modules: [...mods], items: [...items] }),
    );
  }

  // Accordion mode: exactly ONE module open at any time
  function toggleModule(label: string) {
    setExpandedModules((prev) => {
      const next = new Set<string>();
      if (!prev.has(label)) {
        next.add(label);
      }
      const nextItems = new Set<string>();
      setExpandedItems(nextItems);
      persist(next, nextItems);
      return next;
    });
  }

  // Nested accordion mode: exactly ONE sub-child open at any time
  function toggleItem(href: string) {
    setExpandedItems((prev) => {
      const next = new Set<string>();
      if (!prev.has(href)) {
        next.add(href);
      }
      persist(expandedModules, next);
      return next;
    });
  }

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      setActiveFlyout(null);
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");

      // Seamlessly sync scroll position between both tracks
      if (next) {
        if (expandedNavRef.current && collapsedNavRef.current) {
          collapsedNavRef.current.scrollTop = expandedNavRef.current.scrollTop;
        }
      } else {
        if (collapsedNavRef.current && expandedNavRef.current) {
          expandedNavRef.current.scrollTop = collapsedNavRef.current.scrollTop;
        }
      }

      return next;
    });
  }

  // Listen for toggle event from Header hamburger button
  useEffect(() => {
    const handleToggle = () => toggleCollapse();
    window.addEventListener("bpos:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("bpos:toggle-sidebar", handleToggle);
  }, []);

  const handleOpenFlyout = (item: NavItem, top: number) => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    if (!collapsed || !item.children?.length) {
      setActiveFlyout(null);
      return;
    }
    setActiveFlyout({ item, top });
  };

  const handleCloseFlyout = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    flyoutTimerRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 200);
  };

  const handleToggleFlyout = (item: NavItem, top: number) => {
    if (!collapsed || !item.children?.length) return;
    if (activeFlyout?.item.label === item.label) {
      setActiveFlyout(null);
    } else {
      setActiveFlyout({ item, top });
    }
  };

  // Live filtered nav groups based on search query
  const filteredNavGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const q = searchQuery.toLowerCase().trim();

    return navGroups
      .map((group) => {
        const matchingItems = group.items.filter((item) => {
          if (item.label.toLowerCase().includes(q)) return true;
          if (
            item.children?.some(
              (c) =>
                c.label.toLowerCase().includes(q) ||
                c.children?.some((s) => s.label.toLowerCase().includes(q)),
            )
          )
            return true;
          return false;
        });
        return { ...group, items: matchingItems };
      })
      .filter((g) => g.items.length > 0);
  }, [navGroups, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const Logo = siteConfig.logoIcon;

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-brand-light bg-white text-brand-primary lg:flex shadow-lg select-none overflow-hidden",
        collapsed ? "w-[72px]" : "w-64",
      )}
      style={{
        transition: isReady ? "width 240ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        willChange: "width",
      }}
    >
      {/* ── Fixed-Width Gradient & SVG Backdrop (Zero Relayout During Width Animation) ── */}
      <div className="pointer-events-none absolute inset-0 h-full w-64 overflow-hidden z-0 bg-white">
        {/* Soft ambient theme glow */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, var(--theme-primary-100, #bae6fd) 0%, transparent 65%),
              radial-gradient(ellipse at 100% 100%, var(--theme-primary-200, #7dd3fc) 0%, transparent 55%)
            `,
            opacity: 0.5,
          }}
        />

        {/* Dynamic decorative backdrop wave */}
        <svg
          className="absolute bottom-0 left-0 w-64 h-48 opacity-25"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 256 120"
        >
          <path
            d="M -10 80 C 60 20, 140 100, 266 50 L 266 120 L -10 120 Z"
            fill="url(#wave-sb-1)"
          />
          <defs>
            <linearGradient id="wave-sb-1" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="var(--theme-primary-200, #BAE6FD)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--theme-primary-300, #7DD3FC)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── TRACK 1: COLLAPSED RAIL (Fixed 72px Width, Mathematically Dead-Centered) ── */}
      <div
        className="absolute inset-y-0 left-0 w-[72px] flex flex-col z-10"
        style={{
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? "auto" : "none",
          visibility: collapsed ? "visible" : "hidden",
          transition: isReady ? "opacity 160ms ease-in-out, visibility 160ms ease-in-out" : "none",
        }}
        aria-hidden={!collapsed}
      >
        {/* Centered Brand Header (72px wide, 40px icon centered with 16px margins) */}
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-brand-light bg-transparent">
          <Link href="/dashboard" className="flex items-center justify-center" title={siteConfig.name}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-white border border-white/60 shadow-2xs">
              <Logo size={21} />
            </div>
          </Link>
        </div>

        {/* Centered Navigation Column (no scrollbar distortion, perfectly centered 40px squares) */}
        <nav
          ref={collapsedNavRef}
          className="flex-1 overflow-y-auto overflow-x-hidden py-2.5 space-y-1.5 no-scrollbar"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-brand-primary" />
            </div>
          ) : (
            filteredNavGroups.map((group) =>
              group.items.map((item, idx) => {
                const Icon = item.icon;
                const hasChildren = !!item.children?.length;
                const active = isModuleActive(item, pathname, allHrefs);
                const isFlyoutOpen = activeFlyout?.item.label === item.label;

                if (!hasChildren) {
                  return (
                    <div key={`col-${group.title}-${item.label}-${idx}`} className="flex w-full items-center justify-center">
                      <Link
                        href={item.href !== "#" ? item.href : "#"}
                        title={item.label}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-sm border transition-colors duration-150 shrink-0 shadow-2xs",
                          active
                            ? "bg-brand-gradient border-brand-border text-white shadow-2xs"
                            : "border-brand-light bg-white text-brand-primary hover:border-brand-border hover:bg-brand-50 hover:text-brand-dark",
                        )}
                      >
                        <Icon size={20} />
                      </Link>
                    </div>
                  );
                }

                return (
                  <div
                    key={`col-${group.title}-${item.label}-${idx}`}
                    className="relative flex w-full items-center justify-center"
                    onMouseEnter={(e) => handleOpenFlyout(item, e.currentTarget.getBoundingClientRect().top)}
                    onMouseLeave={handleCloseFlyout}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleToggleFlyout(item, e.currentTarget.getBoundingClientRect().top)}
                      title={item.label}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-sm border transition-colors duration-150 cursor-pointer shrink-0 shadow-2xs",
                        active || isFlyoutOpen
                          ? "bg-brand-gradient border-brand-border text-white shadow-2xs"
                          : "border-brand-light bg-white text-brand-primary hover:border-brand-border hover:bg-brand-50 hover:text-brand-dark",
                      )}
                    >
                      <Icon size={20} />
                    </button>
                  </div>
                );
              })
            )
          )}
        </nav>

        {/* Centered Footer (72px wide, 40px square logout icon centered with 16px margins) */}
        <div className="flex h-14 shrink-0 items-center justify-center border-t border-brand-light bg-white p-2">
          <button
            onClick={logout}
            title="Sign Out / Logout"
            className="flex h-10 w-10 items-center justify-center rounded-sm bg-rose-50 border border-rose-200 text-rose-600 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 cursor-pointer shadow-2xs"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {/* ── TRACK 2: EXPANDED PANEL (Fixed 256px Width, Zero Layout Thrashing) ── */}
      <div
        className="absolute inset-y-0 left-0 w-64 min-w-[256px] max-w-[256px] flex flex-col z-20"
        style={{
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? "none" : "auto",
          visibility: collapsed ? "hidden" : "visible",
          transition: isReady ? "opacity 160ms ease-in-out, visibility 160ms ease-in-out" : "none",
        }}
        aria-hidden={collapsed}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-brand-light px-4 bg-transparent">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-white border border-white/60 shadow-2xs">
              <Logo size={21} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate font-bold text-brand-dark tracking-tight text-sm">
                {siteConfig.name}
              </span>
              <span className="truncate text-[10.5px] text-brand-primary font-semibold tracking-wide">
                Smart · Fast · All Industries
              </span>
            </div>
          </Link>
        </div>

        {/* Menu Quick Search */}
        <div className="px-3 pt-3 pb-1">
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
                className="absolute right-2.5 text-slate-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Main Navigation List */}
        <nav
          ref={expandedNavRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-1 custom-scrollbar"
        >
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
                {group.items.map((item, idx) => (
                  <ExpandedModuleRow
                    key={`exp-${group.title}-${item.label}-${idx}`}
                    item={item}
                    pathname={pathname}
                    allHrefs={allHrefs}
                    moduleExpanded={isSearching || expandedModules.has(item.label)}
                    expandedItems={expandedItems}
                    onToggleModule={() => toggleModule(item.label)}
                    onToggleItem={toggleItem}
                    isSearching={isSearching}
                  />
                ))}
              </div>
            ))
          )}
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        <div className="flex h-14 shrink-0 items-center justify-between border-t border-brand-light px-2.5 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-xs font-bold text-white shadow-2xs">
              {(user?.name || "A")[0].toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
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
          <button
            onClick={logout}
            title="Sign Out / Logout"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-rose-50 border border-rose-200 text-rose-600 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-2xs cursor-pointer shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* ── Collapsed Mode Floating Flyout Submenu ── */}
      {collapsed && activeFlyout && (
        <div
          onMouseEnter={() => {
            if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
          }}
          onMouseLeave={handleCloseFlyout}
          style={{
            position: "fixed",
            left: "72px",
            top: Math.max(12, Math.min(typeof window !== "undefined" ? window.innerHeight - 380 : 100, activeFlyout.top)),
            zIndex: 999999,
          }}
          className="pl-2 select-none"
        >
          <div className="min-w-[210px] max-w-[260px] overflow-hidden rounded-sm border border-brand-border bg-white shadow-xl select-none">
            {/* Header (Clean title without background color) */}
            {(() => {
              const FlyoutIcon = activeFlyout.item.icon;
              return (
                <div className="flex items-center justify-between border-b border-brand-light px-3.5 py-2.5 bg-white">
                  <div className="flex items-center gap-2">
                    <FlyoutIcon
                      size={16}
                      className="shrink-0 text-brand-primary"
                    />
                    <span className="text-xs font-bold tracking-tight text-brand-dark">
                      {activeFlyout.item.label}
                    </span>
                  </div>
                  {activeFlyout.item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm border bg-brand-50 text-brand-primary border-brand-border">
                      {activeFlyout.item.badge}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Submenu links */}
            <div className="p-1.5 space-y-0.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {activeFlyout.item.children?.map((child, idx) => {
                const ChildIcon = child.icon;
                const childActive = isChildActive(child, pathname, allHrefs);
                const hasSub = !!child.children?.length;

                return (
                  <div key={`${child.label}-${child.href}-${idx}`}>
                    <Link
                      href={child.href !== "#" ? child.href : (child.children?.[0]?.href || "#")}
                      onClick={() => setActiveFlyout(null)}
                      className={cn(
                        "flex items-center justify-between gap-2.5 px-3 py-2 text-xs rounded-sm transition-colors",
                        childActive
                          ? "bg-brand-gradient text-white font-bold"
                          : "text-brand-primary font-semibold hover:bg-brand-50 hover:text-brand-dark"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ChildIcon size={14} className={cn("shrink-0", childActive ? "text-white" : "text-brand-primary")} />
                        <span className="truncate">{child.label}</span>
                      </div>
                    </Link>

                    {/* Sub-children if any */}
                    {hasSub && (
                      <div className="ml-4 pl-2 border-l border-brand-border my-1 space-y-0.5">
                        {child.children!.map((sub, sIdx) => {
                          const SubIcon = sub.icon;
                          const subActive = isRouteActive(sub.href, pathname, allHrefs);
                          return (
                            <Link
                              key={`${sub.label}-${sub.href}-${sIdx}`}
                              href={sub.href}
                              onClick={() => setActiveFlyout(null)}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 text-[11px] rounded-sm transition-colors",
                                subActive
                                  ? "bg-brand-gradient text-white font-bold"
                                  : "text-brand-primary font-medium hover:bg-brand-50 hover:text-brand-dark"
                              )}
                            >
                              <SubIcon size={11} className={cn("shrink-0", subActive ? "text-white" : "text-brand-primary")} />
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── ExpandedModuleRow (Expanded Navigation Module Item) ──────────────

interface ExpandedModuleRowProps {
  item: NavItem;
  pathname: string;
  allHrefs: Set<string>;
  moduleExpanded: boolean;
  expandedItems: Set<string>;
  onToggleModule: () => void;
  onToggleItem: (href: string) => void;
  isSearching?: boolean;
}

function ExpandedModuleRow({
  item,
  pathname,
  allHrefs,
  moduleExpanded,
  expandedItems,
  onToggleModule,
  onToggleItem,
  isSearching,
}: ExpandedModuleRowProps) {
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const active = isModuleActive(item, pathname, allHrefs);

  // Direct Single Link (no sub-children)
  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center justify-between rounded-sm px-3 py-2 text-xs transition-all duration-150",
          active
            ? "bg-brand-gradient text-white font-bold"
            : "text-brand-primary font-semibold hover:bg-brand-50 hover:text-brand-dark",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            size={16}
            className={cn(
              "transition-colors shrink-0",
              active ? "text-white" : "text-brand-primary group-hover:text-brand-dark",
            )}
          />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <span className={cn(
            "shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-sm",
            active ? "bg-white/20 text-white" : "bg-brand-100 text-brand-primary border border-brand-border"
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  // Accordion Module with children
  return (
    <div className="space-y-0.5">
      <button
        onClick={onToggleModule}
        className={cn(
          "group flex w-full items-center justify-between rounded-sm px-3 py-2 text-xs transition-all duration-150 cursor-pointer",
          active
            ? "bg-brand-gradient text-white font-bold"
            : moduleExpanded
            ? "text-brand-primary font-bold bg-brand-50"
            : "text-brand-primary font-semibold hover:bg-brand-50 hover:text-brand-dark",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Icon
            size={16}
            className={cn(
              "transition-colors shrink-0",
              active ? "text-white" : "text-brand-primary group-hover:text-brand-dark",
            )}
          />
          <span className="truncate text-left">{item.label}</span>
        </div>
        {item.badge && (
          <span className={cn(
            "shrink-0 mr-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-sm",
            active ? "bg-white/20 text-white" : "bg-brand-100 text-brand-primary border border-brand-border"
          )}>
            {item.badge}
          </span>
        )}
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 transition-transform duration-200",
            active ? "text-white" : "text-brand-primary group-hover:text-brand-dark",
            moduleExpanded && "rotate-180",
          )}
        />
      </button>

      {/* Submenu Children Container with brand visual guide line */}
      {moduleExpanded && (
        <div className="ml-3.5 mt-1 space-y-1 border-l-2 border-brand-border pl-2.5 py-0.5 transition-all">
          {item.children!.map((child, idx) => (
            <MenuItemRow
              key={`${child.label}-${child.href}-${idx}`}
              child={child}
              pathname={pathname}
              allHrefs={allHrefs}
              itemExpanded={isSearching || expandedItems.has(child.href)}
              onToggle={() => onToggleItem(child.href)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MenuItemRow (2nd & 3rd Level Submenu Items) ──────────────────────

interface MenuItemRowProps {
  child: NavChild;
  pathname: string;
  allHrefs: Set<string>;
  itemExpanded: boolean;
  onToggle: () => void;
}

function MenuItemRow({ child, pathname, allHrefs, itemExpanded, onToggle }: MenuItemRowProps) {
  const ChildIcon = child.icon;
  const hasSubChildren = !!child.children?.length;
  const active = isChildActive(child, pathname, allHrefs);
  const exactActive = isRouteActive(child.href, pathname, allHrefs);

  // If item has 3rd level sub-children → nested accordion
  if (hasSubChildren) {
    return (
      <div className="space-y-0.5">
        <button
          onClick={onToggle}
          className={cn(
            "group flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs transition-colors duration-150 cursor-pointer",
            active
              ? "font-bold text-white bg-brand-gradient"
              : itemExpanded
              ? "text-brand-primary font-bold bg-brand-50"
              : "text-brand-primary font-semibold hover:bg-brand-50 hover:text-brand-dark",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChildIcon size={13} className={cn("shrink-0", active ? "text-white" : "text-brand-primary group-hover:text-brand-dark")} />
            <span className="truncate text-left">{child.label}</span>
          </div>
          <ChevronDown
            size={12}
            className={cn(
              "shrink-0 transition-transform duration-200",
              active ? "text-white" : "text-brand-primary group-hover:text-brand-dark",
              itemExpanded && "rotate-180",
            )}
          />
        </button>

        {/* Render ONLY sub-children cleanly with border guide line */}
        {itemExpanded && (
          <div className="ml-3 mt-1 space-y-1 border-l border-brand-border pl-2 py-0.5">
            {child.children!.map((sub, idx) => {
              const SubIcon = sub.icon;
              const subActive = isRouteActive(sub.href, pathname, allHrefs);
              return (
                <Link
                  key={`${sub.label}-${sub.href}-${idx}`}
                  href={sub.href}
                  className={cn(
                    "group flex items-center gap-2 rounded-sm px-2 py-1.5 text-[11px] font-semibold transition-all duration-150",
                    subActive
                      ? "font-bold text-white bg-brand-gradient"
                      : "text-brand-primary hover:bg-brand-50 hover:text-brand-dark",
                  )}
                >
                  <SubIcon size={11} className={cn("shrink-0", subActive ? "text-white" : "text-brand-primary group-hover:text-brand-dark")} />
                  <span className="truncate">{sub.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Regular 2nd-level submenu item
  return (
    <Link
      href={child.href}
      className={cn(
        "group flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs transition-all duration-150",
        exactActive
          ? "bg-brand-gradient text-white font-bold"
          : "text-brand-primary font-semibold hover:bg-brand-50 hover:text-brand-dark",
      )}
    >
      <ChildIcon
        size={13}
        className={cn(
          "transition-colors shrink-0",
          exactActive ? "text-white" : "text-brand-primary group-hover:text-brand-dark",
        )}
      />
      <span className="truncate">{child.label}</span>
    </Link>
  );
}
