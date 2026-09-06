"use client";

import { useEffect, useState } from "react";
import { Plus, ClipboardList, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomBadge } from "@/components/custom/CustomBadge";

interface Warehouse { id: string; name: string; code: string; }
interface CountItem {
  id: string;
  productId: string;
  systemQty: string;
  countedQty: string;
  diffQty: string;
  product: { name: string; sku: string };
}
interface StockCount {
  id: string;
  countNo: string;
  countDate: string;
  status: string;
  warehouse: { id: string; name: string; code: string };
  items?: CountItem[];
}

export default function StockCountsPage() {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<StockCount | null>(null);
  const [saving, setSaving] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [countedValues, setCountedValues] = useState<Record<string, number>>({});

  function load() {
    setLoading(true);
    api.get<StockCount[]>("/api/v1/inventory/counts")
      .then(setCounts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api.get<{ data: Warehouse[] }>("/api/v1/warehouses").then((res) => setWarehouses(res.data));
  }, []);

  async function openCount(count: StockCount) {
    const detail = await api.get<StockCount>(`/api/v1/inventory/counts/${count.id}`);
    setSelected(detail);
    const vals: Record<string, number> = {};
    detail.items?.forEach((i) => { vals[i.id] = Number(i.countedQty); });
    setCountedValues(vals);
  }

  async function createCount() {
    setSaving(true);
    try {
      await api.post("/api/v1/inventory/counts", { warehouseId });
      setShowCreate(false);
      setWarehouseId("");
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitItem(countId: string, productId: string, itemId: string, countedQty: number) {
    await api.post(`/api/v1/inventory/counts/${countId}/items`, { productId, countedQty });
    setCountedValues((prev) => ({ ...prev, [itemId]: countedQty }));
  }

  async function completeCount(countId: string) {
    setSaving(true);
    try {
      // Submit all items first
      if (selected?.items) {
        for (const item of selected.items) {
          await api.post(`/api/v1/inventory/counts/${countId}/items`, {
            productId: item.productId,
            countedQty: countedValues[item.id] ?? Number(item.countedQty),
          });
        }
      }
      await api.post(`/api/v1/inventory/counts/${countId}/complete`);
      setSelected(null);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const columns: CustomTableColumn<StockCount>[] = [
    { key: "no", header: "Count #", render: (r) => <span className="font-mono text-sm font-medium">{r.countNo}</span> },
    { key: "warehouse", header: "Warehouse", render: (r) => <span>{r.warehouse.code} — {r.warehouse.name}</span> },
    { key: "date", header: "Date", render: (r) => <span className="text-sm text-gray-600">{new Date(r.countDate).toLocaleDateString()}</span> },
    { key: "status", header: "Status", render: (r) => <CustomBadge tone={r.status === "COMPLETED" ? "green" : "amber"}>{r.status}</CustomBadge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <CustomButton size="sm" variant="outline" onClick={() => openCount(r)}>
          {r.status === "IN_PROGRESS" ? "Enter Counts" : "View"}
        </CustomButton>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Counts</h1>
          <p className="mt-1 text-sm text-gray-500">Physical count and reconciliation</p>
        </div>
        <CustomButton leftIcon={<Plus size={15} />} onClick={() => setShowCreate(true)}>New Count</CustomButton>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <CustomTable columns={columns} data={counts} rowKey={(r) => r.id} loading={loading} emptyIcon={ClipboardList} emptyMessage="No stock counts yet" />
      </div>

      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="Start Stock Count">
        <div className="space-y-4">
          <CustomSelect label="Warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} placeholder="Select warehouse" options={warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))} />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} disabled={!warehouseId} onClick={createCount}>Start Count</CustomButton>
          </div>
        </div>
      </CustomModal>

      {selected && (
        <CustomModal open={!!selected} onClose={() => setSelected(null)} title={`Count ${selected.countNo} — ${selected.warehouse.name}`}>
          <div className="space-y-3">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 sticky top-0">
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">System</th>
                    <th className="px-3 py-2 text-right">Counted</th>
                    <th className="px-3 py-2 text-right">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items?.map((item) => {
                    const counted = countedValues[item.id] ?? Number(item.countedQty);
                    const diff = counted - Number(item.systemQty);
                    return (
                      <tr key={item.id} className="border-t border-gray-50">
                        <td className="px-3 py-2">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-400">{item.product.sku}</p>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">{Number(item.systemQty)}</td>
                        <td className="px-3 py-2 text-right">
                          {selected.status === "IN_PROGRESS" ? (
                            <input
                              type="number"
                              min={0}
                              value={counted}
                              onChange={(e) => setCountedValues((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                              onBlur={() => submitItem(selected.id, item.productId, item.id, counted)}
                              className="w-20 rounded border border-gray-200 px-2 py-1 text-right text-sm focus:border-primary-400 focus:outline-none"
                            />
                          ) : (
                            <span>{counted}</span>
                          )}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium text-xs ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-gray-400"}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {selected.status === "IN_PROGRESS" && (
              <div className="flex justify-end pt-2">
                <CustomButton loading={saving} leftIcon={<CheckCircle size={14} />} onClick={() => completeCount(selected.id)}>
                  Complete & Apply Adjustments
                </CustomButton>
              </div>
            )}
          </div>
        </CustomModal>
      )}
    </div>
  );
}
