"use client";

import Link from "next/link";
import ApprovalCenter from "@/components/workflow/ApprovalCenter";

export default function WorkflowPage() {
  return (
    <div>
      <ApprovalCenter onNeedRules={undefined} />
      <div className="pt-2 text-center">
        <Link href="/workflow/rules" className="text-xs font-medium text-primary-600 hover:text-primary-700">
          Configure approval thresholds &amp; chains →
        </Link>
      </div>
    </div>
  );
}
