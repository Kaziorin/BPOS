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
}: PharmacyPOSFooterProps) {
  return (
    <footer className="flex w-full flex-none flex-wrap items-center justify-between bg-white px-4 py-1 text-[11px] select-none h-10">
      {/* Left: Time & Date */}
      <div className="flex items-center gap-4">
        <div className="leading-tight">
          <p className="text-[13px] font-black tabular-nums text-[#00796b]">{timeStr}</p>
          <p className="text-[10px] font-semibold text-slate-400">{dateStr}</p>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Cashier */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <User size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Cashier</p>
            <p className="text-[11px] font-extrabold text-slate-800">{cashierName}</p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Terminal */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <Monitor size={13} />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-semibold text-slate-400">Terminal</p>
            <p className="text-[11px] font-extrabold text-slate-800">{terminalName}</p>
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

      {/* Right: Shortcuts */}
      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
        <div className="hidden xl:flex items-center gap-2">
          <span>F1: Pay</span>
          <span className="text-slate-300">|</span>
          <span>F2: Add Item</span>
          <span className="text-slate-300">|</span>
          <span>F3: Search</span>
          <span className="text-slate-300">|</span>
          <span>F4: Hold</span>
          <span className="text-slate-300">|</span>
          <span>F5: Print</span>
          <span className="text-slate-300">|</span>
          <span>F6: Hold Bill</span>
        </div>

        {heldBillsCount > 0 && (
          <button
            type="button"
            onClick={onResumeHeldBill}
            className="rounded-lg bg-teal-50 border border-teal-200 px-2 py-0.5 text-[#00796b] font-bold hover:bg-teal-100 transition"
          >
            Resume Held ({heldBillsCount})
          </button>
        )}
      </div>
    </footer>
  );
}
