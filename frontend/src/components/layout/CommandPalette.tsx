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
  Receipt,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  Warehouse,
  PlusCircle,
  X,
} from "lucide-react";

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
  { id: "new-sale", title: "New POS Sale", subtitle: "Open terminal and start instant checkout", category: "Quick Actions", icon: ShoppingCart, href: "/pos", keywords: ["pos", "sell", "checkout", "cart", "barcode"] },
  { id: "add-product", title: "Add New Product", subtitle: "Create item with barcode, pricing and stock", category: "Quick Actions", icon: PlusCircle, href: "/products/create", keywords: ["product", "item", "create", "new"] },
  { id: "new-po", title: "Create Purchase Order (PO)", subtitle: "Order inventory from vendor", category: "Quick Actions", icon: FileText, href: "/purchasing/orders", keywords: ["po", "purchase", "vendor", "supplier", "buy"] },
  { id: "new-customer", title: "Add New Customer", subtitle: "Register customer profile & phone", category: "Quick Actions", icon: Users, href: "/customers/create", keywords: ["customer", "client", "buyer"] },

  // POS & Retail
  { id: "pos-terminal", title: "POS Counter Checkout", subtitle: "Express retail checkout interface", category: "POS & Retail", icon: ShoppingCart, href: "/pos" },
  { id: "cash-register", title: "Cash Register & Shifts", subtitle: "Drawer balance, cash in/out, Z-report", category: "POS & Retail", icon: DollarSign, href: "/cash-register" },
  { id: "held-orders", title: "Held Sales / Carts", subtitle: "Resume paused transactions", category: "POS & Retail", icon: ShoppingCart, href: "/pos/holds" },
  { id: "price-checker", title: "Price & Barcode Checker", subtitle: "Fast kiosk price scanner", category: "POS & Retail", icon: Search, href: "/pos/price-checker" },

  // Inventory
  { id: "products-list", title: "Products Catalog", subtitle: "Manage stock items, prices and barcodes", category: "Inventory", icon: Package, href: "/products" },
  { id: "stock-overview", title: "Stock Levels & Ledger", subtitle: "Current inventory across warehouses", category: "Inventory", icon: Warehouse, href: "/inventory/stock" },
  { id: "stock-transfers", title: "Inter-Branch Transfers", subtitle: "Move goods between outlets", category: "Inventory", icon: ArrowRight, href: "/inventory/transfers" },
  { id: "purchasing-grn", title: "Goods Received Notes (GRN)", subtitle: "Receive and verify vendor deliveries", category: "Inventory", icon: FileText, href: "/purchasing/grns" },
  { id: "suppliers", title: "Supplier Directory", subtitle: "Vendor contacts & payables", category: "Inventory", icon: Users, href: "/suppliers" },

  // Accounting & Finance
  { id: "accounting", title: "Financial Overview", subtitle: "General ledger & balance summary", category: "Accounting", icon: Landmark, href: "/accounting" },
  { id: "pnl", title: "Profit & Loss (P&L)", subtitle: "Income statement & gross margins", category: "Accounting", icon: Landmark, href: "/accounting/pnl" },
  { id: "balance-sheet", title: "Balance Sheet", subtitle: "Assets, liabilities & equity", category: "Accounting", icon: Landmark, href: "/accounting/balance-sheet" },
  { id: "tax-mushak", title: "Tax & NBR VAT (Mushak)", subtitle: "Mushak 6.3 & VAT calculation rules", category: "Accounting", icon: DollarSign, href: "/tax" },
  { id: "expenses", title: "Expenses & Petty Cash", subtitle: "Log store expenses & vouchers", category: "Accounting", icon: DollarSign, href: "/expenses" },

  // Admin & Settings
  { id: "dashboard", title: "Executive Dashboard", subtitle: "Sales metrics, revenue & analytics", category: "Admin & Settings", icon: Sparkles, href: "/dashboard" },
  { id: "onboarding", title: "Onboarding Wizard", subtitle: "Store & organization setup guide", category: "Admin & Settings", icon: Sparkles, href: "/onboarding" },
  { id: "branches", title: "Branch Outlets", subtitle: "Manage physical store locations", category: "Admin & Settings", icon: Building2, href: "/branches" },
  { id: "rbac", title: "Roles & Permissions (RBAC)", subtitle: "Staff security & access levels", category: "Admin & Settings", icon: Shield, href: "/rbac" },
  { id: "settings", title: "Store Settings", subtitle: "Currency, receipt templates & options", category: "Admin & Settings", icon: Building2, href: "/settings" },
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 animate-[scale-in_150ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-100 px-4 py-3.5">
          <Search size={18} className="text-slate-400 shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
            placeholder="Type a command, page name, or action... (e.g. 'pos', 'stock', 'tax')"
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
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
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
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? "bg-primary-50 text-primary-950" : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{cmd.title}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{cmd.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className={isSelected ? "text-primary-600" : "text-slate-300"} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500">
          <span>Navigate with <kbd className="font-mono bg-white border border-slate-200 px-1 rounded shadow-2xs">↑</kbd> <kbd className="font-mono bg-white border border-slate-200 px-1 rounded shadow-2xs">↓</kbd></span>
          <span>Select with <kbd className="font-mono bg-white border border-slate-200 px-1 rounded shadow-2xs">Enter</kbd></span>
          <span>Close with <kbd className="font-mono bg-white border border-slate-200 px-1 rounded shadow-2xs">Esc</kbd></span>
        </div>
      </div>
    </div>
  );
}
