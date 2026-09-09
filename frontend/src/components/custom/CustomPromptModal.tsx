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
    <CustomModal open={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {description && (
          <p className="text-xs text-gray-500 font-medium">{description}</p>
        )}

        {inputType === "textarea" ? (
          <CustomTextarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            rows={3}
            autoFocus
          />
        ) : (
          <CustomInput
            type={inputType}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <CustomButton variant="outline" size="sm" type="button" onClick={onClose}>
            {cancelText}
          </CustomButton>
          <CustomButton variant="primary" themeColor="orange" size="sm" type="submit">
            {confirmText}
          </CustomButton>
        </div>
      </form>
    </CustomModal>
  );
}
