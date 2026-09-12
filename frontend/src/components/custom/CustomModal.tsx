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
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 sm:p-6 animate-[fade-in_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-md shadow-2xl animate-[scale-in_180ms_ease-out] flex flex-col max-h-[90vh]",
          sizeClasses[size] ?? "max-w-md",
          darkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-gray-100",
          className
        )}
      >
        <div className={cn(
          "flex items-center justify-between border-b px-6 py-4 shrink-0",
          darkMode ? "border-slate-800" : "border-gray-100"
        )}>
          <h2 className={cn(
            "text-base font-bold",
            darkMode ? "text-slate-200" : "text-gray-600"
          )}>{title}</h2>
          <button
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition",
              darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-gray-400 hover:bg-teal-50 hover:text-teal-600"
            )}
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
