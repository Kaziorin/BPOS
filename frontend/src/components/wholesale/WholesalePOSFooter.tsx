"use client";

import type { ElementType } from "react";
import {
  UserPlus,
  PauseCircle,
  History,
  FileText,
  ArrowLeftRight,
  Receipt,
  Warehouse,
  User,
  Calendar,
  Truck,
  CreditCard,
  Percent,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CustomButton } from "@/components/custom";

const UTILITY_ACTIONS = [
  { id: "customer", label: "Add Customer", Icon: UserPlus },
  { id: "hold", label: "Hold Order", Icon: PauseCircle },
  { id: "recent", label: "Recent Orders", Icon: History },
  { id: "quotations", label: "Quotations", Icon: FileText },
  { id: "transfer", label: "Stock Transfer", Icon: ArrowLeftRight },
  { id: "history", label: "Sales History", Icon: Receipt },
];

interface WholesalePOSFooterProps {
  warehouseName: string;
  salesRepName: string;
  salesRepId?: string;
  deliveryDate: string;
  deliveryMethod: string;
  paymentTerm: string;
  commission: number;
  onUtility?: (id: string) => void;
  onHold: () => void;
  darkMode?: boolean;
}

export function WholesalePOSFooter({
  warehouseName,
  salesRepName,
  deliveryDate,
  deliveryMethod,
  paymentTerm,
  commission,
  onUtility,
  onHold,
  darkMode = false,
}: WholesalePOSFooterProps) {
  return (
    <div className="shrink-0">
      <div
        className={cn(
          "flex items-center gap-1 rounded-[18px] px-2.5 py-2 backdrop-blur-md transition-all",
          darkMode
            ? "border border-slate-700 bg-slate-900/90 shadow-lg"
            : "border border-slate-200/90 bg-white/95 shadow-md shadow-slate-200/50",
        )}
      >
        <div className="flex w-full items-center gap-1.5">
          {/* 1. Primary Utility Actions - Distributed Flex */}
          <div className="flex flex-[1.2] items-center gap-1.5">
            {UTILITY_ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  if (a.id === "hold") onHold();
                  else onUtility?.(a.id);
                }}
                className={cn(
                  "flex h-9 flex-1 min-w-0 items-center justify-center gap-2 rounded-xl px-2.5 text-[11px] font-bold transition-all active:scale-95 border cursor-pointer",
                  darkMode
                    ? "bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100/90 text-slate-800 border-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-2xs group",
                )}
              >
                <span className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-colors",
                  darkMode
                    ? "bg-slate-950 text-blue-400"
                    : "bg-slate-800 text-white group-hover:bg-white group-hover:text-blue-600"
                )}>
                  {a.id === 'customer' ? <UserPlus size={12} /> : a.label.charAt(0)}
                </span>
                <span className="truncate">{a.label}</span>
              </button>
            ))}
          </div>

          <div className={cn("h-6 w-px shrink-0 mx-1", darkMode ? "bg-slate-800" : "bg-slate-300")} />

          {/* 2. Metadata Info Chips - Distributed Flex */}
          <div className="flex flex-1 items-center gap-1.5">
            <MetaChip Icon={Warehouse} label="WAREHOUSE" value={warehouseName} darkMode={darkMode} />
            <MetaChip Icon={User} label="REP" value={salesRepName} avatar darkMode={darkMode} />
            <MetaChip Icon={Calendar} label="DELIVERY" value={deliveryDate} darkMode={darkMode} />
            <MetaChip Icon={Truck} label="METHOD" value={deliveryMethod} darkMode={darkMode} />
            <MetaChip Icon={CreditCard} label="TERM" value={paymentTerm} darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaChip({
  Icon,
  label,
  value,
  avatar,
  darkMode = false,
}: {
  Icon: ElementType;
  label: string;
  value: string;
  avatar?: boolean;
  darkMode?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-9 flex-1 min-w-0 items-center gap-2 rounded-xl border px-2.5 transition-all cursor-default",
        darkMode
          ? "border-slate-700 bg-slate-800/50"
          : "border-slate-300 bg-slate-100/70 shadow-2xs",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
          darkMode ? "bg-slate-950 border-slate-700 text-blue-400" : "bg-white border-slate-200 text-blue-600 shadow-xs",
        )}
      >
        <Icon size={11} />
      </span>
      <div className="flex flex-col leading-tight min-w-0 overflow-hidden">
        <span
          className={cn(
            "text-[7px] font-black uppercase tracking-widest truncate",
            darkMode ? "text-slate-500" : "text-slate-500",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "text-[10px] font-extrabold truncate",
            darkMode ? "text-slate-200" : "text-slate-900",
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

