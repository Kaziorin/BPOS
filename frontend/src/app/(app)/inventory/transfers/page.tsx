"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowRightLeft, CheckCircle, Truck, PackageCheck } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomBadge } from "@/components/custom/CustomBadge";

interface Warehouse { id: string; name: string; code: string; }
interface Transfer {
  id: string;
  transferNo: string;
  status: string;
  note: string | null;
  createdAt: string;
  fromWarehouse: { id: string; name: string; code: string };
  toWarehouse: { id: string; name: string; code: string };
  items: { id: string; qty: string; product: { name: string; sku: string } }[];
}

const STATUS_TONE: Record<string, any> = {
  DRAFT: "gray", REQUESTED: "amber", APPROVED: "primary", IN_TRANSIT: "amber", RECEIVED: "green",
};

const STATUS_STEPS = ["DRAFT", "REQUESTED", "APPROVED", "IN_TRANSIT", "RECEIVED"];

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [fromWh, setFromWh] = useState("");
  const [toWh, setToWh] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState([{ productId: "", qty: 1 }]);

  function load() {
    setLoading(true);
    api.get<{ data: Transfer[] }>("/api/v1/inventory/transfers")
      .then((res) => setTransfers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api.get<{ data: Warehouse[] }>("/api/v1/warehouses").then((res) => setWarehouses(res.data));
  }, []);

  async function createTransfer() {
    setSaving(true);
    try {
      await api.post("/api/v1/inventory/transfers", {
        fromWarehouseId: fromWh,
        toWarehouseId: toWh,
        note,
        items: items.filter((i) => i.productId).map((i) => ({ productId: i.productId, qty: i.qty })),
      });
      setShowCreate(false);
      setFromWh(""); setToWh(""); setNote(""); setItems([{ productId: "", qty: 1 }]);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function advance(transferId: string, action: "approve" | "ship" | "receive") {
    setSaving(true);
    try {
      await api.post(`/api/v1/inventory/transfers/${transferId}/${action}`);
      load();
      setSelected(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const columns: CustomTableColumn<Transfer>[] = [
    { key: "no", header: "Transfer #", render: (r) => <span className="font-mono text-sm font-medium">{r.transferNo}</span> },
    {
      key: "route",
      header: "Route",
      render: (r) => (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium">{r.fromWarehouse.code}</span>
          <ArrowRightLeft size={13} className="text-gray-400" />
          <span className="font-medium">{r.toWarehouse.code}</span>
        </div>
      ),
    },
    { key: "items", header: "Items", align: "right", render: (r) => <span className="text-gray-600">{r.items.length}</span> },
    { key: "status", header: "Status", render: (r) => <CustomBadge tone={STATUS_TONE[r.status]}>{r.status}</CustomBadge> },
    { key: "date", header: "Date", render: (r) => <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <CustomButton size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>
          View
        </CustomButton>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
          <p className="mt-1 text-sm text-gray-500">Request → Approve → Ship → Receive</p>
        </div>
        <CustomButton leftIcon={<Plus size={15} />} onClick={() => setShowCreate(true)}>New Transfer</CustomButton>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <CustomTable columns={columns} data={transfers} rowKey={(r) => r.id} loading={loading} emptyIcon={ArrowRightLeft} emptyMessage="No transfers yet" />
      </div>

      {/* Create Modal */}
      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="New Stock Transfer">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="From Warehouse" value={fromWh} onChange={(e) => setFromWh(e.target.value)} placeholder="Select…" options={warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))} />
            <CustomSelect label="To Warehouse" value={toWh} onChange={(e) => setToWh(e.target.value)} placeholder="Select…" options={warehouses.filter((w) => w.id !== fromWh).map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))} />
          </div>
          <CustomInput label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Items</p>
            {items.map((item, idx) => (
              <div key={idx} className="mb-2 flex gap-2">
                <CustomInput containerClassName="flex-1" placeholder="Product ID" value={item.productId} onChange={(e) => { const n = [...items]; n[idx].productId = e.target.value; setItems(n); }} />
                <CustomInput containerClassName="w-24" type="number" min={1} value={item.qty} onChange={(e) => { const n = [...items]; n[idx].qty = Number(e.target.value); setItems(n); }} />
                {items.length > 1 && (
                  <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setItems([...items, { productId: "", qty: 1 }])} className="text-xs text-primary-600 hover:underline">+ Add item</button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={createTransfer}>Create Transfer</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Detail / Action Modal */}
      {selected && (
        <CustomModal open={!!selected} onClose={() => setSelected(null)} title={`Transfer ${selected.transferNo}`}>
          <div className="space-y-4">
            {/* Status stepper */}
            <div className="flex items-center gap-1">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${selected.status === s ? "bg-primary-500 text-white" : STATUS_STEPS.indexOf(selected.status) > i ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>{s}</div>
                  {i < STATUS_STEPS.length - 1 && <div className="h-px w-3 bg-gray-200" />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">From:</span> <span className="font-medium">{selected.fromWarehouse.name}</span></div>
              <div><span className="text-gray-400">To:</span> <span className="font-medium">{selected.toWarehouse.name}</span></div>
            </div>

            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-xs text-gray-400"><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-right">Qty</th></tr></thead>
                <tbody>
                  {selected.items.map((item) => (
                    <tr key={item.id} className="border-t border-gray-50">
                      <td className="px-3 py-2">{item.product.name} <span className="text-gray-400 text-xs">({item.product.sku})</span></td>
                      <td className="px-3 py-2 text-right font-medium">{Number(item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              {(selected.status === "DRAFT" || selected.status === "REQUESTED") && (
                <CustomButton loading={saving} leftIcon={<CheckCircle size={14} />} onClick={() => advance(selected.id, "approve")}>Approve</CustomButton>
              )}
              {selected.status === "APPROVED" && (
                <CustomButton loading={saving} leftIcon={<Truck size={14} />} onClick={() => advance(selected.id, "ship")}>Mark Shipped</CustomButton>
              )}
              {selected.status === "IN_TRANSIT" && (
                <CustomButton loading={saving} leftIcon={<PackageCheck size={14} />} onClick={() => advance(selected.id, "receive")}>Mark Received</CustomButton>
              )}
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
}
