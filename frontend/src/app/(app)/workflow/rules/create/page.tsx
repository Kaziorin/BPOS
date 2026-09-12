"use client";

import { GitBranch } from "lucide-react";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import WorkflowRules from "@/components/workflow/WorkflowRules";

export default function WorkflowRulesCreatePage() {
  return (
    <div className="space-y-6 pb-12">
      <CustomBreadcrumb
        title="Create Approval Rule"
        description="Build a new multi-tier approval chain with conditional triggers"
        icon={<GitBranch size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workflow Center", href: "/workflow" },
          { label: "Approval Chains", href: "/workflow/rules" },
          { label: "Create Rule" },
        ]}
      />
      <WorkflowRules autoCreate />
    </div>
  );
}
