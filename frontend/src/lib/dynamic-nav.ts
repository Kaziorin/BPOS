"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Receipt, Package, Tags, Users, Truck,
  ClipboardList, UtensilsCrossed, Landmark, UserCog, BarChart3,
  Settings, CreditCard, FileText, Warehouse, Monitor, FolderTree, Star,
  Wallet, Gift, BookOpen, BookMarked, DollarSign, Clock, Calendar, Percent, MapPin,
  Building2, Shield, Bell, Eye, RefreshCw, FolderOpen, CheckSquare,
  Megaphone, Target, Plug, Scissors, Hash, Layers, Activity, Tag,
  PauseCircle, RotateCcw, Search, ArrowLeftRight, FlaskConical,
  Handshake, Sparkles, type LucideIcon,
} from "lucide-react";
import { api } from "./api";

// ─── Icon map ─────────────────────────────────────────────────────────
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, ShoppingCart, Receipt, Package, Tags, Users, Truck,
  ClipboardList, UtensilsCrossed, Landmark, UserCog, BarChart3,
  Settings, CreditCard, FileText, Warehouse, Monitor, FolderTree, Star,
  Wallet, Gift, BookOpen, BookMarked, DollarSign, Clock, Calendar, Percent, MapPin,
  Building2, Shield, Bell, Eye, RefreshCw, FolderOpen, CheckSquare,
  Megaphone, Target, Plug, Scissors, Hash, Layers, Activity, Tag,
  PauseCircle, RotateCcw, Search, ArrowLeftRight, FlaskConical, Handshake,
  Sparkles,


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

