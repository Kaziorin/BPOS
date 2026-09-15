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
  ArrowRight,
  Monitor,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";

export interface PosTerminalOption {
  id: string;
  name: string;
  href: string;
  icon: any;
  category: string;
  terminalCode: string;
  desc: string;
  accent: string;
}

export const ALL_POS_TERMINALS: PosTerminalOption[] = [
  {
    id: "retail",
    name: "Retail POS Terminal",
    href: "/retail-pos",
    icon: ShoppingCart,
    category: "General Retail",
    terminalCode: "TERM-01 (Main Counter)",
    desc: "Fast barcode checkout, multi-tender payments, held carts & instant thermal receipt printing.",
    accent: "from-sky-500 to-blue-600",
  },
  {
    id: "wholesale",
    name: "Wholesale POS Counter",
    href: "/wholesale/pos",
    icon: Package,
    category: "B2B & Distribution",
    terminalCode: "TERM-02 (Bulk Desk)",
    desc: "Large quantity bulk sales, tiered wholesale pricing, customer credit ledger & packing slips.",
    accent: "from-blue-600 to-indigo-600",
  },
  {
    id: "pharmacy",
    name: "Pharmacy Rx POS",
    href: "/pharmacy/pos",
    icon: Pill,
    category: "Healthcare & Drugs",
    terminalCode: "TERM-03 (Dispensary)",
    desc: "Prescription medicine sales, FEFO batch/expiry tracking, generic substitutions & narcotics log.",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "restaurant",
    name: "Restaurant & Cafe POS",
    href: "/restaurant/pos",
    icon: UtensilsCrossed,
    category: "Food & Beverage",
    terminalCode: "TERM-04 (Dining Floor)",
    desc: "Interactive table layout, split bills, kitchen order ticketing (KOT) & waiter order routing.",
    accent: "from-rose-500 to-orange-600",
  },
  {
    id: "bakery",
    name: "Bakery & Confectionery POS",
    href: "/bakery/pos",
    icon: Croissant,
    category: "Bakery & Pastry",
    terminalCode: "TERM-05 (Bakery Counter)",
    desc: "Fresh baked breads, pastries, custom cakes, hot snacks, recipe BOM & batch delivery checkout.",
    accent: "from-amber-500 to-yellow-600",
  },
  {
    id: "grocery",
    name: "Grocery & Supermarket POS",
    href: "/grocery/pos",
    icon: ShoppingBag,
    category: "Supermarket & Produce",
    terminalCode: "TERM-06 (Express Lane)",
    desc: "Integrated digital weigh scales, PLU loose item barcodes, rapid scan & multiple baggers.",
    accent: "from-green-500 to-emerald-600",
  },
  {
    id: "repair",
    name: "Repair & Service POS",
    href: "/repair/pos",
    icon: Wrench,
    category: "Electronics & Auto",
    terminalCode: "TERM-07 (Service Desk)",
    desc: "Job intake diagnosis, technician labor tracking, spare parts billing & collection warranty.",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    id: "salon",
    name: "Salon & Spa POS",
    href: "/salon/pos",
    icon: Scissors,
    category: "Beauty & Wellness",
    terminalCode: "TERM-08 (Front Desk)",
    desc: "Stylist appointment calendar, multi-service bookings, chair commission & beauty retail sales.",
    accent: "from-fuchsia-500 to-pink-600",
  },
  {
    id: "franchise",
    name: "Franchise & Outlet POS",
    href: "/franchise/pos",
    icon: Building2,
    category: "Multi-Store Chain",
    terminalCode: "TERM-09 (Franchise HQ)",
    desc: "Multi-branch synchronized sales counter, master catalog pricing & unified royalty tracking.",
    accent: "from-violet-500 to-purple-600",
  },
];

interface PosTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PosTerminalModal({ isOpen, onClose }: PosTerminalModalProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const displayRole = user?.roleName || user?.role || "All Terminals";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none animate-[fade-in_150ms_ease-out]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-sky-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col rounded-sm border border-sky-200/90 bg-white shadow-2xl animate-[scale-in_150ms_ease-out] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white shadow-2xs">
              <Monitor size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0369A1] sm:text-lg tracking-tight">
                  POS Terminals & Counter Hub
                </h2>
                <span className="inline-flex items-center gap-1 rounded-sm bg-sky-100/80 px-2 py-0.5 text-[10px] font-bold text-[#0284C7] border border-sky-200">
                  <Sparkles size={10} />
                  {displayRole}
                </span>
              </div>
              <p className="truncate text-xs font-medium text-slate-500">
                Direct access to all 9 industry-specific POS counters & live terminals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-sky-200/80 bg-white text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition cursor-pointer"
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
                    "group relative flex flex-col justify-between rounded-sm border p-3.5 transition-all duration-150 hover:shadow-md cursor-pointer",
                    isActive
                      ? "border-[#0284C7] bg-[#E0F2FE]/40 ring-1 ring-[#0284C7]"
                      : "border-sky-100 bg-white hover:border-sky-300 hover:bg-sky-50/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-white shadow-2xs bg-gradient-to-tr",
                          term.accent
                        )}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-[#0369A1] group-hover:text-[#0284C7] transition-colors">
                            {term.name}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                              <CheckCircle2 size={10} /> Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-[#0284C7] block">
                          {term.terminalCode}
                        </span>
                        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {term.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-sky-100/70 flex items-center justify-between text-xs">
                    <span className="text-[10.5px] font-medium text-slate-400">
                      {term.category}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#0284C7] group-hover:translate-x-0.5 transition-transform text-xs">
                      {isActive ? "Currently Open" : "Launch Terminal"}
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-sky-100 bg-sky-50/50 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Building2 size={13} className="text-[#0284C7]" />
            <span>Main Branch • Central Terminal Network</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm border border-sky-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
