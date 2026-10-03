"use client";

import React, { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function WhatsAppFloatingWidget() {
  const { theme } = useTheme();
  const { storeName } = useStoreConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState("");

  const isEnabled = theme.whatsappOrderEnabled !== false;
  const rawPhone = theme.whatsappOrderPhone || theme.footerWhatsapp || "+8801700000000";
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "");

  if (!isEnabled) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = customMsg.trim() || `Hello ${storeName}! I want to inquire about your products.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setIsOpen(false);
    setCustomMsg("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* WhatsApp Popup Box */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-emerald-600 px-4 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-300 border-2 border-emerald-600 ring-2 ring-white animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">{storeName} Support</h4>
                <span className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
                  <span>Online & Ready to help</span>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-black/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-slate-950/90 text-xs space-y-3">
            <div className="p-3 rounded-2xl bg-slate-800 text-slate-200 max-w-[85%] shadow-md space-y-1">
              <p className="font-medium">
                👋 Hello! Welcome to <strong>{storeName}</strong>.
              </p>
              <p className="text-slate-400 text-[11px]">
                How can we help you today? You can place direct orders or ask any product questions.
              </p>
            </div>

            <form onSubmit={handleSend} className="space-y-2 pt-2">
              <textarea
                rows={2}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Type your message or order inquiry..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Start WhatsApp Chat</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-2xl shadow-emerald-600/50 hover:shadow-emerald-500/60 transition-all active:scale-95"
        title="Direct WhatsApp Order & Support"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
        <span className="text-xs font-black tracking-wide hidden sm:inline">WhatsApp Order</span>
      </button>
    </div>
  );
}