// ─── Default 44-Module Master Navigation Fallback ────────────────────
export const DEFAULT_MASTER_NAV: NavGroup[] = [
  {
    title: "Platform & Management",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "POS / New Sale", href: "/pos", icon: ShoppingCart },
      { label: "SaaS Admin", href: "/saas", icon: Building2 },
      { label: "Tenant Onboarding", href: "/onboarding", icon: Sparkles },
      { label: "Branches", href: "/branches", icon: Building2 },
      { label: "Warehouses", href: "/warehouses", icon: Warehouse },
      { label: "RBAC & Permissions", href: "/rbac", icon: Shield },
      { label: "Audit & Security", href: "/audit-security", icon: Eye },
      { label: "System Settings", href: "/settings", icon: Settings },
    ],
  },
  {
    title: "Sales & Registers",
    items: [
      {
        label: "POS & Terminal",
        href: "/pos",
        icon: ShoppingCart,
        children: [
          { label: "Standard POS", href: "/pos", icon: ShoppingCart },
          { label: "Self-Checkout", href: "/pos/self-checkout", icon: Monitor },
          { label: "Price Checker", href: "/pos/price-checker", icon: Search },
          { label: "Held Sales", href: "/pos/holds", icon: PauseCircle },
        ],
      },
      { label: "Cash Register & Shifts", href: "/cash-register", icon: DollarSign },
      { label: "Sales History", href: "/sales", icon: Receipt },
      { label: "Sales Orders", href: "/sales/orders", icon: ClipboardList },
      { label: "Quotations", href: "/sales/quotations", icon: FileText },
      { label: "Invoices", href: "/invoices", icon: FileText },
      { label: "Customer Display", href: "/customer-display", icon: Monitor },
      { label: "Payments", href: "/payments", icon: CreditCard },
      { label: "Returns & Refunds", href: "/returns", icon: RotateCcw },
    ],
  },
  {
    title: "Catalog & Inventory",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: Tags },
      { label: "Price Lists", href: "/price-lists", icon: Tag },
      {
        label: "Inventory Ops",
        href: "/inventory",
        icon: Warehouse,
        children: [
          { label: "Stock Overview", href: "/inventory/stock", icon: Package },
          { label: "Stock Movements", href: "/inventory/movements", icon: ArrowLeftRight },
          { label: "Stock Transfers", href: "/inventory/transfers", icon: RefreshCw },
          { label: "Batches & FEFO", href: "/inventory/batches", icon: FlaskConical },
          { label: "Serial Numbers", href: "/inventory/serials", icon: Hash },
          { label: "Consignments", href: "/inventory/consignments", icon: Layers },
          { label: "Physical Counts", href: "/inventory/counts", icon: CheckSquare },
        ],
      },
      { label: "Purchasing", href: "/purchasing", icon: ClipboardList },
      { label: "Suppliers", href: "/suppliers", icon: Truck },
    ],
  },
  {
    title: "Finance & Accounting",
    items: [
      {
        label: "Accounting Engine",
        href: "/accounting",
        icon: Landmark,
        children: [
          { label: "Chart of Accounts", href: "/accounting/accounts", icon: BookOpen },
          { label: "General Journals", href: "/accounting/journals", icon: BookMarked },
          { label: "General Ledger", href: "/accounting/ledger", icon: Wallet },
          { label: "Trial Balance", href: "/accounting/trial-balance", icon: Landmark },
          { label: "Profit & Loss", href: "/accounting/pnl", icon: BarChart3 },
          { label: "Balance Sheet", href: "/accounting/balance-sheet", icon: FileText },
        ],
      },
      { label: "Tax & VAT (NBR)", href: "/tax", icon: DollarSign },
      { label: "Customer Credit & Due", href: "/credit", icon: Wallet },
      { label: "Installments & EMI", href: "/installments", icon: Calendar },
      { label: "Expenses & Petty Cash", href: "/expenses", icon: DollarSign },
      { label: "Sales Commission", href: "/commission", icon: Percent },
    ],
  },
  {
    title: "Industry Extensions",
    items: [
      { label: "Restaurant & KDS", href: "/restaurant", icon: UtensilsCrossed },
      { label: "Pharmacy Register", href: "/pharmacy", icon: FlaskConical },
      { label: "Salon & Spa Ops", href: "/salon", icon: Scissors },
      { label: "Repair & Service", href: "/repair", icon: Settings },
      { label: "Manufacturing & BOM", href: "/manufacturing", icon: Layers },
      { label: "Franchise Network", href: "/franchise", icon: Building2 },
      { label: "Appointments & Booking", href: "/appointments", icon: Calendar },
    ],
  },
  {
    title: "CRM, Growth & AI",
    items: [
      { label: "Customers & CRM", href: "/customers", icon: Users },
      { label: "Loyalty & Rewards", href: "/loyalty", icon: Star },
      { label: "Promotions & Discounts", href: "/promotions", icon: Gift },
      { label: "Marketing Automation", href: "/marketing", icon: Megaphone },
      { label: "Omnichannel & E-com", href: "/omnichannel", icon: Plug },
      { label: "AI Business Assistant", href: "/ai", icon: Activity },
      { label: "Reports & BI", href: "/reports", icon: BarChart3 },
      { label: "HRM & Employees", href: "/hrm", icon: UserCog },
      { label: "Workflow & Approvals", href: "/workflow", icon: CheckSquare },
      { label: "Business Rules Engine", href: "/business-rules", icon: Shield },
      { label: "Tasks Management", href: "/tasks", icon: Target },
      { label: "Sales Targets", href: "/targets", icon: Target },
      { label: "Hardware & Printers", href: "/hardware", icon: Monitor },
      { label: "RMA & Warranty", href: "/warranty", icon: Shield },
    ],
  },
];


const CATEGORY_NAMES: Record<string, string> = {
  PLATFORM: "Platform & Management",
  CORE: "Core Business & Retail",
  ENGINE: "Advanced Engines",
  INDUSTRY: "Industry Verticals",
  FEATURE: "Features & Utilities",
};

const CATEGORY_ORDER = ["PLATFORM", "CORE", "ENGINE", "INDUSTRY", "FEATURE"];

export function useDynamicNav() {
  const [navGroups, setNavGroups] = useState<NavGroup[]>(DEFAULT_MASTER_NAV);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data } = await api.get<{ data: Record<string, any[]> }>("/v1/menu");
        if (!data || Object.keys(data).length === 0) return;

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

        if (groups.length > 0) {
          setNavGroups(groups);
        }
      } catch (err) {
        // Silently use the rich DEFAULT_MASTER_NAV
        console.warn("Using master fallback navigation:", err);
      }
    }

    fetchMenu();
  }, []);

  return { navGroups, loading, error };
}

