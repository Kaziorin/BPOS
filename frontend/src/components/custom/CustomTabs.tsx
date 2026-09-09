"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  badgeClassName?: string;
}

export interface CustomTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  themeColor?: "orange" | "teal" | "emerald" | "indigo" | "amber" | "rose" | "purple";
  variant?: "solid" | "pills" | "underline";
}

const THEME_ACTIVE_STYLES: Record<string, string> = {
  orange: "bg-orange-600 text-white shadow-2xs",
  teal: "bg-teal-600 text-white shadow-2xs",
  emerald: "bg-emerald-600 text-white shadow-2xs",
  indigo: "bg-indigo-600 text-white shadow-2xs",
  amber: "bg-amber-600 text-white shadow-2xs",
  rose: "bg-rose-600 text-white shadow-2xs",
  purple: "bg-purple-600 text-white shadow-2xs",
};

const THEME_HOVER_STYLES: Record<string, string> = {
  orange: "hover:bg-orange-50 hover:text-orange-600",
  teal: "hover:bg-teal-50 hover:text-teal-600",
  emerald: "hover:bg-emerald-50 hover:text-emerald-600",
  indigo: "hover:bg-indigo-50 hover:text-indigo-600",
  amber: "hover:bg-amber-50 hover:text-amber-600",
  rose: "hover:bg-rose-50 hover:text-rose-600",
  purple: "hover:bg-purple-50 hover:text-purple-600",
};

export function CustomTabs({
  tabs,
  activeTab,
  onChange,
  className,
  themeColor = "orange",
  variant = "solid",
}: CustomTabsProps) {
  const activeStyle = THEME_ACTIVE_STYLES[themeColor] || THEME_ACTIVE_STYLES.orange;
  const hoverStyle = THEME_HOVER_STYLES[themeColor] || THEME_HOVER_STYLES.orange;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto rounded-md border border-slate-200 bg-white p-1.5 shadow-2xs w-full",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`custom-tab-${tab.id}`}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all duration-200 whitespace-nowrap cursor-pointer select-none",
              isActive
                ? activeStyle
                : cn("text-gray-600 bg-transparent", hoverStyle)
            )}
          >
            {tab.icon && (
              <span
                className={cn(
                  "flex items-center justify-center shrink-0 w-4 h-4 transition-colors",
                  isActive && "text-white [&>svg]:text-white [&>svg]:stroke-white"
                )}
              >
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold transition-colors",
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.badgeClassName || "bg-slate-100 text-gray-600"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
