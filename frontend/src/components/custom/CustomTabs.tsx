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
  themeColor?: "primary" | "orange" | "teal" | "emerald" | "indigo" | "amber" | "rose" | "purple" | "blue" | "violet";
  variant?: "solid" | "pills" | "underline";
  darkMode?: boolean;
  inactiveClassName?: string;
  activeClassName?: string;
  wrap?: boolean;
  style?: React.CSSProperties;
}

const THEME_ACTIVE_STYLES: Record<string, string> = {
  primary: "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xs font-bold",
  blue: "bg-blue-600 text-white shadow-2xs",
  orange: "bg-orange-500 text-white shadow-2xs",
  teal: "bg-[#00796b] text-white shadow-2xs",
  emerald: "bg-emerald-600 text-white shadow-2xs",
  indigo: "bg-indigo-600 text-white shadow-2xs",
  amber: "bg-amber-500 text-white shadow-2xs",
  rose: "bg-rose-600 text-white shadow-2xs",
  purple: "bg-purple-600 text-white shadow-2xs",
  violet: "bg-gradient-to-r from-violet-500 to-indigo-400 text-white shadow-xs font-bold",
};

const THEME_HOVER_STYLES = (darkMode: boolean): Record<string, string> => ({
  primary: darkMode ? "hover:bg-sky-500/10 hover:text-sky-400" : "hover:bg-sky-50 hover:text-sky-700",
  blue: darkMode ? "hover:bg-blue-500/10 hover:text-blue-400" : "hover:bg-blue-50 hover:text-blue-700",
  orange: darkMode ? "hover:bg-orange-500/10 hover:text-orange-400" : "hover:bg-orange-50 hover:text-orange-700",
  teal: darkMode ? "hover:bg-teal-500/10 hover:text-teal-400" : "hover:bg-teal-50 hover:text-teal-750",
  emerald: darkMode ? "hover:bg-emerald-500/10 hover:text-emerald-400" : "hover:bg-emerald-50 hover:text-emerald-600",
  indigo: darkMode ? "hover:bg-indigo-500/10 hover:text-indigo-400" : "hover:bg-indigo-50 hover:text-indigo-700",
  amber: darkMode ? "hover:bg-amber-500/10 hover:text-amber-400" : "hover:bg-amber-50 hover:text-amber-600",
  rose: darkMode ? "hover:bg-rose-500/10 hover:text-rose-400" : "hover:bg-rose-50 hover:text-rose-600",
  purple: darkMode ? "hover:bg-purple-500/10 hover:text-purple-400" : "hover:bg-purple-50 hover:text-purple-600",
  violet: darkMode ? "hover:bg-violet-500/10 hover:text-violet-400" : "hover:bg-violet-50 hover:text-violet-600",
});

export function CustomTabs({
  tabs,
  activeTab,
  onChange,
  className,
  themeColor = "primary",
  variant = "solid",
  darkMode = false,
  inactiveClassName,
  activeClassName,
  wrap = false,
  style,
}: CustomTabsProps) {
  const activeStyle = activeClassName || THEME_ACTIVE_STYLES[themeColor] || THEME_ACTIVE_STYLES.primary;
  const hoverStyle = THEME_HOVER_STYLES(darkMode)[themeColor] || THEME_HOVER_STYLES(darkMode).primary;

  return (
    <div
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded-sm p-1.5 w-full transition-colors",
        wrap ? "flex-wrap overflow-x-visible" : "overflow-x-auto",
        darkMode
          ? "border border-slate-800 bg-slate-900 shadow-none"
          : "border border-sky-100/90 bg-white shadow-2xs",
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
              "flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-sm transition-all duration-200 whitespace-nowrap cursor-pointer select-none border",
              isActive
                ? cn(activeStyle, "border-transparent")
                : inactiveClassName
                  ? inactiveClassName
                  : cn(
                      darkMode
                        ? "text-slate-300 bg-slate-800/80 border-slate-700"
                        : "text-gray-700 bg-white border-sky-200/90 shadow-2xs hover:bg-sky-50 hover:text-[#0284C7] hover:border-sky-300",
                      hoverStyle
                    )
            )}
          >
            {tab.icon && (
              <span
                className={cn(
                  "flex items-center justify-center shrink-0 w-4 h-4 transition-colors",
                  isActive
                    ? "text-white [&>svg]:text-white [&>svg]:stroke-white"
                    : "text-[#0284C7] [&>svg]:text-[#0284C7]"
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
                    ? "bg-white text-[#0369A1] font-black shadow-2xs"
                    : tab.badgeClassName || (darkMode ? "bg-slate-700 text-slate-300" : "bg-sky-100 text-[#0284C7] border border-sky-200/80")
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
