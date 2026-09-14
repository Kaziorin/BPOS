"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, LogOut, Loader2, Search, X, Play,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const didAutoExpand = useRef(false);

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
        setExpandedModules(new Set(parsed.modules ?? []));
        setExpandedItems(new Set(parsed.items ?? []));
      }
    } catch {}
  }, []);

  // Auto-expand active module + active menuItem on first load
  useEffect(() => {
    if (didAutoExpand.current || navGroups.length === 0) return;
    didAutoExpand.current = true;

    const mods = new Set(expandedModules);
    const items = new Set(expandedItems);

    for (const group of navGroups) {
      for (const mod of group.items) {
        if (isModuleActive(mod, pathname, allHrefs)) {
          mods.add(mod.label);
          for (const child of mod.children ?? []) {
            if (isChildActive(child, pathname, allHrefs) && child.children?.length) {
              items.add(child.href);
            }
          }
        }
      }
    }
    setExpandedModules(mods);
    setExpandedItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navGroups, pathname, allHrefs]);

  function persist(mods: Set<string>, items: Set<string>) {
    localStorage.setItem(
      EXPANDED_KEY,
      JSON.stringify({ modules: [...mods], items: [...items] }),
    );
  }

  function toggleModule(label: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      persist(next, expandedItems);
      return next;
    });
  }

  function toggleItem(href: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(href) ? next.delete(href) : next.add(href);
      persist(expandedModules, next);
      return next;
    });
  }

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

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
        "relative hidden shrink-0 flex-col border-r border-slate-700/60 bg-[#132238] text-slate-100 transition-[width] duration-300 ease-in-out lg:flex shadow-2xl overflow-hidden select-none",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* ── Horizontal Left-to-Right Wave & Luminous Ambient Glow Backdrop (Reference Image Spec) ── */}
      <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden z-0 bg-[#0F172A]">
        {/* Horizontal Left-to-Right Ambient Radial Glow (Top & Bottom Brightness) */}
        <div
          className="absolute inset-0 w-full h-full opacity-90"
          style={{
            background: `
              radial-gradient(circle at 20% 0%, rgba(20, 184, 166, 0.50) 0%, transparent 60%),
              radial-gradient(circle at 80% 20%, rgba(0, 201, 183, 0.40) 0%, transparent 55%),
              radial-gradient(circle at 10% 85%, rgba(20, 184, 166, 0.45) 0%, transparent 65%),
              radial-gradient(circle at 90% 90%, rgba(0, 201, 183, 0.35) 0%, transparent 60%)
            `,
          }}
        />

        {/* Horizontal Left-to-Right Wave Vector Graphics at Bottom Section */}
        <svg
          className="absolute bottom-0 left-0 w-full h-64 opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 256 160"
        >
          <path
            d="M -10 110 C 60 40, 140 150, 266 75 L 266 160 L -10 160 Z"
            fill="url(#wave-left-right-1)"
          />
          <path
            d="M -10 135 C 90 65, 170 145, 266 95 L 266 160 L -10 160 Z"
            fill="url(#wave-left-right-2)"
          />
          <defs>
            <linearGradient id="wave-left-right-1" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.65" />
              <stop offset="60%" stopColor="#00C9B7" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="wave-left-right-2" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#00C9B7" stopOpacity="0.50" />
              <stop offset="70%" stopColor="#10B981" stopOpacity="0.70" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.25" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3.5 top-6 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-200 shadow-md transition-transform duration-200 hover:scale-110 hover:border-teal-400 hover:text-white focus:outline-none cursor-pointer"
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Header */}
      <div
        className={cn(
          "relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-700/60 px-4 bg-slate-800/40 backdrop-blur-md",
          collapsed && "justify-center px-0",
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#14B8A6] via-[#00C9B7] to-[#10B981] text-white shadow-md shadow-teal-500/30">
            <Logo size={19} />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-bold text-white tracking-tight text-sm">
                  {siteConfig.name}
                </span>
                <span className="shrink-0 rounded-md bg-[#14B8A6]/20 border border-[#14B8A6]/40 px-1.5 py-0.5 text-[9px] font-bold text-teal-300 uppercase tracking-wide">
                  PRO
                </span>
              </div>
              <span className="truncate text-[10px] text-teal-300 font-medium tracking-wide">
                Smart · Fast · All Industries
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Menu Quick Search */}
      {!collapsed && (
        <div className="relative z-10 px-3 pt-3 pb-1">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-slate-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-600/70 bg-slate-800/70 py-1.5 pl-8 pr-7 text-xs text-white placeholder-slate-300 shadow-inner transition focus:border-[#14B8A6] focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-300 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation List */}
      <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin text-[#14B8A6]" />
            <span className="text-xs font-medium">Loading navigation...</span>
          </div>
        ) : filteredNavGroups.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-slate-400">
            No matching menus found.
          </div>
        ) : (
          filteredNavGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {/* Category Group Header */}
              {!collapsed && (
                <div className="px-2 pt-2 pb-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6] shadow-xs shadow-teal-400" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                    {group.title}
                  </span>
                </div>
              )}
              {collapsed && <div className="mx-2 my-2 h-px bg-slate-800" />}

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
                />
              ))}
            </div>
          ))
        )}
      </nav>

      {/* Sidebar Footer User Info & Logout */}
      <div className="relative z-10 border-t border-slate-800/80 p-2.5 bg-slate-900/80 backdrop-blur-md">
        {!collapsed ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-800/90 p-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#14B8A6] to-[#6366F1] text-xs font-bold text-white shadow-2xs">
                {(user?.name || "A")[0].toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-bold text-white">
                  {user?.name || "Administrator"}
                </span>
                <span className="truncate text-[10px] text-slate-300 font-medium">
                  {user?.role || "Main Branch"}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-400 cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Logout"
            className="flex h-9 w-full items-center justify-center rounded-xl text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-400 cursor-pointer"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
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
}: ModuleRowProps) {
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const active = isModuleActive(item, pathname, allHrefs);

  // Collapsed Mode: Icon tooltip link
  if (collapsed) {
    return (
      <Link
        href={item.href !== "#" ? item.href : item.children?.[0]?.href || "#"}
        title={item.label}
        className={cn(
          "mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
          active
            ? "bg-gradient-to-tr from-[#14B8A6] to-[#10B981] text-white shadow-md shadow-teal-500/40"
            : "text-[#2DD4BF] hover:bg-slate-800/80 hover:text-white",
        )}
      >
        <Icon size={18} />
      </Link>
    );
  }

  // Direct Single Link (no sub-children)
  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all duration-200",
          active
            ? "bg-gradient-to-r from-[#14B8A6] via-[#0EA5A0] to-[#00C9B7] text-white font-bold shadow-lg shadow-teal-500/30 border-l-4 border-white"
            : "text-slate-100 font-semibold hover:bg-slate-800/80 hover:text-white",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            size={16}
            className={cn(
              "transition-colors duration-200",
              active ? "text-white" : "text-[#2DD4BF] group-hover:text-white",
            )}
          />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <span className={cn(
            "shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md",
            active ? "bg-white/20 text-white" : "bg-teal-500/20 text-teal-300 border border-teal-500/40"
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
          "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-all duration-200 cursor-pointer",
          active
            ? "bg-gradient-to-r from-[#14B8A6] via-[#0EA5A0] to-[#00C9B7] text-white font-bold shadow-lg shadow-teal-500/30 border-l-4 border-white"
            : "text-slate-100 font-semibold hover:bg-slate-800/80 hover:text-white",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Icon
            size={16}
            className={cn(
              "transition-colors duration-200",
              active ? "text-white" : "text-[#2DD4BF] group-hover:text-white",
            )}
          />
          <span className="truncate text-left">{item.label}</span>
        </div>
        {item.badge && (
          <span className={cn(
            "shrink-0 mr-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md",
            active ? "bg-white/20 text-white" : "bg-teal-500/20 text-teal-300 border border-teal-500/40"
          )}>
            {item.badge}
          </span>
        )}
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 transition-transform duration-200",
            active ? "text-white" : "text-slate-400 group-hover:text-white",
            moduleExpanded && "rotate-180 text-white",
          )}
        />
      </button>

      {/* Submenu Children Container */}
      {moduleExpanded && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-slate-700/80 pl-2.5 py-0.5">
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
            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-150 cursor-pointer",
            active
              ? "font-bold text-teal-300 bg-slate-800/90"
              : "text-slate-300 font-semibold hover:bg-slate-800/70 hover:text-white",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChildIcon size={13} className={active ? "text-white" : "text-[#2DD4BF]"} />
            <span className="truncate text-left">{child.label}</span>
          </div>
          <ChevronDown
            size={12}
            className={cn(
              "shrink-0 text-slate-400 transition-transform duration-200",
              itemExpanded && "rotate-180 text-white",
            )}
          />
        </button>

        {/* Render ONLY sub-children cleanly */}
        {itemExpanded && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-700/80 pl-2 py-0.5">
            {child.children!.map((sub, idx) => {
              const SubIcon = sub.icon;
              const subActive = isRouteActive(sub.href, pathname, allHrefs);
              return (
                <Link
                  key={`${sub.label}-${sub.href}-${idx}`}
                  href={sub.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors duration-150",
                    subActive
                      ? "font-bold text-white bg-[#14B8A6]/40 border-l-2 border-[#14B8A6] pl-1.5"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white",
                  )}
                >
                  <SubIcon size={11} className={subActive ? "text-white" : "text-[#2DD4BF]"} />
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
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150",
        exactActive
          ? "bg-[#14B8A6]/35 text-white font-bold border-l-3 border-[#14B8A6] -ml-[11px] pl-[9px] rounded-r-lg"
          : "text-slate-200 font-semibold hover:bg-slate-800/70 hover:text-white",
      )}
    >
      <ChildIcon
        size={13}
        className={cn(
          "transition-colors",
          exactActive ? "text-white" : "text-[#2DD4BF]",
        )}
      />
      <span className="truncate">{child.label}</span>
    </Link>
  );
}
