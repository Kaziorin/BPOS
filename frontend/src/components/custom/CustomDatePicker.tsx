"use client";

import React, { useRef } from "react";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomDatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  clearable?: boolean;
  onClear?: () => void;
  icon?: React.ReactNode;
  themeColor?: "primary" | "teal" | "blue";
  helperText?: string;
  error?: string;
  required?: boolean;
  id?: string;
  name?: string;
  compact?: boolean;
  title?: string;
}

export function CustomDatePicker({
  value = "",
  onChange,
  label,
  placeholder,
  className,
  containerClassName,
  disabled = false,
  min,
  max,
  clearable = false,
  onClear,
  icon,
  themeColor = "primary",
  helperText,
  error,
  required,
  id,
  name,
  compact = false,
  title,
}: CustomDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (disabled) return;
    try {
      inputRef.current?.showPicker?.();
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange("");
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const primaryIconColor =
    themeColor === "teal" ? "text-teal-600" : themeColor === "blue" ? "text-blue-600" : "text-[#0284C7]";

  return (
    <div className={cn("w-full flex flex-col", containerClassName)} title={title || placeholder}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-bold text-gray-600 capitalize mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        onClick={handleContainerClick}
        className={cn(
          "relative flex items-center w-full cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Left Calendar Icon */}
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-10",
          compact ? "left-2" : "left-3"
        )}>
          {icon || <Calendar size={compact ? 13 : 14} className={primaryIconColor} />}
        </div>

        {/* HTML5 Date Input (native calendar indicator hidden to avoid duplicate icons) */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="date"
          disabled={disabled}
          min={min}
          max={max}
          required={required}
          value={value}
          title={title || placeholder}
          placeholder={placeholder}
          onClick={handleContainerClick}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "h-[38px] w-full rounded-sm border border-sky-200/80 bg-white text-xs sm:text-[13px] font-semibold text-gray-600 shadow-2xs transition-colors cursor-pointer",
            "focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20",
            "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:hidden",
            "[&::-webkit-datetime-edit]:text-xs [&::-webkit-datetime-edit]:sm:text-[13px] [&::-webkit-datetime-edit]:font-semibold [&::-webkit-datetime-edit]:text-gray-600",
            "[&::-webkit-datetime-edit-fields-wrapper]:p-0",
            compact ? (clearable && value ? "pl-7.5 pr-6" : "pl-7.5 pr-2") : (clearable && value ? "pl-9 pr-8" : "pl-9 pr-3"),
            error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20",
            className
          )}
        />

        {/* Clear Button */}
        {clearable && Boolean(value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute z-10 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-gray-400 hover:text-gray-700 transition-colors cursor-pointer",
              compact ? "right-1.5" : "right-2.5"
            )}
            title="Clear date"
          >
            <X size={compact ? 12 : 13} />
          </button>
        )}
      </div>

      {error && <span className="text-[11px] text-rose-500 mt-1 font-medium">{error}</span>}
      {helperText && !error && (
        <span className="text-[11px] text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
}
