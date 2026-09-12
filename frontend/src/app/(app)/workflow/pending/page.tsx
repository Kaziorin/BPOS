"use client";

import { Clock } from "lucide-react";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import ApprovalCenter from "@/components/workflow/ApprovalCenter";

export default function WorkflowPendingPage() {
  return (
    <div className="space-y-6 pb-12">
      <CustomBreadcrumb
        title="Pending Approvals Queue"
        description="Active commercial transactions awaiting manager and authority review"
        icon={<Clock size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workflow Center", href: "/workflow" },
          { label: "Pending Approvals" },
        ]}
      />
      <ApprovalCenter defaultStatus="PENDING" />
    </div>
  );
}
