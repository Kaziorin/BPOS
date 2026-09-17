"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Package,
  Activity,
  ArrowRightLeft,
  ClipboardList,
  FlaskConical,
  DollarSign,
  Handshake,
  Settings2,
  AlertTriangle,
  Warehouse,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb, CustomStatCard } from "@/components/custom";

interface InventoryStats {
  totalProducts: number;
  lowStockCount: number;
  pendingTransfers: number;
  expiringBatches: number;
}

const CARDS = [
  {
    href: "/inventory/stock",
    icon: Package,
    label: "Stock Levels",
    desc: "On-hand, reserved, available per warehouse",
    color: "bg-sky-50 text-[#0284C7] border-sky-200/80",
  },
  {
    href: "/inventory/movements",
    icon: Activity,
    label: "Stock Movements",
    desc: "Full audit trail of every stock change",
    color: "bg-sky-50 text-[#0369A1] border-sky-200/80",
  },
  {
    href: "/inventory/transfers",
    icon: ArrowRightLeft,
    label: "Transfers",
    desc: "Request → Approve → Ship → Receive",
    color: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  {
    href: "/inventory/counts",
    icon: ClipboardList,
    label: "Stock Counts",
    desc: "Physical count & reconciliation",
    color: "bg-teal-50 text-teal-700 border-teal-200/80",
  },
  {
    href: "/inventory/batches",
    icon: FlaskConical,
    label: "Batches & Expiry",
    desc: "FEFO tracking, expiry alerts",
    color: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
  {
    href: "/inventory/landed-costs",
    icon: DollarSign,
    label: "Landed Costs",
    desc: "Allocate import costs across receipts",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  {
    href: "/inventory/consignments",
    icon: Handshake,
    label: "Consignments",
    desc: "Supplier-owned stock, settlement",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  },
  {
    href: "/settings",
    icon: Settings2,
    label: "Inventory Config",
    desc: "Costing method, batch/serial tracking",
    color: "bg-slate-50 text-slate-700 border-slate-200/80",
  },
];

export default function InventoryPage() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ totalProducts: number; lowStockCount: number }>("/api/v1/dashboard/summary").catch(() => null),
      api.get<{ data: any[] }>("/api/v1/inventory/transfers?status=APPROVED").catch(() => null),
      api.get<any[]>("/api/v1/inventory/batches?expiringSoon=true").catch(() => null),
    ]).then(([dash, transfers, batches]) => {
      setStats({
        totalProducts: (dash as any)?.totalProducts ?? 0,
        lowStockCount: (dash as any)?.lowStockCount ?? 0,
        pendingTransfers: (transfers as any)?.total ?? (Array.isArray((transfers as any)?.data) ? (transfers as any).data.length : 0),
        expiringBatches: Array.isArray(batches) ? batches.length : 0,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4 pb-10">
      {/* Breadcrumb: No subtitle, clean Operations > Inventory */}
      <CustomBreadcrumb
        title="Inventory & Warehouse"
        icon={<Warehouse size={16} className="text-[#0284C7]" />}
        breadcrumbs={[{ label: "Operations", href: "/dashboard" }, { label: "Inventory" }]}
      />

      {/* Quick Stats: Using standard CustomStatCard */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CustomStatCard
          label="Total Products"
          value={loading ? "—" : String(stats?.totalProducts ?? 0)}
          icon={Package}
          tone="primary"
        />
        <CustomStatCard
          label="Low Stock"
          value={loading ? "—" : String(stats?.lowStockCount ?? 0)}
          icon={AlertTriangle}
          tone="red"
        />
        <CustomStatCard
          label="Pending Transfers"
          value={loading ? "—" : String(stats?.pendingTransfers ?? 0)}
          icon={ArrowRightLeft}
          tone="amber"
        />
        <CustomStatCard
          label="Expiring Batches"
          value={loading ? "—" : String(stats?.expiringBatches ?? 0)}
          icon={FlaskConical}
          tone="violet"
        />
      </div>

      {/* Navigation cards with standard BPOS sky theme */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-sm border border-sky-100/90 bg-white p-4 shadow-2xs transition-all hover:border-[#0284C7] hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-sm border ${card.color} transition-transform group-hover:scale-105`}>
                  <Icon size={18} />
                </div>
                <p className="font-bold text-slate-800 text-xs group-hover:text-[#0284C7] transition-colors">
                  {card.label}
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
