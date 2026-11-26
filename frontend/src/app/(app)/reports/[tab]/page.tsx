"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { ReportsContent } from "../page";

type TabType = "sales" | "inventory" | "financial" | "commission" | "installments" | "saved" | "scheduled";

function SubReportPageInner() {
  const params = useParams();
  const rawTab = String(params?.tab || "sales").toLowerCase();
  const validTab: TabType = [
    "sales",
    "inventory",
    "financial",
    "commission",
    "installments",
    "saved",
    "scheduled",
  ].includes(rawTab as TabType)
    ? (rawTab as TabType)
    : "sales";

  return <ReportsContent initialTab={validTab} />;
}

export default function SubReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      <SubReportPageInner />
    </Suspense>
  );
}
