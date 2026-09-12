"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Tags,
  Users,
  Truck,
  ClipboardList,
  UtensilsCrossed,
  Landmark,
  UserCog,
  BarChart3,
  Settings,
  CreditCard,
  FileText,
  Warehouse,
  Monitor,
  FolderTree,
  Star,
  Wallet,
  Gift,
  BookOpen,
  BookMarked,
  DollarSign,
  Clock,
  Calendar,
  Percent,
  MapPin,
  Building2,
  Shield,
  Bell,
  Eye,
  RefreshCw,
  FolderOpen,
  CheckSquare,
  Megaphone,
  Target,
  Plug,
  Scissors,
  Hash,
  Layers,
  Activity,
  Tag,
  PauseCircle,
  RotateCcw,
  Search,
  ArrowLeftRight,
  FlaskConical,
  Handshake,
  Sparkles,
  Scale,
  Pill,
  Wrench,
  Factory,
  Store,
  Building,
  Coins,
  HardDrive,
  GitMerge,
  GitBranch,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { api } from "./api";

// ─── Icon map ─────────────────────────────────────────────────────────
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Tags,
  Users,
  Truck,
  ClipboardList,
  UtensilsCrossed,
  Landmark,
  UserCog,
  BarChart3,
  Settings,
  CreditCard,
  FileText,
  Warehouse,
  Monitor,
  FolderTree,
  Star,
  Wallet,
  Gift,
  BookOpen,
  BookMarked,
  DollarSign,
  Clock,
  Calendar,
  Percent,
  MapPin,
  Building2,
  Shield,
  Bell,
  Eye,
  RefreshCw,
  FolderOpen,
  CheckSquare,
  Megaphone,
  Target,
  Plug,
  Scissors,
  Hash,
  Layers,
  Activity,
  Tag,
  PauseCircle,
  RotateCcw,
  Search,
  ArrowLeftRight,
  FlaskConical,
  Handshake,
  Sparkles,
  Scale,
  Pill,
  Wrench,
  Factory,
  Store,

  // Aliases
  GitBranch: Building2,
  Key: Shield,
  Lock: Shield,
  ShieldCheck: Shield,
  Calculator: Landmark,
  FileMinus: FileText,
  Ruler: Tags,
  Coins: DollarSign,
  Crown: Star,
  Ticket: ClipboardList,
  Bike: MapPin,
  Building: Building2,
  CalendarOff: Calendar,
  History: Clock,
  AlertCircle: Clock,
  AlertTriangle: Clock,
  List: ClipboardList,
  Zap: Target,
  PieChart: BarChart3,
  ListOrdered: ClipboardList,
  Brain: BarChart3,
  TrendingUp: BarChart3,
  Barcode: Tags,
  Grid: Package,
  Map: MapPin,
  Route: MapPin,
  ChefHat: UtensilsCrossed,
  Layout: LayoutDashboard,
  Square: Package,
  PackageCheck: Package,
  Webhook: Plug,
  Edit: Settings,
  Transfer: RefreshCw,
  Rocket: Settings,
  Flag: Settings,
  Server: Warehouse,
  Ban: Shield,
  Palette: Settings,
  Globe: Settings,
  Play: DollarSign,
  Printer: Tags,
  User: Users,
  Upload: FileText,
  Plus: Settings,
  ShoppingBag: ShoppingCart,
  GitMerge: RefreshCw,
  Book: BookOpen,
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
  badge?: string;
  /** If undefined → direct link. If present → accordion. */
  children?: NavChild[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// ─── 5-Workspace Master Navigation Architecture ───────────────────────
export const DEFAULT_MASTER_NAV: NavGroup[] = [
  {
    title: "1. POS & Retail Counter",
    items: [
      {
        label: "POS Terminal",
        href: "/pos",
        icon: ShoppingCart,
        badge: "Express",
        children: [
          { label: "Standard POS Checkout", href: "/pos", icon: ShoppingCart },
          { label: "Held Carts / Orders", href: "/pos/holds", icon: PauseCircle },
          { label: "Price & Barcode Checker", href: "/pos/price-checker", icon: Search },
          { label: "Self-Checkout Kiosk", href: "/pos/self-checkout", icon: Monitor },
          { label: "Customer Facing Display", href: "/customer-display", icon: Monitor },
        ],
      },
      { label: "Cash Register & Shifts", href: "/cash-register", icon: DollarSign },
      { label: "Customers & Loyalty", href: "/customers", icon: Users },
    ],
  },
  {
    title: "2. Inventory & Procurement",
    items: [
      {
        label: "Product Catalog",
        href: "/products",
        icon: Package,
        children: [
          { label: "All Products", href: "/products", icon: Package },
          { label: "Add New Product", href: "/products/create", icon: Sparkles },
          { label: "Product Types", href: "/product-types", icon: Layers },
          { label: "Categories & Subcategories", href: "/categories", icon: Tags },
          { label: "Brands & Manufacturers", href: "/brands", icon: Building2 },
          { label: "Units of Measure", href: "/units", icon: Scale },
          { label: "Price Lists & Tiers", href: "/price-lists", icon: Tag },
        ],
      },
      {
        label: "Inventory Operations",
        href: "/inventory/stock",
        icon: Warehouse,
        children: [
          { label: "Stock Overview", href: "/inventory/stock", icon: Package },
          { label: "Warehouses & Storage", href: "/warehouses", icon: Warehouse },
          { label: "Stock Movements", href: "/inventory/movements", icon: ArrowLeftRight },
          { label: "Inter-Branch Transfers", href: "/inventory/transfers", icon: RefreshCw },
          { label: "Batches & Expiry (FEFO)", href: "/inventory/batches", icon: FlaskConical },
          { label: "Serial Numbers", href: "/inventory/serials", icon: Hash },
          { label: "Consignments", href: "/inventory/consignments", icon: Layers },
          { label: "Physical Stock Counts", href: "/inventory/counts", icon: CheckSquare },
          { label: "Landed Costs", href: "/inventory/landed-costs", icon: DollarSign },
        ],
      },
      {
        label: "Purchasing & Receiving",
        href: "/purchasing",
        icon: ClipboardList,
        children: [
          { label: "Purchasing Summary", href: "/purchasing", icon: BarChart3 },
          { label: "Purchase Orders (PO)", href: "/purchasing/orders", icon: ClipboardList },
          { label: "Goods Received (GRN)", href: "/purchasing/grns", icon: CheckSquare },
          { label: "Requisitions (PR)", href: "/purchasing/requisitions", icon: FileText },
          { label: "Purchase Returns", href: "/purchasing/returns", icon: RotateCcw },
          { label: "Supplier Directory", href: "/suppliers", icon: Truck },
        ],
      },
      { label: "Warehouses & Storage", href: "/warehouses", icon: Warehouse },
    ],
  },
  {
    title: "3. Sales & Omnichannel",
    items: [
      { label: "Sales Invoices & History", href: "/sales", icon: Receipt },
      { label: "Sales Orders", href: "/sales/orders", icon: ClipboardList },
      { label: "Quotations & Estimates", href: "/sales/quotations", icon: FileText },
      { label: "Customer Credit & Dues", href: "/credit", icon: Wallet },
      { label: "Installments & EMI", href: "/installments", icon: Calendar },
      { label: "Customer Returns & RMA", href: "/returns", icon: RotateCcw },
      { label: "Promotions & Coupons", href: "/promotions", icon: Gift },
      { label: "Delivery & Logistics", href: "/delivery", icon: Truck },
    ],
  },
  {
    title: "Industry Verticals",
    items: [
      {
        label: "Restaurant",
        href: "/restaurant",
        icon: UtensilsCrossed,
        children: [
          { label: "Restaurant Dashboard", href: "/restaurant", icon: UtensilsCrossed },
          { label: "Restaurant POS", href: "/restaurant/pos", icon: Monitor },
        ],
      },
    ],
  },
  {
    title: "4. Finance & Accounting",
    items: [
      {
        label: "Financial Accounting",
        href: "/accounting",
        icon: Landmark,
        children: [
          { label: "Accounting Overview", href: "/accounting", icon: Landmark },
          { label: "Chart of Accounts", href: "/accounting/accounts", icon: BookOpen },
          { label: "General Journals", href: "/accounting/journals", icon: BookMarked },
          { label: "General Ledger", href: "/accounting/ledger", icon: Wallet },
          { label: "Trial Balance", href: "/accounting/trial-balance", icon: Scale },
          { label: "Profit & Loss (P&L)", href: "/accounting/pnl", icon: BarChart3 },
          { label: "Balance Sheet", href: "/accounting/balance-sheet", icon: FileText },
        ],
      },
      { label: "Tax & NBR VAT (Mushak)", href: "/tax", icon: DollarSign },
      { label: "Expenses & Petty Cash", href: "/expenses", icon: DollarSign },
      { label: "Sales Commission", href: "/commission", icon: Percent },
    ],
  },
  {
    title: "5. Administration & Intelligence",
    items: [
      { label: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Platform & SaaS Management", href: "/saas", icon: Shield, badge: "SaaS" },
      { label: "Onboarding Wizard", href: "/onboarding", icon: Sparkles },
      { label: "Multi-Branch Outlets", href: "/branches", icon: Building2 },
      {
        label: "Workflow & Approvals",
        href: "/workflow",
        icon: GitMerge,
        badge: "Engine",
        children: [
          { label: "Approval Center", href: "/workflow", icon: GitMerge },
          { label: "Pending Approvals", href: "/workflow/pending", icon: Clock },
          { label: "Approval Chains & Rules", href: "/workflow/rules", icon: GitBranch },
          { label: "Business Rules (§10.27)", href: "/business-rules", icon: Zap },
        ],
      },
      { label: "Roles & Permissions (RBAC)", href: "/rbac", icon: Shield },
      { label: "Audit & Security Logs", href: "/audit-security", icon: Eye },
      { label: "HRM & Staff Members", href: "/hrm", icon: UserCog },
      { label: "AI Business Assistant", href: "/ai", icon: Activity },
      { label: "Business Intelligence Reports", href: "/reports", icon: BarChart3 },
      {
        label: "System & Store Settings",
        href: "/settings",
        icon: Settings,
        badge: "Config",
        children: [
          { label: "Company & Identity", href: "/settings?tab=company", icon: Building },
          { label: "Branches & Outlets", href: "/settings?tab=branch", icon: Store },
          { label: "POS Terminal Settings", href: "/settings?tab=pos", icon: Monitor },
          { label: "Offline Sync Engine (§13)", href: "/settings?tab=sync", icon: HardDrive },
          { label: "Tax & NBR VAT", href: "/settings?tab=tax", icon: DollarSign },
          { label: "Invoice & Print Layout", href: "/settings?tab=invoice", icon: FileText },
          { label: "Payment Gateways", href: "/settings?tab=payment", icon: CreditCard },
          { label: "Currencies & FX Rates", href: "/settings?tab=currency", icon: Coins },
        ],
      },
    ],
  },
  {
    title: "6. Industry Verticals",
    items: [
      {
        label: "Restaurant & Cafe",
        href: "/restaurant",
        icon: UtensilsCrossed,
        children: [
          { label: "Floor & Table Map POS", href: "/restaurant/pos", icon: UtensilsCrossed },
          { label: "Restaurant Management", href: "/restaurant", icon: LayoutDashboard },
        ],
      },
      {
        label: "Pharmacy & Healthcare",
        href: "/pharmacy",
        icon: Pill,
        children: [
          { label: "FEFO Batch & Expiry POS", href: "/pharmacy/pos", icon: Pill },
          { label: "Patient Display Screen", href: "/pharmacy/patient-display", icon: Monitor },
          { label: "Pharmacy Operations", href: "/pharmacy", icon: FlaskConical },
        ],
      },
      {
        label: "Grocery & Supermarket",
        href: "/grocery",
        icon: Scale,
      },
      {
        label: "Wholesale & B2B",
        href: "/wholesale",
        icon: Truck,
        children: [
          { label: "B2B Credit & Tier POS", href: "/wholesale/pos", icon: FileText },
          { label: "Wholesale Commercial Hub", href: "/wholesale", icon: Building2 },
        ],
      },
      {
        label: "Manufacturing & Bakery",
        href: "/manufacturing",
        icon: Factory,
        children: [
          { label: "Recipe & Batch POS", href: "/manufacturing/pos", icon: Factory },
          { label: "Production & BOM Hub", href: "/manufacturing", icon: Layers },
        ],
      },
      {
        label: "Salon & Spa Center",
        href: "/salon",
        icon: Scissors,
        children: [
          { label: "Stylist & Service POS", href: "/salon/pos", icon: Scissors },
          { label: "Salon & Booking Hub", href: "/salon", icon: Calendar },
        ],
      },
      {
        label: "Repair & Service",
        href: "/repair",
        icon: Wrench,
        children: [
          { label: "Device Intake & Job POS", href: "/repair/pos", icon: Wrench },
          { label: "Repair Service Center", href: "/repair", icon: CheckSquare },
        ],
      },
      {
        label: "Franchise Network",
        href: "/franchise",
        icon: Store,
        children: [
          { label: "Multi-Outlet Store POS", href: "/franchise/pos", icon: Store },
          { label: "Franchise HQ Hub", href: "/franchise", icon: Building2 },
        ],
      },
    ],
  },
];

const CATEGORY_NAMES: Record<string, string> = {
  PLATFORM: "Administration & System",
  CORE: "POS & Retail Operations",
  ENGINE: "Advanced Engines & Finance",
  INDUSTRY: "Industry Verticals",
  FEATURE: "Features & Growth",
};

const CATEGORY_ORDER = ["CORE", "ENGINE", "PLATFORM", "INDUSTRY", "FEATURE"];

export function useDynamicNav() {
  const [navGroups, setNavGroups] = useState<NavGroup[]>(DEFAULT_MASTER_NAV);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Keep curated DEFAULT_MASTER_NAV as the gold standard to prevent menu duplication & nested loops
    setNavGroups(DEFAULT_MASTER_NAV);
    setLoading(false);
  }, []);

  return { navGroups, loading, error };
}

