"use client";

import { useEffect, useState } from "react";
import { Package, Search, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomBadge } from "@/components/custom/CustomBadge";

interface Warehouse { id: string; name: string; code: string; }
interface StockRow {
  id: string;
  qtyOnHand: string;
  qtyReserved: string;
  avgCost: string | null;
  product: { id: string; name: string; sku: string; barcode: string | null };
  variant: { id: string; name: string; sku: string } | null;
  warehouse: { id: string; name: string; code: string };
}

function stockTone(qty: number) {
  if (qty <= 0) return "red" as const;
  if (qty <= 5) return "amber" as const;
  return "green" as const;
}

export default function StockPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<StockRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 50;

  useEffect(() => {
    api.get<{ data: Warehouse[] }>("/api/v1/warehouses").then((res) => {
      setWarehouses(res.data);
      if (res.data.length > 0) setWarehouseId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    api
      .get<{ data: StockRow[]; total: number }>(`/api/v1/inventory/stock/${warehouseId}?${params}`)
      .then((res) => { setRows(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [warehouseId, search, page]);

  const columns: CustomTableColumn<StockRow>[] = [
    {
      key: "product",
      header: "Product",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.product.name}</p>
          <p className="text-xs text-gray-400">{r.variant ? `${r.product.sku} / ${r.variant.sku}` : r.product.sku}</p>
        </div>
      ),
    },
    {
      key: "onHand",
      header: "On Hand",
      align: "right",
      render: (r) => {
        const qty = Number(r.qtyOnHand);
        return <CustomBadge tone={stockTone(qty)}>{qty}</CustomBadge>;
      },
    },
    {
      key: "reserved",
      header: "Reserved",
      align: "right",
      render: (r) => <span className="text-gray-600">{Number(r.qtyReserved)}</span>,
    },
    {
      key: "available",
      header: "Available",
      align: "right",
      render: (r) => {
        const avail = Number(r.qtyOnHand) - Number(r.qtyReserved);
        return <span className={avail <= 0 ? "text-red-600 font-medium" : "text-gray-900"}>{avail}</span>;
      },
    },
    {
      key: "avgCost",
      header: "Avg Cost",
      align: "right",
      render: (r) => (
        <span className="text-gray-600">{r.avgCost ? Number(r.avgCost).toFixed(2) : "—"}</span>
      ),
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Levels</h1>
          <p className="mt-1 text-sm text-gray-500">Current on-hand, reserved, and available quantities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><TrendingUp size={13} className="text-emerald-500" /> In Stock</span>
            <span className="flex items-center gap-1"><Minus size={13} className="text-amber-500" /> Low</span>
            <span className="flex items-center gap-1"><TrendingDown size={13} className="text-red-500" /> Out</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <CustomSelect
          containerClassName="w-56"
          value={warehouseId}
          onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
          options={warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))}
          placeholder="Select warehouse"
        />
        <CustomInput
          containerClassName="flex-1 max-w-xs"
          placeholder="Search product…"
          leftIcon={<Search size={15} />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <CustomTable
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          loading={loading}
          emptyIcon={Package}
          emptyMessage="No stock records for this warehouse"
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
