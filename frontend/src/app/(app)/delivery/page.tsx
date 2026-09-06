"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bike, Package, MapPin, Users, Plus, RefreshCw, Loader2, Truck,
  PhoneCall, CheckCircle2, XCircle, Clock, RotateCcw, Wallet, Box, FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

type Tab = "orders" | "riders" | "vehicles" | "zones";

interface DeliveryOrder {
  id: string;
  deliveryNo: string;
  sourceType: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  zoneId: string | null;
  zoneName?: string | null;
  riderId: string | null;
  riderName?: string | null;
  vehicleName?: string | null;
  status: string;
  paymentType: string;
  codAmount: number;
  deliveryFee: number;
  totalAmount: number;
  priority: string;
  scheduledAt: string | null;
  createdAt: string;
  deliveredAt: string | null;
  failedAt: string | null;
  rescheduleCount: number;
  failureReason: string | null;
  podReceivedByName: string | null;
}

interface Rider {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  vehicleId: string | null;
  vehicleName?: string | null;
  status: string;
  rating: number;
  deliveryCount: number;
  activeDeliveries?: number;
  isActive: number;
}

interface Vehicle { id: string; name: string; type: string; plateNo: string | null; isActive: number; }
interface Zone { id: string; name: string; city: string | null; area: string | null; deliveryFee: number; minOrderAmount: number; freeDeliveryAbove: number; isActive: number; }
interface CustomerOption { id: string; name: string; phone: string | null; address: string | null; }
interface SaleOption { id: string; invoiceNo: string; total: number; paidTotal: number; customerId: string | null; }

