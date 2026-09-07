"use client";

import { InputHTMLAttributes, ReactNode, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    { label, error, hint, helperText, leftIcon, rightIcon, containerClassName, className, id, ...props },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const bottomHint = error ? null : (helperText ?? hint);

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400",
              "focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
              error ? "border-red-300" : "border-gray-300",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        ) : bottomHint ? (
          <p className="mt-1.5 text-xs text-gray-400">{bottomHint}</p>
        ) : null}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";
