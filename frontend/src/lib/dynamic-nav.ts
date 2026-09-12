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
  Database,
  Cpu,
  HeartHandshake,
  ShoppingBag,
  Globe,
  BarChart2,
  ListTodo,
  ShieldAlert,
  Repeat,
  Printer,
  UserCheck,
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
  Play: DollarSign,
  User: Users,
  Upload: FileText,
  Plus: Settings,
  GitMerge: RefreshCw,
  Book: BookOpen,
  Database,
  Cpu,
  HeartHandshake,
  ShoppingBag,
  Globe,
  BarChart2,
  ListTodo,
  ShieldAlert,
  Repeat,
  Printer,
  UserCheck,
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

// ─── Master Navigation ────────────────────────────────────────────────
export const DEFAULT_MASTER_NAV: NavGroup[] = [

  // ══════════════════════════════════════════════════════════════════════
  // DASHBOARD — pinned at top, single entry point
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Overview",
    items: [
      {
        label: "Executive Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        children: [
          { label: "Dashboard Overview", href: "/dashboard",         icon: LayoutDashboard },
          { label: "Dashboard Builder",  href: "/dashboard/builder", icon: Layers          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 1. POS & RETAIL COUNTER
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "1. POS & Retail Counter",
    items: [
      {
        label: "POS Terminal",
        href: "/pos",
        icon: ShoppingCart,
        badge: "Live",
        children: [
          { label: "Standard POS Checkout",       href: "/pos",                   icon: ShoppingCart },
          { label: "Held Carts / Orders",          href: "/pos/holds",             icon: PauseCircle  },
          { label: "Price & Barcode Checker",      href: "/pos/price-checker",     icon: Search       },
          { label: "Self-Checkout Kiosk",          href: "/pos/self-checkout",     icon: Monitor      },
          { label: "Customer Display (POS)",       href: "/pos/customer-display",  icon: Monitor      },
          { label: "Customer Display (Full Screen)",href: "/customer-display",     icon: Monitor      },
        ],
      },
      { label: "Cash Register & Shifts",     href: "/cash-register", icon: DollarSign },
      {
        label: "Customers & Loyalty",
        href: "/customers",
        icon: Users,
        children: [
          { label: "Customer Directory",  href: "/customers", icon: Users },
          { label: "Loyalty Programme",   href: "/loyalty",   icon: Star  },
        ],
      },
      { label: "Payments & Transactions",    href: "/payments",    icon: CreditCard },
      {
        label: "Invoices & Billing",
        href: "/invoices",
        icon: Receipt,
        children: [
          { label: "All Invoices",               href: "/invoices",            icon: Receipt },
          { label: "Collection & Due Invoices",  href: "/invoices/collection", icon: Wallet  },
        ],
      },
      { label: "Appointments & Bookings",    href: "/appointments", icon: Calendar },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 2. INVENTORY & PROCUREMENT
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "2. Inventory & Procurement",
    items: [
      {
        label: "Product Catalog",
        href: "/products",
        icon: Package,
        children: [
          { label: "All Products",                href: "/products",        icon: Package   },
          { label: "Add New Product",             href: "/products/create", icon: Sparkles  },
          { label: "Product Types",               href: "/product-types",   icon: Layers    },
          { label: "Categories & Subcategories",  href: "/categories",      icon: Tags      },
          { label: "Brands & Manufacturers",      href: "/brands",          icon: Building2 },
          { label: "Units of Measure",            href: "/units",           icon: Scale     },
          { label: "Price Lists & Tiers",         href: "/price-lists",     icon: Tag       },
        ],
      },
      {
        label: "Inventory Operations",
        href: "/inventory",
        icon: Warehouse,
        children: [
          { label: "Inventory Overview",          href: "/inventory",                  icon: BarChart3      },
          { label: "Stock Levels",                href: "/inventory/stock",             icon: Package        },
          { label: "Warehouses & Storage",        href: "/warehouses",                  icon: Warehouse      },
          { label: "Stock Movements",             href: "/inventory/movements",         icon: ArrowLeftRight },
          { label: "Inter-Branch Transfers",      href: "/inventory/transfers",         icon: RefreshCw      },
          { label: "Batches & Expiry (FEFO)",     href: "/inventory/batches",           icon: FlaskConical   },
          { label: "Serial Numbers",              href: "/inventory/serials",           icon: Hash           },
          { label: "Consignments",                href: "/inventory/consignments",      icon: Layers         },
          { label: "Physical Stock Counts",       href: "/inventory/counts",            icon: CheckSquare    },
          { label: "Landed Costs",                href: "/inventory/landed-costs",      icon: DollarSign     },
        ],
      },
      {
        label: "Purchasing & Receiving",
        href: "/purchasing",
        icon: ClipboardList,
        children: [
          { label: "Purchasing Summary",     href: "/purchasing",              icon: BarChart3    },
          { label: "Purchase Orders (PO)",   href: "/purchasing/orders",       icon: ClipboardList},
          { label: "Goods Received (GRN)",   href: "/purchasing/grns",         icon: CheckSquare  },
          { label: "Requisitions (PR)",      href: "/purchasing/requisitions", icon: FileText     },
          { label: "Purchase Returns",       href: "/purchasing/returns",      icon: RotateCcw    },
          { label: "Supplier Directory",     href: "/suppliers",               icon: Truck        },
        ],
      },
      { label: "Warranty Management",  href: "/warranty", icon: ShieldAlert },
      { label: "Hardware & Devices",   href: "/hardware", icon: Cpu         },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 3. SALES & OMNICHANNEL
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "3. Sales & Omnichannel",
    items: [
      { label: "Sales Invoices & History",   href: "/sales",            icon: Receipt      },
      { label: "Sales Orders",               href: "/sales/orders",     icon: ClipboardList},
      { label: "Quotations & Estimates",     href: "/sales/quotations", icon: FileText     },
      {
        label: "Customer Credit & Dues",
        href: "/credit",
        icon: Wallet,
        children: [
          { label: "Credit Overview", href: "/credit",       icon: Wallet },
          { label: "Aging Report",    href: "/credit/aging", icon: Clock  },
        ],
      },
      { label: "Installments & EMI",         href: "/installments", icon: Calendar },
      {
        label: "Returns & RMA",
        href: "/returns",
        icon: RotateCcw,
        children: [
          { label: "Customer Returns", href: "/returns", icon: RotateCcw },
          { label: "RMA Management",   href: "/rma",     icon: Repeat    },
        ],
      },
      {
        label: "Promotions & Coupons",
        href: "/promotions",
        icon: Gift,
        children: [
          { label: "Promotions Overview", href: "/promotions",        icon: Gift },
          { label: "Coupon Codes",        href: "/promotions/coupons", icon: Tag  },
        ],
      },
      { label: "Delivery & Logistics",   href: "/delivery",    icon: Truck    },
      { label: "Omnichannel Hub",         href: "/omnichannel", icon: Globe    },
      { label: "Marketing Campaigns",     href: "/marketing",   icon: Megaphone},
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 4. FINANCE & ACCOUNTING
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "4. Finance & Accounting",
    items: [
      {
        label: "Financial Accounting",
        href: "/accounting",
        icon: Landmark,
        children: [
          { label: "Accounting Overview",  href: "/accounting",               icon: Landmark  },
          { label: "Chart of Accounts",    href: "/accounting/accounts",      icon: BookOpen  },
          { label: "General Journals",     href: "/accounting/journals",      icon: BookMarked},
          { label: "General Ledger",       href: "/accounting/ledger",        icon: Wallet    },
          { label: "Trial Balance",        href: "/accounting/trial-balance", icon: Scale     },
          { label: "Profit & Loss (P&L)",  href: "/accounting/pnl",           icon: BarChart3 },
          { label: "Balance Sheet",        href: "/accounting/balance-sheet", icon: FileText  },
        ],
      },
      { label: "Tax & NBR VAT (Mushak)", href: "/tax", icon: DollarSign },
      {
        label: "Expenses & Petty Cash",
        href: "/expenses",
        icon: DollarSign,
        children: [
          { label: "All Expenses",          href: "/expenses",            icon: DollarSign },
          { label: "Expense Categories",    href: "/expenses/categories", icon: Tags       },
          { label: "Petty Cash Fund",       href: "/expenses/petty-cash", icon: Wallet     },
          { label: "Recurring Expenses",    href: "/expenses/recurring",  icon: Repeat     },
          { label: "Expenses Report",       href: "/expenses/report",     icon: BarChart3  },
        ],
      },
      {
        label: "Sales Commission",
        href: "/commission",
        icon: Percent,
        children: [
          { label: "Commission Overview", href: "/commission",        icon: Percent    },
          { label: "Commission Agents",   href: "/commission/agents", icon: UserCheck  },
          { label: "Commission Rules",    href: "/commission/rules",  icon: Zap        },
        ],
      },
      { label: "Sales Targets & KPIs", href: "/targets", icon: Target },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 5. ADMINISTRATION & INTELLIGENCE
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "5. Administration & Intelligence",
    items: [
      { label: "Platform & SaaS Management",        href: "/saas",          icon: Shield,        badge: "SaaS"   },
      { label: "Onboarding Wizard",                 href: "/onboarding",    icon: Sparkles                       },
      { label: "Multi-Branch Outlets",              href: "/branches",      icon: Building2                      },
      {
        label: "Workflow & Approvals",
        href: "/workflow",
        icon: GitMerge,
        badge: "Engine",
        children: [
          { label: "Approval Center",          href: "/workflow",                   icon: GitMerge  },
          { label: "Pending Approvals",        href: "/workflow/pending",           icon: Clock     },
          { label: "My Pending Approvals",     href: "/workflow/pending/mine",      icon: UserCheck },
          { label: "Approval Chains & Rules",  href: "/workflow/rules",             icon: GitBranch },
          { label: "Business Rules Engine",    href: "/business-rules",             icon: Zap       },
          { label: "Business Rule Templates",  href: "/business-rules/templates",   icon: FileText  },
        ],
      },
      { label: "Roles & Permissions (RBAC)",        href: "/rbac",           icon: Shield                        },
      { label: "Audit & Security Logs",             href: "/audit-security", icon: Eye                           },
      { label: "HRM & Staff Members",               href: "/hrm",            icon: UserCog                       },
      { label: "AI Business Assistant",             href: "/ai",             icon: Activity                      },
      { label: "API, Webhooks & Integrations",      href: "/integrations",   icon: Plug,          badge: "API"   },
      { label: "Business Intelligence Reports",     href: "/reports",        icon: BarChart3                     },
      {
        label: "Notifications & Alerts",
        href: "/notifications",
        icon: Bell,
        children: [
          { label: "Notification Center",   href: "/notifications",           icon: Bell     },
          { label: "Channels & Delivery",   href: "/notifications/channels",  icon: Plug     },
          { label: "Message Templates",     href: "/notifications/templates", icon: FileText },
        ],
      },
      { label: "Tasks & To-Dos",           href: "/tasks",              icon: ListTodo  },
      { label: "Data & Import/Export",     href: "/data",               icon: Database  },
      { label: "System Performance",       href: "/system/performance", icon: Cpu       },
      {
        label: "System & Store Settings",
        href: "/settings",
        icon: Settings,
        badge: "Config",
        children: [
          { label: "Company & Identity",      href: "/settings?tab=company",  icon: Building  },
          { label: "Branches & Outlets",      href: "/settings?tab=branch",   icon: Store     },
          { label: "POS Terminal Settings",   href: "/settings?tab=pos",      icon: Monitor   },
          { label: "Offline Sync Engine",     href: "/settings?tab=sync",     icon: HardDrive },
          { label: "Tax & NBR VAT",           href: "/settings?tab=tax",      icon: DollarSign},
          { label: "Invoice & Print Layout",  href: "/settings?tab=invoice",  icon: FileText  },
          { label: "Payment Gateways",        href: "/settings?tab=payment",  icon: CreditCard},
          { label: "Currencies & FX Rates",   href: "/settings?tab=currency", icon: Coins     },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 6. INDUSTRY VERTICALS
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "6. Industry Verticals",
    items: [
      {
        label: "Restaurant & Cafe",
        href: "/restaurant",
        icon: UtensilsCrossed,
        children: [
          { label: "Restaurant Management",      href: "/restaurant",                    icon: LayoutDashboard },
          { label: "Floor & Table Map POS",      href: "/restaurant/pos",               icon: UtensilsCrossed },
          { label: "Customer Display Screen",    href: "/restaurant/customer-display",  icon: Monitor         },
          { label: "Slots & Reservation Matrix", href: "/restaurant/slots-matrix",      icon: Calendar        },
        ],
      },
      {
        label: "Pharmacy & Healthcare",
        href: "/pharmacy",
        icon: Pill,
        children: [
          { label: "Pharmacy Operations",      href: "/pharmacy",                 icon: FlaskConical },
          { label: "FEFO Batch & Expiry POS",  href: "/pharmacy/pos",             icon: Pill         },
          { label: "Patient Display Screen",   href: "/pharmacy/patient-display", icon: Monitor      },
        ],
      },
      {
        label: "Grocery & Supermarket",
        href: "/grocery",
        icon: Scale,
        children: [
          { label: "Grocery Hub", href: "/grocery",     icon: Scale       },
          { label: "Grocery POS", href: "/grocery/pos", icon: ShoppingCart},
        ],
      },
      {
        label: "Wholesale & B2B",
        href: "/wholesale",
        icon: Truck,
        children: [
          { label: "Wholesale Commercial Hub", href: "/wholesale",     icon: Building2 },
          { label: "B2B Credit & Tier POS",    href: "/wholesale/pos", icon: FileText  },
        ],
      },
      {
        label: "Manufacturing & Bakery",
        href: "/manufacturing",
        icon: Factory,
        children: [
          { label: "Production & BOM Hub",  href: "/manufacturing",     icon: Layers  },
          { label: "Recipe & Batch POS",    href: "/manufacturing/pos", icon: Factory },
        ],
      },
      {
        label: "Salon & Spa Center",
        href: "/salon",
        icon: Scissors,
        children: [
          { label: "Salon & Booking Hub",    href: "/salon",     icon: Calendar },
          { label: "Stylist & Service POS",  href: "/salon/pos", icon: Scissors },
        ],
      },
      {
        label: "Repair & Service",
        href: "/repair",
        icon: Wrench,
        children: [
          { label: "Repair Service Center",    href: "/repair",     icon: CheckSquare },
          { label: "Device Intake & Job POS",  href: "/repair/pos", icon: Wrench      },
          { label: "Devices & Inventory",      href: "/devices",    icon: Cpu         },
        ],
      },
      {
        label: "Franchise Network",
        href: "/franchise",
        icon: Store,
        children: [
          { label: "Franchise HQ Hub",        href: "/franchise",     icon: Building2 },
          { label: "Multi-Outlet Store POS",  href: "/franchise/pos", icon: Store     },
        ],
      },
    ],
  },
];

const CATEGORY_NAMES: Record<string, string> = {
  PLATFORM: "Administration & System",
  CORE:     "POS & Retail Operations",
  ENGINE:   "Advanced Engines & Finance",
  INDUSTRY: "Industry Verticals",
  FEATURE:  "Features & Growth",
};

const CATEGORY_ORDER = ["CORE", "ENGINE", "PLATFORM", "INDUSTRY", "FEATURE"];

export function useDynamicNav() {
  const [navGroups, setNavGroups] = useState<NavGroup[]>(DEFAULT_MASTER_NAV);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    // Keep curated DEFAULT_MASTER_NAV as the gold standard
    setNavGroups(DEFAULT_MASTER_NAV);
    setLoading(false);
  }, []);

  return { navGroups, loading, error };
}