const currency = (v: number) => `৳${(Number(v) || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING: { label: "Pending", badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", dot: "bg-slate-400" },
  PACKED: { label: "Packed", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
  ASSIGNED: { label: "Rider Assigned", badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", dot: "bg-indigo-400" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", badge: "bg-sky-500/20 text-sky-300 border-sky-500/30", dot: "bg-sky-400" },
  DELIVERED: { label: "Delivered", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  FAILED: { label: "Failed", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30", dot: "bg-rose-400" },
  RESCHEDULED: { label: "Rescheduled", badge: "bg-orange-500/20 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
  RETURNED: { label: "Returned", badge: "bg-red-500/20 text-red-300 border-red-500/30", dot: "bg-red-500" },
  CANCELLED: { label: "Cancelled", badge: "bg-gray-500/20 text-gray-400 border-gray-500/30", dot: "bg-gray-500" },
};

const FLOW_STEPS = ["PENDING", "PACKED", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function DeliveryPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dashboard counts
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dashExtra, setDashExtra] = useState<{ todayDeliveredValue: number; availableRiders: number; pendingCodValue: number }>({ todayDeliveredValue: 0, availableRiders: 0, pendingCodValue: 0 });

  // Orders
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [sales, setSales] = useState<SaleOption[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [createForm, setCreateForm] = useState<any>({
    saleId: "", customerId: "", customerName: "", customerPhone: "", deliveryAddress: "",
    zoneId: "", paymentType: "PREPAID", deliveryFee: "", priority: "NORMAL", notes: "", codAmount: "",
  });
  const [selected, setSelected] = useState<DeliveryOrder | null>(null);
  const [assignModal, setAssignModal] = useState<DeliveryOrder | null>(null);
  const [assignRider, setAssignRider] = useState("");
  const [deliverModal, setDeliverModal] = useState<DeliveryOrder | null>(null);
  const [podName, setPodName] = useState("");
  const [podSignature, setPodSignature] = useState("");
  const [failModal, setFailModal] = useState<DeliveryOrder | null>(null);
  const [failReason, setFailReason] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Riders / vehicles / zones CRUD
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showRider, setShowRider] = useState(false);
  const [riderForm, setRiderForm] = useState<any>({ name: "", phone: "", email: "", employeeId: "", vehicleId: "", zoneIds: "" });
  const [showVehicle, setShowVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<any>({ name: "", type: "BIKE", plateNo: "" });
  const [showZone, setShowZone] = useState(false);
  const [zoneForm, setZoneForm] = useState<any>({ name: "", city: "", area: "", deliveryFee: "", minOrderAmount: "", freeDeliveryAbove: "" });

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  // ── Shared lookups ──
  const loadLookups = useCallback(async () => {
    try {
      const [z, r, v] = await Promise.all([
        api.get<{ data: Zone[] }>("/v1/delivery/zones"),
        api.get<{ data: Rider[] }>("/v1/delivery/riders"),
        api.get<{ data: Vehicle[] }>("/v1/delivery/vehicles"),
      ]);
      setZones(z.data); setRiders(r.data); setVehicles(v.data);
    } catch (err: any) { console.error(err); }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get<{ data: any }>("/v1/delivery/dashboard");
      setCounts(res.data.counts ?? {});
      setDashExtra({ todayDeliveredValue: res.data.todayDeliveredValue ?? 0, availableRiders: res.data.availableRiders ?? 0, pendingCodValue: res.data.pendingCodValue ?? 0 });
    } catch (err: any) { console.error(err); }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get<{ data: DeliveryOrder[] }>(`/v1/delivery/orders?limit=100${statusFilter ? `&status=${statusFilter}` : ""}`);
      setOrders(res.data);
    } catch (err: any) { console.error(err); } finally { setOrdersLoading(false); }
  }, [statusFilter]);

  useEffect(() => { loadLookups(); loadDashboard(); }, [loadLookups, loadDashboard]);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function loadCustomers() {
    try {
      const res = await api.get<{ data: CustomerOption[] }>("/v1/customers?limit=100");
      setCustomers(res.data);
    } catch (err: any) { console.error(err); }
  }
  async function loadSales() {
    try {
      const res = await api.get<{ data: SaleOption[] }>("/v1/sales?limit=50");
      setSales(res.data);
    } catch (err: any) { console.error(err); }
  }

  function openCreate() {
    loadCustomers(); loadSales(); loadLookups();
    setCreateForm({ saleId: "", customerId: "", customerName: "", customerPhone: "", deliveryAddress: "", zoneId: "", paymentType: "PREPAID", deliveryFee: "", priority: "NORMAL", notes: "", codAmount: "" });
    setShowCreate(true);
  }

  // When a sale is picked: pull customer + set payment type by due amount
  function pickSale(saleId: string) {
    const sale = sales.find((s) => s.id === saleId);
    setCreateForm((f: any) => {
      const next = { ...f, saleId };
      if (sale) {
        if (sale.customerId) next.customerId = sale.customerId;
        const due = Number(sale.total) - Number(sale.paidTotal);
        if (due > 0.01) next.paymentType = "COD";
        const cust = customers.find((c) => c.id === sale.customerId);
        if (cust) { next.customerName = cust.name; next.customerPhone = cust.phone || ""; next.deliveryAddress = cust.address || ""; }
      }
      return next;
    });
  }

  function pickCustomer(customerId: string) {
    const cust = customers.find((c) => c.id === customerId);
    setCreateForm((f: any) => ({ ...f, customerId, customerName: cust?.name || "", customerPhone: cust?.phone || "", deliveryAddress: cust?.address || "" }));
  }

  const createFormZone = zones.find((z) => z.id === createForm.zoneId);
  const pickedSale = sales.find((s) => s.id === createForm.saleId);
  const dueAmount = pickedSale ? Math.max(Number(pickedSale.total) - Number(pickedSale.paidTotal), 0) : 0;
  const feeShown = createForm.deliveryFee !== "" ? Number(createForm.deliveryFee) : (createFormZone ? Number(createFormZone.freeDeliveryAbove) > 0 && Number(createFormZone.freeDeliveryAbove) <= (pickedSale ? Number(pickedSale.total) : 0) ? 0 : Number(createFormZone.deliveryFee) : 0);
  const codShown = createForm.paymentType === "COD"
    ? (createForm.codAmount !== "" ? Number(createForm.codAmount) : dueAmount + feeShown)
    : 0;

  async function createOrder() {
    const address = createForm.deliveryAddress;
    if (!address) { alert("Delivery address is required"); return; }
    setSaving(true);
    try {
      const body: any = {
        saleId: createForm.saleId || undefined,
        sourceType: createForm.saleId ? "SALE" : "RESTAURANT",
        customerId: createForm.customerId || undefined,
        customerName: createForm.customerName, customerPhone: createForm.customerPhone,
        deliveryAddress: address, zoneId: createForm.zoneId || undefined,
        paymentType: createForm.paymentType,
        priority: createForm.priority, notes: createForm.notes,
      };
      if (createForm.deliveryFee !== "") body.deliveryFee = Number(createForm.deliveryFee);
      if (createForm.paymentType === "COD") body.codAmount = codShown;
      await api.post("/v1/delivery/orders", body);
      setShowCreate(false);
      showMessage("Delivery order created");
      loadOrders(); loadDashboard();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  // ── Lifecycle actions ──
  async function transition(o: DeliveryOrder, status: string, extra: any = {}) {
    setSaving(true);
    try {
      await api.post(`/v1/delivery/orders/${o.id}/status`, { status, ...extra });
      showMessage(`Delivery ${STATUS_META[status]?.label ?? status}`);
      setAssignModal(null); setDeliverModal(null); setFailModal(null);
      loadOrders(); loadDashboard();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function openAssign(o: DeliveryOrder) {
    await loadLookups();
    setAssignRider("");
    setAssignModal(o);
  }

  async function doAssign(o: DeliveryOrder) {
    await transition(o, "ASSIGNED", { riderId: assignRider || undefined });
  }

  async function openDeliver(o: DeliveryOrder) {
    setPodName(o.customerName || ""); setPodSignature("");
    setDeliverModal(o);
  }

  async function doDeliver(o: DeliveryOrder) {
    const extra: any = { podType: podSignature ? "SIGNATURE" : "NONE", receivedByName: podName };
    if (podSignature) extra.podSignature = podSignature;
    await transition(o, "DELIVERED", extra);
  }

  // ── Riders / Vehicles / Zones CRUD ──
  async function createRider() {
    if (!riderForm.name) return;
    setSaving(true);
    try {
      await api.post("/v1/delivery/riders", { ...riderForm, zoneIds: riderForm.zoneIds || undefined, employeeId: riderForm.employeeId || undefined, vehicleId: riderForm.vehicleId || undefined });
      setShowRider(false); setRiderForm({ name: "", phone: "", email: "", employeeId: "", vehicleId: "", zoneIds: "" });
      showMessage("Rider added"); loadLookups();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }
  async function toggleRider(r: Rider) {
    try { await api.patch(`/v1/delivery/riders/${r.id}`, { isActive: r.isActive ? 0 : 1 }); loadLookups(); } catch (err: any) { alert(err.message); }
  }
  async function setRiderStatus(r: Rider, status: string) {
    try { await api.patch(`/v1/delivery/riders/${r.id}`, { status }); loadLookups(); } catch (err: any) { alert(err.message); }
  }

  async function createVehicle() {
    if (!vehicleForm.name) return;
    setSaving(true);
    try {
      await api.post("/v1/delivery/vehicles", { name: vehicleForm.name, type: vehicleForm.type, plateNo: vehicleForm.plateNo || undefined });
      setShowVehicle(false); setVehicleForm({ name: "", type: "BIKE", plateNo: "" });
      showMessage("Vehicle added"); loadLookups();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }
  async function toggleVehicle(v: Vehicle) {
    try { await api.patch(`/v1/delivery/vehicles/${v.id}`, { isActive: v.isActive ? 0 : 1 }); loadLookups(); } catch (err: any) { alert(err.message); }
  }

  async function createZone() {
    if (!zoneForm.name) return;
    setSaving(true);
    try {
      await api.post("/v1/delivery/zones", {
        name: zoneForm.name, city: zoneForm.city || undefined, area: zoneForm.area || undefined,
        deliveryFee: Number(zoneForm.deliveryFee) || 0, minOrderAmount: Number(zoneForm.minOrderAmount) || 0,
        freeDeliveryAbove: Number(zoneForm.freeDeliveryAbove) || 0,
      });
      setShowZone(false); setZoneForm({ name: "", city: "", area: "", deliveryFee: "", minOrderAmount: "", freeDeliveryAbove: "" });
      showMessage("Zone added"); loadLookups();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }
  async function toggleZone(z: Zone) {
    try { await api.patch(`/v1/delivery/zones/${z.id}`, { isActive: z.isActive ? 0 : 1 }); loadLookups(); } catch (err: any) { alert(err.message); }
  }

  async function openDetail(o: DeliveryOrder) {
    try {
      const res = await api.get<{ data: any }>(`/v1/delivery/orders/${o.id}`);
      setDetail(res.data); setDetailOpen(true);
    } catch (err: any) { alert(err.message); }
  }

  const steps = FLOW_STEPS.map((s) => ({ status: s, ...STATUS_META[s] }));

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Bike size={22} className="text-primary-600" /> Delivery & Logistics
          </h1>
          <p className="mt-1 text-sm text-gray-500">Dispatch, track and settle deliveries across every sales channel</p>
        </div>
        <CustomButton onClick={openCreate}><Plus size={15} /> New Delivery</CustomButton>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {([["PENDING", "Pending"], ["PACKED", "Packed"], ["ASSIGNED", "Assigned"], ["OUT_FOR_DELIVERY", "On Route"], ["DELIVERED", "Delivered"]] as const).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{counts[key] ?? 0}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Wallet size={13} /> Today's delivered value</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{currency(dashExtra.todayDeliveredValue)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Users size={13} /> Available riders</p>
          <p className="mt-1 text-lg font-bold text-indigo-600">{dashExtra.availableRiders}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Wallet size={13} /> COD to collect (open)</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{currency(dashExtra.pendingCodValue)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-100 pb-2">
        {([
          ["orders", "Orders", Package],
          ["riders", "Riders", Users],
          ["vehicles", "Vehicles", Truck],
          ["zones", "Zones & Fees", MapPin],
        ] as [Tab, string, any][]).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${tab === id ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════ ORDERS TAB ══════════ */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setStatusFilter("")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!statusFilter ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
            {Object.entries(STATUS_META).map(([k, m]) => (
              <button key={k} onClick={() => setStatusFilter(k === statusFilter ? "" : k)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${statusFilter === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {m.label}
              </button>
            ))}
            <button onClick={() => { loadOrders(); loadDashboard(); }} className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-400" /></div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Package size={28} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">No delivery orders{statusFilter ? ` in ${STATUS_META[statusFilter]?.label}` : ""}</p>
              <p className="mt-1 text-xs text-gray-400">Create a delivery to dispatch a sale or restaurant order</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3">Customer / Address</th>
                    <th className="px-4 py-3">Rider</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Fee / Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const meta = STATUS_META[o.status] ?? STATUS_META.PENDING;
                    return (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{o.deliveryNo}</p>
                          <p className="text-[11px] text-gray-400">{o.sourceType} · {o.priority}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{o.customerName || "—"}</p>
                          <p className="text-xs text-gray-400">{o.customerPhone || ""}</p>
                          <p className="max-w-[220px] truncate text-[11px] text-gray-500">{o.deliveryAddress}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-700">{o.riderName || "Unassigned"}</p>
                          {o.vehicleName && <p className="text-[11px] text-gray-400">{o.vehicleName}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${o.paymentType === "COD" ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {o.paymentType === "COD" ? "COD" : "Prepaid"}
                          </span>
                          {o.paymentType === "COD" && <p className="mt-0.5 text-[11px] text-gray-500">collect {currency(o.codAmount)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-500">Fee {currency(o.deliveryFee)}</p>
                          <p className="text-sm font-bold text-gray-900">{currency(o.totalAmount)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                          </span>
                          {o.rescheduleCount > 0 && <p className="mt-0.5 text-[10px] text-orange-500">attempt {o.rescheduleCount + 1}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => openDetail(o)} title="View" className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"><FileText size={14} /></button>
                            {o.status === "PENDING" && (
                              <button onClick={() => transition(o, "PACKED")} className="rounded-lg border border-amber-200 p-1.5 text-amber-600 hover:bg-amber-50"><Box size={14} /></button>
                            )}
                            {(o.status === "PENDING" || o.status === "PACKED" || o.status === "RESCHEDULED") && (
                              <button onClick={() => openAssign(o)} className="rounded-lg border border-indigo-200 p-1.5 text-indigo-600 hover:bg-indigo-50"><Users size={14} /></button>
                            )}
                            {(o.status === "ASSIGNED") && (
                              <button onClick={() => transition(o, "OUT_FOR_DELIVERY")} className="rounded-lg border border-sky-200 p-1.5 text-sky-600 hover:bg-sky-50"><Truck size={14} /></button>
                            )}
                            {(o.status === "OUT_FOR_DELIVERY") && (
                              <button onClick={() => openDeliver(o)} className="rounded-lg border border-emerald-200 p-1.5 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={14} /></button>
                            )}
                            {(o.status === "ASSIGNED" || o.status === "OUT_FOR_DELIVERY") && (
                              <button onClick={() => { setFailReason(""); setFailModal(o); }} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"><XCircle size={14} /></button>
                            )}
                            {(o.status === "FAILED") && (
                              <>
                                <button onClick={() => transition(o, "RESCHEDULED", { reason: "Retry" })} className="rounded-lg border border-orange-200 p-1.5 text-orange-600 hover:bg-orange-50"><RotateCcw size={14} /></button>
                                <button onClick={() => transition(o, "RETURNED", { reason: "Undeliverable" })} className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><Package size={14} /></button>
                              </>
                            )}
                            {o.status === "PENDING" && (
                              <button onClick={() => transition(o, "CANCELLED")} className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"><XCircle size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════ RIDERS TAB ══════════ */}
      {tab === "riders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{riders.filter((r) => r.status === "AVAILABLE").length} of {riders.length} riders available</p>
            <CustomButton onClick={() => { loadLookups(); setShowRider(true); }}><Plus size={15} /> Add Rider</CustomButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {riders.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600"><Users size={19} /></div>
                    <div>
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.phone || "—"} · {r.deliveryCount} deliveries</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-600" : r.status === "BUSY" ? "bg-amber-500/10 text-amber-600" : "bg-gray-500/10 text-gray-500"}`}>{r.status}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                  {r.vehicleName ? <span className="flex items-center gap-1"><Truck size={12} /> {r.vehicleName}</span> : <span>No vehicle</span>}
                  {r.activeDeliveries ? <span className="flex items-center gap-1"><Package size={12} /> {r.activeDeliveries} active</span> : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {r.status === "AVAILABLE" ? (
                    <button onClick={() => setRiderStatus(r, "OFFLINE")} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">Go offline</button>
                  ) : r.status === "OFFLINE" ? (
                    <button onClick={() => setRiderStatus(r, "AVAILABLE")} className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50">Go online</button>
                  ) : (
                    <button onClick={() => setRiderStatus(r, "AVAILABLE")} className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50">Free up</button>
                  )}
                  <button onClick={() => toggleRider(r)} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">{r.isActive ? "Deactivate" : "Activate"}</button>
                </div>
              </div>
            ))}
            {riders.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center sm:col-span-3">
                <Users size={26} className="mx-auto text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No riders yet — add your delivery team</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ VEHICLES TAB ══════════ */}
      {tab === "vehicles" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <CustomButton onClick={() => setShowVehicle(true)}><Plus size={15} /> Add Vehicle</CustomButton>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Plate No</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{v.type}</span></td>
                    <td className="px-4 py-3 text-gray-500">{v.plateNo || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"}`}>{v.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleVehicle(v)} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">{v.isActive ? "Deactivate" : "Activate"}</button>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No vehicles yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ ZONES TAB ══════════ */}
      {tab === "zones" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <CustomButton onClick={() => setShowZone(true)}><Plus size={15} /> Add Zone</CustomButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((z) => (
              <div key={z.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{z.name}</p>
                    <p className="text-xs text-gray-400">{[z.city, z.area].filter(Boolean).join(", ") || "—"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${z.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"}`}>{z.isActive ? "Active" : "Inactive"}</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <p className="flex justify-between"><span>Delivery fee</span><span className="font-semibold text-gray-900">{currency(z.deliveryFee)}</span></p>
                  <p className="flex justify-between"><span>Min order</span><span>{currency(z.minOrderAmount)}</span></p>
                  <p className="flex justify-between"><span>Free delivery above</span><span>{z.freeDeliveryAbove > 0 ? currency(z.freeDeliveryAbove) : "—"}</span></p>
                </div>
                <div className="mt-4">
                  <button onClick={() => toggleZone(z)} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">{z.isActive ? "Deactivate" : "Activate"}</button>
                </div>
              </div>
            ))}
            {zones.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center sm:col-span-3">
                <MapPin size={26} className="mx-auto text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No delivery zones — zone fees drive auto fee calculation</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ CREATE DELIVERY MODAL ══════════ */}
      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="New Delivery Order">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Link to sale (optional)</label>
              <CustomSelect value={createForm.saleId} onChange={(e) => pickSale(e.target.value)} options={[{ value: "", label: "— Standalone (restaurant/online) —" }, ...sales.map((s) => ({ value: s.id, label: `${s.invoiceNo} · ${currency(s.total)}${Number(s.total) - Number(s.paidTotal) > 0.01 ? " (due)" : ""}` }))]} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Customer</label>
              <CustomSelect value={createForm.customerId} onChange={(e) => pickCustomer(e.target.value)} options={[{ value: "", label: "— Select customer —" }, ...customers.map((c) => ({ value: c.id, label: c.name }))]} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomInput label="Customer name" value={createForm.customerName} onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })} placeholder="Recipient name" />
            <CustomInput label="Customer phone" value={createForm.customerPhone} onChange={(e) => setCreateForm({ ...createForm, customerPhone: e.target.value })} placeholder="01XXXXXXXXX" />
          </div>
          <CustomInput label="Delivery address *" value={createForm.deliveryAddress} onChange={(e) => setCreateForm({ ...createForm, deliveryAddress: e.target.value })} placeholder="House, Road, Area, City" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Zone</label>
              <CustomSelect value={createForm.zoneId} onChange={(e) => setCreateForm({ ...createForm, zoneId: e.target.value })} options={[{ value: "", label: "— No zone —" }, ...zones.map((z) => ({ value: z.id, label: `${z.name} (fee ${currency(z.deliveryFee)})` }))]} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Payment type</label>
              <CustomSelect value={createForm.paymentType} onChange={(e) => setCreateForm({ ...createForm, paymentType: e.target.value })} options={[{ value: "PREPAID", label: "Prepaid" }, { value: "COD", label: "Cash on Delivery" }]} />
            </div>
            <CustomSelect label="Priority" value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })} options={[{ value: "LOW", label: "Low" }, { value: "NORMAL", label: "Normal" }, { value: "HIGH", label: "High" }]} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <CustomInput label="Delivery fee (auto from zone)" type="number" value={String(feeShown)} onChange={(e) => setCreateForm({ ...createForm, deliveryFee: e.target.value })} />
            {createForm.paymentType === "COD" && (
              <CustomInput label="COD amount (auto = due + fee)" type="number" value={String(codShown)} onChange={(e) => setCreateForm({ ...createForm, codAmount: e.target.value })} />
            )}
            <CustomInput label="Notes" value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} placeholder="Optional" />
          </div>
          {pickedSale && (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Sale {pickedSale.invoiceNo}: total {currency(pickedSale.total)} · paid {currency(pickedSale.paidTotal)} · due {currency(dueAmount)} · COD collect {currency(codShown)}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton onClick={createOrder} disabled={saving}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create Delivery</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════ ASSIGN RIDER MODAL ══════════ */}
      <CustomModal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Rider — ${assignModal?.deliveryNo ?? ""}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Auto-assign picks the least-loaded available rider (round-robin). Pick one manually to override.</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Rider</label>
            <CustomSelect value={assignRider} onChange={(e) => setAssignRider(e.target.value)} options={[{ value: "", label: "— Auto-assign (round-robin) —" }, ...riders.filter((r) => r.status === "AVAILABLE" && r.isActive).map((r) => ({ value: r.id, label: `${r.name} (${r.deliveryCount} done)` }))]} />
          </div>
          {riders.filter((r) => r.status === "AVAILABLE").length === 0 && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">No available riders — add one in the Riders tab or free one up first.</p>
          )}
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setAssignModal(null)}>Cancel</CustomButton>
            <CustomButton onClick={() => assignModal && doAssign(assignModal)} disabled={saving}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />} Assign</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════ DELIVER MODAL (POD + COD) ══════════ */}
      <CustomModal open={!!deliverModal} onClose={() => setDeliverModal(null)} title={`Mark Delivered — ${deliverModal?.deliveryNo ?? ""}`}>
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            {deliverModal?.paymentType === "COD" ? (
              <>COD delivery — collecting <b>{currency(deliverModal?.codAmount ?? 0)}</b> will record a COD payment, mark the sale/invoice paid and settle the customer's balance.</>
            ) : (
              <>Prepaid delivery — marking delivered completes the shipment.</>
            )}
          </div>
          <CustomInput label="Received by (name)" value={podName} onChange={(e) => setPodName(e.target.value)} placeholder="Customer / recipient name" />
          <CustomInput label="Digital signature (POD)" value={podSignature} onChange={(e) => setPodSignature(e.target.value)} placeholder="Type or paste signature text / base64 image" />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setDeliverModal(null)}>Cancel</CustomButton>
            <CustomButton onClick={() => deliverModal && doDeliver(deliverModal)} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} {deliverModal?.paymentType === "COD" ? "Deliver & Collect COD" : "Confirm Delivery"}
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════ FAIL MODAL ══════════ */}
      <CustomModal open={!!failModal} onClose={() => setFailModal(null)} title={`Delivery Failed — ${failModal?.deliveryNo ?? ""}`}>
        <div className="space-y-4">
          <CustomInput label="Failure reason *" value={failReason} onChange={(e) => setFailReason(e.target.value)} placeholder="Customer not home, wrong address, etc." />
          <p className="text-xs text-gray-400">After failing you can reschedule for another attempt or return the goods to the store.</p>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setFailModal(null)}>Cancel</CustomButton>
            <CustomButton onClick={() => failModal && transition(failModal, "FAILED", { reason: failReason })} disabled={saving || !failReason}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Mark Failed
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════ DETAIL MODAL ══════════ */}
      <CustomModal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Delivery ${detail?.deliveryNo ?? ""}`}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {detail.items?.length > 0 && (
                <span className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-600">{detail.items.length} item(s) from sale</span>
              )}
              <span className={`rounded-full px-2.5 py-1 font-medium ${STATUS_META[detail.status]?.badge ?? ""}`}>{STATUS_META[detail.status]?.label ?? detail.status}</span>
              <span className="rounded-md bg-amber-500/10 px-2 py-1 font-medium text-amber-600">{detail.paymentType === "COD" ? `COD ${currency(detail.codAmount)}` : "Prepaid"}</span>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              <p><b>Customer:</b> {detail.customerName || "—"} {detail.customerPhone ? `(${detail.customerPhone})` : ""}</p>
              <p><b>Address:</b> {detail.deliveryAddress || "—"}</p>
              <p><b>Zone:</b> {detail.zoneName || "—"} · <b>Rider:</b> {detail.riderName || "—"} · <b>Vehicle:</b> {detail.vehicleName || "—"}</p>
              <p><b>Fee:</b> {currency(detail.deliveryFee)} · <b>Total to collect:</b> {currency(detail.totalAmount)}</p>
              {detail.deliveredAt && <p><b>Delivered:</b> {detail.deliveredAt} {detail.podReceivedByName ? `by ${detail.podReceivedByName}` : ""}</p>}
              {detail.failureReason && <p className="text-rose-600"><b>Failure:</b> {detail.failureReason} {detail.failedAt ? `at ${detail.failedAt}` : ""}</p>}
              {detail.returnReason && <p className="text-red-600"><b>Return:</b> {detail.returnReason}</p>}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Tracking history</p>
              <ol className="space-y-2">
                {(detail.tracking ?? []).map((t: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_META[t.status]?.dot ?? "bg-gray-300"}`} />
                    <div>
                      <p className="font-medium text-gray-700">{STATUS_META[t.status]?.label ?? t.status}</p>
                      {t.note && <p className="text-gray-400">{t.note}</p>}
                      <p className="text-[10px] text-gray-300">{t.createdAt}</p>
                    </div>
                  </li>
                ))}
                {(detail.tracking ?? []).length === 0 && <p className="text-xs text-gray-400">No events yet</p>}
              </ol>
            </div>
            <div className="flex justify-end">
              <CustomButton variant="outline" onClick={() => setDetailOpen(false)}>Close</CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════ RIDER MODAL ══════════ */}
      <CustomModal open={showRider} onClose={() => setShowRider(false)} title="Add Rider">
        <div className="space-y-3">
          <CustomInput label="Full name *" value={riderForm.name} onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })} placeholder="Rider name" />
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomInput label="Phone" value={riderForm.phone} onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })} placeholder="01XXXXXXXXX" />
            <CustomInput label="Email" value={riderForm.email} onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })} placeholder="optional" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Default vehicle</label>
              <CustomSelect value={riderForm.vehicleId} onChange={(e) => setRiderForm({ ...riderForm, vehicleId: e.target.value })} options={[{ value: "", label: "— None —" }, ...vehicles.filter((x) => x.isActive).map((v) => ({ value: v.id, label: v.name }))]} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Zones (comma-separated ids)</label>
              <CustomInput value={riderForm.zoneIds} onChange={(e) => setRiderForm({ ...riderForm, zoneIds: e.target.value })} placeholder="optional" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" onClick={() => setShowRider(false)}>Cancel</CustomButton>
            <CustomButton onClick={createRider} disabled={saving}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add Rider</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════ VEHICLE MODAL ══════════ */}
      <CustomModal open={showVehicle} onClose={() => setShowVehicle(false)} title="Add Vehicle">
        <div className="space-y-3">
          <CustomInput label="Vehicle name *" value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} placeholder="e.g. Bajaj Pulsar 150" />
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect label="Type" value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} options={["BIKE", "SCOOTER", "CAR", "VAN", "TRUCK", "CYCLE"].map((t) => ({ value: t, label: t }))} />
            <CustomInput label="Plate no" value={vehicleForm.plateNo} onChange={(e) => setVehicleForm({ ...vehicleForm, plateNo: e.target.value })} placeholder="Dhaka Metro-Ga 12-3456" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" onClick={() => setShowVehicle(false)}>Cancel</CustomButton>
            <CustomButton onClick={createVehicle} disabled={saving}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add Vehicle</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════ ZONE MODAL ══════════ */}
      <CustomModal open={showZone} onClose={() => setShowZone(false)} title="Add Delivery Zone">
        <div className="space-y-3">
          <CustomInput label="Zone name *" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="e.g. Dhanmondi" />
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomInput label="City" value={zoneForm.city} onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })} placeholder="Dhaka" />
            <CustomInput label="Area" value={zoneForm.area} onChange={(e) => setZoneForm({ ...zoneForm, area: e.target.value })} placeholder="Dhanmondi, Mirpur…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <CustomInput label="Delivery fee (৳)" type="number" value={zoneForm.deliveryFee} onChange={(e) => setZoneForm({ ...zoneForm, deliveryFee: e.target.value })} placeholder="60" />
            <CustomInput label="Min order (৳)" type="number" value={zoneForm.minOrderAmount} onChange={(e) => setZoneForm({ ...zoneForm, minOrderAmount: e.target.value })} placeholder="0" />
            <CustomInput label="Free above (৳)" type="number" value={zoneForm.freeDeliveryAbove} onChange={(e) => setZoneForm({ ...zoneForm, freeDeliveryAbove: e.target.value })} placeholder="e.g. 1000" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" onClick={() => setShowZone(false)}>Cancel</CustomButton>
            <CustomButton onClick={createZone} disabled={saving}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add Zone</CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
