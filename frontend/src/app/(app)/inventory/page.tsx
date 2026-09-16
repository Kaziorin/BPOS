"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Package, Activity, ArrowRightLeft, ClipboardList,
  FlaskConical, DollarSign, Handshake, Settings2, AlertTriangle, Warehouse
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";

interface InventoryStats {
  totalProducts: number;
  lowStockCount: number;
  pendingTransfers: number;
  expiringBatches: number;
}

const CARDS = [
  { href: "/inventory/stock", icon: Package, label: "Stock Levels", desc: "On-hand, reserved, available per warehouse", color: "bg-sky-50 text-[#0284C7] border-sky-200/80" },
  { href: "/inventory/movements", icon: Activity, label: "Stock Movements", desc: "Full audit trail of every stock change", color: "bg-sky-50 text-[#0369A1] border-sky-200/80" },
  { href: "/inventory/transfers", icon: ArrowRightLeft, label: "Transfers", desc: "Request → Approve → Ship → Receive", color: "bg-amber-50 text-amber-700 border-amber-200/80" },
  { href: "/inventory/counts", icon: ClipboardList, label: "Stock Counts", desc: "Physical count & reconciliation", color: "bg-sky-50 text-[#0284C7] border-sky-200/80" },
  { href: "/inventory/batches", icon: FlaskConical, label: "Batches & Expiry", desc: "FEFO tracking, expiry alerts", color: "bg-rose-50 text-rose-700 border-rose-200/80" },
  { href: "/inventory/landed-costs", icon: DollarSign, label: "Landed Costs", desc: "Allocate import costs across receipts", color: "bg-emerald-50 text-emerald-700 border-emerald-200/80" },
  { href: "/inventory/consignments", icon: Handshake, label: "Consignments", desc: "Supplier-owned stock, settlement", color: "bg-sky-50 text-[#0369A1] border-sky-200/80" },
  { href: "/settings", icon: Settings2, label: "Inventory Config", desc: "Costing method, batch/serial tracking", color: "bg-gray-50 text-gray-700 border-gray-200/80" },
];

export default function InventoryPage() {
  const [stats, setStats] = useState<InventoryStats | null>(null);

  useEffect(() => {
    // Fetch a few quick stats
    Promise.all([
      api.get<{ totalProducts: number; lowStockCount: number }>("/api/v1/dashboard/summary").catch(() => null),
      api.get<{ data: any[] }>("/api/v1/inventory/transfers?status=APPROVED").catch(() => null),
      api.get<any[]>("/api/v1/inventory/batches?expiringSoon=true").catch(() => null),
    ]).then(([dash, transfers, batches]) => {
      setStats({
        totalProducts: (dash as any)?.totalProducts ?? 0,
        lowStockCount: (dash as any)?.lowStockCount ?? 0,
        pendingTransfers: (transfers as any)?.total ?? 0,
        expiringBatches: Array.isArray(batches) ? batches.length : 0,
      });
    });
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <CustomBreadcrumb
        title="Inventory & Warehouse"
        subtitle="FIFO / FEFO / Weighted Average costing · Batch & Serial tracking · Full movement audit trail"
        icon={<Warehouse size={20} />}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Inventory" }]}
      />

      {/* Quick stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <StatCard label="Total Products" value={stats.totalProducts} />
          <StatCard label="Low Stock" value={stats.lowStockCount} warn={stats.lowStockCount > 0} />
          <StatCard label="Pending Transfers" value={stats.pendingTransfers} warn={stats.pendingTransfers > 0} />
          <StatCard label="Expiring Batches" value={stats.expiringBatches} warn={stats.expiringBatches > 0} />
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-sm border border-sky-100/90 bg-white p-5 shadow-xs transition hover:border-[#0284C7]/60 hover:shadow-sm"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-sm border ${card.color}`}>
                <Icon size={20} />
              </div>
              <p className="font-semibold text-gray-900 group-hover:text-[#0284C7] transition">{card.label}</p>
              <p className="mt-1 text-xs text-gray-500">{card.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`rounded-sm border p-4 shadow-xs ${warn ? "border-amber-200 bg-amber-50/50" : "border-sky-100/90 bg-white"}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {warn && <AlertTriangle size={14} className="text-amber-500" />}
      </div>
      <p className={`mt-1.5 text-2xl font-bold ${warn ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
