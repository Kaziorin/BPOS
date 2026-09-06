"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar, CalendarDays, Clock, Plus, RefreshCw, Search, Loader2, User, CheckCircle2,
  XCircle, UserCheck, UserX, Scissors, Wrench, Coffee, Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

type ViewMode = "list" | "day";

interface Appointment {
  id: string;
  appointmentNo: string;
  appointmentType: string;
  customerId: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  serviceId: string | null;
  serviceName: string | null;
  staffId: string | null;
  staffName: string | null;
  startAt: string;
  endAt: string;
  durationMin: number;
  price: number;
  status: string;
  notes: string | null;
}

interface StaffOption {
  id: string;
  name: string;
  designationName?: string | null;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
}

const currency = (v: number) => `৳${v.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;

const STATUS_BADGES: Record<string, string> = {
  BOOKED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CONFIRMED: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  CHECKED_IN: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  IN_SERVICE: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  COMPLETED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  NO_SHOW: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  CANCELLED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const TYPE_ICONS: Record<string, any> = {
  SALON: Scissors, REPAIR: Wrench, CONSULT: Sparkles, GENERAL: Coffee,
};

function TypeIcon({ type, size = 12 }: { type: string; size?: number }) {
  const Icon = TYPE_ICONS[type] ?? Coffee;
  return <Icon size={size} />;
}

const NEXT_ACTIONS: Record<string, string[]> = {
  BOOKED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
  CHECKED_IN: ["IN_SERVICE", "NO_SHOW"],
  IN_SERVICE: ["COMPLETED"],
};

function fmtDate(d: string) {
  return new Date(d.replace(" ", "T")).toLocaleString("en-BD", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AppointmentsPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availSlots, setAvailSlots] = useState<string[]>([]);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [form, setForm] = useState({
    appointmentType: "GENERAL", customerId: "", staffId: "", serviceName: "",
    startAt: "", durationMin: "30", price: "", notes: "",
  });

  const showMessage = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(null), 3000);
  };

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (typeFilter) p.set("appointmentType", typeFilter);
      if (statusFilter) p.set("status", statusFilter);
      const res = await api.get<{ data: Appointment[] }>(`/v1/appointments?${p}`);
      setAppointments(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  useEffect(() => {
    api.get<{ data: CustomerOption[] }>("/v1/customers?limit=200")
      .then((r) => setCustomers(r.data)).catch(() => setCustomers([]));
    api.get<{ data: StaffOption[] }>("/v1/salon/staff")
      .then((r) => setStaff(r.data)).catch(() => setStaff([]));
  }, []);

  const filtered = appointments.filter((a) =>
    !search || a.customerName?.toLowerCase().includes(search.toLowerCase())
      || a.appointmentNo.toLowerCase().includes(search.toLowerCase())
      || a.serviceName?.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({ appointmentType: "GENERAL", customerId: "", staffId: "", serviceName: "", startAt: iso, durationMin: "30", price: "", notes: "" });
    setAvailSlots([]);
    setShowCreate(true);
  }

  async function checkAvailability() {
    if (!form.startAt || !form.staffId) return;
    setCheckingSlots(true);
    try {
      const dateStr = form.startAt.slice(0, 10);
      const res = await api.get<{ data: { start: string; end: string }[] }>(
        `/v1/appointments/availability?date=${dateStr}&staffId=${form.staffId}&durationMin=${form.durationMin || 30}`,
      );
      setAvailSlots(res.data.map((s) => s.start.split(" ")[1].slice(0, 5)));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCheckingSlots(false);
    }
  }

  async function createBooking() {
    if (!form.customerId || !form.startAt) return;
    setSaving(true);
    try {
      await api.post("/v1/appointments", {
        appointmentType: form.appointmentType,
        customerId: form.customerId,
        staffId: form.staffId || undefined,
        staffName: staff.find((s) => s.id === form.staffId)?.name,
        serviceName: form.serviceName || undefined,
        startAt: form.startAt.replace("T", " ") + ":00",
        durationMin: Number(form.durationMin),
        price: Number(form.price) || 0,
        notes: form.notes || undefined,
      });
      setShowCreate(false);
      showMessage("Appointment booked");
      loadAppointments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(a: Appointment, status: string) {
    try {
      await api.patch(`/v1/appointments/${a.id}/status`, { status });
      showMessage(`${a.appointmentNo} → ${status}`);
      loadAppointments();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const dayGroups: Record<string, Appointment[]> = {};
  for (const a of filtered) {
    const d = (a.startAt || "").slice(0, 10);
    (dayGroups[d] = dayGroups[d] || []).push(a);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointment & Booking</h1>
        <p className="mt-1 text-sm text-gray-500">Generic booking engine — shared by Salon, Repair & Service businesses (§10.25)</p>
      </div>

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</div>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, booking no, service…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none" />
        </div>
        <CustomSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { label: "All types", value: "" }, { label: "General", value: "GENERAL" },
            { label: "Salon / Spa", value: "SALON" }, { label: "Repair", value: "REPAIR" },
            { label: "Consultation", value: "CONSULT" },
          ]} containerClassName="w-40" />
        <CustomSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: "All statuses", value: "" }, { label: "Booked", value: "BOOKED" },
            { label: "Confirmed", value: "CONFIRMED" }, { label: "In service", value: "IN_SERVICE" },
            { label: "Completed", value: "COMPLETED" }, { label: "Cancelled", value: "CANCELLED" },
          ]} containerClassName="w-40" />
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          {(["list", "day"] as ViewMode[]).map((m) => (
            <button key={m} onClick={() => setView(m)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium capitalize ${view === m ? "bg-white shadow-sm text-primary-700" : "text-gray-500"}`}>
              {m === "list" ? <CalendarDays size={13} /> : <Calendar size={13} />}{m}
            </button>
          ))}
        </div>
        <CustomButton variant="outline" leftIcon={<RefreshCw size={15} />} onClick={loadAppointments}>Refresh</CustomButton>
        <CustomButton leftIcon={<Plus size={15} />} onClick={openCreate}>New Booking</CustomButton>
      </div>

      {view === "list" ? (
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-300" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No appointments found — book one to get started</td></tr>
              ) : filtered.map((a) => {
                const actions = NEXT_ACTIONS[a.status] ?? [];
                return (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium">{a.appointmentNo}</span>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <TypeIcon type={a.appointmentType} size={10} /> {a.appointmentType}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.customerName || "Walk-in"}</p>
                      <p className="text-[10px] text-gray-400">{a.customerPhone || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{a.serviceName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{a.staffName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(a.startAt)}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{currency(Number(a.price))}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGES[a.status] ?? ""}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {actions.includes("CONFIRMED") && <button title="Confirm" onClick={() => setStatus(a, "CONFIRMED")} className="rounded p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"><CheckCircle2 size={14} /></button>}
                        {actions.includes("CHECKED_IN") && <button title="Check in" onClick={() => setStatus(a, "CHECKED_IN")} className="rounded p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600"><UserCheck size={14} /></button>}
                        {actions.includes("IN_SERVICE") && <button title="Start service" onClick={() => setStatus(a, "IN_SERVICE")} className="rounded p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-600"><Clock size={14} /></button>}
                        {actions.includes("COMPLETED") && <button title="Complete" onClick={() => setStatus(a, "COMPLETED")} className="rounded p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"><CheckCircle2 size={14} /></button>}
                        {actions.includes("NO_SHOW") && <button title="No show" onClick={() => setStatus(a, "NO_SHOW")} className="rounded p-1.5 text-gray-400 hover:bg-slate-50 hover:text-slate-600"><UserX size={14} /></button>}
                        {actions.includes("CANCELLED") && <button title="Cancel" onClick={() => setStatus(a, "CANCELLED")} className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"><XCircle size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(dayGroups).sort(([a], [b]) => a.localeCompare(b)).map(([d, list]) => (
            <div key={d} className="rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5">
                <Calendar size={14} className="text-primary-600" />
                <span className="text-sm font-semibold text-gray-700">{new Date(d + "T12:00").toLocaleDateString("en-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                <span className="ml-auto text-xs text-gray-400">{list.length} booking(s)</span>
              </div>
              <div className="divide-y divide-gray-50">
                {list.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-16 shrink-0 text-xs font-bold tabular-nums text-gray-600">{a.startAt.slice(11, 16)}</span>
                    <span className="shrink-0 text-gray-400"><TypeIcon type={a.appointmentType} size={14} /></span>
                    <span className="flex-1 truncate text-sm text-gray-700">{a.customerName || "Walk-in"} · {a.serviceName || a.appointmentType}</span>
                    <span className="text-xs text-gray-400">{a.staffName || "no staff"}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGES[a.status] ?? ""}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(dayGroups).length === 0 && !loading && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">No appointments in the current filters</div>
          )}
        </div>
      )}

      {/* New booking modal */}
      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="New Appointment Booking">
        <div className="space-y-4">
          <CustomSelect label="Appointment type" value={form.appointmentType}
            onChange={(e) => setForm({ ...form, appointmentType: e.target.value })}
            options={[
              { label: "General", value: "GENERAL" }, { label: "Salon / Spa", value: "SALON" },
              { label: "Repair", value: "REPAIR" }, { label: "Consultation", value: "CONSULT" },
            ]} />
          <CustomSelect label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            placeholder="Select customer" options={customers.map((c) => ({ label: `${c.name}${c.phone ? ` · ${c.phone}` : ""}`, value: c.id }))} />
          <CustomSelect label="Staff member" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}
            placeholder="Any available staff" options={staff.map((s) => ({ label: `${s.name}${s.designationName ? ` (${s.designationName})` : ""}`, value: s.id }))} />
          <CustomInput label="Service name" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} placeholder="e.g. Haircut, Screen replacement…" />
          <div className="grid grid-cols-3 gap-3">
            <CustomInput label="Start" type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
            <CustomInput label="Duration (min)" type="number" min={15} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} />
            <CustomInput label="Price (৳)" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          {form.staffId && form.startAt && (
            <div>
              <CustomButton size="sm" variant="outline" loading={checkingSlots} onClick={checkAvailability} leftIcon={<Clock size={13} />}>
                Check staff availability
              </CustomButton>
              {availSlots.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {availSlots.map((s) => (
                    <button key={s} onClick={() => setForm({ ...form, startAt: `${form.startAt.slice(0, 10)}T${s}` })}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums ${form.startAt.slice(11) === s ? "border-primary-400 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:border-primary-200"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {availSlots.length === 0 && !checkingSlots && (
                <p className="mt-1 text-xs text-amber-600">No free slots found for this staff on that date.</p>
              )}
            </div>
          )}
          <CustomInput label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={createBooking} disabled={!form.customerId || !form.startAt}>Book</CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}