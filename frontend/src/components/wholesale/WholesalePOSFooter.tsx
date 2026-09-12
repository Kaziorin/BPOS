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
          "flex items-center gap-2 rounded-[22px] px-3 py-2 backdrop-blur-md transition-all",
          darkMode
            ? "border border-slate-700/80 bg-slate-900/85 shadow-lg"
            : "border border-primary-100/70 bg-white/95 shadow-sm",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center justify-between gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {/* 1. Primary Utility Actions */}
          <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700/30">
            {UTILITY_ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  if (a.id === "hold") onHold();
                  else onUtility?.(a.id);
                }}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-xl px-3 text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap",
                  darkMode
                    ? "bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50",
                )}
              >
                <a.Icon size={14} className="text-primary-500" />
                <span className="hidden lg:inline">{a.label}</span>
              </button>
            ))}
          </div>

          {/* 2. Metadata Info Chips */}
          <div className="flex items-center gap-1 pl-2">
            <MetaChip Icon={Warehouse} label="Warehouse" value={warehouseName} darkMode={darkMode} />
            <MetaChip Icon={User} label="Rep" value={salesRepName} avatar darkMode={darkMode} />
            <MetaChip Icon={Calendar} label="Delivery" value={deliveryDate} darkMode={darkMode} />
            <MetaChip Icon={Truck} label="Method" value={deliveryMethod} darkMode={darkMode} />
            <MetaChip Icon={CreditCard} label="Term" value={paymentTerm} darkMode={darkMode} />
            <MetaChip Icon={Percent} label="Comm." value={`${commission}%`} darkMode={darkMode} />
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
  sub,
  avatar,
  darkMode = false,
}: {
  Icon: ElementType;
  label: string;
  value: string;
  sub?: string;
  avatar?: boolean;
  darkMode?: boolean;
}) {
  return (
    <CustomButton
      type="button"
      variant="ghost"
      className={cn(
        "!h-auto !items-center !gap-2 !rounded-xl !border !px-2.5 !py-1.5",
        darkMode
          ? "!border-slate-700 !bg-slate-800/80 hover:!border-primary-500/40 hover:!bg-slate-800"
          : "!border-gray-200 !bg-gray-50/80 hover:!border-primary-200 hover:!bg-white",
      )}
    >
      {avatar ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white shadow-sm">
          {value
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </span>
      ) : (
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg border text-primary-500",
            darkMode
              ? "border-slate-700 bg-slate-900"
              : "border-gray-100 bg-white",
          )}
        >
          <Icon size={13} />
        </span>
      )}
      <span className="min-w-0 text-left">
        <span
          className={cn(
            "mb-0.5 block text-[9px] font-semibold uppercase leading-none tracking-wider",
            darkMode ? "text-slate-500" : "text-gray-400",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "flex max-w-[110px] items-center gap-0.5 truncate text-[11px] font-bold leading-tight",
            darkMode ? "text-slate-100" : "text-gray-800",
          )}
        >
          {value}
          <ChevronDown
            size={10}
            className={cn("shrink-0", darkMode ? "text-slate-600" : "text-gray-300")}
          />
        </span>
        {sub && (
          <span
            className={cn(
              "block text-[9px] font-medium",
              darkMode ? "text-slate-500" : "text-gray-400",
            )}
          >
            {sub}
          </span>
        )}
      </span>
    </CustomButton>
  );
}
