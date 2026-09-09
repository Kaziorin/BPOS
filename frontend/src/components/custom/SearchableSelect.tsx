"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check, X, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  onAddClick?: () => void;
  className?: string;
  disabled?: boolean;
  disabledHint?: string;
  themeColor?: "teal" | "orange" | "indigo" | "emerald" | "amber" | "rose" | "purple";
}

const THEME_MAP: Record<string, { focus: string; addBtn: string; optionHover: string; optionSelected: string; checkIcon: string }> = {
  teal: {
    focus: "focus:border-teal-500 focus:ring-teal-500",
    addBtn: "border-teal-200 bg-teal-50 text-teal-600 hover:bg-teal-100 shadow-2xs",
    optionHover: "hover:bg-teal-50 hover:text-teal-700",
    optionSelected: "bg-teal-50 text-teal-700 font-semibold",
    checkIcon: "text-teal-600",
  },
  orange: {
    focus: "focus:border-orange-500 focus:ring-orange-500",
    addBtn: "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 shadow-2xs",
    optionHover: "hover:bg-orange-50 hover:text-orange-700",
    optionSelected: "bg-orange-50 text-orange-700 font-semibold",
    checkIcon: "text-orange-600",
  },
  emerald: {
    focus: "focus:border-emerald-500 focus:ring-emerald-500",
    addBtn: "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-2xs",
    optionHover: "hover:bg-emerald-50 hover:text-emerald-700",
    optionSelected: "bg-emerald-50 text-emerald-700 font-semibold",
    checkIcon: "text-emerald-600",
  },
  indigo: {
    focus: "focus:border-indigo-500 focus:ring-indigo-500",
    addBtn: "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-2xs",
    optionHover: "hover:bg-indigo-50 hover:text-indigo-700",
    optionSelected: "bg-indigo-50 text-indigo-700 font-semibold",
    checkIcon: "text-indigo-600",
  },
  amber: {
    focus: "focus:border-amber-500 focus:ring-amber-500",
    addBtn: "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-2xs",
    optionHover: "hover:bg-amber-50 hover:text-amber-700",
    optionSelected: "bg-amber-50 text-amber-700 font-semibold",
    checkIcon: "text-amber-600",
  },
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select Option...",
  searchPlaceholder = "Search...",
  label,
  required = false,
  onAddClick,
  className,
  disabled = false,
  disabledHint,
  themeColor = "teal",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setCoords({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
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

    const handleScrollOrResize = () => {
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
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const themeStyles = THEME_MAP[themeColor] || THEME_MAP.teal;

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-[15px] font-semibold capitalize text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex items-center gap-1.5">
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          title={disabled ? disabledHint || "Select Category first to unlock subcategories" : undefined}
          className={cn(
            "flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-1",
            themeStyles.focus,
            disabled
              ? "cursor-not-allowed bg-slate-100/90 text-slate-400 border-slate-300 border-dashed shadow-none select-none"
              : "border-slate-200 bg-white text-gray-600 cursor-pointer",
            !selectedOption && !disabled && "text-slate-400"
          )}
        >
          <span className={cn("truncate flex items-center gap-1.5", disabled && "italic text-slate-500")}>
            {disabled ? (
              <>
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600/70" />
                <span>{disabledHint || placeholder}</span>
              </>
            ) : selectedOption ? (
              selectedOption.label
            ) : (
              placeholder
            )}
          </span>
          {disabled ? (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500 shrink-0">
              Locked
            </span>
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          )}
        </button>

        {onAddClick && (
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              if (disabled) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              onAddClick();
            }}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition",
              disabled
                ? "cursor-not-allowed bg-slate-100 text-slate-300 border-slate-200 opacity-40 pointer-events-none shadow-none"
                : themeStyles.addBtn
            )}
            title={disabled ? disabledHint || "Selection is currently locked" : "Add New"}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen &&
        coords.width > 0 &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="rounded-md border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100"
          >
            <div className="relative mb-1.5 flex items-center border-b border-slate-100 pb-1.5">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent pl-8 pr-7 py-1 text-xs text-gray-600 placeholder-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-center text-xs text-slate-400">No results found</div>
              ) : (
                filteredOptions.map((opt) => {
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
                        "flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs font-medium transition cursor-pointer",
                        themeStyles.optionHover,
                        isSelected ? themeStyles.optionSelected : "text-gray-600"
                      )}
                    >
                      <div>
                        <div>{opt.label}</div>
                        {opt.sublabel && (
                          <div className="text-[10px] text-slate-400">{opt.sublabel}</div>
                        )}
                      </div>
                      {isSelected && <Check className={cn("h-3.5 w-3.5 shrink-0", themeStyles.checkIcon)} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
