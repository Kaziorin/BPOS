"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { UploadCloud, Image as ImageIcon, X, Link as LinkIcon, RefreshCw, CheckCircle2, FileImage, Loader2 } from "lucide-react";
import { axiosClient } from "@/lib/api";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
  className?: string;
}

export function ImageUploader({
  value = "",
  onChange,
  label = "Product Image",
  maxSizeMB = 5,
  className = "",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"FILE" | "URL">("FILE");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(file: File) {
    setError(null);

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    setUploading(true);
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");

    // Read image locally for preview without uploading until form submit
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange(dataUrl);
      setUploading(false);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function handleClear() {
    onChange("");
    setFileName(null);
    setFileSize(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with Mode Selector */}
      <div className="flex items-center justify-between">
        <label className="text-[15px] font-semibold capitalize text-gray-600">{label}</label>
        <div className="flex items-center rounded-xs border border-slate-200 bg-slate-100/90 p-0.5 text-xs font-semibold shadow-2xs">
          <button
            type="button"
            onClick={() => setMode("FILE")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs transition-all duration-150 cursor-pointer ${
              mode === "FILE"
                ? "bg-teal-600 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-gray-800 hover:bg-slate-200/50"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" /> Drag & Drop / File
          </button>
          <button
            type="button"
            onClick={() => setMode("URL")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs transition-all duration-150 cursor-pointer ${
              mode === "URL"
                ? "bg-teal-600 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-gray-800 hover:bg-slate-200/50"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" /> Web Image URL
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* FILE UPLOAD MODE */}
      {mode === "FILE" && (
        <div>
          {uploading ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-teal-200 bg-teal-50/40 p-8 text-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              <span className="text-xs font-semibold text-teal-800">Uploading image to server...</span>
            </div>
          ) : value ? (
            /* Selected Image Preview Box */
            <div className="relative rounded-md border border-slate-200 bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={value} alt="Preview" className="h-full w-full object-contain p-1" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 truncate">
                    <FileImage className="h-4 w-4 text-teal-600 shrink-0" />
                    <span className="truncate">{fileName || (value.includes("/image_storage/") ? value.split("/").pop() : "Uploaded Image")}</span>
                  </div>
                  {fileSize && <p className="text-[11px] text-slate-400">Size: {fileSize}</p>}
                  <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {value.startsWith("data:") ? "Image selected (Will upload on product creation)" : "Uploaded Image"}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Drag & Drop Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-all ${
                isDragging
                  ? "border-teal-500 bg-teal-50/70 ring-4 ring-teal-500/10 scale-[1.002]"
                  : "border-teal-200/80 bg-teal-50/20 hover:border-teal-400 hover:bg-teal-50/50"
              }`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 border border-teal-200/60 text-teal-600 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-all shadow-2xs">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-3 text-xs font-semibold text-gray-600">
                <span className="text-teal-600 font-bold underline underline-offset-2 hover:text-teal-700">Click to choose image</span> or drag & drop file here
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Saves into backend/image_storage folder • Supports PNG, JPG, JPEG, WEBP, GIF, SVG (Max {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>
      )}

      {/* DIRECT URL INPUT MODE */}
      {mode === "URL" && (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-gray-600 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="https://example.com/product-image.jpg"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {value && (
            <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-2">
              <div className="h-16 w-16 shrink-0 rounded-md border border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt="URL Preview"
                  className="h-full w-full object-contain p-1"
                  onError={() => setError("Unable to load image from URL.")}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 truncate">{value}</p>
                <p className="text-[11px] text-slate-400">Web Image Link</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
