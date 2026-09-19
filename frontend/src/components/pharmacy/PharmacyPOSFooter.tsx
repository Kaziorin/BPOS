"use client";

import React from "react";
import { User, Monitor, Cloud, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { CustomBadge, CustomButton } from "@/components/custom";

export interface PharmacyPOSFooterProps {
  timeStr: string;
  dateStr: string;
  cashierName: string;
  terminalName?: string;
  online: boolean;
  lastBackupTime?: string;
  heldBillsCount?: number;
  onResumeHeldBill?: () => void;
  onSalesHistory?: () => void;
  onOpenDrawer?: () => void;
  darkMode?: boolean;
}

export function PharmacyPOSFooter({
  timeStr,
  dateStr,
  cashierName,
  terminalName = "PC-01",
  online,
  lastBackupTime = "11:30 AM",
  heldBillsCount = 0,
  onResumeHeldBill,
  onSalesHistory,
  onOpenDrawer,
  darkMode,
}: PharmacyPOSFooterProps) {
  return (
    <footer className={cn(
      "flex w-full flex-none items-center justify-between px-4 py-1 text-[11px] select-none h-10 transition overflow-x-auto no-scrollbar",
      darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-gray-600"
    )}>
      {/* Left: Time & Date */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="leading-tight">
          <p className="text-[13px] font-black tabular-nums text-[#00796b] dark:text-brand-primary">{timeStr}</p>
          <p className="text-[10px] font-semibold text-slate-400">{dateStr}</p>
        </div>

        <div className={cn("h-5 w-px mx-0.5 hidden sm:block", darkMode ? "bg-slate-800" : "bg-slate-200")} />

        {/* Cashier */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", darkMode ? "bg-teal-950/60 text-brand-primary" : "bg-brand-50 text-brand-dark")}>
            <User size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Cashier</p>
            <p className={cn("text-[11px] font-extrabold", darkMode ? "text-slate-100" : "text-gray-600")}>{cashierName}</p>
          </div>
        </div>

        <div className={cn("h-5 w-px mx-0.5 hidden sm:block", darkMode ? "bg-slate-800" : "bg-slate-200")} />

        {/* Terminal */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", darkMode ? "bg-purple-950/60 text-purple-400" : "bg-purple-100 text-purple-600")}>
            <Monitor size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Terminal</p>
            <p className={cn("text-[11px] font-extrabold", darkMode ? "text-slate-100" : "text-gray-600")}>{terminalName}</p>
          </div>
        </div>

        <div className={cn("h-5 w-px mx-0.5 hidden md:block", darkMode ? "bg-slate-800" : "bg-slate-200")} />

        {/* Sync Status */}
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              online
                ? (darkMode ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-100 text-emerald-600")
                : (darkMode ? "bg-amber-950/60 text-amber-400" : "bg-amber-100 text-amber-600"),
            )}
          >
            <Cloud size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Sync Status</p>
            <CustomBadge tone={online ? "green" : "amber"} className="mt-0.5">
              {online ? "Online" : "Offline"}
            </CustomBadge>
          </div>
        </div>

        <div className={cn("h-5 w-px mx-0.5 hidden lg:block", darkMode ? "bg-slate-800" : "bg-slate-200")} />

        {/* Last Backup */}
        <div className="hidden lg:flex items-center gap-1.5">
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", darkMode ? "bg-purple-950/60 text-purple-400" : "bg-purple-100 text-purple-600")}>
            <Clock size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Last Backup</p>
            <p className={cn("text-[11px] font-extrabold", darkMode ? "text-slate-100" : "text-gray-600")}>{lastBackupTime}</p>
          </div>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Keyboard Shortcuts */}
        <div className={cn("hidden xl:flex items-center gap-1.5 text-[10px] font-bold mr-2", darkMode ? "text-slate-400" : "text-slate-500")}>
          <span className={cn("font-extrabold", darkMode ? "text-slate-200" : "text-gray-600")}>F1</span>: Pay
          <span className={darkMode ? "text-gray-600" : "text-slate-300"}>|</span>
          <span className={cn("font-extrabold", darkMode ? "text-slate-200" : "text-gray-600")}>F2</span>: Add Item
          <span className={darkMode ? "text-gray-600" : "text-slate-300"}>|</span>
          <span className={cn("font-extrabold", darkMode ? "text-slate-200" : "text-gray-600")}>F3</span>: Search
          <span className={darkMode ? "text-gray-600" : "text-slate-300"}>|</span>
          <span className={cn("font-extrabold", darkMode ? "text-slate-200" : "text-gray-600")}>F6</span>: Hold Bill
        </div>

        {heldBillsCount > 0 && (
          <CustomButton
            size="xs"
            variant="outline"
            themeColor="teal"
            onClick={onResumeHeldBill}
            className="h-7 text-[10.5px]"
          >
            Resume Held ({heldBillsCount})
          </CustomButton>
        )}

        <CustomButton
          size="xs"
          variant="outline"
          onClick={() => window.open("/pharmacy/patient-display", "_blank")}
          className={cn(
            "h-7 text-[10.5px] gap-1.5",
            darkMode
              ? "text-cyan-300 border-cyan-800/80 bg-cyan-950/40 hover:bg-cyan-900/60"
              : "text-cyan-700 border-cyan-200 bg-cyan-50 hover:bg-cyan-100"
          )}
          title="Open Patient-Facing Customer Display in new tab/window"
        >
          <Monitor size={12} className={darkMode ? "text-cyan-400" : "text-cyan-600"} />
          <span>Patient Display</span>
        </CustomButton>
      </div>
    </footer>
  );
}
