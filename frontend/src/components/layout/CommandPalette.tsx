"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Package,
  Users,
  Building2,
  DollarSign,
  Landmark,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  Warehouse,
  PlusCircle,
  X,
  Croissant,
  ShoppingBag,
  Wrench,
  Scissors,
  Pill,
  UtensilsCrossed,
  Truck,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Quick Actions" | "POS & Retail" | "Inventory" | "Accounting" | "Admin & Settings";
  icon: any;
  href: string;
  keywords?: string[];
}

const COMMANDS: CommandItem[] = [
  // Quick Actions
  { id: "new-sale", title: "New POS Sale", subtitle: "Open terminal and start instant checkout", category: "Quick Actions", icon: ShoppingCart, href: "/retail-pos", keywords: ["pos", "sell", "checkout", "cart", "barcode"] },
  { id: "add-product", title: "Add New Product", subtitle: "Create item with barcode, pricing and stock", category: "Quick Actions", icon: PlusCircle, href: "/products/create", keywords: ["product", "item", "create", "new"] },
  { id: "new-po", title: "Create Purchase Order (PO)", subtitle: "Order inventory from vendor", category: "Quick Actions", icon: FileText, href: "/purchasing/orders", keywords: ["po", "purchase", "vendor", "supplier", "buy"] },
  { id: "new-customer", title: "Add New Customer", subtitle: "Register customer profile & phone", category: "Quick Actions", icon: Users, href: "/customers/create", keywords: ["customer", "client", "buyer"] },

  // POS & Retail
  { id: "pos-terminal", title: "Retail POS Counter", subtitle: "Express retail checkout interface", category: "POS & Retail", icon: ShoppingCart, href: "/retail-pos", keywords: ["retail", "pos", "counter", "checkout"] },
  { id: "bakery-pos", title: "Bakery & Confectionery POS", subtitle: "Fresh baked goods, pastries & recipe BOM", category: "POS & Retail", icon: Croissant, href: "/bakery/pos", keywords: ["bakery", "pastry", "cake", "bread", "pos"] },
  { id: "grocery-pos", title: "Grocery & Supermarket POS", subtitle: "Weigh scales, PLU loose item barcodes & lanes", category: "POS & Retail", icon: ShoppingBag, href: "/grocery/pos", keywords: ["grocery", "supermarket", "scale", "produce"] },
  { id: "restaurant-pos", title: "Restaurant & Table Map POS", subtitle: "Dine-in table map, KDS kitchen & takeout", category: "POS & Retail", icon: UtensilsCrossed, href: "/restaurant/pos", keywords: ["restaurant", "cafe", "table", "kitchen", "kds"] },
  { id: "pharmacy-pos", title: "Pharmacy Rx FEFO POS", subtitle: "Batch expiry FEFO tracking & prescription billing", category: "POS & Retail", icon: Pill, href: "/pharmacy/pos", keywords: ["pharmacy", "medicine", "fefo", "rx"] },
  { id: "wholesale-pos", title: "Wholesale B2B POS", subtitle: "Volume tiers, client credit limits & invoice counter", category: "POS & Retail", icon: Truck, href: "/wholesale/pos", keywords: ["wholesale", "b2b", "bulk", "credit"] },
  { id: "repair-pos", title: "Repair & Service POS", subtitle: "Device intake diagnosis, technician labor & warranty", category: "POS & Retail", icon: Wrench, href: "/repair/pos", keywords: ["repair", "service", "job", "device"] },
  { id: "salon-pos", title: "Salon & Spa POS", subtitle: "Stylist appointment calendar & chair commission", category: "POS & Retail", icon: Scissors, href: "/salon/pos", keywords: ["salon", "spa", "beauty", "hair"] },
  { id: "franchise-pos", title: "Franchise & Outlet POS", subtitle: "Multi-branch synchronized sales & master catalog", category: "POS & Retail", icon: Building2, href: "/franchise/pos", keywords: ["franchise", "chain", "outlet"] },
  { id: "cash-register", title: "Cash Register & Shifts", subtitle: "Drawer balance, cash in/out, Z-report", category: "POS & Retail", icon: DollarSign, href: "/cash-register", keywords: ["cash", "register", "drawer", "shift"] },
  { id: "held-orders", title: "Held Sales / Carts", subtitle: "Resume paused transactions", category: "POS & Retail", icon: ShoppingCart, href: "/retail-pos/holds", keywords: ["hold", "held", "pause"] },
  { id: "price-checker", title: "Price & Barcode Checker", subtitle: "Fast kiosk price scanner", category: "POS & Retail", icon: Search, href: "/retail-pos/price-checker", keywords: ["price", "barcode", "checker"] },
  { id: "customer-display", title: "Customer Facing Display", subtitle: "Dual-screen live cart & total", category: "POS & Retail", icon: Monitor, href: "/customer-display", keywords: ["customer", "display", "screen"] },

  // Inventory
  { id: "products-list", title: "Products Catalog", subtitle: "Manage stock items, prices and barcodes", category: "Inventory", icon: Package, href: "/products", keywords: ["items", "inventory", "stock", "products"] },
  { id: "stock-overview", title: "Stock Levels & Ledger", subtitle: "Current inventory across warehouses", category: "Inventory", icon: Warehouse, href: "/inventory/stock", keywords: ["inventory", "stock", "levels", "warehouses"] },
  { id: "stock-transfers", title: "Inter-Branch Transfers", subtitle: "Move goods between outlets", category: "Inventory", icon: ArrowRight, href: "/inventory/transfers", keywords: ["transfer", "branch", "inter-branch"] },
  { id: "purchasing-grn", title: "Goods Received Notes (GRN)", subtitle: "Receive and verify vendor deliveries", category: "Inventory", icon: FileText, href: "/purchasing/grns", keywords: ["grn", "receive", "delivery"] },
  { id: "suppliers", title: "Supplier Directory", subtitle: "Vendor contacts & payables", category: "Inventory", icon: Users, href: "/suppliers", keywords: ["vendor", "supplier", "payables"] },

  // Accounting & Finance
  { id: "accounting", title: "Financial Overview", subtitle: "General ledger & balance summary", category: "Accounting", icon: Landmark, href: "/accounting", keywords: ["finance", "ledger", "accounts"] },
  { id: "pnl", title: "Profit & Loss (P&L)", subtitle: "Income statement & gross margins", category: "Accounting", icon: Landmark, href: "/accounting/pnl", keywords: ["pnl", "profit", "loss", "income"] },
  { id: "balance-sheet", title: "Balance Sheet", subtitle: "Assets, liabilities & equity", category: "Accounting", icon: Landmark, href: "/accounting/balance-sheet", keywords: ["balance", "sheet", "assets"] },
  { id: "tax-mushak", title: "Tax & NBR VAT (Mushak)", subtitle: "Mushak 6.3 & VAT calculation rules", category: "Accounting", icon: DollarSign, href: "/tax", keywords: ["vat", "tax", "nbr", "mushak"] },
  { id: "expenses", title: "Expenses & Petty Cash", subtitle: "Log store expenses & vouchers", category: "Accounting", icon: DollarSign, href: "/expenses", keywords: ["expense", "petty cash", "voucher"] },

  // Admin & Settings
  { id: "dashboard", title: "Executive Dashboard", subtitle: "Sales metrics, revenue & analytics", category: "Admin & Settings", icon: Sparkles, href: "/dashboard", keywords: ["dashboard", "home", "analytics"] },
  { id: "onboarding", title: "Onboarding Wizard", subtitle: "Store & organization setup guide", category: "Admin & Settings", icon: Sparkles, href: "/onboarding", keywords: ["wizard", "setup"] },
  { id: "branches", title: "Branch Outlets", subtitle: "Manage physical store locations", category: "Admin & Settings", icon: Building2, href: "/branches", keywords: ["outlet", "location", "store"] },
  { id: "rbac", title: "Roles & Permissions (RBAC)", subtitle: "Staff security & access levels", category: "Admin & Settings", icon: Shield, href: "/rbac", keywords: ["role", "permission", "security"] },
  { id: "settings", title: "Store Settings", subtitle: "Currency, receipt templates & options", category: "Admin & Settings", icon: Building2, href: "/settings", keywords: ["settings", "config"] },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        isOpen ? onClose() : window.dispatchEvent(new Event("omni:open-command-palette"));
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = COMMANDS.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  });

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-3 sm:p-4 bg-sky-950/45 backdrop-blur-xs select-none animate-[fade-in_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-sm bg-white shadow-2xl border border-sky-200/90 animate-[scale-in_150ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50 px-4 py-3">
          <Search size={17} className="text-[#0284C7] shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            className="w-full bg-transparent text-sm font-medium text-gray-700 placeholder:text-sky-900/40 outline-none"
            placeholder="Search pages, items, actions... (e.g. 'pos', 'bakery', 'stock', 'tax')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
              } else if (e.key === "Enter" && filtered[selectedIndex]) {
                e.preventDefault();
                handleSelect(filtered[selectedIndex].href);
              }
            }}
          />
          {/* Red Close Button */}
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs ml-2"
            title="Close (Esc)"
            aria-label="Close search"
          >
            <X size={15} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs font-medium text-gray-500">
              No matching pages or commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "group flex items-center justify-between p-2.5 rounded-sm border cursor-pointer transition-all duration-150 shadow-2xs",
                    isSelected
                      ? "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] border-[#0284C7] text-white shadow-md"
                      : "bg-white hover:bg-sky-50/50 border-sky-100/90 text-gray-700"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-sm shrink-0 transition-colors shadow-2xs",
                        isSelected
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-sky-50 border border-sky-200/80 text-[#0284C7] group-hover:bg-[#E0F2FE]"
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <span
                      className={cn(
                        "font-semibold text-xs sm:text-sm truncate min-w-0 flex-1",
                        isSelected ? "text-white font-bold" : "text-gray-700 group-hover:text-[#0369A1]"
                      )}
                    >
                      {cmd.title}
                    </span>
                  </div>
                  <ArrowRight
                    size={14}
                    className={cn(
                      "shrink-0 transition-transform ml-2",
                      isSelected ? "text-white translate-x-0.5" : "text-slate-400 group-hover:text-[#0284C7]"
                    )}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
