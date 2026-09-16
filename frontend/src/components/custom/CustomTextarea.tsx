"use client";

import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export interface CustomTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const CustomTextarea = forwardRef<HTMLTextAreaElement, CustomTextareaProps>(
  ({ label, error, hint, containerClassName, className, id, rows = 3, ...props }, ref) => {
    const autoId = useId();
    const textareaId = id ?? autoId;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-xs font-semibold capitalize text-[#0369A1]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            "w-full resize-y rounded-sm border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 shadow-2xs",
            "border-sky-200/90 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20",
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
