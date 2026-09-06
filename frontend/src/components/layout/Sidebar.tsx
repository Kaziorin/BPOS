"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, LogOut, Loader2,
} from "lucide-react";
import { useDynamicNav, type NavItem, type NavChild } from "@/lib/dynamic-nav";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "modernpos_sidebar_collapsed";
const EXPANDED_KEY = "modernpos_sidebar_expanded";

// ─── helpers ──────────────────────────────────────────────────────────

function matchesPath(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function isModuleActive(item: NavItem, pathname: string): boolean {
  if (matchesPath(item.href, pathname)) return true;
  return (item.children ?? []).some((c) =>
    matchesPath(c.href, pathname) ||
    (c.children ?? []).some((s) => matchesPath(s.href, pathname)),
  );
}

function isChildActive(child: NavChild, pathname: string): boolean {
  if (matchesPath(child.href, pathname)) return true;
  return (child.children ?? []).some((s) => matchesPath(s.href, pathname));
}

// ─── Sidebar ──────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { navGroups, loading } = useDynamicNav();

  const [collapsed, setCollapsed] = useState(false);
  // Two sets: one for module-level, one for menuItem-level accordions
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const didAutoExpand = useRef(false);

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
        if (isModuleActive(mod, pathname)) {
          mods.add(mod.label);
          for (const child of mod.children ?? []) {
            if (isChildActive(child, pathname) && child.children?.length) {
              items.add(child.href);
            }
          }
        }
      }
    }
    setExpandedModules(mods);
    setExpandedItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navGroups, pathname]);

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

  const Logo = siteConfig.logoIcon;

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-gray-100 bg-white transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3.5 top-5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:text-primary-600"
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 border-b border-gray-100 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-primary-400">
          <Logo size={16} />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-bold text-gray-900">{siteConfig.name}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={18} className="animate-spin text-gray-300" />
          </div>
        ) : (
          navGroups.map((group) => (
            <div key={group.title} className="mb-1">
              {/* Group label */}
              {!collapsed && (
                <p className="mb-0.5 px-4 pt-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {group.title}
                </p>
              )}
              {collapsed && <div className="mx-3 my-2 h-px bg-gray-100" />}

              {group.items.map((item) => (
                <ModuleRow
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  moduleExpanded={expandedModules.has(item.label)}
                  expandedItems={expandedItems}
                  onToggleModule={() => toggleModule(item.label)}
                  onToggleItem={toggleItem}
                />
              ))}
            </div>
          ))
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 p-2">
        <button
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex w-full items-center rounded-lg py-2 text-sm font-medium text-red-500 transition hover:bg-red-50",
            collapsed ? "justify-center px-0" : "gap-2.5 px-3",
          )}
        >
          <LogOut size={16} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}

// ─── ModuleRow (1st level) ────────────────────────────────────────────

interface ModuleRowProps {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  moduleExpanded: boolean;
  expandedItems: Set<string>;
  onToggleModule: () => void;
  onToggleItem: (href: string) => void;
}

function ModuleRow({
  item, pathname, collapsed, moduleExpanded, expandedItems, onToggleModule, onToggleItem,
}: ModuleRowProps) {
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const active = isModuleActive(item, pathname);

  // Collapsed: icon only
  if (collapsed) {
    return (
      <Link
        href={item.href}
        title={item.label}
        className={cn(
          "mx-1 flex h-9 items-center justify-center rounded-lg transition",
          active ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700",
        )}
      >
        <Icon size={18} />
      </Link>
    );
  }

  // No children → direct link
  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={cn(
          "mx-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition",
          active ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
        )}
      >
        <Icon size={16} className={active ? "text-primary-600" : "text-gray-400"} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  // Has children → accordion
  return (
    <div>
      <button
        onClick={onToggleModule}
        className={cn(
          "mx-2 flex w-[calc(100%-1rem)] items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition",
          active ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
        )}
      >
        <Icon size={16} className={active ? "text-primary-600" : "text-gray-400"} />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-gray-400 transition-transform duration-150",
            moduleExpanded && "rotate-180",
          )}
        />
      </button>

      {moduleExpanded && (
        <div className="ml-4 mt-0.5 border-l border-gray-100 pl-2 pb-1">
          {item.children!.map((child) => (
            <MenuItemRow
              key={child.href}
              child={child}
              pathname={pathname}
              itemExpanded={expandedItems.has(child.href)}
              onToggle={() => onToggleItem(child.href)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MenuItemRow (2nd level) ──────────────────────────────────────────

interface MenuItemRowProps {
  child: NavChild;
  pathname: string;
  itemExpanded: boolean;
  onToggle: () => void;
}

function MenuItemRow({ child, pathname, itemExpanded, onToggle }: MenuItemRowProps) {
  const ChildIcon = child.icon;
  const hasSubChildren = !!child.children?.length;
  const active = isChildActive(child, pathname);
  const exactActive = matchesPath(child.href, pathname);

  // Has sub-children → mini accordion
  if (hasSubChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition",
            active
              ? "font-medium text-primary-700"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
          )}
        >
          <ChildIcon size={13} className={active ? "text-primary-500" : "text-gray-400"} />
          <span className="flex-1 truncate text-left">{child.label}</span>
          <ChevronDown
            size={11}
            className={cn(
              "shrink-0 text-gray-400 transition-transform duration-150",
              itemExpanded && "rotate-180",
            )}
          />
        </button>

        {itemExpanded && (
          <div className="ml-3 mt-0.5 border-l border-gray-100 pl-2 pb-0.5">
            {/* Parent link itself */}
            <Link
              href={child.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition",
                exactActive
                  ? "font-medium text-primary-700 bg-primary-50/60"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-700",
              )}
            >
              <ChildIcon size={11} className={exactActive ? "text-primary-500" : "text-gray-300"} />
              <span className="truncate">{child.label}</span>
            </Link>
            {child.children!.map((sub) => {
              const SubIcon = sub.icon;
              const subActive = matchesPath(sub.href, pathname);
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition",
                    subActive
                      ? "font-medium text-primary-700 bg-primary-50/60"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-700",
                  )}
                >
                  <SubIcon size={11} className={subActive ? "text-primary-500" : "text-gray-300"} />
                  <span className="truncate">{sub.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // No sub-children → direct link
  return (
    <Link
      href={child.href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition",
        exactActive
          ? "font-medium text-primary-700 bg-primary-50/60"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
      )}
    >
      <ChildIcon size={13} className={exactActive ? "text-primary-500" : "text-gray-400"} />
      <span className="truncate">{child.label}</span>
    </Link>
  );
}
