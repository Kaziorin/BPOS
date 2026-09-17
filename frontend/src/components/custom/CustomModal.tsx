"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { CustomButton } from "./CustomButton";

export type ModalThemeColor =
  | "primary"
  | "teal"
  | "orange"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "purple"
  | "blue";

export interface CustomModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  maxWidth?: string;
  className?: string;
  darkMode?: boolean;
  themeColor?: ModalThemeColor;
}

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-[95vw]",
};

export function CustomModal({
  open,
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = "xl",
  maxWidth,
  className,
  darkMode,
  themeColor = "teal",
}: CustomModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  if (!isModalOpen) return null;

  // Auto-detect dark mode if not explicitly passed
  const isDark =
    darkMode ??
    (typeof window !== "undefined" &&
      (document.documentElement.classList.contains("dark") ||
        localStorage.getItem("bpos_dark_mode") === "true"));

  const headerTitleColor =
    themeColor === "teal"
      ? isDark ? "text-teal-300" : "text-[#00796b]"
      : themeColor === "primary"
      ? isDark ? "text-sky-300" : "text-[#0284C7]"
      : isDark ? "text-slate-100" : "text-gray-800";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 animate-[fade-in_150ms_ease-out] select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-sm shadow-2xl animate-[scale-in_180ms_ease-out] flex flex-col max-h-[92vh] overflow-hidden transition-colors",
          maxWidth ?? sizeClasses[size] ?? "max-w-xl",
          isDark ? "dark bg-slate-900 border border-slate-800 text-slate-100" : "bg-white border border-slate-200 text-slate-900",
          className
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between border-b px-6 py-4 shrink-0 gap-3 transition-colors",
            isDark
              ? "border-slate-800 bg-slate-900/90"
              : themeColor === "teal"
              ? "border-teal-100 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/50"
              : "border-slate-200 bg-slate-50/80"
          )}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {icon && (
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm",
                  isDark
                    ? "bg-teal-950/70 text-teal-300 border border-teal-800"
                    : themeColor === "teal"
                    ? "bg-teal-50 text-[#00796b] border border-teal-200/80"
                    : "bg-sky-50 text-[#0284C7]"
                )}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className={cn("text-base font-bold tracking-tight truncate", headerTitleColor)}>
                {title}
              </h2>
              {subtitle && (
                <p className={cn("text-[11px] font-medium mt-0.5 truncate leading-tight", isDark ? "text-slate-400" : "text-slate-500")}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Red Danger Close Button */}
          <CustomButton
            variant="danger"
            size="xs"
            onClick={onClose}
            className={cn(
              "h-8 w-8 !p-0 rounded-sm flex items-center justify-center border transition cursor-pointer shadow-2xs shrink-0",
              isDark
                ? "border-rose-900/60 bg-rose-950/50 text-rose-400 hover:bg-rose-600 hover:text-white"
                : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
            )}
            aria-label="Close modal"
          >
            <X size={16} />
          </CustomButton>
        </div>

        {/* Content Body */}
        <div className={cn("overflow-y-auto px-6 py-5 custom-scrollbar flex-1", isDark ? "bg-slate-900" : "bg-white")}>{children}</div>
      </div>
    </div>
  );
}
