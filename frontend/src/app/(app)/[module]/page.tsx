"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useDynamicNav } from "@/lib/dynamic-nav";

interface ModuleItem {
  id: string;
  label: string;
  icon: null;
  route: string;
  permission: null;
}

function DefaultModulePage({ moduleCode, items }: { moduleCode: string; items: ModuleItem[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 capitalize">{moduleCode.replace(/-/g, " ")}</h1>
        <p className="mt-1 text-sm text-gray-500">Manage {moduleCode.replace(/-/g, " ")} settings and data</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.route}
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-primary-300 hover:shadow-md"
          >
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">{item.label}</h3>
          </a>
        ))}
      </div>

      {items.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500">No menu items available for this module</p>
        </div>
      )}
    </div>
  );
}

export default function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleCode } = use(params);
  const { navGroups, loading, error } = useDynamicNav();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Error loading module: {error}</p>
      </div>
    );
  }

  const moduleItems: ModuleItem[] = [];

  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href.startsWith(`/${moduleCode}`)) {
        moduleItems.push({
          id: item.href,
          label: item.label,
          icon: null,
          route: item.href,
          permission: null,
        });
      }
    }
  }

  if (moduleItems.length === 0) {
    notFound();
  }

  return <DefaultModulePage moduleCode={moduleCode} items={moduleItems} />;
}
