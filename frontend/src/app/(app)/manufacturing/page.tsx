"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Factory, Layers, Plus, RefreshCw, Loader2, Play, CheckCircle2, XCircle, Eye,
  FlaskConical, ArrowDownToLine, ArrowUpFromLine, Calculator,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

type Tab = "orders" | "bom" | "costing";

interface ProductionOrder {
  id: string;
  productionNo: string;
  finishedProductId: string;
  finishedProductName: string;
  branchId: string | null;
  warehouseId: string | null;
  branchName?: string | null;
  warehouseName?: string | null;
  qtyPlanned: number;
  qtyProduced: number;
  qtyWastage: number;
  yieldPct: number;
  batchNo: string | null;
  status: string;
  productionDate: string | null;
  dueDate: string | null;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  unitCost: number;
  note: string | null;
  items?: any[];
}

interface FinishedGood {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  ingredientCount: number;
  bomCost: number;
}

interface Material {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
}

interface BomRow {
  id: string;
  recipeProductId: string;
  finishedProductName: string;
  ingredientProductId: string;
  ingredientProductName: string;
  qtyRequired: number;
  unit: string;
  unitCost: number;
  currentIngredientCost: number | null;
}

const currency = (v: number) => `৳${v.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;

const STATUS_BADGES: Record<string, string> = {
  DRAFT: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  IN_PROGRESS: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  COMPLETED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

export default function ManufacturingPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [message, setMessage] = useState<string | null>(null);

  // Orders
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState("");
  const [showOrder, setShowOrder] = useState(false);
  const [orderDetail, setOrderDetail] = useState<ProductionOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [orderForm, setOrderForm] = useState<any>({
    finishedProductId: "", qtyPlanned: "", yieldPct: "100", batchNo: "",
    productionDate: new Date().toISOString().slice(0, 10), dueDate: "", laborCost: "0", overheadCost: "0", note: "",
  });
  const [orderBom, setOrderBom] = useState<any[]>([]);

  // BOM
  const [bomRows, setBomRows] = useState<BomRow[]>([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [showBom, setShowBom] = useState(false);
  const [bomForm, setBomForm] = useState<{ finishedProductId: string; ingredients: any[] }>({ finishedProductId: "", ingredients: [] });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [bomMat, setBomMat] = useState(""); const [bomQty, setBomQty] = useState("1"); const [bomUnit, setBomUnit] = useState("unit"); const [bomCost, setBomCost] = useState("");

  // Costing
  const [costingResult, setCostingResult] = useState<any>(null);
  const [costingForm, setCostingForm] = useState({ finishedProductId: "", qty: "1" });

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3000); };

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const p = orderFilter ? `?status=${orderFilter}` : "";
      const res = await api.get<{ data: ProductionOrder[] }>(`/v1/manufacturing/orders${p}`);
      setOrders(res.data);
    } catch (err: any) { console.error(err); } finally { setOrdersLoading(false); }
  }, [orderFilter]);

  const loadFinishedGoods = useCallback(async () => {
    const res = await api.get<{ data: FinishedGood[] }>("/v1/manufacturing/finished-goods").catch(() => ({ data: [] }));
    setFinishedGoods(res.data);
  }, []);

  const loadBom = useCallback(async () => {
    setBomLoading(true);
    try {
      const res = await api.get<{ data: BomRow[] }>("/v1/manufacturing/bom");
      setBomRows(res.data);
    } catch (err: any) { console.error(err); } finally { setBomLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "orders") loadOrders();
    if (tab === "bom") { loadBom(); loadFinishedGoods(); }
    if (tab === "costing") loadFinishedGoods();
    loadFinishedGoods();
  }, [tab, loadOrders, loadBom, loadFinishedGoods]);

  useEffect(() => { if (tab === "orders") loadOrders(); }, [tab, loadOrders, orderFilter]);

  async function openNewOrder() {
    await loadFinishedGoods();
    const g = finishedGoods[0];
    setOrderForm({ finishedProductId: g?.id ?? "", qtyPlanned: "", yieldPct: "100", batchNo: "", productionDate: new Date().toISOString().slice(0, 10), dueDate: "", laborCost: "0", overheadCost: "0", note: "" });
    if (g) {
      const bom = await api.get<{ data: Material[] }>("/v1/manufacturing/bom").catch(() => ({ data: [] }));
      setOrderBom(bom.data.filter((r: any) => r.recipeProductId === g.id));
    } else setOrderBom([]);
    setShowOrder(true);
  }

  async function pickOrderProduct(id: string) {
    const bom = await api.get<{ data: BomRow[] }>("/v1/manufacturing/bom").catch(() => ({ data: [] }));
    setOrderBom(bom.data.filter((r) => r.recipeProductId === id));
  }

  async function createOrder() {
    if (!orderForm.finishedProductId || !Number(orderForm.qtyPlanned)) return;
    setSaving(true);
    try {
      await api.post("/v1/manufacturing/orders", {
        finishedProductId: orderForm.finishedProductId,
        qtyPlanned: Number(orderForm.qtyPlanned),
        yieldPct: Number(orderForm.yieldPct) || 100,
        batchNo: orderForm.batchNo || undefined,
        productionDate: orderForm.productionDate,
        dueDate: orderForm.dueDate || undefined,
        laborCost: Number(orderForm.laborCost) || 0,
        overheadCost: Number(orderForm.overheadCost) || 0,
        note: orderForm.note || undefined,
      });
      setShowOrder(false);
      showMessage("Production order created (DRAFT)");
      loadOrders();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function startOrder(o: ProductionOrder) {
    if (!confirm(`Start production ${o.productionNo}?`)) return;
    try { await api.post(`/v1/manufacturing/orders/${o.id}/start`, {}); showMessage("Order started"); loadOrders(); }
    catch (err: any) { alert(err.message); }
  }

  async function completeOrder(o: ProductionOrder) {
    if (!confirm(`Complete ${o.productionNo}? Raw materials will be consumed and finished goods produced.`)) return;
    setSaving(true);
    try {
      const res = await api.post<{ qtyProduced: number; qtyWastage: number; totalCost: number }>(`/v1/manufacturing/orders/${o.id}/complete`, {});
      showMessage(`Completed — produced ${res.qtyProduced}, cost ${currency(res.totalCost)}`);
      loadOrders();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function cancelOrder(o: ProductionOrder) {
    if (!confirm(`Cancel ${o.productionNo}?`)) return;
    try { await api.post(`/v1/manufacturing/orders/${o.id}/cancel`, {}); showMessage("Order cancelled"); loadOrders(); }
    catch (err: any) { alert(err.message); }
  }

  async function openDetail(o: ProductionOrder) {
    const res = await api.get<{ data: ProductionOrder }>(`/v1/manufacturing/orders/${o.id}`);
    setOrderDetail(res.data);
  }

  // BOM
  async function openBomModal() {
    await loadFinishedGoods();
    const mats = await api.get<{ data: Material[] }>("/v1/manufacturing/materials").catch(() => ({ data: [] }));
    setMaterials(mats.data);
    setBomForm({ finishedProductId: "", ingredients: [] });
    setBomMat(""); setBomQty("1"); setBomUnit("unit"); setBomCost("");
    setShowBom(true);
  }

  function addBomIngredient() {
    if (!bomMat) return;
    const m = materials.find((x) => x.id === bomMat);
    setBomForm((f) => ({ ...f, ingredients: [...f.ingredients, { ingredientProductId: bomMat, name: m?.name ?? "", qtyRequired: Number(bomQty), unit: bomUnit, unitCost: Number(bomCost) || Number(m?.costPrice) || 0 }] }));
    setBomMat(""); setBomQty("1"); setBomUnit("unit"); setBomCost("");
  }

  async function saveBom() {
    if (!bomForm.finishedProductId || bomForm.ingredients.length === 0) return;
    setSaving(true);
    try {
      await api.post("/v1/manufacturing/bom", {
        finishedProductId: bomForm.finishedProductId,
        ingredients: bomForm.ingredients.map(({ ingredientProductId, qtyRequired, unit, unitCost }) => ({ ingredientProductId, qtyRequired, unit, unitCost })),
      });
      setShowBom(false);
      showMessage("BOM saved");
      loadBom(); loadFinishedGoods();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function runCosting() {
    if (!costingForm.finishedProductId) return;
    try {
      const res = await api.get<any>(`/v1/manufacturing/costing/${costingForm.finishedProductId}?qty=${costingForm.qty || 1}`);
      setCostingResult(res);
    } catch (err: any) { alert(err.message); }
  }

  // Group BOM rows by finished product
  const bomByProduct: Record<string, BomRow[]> = {};
  for (const r of bomRows) { (bomByProduct[r.recipeProductId] = bomByProduct[r.recipeProductId] || []).push(r); }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manufacturing / Bakery</h1>
        <p className="mt-1 text-sm text-gray-500">BOM → Production Order → Consumption → Finished Stock (§11.6)</p>
      </div>

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</div>}

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {([["orders", "Production Orders", Factory], ["bom", "BOM / Recipes", Layers], ["costing", "Production Costing", Calculator]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <CustomSelect value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}
              options={[
                { label: "All statuses", value: "" }, { label: "Draft", value: "DRAFT" },
                { label: "In progress", value: "IN_PROGRESS" }, { label: "Completed", value: "COMPLETED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]} containerClassName="w-44" />
            <CustomButton variant="outline" leftIcon={<RefreshCw size={15} />} onClick={loadOrders}>Refresh</CustomButton>
            <div className="ml-auto"><CustomButton leftIcon={<Plus size={15} />} onClick={openNewOrder}>New Production Order</CustomButton></div>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order</th><th className="px-4 py-3">Finished good</th>
                  <th className="px-4 py-3">Planned</th><th className="px-4 py-3">Produced</th>
                  <th className="px-4 py-3">Yield</th><th className="px-4 py-3">Total cost</th>
                  <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ordersLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-300" /></td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No production orders yet — create one from a finished good with a BOM</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{o.productionNo}<div className="text-[10px] text-gray-400">{o.productionDate}</div></td>
                    <td className="px-4 py-3 font-medium text-gray-800">{o.finishedProductName}<div className="text-[10px] text-gray-400">{o.batchNo || "no batch"}</div></td>
                    <td className="px-4 py-3 tabular-nums">{o.qtyPlanned}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-emerald-600">{o.qtyProduced || "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-500">{o.yieldPct}%</td>
                    <td className="px-4 py-3 tabular-nums">{o.totalCost > 0 ? currency(o.totalCost) : "—"}</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGES[o.status] ?? ""}`}>{o.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button title="Detail" onClick={() => openDetail(o)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Eye size={14} /></button>
                        {o.status === "DRAFT" && <button title="Start" onClick={() => startOrder(o)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Play size={14} /></button>}
                        {o.status === "IN_PROGRESS" && <button title="Complete" onClick={() => completeOrder(o)} className="rounded p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"><CheckCircle2 size={14} /></button>}
                        {(o.status === "DRAFT" || o.status === "IN_PROGRESS") && <button title="Cancel" onClick={() => cancelOrder(o)} className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"><XCircle size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "bom" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">A BOM defines the raw materials needed to make one unit of a finished good — reuse of the recipe model.</p>
            <CustomButton leftIcon={<Plus size={15} />} onClick={openBomModal}>Define BOM</CustomButton>
          </div>
          {bomLoading ? (
            <div className="py-12 text-center"><Loader2 size={22} className="mx-auto animate-spin text-gray-300" /></div>
          ) : bomRows.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
              No BOMs yet — define one to enable production orders for a finished good
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(bomByProduct).map(([pid, rows]) => (
                <div key={pid} className="rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5">
                    <FlaskConical size={14} className="text-primary-600" />
                    <span className="text-sm font-semibold text-gray-700">{rows[0].finishedProductName}</span>
                    <span className="ml-auto text-xs text-gray-400">{rows.length} ingredient(s)</span>
                  </div>
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-2 font-medium text-gray-700">{r.ingredientProductName}</td>
                          <td className="px-4 py-2 text-xs text-gray-400">{r.ingredientProductId.slice(0, 8)}</td>
                          <td className="px-4 py-2 tabular-nums text-gray-500">{r.qtyRequired} {r.unit}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{currency(Number(r.unitCost) || Number(r.currentIngredientCost) || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "costing" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">Production costing — materials × quantity + labor + overhead</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <CustomSelect label="Finished good" value={costingForm.finishedProductId} onChange={(e) => setCostingForm({ ...costingForm, finishedProductId: e.target.value })}
                placeholder="Select product" options={finishedGoods.map((g) => ({ label: g.name, value: g.id }))} />
              <CustomInput label="Batch qty" type="number" min={1} value={costingForm.qty} onChange={(e) => setCostingForm({ ...costingForm, qty: e.target.value })} />
              <div className="flex items-end"><CustomButton onClick={runCosting} disabled={!costingForm.finishedProductId}>Calculate</CustomButton></div>
            </div>
          </div>
          {costingResult && (
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">{costingResult.productName}</p>
                <p className="text-xs text-gray-400">Selling price: <span className="font-semibold text-gray-600">{currency(costingResult.sellingPrice)}</span></p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <CostCard label="Materials (× {qty})" value={currency(costingResult.totalCost)} color="text-amber-600" />
                <CostCard label="Unit cost" value={currency(costingResult.unitCost)} color="text-gray-900" />
                <CostCard label="Gross margin / unit" value={currency(costingResult.grossMargin)} color="text-emerald-600" />
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr><th className="px-3 py-2">Ingredient</th><th className="px-3 py-2">Per unit</th><th className="px-3 py-2">Cost</th><th className="px-3 py-2 text-right">Line total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {costingResult.ingredients.map((i: any) => (
                      <tr key={i.productId}>
                        <td className="px-3 py-2 font-medium">{i.name}</td>
                        <td className="px-3 py-2 tabular-nums">{i.qtyPerUnit}</td>
                        <td className="px-3 py-2 tabular-nums">{currency(i.unitCost)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{currency(i.lineCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New order modal */}
      <CustomModal open={showOrder} onClose={() => setShowOrder(false)} title="New Production Order">
        <div className="space-y-4">
          <CustomSelect label="Finished good" value={orderForm.finishedProductId}
            onChange={(e) => { setOrderForm({ ...orderForm, finishedProductId: e.target.value }); pickOrderProduct(e.target.value); }}
            placeholder="Select finished good (must have a BOM)" options={finishedGoods.map((g) => ({ label: `${g.name} — ${g.ingredientCount} ingredients`, value: g.id }))} />
          {orderBom.length > 0 && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1 text-xs font-semibold text-gray-500">Will consume per unit:</p>
              {orderBom.map((r: any) => (
                <p key={r.id} className="text-xs text-gray-600">{r.ingredientProductName} × {r.qtyRequired} {r.unit}</p>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Qty planned" type="number" min={1} value={orderForm.qtyPlanned} onChange={(e) => setOrderForm({ ...orderForm, qtyPlanned: e.target.value })} />
            <CustomInput label="Yield (%)" type="number" min={1} max={100} value={orderForm.yieldPct} onChange={(e) => setOrderForm({ ...orderForm, yieldPct: e.target.value })} />
            <CustomInput label="Batch no" value={orderForm.batchNo} onChange={(e) => setOrderForm({ ...orderForm, batchNo: e.target.value })} />
            <CustomInput label="Production date" type="date" value={orderForm.productionDate} onChange={(e) => setOrderForm({ ...orderForm, productionDate: e.target.value })} />
            <CustomInput label="Due date" type="date" value={orderForm.dueDate} onChange={(e) => setOrderForm({ ...orderForm, dueDate: e.target.value })} />
            <CustomInput label="Labor cost (৳)" type="number" min={0} value={orderForm.laborCost} onChange={(e) => setOrderForm({ ...orderForm, laborCost: e.target.value })} />
          </div>
          <CustomInput label="Overhead cost (৳)" type="number" min={0} value={orderForm.overheadCost} onChange={(e) => setOrderForm({ ...orderForm, overheadCost: e.target.value })} />
          <CustomInput label="Note" value={orderForm.note} onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })} />
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            Completion consumes each BOM ingredient from stock (PRODUCTION_OUT) and books the finished quantity in (PRODUCTION_IN) with yield applied — all in one atomic transaction.
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowOrder(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={createOrder} disabled={!orderForm.finishedProductId || !Number(orderForm.qtyPlanned)}>Create Order</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Define BOM modal */}
      <CustomModal open={showBom} onClose={() => setShowBom(false)} title="Define BOM">
        <div className="space-y-4">
          <CustomSelect label="Finished good" value={bomForm.finishedProductId} onChange={(e) => setBomForm({ ...bomForm, finishedProductId: e.target.value })}
            placeholder="Select product that will be produced" options={finishedGoods.length > 0 ? finishedGoods.map((g) => ({ label: g.name, value: g.id })) : []} />
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Raw materials (per unit)</p>
            {bomForm.ingredients.map((ing, i) => (
              <div key={i} className="mb-1.5 flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <span className="flex-1 text-gray-700">{ing.name}</span>
                <span className="tabular-nums text-gray-500">{ing.qtyRequired} {ing.unit}</span>
                <span className="tabular-nums text-gray-500">{currency(ing.unitCost)}</span>
                <button onClick={() => setBomForm({ ...bomForm, ingredients: bomForm.ingredients.filter((_, x) => x !== i) })} className="text-gray-300 hover:text-rose-500">✕</button>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_70px_90px_90px_auto] items-center gap-2">
              <CustomSelect value={bomMat} onChange={(e) => { setBomMat(e.target.value); const m = materials.find((x) => x.id === e.target.value); if (m) setBomCost(String(m.costPrice || "")); }}
                placeholder="Raw material" options={materials.map((m) => ({ label: `${m.name} (${m.sku})`, value: m.id }))} />
              <CustomInput type="number" min={0.01} value={bomQty} onChange={(e) => setBomQty(e.target.value)} placeholder="Qty" />
              <CustomInput value={bomUnit} onChange={(e) => setBomUnit(e.target.value)} placeholder="unit" />
              <CustomInput type="number" min={0} value={bomCost} onChange={(e) => setBomCost(e.target.value)} placeholder="Cost" />
              <CustomButton size="sm" variant="secondary" onClick={addBomIngredient} disabled={!bomMat}>Add</CustomButton>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowBom(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={saveBom} disabled={!bomForm.finishedProductId || bomForm.ingredients.length === 0}>Save BOM</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Order detail modal */}
      <CustomModal open={!!orderDetail} onClose={() => setOrderDetail(null)} title={`Order ${orderDetail?.productionNo ?? ""}`}>
        {orderDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Finished good</p><p className="font-medium">{orderDetail.finishedProductName}</p></div>
              <div><p className="text-xs text-gray-400">Status</p><p className="font-medium">{orderDetail.status}</p></div>
              <div><p className="text-xs text-gray-400">Planned / produced</p><p className="font-medium tabular-nums">{orderDetail.qtyPlanned} / {orderDetail.qtyProduced || "—"}</p></div>
              <div><p className="text-xs text-gray-400">Yield</p><p className="font-medium">{orderDetail.yieldPct}%</p></div>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr><th className="px-3 py-2">Ingredient</th><th className="px-3 py-2">Required</th><th className="px-3 py-2">Consumed</th><th className="px-3 py-2 text-right">Cost</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(orderDetail.items ?? []).map((it: any) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2 font-medium">{it.productName}</td>
                      <td className="px-3 py-2 tabular-nums">{it.qtyRequired}</td>
                      <td className="px-3 py-2 tabular-nums text-emerald-600">{it.qtyConsumed || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{currency(it.lineCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500"><span>Material cost</span><span className="tabular-nums">{currency(orderDetail.materialCost)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Labor cost</span><span className="tabular-nums">{currency(orderDetail.laborCost)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Overhead</span><span className="tabular-nums">{currency(orderDetail.overheadCost)}</span></div>
              <div className="flex justify-between font-bold text-gray-900"><span>Total cost</span><span className="tabular-nums">{currency(orderDetail.totalCost)}</span></div>
              <div className="flex justify-between text-emerald-600"><span>Unit cost</span><span className="tabular-nums">{currency(orderDetail.unitCost)}</span></div>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}

function CostCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}