"use client";

import React, { useRef } from "react";
import { Calendar, Clock, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomDatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  type?: "date" | "datetime-local" | "time";
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
}

export function CustomDatePicker({
  value = "",
  onChange,
  type = "date",
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

  const defaultIcon =
    type === "time" ? (
      <Clock size={14} className={primaryIconColor} />
    ) : (
      <Calendar size={14} className={primaryIconColor} />
    );

  return (
    <div className={cn("w-full flex flex-col", containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold text-[#0369A1]"
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
        {/* Left Calendar / Clock Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          {icon || defaultIcon}
        </div>

        {/* HTML5 Date / Time / DateTime-local Input */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          disabled={disabled}
          min={min}
          max={max}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "h-[38px] w-full rounded-sm border border-sky-100/90 bg-white pl-9 text-xs font-medium text-gray-600 shadow-2xs transition-colors cursor-pointer",
            "focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20",
            clearable && value ? "pr-8" : "pr-3",
            error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20",
            className
          )}
        />

        {/* Clear Button */}
        {clearable && Boolean(value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-slate-400 hover:text-gray-600 transition-colors cursor-pointer"
            title="Clear date"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {error && <span className="text-[11px] text-rose-500 mt-1 font-medium">{error}</span>}
      {helperText && !error && (
        <span className="text-[11px] text-slate-400 mt-1">{helperText}</span>
      )}
    </div>
  );
}
