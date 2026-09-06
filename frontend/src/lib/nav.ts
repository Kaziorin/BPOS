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
  Pill,
  Landmark,
  UserCog,
  BarChart3,
  Settings,
  DollarSign,
  ReceiptText,
  FileText,
  RotateCcw,
  Wrench,
  Shield,
  Monitor,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Sales",
    items: [
      { label: "POS / New Sale", href: "/pos", icon: ShoppingCart },
      { label: "Sales History", href: "/sales", icon: Receipt },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: Tags },
    ],
  },
  {
    title: "Purchasing",
    items: [
      { label: "Purchases", href: "/purchases", icon: ClipboardList },
      { label: "Suppliers", href: "/suppliers", icon: Truck },
    ],
  },
  {
    title: "People",
    items: [{ label: "Customers", href: "/customers", icon: Users }],
  },
  {
    title: "Finance",
    items: [
      { label: "Accounting", href: "/accounting", icon: Landmark },
      { label: "Tax / VAT", href: "/tax", icon: DollarSign },
      { label: "Invoices", href: "/invoices", icon: FileText },
    ],
  },
  {
    title: "Returns & Warranty",
    items: [
      { label: "Returns", href: "/returns", icon: RotateCcw },
      { label: "RMA", href: "/rma", icon: Wrench },
      { label: "Warranty", href: "/warranty", icon: Shield },
    ],
  },
  {
    title: "Modules",
    items: [
      { label: "Restaurant", href: "/restaurant", icon: UtensilsCrossed },
      { label: "Pharmacy Register", href: "/pharmacy", icon: Pill },
      { label: "Customer Display", href: "/customer-display", icon: Monitor },
      { label: "HRM", href: "/hrm", icon: UserCog },
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
