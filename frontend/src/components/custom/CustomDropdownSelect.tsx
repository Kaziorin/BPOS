"use client";

import React, { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
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
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
}

export function CustomDropdownSelect({
  options,
  value,
  onChange,
  label,
  required = false,
  placeholder = "Select Option...",
  className,
  containerClassName,
  disabled = false,
}: CustomDropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUp: boolean;
  }>({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
  });

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < 230 && rect.top > 230;
        setCoords({
          top: openUp ? rect.top - 4 : rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 180),
          openUp,
        });
      }
    }
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = (e: Event) => {
      // If user scrolls inside dropdown menu, don't close/update
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
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
    <div className={cn("relative w-full select-none flex flex-col", containerClassName)}>
      {label && (
        <label className="mb-1.5 block text-xs font-bold text-gray-600 capitalize">
          {label} {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-sm border px-3 py-2 text-xs font-semibold transition cursor-pointer shadow-2xs outline-none",
          "border-sky-200/90 bg-white text-gray-700 hover:border-[#0284C7] hover:bg-sky-50/40 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20",
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

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: coords.openUp ? undefined : `${coords.top}px`,
              bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              minWidth: `${coords.width}px`,
              maxWidth: "380px",
              zIndex: 99999,
            }}
            className="rounded-sm border border-sky-200/90 bg-white p-1 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-100 select-none"
          >
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
          </div>,
          document.body
        )}
    </div>
  );
}
