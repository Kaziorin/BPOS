"use client";

import { useState, useEffect } from "react";
import { CustomModal } from "./CustomModal";
import { CustomInput } from "./CustomInput";
import { CustomTextarea } from "./CustomTextarea";
import { CustomButton } from "./CustomButton";

export interface CustomPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: "text" | "number" | "textarea";
  confirmText?: string;
  cancelText?: string;
  darkMode?: boolean;
}

export function CustomPromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  placeholder,
  defaultValue = "",
  inputType = "text",
  confirmText = "Apply",
  cancelText = "Cancel",
  darkMode,
}: CustomPromptModalProps) {
  const [val, setVal] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setVal(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(val);
    onClose();
  };

  return (
    <CustomModal open={isOpen} onClose={onClose} title={title} size="xl" themeColor="teal" darkMode={darkMode}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{description}</p>
        )}

        {inputType === "textarea" ? (
          <CustomTextarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            rows={3}
            autoFocus
            darkMode={darkMode}
          />
        ) : (
          <CustomInput
            type={inputType}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            themeColor="teal"
            autoFocus
            darkMode={darkMode}
          />
        )}

        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <CustomButton variant="danger" size="sm" type="button" onClick={onClose}>
            {cancelText}
          </CustomButton>
          <CustomButton themeColor="teal" size="sm" type="submit">
            {confirmText}
          </CustomButton>
        </div>
      </form>
    </CustomModal>
  );
}
