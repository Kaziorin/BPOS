"use client";

import { User } from "lucide-react";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import ApprovalCenter from "@/components/workflow/ApprovalCenter";

export default function WorkflowMinePage() {
  return (
    <div className="space-y-6 pb-12">
      <CustomBreadcrumb
        title="My Approval Submissions"
        description="Track the status and progress of requests initiated by your account"
        icon={<User size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workflow Center", href: "/workflow" },
          { label: "My Submissions" },
        ]}
      />
      <ApprovalCenter mine />
    </div>
  );
}
