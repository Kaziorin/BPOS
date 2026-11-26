"use client";

import { useMemo } from "react";
import { useAuth } from "./auth";
import {
  getAccessiblePosTerminals,
  getTenantEntitlementContext,
  PLAN_TIER_RANK,
} from "./pos-terminals";
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
  Flame,
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
  Croissant,
  Globe,
  BarChart2,
  ListTodo,
  ShieldAlert,
  Repeat,
  Printer,
  UserCheck,
  Lock,
  type LucideIcon,
} from "lucide-react";

// ─── Icon map ─────────────────────────────────────────────────────────
const iconMap: Record<string, LucideIcon> = {
  Croissant,
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
  Flame,
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
  Lock,

  // Aliases
  GitBranch: Building2,
  Key: Shield,
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
  target?: string;
  requiredPlan?: "STARTER" | "BUSINESS" | "ENTERPRISE";
  requiredAddon?: string;
  isLocked?: boolean;
  lockReason?: string;
}

/** 2nd level: direct child of a module (may have its own sub-children) */
export interface NavChild {
  label: string;
  href: string;
  icon: LucideIcon;
  target?: string;
  children?: NavSubChild[];
  requiredPlan?: "STARTER" | "BUSINESS" | "ENTERPRISE";
  requiredAddon?: string;
  isLocked?: boolean;
  lockReason?: string;
}

/** 1st level: module = accordion parent */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** If undefined → direct link. If present → accordion. */
  children?: NavChild[];
  requiredPlan?: "STARTER" | "BUSINESS" | "ENTERPRISE";
  requiredAddon?: string;
  isLocked?: boolean;
  lockReason?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
  requiredPlan?: "STARTER" | "BUSINESS" | "ENTERPRISE";
  requiredAddon?: string;
  isLocked?: boolean;
  lockReason?: string;
}

