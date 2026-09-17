"use client";

import { AlertTriangle, Trash2, Info, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ModalType = "WARNING" | "DANGER" | "INFO" | "SUCCESS";

export interface ConfirmModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title?: string;
  message?: string;
  description?: string;
  type?: ModalType;
  variant?: string;
  confirmVariant?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  darkMode?: boolean;
}

export function ConfirmModal({
  isOpen,
  open,
  onClose,
  onConfirm,
  title,
  message,
  description,
  type = "WARNING",
  variant,
  confirmVariant,
  confirmText,
  cancelText = "Cancel",
  loading = false,
  darkMode,
}: ConfirmModalProps) {
  const isModalOpen = isOpen ?? open ?? false;
  if (!isModalOpen) return null;

  const isDark = darkMode ?? (typeof document !== "undefined" && (
    document.documentElement.classList.contains("dark") ||
    localStorage.getItem("bpos_dark_mode") === "true"
  ));

  const displayMessage = message || description || "";
  const isAlertOnly = !onConfirm;

  const typeConfig = {
    WARNING: {
      icon: AlertTriangle,
      iconBg: isDark ? "bg-amber-950/60 text-amber-400 border border-amber-900/50" : "bg-amber-50 text-amber-600 border border-amber-200",
      border: "border-amber-200",
      confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white shadow-xs",
      defaultTitle: "Warning Notice",
      defaultConfirm: "Proceed",
    },
    DANGER: {
      icon: Trash2,
      iconBg: isDark ? "bg-rose-950/60 text-rose-400 border border-rose-900/50" : "bg-rose-50 text-rose-600 border border-rose-100",
      border: "border-rose-200",
      confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs",
      defaultTitle: "Confirm Action",
      defaultConfirm: "Delete",
    },
    INFO: {
      icon: Info,
      iconBg: isDark ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200",
      border: "border-slate-200",
      confirmBtn: isDark ? "bg-slate-700 hover:bg-slate-600 text-white shadow-xs" : "bg-slate-800 hover:bg-slate-900 text-white shadow-xs",
      defaultTitle: "Information",
      defaultConfirm: "OK",
    },
    SUCCESS: {
      icon: CheckCircle2,
      iconBg: isDark ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/50" : "bg-emerald-50 text-emerald-600 border border-emerald-100",
      border: "border-emerald-200",
      confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
      defaultTitle: "Success",
      defaultConfirm: "OK",
    },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200", isDark && "dark")}>
      <div className={cn(
        "relative w-full max-w-md rounded-sm p-6 shadow-xl border animate-in zoom-in-95 duration-200",
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" : `bg-white ${typeConfig.border} text-slate-800`
      )}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            "absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-sm border transition cursor-pointer shadow-2xs",
            isDark
              ? "border-rose-900/60 bg-rose-950/40 text-rose-400 hover:bg-rose-600 hover:text-white"
              : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
          )}
          aria-label="Close"
        >
          <X size={15} />
        </button>

        <div className="flex items-start gap-3.5">
          {/* Icon Badge */}
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm ${typeConfig.iconBg}`}>
            <Icon size={22} />
          </div>

          {/* Title & Message */}
          <div className="flex-1 min-w-0 pr-4">
            <h3 className={cn("text-[15px] font-bold", isDark ? "text-slate-100" : "text-slate-800")}>
              {title || typeConfig.defaultTitle}
            </h3>
            <p className={cn("mt-1.5 text-xs leading-relaxed break-words", isDark ? "text-slate-400" : "text-slate-600")}>
              {displayMessage}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          {!isAlertOnly && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={cn(
                "rounded-sm border px-4 py-2 text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-2xs",
                isDark
                  ? "border-rose-900/60 bg-rose-950/40 text-rose-400 hover:bg-rose-600 hover:text-white"
                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white"
              )}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose();
            }}
            disabled={loading}
            className={`rounded-sm px-4 py-2 text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer ${typeConfig.confirmBtn}`}
          >
            {loading ? "Processing..." : (confirmText || (isAlertOnly ? "OK" : typeConfig.defaultConfirm))}
          </button>
        </div>
      </div>
    </div>
  );
}
