"use client";

import { GitBranch } from "lucide-react";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import WorkflowRules from "@/components/workflow/WorkflowRules";

export default function WorkflowRulesPage() {
  return (
    <div className="space-y-6 pb-12">
      <CustomBreadcrumb
        title="Approval Chains & Rules"
        description="Configure threshold conditions, approval role hierarchy, and auto-escalation timeouts"
        icon={<GitBranch size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workflow Center", href: "/workflow" },
          { label: "Approval Chains & Rules", href: "/workflow/rules" },
        ]}
      />
      <WorkflowRules />
    </div>
  );
}
