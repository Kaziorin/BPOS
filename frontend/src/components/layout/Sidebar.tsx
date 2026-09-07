"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, LogOut, Loader2, Search, X,
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

  // 1. Route specifies query parameter (e.g. /omnichannel?mode=retail)
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
        "relative hidden shrink-0 flex-col border-r border-gray-200/80 bg-slate-50/50 backdrop-blur-md transition-[width] duration-300 ease-in-out lg:flex shadow-xs",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3.5 top-6 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-transform duration-200 hover:scale-110 hover:border-primary-400 hover:text-primary-600 focus:outline-none"
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between border-b border-gray-200/70 px-4 bg-white/70",
          collapsed && "justify-center px-0",
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-primary-500/25">
            <Logo size={18} />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-bold text-gray-900 tracking-tight text-sm">
                  {siteConfig.name}
                </span>
                <span className="shrink-0 rounded-md bg-primary-100 px-1.5 py-0.5 text-[9px] font-bold text-primary-700 uppercase tracking-wide">
                  PRO
                </span>
              </div>
              <span className="truncate text-[11px] text-gray-400 font-medium">
                Enterprise POS v2.4
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Menu Quick Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-7 text-xs text-gray-800 placeholder-gray-400 shadow-2xs transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation List */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 size={20} className="animate-spin text-primary-600" />
            <span className="text-xs font-medium">Loading navigation...</span>
          </div>
        ) : filteredNavGroups.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-gray-400">
            No matching menus found.
          </div>
        ) : (
          filteredNavGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {/* Category Group Header */}
              {!collapsed && (
                <div className="px-2 pt-2 pb-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500/60" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {group.title}
                  </span>
                </div>
              )}
              {collapsed && <div className="mx-2 my-2 h-px bg-gray-200/80" />}

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
      <div className="border-t border-gray-200/80 p-2.5 bg-white/60">
        {!collapsed ? (
          <div className="flex items-center justify-between rounded-xl border border-gray-200/60 bg-white p-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 text-xs font-bold text-white shadow-2xs">
                {(user?.name || "A")[0].toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-gray-900">
                  {user?.name || "Administrator"}
                </span>
                <span className="truncate text-[10px] text-gray-500 font-medium">
                  {user?.role || "Main Branch"}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Logout"
            className="flex h-9 w-full items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600"
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
            ? "bg-primary-600 text-white shadow-md shadow-primary-500/30"
            : "text-gray-500 hover:bg-gray-200/60 hover:text-gray-900",
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
          "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200",
          active
            ? "bg-primary-50/90 text-primary-700 font-semibold border-l-[3px] border-primary-600 shadow-2xs pl-2.5"
            : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-2xs",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            size={16}
            className={cn(
              "transition-colors duration-200",
              active ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600",
            )}
          />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <span className="shrink-0 text-[9px] font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-md">
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
          "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200",
          active
            ? "bg-primary-50/90 text-primary-700 font-semibold border-l-[3px] border-primary-600 shadow-2xs pl-2.5"
            : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-2xs",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Icon
            size={16}
            className={cn(
              "transition-colors duration-200",
              active ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600",
            )}
          />
          <span className="truncate text-left">{item.label}</span>
        </div>
        {item.badge && (
          <span className="shrink-0 mr-1.5 text-[9px] font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-md">
            {item.badge}
          </span>
        )}
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-gray-400 transition-transform duration-200 group-hover:text-gray-600",
            moduleExpanded && "rotate-180 text-primary-600",
          )}
        />
      </button>

      {/* Submenu Children Container */}
      {moduleExpanded && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-200/60 pl-2.5 py-0.5">
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
            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-150",
            active
              ? "font-semibold text-primary-700"
              : "text-gray-500 hover:bg-gray-100/70 hover:text-gray-800",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChildIcon size={13} className={active ? "text-primary-600" : "text-gray-400"} />
            <span className="truncate text-left">{child.label}</span>
          </div>
          <ChevronDown
            size={12}
            className={cn(
              "shrink-0 text-gray-400 transition-transform duration-200",
              itemExpanded && "rotate-180 text-primary-600",
            )}
          />
        </button>

        {/* Render ONLY sub-children cleanly */}
        {itemExpanded && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2 py-0.5">
            {child.children!.map((sub, idx) => {
              const SubIcon = sub.icon;
              const subActive = isRouteActive(sub.href, pathname, allHrefs);
              return (
                <Link
                  key={`${sub.label}-${sub.href}-${idx}`}
                  href={sub.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-150",
                    subActive
                      ? "font-semibold text-primary-700 bg-primary-50/80"
                      : "text-gray-500 hover:bg-gray-100/60 hover:text-gray-800",
                  )}
                >
                  <SubIcon size={11} className={subActive ? "text-primary-600" : "text-gray-400"} />
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
          ? "bg-primary-100/60 text-primary-800 font-semibold border-l-2 border-primary-600 -ml-[11px] pl-[9px] rounded-r-lg"
          : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 font-medium",
      )}
    >
      <ChildIcon
        size={13}
        className={cn(
          "transition-colors",
          exactActive ? "text-primary-600" : "text-gray-400",
        )}
      />
      <span className="truncate">{child.label}</span>
    </Link>
  );
}
