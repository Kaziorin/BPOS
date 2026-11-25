"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  X,
  CreditCard,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  requiredPlan?: string;
  requiredAddon?: string;
  lockReason?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  requiredPlan,
  requiredAddon,
  lockReason,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-sky-100 overflow-hidden">
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 px-6 py-6 text-white text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="mx-auto w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2 shadow-inner">
            <Lock size={22} className="text-white" />
          </div>

          <h3 className="text-lg font-extrabold tracking-tight">
            Unlock &quot;{featureName}&quot;
          </h3>
          <p className="text-xs text-sky-100 font-medium mt-1">
            {requiredAddon
              ? `This feature requires the ${requiredAddon.toUpperCase()} Add-on.`
              : `This module is included in the ${requiredPlan || "Advance / Enterprise"} Plan.`}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Plan Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Advance Tier */}
            <div className="p-4 rounded-lg border-2 border-sky-500 bg-sky-50/50 relative flex flex-col justify-between">
              <span className="absolute -top-2.5 right-3 bg-sky-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow-2xs uppercase tracking-wide">
                Popular Choice
              </span>
              <div>
                <p className="text-xs font-black uppercase text-sky-950">Advance Plan</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">৳2,990 <span className="text-[10px] font-semibold text-slate-500">/ mo</span></p>
                <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>Up to 3 Branches & Outlets</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>Full Double-Entry Accounting</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>NBR VAT (Mushak 6.3) & Tax</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>Customer Credit, EMI & Purchasing</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/saas?tab=plans"
                onClick={onClose}
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded shadow-2xs transition"
              >
                <span>Upgrade to Advance</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <p className="text-xs font-black uppercase text-slate-700">Enterprise Plan</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">৳9,990 <span className="text-[10px] font-semibold text-slate-500">/ mo</span></p>
                <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>Unlimited Branches & Users</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>All Industry Hubs (Kitchen KDS, etc.)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>Workflow Approvals & Custom RBAC</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>Online E-Commerce Storefront</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/saas?tab=plans"
                onClick={onClose}
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded shadow-2xs transition"
              >
                <span>Upgrade to Enterprise</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Quick Support & Activation Footer */}
          <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-sky-600 shrink-0" />
              <p className="text-[11px] text-slate-600 leading-tight">
                Want to activate this specific Add-on or need custom billing?
              </p>
            </div>
            <a
              href="tel:+8801700000000"
              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 shrink-0"
            >
              <PhoneCall size={12} />
              <span>Contact Sales</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
