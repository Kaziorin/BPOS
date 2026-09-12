"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings2,
  Sun,
  Moon,
  TrendingUp,
  ShoppingBag,
  Truck,
  Users,
  ClipboardList,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CustomBadge, CustomButton, CustomStatCard } from "@/components/custom";
import type { StatTone } from "@/components/custom/CustomStatCard";
import type { WsCustomerProfile, WsStats } from "./wholesale-pos-types";

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface WholesalePOSHeaderProps {
  orderNo: string;
  customer: WsCustomerProfile;
  stats: WsStats;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onSelectCustomer?: () => void;
  onOpenSettings?: () => void;
}

export function WholesalePOSHeader({
  orderNo,
  customer,
  stats,
  darkMode = false,
  onToggleDarkMode,
  onSelectCustomer,
  onOpenSettings,
}: WholesalePOSHeaderProps): ReactElement {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const metricCards: { label: string; value: string; Icon: LucideIcon; tone: StatTone }[] = [
    { label: "Today's Sales", value: fmt(stats.todaysSales), Icon: TrendingUp, tone: "blue" },
    { label: "Orders", value: String(stats.orders), Icon: ShoppingBag, tone: "blue" },
    { label: "Delivery", value: String(stats.delivery), Icon: Truck, tone: "blue" },
    { label: "Customers", value: String(stats.customers), Icon: Users, tone: "violet" },
    { label: "Pending Orders", value: String(stats.pendingOrders), Icon: ClipboardList, tone: "amber" },
    { label: "Low Stock Alerts", value: String(stats.lowStockAlerts), Icon: AlertTriangle, tone: "red" },
  ];

  return (
    <div className="shrink-0 space-y-3">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "flex items-center gap-4 rounded-[20px] px-5 py-3.5 backdrop-blur-xl transition-colors",
          darkMode
            ? "border border-slate-700/80 bg-slate-900/75 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            : "border border-white bg-white shadow-[0_4px_20px_rgba(37,99,235,0.06)]",
        )}
      >
        <div className="min-w-0 shrink-0 pr-2">
          <h1
            className={cn(
              "text-[20px] font-bold leading-tight tracking-tight sm:text-[22px]",
              darkMode ? "text-slate-50" : "text-slate-900",
            )}
          >
            BPOS
          </h1>
          <p className={cn("mt-0.5 text-[12px] font-bold tracking-wide uppercase", darkMode ? "text-blue-400" : "text-blue-600")}>
            Wholesale & Distribution
          </p>
        </div>

        <div className="hidden flex-1 md:block" />

        <motion.button
          type="button"
          onClick={onSelectCustomer}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.995 }}
          className={cn(
            "flex min-w-0 max-w-full flex-1 items-center gap-0 overflow-hidden rounded-2xl px-4 py-2.5 text-left transition-colors md:flex-none md:max-w-none",
            darkMode
              ? "border border-slate-700 bg-slate-800/90 shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
              : "border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 shadow-sm transition-all",
          )}
        >
          <div className="min-w-0 shrink pr-4 sm:pr-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("truncate text-[14px] font-bold", darkMode ? "text-slate-100" : "text-slate-900")}>
                {customer.name}
              </span>
              <CustomBadge
                tone="primary"
                className={cn(
                  "!shrink-0 !px-2 !py-0.5 !text-[10px] !font-black uppercase tracking-tighter",
                  darkMode ? "!bg-primary-500/15 !text-primary-300" : "!bg-violet-100 !text-violet-700",
                )}
              >
                {customer.tier} Customer
              </CustomBadge>
            </div>
            <p className={cn("mt-0.5 truncate text-[11px] font-medium", darkMode ? "text-slate-500" : "text-slate-400")}>
              {customer.id} <span className={cn("mx-0.5", darkMode ? "text-slate-600" : "text-slate-300")}>•</span>{" "}
              {customer.phone}
            </p>
          </div>

          <Divider darkMode={darkMode} />
          <Metric label="Credit Limit" value={fmt(customer.creditLimit)} valueClass={darkMode ? "text-slate-100" : "text-slate-900"} darkMode={darkMode} />
          <Divider darkMode={darkMode} />
          <Metric label="Available Credit" value={fmt(customer.availableCredit)} valueClass="text-emerald-600" darkMode={darkMode} />
          <Divider darkMode={darkMode} />
          <Metric label="Outstanding" value={fmt(customer.outstanding)} valueClass="text-rose-500" darkMode={darkMode} />
        </motion.button>

        <div className="flex shrink-0 items-center gap-2.5 pl-1">
          <div className="hidden text-right sm:block">
            <p className={cn("text-[14px] font-bold leading-tight tabular-nums", darkMode ? "text-slate-100" : "text-slate-900")}>
              {timeStr}
            </p>
            <p className={cn("mt-0.5 text-[11px] font-medium", darkMode ? "text-slate-500" : "text-slate-400")}>{dateStr}</p>
          </div>

          {/* Light / Dark mode switch */}
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onToggleDarkMode}
            className={cn(
              "relative inline-flex h-9 w-[68px] shrink-0 items-center rounded-full border p-1 transition-colors duration-300",
              darkMode
                ? "border-slate-600 bg-slate-800"
                : "border-slate-200 bg-slate-100",
            )}
          >
            <span
              className={cn(
                "absolute inset-y-1 left-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-transform duration-300",
                darkMode
                  ? "translate-x-[30px] bg-blue-600 text-white"
                  : "translate-x-0 bg-white text-amber-500",
              )}
            >
              {darkMode ? <Moon size={14} strokeWidth={2.2} /> : <Sun size={14} strokeWidth={2.2} />}
            </span>
            <span className="pointer-events-none flex w-full items-center justify-between px-1.5 text-[9px] font-bold uppercase tracking-wide">
              <span className={cn(darkMode ? "text-slate-600" : "text-amber-500/80")}>
                <Sun size={11} />
              </span>
              <span className={cn(darkMode ? "text-blue-300" : "text-slate-400")}>
                <Moon size={11} />
              </span>
            </span>
          </button>
        </div>
      </motion.header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {metricCards.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-xl border p-2 transition-colors",
                darkMode
                  ? "border-slate-700 bg-slate-900/60 shadow-sm"
                  : "border-white bg-white shadow-[0_2px_12px_rgba(37,99,235,0.04)]",
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                darkMode ? "bg-slate-800 text-slate-400" : "bg-blue-50 text-blue-600"
              )}>
                <m.Icon size={16} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 overflow-hidden leading-tight">
                <p className={cn("truncate text-[9px] font-bold uppercase tracking-wider", darkMode ? "text-slate-500" : "text-slate-400")}>
                  {m.label}
                </p>
                <p className={cn("truncate text-[13px] font-black tabular-nums", darkMode ? "text-slate-100" : "text-slate-900")}>
                  {m.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Divider({ darkMode }: { darkMode?: boolean }) {
  return (
    <div
      className={cn("mx-1 hidden h-9 w-px shrink-0 sm:block", darkMode ? "bg-slate-700" : "bg-slate-200/80")}
      aria-hidden
    />
  );
}

function Metric({
  label,
  value,
  valueClass,
  darkMode,
}: {
  label: string;
  value: string;
  valueClass: string;
  darkMode?: boolean;
}) {
  return (
    <div className="hidden min-w-[108px] shrink-0 px-3 sm:block lg:px-4">
      <p className={cn("text-[10px] font-medium leading-none", darkMode ? "text-slate-500" : "text-slate-400")}>
        {label}
      </p>
      <p className={`mt-1.5 text-[14px] font-bold leading-none tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
