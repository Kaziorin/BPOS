"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, ShieldCheck, Clock, PhoneCall, CheckCircle } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";
import toast from "react-hot-toast";

interface PharmacyUploadSectionProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function PharmacyUploadSection({ section, isDarkMode = false }: PharmacyUploadSectionProps) {
  const {
    title = "Quick Prescription Upload & Fast Medicine Delivery",
    subtitle = "Upload your prescription image or PDF. Our registered licensed pharmacists will verify and deliver medicines directly to your home.",
    badge = "ONLINE PHARMACY EXPRESS",
    settings = {},
  } = section;

  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      toast.success(`Prescription "${e.target.files[0].name}" attached successfully! Our pharmacist will review it.`);
    }
  };

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-7xl mx-auto rounded-3xl p-8 sm:p-10 border transition-all ${
        isDarkMode
          ? "bg-emerald-950/40 border-emerald-800/60 text-white"
          : "bg-gradient-to-br from-emerald-50 via-teal-50/70 to-cyan-50 border-emerald-200 text-slate-900 shadow-lg"
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left info */}
          <div className="lg:col-span-7 space-y-5">
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{badge}</span>
              </span>
            )}

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              {title}
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? "text-emerald-200/80" : "text-slate-600"}`}>
              {subtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-emerald-100 shadow-xs"}`}>
                <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold">2-Hour Delivery</div>
                  <div className={`text-[10px] ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>Express in-city</div>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-emerald-100 shadow-xs"}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold">100% Genuine</div>
                  <div className={`text-[10px] ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>Govt. Approved</div>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-emerald-100 shadow-xs"}`}>
                <PhoneCall className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold">24/7 Helpline</div>
                  <div className={`text-[10px] ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>Doctor Support</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right upload box */}
          <div className="lg:col-span-5">
            <div className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all text-center relative ${
              isDarkMode
                ? "bg-zinc-900/80 border-emerald-500/40 hover:border-emerald-400"
                : "bg-white border-emerald-400/80 hover:border-emerald-500 shadow-md"
            }`}>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>

              {fileName ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{fileName}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Click or drag another file to replace</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold">Drag & Drop Prescription Here</h4>
                  <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
                    Supports JPG, PNG, WEBP, PDF up to 10MB
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Browse Prescription</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
