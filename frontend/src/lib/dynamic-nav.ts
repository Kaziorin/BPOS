"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Receipt, Package, Tags, Users, Truck,
  ClipboardList, UtensilsCrossed, Landmark, UserCog, BarChart3,
  Settings, CreditCard, FileText, Warehouse, Monitor, FolderTree, Star,
  Wallet, Gift, BookOpen, DollarSign, Clock, Calendar, Percent, MapPin,
  Building2, Shield, Bell, Eye, RefreshCw, FolderOpen, CheckSquare,
  Megaphone, Target, Plug, Scissors, Hash, Layers, Activity, Tag,
  PauseCircle, RotateCcw, Search, ArrowLeftRight, FlaskConical,
  Handshake, type LucideIcon,
} from "lucide-react";
import { api } from "./api";

// ─── Icon map ─────────────────────────────────────────────────────────
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, ShoppingCart, Receipt, Package, Tags, Users, Truck,
  ClipboardList, UtensilsCrossed, Landmark, UserCog, BarChart3,
  Settings, CreditCard, FileText, Warehouse, Monitor, FolderTree, Star,
  Wallet, Gift, BookOpen, DollarSign, Clock, Calendar, Percent, MapPin,
  Building2, Shield, Bell, Eye, RefreshCw, FolderOpen, CheckSquare,
  Megaphone, Target, Plug, Scissors, Hash, Layers, Activity, Tag,
  PauseCircle, RotateCcw, Search, ArrowLeftRight, FlaskConical, Handshake,
  // Aliases
  GitBranch: Building2, Key: Shield, Lock: Shield, ShieldCheck: Shield,
  Calculator: Landmark, FileMinus: FileText, Ruler: Tags,
  Coins: DollarSign, Crown: Star, Ticket: ClipboardList, Bike: MapPin,
  Building: Building2, CalendarOff: Calendar, History: Clock,
  AlertCircle: Clock, AlertTriangle: Clock, List: ClipboardList, Zap: Target,
  PieChart: BarChart3, ListOrdered: ClipboardList, Brain: BarChart3,
  Scale: Landmark, TrendingUp: BarChart3, Barcode: Tags, Grid: Package,
  Map: MapPin, Route: MapPin, ChefHat: UtensilsCrossed, Layout: LayoutDashboard,
  Square: Package, PackageCheck: Package, Webhook: Plug,
  Store: Building2, Edit: Settings, Transfer: RefreshCw, BookMarked: BookOpen,
  Rocket: Settings, Flag: Settings, Server: Warehouse,
  Ban: Shield, Palette: Settings, Globe: Settings, Play: DollarSign,
  Printer: Tags, User: Users, Upload: FileText, Plus: Settings,
  ShoppingBag: ShoppingCart, GitMerge: RefreshCw, Book: BookOpen,
};

function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Package;
  return iconMap[name] ?? Package;
}

// ─── Types ────────────────────────────────────────────────────────────

/** 3rd level: child of a menu item */
export interface NavSubChild {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** 2nd level: direct child of a module (may have its own sub-children) */
export interface NavChild {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavSubChild[];
}

/** 1st level: module = accordion parent */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If undefined → direct link. If present → accordion. */
  children?: NavChild[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// ─── Category display names & order ──────────────────────────────────

const CATEGORY_NAMES: Record<string, string> = {
  PLATFORM: "Platform",
  CORE: "Core",
  ENGINE: "Engines",
  INDUSTRY: "Industry",
  FEATURE: "Features",
};

const CATEGORY_ORDER = ["PLATFORM", "CORE", "ENGINE", "INDUSTRY", "FEATURE"];

// ─── useDynamicNav ────────────────────────────────────────────────────

export function useDynamicNav() {
  const [navGroups, setNavGroups] = useState<NavGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data } = await api.get<{ data: Record<string, any[]> }>("/v1/menu");
        const groups: NavGroup[] = [];

        const sortedCategories = Object.keys(data).sort(
          (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
        );

        for (const category of sortedCategories) {
          const modules = data[category];
          const title = CATEGORY_NAMES[category] ?? category;
          const items: NavItem[] = [];

          for (const mod of modules) {
            const ModIcon = getIcon(mod.moduleIcon);

            // Build 2nd-level children (menuItems), each may have 3rd-level sub-children
            const children: NavChild[] = (mod.items ?? []).map((menuItem: any) => ({
              label: menuItem.label,
              href: menuItem.route,
              icon: getIcon(menuItem.icon),
              children: (menuItem.children ?? []).length > 0
                ? (menuItem.children as any[]).map((sub: any) => ({
                    label: sub.label,
                    href: sub.route,
                    icon: getIcon(sub.icon),
                  }))
                : undefined,
            }));

            // Single item that matches module route → direct link (no accordion)
            const singleDirect =
              children.length === 1 &&
              children[0].href === mod.moduleRoute &&
              !children[0].children?.length;

            items.push({
              label: mod.moduleName,
              href: mod.moduleRoute ?? "#",
              icon: ModIcon,
              children: singleDirect || children.length === 0 ? undefined : children,
            });
          }

          if (items.length > 0) {
            groups.push({ title, items });
          }
        }

        setNavGroups(groups);
      } catch (err) {
        console.error("Error fetching menu:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, []);

  return { navGroups, loading, error };
}
