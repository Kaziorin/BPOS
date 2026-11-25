"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Loader2,
  Search,
  X,
  Lock,
} from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";
import {
  useDynamicNav,
  collectNavHrefs,
  isRouteActive,
  isModuleActive,
  isChildActive,
  filterNavGroupsByQuery,
  type NavItem,
  type NavChild,
  type NavUpgradeTarget,
} from "@/lib/dynamic-nav";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "modernpos_sidebar_collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { navGroups, loading } = useDynamicNav();

  const [collapsed, setCollapsed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [upgradeTarget, setUpgradeTarget] = useState<NavUpgradeTarget | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set());
  const [activeFlyout, setActiveFlyout] = useState<{
    item: NavItem;
    top: number;
  } | null>(null);

  const flyoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const collapsedNavRef = useRef<HTMLElement | null>(null);
  const expandedNavRef = useRef<HTMLElement | null>(null);

  const displayRole = user?.roleName || user?.role || "Staff";

  useEffect(() => {
    const t = window.setTimeout(() => setActiveFlyout(null), 0);
    return () => window.clearTimeout(t);
  }, [pathname]);

  const allHrefs = useMemo(() => collectNavHrefs(navGroups), [navGroups]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setCollapsed(true);
      }
      setIsReady(true);
    }, 20);
    return () => window.clearTimeout(t);
  }, []);

  function toggleModule(label: string) {
    setExpandedModules((prev) => (prev.has(label) ? new Set() : new Set([label])));
    setExpandedItems(new Set());
  }

  function toggleItem(href: string) {
    setExpandedItems((prev) => (prev.has(href) ? new Set() : new Set([href])));
  }

  function toggleGroup(title: string) {
    setExpandedGroups((prev) => (prev.has(title) ? new Set() : new Set([title])));
    setExpandedModules(new Set());
    setExpandedItems(new Set());
  }

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      setActiveFlyout(null);
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");

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

  useEffect(() => {
    const handleToggle = () => toggleCollapse();
    window.addEventListener("bpos:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("bpos:toggle-sidebar", handleToggle);
  }, []);

  const handleOpenFlyout = (item: NavItem, top: number) => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    if (!collapsed || !item.children?.length || item.isLocked) {
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
    if (!collapsed) return;
    if (item.isLocked) {
      setActiveFlyout(null);
      setUpgradeTarget({
        featureName: item.label,
        requiredPlan: item.requiredPlan,
        requiredAddon: item.requiredAddon,
        lockReason: item.lockReason,
      });
      return;
    }
    if (!item.children?.length) return;
    if (activeFlyout?.item.label === item.label) {
      setActiveFlyout(null);
    } else {
      setActiveFlyout({ item, top });
    }
  };

  const filteredNavGroups = useMemo(
    () => filterNavGroupsByQuery(navGroups, searchQuery),
    [navGroups, searchQuery]
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex shadow-sm select-none overflow-hidden",
        collapsed ? "w-[72px]" : "w-64"
      )}
      style={{
        transition: isReady ? "width 220ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        willChange: "width",
      }}
    >
      {/* ── TRACK 1: COLLAPSED RAIL (72px) ── */}
      <div
        className="absolute inset-y-0 left-0 w-[72px] flex flex-col z-10 bg-white"
        style={{
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? "auto" : "none",
          visibility: collapsed ? "visible" : "hidden",
          transition: isReady ? "opacity 160ms ease-in-out, visibility 160ms ease-in-out" : "none",
        }}
        aria-hidden={!collapsed}
      >
        <nav
          ref={collapsedNavRef}
          className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1.5 no-scrollbar"
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

                if (item.isLocked) {
                  return (
                    <div
                      key={`col-${group.title}-${item.label}-${idx}`}
                      className="flex w-full items-center justify-center"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setUpgradeTarget({
                            featureName: item.label,
                            requiredPlan: item.requiredPlan,
                            requiredAddon: item.requiredAddon,
                            lockReason: item.lockReason,
                          })
                        }
                        title={`${item.label} (${item.lockReason || "Locked"})`}
                        className="relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-200/80 bg-slate-50 text-slate-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition cursor-pointer"
                      >
                        <Icon size={18} />
                        <Lock size={9} className="absolute -bottom-0.5 -right-0.5 text-amber-600 bg-white rounded-full p-[1px]" />
                      </button>
                    </div>
                  );
                }

                if (!hasChildren) {
                  return (
                    <div
                      key={`col-${group.title}-${item.label}-${idx}`}
                      className="flex w-full items-center justify-center"
                    >
                      <Link
                        href={item.href !== "#" ? item.href : "#"}
                        title={item.label}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md border transition-colors duration-150 shrink-0",
                          active
                            ? "bg-brand-gradient border-brand-primary text-white shadow-xs"
                            : "border-slate-200/70 bg-white text-slate-600 hover:border-brand-border hover:bg-brand-50 hover:text-brand-primary"
                        )}
                      >
                        <Icon size={19} />
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
                        "relative flex h-10 w-10 items-center justify-center rounded-md border transition-colors duration-150 cursor-pointer shrink-0",
                        active || isFlyoutOpen
                          ? "bg-brand-50 border-brand-primary text-brand-primary ring-1 ring-brand-border shadow-xs"
                          : "border-slate-200/70 bg-white text-slate-600 hover:border-brand-border hover:bg-brand-50 hover:text-brand-primary"
                      )}
                    >
                      <Icon size={19} />
                      <span
                        className={cn(
                          "absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full",
                          active || isFlyoutOpen ? "bg-brand-primary" : "bg-slate-300"
                        )}
                      />
                    </button>
                  </div>
                );
              })
            )
          )}
        </nav>

        <div className="flex h-14 shrink-0 items-center justify-center border-t border-slate-100 bg-white p-2">
          <button
            onClick={logout}
            title="Sign Out / Logout"
            className="flex h-10 w-10 items-center justify-center rounded-md bg-rose-50 border border-rose-200 text-rose-600 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 cursor-pointer"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {/* ── TRACK 2: EXPANDED PANEL (256px) ── */}
      <div
        className="absolute inset-y-0 left-0 w-64 min-w-[256px] max-w-[256px] flex flex-col z-20 bg-white"
        style={{
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? "none" : "auto",
          visibility: collapsed ? "hidden" : "visible",
          transition: isReady ? "opacity 160ms ease-in-out, visibility 160ms ease-in-out" : "none",
        }}
        aria-hidden={collapsed}
      >
        {/* Quick Search */}
        <div className="px-3 py-2.5 border-b border-slate-100">
          <div className="relative flex items-center">
            <Search size={14} className="pointer-events-none absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/80 pl-8 pr-7 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Clear menu search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <nav
          ref={expandedNavRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2.5 space-y-2 custom-scrollbar"
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
            filteredNavGroups.map((group) => {
              const isGroupOpen = isSearching || expandedGroups.has(group.title);
              const groupHasActive = group.items.some((item) => isModuleActive(item, pathname, allHrefs));
              const SectionIcon = group.items[0]?.icon;
              return (
                <div
                  key={group.title}
                  className={cn(
                    "rounded-xl transition-all duration-150",
                    isGroupOpen
                      ? "bg-slate-50/90 border border-slate-200/80 p-1.5 shadow-xs"
                      : groupHasActive
                      ? "bg-brand-50/50 border border-brand-border/80 border-l-[3px] border-l-brand-primary"
                      : "border border-transparent hover:border-slate-200/60"
                  )}
                >
                  {group.title && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      aria-expanded={isGroupOpen}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11.5px] font-bold tracking-tight transition cursor-pointer group select-none",
                        isGroupOpen
                          ? "text-brand-dark bg-white shadow-2xs ring-1 ring-slate-200/70"
                          : groupHasActive
                          ? "text-brand-dark"
                          : "text-slate-700 hover:bg-slate-100/70 hover:text-slate-900"
                      )}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        {SectionIcon && (
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                              isGroupOpen || groupHasActive
                                ? "bg-brand-50 text-brand-primary"
                                : "bg-slate-100 text-slate-500 group-hover:bg-brand-50/70 group-hover:text-brand-primary"
                            )}
                          >
                            <SectionIcon size={13} />
                          </span>
                        )}
                        <span className="truncate">{group.title}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {group.isLocked && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 text-[8.5px] font-bold">
                            <Lock size={8} />
                            <span>{group.lockReason || "Upgrade"}</span>
                          </span>
                        )}
                        {isGroupOpen ? (
                          <ChevronDown size={13} className="shrink-0 text-brand-primary" />
                        ) : (
                          <ChevronRight size={13} className="shrink-0 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </span>
                    </button>
                  )}

                  {isGroupOpen && (
                    <div className="mt-1.5 pl-2 ml-2.5 border-l border-slate-200/90 space-y-1">
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
                          onShowUpgrade={setUpgradeTarget}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Footer User Card */}
        <div className="flex h-14 shrink-0 items-center justify-between border-t border-slate-100 px-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-gradient text-xs font-bold text-white shadow-2xs">
              {(user?.name || "A")[0].toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-bold text-slate-800">
                {user?.name || "Administrator"}
              </span>
              <span className="truncate text-[10px] text-slate-500 font-medium">
                {displayRole}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out / Logout"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 border border-rose-200 text-rose-600 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 cursor-pointer shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* ── Collapsed Mode Floating Flyout ── */}
      {collapsed && activeFlyout && (
        <div
          onMouseEnter={() => {
            if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
          }}
          onMouseLeave={handleCloseFlyout}
          style={{
            position: "fixed",
            left: "72px",
            top: Math.max(
              12,
              Math.min(
                typeof window !== "undefined" ? window.innerHeight - 380 : 100,
                activeFlyout.top
              )
            ),
            zIndex: 999999,
          }}
          className="pl-2 select-none"
        >
          <div className="min-w-[220px] max-w-[260px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
            {(() => {
              const FlyoutIcon = activeFlyout.item.icon;
              return (
                <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <FlyoutIcon size={15} className="shrink-0 text-brand-primary" />
                    <span className="text-xs font-bold tracking-tight text-slate-800">
                      {activeFlyout.item.label}
                    </span>
                  </div>
                  {activeFlyout.item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-primary border border-brand-border">
                      {activeFlyout.item.badge}
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="p-1.5 space-y-0.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {activeFlyout.item.children?.map((child, idx) => {
                const ChildIcon = child.icon;
                const exactActive = isRouteActive(child.href, pathname, allHrefs);
                const hasSub = !!child.children?.length;

                if (child.isLocked) {
                  return (
                    <button
                      key={`${child.label}-${child.href}-${idx}`}
                      type="button"
                      onClick={() => {
                        setActiveFlyout(null);
                        setUpgradeTarget({
                          featureName: child.label,
                          requiredPlan: child.requiredPlan,
                          requiredAddon: child.requiredAddon,
                          lockReason: child.lockReason,
                        });
                      }}
                      className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded text-slate-400 hover:bg-amber-50/70 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ChildIcon size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{child.label}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        <Lock size={8} />
                        <span>{child.lockReason || "Upgrade"}</span>
                      </span>
                    </button>
                  );
                }

                return (
                  <div key={`${child.label}-${child.href}-${idx}`}>
                    <Link
                      href={child.href !== "#" ? child.href : child.children?.[0]?.href || "#"}
                      onClick={() => setActiveFlyout(null)}
                      className={cn(
                        "flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded transition-colors",
                        exactActive
                          ? "bg-brand-gradient text-white font-semibold"
                          : "text-slate-600 font-medium hover:bg-brand-50/70 hover:text-brand-dark"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ChildIcon
                          size={13}
                          className={cn("shrink-0", exactActive ? "text-white" : "text-slate-400")}
                        />
                        <span className="truncate">{child.label}</span>
                      </div>
                    </Link>

                    {hasSub && (
                      <div className="ml-3 pl-2 border-l border-slate-200 my-1 space-y-0.5">
                        {child.children!.map((sub, sIdx) => {
                          const SubIcon = sub.icon;
                          const subActive = isRouteActive(sub.href, pathname, allHrefs);
                          return (
                            <Link
                              key={`${sub.label}-${sub.href}-${sIdx}`}
                              href={sub.href}
                              onClick={() => setActiveFlyout(null)}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1 text-[11px] rounded transition-colors",
                                subActive
                                  ? "bg-brand-gradient text-white font-semibold"
                                  : "text-slate-500 font-medium hover:bg-brand-50 hover:text-brand-dark"
                              )}
                            >
                              <SubIcon
                                size={11}
                                className={cn("shrink-0", subActive ? "text-white" : "text-slate-400")}
                              />
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

      {upgradeTarget && (
        <UpgradeModal
          isOpen={!!upgradeTarget}
          onClose={() => setUpgradeTarget(null)}
          featureName={upgradeTarget.featureName}
          requiredPlan={upgradeTarget.requiredPlan}
          requiredAddon={upgradeTarget.requiredAddon}
          lockReason={upgradeTarget.lockReason}
        />
      )}
    </aside>
  );
}

// ─── ExpandedModuleRow ───────────────────────────────────────────────

interface ExpandedModuleRowProps {
  item: NavItem;
  pathname: string;
  allHrefs: Set<string>;
  moduleExpanded: boolean;
  expandedItems: Set<string>;
  onToggleModule: () => void;
  onToggleItem: (href: string) => void;
  onShowUpgrade: (target: NavUpgradeTarget) => void;
}

function ExpandedModuleRow({
  item,
  pathname,
  allHrefs,
  moduleExpanded,
  expandedItems,
  onToggleModule,
  onToggleItem,
  onShowUpgrade,
}: ExpandedModuleRowProps) {
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const active = isModuleActive(item, pathname, allHrefs);

  // Locked module (direct or group-locked): clicking opens UpgradeModal instead of expanding a tree of locks
  if (item.isLocked) {
    return (
      <button
        type="button"
        onClick={() =>
          onShowUpgrade({
            featureName: item.label,
            requiredPlan: item.requiredPlan,
            requiredAddon: item.requiredAddon,
            lockReason: item.lockReason,
          })
        }
        className="group flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs transition-colors text-slate-400 bg-slate-50/50 hover:bg-amber-50/70 hover:text-amber-800 cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400 group-hover:bg-amber-100/70 group-hover:text-amber-600">
            <Icon size={14} />
          </div>
          <span className="truncate font-medium">{item.label}</span>
        </div>
        <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
          <Lock size={8} />
          <span>{item.lockReason || "Upgrade"}</span>
        </span>
      </button>
    );
  }

  // Direct Single Link (no submenu children)
  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center justify-between rounded-md px-2.5 py-2 text-xs transition-all duration-150",
          active
            ? "bg-brand-gradient text-white font-semibold shadow-2xs"
            : "text-slate-700 font-medium hover:bg-slate-100/80 hover:text-brand-dark"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
              active
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-primary"
            )}
          >
            <Icon size={14} />
          </div>
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <span
            className={cn(
              "shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded",
              active
                ? "bg-white/20 text-white"
                : "bg-brand-50 text-brand-primary border border-brand-border"
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  // Accordion Module wrapped cleanly when ON (expanded) so parent & children read as one cohesive unit
  return (
    <div
      className={cn(
        "rounded-md transition-colors",
        moduleExpanded
          ? "border border-brand-border/80 bg-brand-50/35 p-1"
          : "border border-transparent"
      )}
    >
      <button
        type="button"
        onClick={onToggleModule}
        aria-expanded={moduleExpanded}
        className={cn(
          "group flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-all duration-150 cursor-pointer",
          active && moduleExpanded
            ? "bg-white text-brand-dark font-bold shadow-2xs border border-brand-border/60"
            : active
            ? "bg-brand-50 text-brand-dark font-bold border-l-2 border-brand-primary"
            : moduleExpanded
            ? "bg-white/90 text-brand-dark font-semibold shadow-2xs"
            : "text-slate-700 font-medium hover:bg-slate-100/80 hover:text-brand-dark"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
              active || moduleExpanded
                ? "bg-brand-50 text-brand-primary"
                : "bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-primary"
            )}
          >
            <Icon size={14} />
          </div>
          <span className="truncate text-left">{item.label}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {item.badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-primary border border-brand-border">
              {item.badge}
            </span>
          )}
          {active && !moduleExpanded && (
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" title="Active screen inside" />
          )}
          {moduleExpanded ? (
            <ChevronDown size={14} className="text-brand-primary" />
          ) : (
            <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
          )}
        </div>
      </button>

      {moduleExpanded && (
        <div className="ml-3 mt-1 mb-0.5 space-y-0.5 border-l-2 border-brand-primary/25 pl-2.5">
          {item.children!.map((child, idx) => (
            <MenuItemRow
              key={`${child.label}-${child.href}-${idx}`}
              child={child}
              pathname={pathname}
              allHrefs={allHrefs}
              itemExpanded={expandedItems.has(child.href)}
              onToggle={() => onToggleItem(child.href)}
              onShowUpgrade={onShowUpgrade}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MenuItemRow (Submenu Leaf / Nested Item) ────────────────────────

interface MenuItemRowProps {
  child: NavChild;
  pathname: string;
  allHrefs: Set<string>;
  itemExpanded: boolean;
  onToggle: () => void;
  onShowUpgrade: (target: NavUpgradeTarget) => void;
}

function MenuItemRow({
  child,
  pathname,
  allHrefs,
  itemExpanded,
  onToggle,
  onShowUpgrade,
}: MenuItemRowProps) {
  const ChildIcon = child.icon;
  const hasSubChildren = !!child.children?.length;
  const active = isChildActive(child, pathname, allHrefs);
  const exactActive = isRouteActive(child.href, pathname, allHrefs);

  if (hasSubChildren) {
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "group flex w-full items-center justify-between rounded px-2 py-1.5 text-[11.5px] transition-colors cursor-pointer",
            active
              ? "bg-white text-brand-dark font-bold"
              : itemExpanded
              ? "text-brand-dark font-semibold"
              : "text-slate-600 font-medium hover:bg-white/80 hover:text-brand-dark"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChildIcon
              size={13}
              className={cn("shrink-0", active ? "text-brand-primary" : "text-slate-400")}
            />
            <span className="truncate text-left">{child.label}</span>
          </div>
          {child.isLocked ? (
            <Lock size={10} className="text-amber-600 shrink-0" />
          ) : itemExpanded ? (
            <ChevronDown size={12} className="shrink-0 text-brand-primary" />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-slate-400" />
          )}
        </button>

        {itemExpanded && (
          <div className="ml-2.5 space-y-0.5 border-l border-brand-border pl-2 py-0.5">
            {child.children!.map((sub, idx) => {
              const SubIcon = sub.icon;
              const subActive = isRouteActive(sub.href, pathname, allHrefs);

              if (sub.isLocked) {
                return (
                  <button
                    key={`${sub.label}-${sub.href}-${idx}`}
                    type="button"
                    onClick={() =>
                      onShowUpgrade({
                        featureName: sub.label,
                        requiredPlan: sub.requiredPlan,
                        requiredAddon: sub.requiredAddon,
                        lockReason: sub.lockReason,
                      })
                    }
                    className="flex w-full items-center justify-between px-2 py-1 text-[11px] rounded text-slate-400 hover:bg-amber-50/70 hover:text-amber-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SubIcon size={11} className="shrink-0 text-slate-400" />
                      <span className="truncate">{sub.label}</span>
                    </div>
                    <Lock size={9} className="text-amber-600 shrink-0" />
                  </button>
                );
              }

              return (
                <Link
                  key={`${sub.label}-${sub.href}-${idx}`}
                  href={sub.href}
                  target={sub.target}
                  rel={sub.target === "_blank" ? "noopener noreferrer" : undefined}
                  className={cn(
                    "group flex items-center gap-2 rounded px-2 py-1 text-[11px] transition-all duration-150",
                    subActive
                      ? "bg-brand-gradient text-white font-semibold shadow-2xs"
                      : "text-slate-600 font-medium hover:bg-white hover:text-brand-dark"
                  )}
                >
                  <SubIcon
                    size={11}
                    className={cn("shrink-0", subActive ? "text-white" : "text-slate-400 group-hover:text-brand-primary")}
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

  if (child.isLocked) {
    return (
      <button
        type="button"
        onClick={() =>
          onShowUpgrade({
            featureName: child.label,
            requiredPlan: child.requiredPlan,
            requiredAddon: child.requiredAddon,
            lockReason: child.lockReason,
          })
        }
        className="group flex w-full items-center justify-between rounded px-2 py-1.5 text-[11.5px] text-slate-400 hover:bg-amber-50/70 hover:text-amber-800 transition cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChildIcon size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{child.label}</span>
        </div>
        <span className="flex items-center gap-0.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
          <Lock size={8} />
          <span>{child.lockReason || "Upgrade"}</span>
        </span>
      </button>
    );
  }

  return (
    <Link
      href={child.href}
      target={child.target}
      rel={child.target === "_blank" ? "noopener noreferrer" : undefined}
      className={cn(
        "group flex items-center gap-2 rounded px-2 py-1.5 text-[11.5px] transition-all duration-150",
        exactActive
          ? "bg-brand-gradient text-white font-semibold shadow-2xs"
          : "text-slate-600 font-medium hover:bg-white hover:text-brand-dark"
      )}
    >
      <ChildIcon
        size={13}
        className={cn(
          "transition-colors shrink-0",
          exactActive ? "text-white" : "text-slate-400 group-hover:text-brand-primary"
        )}
      />
      <span className="truncate">{child.label}</span>
    </Link>
  );
}
