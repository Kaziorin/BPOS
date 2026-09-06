"use client";

import { useEffect, useState } from "react";
import { Plus, Handshake, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomBadge } from "@/components/custom/CustomBadge";

interface Consignment {
  id: string;
  consignmentNo: string;
  totalQty: string;
  totalValue: string;
  commissionPct: string | null;
  status: string;
  createdAt: string;
  supplier: { id: string; name: string };
  warehouse: { id: string; name: string; code: string };
  _count: { items: number };
}

interface ConsignmentDetail extends Consignment {
  items: {
    id: string;
    productId: string;
    qtyReceived: string;
    qtySold: string;
    qtyReturned: string;
    unitCost: string;
    sellingPrice: string;
    product: { name: string; sku: string };
  }[];
  settlement: { totalSold: string; totalCommission: string; totalPayable: string } | null;
}

const STATUS_TONE: Record<string, any> = {
  PENDING: "gray", ACTIVE: "primary", PARTIAL: "amber", SETTLED: "green", RETURNED: "red",
};

export default function ConsignmentsPage() {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<ConsignmentDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ supplierId: "", warehouseId: "", commissionPct: 0, note: "" });
  const [items, setItems] = useState([{ productId: "", qtyReceived: 1, unitCost: 0, sellingPrice: 0 }]);

  function load() {
    setLoading(true);
    api.get<{ data: Consignment[]; total: number }>(`/api/v1/inventory/consignments?page=${page}`)
      .then((res) => { setConsignments(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page]);

  async function openDetail(c: Consignment) {
    const detail = await api.get<ConsignmentDetail>(`/api/v1/inventory/consignments/${c.id}`);
    setSelected(detail);
  }

  async function receive() {
    setSaving(true);
    try {
      await api.post("/api/v1/inventory/consignments", {
        ...form,
        items: items.filter((i) => i.productId),
      });
      setShowCreate(false);
      setForm({ supplierId: "", warehouseId: "", commissionPct: 0, note: "" });
      setItems([{ productId: "", qtyReceived: 1, unitCost: 0, sellingPrice: 0 }]);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function settle(id: string) {
    setSaving(true);
    try {
      await api.post(`/api/v1/inventory/consignments/${id}/settle`);
      setSelected(null);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const columns: CustomTableColumn<Consignment>[] = [
    { key: "no", header: "Consignment #", render: (r) => <span className="font-mono text-sm font-medium">{r.consignmentNo}</span> },
    { key: "supplier", header: "Supplier", render: (r) => <span className="text-gray-700">{r.supplier.name}</span> },
    { key: "warehouse", header: "Warehouse", render: (r) => <span className="text-gray-600">{r.warehouse.code}</span> },
    { key: "qty", header: "Total Qty", align: "right", render: (r) => <span>{Number(r.totalQty)}</span> },
    { key: "value", header: "Value", align: "right", render: (r) => <span className="font-medium">{Number(r.totalValue).toFixed(2)}</span> },
    { key: "commission", header: "Commission", align: "right", render: (r) => <span className="text-gray-500">{r.commissionPct ? `${r.commissionPct}%` : "—"}</span> },
    { key: "status", header: "Status", render: (r) => <CustomBadge tone={STATUS_TONE[r.status]}>{r.status}</CustomBadge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <CustomButton size="sm" variant="outline" onClick={() => openDetail(r)}>View</CustomButton>
      ),
    },
  ];

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consignment Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Supplier-owned stock — track sales, returns, and settlement</p>
        </div>
        <CustomButton leftIcon={<Plus size={15} />} onClick={() => setShowCreate(true)}>Receive Consignment</CustomButton>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <CustomTable columns={columns} data={consignments} rowKey={(r) => r.id} loading={loading} emptyIcon={Handshake} emptyMessage="No consignments yet" />
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

      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="Receive Consignment">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Supplier ID" value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} placeholder="Supplier ID" />
            <CustomInput label="Warehouse ID" value={form.warehouseId} onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))} placeholder="Warehouse ID" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Commission %" type="number" min={0} max={100} step="0.1" value={form.commissionPct} onChange={(e) => setForm((f) => ({ ...f, commissionPct: Number(e.target.value) }))} />
            <CustomInput label="Note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Items</p>
            {items.map((item, idx) => (
              <div key={idx} className="mb-2 grid grid-cols-4 gap-2">
                <CustomInput placeholder="Product ID" value={item.productId} onChange={(e) => { const n = [...items]; n[idx].productId = e.target.value; setItems(n); }} />
                <CustomInput type="number" min={1} placeholder="Qty" value={item.qtyReceived} onChange={(e) => { const n = [...items]; n[idx].qtyReceived = Number(e.target.value); setItems(n); }} />
                <CustomInput type="number" min={0} step="0.01" placeholder="Cost" value={item.unitCost} onChange={(e) => { const n = [...items]; n[idx].unitCost = Number(e.target.value); setItems(n); }} />
                <CustomInput type="number" min={0} step="0.01" placeholder="Sell Price" value={item.sellingPrice} onChange={(e) => { const n = [...items]; n[idx].sellingPrice = Number(e.target.value); setItems(n); }} />
              </div>
            ))}
            <button onClick={() => setItems([...items, { productId: "", qtyReceived: 1, unitCost: 0, sellingPrice: 0 }])} className="text-xs text-primary-600 hover:underline">+ Add item</button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={receive}>Receive</CustomButton>
          </div>
        </div>
      </CustomModal>

      {selected && (
        <CustomModal open={!!selected} onClose={() => setSelected(null)} title={`Consignment ${selected.consignmentNo}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">Supplier:</span> <span className="font-medium">{selected.supplier.name}</span></div>
              <div><span className="text-gray-400">Status:</span> <CustomBadge tone={STATUS_TONE[selected.status]}>{selected.status}</CustomBadge></div>
              <div><span className="text-gray-400">Commission:</span> <span>{selected.commissionPct ? `${selected.commissionPct}%` : "—"}</span></div>
            </div>

            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-400 border-b"><th className="py-2 text-left">Product</th><th className="py-2 text-right">Rcvd</th><th className="py-2 text-right">Sold</th><th className="py-2 text-right">Returned</th><th className="py-2 text-right">Remaining</th></tr></thead>
              <tbody>
                {selected.items.map((item) => {
                  const remaining = Number(item.qtyReceived) - Number(item.qtySold) - Number(item.qtyReturned);
                  return (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-2">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{item.product.sku}</p>
                      </td>
                      <td className="py-2 text-right">{Number(item.qtyReceived)}</td>
                      <td className="py-2 text-right text-emerald-600">{Number(item.qtySold)}</td>
                      <td className="py-2 text-right text-amber-600">{Number(item.qtyReturned)}</td>
                      <td className="py-2 text-right font-medium">{remaining}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {selected.settlement && (
              <div className="rounded-lg bg-emerald-50 p-3 text-sm space-y-1">
                <p className="font-medium text-emerald-800">Settlement</p>
                <div className="grid grid-cols-3 gap-2 text-emerald-700">
                  <div>Sold: <span className="font-medium">{Number(selected.settlement.totalSold)}</span></div>
                  <div>Commission: <span className="font-medium">{Number(selected.settlement.totalCommission).toFixed(2)}</span></div>
                  <div>Payable: <span className="font-bold">{Number(selected.settlement.totalPayable).toFixed(2)}</span></div>
                </div>
              </div>
            )}

            {selected.status !== "SETTLED" && selected.status !== "RETURNED" && (
              <div className="flex justify-end">
                <CustomButton loading={saving} leftIcon={<CheckCircle size={14} />} onClick={() => settle(selected.id)}>
                  Settle Consignment
                </CustomButton>
              </div>
            )}
          </div>
        </CustomModal>
      )}
    </div>
  );
}
