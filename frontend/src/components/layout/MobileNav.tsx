"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
  Building2,
  Loader2,
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
  type NavUpgradeTarget,
} from "@/lib/dynamic-nav";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { navGroups, loading } = useDynamicNav();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set());
  const [upgradeTarget, setUpgradeTarget] = useState<NavUpgradeTarget | null>(null);
  const Logo = siteConfig.logoIcon;

  const displayRole = user?.roleName || user?.role || "Staff";

  const allHrefs = useMemo(() => collectNavHrefs(navGroups), [navGroups]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => (prev.has(title) ? new Set() : new Set([title])));
    setExpandedModules(new Set());
    setExpandedItems(new Set());
  };

  const toggleModule = (label: string) => {
    setExpandedModules((prev) => (prev.has(label) ? new Set() : new Set([label])));
    setExpandedItems(new Set());
  };

  const toggleItem = (label: string) => {
    setExpandedItems((prev) => (prev.has(label) ? new Set() : new Set([label])));
  };

  const filteredNavGroups = useMemo(
    () => filterNavGroupsByQuery(navGroups, searchQuery),
    [navGroups, searchQuery]
  );

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md px-3 py-2 flex items-center gap-2.5 lg:hidden shadow-lg select-none">
        <button
          onClick={() => onOpenChange(!open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-brand-border bg-brand-50 text-brand-primary hover:bg-brand-100 hover:text-brand-dark transition cursor-pointer shadow-2xs"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          title={open ? "Close navigation menu" : "Open navigation menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <button
          onClick={() => window.dispatchEvent(new Event("omni:open-command-palette"))}
          className="flex flex-1 h-10 items-center justify-between gap-2 px-3.5 rounded-md border border-slate-200 bg-slate-50/70 text-xs text-slate-500 hover:bg-brand-50 hover:border-brand-border transition cursor-pointer min-w-0"
          aria-label="Search pages and items"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search size={15} className="text-brand-primary shrink-0" />
            <span className="truncate font-medium text-slate-600">Search pages, items, actions...</span>
          </div>
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden animate-[fade-in_150ms_ease-out]">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => onOpenChange(false)}
          />

          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs sm:max-w-sm flex-col bg-white shadow-2xl animate-[slide-right_200ms_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3.5">
              <Link
                href="/dashboard"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 min-w-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-gradient text-white shadow-2xs">
                  <Logo size={19} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-bold text-slate-800 tracking-tight text-sm">
                    {siteConfig.name}
                  </span>
                  <span className="truncate text-[10px] text-brand-primary font-semibold tracking-wide">
                    Smart · Fast · Reliable
                  </span>
                </div>
              </Link>
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-3 py-2.5 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search size={14} className="pointer-events-none absolute left-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50/80 pl-8 pr-8 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-brand-primary focus:bg-white outline-none transition"
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

            <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 no-scrollbar">
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
                          {group.items.map((item, idx) => {
                            const Icon = item.icon;
                            const hasChildren = !!item.children?.length;
                            const active = isModuleActive(item, pathname, allHrefs);
                            const moduleExpanded = isSearching || expandedModules.has(item.label);

                            if (item.isLocked) {
                              return (
                                <button
                                  key={`${group.title}-${item.label}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    onOpenChange(false);
                                    setUpgradeTarget({
                                      featureName: item.label,
                                      requiredPlan: item.requiredPlan,
                                      requiredAddon: item.requiredAddon,
                                      lockReason: item.lockReason,
                                    });
                                  }}
                                  className="group flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs text-slate-400 bg-slate-50/50 hover:bg-amber-50/70 hover:text-amber-800 transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
                                      <Icon size={14} />
                                    </div>
                                    <span className="truncate font-medium">{item.label}</span>
                                  </div>
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                                    <Lock size={8} />
                                    <span>{item.lockReason || "Upgrade"}</span>
                                  </span>
                                </button>
                              );
                            }

                            if (!hasChildren) {
                              return (
                                <Link
                                  key={`${group.title}-${item.label}-${idx}`}
                                  href={item.href}
                                  onClick={() => onOpenChange(false)}
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
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded",
                                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
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

                            return (
                              <div
                                key={`${group.title}-${item.label}-${idx}`}
                                className={cn(
                                  "rounded-md transition-colors",
                                  moduleExpanded
                                    ? "border border-brand-border/80 bg-brand-50/35 p-1"
                                    : "border border-transparent"
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleModule(item.label)}
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
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded",
                                        active || moduleExpanded
                                          ? "bg-brand-50 text-brand-primary"
                                          : "bg-slate-100 text-slate-500"
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
                                    {moduleExpanded ? (
                                      <ChevronDown size={14} className="text-brand-primary" />
                                    ) : (
                                      <ChevronRight size={14} className="text-slate-400" />
                                    )}
                                  </div>
                                </button>

                                {moduleExpanded && item.children && (
                                  <div className="ml-3 mt-1 mb-0.5 space-y-0.5 border-l-2 border-brand-primary/25 pl-2.5">
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
                                                "group flex w-full items-center justify-between rounded px-2 py-1.5 text-[11.5px] transition-all cursor-pointer",
                                                childActive
                                                  ? "bg-white text-brand-dark font-bold"
                                                  : itemExpanded
                                                  ? "text-brand-dark font-semibold"
                                                  : "text-slate-600 font-medium hover:bg-white/80 hover:text-brand-dark"
                                              )}
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <ChildIcon
                                                  size={13}
                                                  className={cn("shrink-0", childActive ? "text-brand-primary" : "text-slate-400")}
                                                />
                                                <span className="truncate">{child.label}</span>
                                              </div>
                                              {itemExpanded ? (
                                                <ChevronDown size={12} className="text-brand-primary shrink-0" />
                                              ) : (
                                                <ChevronRight size={12} className="text-slate-400 shrink-0" />
                                              )}
                                            </button>

                                            {itemExpanded && (
                                              <div className="ml-2.5 pl-2 border-l border-brand-border space-y-0.5">
                                                {child.children!.map((sub) => {
                                                  const SubIcon = sub.icon;
                                                  const subActive = isRouteActive(sub.href, pathname, allHrefs);
                                                  return (
                                                    <Link
                                                      key={sub.href}
                                                      href={sub.href}
                                                      onClick={() => onOpenChange(false)}
                                                      className={cn(
                                                        "group flex items-center gap-2 rounded px-2 py-1 text-[11px] transition-all",
                                                        subActive
                                                          ? "bg-brand-gradient text-white font-semibold"
                                                          : "text-slate-600 font-medium hover:bg-white hover:text-brand-dark"
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
                                      }

                                      if (child.isLocked) {
                                        return (
                                          <button
                                            key={child.href || child.label}
                                            type="button"
                                            onClick={() => {
                                              onOpenChange(false);
                                              setUpgradeTarget({
                                                featureName: child.label,
                                                requiredPlan: child.requiredPlan,
                                                requiredAddon: child.requiredAddon,
                                                lockReason: child.lockReason,
                                              });
                                            }}
                                            className="group flex w-full items-center justify-between rounded px-2 py-1.5 text-[11.5px] text-slate-400 hover:bg-amber-50/70 hover:text-amber-800 transition cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <ChildIcon size={13} className="shrink-0 text-slate-400" />
                                              <span className="truncate">{child.label}</span>
                                            </div>
                                            <span className="flex items-center gap-0.5 text-[8.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                                              <Lock size={8} />
                                              <span>{child.lockReason || "Upgrade"}</span>
                                            </span>
                                          </button>
                                        );
                                      }

                                      return (
                                        <Link
                                          key={child.href}
                                          href={child.href}
                                          onClick={() => onOpenChange(false)}
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
                                              "shrink-0",
                                              exactActive ? "text-white" : "text-slate-400"
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
                      )}
                    </div>
                  );
                })
              )}
            </nav>

            <div className="border-t border-slate-100 bg-slate-50/70 p-3 space-y-2">
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-gradient text-xs font-bold text-white shadow-2xs">
                    {(user?.name || "A")[0].toUpperCase()}
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
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <Building2 size={11} className="text-brand-primary" />
                  <span>Terminal-01</span>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-rose-50 border border-rose-200 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
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
    </>
  );
}
