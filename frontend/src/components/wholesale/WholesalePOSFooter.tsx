"use client";

import type { ElementType } from "react";
import { motion } from "framer-motion";
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
  StickyNote,
  Paperclip,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CustomButton } from "@/components/custom";

const UTILITY_ACTIONS = [
  { id: "customer", label: "Customer Add/Search", Icon: UserPlus },
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
  noteCount?: number;
  attachmentCount?: number;
  submitting?: boolean;
  canProceed?: boolean;
  onUtility?: (id: string) => void;
  onHold: () => void;
  onProceed: () => void;
  darkMode?: boolean;
}

export function WholesalePOSFooter({
  warehouseName,
  salesRepName,
  salesRepId = "EMP-1042",
  deliveryDate,
  deliveryMethod,
  paymentTerm,
  commission,
  noteCount = 0,
  attachmentCount = 0,
  submitting,
  canProceed = true,
  onUtility,
  onHold,
  onProceed,
  darkMode = false,
}: WholesalePOSFooterProps) {
  return (
    <div className="shrink-0 space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {UTILITY_ACTIONS.map((a) => (
          <CustomButton
            key={a.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (a.id === "hold") onHold();
              else onUtility?.(a.id);
            }}
            leftIcon={<a.Icon size={13} className="text-primary-500" />}
            className={cn(
              "!rounded-xl !text-[11px] !font-semibold",
              darkMode
                ? "!border-slate-700 !bg-slate-800/90 !text-slate-300 hover:!border-primary-500/40 hover:!bg-slate-700 hover:!text-primary-300"
                : "!border-gray-200/80 !bg-white/90 text-gray-600 hover:!border-primary-200 hover:!bg-primary-50/50 hover:!text-primary-700",
            )}
          >
            {a.label}
          </CustomButton>
        ))}
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-2 backdrop-blur-md",
          darkMode
            ? "border border-slate-700/80 bg-slate-900/75 shadow-sm"
            : "border-primary-100/70 bg-white/90 shadow-sm",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <MetaChip Icon={Warehouse} label="Warehouse" value={warehouseName} darkMode={darkMode} />
          <MetaChip
            Icon={User}
            label="Rep"
            value={salesRepName}
            avatar
            darkMode={darkMode}
          />
          <MetaChip Icon={Calendar} label="Delivery" value={deliveryDate} darkMode={darkMode} />
          <MetaChip Icon={Truck} label="Method" value={deliveryMethod} darkMode={darkMode} />
          <MetaChip Icon={CreditCard} label="Term" value={paymentTerm} darkMode={darkMode} />
          <MetaChip Icon={Percent} label="Comm." value={`${commission}%`} darkMode={darkMode} />
          <MetaChip
            Icon={StickyNote}
            label="Notes"
            value={noteCount ? `${noteCount}` : "Add"}
            darkMode={darkMode}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Action buttons moved to Cart Panel for better accessibility */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400 italic pr-2">
            Proceed with F1 · Hold with F6
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
