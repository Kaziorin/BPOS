"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check, X, Plus } from "lucide-react";
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
}

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
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition cursor-pointer focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500",
            disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
            !selectedOption && "text-slate-400"
          )}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>

        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-600 transition cursor-pointer hover:bg-teal-100"
            title="Add New"
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
                        "flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs font-medium transition cursor-pointer hover:bg-teal-50 hover:text-teal-700",
                        isSelected ? "bg-teal-50 text-teal-700 font-semibold" : "text-gray-600"
                      )}
                    >
                      <div>
                        <div>{opt.label}</div>
                        {opt.sublabel && (
                          <div className="text-[10px] text-slate-400">{opt.sublabel}</div>
                        )}
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />}
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
