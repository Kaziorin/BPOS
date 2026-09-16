"use client";

import React, { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DropdownOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

export interface CustomDropdownSelectProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
}

export function CustomDropdownSelect({
  options,
  value,
  onChange,
  placeholder = "Select Option...",
  className,
  containerClassName,
  disabled = false,
}: CustomDropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className={cn("relative w-full select-none", containerClassName)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-sm border px-3 py-2 text-xs font-semibold transition cursor-pointer shadow-2xs outline-none",
          "border-sky-200/90 bg-white text-gray-600 hover:border-[#0284C7] hover:bg-sky-50/40 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20",
          disabled && "cursor-not-allowed opacity-50 bg-slate-100",
          className
        )}
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={14}
          className={cn("text-[#0284C7] shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-full w-max max-w-xs rounded-sm border border-sky-200/90 bg-white p-1 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 rounded-sm text-xs font-semibold transition cursor-pointer text-left",
                    isSelected
                      ? "bg-[#E0F2FE] text-[#0369A1] font-bold"
                      : "text-gray-600 hover:bg-sky-50 hover:text-[#0284C7]"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-[#0284C7] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
