"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  ShoppingCart,
  Package,
  Pill,
  UtensilsCrossed,
  ShoppingBag,
  Croissant,
  Wrench,
  Scissors,
  Building2,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface PosTerminalOption {
  id: string;
  name: string;
  href: string;
  icon: any;
  accent: string;
}

export const ALL_POS_TERMINALS: PosTerminalOption[] = [
  {
    id: "retail",
    name: "Retail POS Terminal",
    href: "/retail-pos",
    icon: ShoppingCart,
    accent: "from-sky-500 to-blue-600",
  },
  {
    id: "wholesale",
    name: "Wholesale POS Counter",
    href: "/wholesale/pos",
    icon: Package,
    accent: "from-blue-600 to-indigo-600",
  },
  {
    id: "pharmacy",
    name: "Pharmacy Rx POS",
    href: "/pharmacy/pos",
    icon: Pill,
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "restaurant",
    name: "Restaurant & Cafe POS",
    href: "/restaurant/pos",
    icon: UtensilsCrossed,
    accent: "from-rose-500 to-orange-600",
  },
  {
    id: "bakery",
    name: "Bakery & Confectionery POS",
    href: "/bakery/pos",
    icon: Croissant,
    accent: "from-amber-500 to-yellow-600",
  },
  {
    id: "grocery",
    name: "Grocery & Supermarket POS",
    href: "/grocery/pos",
    icon: ShoppingBag,
    accent: "from-green-500 to-emerald-600",
  },
  {
    id: "repair",
    name: "Repair & Service POS",
    href: "/repair/pos",
    icon: Wrench,
    accent: "from-cyan-500 to-blue-600",
  },
  {
    id: "salon",
    name: "Salon & Spa POS",
    href: "/salon/pos",
    icon: Scissors,
    accent: "from-fuchsia-500 to-pink-600",
  },
  {
    id: "franchise",
    name: "Franchise & Outlet POS",
    href: "/franchise/pos",
    icon: Building2,
    accent: "from-violet-500 to-purple-600",
  },
];

interface PosTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PosTerminalModal({ isOpen, onClose }: PosTerminalModalProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none animate-[fade-in_150ms_ease-out]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col rounded-sm border border-brand-border bg-white shadow-2xl animate-[scale-in_150ms_ease-out] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-brand-50/50 via-white to-brand-50/30 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-white shadow-2xs">
              <Monitor size={18} />
            </div>
            <h2 className="text-base font-bold text-brand-dark sm:text-lg tracking-tight">
              POS Terminals
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition cursor-pointer shadow-2xs"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: Terminals Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_POS_TERMINALS.map((term) => {
              const Icon = term.icon;
              const isActive =
                pathname === term.href ||
                (term.href !== "/dashboard" && pathname.startsWith(term.href));

              return (
                <Link
                  key={term.id}
                  href={term.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-3.5 rounded-sm border p-3.5 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                    isActive
                      ? "border-brand-primary bg-brand-50 ring-1 ring-brand-border"
                      : "border-slate-200 bg-white hover:border-brand-primary hover:bg-brand-50/50 shadow-2xs"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-white shadow-2xs bg-gradient-to-tr transition-transform duration-150 group-hover:scale-105",
                      term.accent
                    )}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-brand-dark group-hover:text-brand-primary transition-colors truncate">
                    {term.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-brand-50/50 px-4 sm:px-6 py-2.5">
          <button
            onClick={onClose}
            className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
