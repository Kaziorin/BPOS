"use client";

import { AlertTriangle, Trash2, Info, CheckCircle2, X } from "lucide-react";

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
}: ConfirmModalProps) {
  const isModalOpen = isOpen ?? open ?? false;
  if (!isModalOpen) return null;

  const displayMessage = message || description || "";
  const isAlertOnly = !onConfirm;

  const typeConfig = {
    WARNING: {
      icon: AlertTriangle,
      iconBg: "bg-sky-50 text-[#0284C7] border border-sky-200/80",
      border: "border-sky-200/90",
      confirmBtn: "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] hover:brightness-105 text-white shadow-xs",
      defaultTitle: "Warning Notice",
      defaultConfirm: "Proceed",
    },
    DANGER: {
      icon: Trash2,
      iconBg: "bg-red-50 text-red-600 border border-red-100",
      border: "border-red-200",
      confirmBtn: "bg-red-600 hover:bg-red-700 text-white shadow-xs",
      defaultTitle: "Confirm Action",
      defaultConfirm: "Delete",
    },
    INFO: {
      icon: Info,
      iconBg: "bg-sky-50 text-[#0284C7] border border-sky-200/80",
      border: "border-sky-200/90",
      confirmBtn: "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] hover:brightness-105 text-white shadow-xs",
      defaultTitle: "Information",
      defaultConfirm: "OK",
    },
    SUCCESS: {
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      border: "border-emerald-200",
      confirmBtn: "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] hover:brightness-105 text-white shadow-xs",
      defaultTitle: "Success",
      defaultConfirm: "OK",
    },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`relative w-full max-w-sm rounded-sm bg-white p-5 shadow-xl border ${typeConfig.border} animate-in zoom-in-95 duration-200`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        <div className="flex items-start gap-3.5">
          {/* Icon Badge */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${typeConfig.iconBg}`}>
            <Icon size={20} />
          </div>

          {/* Title & Message */}
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-sm font-bold text-[#0369A1]">
              {title || typeConfig.defaultTitle}
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed break-words">
              {displayMessage}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2">
          {!isAlertOnly && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-sm border border-sky-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 transition disabled:opacity-50 cursor-pointer shadow-2xs"
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
            className={`rounded-sm px-4 py-1.5 text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer ${typeConfig.confirmBtn}`}
          >
            {loading ? "Processing..." : (confirmText || (isAlertOnly ? "OK" : typeConfig.defaultConfirm))}
          </button>
        </div>
      </div>
    </div>
  );
}
