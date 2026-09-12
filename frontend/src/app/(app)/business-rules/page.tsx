"use client";

import { Zap } from "lucide-react";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import BusinessRules from "@/components/workflow/BusinessRules";

export default function BusinessRulesPage() {
  return (
    <div className="space-y-6 pb-12">
      <CustomBreadcrumb
        title="Business Automation Rules (§10.27)"
        description="Automated IF-THEN triggers for inventory reorders, discounts, and risk prevention"
        icon={<Zap size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workflow Center", href: "/workflow" },
          { label: "Business Automation Rules (§10.27)", href: "/business-rules" },
        ]}
      />
      <BusinessRules />
    </div>
  );
}
