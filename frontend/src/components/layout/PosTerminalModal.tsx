"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Monitor, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import {
  ALL_POS_TERMINALS,
  getAccessiblePosTerminals,
  getTenantEntitlementContext,
  type PosTerminalOption,
} from "@/lib/pos-terminals";
import { UpgradeModal } from "./UpgradeModal";

export { ALL_POS_TERMINALS, type PosTerminalOption };

interface PosTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PosTerminalModal({ isOpen, onClose }: PosTerminalModalProps) {
  const pathname = usePathname();
  const { user, subscription } = useAuth();
  const [upgradeTarget, setUpgradeTarget] = useState<{
    featureName: string;
    requiredPlan?: string;
    lockReason?: string;
  } | null>(null);

  if (!isOpen && !upgradeTarget) return null;

  const ctx = getTenantEntitlementContext(user, subscription);
  const terminals = getAccessiblePosTerminals(user, subscription);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none animate-[fade-in_150ms_ease-out]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Modal Dialog */}
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col rounded-sm border border-brand-border bg-white shadow-2xl animate-[scale-in_150ms_ease-out] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-brand-50/50 via-white to-brand-50/30 px-4 sm:px-6 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-white shadow-2xs">
                  <Monitor size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-brand-dark sm:text-lg tracking-tight truncate">
                    {terminals.length === 1 ? "Active POS Terminal" : "POS Terminals"}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {ctx.isSuperAdmin
                      ? "Super Administrator — All Business Terminals"
                      : `${ctx.businessType} Workspace • ${ctx.planName} Plan`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition cursor-pointer shadow-2xs"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Terminals Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <div
                className={cn(
                  "grid grid-cols-1 gap-3",
                  terminals.length === 1
                    ? "sm:grid-cols-1 max-w-md mx-auto"
                    : terminals.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3"
                )}
              >
                {terminals.map((term) => {
                  const Icon = term.icon;
                  const isActive =
                    pathname === term.href ||
                    (term.href !== "/dashboard" && pathname.startsWith(term.href));

                  if (term.isLocked) {
                    return (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          setUpgradeTarget({
                            featureName: term.name,
                            requiredPlan: term.requiredPlan,
                            lockReason: term.lockReason,
                          });
                        }}
                        className="group flex items-center justify-between gap-3 rounded-sm border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-all hover:border-amber-300 hover:bg-amber-50/40 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-slate-500">
                            <Icon size={20} />
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-slate-500 truncate">
                            {term.name}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 shrink-0">
                          <Lock size={10} />
                          <span>{term.lockReason || "Upgrade"}</span>
                        </span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={term.id}
                      href={term.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-3.5 rounded-sm border p-3.5 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                        isActive
                          ? "border-brand-primary bg-brand-50 ring-1 ring-brand-border"
                          : "border-slate-200 bg-white hover:border-brand-primary hover:bg-brand-50/50 shadow-2xs"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-white shadow-2xs bg-gradient-to-tr transition-transform duration-150 group-hover:scale-105",
                          term.accent
                        )}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs sm:text-sm text-brand-dark group-hover:text-brand-primary transition-colors block truncate">
                          {term.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Open terminal counter
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-brand-50/50 px-4 sm:px-6 py-2.5">
              <Link
                href="/settings?tab=subscription"
                onClick={onClose}
                className="text-[11px] font-semibold text-brand-primary hover:underline"
              >
                View Subscription & Enabled Modules →
              </Link>
              <button
                onClick={onClose}
                className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {upgradeTarget && (
        <UpgradeModal
          isOpen={!!upgradeTarget}
          onClose={() => setUpgradeTarget(null)}
          featureName={upgradeTarget.featureName}
          requiredPlan={upgradeTarget.requiredPlan}
          lockReason={upgradeTarget.lockReason}
        />
      )}
    </>
  );
}
