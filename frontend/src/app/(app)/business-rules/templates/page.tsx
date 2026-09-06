"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";

const TEMPLATES = [
  {
    name: "Reorder stock automatically",
    trigger: "LOW_STOCK",
    if: "product stock < reorder point",
    then: "create a purchase recommendation",
    icon: "📦",
  },
  {
    name: "Deep discount needs approval",
    trigger: "SALE_DISCOUNT",
    if: "discount % is high",
    then: "route through the approval engine",
    icon: "🏷️",
  },
  {
    name: "VIP customers get auto discount",
    trigger: "VIP_CUSTOMER",
    if: "customer tier = VIP",
    then: "apply a 5% discount automatically",
    icon: "👑",
  },
  {
    name: "Block risky credit sales",
    trigger: "CREDIT_SALE",
    if: "customer due > credit limit",
    then: "block the credit sale",
    icon: "🛡️",
  },
];

export default function BusinessRuleTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Zap size={22} className="text-primary-600" /> Rule templates
        </h1>
        <p className="mt-1 text-sm text-gray-500">Battle-tested IF/THEN recipes — start from a template, then tune the thresholds</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <Link key={t.name} href="/business-rules/create"
            className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="text-2xl">{t.icon}</span>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{t.trigger}</span>
            </div>
            <h3 className="mt-3 font-semibold text-gray-900 group-hover:text-primary-700">{t.name}</h3>
            <div className="mt-2 rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600">
              <p><span className="font-bold text-amber-600">IF</span> {t.if}</p>
              <p className="mt-1"><span className="font-bold text-emerald-600">THEN</span> {t.then}</p>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs font-medium text-primary-600">
              Configure this rule <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
