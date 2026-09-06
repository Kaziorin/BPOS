"use client";

import { DragEvent, useId, useRef, useState } from "react";
import { UploadCloud, X, FileText } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomFileUploaderProps {
  label?: string;
  hint?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  value?: File[];
  onChange: (files: File[]) => void;
  containerClassName?: string;
}

export function CustomFileUploader({
  label,
  hint,
  error,
  accept,
  multiple = false,
  value = [],
  onChange,
  containerClassName,
}: CustomFileUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    onChange(multiple ? [...value, ...files] : files.slice(0, 1));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function removeFile(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition",
          dragging ? "border-primary-400 bg-primary-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100",
          error && "border-red-300"
        )}
      >
        <UploadCloud size={22} className="text-gray-400" />
        <p className="text-sm text-gray-600">
          <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
        </p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {value.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate text-gray-700">
                <FileText size={14} className="shrink-0 text-gray-400" />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
