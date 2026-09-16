"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ChevronDown, LogOut, Loader2, Search, X, Play,
} from "lucide-react";
import { useDynamicNav, type NavItem, type NavChild } from "@/lib/dynamic-nav";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { CustomInput } from "@/components/custom/CustomInput";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeFlyout, setActiveFlyout] = useState<{
    item: NavItem;
    top: number;
  } | null>(null);
  const flyoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const didAutoExpand = useRef(false);

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

  // Restore collapsed state
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    try {
      const saved = localStorage.getItem(EXPANDED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { modules: string[]; items: string[] };
        // Strictly restore only 1 module and 1 item at most
        const lastMod = (parsed.modules ?? []).slice(-1);
        const lastItem = (parsed.items ?? []).slice(-1);
        setExpandedModules(new Set(lastMod));
        setExpandedItems(new Set(lastItem));
      }
    } catch {}
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
      // Close open sub-items when toggling module
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
      style={{
        width: collapsed ? "72px" : "256px",
        transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "width",
      }}
      className="relative hidden shrink-0 flex-col border-r border-sky-100 bg-white text-[#0284C7] lg:flex shadow-lg select-none overflow-x-hidden"
    >
      {/* ── Ocean Breeze (Light) Subtle Gradient Backdrop ── */}
      <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden z-0 bg-white">
        {/* Very soft sky blue top glow */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, rgba(186, 230, 253, 0.45) 0%, transparent 65%),
              radial-gradient(ellipse at 100% 100%, rgba(125, 211, 252, 0.22) 0%, transparent 55%)
            `,
          }}
        />

        {/* Subtle wave at bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full h-48 opacity-30"
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
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Header */}
      <div className="relative z-10 flex h-16 shrink-0 items-center border-b border-sky-100 px-4 bg-transparent overflow-hidden">
        <Link href="/dashboard" className="flex items-center min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gradient-to-tr from-[#38BDF8] via-[#0284C7] to-[#0369A1] text-white border border-white/60 shadow-2xs">
            <Logo size={21} />
          </div>
          <div
            style={{
              transition: "max-width 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease, margin 200ms ease",
            }}
            className={cn(
              "flex flex-col min-w-0 overflow-hidden whitespace-nowrap",
              collapsed ? "max-w-0 opacity-0 pointer-events-none ml-0" : "max-w-[160px] opacity-100 ml-3"
            )}
          >
            <span className="truncate font-bold text-[#0369A1] tracking-tight text-sm">
              {siteConfig.name}
            </span>
            <span className="truncate text-[10.5px] text-[#0284C7] font-semibold tracking-wide">
              Smart · Fast · All Industries
            </span>
          </div>
        </Link>
      </div>

      {/* Menu Quick Search */}
      <div
        style={{
          transition: "max-height 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease, padding 200ms ease",
        }}
        className={cn(
          "relative z-10 overflow-hidden",
          collapsed ? "max-h-0 opacity-0 pointer-events-none px-3 py-0" : "max-h-16 opacity-100 px-3 pt-3 pb-1"
        )}
      >
        <div className="relative flex items-center">
          <Search size={14} className="pointer-events-none absolute left-3 text-[#0284C7]" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-sm border border-[#0284C7] bg-white pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:border-[#0284C7] focus:ring-0 shadow-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation List */}
      <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin text-[#0284C7]" />
            <span className="text-xs font-medium">Loading navigation...</span>
          </div>
        ) : filteredNavGroups.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-slate-400">
            No matching menus found.
          </div>
        ) : (
          filteredNavGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {/* Module Rows */}
              {group.items.map((item, idx) => (
                <ModuleRow
                  key={`${group.title}-${item.label}-${idx}`}
                  item={item}
                  pathname={pathname}
                  allHrefs={allHrefs}
                  collapsed={collapsed}
                  moduleExpanded={isSearching || expandedModules.has(item.label)}
                  expandedItems={expandedItems}
                  onToggleModule={() => toggleModule(item.label)}
                  onToggleItem={toggleItem}
                  isSearching={isSearching}
                  onOpenFlyout={handleOpenFlyout}
                  onCloseFlyout={handleCloseFlyout}
                  onToggleFlyout={handleToggleFlyout}
                  isFlyoutOpen={activeFlyout?.item.label === item.label}
                />
              ))}
            </div>
          ))
        )}
      </nav>

      {/* Sidebar Footer User Info & Logout */}
      <div className="relative z-10 border-t border-sky-100 p-2 bg-white min-h-[58px] flex items-center justify-center overflow-hidden">
        {/* Expanded User Card */}
        <div
          style={{
            transition: "opacity 200ms ease, transform 200ms ease",
          }}
          className={cn(
            "flex w-full items-center justify-between rounded-sm border border-sky-100 bg-sky-50/60 p-2",
            collapsed
              ? "opacity-0 pointer-events-none absolute scale-95"
              : "opacity-100 relative scale-100"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gradient-to-tr from-[#38BDF8] to-[#0284C7] text-xs font-bold text-white shadow-2xs">
              {(user?.name || "A")[0].toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-bold text-[#0369A1]">
                {user?.name || "Administrator"}
              </span>
              <span className="truncate text-[10px] text-[#0284C7] font-semibold">
                {displayRole}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-rose-50 border border-rose-200 text-rose-600 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-2xs cursor-pointer shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Collapsed Single Logout Button */}
        <div
          style={{
            transition: "opacity 200ms ease, transform 200ms ease",
          }}
          className={cn(
            "w-full flex justify-center",
            collapsed
              ? "opacity-100 relative scale-100"
              : "opacity-0 pointer-events-none absolute scale-95"
          )}
        >
          <button
            onClick={logout}
            title="Logout"
            className="flex h-9 w-10 items-center justify-center rounded-sm bg-rose-50 border border-rose-200 text-rose-600 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 cursor-pointer shadow-2xs"
          >
            <LogOut size={17} />
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
          <div className="min-w-[210px] max-w-[260px] overflow-hidden rounded-lg border border-sky-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header */}
            {(() => {
              const FlyoutIcon = activeFlyout.item.icon;
              const isParentActive = isModuleActive(activeFlyout.item, pathname, allHrefs);
              return (
                <div
                  className={cn(
                    "flex items-center justify-between border-b px-3.5 py-2.5",
                    isParentActive
                      ? "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white border-sky-400/40"
                      : "bg-gradient-to-r from-sky-50 to-white text-[#0284C7] border-sky-100",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FlyoutIcon
                      size={16}
                      className={cn("shrink-0", isParentActive ? "text-white" : "text-[#0284C7]")}
                    />
                    <span
                      className={cn(
                        "text-xs font-bold tracking-tight",
                        isParentActive ? "text-white" : "text-[#0284C7]",
                      )}
                    >
                      {activeFlyout.item.label}
                    </span>
                  </div>
                  {activeFlyout.item.badge && (
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                        isParentActive
                          ? "bg-white/20 text-white border-white/30"
                          : "bg-sky-100 text-[#0284C7] border-sky-200",
                      )}
                    >
                      {activeFlyout.item.badge}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Submenu links */}
            <div className="p-1.5 space-y-0.5 max-h-[70vh] overflow-y-auto no-scrollbar">
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
                        "flex items-center justify-between gap-2.5 px-3 py-2 text-xs rounded-md transition-colors",
                        childActive
                          ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-bold"
                          : "text-[#0284C7] font-semibold hover:bg-[#E0F2FE] hover:text-[#0369A1]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ChildIcon size={14} className={cn("shrink-0", childActive ? "text-white" : "text-[#0284C7]")} />
                        <span className="truncate">{child.label}</span>
                      </div>
                    </Link>

                    {/* Sub-children if any */}
                    {hasSub && (
                      <div className="ml-4 pl-2 border-l border-sky-200 my-1 space-y-0.5">
                        {child.children!.map((sub, sIdx) => {
                          const SubIcon = sub.icon;
                          const subActive = isRouteActive(sub.href, pathname, allHrefs);
                          return (
                            <Link
                              key={`${sub.label}-${sub.href}-${sIdx}`}
                              href={sub.href}
                              onClick={() => setActiveFlyout(null)}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 text-[11px] rounded-md transition-colors",
                                subActive
                                  ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-bold"
                                  : "text-[#0284C7] font-medium hover:bg-[#E0F2FE] hover:text-[#0369A1]"
                              )}
                            >
                              <SubIcon size={11} className={cn("shrink-0", subActive ? "text-white" : "text-[#0284C7]")} />
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

// ─── ModuleRow (1st Level Category Item) ──────────────────────────────

interface ModuleRowProps {
  item: NavItem;
  pathname: string;
  allHrefs: Set<string>;
  collapsed: boolean;
  moduleExpanded: boolean;
  expandedItems: Set<string>;
  onToggleModule: () => void;
  onToggleItem: (href: string) => void;
  isSearching?: boolean;
  onOpenFlyout: (item: NavItem, top: number) => void;
  onCloseFlyout: () => void;
  onToggleFlyout: (item: NavItem, top: number) => void;
  isFlyoutOpen: boolean;
}

function ModuleRow({
  item,
  pathname,
  allHrefs,
  collapsed,
  moduleExpanded,
  expandedItems,
  onToggleModule,
  onToggleItem,
  isSearching,
  onOpenFlyout,
  onCloseFlyout,
  onToggleFlyout,
  isFlyoutOpen,
}: ModuleRowProps) {
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const active = isModuleActive(item, pathname, allHrefs);

  // Single Direct Link (no children)
  if (!hasChildren) {
    return (
      <Link
        href={item.href !== "#" ? item.href : "#"}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex w-full h-10 items-center rounded-sm transition-colors duration-150 overflow-hidden select-none border",
          active
            ? "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] border-sky-400/60 text-white font-bold shadow-2xs"
            : collapsed
            ? "border-sky-100/80 bg-white text-[#0284C7] hover:border-sky-300 hover:bg-[#E0F2FE] hover:text-[#0369A1]"
            : "border-transparent text-[#0284C7] font-semibold hover:border-sky-200 hover:bg-[#E0F2FE] hover:text-[#0369A1]",
        )}
      >
        {/* Icon wrapper (fixed 40px wide, center aligned) */}
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center", collapsed && "mx-auto")}>
          <Icon
            size={18}
            className={cn(
              "transition-colors duration-200 shrink-0",
              active ? "text-white" : "text-[#0284C7] group-hover:text-sky-900",
            )}
          />
        </div>

        {/* Text wrapper - smoothly expands/collapses via max-width and opacity */}
        <div
          style={{
            transition: "max-width 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease, margin 200ms ease",
          }}
          className={cn(
            "flex items-center justify-between flex-1 min-w-0 overflow-hidden whitespace-nowrap",
            collapsed ? "max-w-0 opacity-0 pointer-events-none ml-0" : "max-w-[190px] opacity-100 ml-1 pr-2"
          )}
        >
          <span className="truncate text-xs">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-sm ml-1.5",
                active ? "bg-white/20 text-white" : "bg-sky-500/15 text-sky-800 border border-sky-500/30",
              )}
            >
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    );
  }

  // Accordion Module with children
  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={(e) => {
          if (collapsed) {
            onToggleFlyout(item, e.currentTarget.getBoundingClientRect().top);
          } else {
            onToggleModule();
          }
        }}
        onMouseEnter={(e) => {
          if (collapsed) {
            onOpenFlyout(item, e.currentTarget.getBoundingClientRect().top);
          }
        }}
        onMouseLeave={() => {
          if (collapsed) {
            onCloseFlyout();
          }
        }}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex w-full h-10 items-center rounded-sm transition-colors duration-150 cursor-pointer overflow-hidden select-none border",
          active || (collapsed && isFlyoutOpen)
            ? "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] border-sky-400/60 text-white font-bold shadow-2xs"
            : collapsed
            ? "border-sky-100/80 bg-white text-[#0284C7] hover:border-sky-300 hover:bg-[#E0F2FE] hover:text-[#0369A1]"
            : moduleExpanded
            ? "border-transparent bg-[#E0F2FE]/80 text-[#0284C7] font-bold"
            : "border-transparent text-[#0284C7] font-semibold hover:border-sky-200 hover:bg-[#E0F2FE] hover:text-[#0369A1]",
        )}
      >
        {/* Icon wrapper (fixed 40px wide, center aligned) */}
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center", collapsed && "mx-auto")}>
          <Icon
            size={18}
            className={cn(
              "transition-colors duration-200 shrink-0",
              (active || (collapsed && isFlyoutOpen))
                ? "text-white"
                : "text-[#0284C7] group-hover:text-sky-900",
            )}
          />
        </div>

        {/* Text wrapper - smoothly expands/collapses via max-width and opacity */}
        <div
          style={{
            transition: "max-width 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease, margin 200ms ease",
          }}
          className={cn(
            "flex items-center justify-between flex-1 min-w-0 overflow-hidden whitespace-nowrap",
            collapsed ? "max-w-0 opacity-0 pointer-events-none ml-0" : "max-w-[190px] opacity-100 ml-1 pr-2"
          )}
        >
          <span className="truncate text-left text-xs">{item.label}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {item.badge && (
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-sm",
                  active ? "bg-white/20 text-white" : "bg-sky-500/15 text-sky-800 border border-sky-500/30",
                )}
              >
                {item.badge}
              </span>
            )}
            <ChevronDown
              size={13}
              className={cn(
                "shrink-0 transition-transform duration-200",
                active ? "text-white" : "text-[#0284C7] group-hover:text-sky-900",
                moduleExpanded && "rotate-180",
              )}
            />
          </div>
        </div>
      </button>

      {/* Submenu Children Container with sky visual guide line */}
      <div
        style={{
          transition: "max-height 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease",
        }}
        className={cn(
          "overflow-hidden",
          !collapsed && moduleExpanded
            ? "max-h-[800px] opacity-100 ml-3.5 mt-1 space-y-1 border-l-2 border-sky-300/60 pl-2.5 py-0.5"
            : "max-h-0 opacity-0 pointer-events-none p-0 m-0 border-transparent",
        )}
      >
        {item.children?.map((child, idx) => (
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
              ? "font-bold text-white bg-gradient-to-r from-[#0284C7] to-[#38BDF8]"
              : itemExpanded
              ? "text-[#0284C7] font-bold bg-[#E0F2FE]/80"
              : "text-[#0284C7] font-semibold hover:bg-[#E0F2FE] hover:text-[#0369A1]",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChildIcon size={13} className={cn("shrink-0", active ? "text-white" : "text-[#0284C7] group-hover:text-sky-900")} />
            <span className="truncate text-left">{child.label}</span>
          </div>
          <ChevronDown
            size={12}
            className={cn(
              "shrink-0 transition-transform duration-200",
              active ? "text-white" : "text-[#0284C7] group-hover:text-sky-900",
              itemExpanded && "rotate-180",
            )}
          />
        </button>

        {/* Render ONLY sub-children cleanly with border guide line */}
        {itemExpanded && (
          <div className="ml-3 mt-1 space-y-1 border-l border-sky-300/50 pl-2 py-0.5">
            {child.children!.map((sub, idx) => {
              const SubIcon = sub.icon;
              const subActive = isRouteActive(sub.href, pathname, allHrefs);
              return (
                <Link
                  key={`${sub.label}-${sub.href}-${idx}`}
                  href={sub.href}
                  className={cn(
                    "group flex items-center gap-2 rounded-sm px-2 py-1.5 text-[11px] font-semibold transition-colors duration-150",
                    subActive
                      ? "font-bold text-white bg-gradient-to-r from-[#0284C7] to-[#38BDF8]"
                      : "text-[#0284C7] hover:bg-[#E0F2FE] hover:text-[#0369A1]",
                  )}
                >
                  <SubIcon size={11} className={cn("shrink-0", subActive ? "text-white" : "text-[#0284C7] group-hover:text-sky-900")} />
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
        "group flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs transition-colors duration-150",
        exactActive
          ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-bold"
          : "text-[#0284C7] font-semibold hover:bg-[#E0F2FE] hover:text-[#0369A1]",
      )}
    >
      <ChildIcon
        size={13}
        className={cn(
          "transition-colors shrink-0",
          exactActive ? "text-white" : "text-[#0284C7] group-hover:text-sky-900",
        )}
      />
      <span className="truncate">{child.label}</span>
    </Link>
  );
}

