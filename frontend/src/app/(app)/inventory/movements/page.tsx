"use client";

import { useEffect, useState } from "react";
import { Activity, Search } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomBadge } from "@/components/custom/CustomBadge";

interface Movement {
  id: string;
  movementType: string;
  qty: string;
  qtyBefore: string;
  qtyAfter: string;
  refType: string | null;
  refId: string | null;
  note: string | null;
  userId: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  warehouse: { id: string; name: string; code: string };
}

const MOVEMENT_TONE: Record<string, "green" | "red" | "gray" | "amber"> = {
  OPENING: "primary" as any,
  PURCHASE_IN: "green",
  SALE_OUT: "red",
  SALE_RETURN_IN: "green",
  ADJUSTMENT_IN: "amber",
  ADJUSTMENT_OUT: "amber",
  TRANSFER_IN: "green",
  TRANSFER_OUT: "red",
  WRITE_OFF: "red",
  PRODUCTION_IN: "green",
  PRODUCTION_OUT: "red",
};

const MOVEMENT_TYPES = [
  "OPENING", "PURCHASE_IN", "SALE_OUT", "SALE_RETURN_IN",
  "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "TRANSFER_IN", "TRANSFER_OUT",
  "WRITE_OFF", "PRODUCTION_IN", "PRODUCTION_OUT",
];

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [movementType, setMovementType] = useState("");
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (movementType) params.set("movementType", movementType);
    api
      .get<{ data: Movement[]; total: number }>(`/api/v1/inventory/movements?${params}`)
      .then((res) => { setMovements(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, movementType]);

  const columns: CustomTableColumn<Movement>[] = [
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <CustomBadge tone={MOVEMENT_TONE[r.movementType] ?? "gray"}>
          {r.movementType.replace(/_/g, " ")}
        </CustomBadge>
      ),
    },
    {
      key: "product",
      header: "Product",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.product.name}</p>
          <p className="text-xs text-gray-400">{r.product.sku}</p>
        </div>
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (r) => <span className="text-gray-600">{r.warehouse.code}</span>,
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      render: (r) => {
        const q = Number(r.qty);
        return (
          <span className={q > 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
            {q > 0 ? `+${q}` : q}
          </span>
        );
      },
    },
    {
      key: "before",
      header: "Before → After",
      align: "right",
      render: (r) => (
        <span className="text-gray-500 text-xs">
          {Number(r.qtyBefore)} → {Number(r.qtyAfter)}
        </span>
      ),
    },
    {
      key: "ref",
      header: "Reference",
      render: (r) => (
        <span className="text-xs text-gray-400">{r.refType ?? "—"} {r.refId ? `#${r.refId.slice(-6)}` : ""}</span>
      ),
    },
    {
      key: "note",
      header: "Note",
      render: (r) => <span className="text-xs text-gray-500 truncate max-w-[160px] block">{r.note ?? "—"}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
      ),
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <p className="mt-1 text-sm text-gray-500">Full audit trail — every stock change is recorded here</p>
      </div>

      <div className="flex gap-3">
        <CustomSelect
          containerClassName="w-56"
          value={movementType}
          onChange={(e) => { setMovementType(e.target.value); setPage(1); }}
          placeholder="All movement types"
          options={MOVEMENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <CustomTable
          columns={columns}
          data={movements}
          rowKey={(r) => r.id}
          loading={loading}
          emptyIcon={Activity}
          emptyMessage="No stock movements yet"
        />
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
            <span>{total} records</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
