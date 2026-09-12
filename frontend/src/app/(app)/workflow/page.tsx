"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitMerge,
  Inbox,
  GitBranch,
  Zap,
  ShoppingCart,
  TestTube2,
  Settings,
  Clock,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import ApprovalCenter from "@/components/workflow/ApprovalCenter";
import WorkflowRules from "@/components/workflow/WorkflowRules";
import BusinessRules from "@/components/workflow/BusinessRules";

function WorkflowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") || "inbox";
  const mineParam = searchParams.get("mine") === "1";
  const statusParam = searchParams.get("status") || "";

  const [activeTab, setActiveTab] = useState<"inbox" | "rules" | "business-rules" | "recommendations" | "simulator">(
    tabParam === "rules"
      ? "rules"
      : tabParam === "business-rules"
      ? "business-rules"
      : tabParam === "recommendations"
      ? "recommendations"
      : tabParam === "simulator"
      ? "simulator"
      : "inbox"
  );

  useEffect(() => {
    if (tabParam === "rules") setActiveTab("rules");
    else if (tabParam === "business-rules") setActiveTab("business-rules");
    else if (tabParam === "recommendations") setActiveTab("recommendations");
    else if (tabParam === "simulator") setActiveTab("simulator");
    else setActiveTab("inbox");
  }, [tabParam]);

  const switchTab = (tab: "inbox" | "rules" | "business-rules" | "recommendations" | "simulator") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "inbox") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.replace(`/workflow?${params.toString()}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <CustomBreadcrumb
        title="Workflow & Approvals"
        description="Unified commercial approval threshold gateway & policy engineering"
        icon={<GitMerge size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Operations & Governance" },
          { label: "Workflow & Approval Center", href: "/workflow" },
        ]}
      />

      {/* Enterprise Suite Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-md">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="absolute right-1/3 -bottom-12 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary-300 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} className="animate-pulse" />
              <span>Enterprise Approval & Workflow Engine (§10.26 / §10.27)</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Workflow Approvals & Policy Engineering
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Unified governance hub across POS discounts, purchase orders, catalog pricing adjustments, customer credit expansion, and inventory write-offs with multi-tier escalation SLA rules.
            </p>
          </div>

          {/* Quick Tab Action Cards inside Banner */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => switchTab("inbox")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                activeTab === "inbox"
                  ? "bg-primary-500 text-white ring-2 ring-primary-300/40"
                  : "bg-white/10 text-slate-200 hover:bg-white/20 backdrop-blur-md"
              }`}
            >
              <Inbox size={15} />
              <span>Approval Queue</span>
            </button>

            <button
              onClick={() => switchTab("rules")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                activeTab === "rules"
                  ? "bg-primary-500 text-white ring-2 ring-primary-300/40"
                  : "bg-white/10 text-slate-200 hover:bg-white/20 backdrop-blur-md"
              }`}
            >
              <GitBranch size={15} />
              <span>Workflow Rules</span>
            </button>

            <button
              onClick={() => switchTab("business-rules")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                activeTab === "business-rules"
                  ? "bg-primary-500 text-white ring-2 ring-primary-300/40"
                  : "bg-white/10 text-slate-200 hover:bg-white/20 backdrop-blur-md"
              }`}
            >
              <Zap size={15} />
              <span>Business Rules</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => switchTab("inbox")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "inbox"
              ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Inbox size={14} />
          <span>Approval Requests & History</span>
        </button>

        <button
          onClick={() => switchTab("rules")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "rules"
              ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <GitBranch size={14} />
          <span>Approval Thresholds & Chains</span>
        </button>

        <button
          onClick={() => switchTab("business-rules")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "business-rules"
              ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Zap size={14} />
          <span>Event Automation & Rules (§10.27)</span>
        </button>
      </div>

      {/* Active Tab View Rendering */}
      {activeTab === "inbox" && (
        <ApprovalCenter
          mine={mineParam}
          defaultStatus={statusParam}
          onNeedRules={() => switchTab("rules")}
        />
      )}

      {activeTab === "rules" && <WorkflowRules />}

      {activeTab === "business-rules" && <BusinessRules />}

      {activeTab === "recommendations" && <BusinessRules />}

      {activeTab === "simulator" && <BusinessRules />}
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      <WorkflowContent />
    </Suspense>
  );
}
