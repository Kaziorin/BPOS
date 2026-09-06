"use client";

import { useEffect, useState } from "react";
import { FlaskConical, AlertTriangle, Search } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomBadge } from "@/components/custom/CustomBadge";

interface Batch {
  id: string;
  batchNo: string;
  qty: string;
  costPrice: string | null;
  mfgDate: string | null;
  expiryDate: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
}

function expiryTone(expiryDate: string | null): "green" | "amber" | "red" | "gray" {
  if (!expiryDate) return "gray";
  const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return "red";
  if (days <= 30) return "amber";
  return "green";
}

function expiryLabel(expiryDate: string | null) {
  if (!expiryDate) return "—";
  const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${new Date(expiryDate).toLocaleDateString()} (${days}d)`;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (expiringSoon) params.set("expiringSoon", "true");
    api.get<{ data: Batch[] } | Batch[]>(`/api/v1/inventory/batches?${params}`)
      .then((res) => setBatches(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [expiringSoon]);

  const batchList = Array.isArray(batches) ? batches : [];
  const filtered = search
    ? batchList.filter((b) => (b.product?.name ?? (b as any).productName ?? "").toLowerCase().includes(search.toLowerCase()) || b.batchNo.toLowerCase().includes(search.toLowerCase()))
    : batchList;

  const columns: CustomTableColumn<Batch>[] = [
    {
      key: "product",
      header: "Product",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.product?.name ?? (r as any).productName ?? "Unknown Product"}</p>
          <p className="text-xs text-gray-400">{r.product?.sku ?? (r as any).productSku ?? (r as any).sku ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "batch",
      header: "Batch #",
      render: (r) => <span className="font-mono text-sm">{r.batchNo}</span>,
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      render: (r) => <span className="font-medium">{Number(r.qty)}</span>,
    },
    {
      key: "mfg",
      header: "Mfg Date",
      render: (r) => <span className="text-sm text-gray-500">{r.mfgDate ? new Date(r.mfgDate).toLocaleDateString() : "—"}</span>,
    },
    {
      key: "expiry",
      header: "Expiry",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          {r.expiryDate && expiryTone(r.expiryDate) !== "green" && (
            <AlertTriangle size={13} className={expiryTone(r.expiryDate) === "red" ? "text-red-500" : "text-amber-500"} />
          )}
          <CustomBadge tone={expiryTone(r.expiryDate)}>{expiryLabel(r.expiryDate)}</CustomBadge>
        </div>
      ),
    },
    {
      key: "cost",
      header: "Cost",
      align: "right",
      render: (r) => <span className="text-gray-600">{r.costPrice ? Number(r.costPrice).toFixed(2) : "—"}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch & Expiry Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">FEFO — First Expired, First Out. Batches sorted by earliest expiry.</p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <CustomInput
          containerClassName="max-w-xs"
          placeholder="Search product or batch…"
          leftIcon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={expiringSoon}
            onChange={(e) => setExpiringSoon(e.target.checked)}
            className="rounded border-gray-300 text-primary-500 focus:ring-primary-400"
          />
          Expiring within 30 days
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <CustomTable
          columns={columns}
          data={filtered}
          rowKey={(r) => r.id}
          loading={loading}
          emptyIcon={FlaskConical}
          emptyMessage="No batches found"
        />
      </div>
    </div>
  );
}
