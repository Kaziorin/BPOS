"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  className?: string;
  darkMode?: boolean;
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

export function CustomModal({ open, onClose, title, children, size = "md", className, darkMode = false }: CustomModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/50 backdrop-blur-xs p-4 sm:p-6 animate-[fade-in_150ms_ease-out] select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-sm shadow-2xl animate-[scale-in_180ms_ease-out] flex flex-col max-h-[90vh] overflow-hidden",
          sizeClasses[size] ?? "max-w-md",
          darkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-sky-200/90",
          className
        )}
      >
        <div className={cn(
          "flex items-center justify-between border-b px-6 py-4 shrink-0",
          darkMode ? "border-slate-800 bg-slate-900" : "border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50"
        )}>
          <h2 className={cn(
            "text-base font-bold tracking-tight",
            darkMode ? "text-slate-200" : "text-[#0369A1]"
          )}>{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition cursor-pointer shadow-2xs"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}