// ─── Master Navigation with Commercial Gating Rules ───────────────────
export const DEFAULT_MASTER_NAV: NavGroup[] = [
  // ══════════════════════════════════════════════════════════════════════
  // 1. OVERVIEW & ANALYTICS
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Overview",
    items: [
      {
        label: "Executive Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        children: [
          { label: "Dashboard Overview", href: "/dashboard", icon: LayoutDashboard },
          { label: "Dashboard Builder", href: "/dashboard/builder", icon: Layers, requiredPlan: "BUSINESS" },
        ],
      },
      {
        label: "Business Intelligence & Reports",
        href: "/reports",
        icon: BarChart3,
        requiredPlan: "BUSINESS",
      },
      {
        label: "AI Agent & Intelligence",
        href: "/ai",
        icon: Sparkles,
        badge: "AI",
      },
      {
        label: "Tasks & To-Dos",
        href: "/tasks",
        icon: ListTodo,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 2. POINT OF SALE (POS) — Core to ALL Plans
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Point of Sale (POS)",
    items: [
      {
        label: "All POS Terminals",
        href: "/retail-pos",
        icon: Monitor,
        badge: "10 Businesses",
        children: [
          { label: "Retail POS Terminal", href: "/retail-pos", icon: ShoppingCart },
          { label: "Wholesale POS Counter", href: "/wholesale/pos", icon: Package, requiredAddon: "wholesale" },
          { label: "Pharmacy Rx POS", href: "/pharmacy/pos", icon: Pill, requiredAddon: "pharmacy" },
          { label: "Restaurant & Cafe POS", href: "/restaurant/pos", icon: UtensilsCrossed, requiredAddon: "restaurant" },
          { label: "Bakery & Confectionery POS", href: "/bakery/pos", icon: Croissant, requiredAddon: "bakery" },
          { label: "Grocery & Supermarket POS", href: "/grocery/pos", icon: ShoppingBag, requiredAddon: "grocery" },
          { label: "Repair & Service POS", href: "/repair/pos", icon: Wrench, requiredAddon: "repair" },
          { label: "Salon & Spa POS", href: "/salon/pos", icon: Scissors, requiredAddon: "salon" },
          { label: "Franchise & Outlet POS", href: "/franchise/pos", icon: Building2, requiredAddon: "franchise" },
          { label: "Batch & Factory POS", href: "/manufacturing/pos", icon: Factory, requiredAddon: "manufacturing" },
        ],
      },
      {
        label: "Cash Register & Shifts",
        href: "/cash-register",
        icon: DollarSign,
      },
      {
        label: "Held Carts & Kiosk Tools",
        href: "/pos/holds",
        icon: PauseCircle,
        children: [
          { label: "Held Carts / Orders", href: "/pos/holds", icon: PauseCircle },
          { label: "Price & Barcode Checker", href: "/pos/price-checker", icon: Search },
          { label: "Self-Checkout Kiosk", href: "/pos/self-checkout", icon: Monitor, requiredPlan: "BUSINESS" },
          { label: "Customer Facing Display", href: "/customer-display", icon: Monitor },
          { label: "Retail Customer Display", href: "/retail-pos/customer-display", icon: Monitor },
          { label: "Restaurant Customer Display", href: "/restaurant/customer-display", icon: Monitor, requiredAddon: "restaurant" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 3. SALES & CUSTOMERS (CRM)
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Sales & Customers",
    items: [
      {
        label: "Sales & Orders",
        href: "/sales",
        icon: Receipt,
        children: [
          { label: "Sales Invoices & History", href: "/sales", icon: Receipt },
          { label: "Sales Orders", href: "/sales/orders", icon: ClipboardList },
          { label: "Quotations & Estimates", href: "/sales/quotations", icon: FileText },
        ],
      },
      {
        label: "Invoices & Billing",
        href: "/invoices",
        icon: FileText,
        children: [
          { label: "All Invoices", href: "/invoices", icon: Receipt },
          { label: "Collection & Due Invoices", href: "/invoices/collection", icon: Wallet },
        ],
      },
      {
        label: "Payments & Transactions",
        href: "/payments",
        icon: CreditCard,
      },
      {
        label: "Customers & Loyalty",
        href: "/customers",
        icon: Users,
        children: [
          { label: "Customer Directory", href: "/customers", icon: Users },
          { label: "Loyalty Programme", href: "/loyalty", icon: Star, requiredPlan: "BUSINESS" },
        ],
      },
      {
        label: "Customer Credit & Dues",
        href: "/credit",
        icon: Wallet,
        requiredPlan: "BUSINESS",
        children: [
          { label: "Credit Overview", href: "/credit", icon: Wallet },
          { label: "Aging Report", href: "/credit/aging", icon: Clock },
          { label: "Installments & EMI", href: "/installments", icon: Calendar },
        ],
      },
      {
        label: "Returns & RMA",
        href: "/returns",
        icon: RotateCcw,
        requiredPlan: "BUSINESS",
        children: [
          { label: "Customer Returns", href: "/returns", icon: RotateCcw },
          { label: "RMA Management", href: "/rma", icon: Repeat },
          { label: "Warranty Management", href: "/warranty", icon: ShieldAlert },
        ],
      },
      {
        label: "Promotions & Marketing",
        href: "/promotions",
        icon: Gift,
        requiredPlan: "BUSINESS",
        children: [
          { label: "Promotions Overview", href: "/promotions", icon: Gift },
          { label: "Coupon Codes", href: "/promotions/coupons", icon: Tag },
          { label: "Marketing Campaigns", href: "/marketing", icon: Megaphone },
        ],
      },
      {
        label: "Delivery & Logistics",
        href: "/delivery",
        icon: Truck,
        requiredPlan: "BUSINESS",
      },
      {
        label: "Appointments & Bookings",
        href: "/appointments",
        icon: Calendar,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 4. INVENTORY & WAREHOUSE
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Inventory & Products",
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
          { label: "Price Lists & Tiers", href: "/price-lists", icon: Tag, requiredPlan: "BUSINESS" },
        ],
      },
      {
        label: "Stock & Warehouse Ops",
        href: "/inventory",
        icon: Warehouse,
        children: [
          { label: "Inventory Overview", href: "/inventory", icon: BarChart3 },
          { label: "Stock Levels", href: "/inventory/stock", icon: Package },
          { label: "Warehouses & Storage", href: "/warehouses", icon: Warehouse, requiredPlan: "BUSINESS" },
          { label: "Stock Movements", href: "/inventory/movements", icon: ArrowLeftRight },
          { label: "Inter-Branch Transfers", href: "/inventory/transfers", icon: RefreshCw, requiredPlan: "BUSINESS" },
        ],
      },
      {
        label: "Batches, Expiry & Serials",
        href: "/inventory/batches",
        icon: FlaskConical,
        requiredPlan: "BUSINESS",
        children: [
          { label: "Batches & Expiry (FEFO)", href: "/inventory/batches", icon: FlaskConical },
          { label: "Serial Numbers", href: "/inventory/serials", icon: Hash },
          { label: "Consignments", href: "/inventory/consignments", icon: Layers },
          { label: "Physical Stock Counts", href: "/inventory/counts", icon: CheckSquare },
          { label: "Landed Costs", href: "/inventory/landed-costs", icon: DollarSign },
        ],
      },
      {
        label: "Hardware & POS Devices",
        href: "/hardware",
        icon: Cpu,
        children: [
          { label: "Hardware & Devices", href: "/hardware", icon: Cpu },
          { label: "Device Inventory", href: "/devices", icon: Monitor },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 5. PURCHASING & PROCUREMENT (Advance / Enterprise)
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Purchasing",
    requiredPlan: "BUSINESS",
    items: [
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
        ],
      },
      {
        label: "Supplier Directory",
        href: "/suppliers",
        icon: Truck,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 6. ONLINE STORE (OMNICHANNEL ADD-ON)
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "E-Commerce",
    requiredAddon: "ecommerce",
    items: [
      {
        label: "E-Commerce Storefront",
        href: "http://localhost:3002",
        icon: Globe,
        badge: "Add-on",
        children: [
          { label: "Live Online Store", href: "http://localhost:3002", icon: Store },
          { label: "Visual Page Builder", href: "http://localhost:3002/setup", icon: Layers },
          { label: "Online Orders & Sales", href: "/sales/orders", icon: ShoppingCart },
          { label: "Track Order Portal", href: "http://localhost:3002/track-order", icon: Truck },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 7. FINANCE & ACCOUNTING (Advance / Enterprise)
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Finance & Accounts",
    requiredPlan: "BUSINESS",
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
      {
        label: "Tax & NBR VAT (Mushak)",
        href: "/tax",
        icon: DollarSign,
      },
      {
        label: "Expenses & Petty Cash",
        href: "/expenses",
        icon: DollarSign,
        children: [
          { label: "All Expenses", href: "/expenses", icon: DollarSign },
          { label: "Expense Categories", href: "/expenses/categories", icon: Tags },
          { label: "Petty Cash Fund", href: "/expenses/petty-cash", icon: Wallet },
          { label: "Recurring Expenses", href: "/expenses/recurring", icon: Repeat },
          { label: "Expenses Report", href: "/expenses/report", icon: BarChart3 },
        ],
      },
      {
        label: "Sales Commission & KPIs",
        href: "/commission",
        icon: Percent,
        children: [
          { label: "Commission Overview", href: "/commission", icon: Percent },
          { label: "Commission Agents", href: "/commission/agents", icon: UserCheck },
          { label: "Commission Rules", href: "/commission/rules", icon: Zap },
          { label: "Sales Targets & KPIs", href: "/targets", icon: Target },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 8. INDUSTRY VERTICALS & ADD-ON HUBS
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Industry Solutions",
    items: [
      {
        label: "Restaurant & Cafe",
        href: "/restaurant",
        icon: UtensilsCrossed,
        requiredAddon: "restaurant",
        children: [
          { label: "Restaurant Management", href: "/restaurant", icon: LayoutDashboard },
          { label: "Kitchen Management (KDS)", href: "/restaurant/kitchen", icon: Flame, target: "_blank", requiredAddon: "kitchen" },
          { label: "Slots & Reservation Matrix", href: "/restaurant/slots-matrix", icon: Calendar },
        ],
      },
      {
        label: "Pharmacy & Healthcare",
        href: "/pharmacy",
        icon: Pill,
        requiredAddon: "pharmacy",
        children: [
          { label: "Pharmacy Operations", href: "/pharmacy", icon: FlaskConical },
          { label: "Patient Display Screen", href: "/pharmacy/patient-display", icon: Monitor },
        ],
      },
      {
        label: "Retail & Superstore",
        href: "/retail",
        icon: ShoppingBag,
        requiredAddon: "retail",
        children: [
          { label: "Retail Operations Hub", href: "/retail", icon: ShoppingBag },
        ],
      },
      {
        label: "Grocery & Supermarket",
        href: "/grocery",
        icon: Scale,
        requiredAddon: "grocery",
        children: [
          { label: "Grocery Hub", href: "/grocery", icon: Scale },
        ],
      },
      {
        label: "Wholesale & B2B",
        href: "/wholesale",
        icon: Truck,
        requiredAddon: "wholesale",
        children: [
          { label: "Wholesale Commercial Hub", href: "/wholesale", icon: Building2 },
        ],
      },
      {
        label: "Bakery & Confectionery",
        href: "/bakery",
        icon: Croissant,
        requiredAddon: "bakery",
        children: [
          { label: "Bakery Operations Hub", href: "/bakery", icon: Croissant },
          { label: "Recipe & Production BOM", href: "/manufacturing", icon: Layers },
        ],
      },
      {
        label: "Manufacturing & Production",
        href: "/manufacturing",
        icon: Factory,
        requiredAddon: "manufacturing",
        children: [
          { label: "Production & BOM Hub", href: "/manufacturing", icon: Layers },
        ],
      },
      {
        label: "Salon & Spa Center",
        href: "/salon",
        icon: Scissors,
        requiredAddon: "salon",
        children: [
          { label: "Salon & Booking Hub", href: "/salon", icon: Calendar },
        ],
      },
      {
        label: "Repair & Service",
        href: "/repair",
        icon: Wrench,
        requiredAddon: "repair",
        children: [
          { label: "Repair Service Center", href: "/repair", icon: CheckSquare },
        ],
      },
      {
        label: "Franchise Network",
        href: "/franchise",
        icon: Store,
        requiredPlan: "ENTERPRISE",
        children: [
          { label: "Franchise HQ Hub", href: "/franchise", icon: Building2 },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 9. HUMAN RESOURCES (HRM)
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Human Resources",
    items: [
      {
        label: "HRM & Staff Members",
        href: "/hrm",
        icon: UserCog,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 10. ADMINISTRATION & SYSTEM
  // ══════════════════════════════════════════════════════════════════════
  {
    title: "Administration",
    items: [
      {
        label: "System & Store Settings",
        href: "/settings",
        icon: Settings,
        badge: "Config",
        children: [
          { label: "Company & Identity", href: "/settings?tab=company", icon: Building },
          { label: "Branches & Outlets", href: "/settings?tab=branch", icon: Store },
          { label: "POS Terminal Settings", href: "/settings?tab=pos", icon: Monitor },
          { label: "Offline Sync Engine", href: "/settings?tab=sync", icon: HardDrive },
          { label: "Tax & NBR VAT", href: "/settings?tab=tax", icon: DollarSign },
          { label: "Invoice & Print Layout", href: "/settings?tab=invoice", icon: FileText },
          { label: "Payment Gateways", href: "/settings?tab=payment", icon: CreditCard },
          { label: "Currencies & FX Rates", href: "/settings/currency", icon: Coins },
        ],
      },
      {
        label: "Multi-Branch Outlets",
        href: "/branches",
        icon: Building2,
        requiredPlan: "BUSINESS",
      },
      {
        label: "Roles & Permissions (RBAC)",
        href: "/rbac",
        icon: Shield,
        requiredPlan: "ENTERPRISE",
      },
      {
        label: "Workflow & Approvals",
        href: "/workflow",
        icon: GitMerge,
        badge: "Engine",
        requiredPlan: "ENTERPRISE",
        children: [
          { label: "Approval Center", href: "/workflow", icon: GitMerge },
          { label: "Pending Approvals", href: "/workflow/pending", icon: Clock },
          { label: "My Pending Approvals", href: "/workflow/pending/mine", icon: UserCheck },
          { label: "Approval Chains & Rules", href: "/workflow/rules", icon: GitBranch },
          { label: "Business Rules Engine", href: "/business-rules", icon: Zap },
          { label: "Business Rule Templates", href: "/business-rules/templates", icon: FileText },
        ],
      },
      {
        label: "Audit & Security Logs",
        href: "/audit-security",
        icon: Eye,
        requiredPlan: "ENTERPRISE",
      },
      {
        label: "Notifications & Alerts",
        href: "/notifications",
        icon: Bell,
        children: [
          { label: "Notification Center", href: "/notifications", icon: Bell },
          { label: "Channels & Delivery", href: "/notifications/channels", icon: Plug },
          { label: "Message Templates", href: "/notifications/templates", icon: FileText },
        ],
      },
      {
        label: "Data & Backup Management",
        href: "/data",
        icon: Database,
      },
      {
        label: "API & Integrations",
        href: "/integrations",
        icon: Plug,
        badge: "API",
        requiredPlan: "ENTERPRISE",
      },
      {
        label: "Onboarding Wizard",
        href: "/onboarding",
        icon: Sparkles,
      },
      {
        label: "System Performance",
        href: "/system/performance",
        icon: Cpu,
        requiredPlan: "ENTERPRISE",
      },
    ],
  },
  {
    title: "SaaS & Platform Core",
    items: [
      {
        label: "Platform Overview",
        href: "/saas?tab=overview",
        icon: LayoutDashboard,
      },
      {
        label: "Trial Requests & Approvals",
        href: "/saas?tab=trials",
        icon: Clock,
        badge: "Admin",
      },
      {
        label: "Pricing Plans & Tiers",
        href: "/saas?tab=plans",
        icon: Sparkles,
      },
      {
        label: "Tenant Subscriptions",
        href: "/saas?tab=subscription",
        icon: CreditCard,
      },
      {
        label: "Resource Quotas & Limits",
        href: "/saas?tab=usage",
        icon: BarChart3,
      },
      {
        label: "Feature Flags",
        href: "/saas?tab=features",
        icon: Zap,
      },
      {
        label: "Custom Field Schemas",
        href: "/saas?tab=fields",
        icon: Layers,
      },
      {
        label: "Form Templates",
        href: "/saas?tab=forms",
        icon: FileText,
      },
      {
        label: "System Diagnostics",
        href: "/saas?tab=health",
        icon: Activity,
      },
      {
        label: "Support & Escalations",
        href: "/saas?tab=tickets",
        icon: Shield,
      },
    ],
  },
];

export function useDynamicNav() {
  const { user, subscription, loading } = useAuth();

  const navGroups = useMemo(() => {
    const ctx = getTenantEntitlementContext(user, subscription);
    if (ctx.isSuperAdmin) {
      return DEFAULT_MASTER_NAV;
    }

    const userTier = ctx.userTier;
    const enabledModules = ctx.enabledModules;
    const userBusinessType = ctx.businessType;
    const hasRestaurant =
      userBusinessType === "RESTAURANT" ||
      enabledModules.has("restaurant") ||
      enabledModules.has("restaurant_kds");
    const hasRetailDisplay =
      userBusinessType === "RETAIL" ||
      enabledModules.has("retail");
    const hasAppointmentsAccess =
      ["SALON", "REPAIR", "RESTAURANT"].includes(userBusinessType) ||
      enabledModules.has("salon") ||
      enabledModules.has("repair");
    const accessibleTerminals = getAccessiblePosTerminals(user, subscription);
    const accessibleTerminalMap = new Map(accessibleTerminals.map((t) => [t.href, t]));
    let storeSlug = (user as any)?.tenantSlug || (subscription as any)?.tenantSlug || "";
    if (!storeSlug && typeof window !== "undefined") {
      try {
        const rawTenant = localStorage.getItem("blueoceans_tenant");
        const parsedTenant = rawTenant ? JSON.parse(rawTenant) : null;
        storeSlug = parsedTenant?.slug || parsedTenant?.id || "";
      } catch {}
    }
    if (!storeSlug && user?.tenantId) {
      storeSlug = String(user.tenantId);
    }
    const withStoreQuery = (url: string) => {
      if (!storeSlug || !url.startsWith("http://localhost:3002")) return url;
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}store=${encodeURIComponent(storeSlug)}`;
    };

    return DEFAULT_MASTER_NAV.filter((group) => group.title !== "SaaS & Platform Core")
      .map((group) => {
      const groupRequiredTier = group.requiredPlan ? PLAN_TIER_RANK[group.requiredPlan] || 1 : 1;
      const groupAddonMissing =
        group.requiredAddon &&
        !enabledModules.has(group.requiredAddon.toLowerCase()) &&
        userTier < 3;
      const groupPlanMissing = userTier < groupRequiredTier;

      const groupLocked = Boolean(groupPlanMissing || groupAddonMissing);
      const groupLockReason = groupAddonMissing
        ? `${group.title} Add-on`
        : groupPlanMissing
        ? group.requiredPlan === "ENTERPRISE"
          ? "Enterprise Plan"
          : "Advance Plan"
        : undefined;

      // Strictly filter Industry Solutions & vertical-only Sales items to the tenant's vertical + enabled add-ons
      let rawItems = group.items;
      if (group.title === "Industry Solutions") {
        rawItems = group.items.filter((item) => {
          const addon = item.requiredAddon?.toLowerCase() || "";
          // Retail/Grocery POS & Sales are already top-level in POS / Sales; hide redundant hub for single-vertical tenants
          if ((addon === "retail" && userBusinessType === "RETAIL") || (addon === "grocery" && userBusinessType === "GROCERY")) {
            return false;
          }
          if (userBusinessType === "MANUFACTURING" && (addon === "bakery" || addon === "manufacturing")) {
            return true;
          }
          if (userBusinessType === "FRANCHISE" && item.href === "/franchise") {
            return true;
          }
          if (addon && (addon === userBusinessType.toLowerCase() || enabledModules.has(addon))) {
            return true;
          }
          return false;
        });
      } else if (group.title === "Sales & Customers") {
        rawItems = group.items.filter((item) => item.href !== "/appointments" || hasAppointmentsAccess);
      }

      const items = rawItems.map((item) => {
        const itemRequiredTier = item.requiredPlan ? PLAN_TIER_RANK[item.requiredPlan] || 1 : 1;
        const itemAddonMissing =
          item.requiredAddon &&
          !enabledModules.has(item.requiredAddon.toLowerCase()) &&
          userTier < 3;
        const itemPlanMissing = userTier < itemRequiredTier;

        const isLocked = Boolean(groupLocked || itemPlanMissing || itemAddonMissing);
        const lockReason = itemAddonMissing
          ? `${item.label} Add-on`
          : itemPlanMissing
          ? item.requiredPlan === "ENTERPRISE"
            ? "Enterprise Plan"
            : "Advance Plan"
          : groupLockReason;

        let rawChildren = item.children || [];
        let dynamicLabel = item.label;
        let dynamicBadge = item.badge;
        let dynamicHref = item.href;

        if (item.label === "All POS Terminals") {
          rawChildren = rawChildren.filter((c) => accessibleTerminalMap.has(c.href));
          if (rawChildren.length === 1) {
            dynamicLabel = rawChildren[0].label;
            dynamicHref = rawChildren[0].href;
            dynamicBadge = userBusinessType;
            rawChildren = [];
          } else {
            dynamicBadge = `${rawChildren.length} Modes`;
          }
        }

        if (group.title === "Industry Solutions" && rawChildren.length === 1 && rawChildren[0].href === item.href) {
          rawChildren = [];
        }

        if (item.label === "Held Carts & Kiosk Tools") {
          rawChildren = rawChildren.filter((c) => {
            if (c.href === "/restaurant/customer-display") return hasRestaurant;
            if (c.href === "/retail-pos/customer-display") return hasRetailDisplay;
            if (c.href === "/customer-display") return !hasRestaurant && !hasRetailDisplay;
            return true;
          });
        }

        const children = rawChildren.map((child) => {
          const childRequiredTier = child.requiredPlan ? PLAN_TIER_RANK[child.requiredPlan] || 1 : 1;
          const isLoyaltyUnlockedByAddon =
            child.href === "/loyalty" &&
            (enabledModules.has("loyalty") || enabledModules.has("customer_loyalty"));
          const childAddonMissing =
            child.requiredAddon &&
            !enabledModules.has(child.requiredAddon.toLowerCase()) &&
            userTier < 3;
          const childPlanMissing = userTier < childRequiredTier && !isLoyaltyUnlockedByAddon;
          const terminalRule = accessibleTerminalMap.get(child.href);
          const isChildLocked = Boolean(
            isLocked || childPlanMissing || childAddonMissing || terminalRule?.isLocked
          );

          return {
            ...child,
            href: withStoreQuery(child.href),
            isLocked: isChildLocked,
            lockReason: terminalRule?.lockReason
              ? terminalRule.lockReason
              : childAddonMissing
              ? "Add-on"
              : childPlanMissing
              ? child.requiredPlan === "ENTERPRISE"
                ? "Enterprise"
                : "Upgrade"
              : lockReason,
          };
        });

        return {
          ...item,
          label: dynamicLabel,
          href: withStoreQuery(dynamicHref),
          badge: dynamicBadge,
          isLocked,
          lockReason,
          children: children.length > 0 ? children : undefined,
        };
      });

      return {
        ...group,
        items,
        isLocked: groupLocked,
        lockReason: groupLockReason,
      };
    })
    .filter((group) => group.items.length > 0);
  }, [user, subscription]);

  return { navGroups, loading, error: null as string | null };
}

export interface NavUpgradeTarget {
  featureName: string;
  requiredPlan?: string;
  requiredAddon?: string;
  lockReason?: string;
}

function normalizeNavRoute(route: string): { path: string; query: string } {
  if (!route) return { path: "", query: "" };
  const [path, query] = route.split("?");
  return { path: path.replace(/\/$/, ""), query: query || "" };
}

export function collectNavHrefs(navGroups: NavGroup[]): Set<string> {
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
}

export function isRouteActive(href: string, pathname: string, allHrefs: Set<string>): boolean {
  if (!href || href === "#") return false;

  const search = typeof window !== "undefined" ? window.location.search || "" : "";
  const currentNorm = normalizeNavRoute(pathname + search);
  const hrefNorm = normalizeNavRoute(href);

  if (hrefNorm.query) {
    return currentNorm.path === hrefNorm.path && currentNorm.query === hrefNorm.query;
  }

  if (currentNorm.path === hrefNorm.path) {
    if (currentNorm.query) {
      const exactQueryMatchExists = Array.from(allHrefs).some((other) => {
        const otherNorm = normalizeNavRoute(other);
        return (
          otherNorm.path === currentNorm.path &&
          Boolean(otherNorm.query) &&
          otherNorm.query === currentNorm.query
        );
      });
      if (exactQueryMatchExists) return false;
    }
    return true;
  }

  if (currentNorm.path.startsWith(hrefNorm.path + "/")) {
    const exactOrLongerMatchExists = Array.from(allHrefs).some((other) => {
      const otherNorm = normalizeNavRoute(other);
      if (otherNorm.path === currentNorm.path) return true;
      return (
        otherNorm.path.startsWith(hrefNorm.path + "/") &&
        currentNorm.path.startsWith(otherNorm.path + "/") &&
        otherNorm.path.length > hrefNorm.path.length
      );
    });
    return !exactOrLongerMatchExists;
  }

  return false;
}

export function isModuleActive(item: NavItem, pathname: string, allHrefs: Set<string>): boolean {
  if (isRouteActive(item.href, pathname, allHrefs)) return true;
  return (item.children ?? []).some(
    (c) =>
      isRouteActive(c.href, pathname, allHrefs) ||
      (c.children ?? []).some((s) => isRouteActive(s.href, pathname, allHrefs))
  );
}

export function isChildActive(child: NavChild, pathname: string, allHrefs: Set<string>): boolean {
  if (isRouteActive(child.href, pathname, allHrefs)) return true;
  return (child.children ?? []).some((s) => isRouteActive(s.href, pathname, allHrefs));
}

export function filterNavGroupsByQuery(navGroups: NavGroup[], query: string): NavGroup[] {
  const q = query.toLowerCase().trim();
  if (!q) return navGroups;

  return navGroups
    .map((group) => {
      const matchingItems = group.items
        .map((item) => {
          const matchesItem = item.label.toLowerCase().includes(q);
          const matchingChildren = (item.children ?? []).filter(
            (c) =>
              c.label.toLowerCase().includes(q) ||
              (c.children ?? []).some((s) => s.label.toLowerCase().includes(q))
          );

          if (matchesItem || matchingChildren.length > 0) {
            return {
              ...item,
              children:
                matchingChildren.length > 0 ? matchingChildren : item.children,
            };
          }
          return null;
        })
        .filter(Boolean) as NavItem[];

      return { ...group, items: matchingItems };
    })
    .filter((g) => g.items.length > 0);
}
