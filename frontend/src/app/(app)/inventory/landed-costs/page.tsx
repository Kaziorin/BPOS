"use client";

import { useEffect, useState } from "react";
import { Plus, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable";

interface LandedCost {
  id: string;
  landedCostNo: string;
  purchaseCost: string;
  shippingCost: string;
  customsCost: string;
  insuranceCost: string;
  handlingCost: string;
  transportCost: string;
  otherCost: string;
  totalLandedCost: string;
  allocationBasis: string;
  createdAt: string;
  supplier: { id: string; name: string } | null;
  goodsReceipt: { id: string; grnNo: string } | null;
}

interface AllocResult {
  landedCostId: string;
  totalLandedCost: number;
  items: { productId: string; allocatedCost: number; adjustedCost: number }[];
}

const COST_FIELDS = [
  { key: "purchaseCost", label: "Purchase Cost" },
  { key: "shippingCost", label: "Shipping" },
  { key: "customsCost", label: "Customs" },
  { key: "insuranceCost", label: "Insurance" },
  { key: "handlingCost", label: "Handling" },
  { key: "transportCost", label: "Transport" },
  { key: "otherCost", label: "Other" },
] as const;

export default function LandedCostsPage() {
  const [costs, setCosts] = useState<LandedCost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AllocResult | null>(null);

  const [form, setForm] = useState({
    purchaseCost: 0, shippingCost: 0, customsCost: 0,
    insuranceCost: 0, handlingCost: 0, transportCost: 0, otherCost: 0,
    allocationBasis: "VALUE",
  });
  const [items, setItems] = useState([{ productId: "", qty: 1, baseCost: 0 }]);

  function load() {
    setLoading(true);
    api.get<{ data: LandedCost[]; total: number }>(`/api/v1/inventory/landed-costs?page=${page}`)
      .then((res) => { setCosts(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page]);

  async function allocate() {
    setSaving(true);
    try {
      const res = await api.post<AllocResult>("/api/v1/inventory/landed-costs", {
        ...form,
        items: items.filter((i) => i.productId),
      });
      setResult(res);
      setShowCreate(false);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const columns: CustomTableColumn<LandedCost>[] = [
    { key: "no", header: "LC #", render: (r) => <span className="font-mono text-sm font-medium">{r.landedCostNo}</span> },
    { key: "supplier", header: "Supplier", render: (r) => <span className="text-gray-600">{r.supplier?.name ?? "—"}</span> },
    { key: "grn", header: "GRN", render: (r) => <span className="text-gray-600">{r.goodsReceipt?.grnNo ?? "—"}</span> },
    { key: "basis", header: "Basis", render: (r) => <span className="text-xs text-gray-500">{r.allocationBasis}</span> },
    {
      key: "total",
      header: "Total Landed Cost",
      align: "right",
      render: (r) => <span className="font-semibold text-gray-900">{Number(r.totalLandedCost).toFixed(2)}</span>,
    },
    { key: "date", header: "Date", render: (r) => <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span> },
  ];

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landed Costs</h1>
          <p className="mt-1 text-sm text-gray-500">Allocate import/purchase costs across received products</p>
        </div>
        <CustomButton leftIcon={<Plus size={15} />} onClick={() => setShowCreate(true)}>New Landed Cost</CustomButton>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <CustomTable columns={columns} data={costs} rowKey={(r) => r.id} loading={loading} emptyIcon={DollarSign} emptyMessage="No landed costs yet" />
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

      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="New Landed Cost Allocation">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {COST_FIELDS.map(({ key, label }) => (
              <CustomInput
                key={key}
                label={label}
                type="number"
                min={0}
                step="0.01"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
              />
            ))}
          </div>
          <CustomSelect
            label="Allocation Basis"
            value={form.allocationBasis}
            onChange={(e) => setForm((f) => ({ ...f, allocationBasis: e.target.value }))}
            options={[
              { value: "VALUE", label: "By Value (proportional)" },
              { value: "QTY", label: "By Quantity (equal per unit)" },
            ]}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Products Received</p>
            {items.map((item, idx) => (
              <div key={idx} className="mb-2 grid grid-cols-3 gap-2">
                <CustomInput placeholder="Product ID" value={item.productId} onChange={(e) => { const n = [...items]; n[idx].productId = e.target.value; setItems(n); }} />
                <CustomInput type="number" min={1} placeholder="Qty" value={item.qty} onChange={(e) => { const n = [...items]; n[idx].qty = Number(e.target.value); setItems(n); }} />
                <CustomInput type="number" min={0} step="0.01" placeholder="Base Cost" value={item.baseCost} onChange={(e) => { const n = [...items]; n[idx].baseCost = Number(e.target.value); setItems(n); }} />
              </div>
            ))}
            <button onClick={() => setItems([...items, { productId: "", qty: 1, baseCost: 0 }])} className="text-xs text-primary-600 hover:underline">+ Add product</button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={allocate}>Allocate</CustomButton>
          </div>
        </div>
      </CustomModal>

      {result && (
        <CustomModal open={!!result} onClose={() => setResult(null)} title="Allocation Result">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Total Landed Cost: <span className="font-bold text-gray-900">{result.totalLandedCost.toFixed(2)}</span></p>
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-400 border-b"><th className="py-2 text-left">Product</th><th className="py-2 text-right">Allocated</th><th className="py-2 text-right">Adj. Cost</th></tr></thead>
              <tbody>
                {result.items.map((i) => (
                  <tr key={i.productId} className="border-b border-gray-50">
                    <td className="py-2 text-xs text-gray-500">{i.productId.slice(-8)}</td>
                    <td className="py-2 text-right">{i.allocatedCost.toFixed(2)}</td>
                    <td className="py-2 text-right font-medium">{i.adjustedCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <CustomButton onClick={() => setResult(null)}>Done</CustomButton>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
}
