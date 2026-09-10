"use client";

import React from "react";
import { User, Monitor, Cloud, Clock } from "lucide-react";
import { cn } from "@/lib/cn";

interface PharmacyPOSFooterProps {
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
      "flex w-full flex-none flex-wrap items-center justify-between px-4 py-1 text-[11px] select-none h-10 transition",
      darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"
    )}>
      {/* Left: Time & Date */}
      <div className="flex items-center gap-4">
        <div className="leading-tight">
          <p className="text-[13px] font-black tabular-nums text-[#00796b]">{timeStr}</p>
          <p className="text-[10px] font-semibold text-slate-400">{dateStr}</p>
        </div>

        <div className={cn("h-6 w-px mx-1 hidden sm:block", darkMode ? "bg-slate-700" : "bg-slate-200")} />

        {/* Cashier */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <User size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Cashier</p>
            <p className={cn("text-[11px] font-extrabold", darkMode ? "text-slate-100" : "text-slate-800")}>{cashierName}</p>
          </div>
        </div>

        <div className={cn("h-6 w-px mx-1 hidden sm:block", darkMode ? "bg-slate-700" : "bg-slate-200")} />

        {/* Terminal */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <Monitor size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Terminal</p>
            <p className={cn("text-[11px] font-extrabold", darkMode ? "text-slate-100" : "text-slate-800")}>{terminalName}</p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

        {/* Sync Status */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              online ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600",
            )}
          >
            <Cloud size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Sync Status</p>
            <p className={cn("text-[11px] font-extrabold", online ? "text-emerald-600" : "text-amber-600")}>
              {online ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />

        {/* Last Backup */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <Clock size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Last Backup</p>
            <p className="text-[11px] font-extrabold text-slate-800">{lastBackupTime}</p>
          </div>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Keyboard Shortcuts */}
        <div className="hidden xl:flex items-center gap-2 text-[10px] font-bold text-slate-500 mr-2">
          <span className="font-extrabold text-slate-700">F1</span>: Pay
          <span className="text-slate-300">|</span>
          <span className="font-extrabold text-slate-700">F2</span>: Add Item
          <span className="text-slate-300">|</span>
          <span className="font-extrabold text-slate-700">F3</span>: Search
          <span className="text-slate-300">|</span>
          <span className="font-extrabold text-slate-700">F4</span>: Hold
          <span className="text-slate-300">|</span>
          <span className="font-extrabold text-slate-700">F5</span>: Print
          <span className="text-slate-300">|</span>
          <span className="font-extrabold text-slate-700">F6</span>: Hold Bill
        </div>

        {heldBillsCount > 0 && (
          <button
            type="button"
            onClick={onResumeHeldBill}
            className="rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-[10.5px] text-[#00796b] font-bold hover:bg-teal-100 transition"
          >
            Resume Held ({heldBillsCount})
          </button>
        )}

        <a
          href="/pharmacy/patient-display"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 border border-cyan-200 px-2.5 py-1 text-[10.5px] text-cyan-700 font-bold hover:bg-cyan-100 transition shadow-2xs"
          title="Open Patient-Facing Customer Display in new tab/window"
        >
          <Monitor size={12} className="text-cyan-600" />
          <span>Patient Display</span>
        </a>


      </div>
    </footer>
  );
}


