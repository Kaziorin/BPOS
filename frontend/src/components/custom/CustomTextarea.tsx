"use client";

import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export interface CustomTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  darkMode?: boolean;
}

export const CustomTextarea = forwardRef<HTMLTextAreaElement, CustomTextareaProps>(
  ({ label, error, hint, containerClassName, className, id, rows = 3, darkMode = false, ...props }, ref) => {
    const autoId = useId();
    const textareaId = id ?? autoId;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className={cn("mb-1.5 block text-xs font-semibold capitalize", darkMode ? "text-slate-300" : "text-brand-dark")}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            "w-full resize-y rounded-sm border px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 shadow-2xs",
            darkMode
              ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
              : "bg-white border-brand-border text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20",
            error ? "border-red-400 focus:border-red-500" : "",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);

CustomTextarea.displayName = "CustomTextarea";
