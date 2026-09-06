"use client";

import { useEffect, useState } from "react";
import { Hash, Search } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomBadge } from "@/components/custom/CustomBadge";

interface Serial {
  id: string;
  serialNo: string;
  status: string;
  imei: string | null;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
}

const STATUS_TONE: Record<string, any> = {
  IN_STOCK: "green", SOLD: "primary", RETURNED: "amber", DEFECTIVE: "red", SCRAPPED: "gray",
};

const STATUSES = ["IN_STOCK", "SOLD", "RETURNED", "DEFECTIVE", "SCRAPPED"];

export default function SerialsPage() {
  const [serials, setSerials] = useState<Serial[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    api.get<{ data: Serial[] } | Serial[]>(`/api/v1/inventory/serials?${params}`)
      .then((res) => setSerials(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => setSerials([]))
      .finally(() => setLoading(false));
  }, [status]);

  const serialList = Array.isArray(serials) ? serials : [];
  const filtered = search
    ? serialList.filter(
        (s) =>
          s.serialNo.toLowerCase().includes(search.toLowerCase()) ||
          (s.product?.name ?? (s as any).productName ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : serialList;

  const columns: CustomTableColumn<Serial>[] = [
    {
      key: "serial",
      header: "Serial #",
      render: (r) => <span className="font-mono text-sm font-medium">{r.serialNo}</span>,
    },
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
      key: "imei",
      header: "IMEI",
      render: (r) => <span className="font-mono text-xs text-gray-500">{r.imei ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <CustomBadge tone={STATUS_TONE[r.status] ?? "gray"}>
          {r.status.replace(/_/g, " ")}
        </CustomBadge>
      ),
    },
    {
      key: "warranty",
      header: "Warranty",
      render: (r) => {
        if (!r.warrantyEnd) return <span className="text-gray-400 text-xs">—</span>;
        const expired = new Date(r.warrantyEnd) < new Date();
        return (
          <span className={`text-xs ${expired ? "text-red-500" : "text-gray-600"}`}>
            {expired ? "Expired" : "Until"} {new Date(r.warrantyEnd).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "date",
      header: "Registered",
      render: (r) => (
        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Serial Numbers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Full lifecycle — In Stock → Sold → Returned / Defective
        </p>
      </div>

      <div className="flex gap-3">
        <CustomInput
          containerClassName="max-w-xs"
          placeholder="Search serial or product…"
          leftIcon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <CustomSelect
          containerClassName="w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="All statuses"
          options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <CustomTable
          columns={columns}
          data={filtered}
          rowKey={(r) => r.id}
          loading={loading}
          emptyIcon={Hash}
          emptyMessage="No serial numbers registered"
        />
      </div>
    </div>
  );
}
