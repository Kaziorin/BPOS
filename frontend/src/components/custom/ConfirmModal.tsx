"use client";

import { AlertTriangle, Trash2, Info, CheckCircle2, X } from "lucide-react";

export type ModalType = "WARNING" | "DANGER" | "INFO" | "SUCCESS";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
  description?: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  type = "WARNING",
  confirmText,
  cancelText = "Cancel",
  loading = false,
}: ConfirmModalProps) {
  const displayMessage = message || description || "";
  if (!isOpen) return null;

  const isAlertOnly = !onConfirm;

  const typeConfig = {
    WARNING: {
      icon: AlertTriangle,
      iconBg: "bg-amber-100 text-amber-600",
      border: "border-amber-200",
      confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white",
      defaultTitle: "Warning Notice",
      defaultConfirm: "Proceed",
    },
    DANGER: {
      icon: Trash2,
      iconBg: "bg-red-100 text-red-600",
      border: "border-red-200",
      confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
      defaultTitle: "Confirm Action",
      defaultConfirm: "Delete",
    },
    INFO: {
      icon: Info,
      iconBg: "bg-teal-100 text-teal-600",
      border: "border-teal-200",
      confirmBtn: "bg-teal-600 hover:bg-teal-700 text-white",
      defaultTitle: "Information",
      defaultConfirm: "OK",
    },
    SUCCESS: {
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 text-emerald-600",
      border: "border-emerald-200",
      confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
      defaultTitle: "Success",
      defaultConfirm: "OK",
    },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`relative w-full max-w-sm rounded-md bg-white p-5 shadow-xl border ${typeConfig.border} animate-in zoom-in-95 duration-200`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-md p-1 text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3.5">
          {/* Icon Badge */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${typeConfig.iconBg}`}>
            <Icon size={20} />
          </div>

          {/* Title & Message */}
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-sm font-bold text-gray-600">
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
              className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
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
            className={`rounded-md px-4 py-1.5 text-xs font-semibold shadow-2xs transition disabled:opacity-50 ${typeConfig.confirmBtn}`}
          >
            {loading ? "Processing..." : (confirmText || (isAlertOnly ? "OK" : typeConfig.defaultConfirm))}
          </button>
        </div>
      </div>
    </div>
  );
}
