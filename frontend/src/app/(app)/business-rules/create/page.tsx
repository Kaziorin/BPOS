"use client";

import { Zap } from "lucide-react";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import BusinessRules from "@/components/workflow/BusinessRules";

export default function BusinessRulesCreatePage() {
  return (
    <div className="space-y-6 pb-12">
      <CustomBreadcrumb
        title="Create Business Automation Rule"
        description="Configure automated IF-THEN triggers and actions"
        icon={<Zap size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workflow Center", href: "/workflow" },
          { label: "Business Rules", href: "/business-rules" },
          { label: "Create Rule" },
        ]}
      />
      <BusinessRules autoCreate />
    </div>
  );
}
