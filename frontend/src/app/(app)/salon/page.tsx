"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Scissors, Package, CalendarDays, Users, Plus, RefreshCw, Loader2, Sparkles,
  Trash2, CheckCircle2, CreditCard, Clock, BadgePercent,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

type Tab = "services" | "packages" | "bookings" | "staff";

interface SalonService {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  costPrice: number;
  durationMin: number;
  commissionType: string;
  commissionValue: number;
  isActive: number;
}

interface SalonPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  regularPrice: number;
  regularTotal: number;
  isActive: number;
  items: { serviceId: string; serviceName: string; qty: number; price: number }[];
}

interface Appointment {
  id: string;
  appointmentNo: string;
  customerId: string | null;
  customerName?: string | null;
  serviceId: string | null;
  serviceName: string | null;
  staffId: string | null;
  staffName: string | null;
  startAt: string;
  price: number;
  status: string;
}

interface SalonStaff {
  id: string;
  name: string;
  designationName?: string | null;
  departmentName?: string | null;
}

interface CustomerOption { id: string; name: string; phone: string | null; }

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

const CATEGORIES = ["HAIR", "SKIN", "NAIL", "SPA", "MAKEUP", "MASSAGE", "OTHER"];

export default function SalonPage() {
  const [tab, setTab] = useState<Tab>("services");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Services
  const [services, setServices] = useState<SalonService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showService, setShowService] = useState(false);
  const [serviceForm, setServiceForm] = useState<any>({
    name: "", category: "HAIR", description: "", price: "", costPrice: "0",
    durationMin: "30", commissionType: "NONE", commissionValue: "0",
  });

  // Packages
  const [packages, setPackages] = useState<SalonPackage[]>([]);
  const [pkgLoading, setPkgLoading] = useState(false);
  const [showPackage, setShowPackage] = useState(false);
  const [pkgForm, setPkgForm] = useState<{ name: string; description: string; price: string; serviceIds: string[] }>({ name: "", description: "", price: "", serviceIds: [] });
  const [pkgService, setPkgService] = useState("");

  // Bookings
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [staff, setStaff] = useState<SalonStaff[]>([]);
  const [bookForm, setBookForm] = useState<any>({
    customerId: "", staffId: "", serviceId: "", startAt: "",
  });
  const [checkout, setCheckout] = useState<Appointment | null>(null);
  const [payMethod, setPayMethod] = useState("CASH");

  // Staff
  const [staffLoading, setStaffLoading] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [schedule, setSchedule] = useState<Appointment[]>([]);

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  // ── Services ──
  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const res = await api.get<{ data: SalonService[] }>("/v1/salon/services");
      setServices(res.data);
    } catch (err: any) { console.error(err); } finally { setServicesLoading(false); }
  }, []);
  useEffect(() => { loadServices(); }, [loadServices]);

  async function createService() {
    if (!serviceForm.name || !Number(serviceForm.price)) return;
    setSaving(true);
    try {
      await api.post("/v1/salon/services", {
        ...serviceForm, price: Number(serviceForm.price), costPrice: Number(serviceForm.costPrice) || 0,
        durationMin: Number(serviceForm.durationMin) || 30, commissionValue: Number(serviceForm.commissionValue) || 0,
      });
      setShowService(false);
      setServiceForm({ name: "", category: "HAIR", description: "", price: "", costPrice: "0", durationMin: "30", commissionType: "NONE", commissionValue: "0" });
      showMessage("Service added");
      loadServices();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function toggleService(s: SalonService) {
    try {
      await api.patch(`/v1/salon/services/${s.id}`, { isActive: s.isActive ? 0 : 1 });
      loadServices();
    } catch (err: any) { alert(err.message); }
  }

  async function deleteService(s: SalonService) {
    if (!confirm(`Delete service "${s.name}"?`)) return;
    try { await api.del(`/v1/salon/services/${s.id}`); showMessage("Service deleted"); loadServices(); }
    catch (err: any) { alert(err.message); }
  }

  // ── Packages ──
  const loadPackages = useCallback(async () => {
    setPkgLoading(true);
    try { const res = await api.get<{ data: SalonPackage[] }>("/v1/salon/packages"); setPackages(res.data); }
    catch (err: any) { console.error(err); } finally { setPkgLoading(false); }
  }, []);
  useEffect(() => {
    if (tab === "packages") { loadPackages(); loadServices(); }
  }, [tab, loadPackages, loadServices]);

  function openPackageModal() {
    loadServices();
    setPkgForm({ name: "", description: "", price: "", serviceIds: [] });
    setPkgService("");
    setShowPackage(true);
  }

  function addPkgService() {
    if (!pkgService || pkgForm.serviceIds.includes(pkgService)) return;
    setPkgForm({ ...pkgForm, serviceIds: [...pkgForm.serviceIds, pkgService] });
    setPkgService("");
  }

  const pkgSelection = services.filter((s) => pkgForm.serviceIds.includes(s.id));
  const pkgRegular = pkgSelection.reduce((s, x) => s + Number(x.price), 0);

  async function createPackage() {
    if (!pkgForm.name || pkgForm.serviceIds.length === 0) return;
    setSaving(true);
    try {
      await api.post("/v1/salon/packages", {
        name: pkgForm.name, description: pkgForm.description || undefined,
        price: Number(pkgForm.price) || undefined, serviceIds: pkgForm.serviceIds,
      });
      setShowPackage(false);
      showMessage("Package created");
      loadPackages();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function deletePackage(p: SalonPackage) {
    if (!confirm(`Delete package "${p.name}"?`)) return;
    try { await api.del(`/v1/salon/packages/${p.id}`); loadPackages(); } catch (err: any) { alert(err.message); }
  }

  // ── Bookings ──
  const loadBookings = useCallback(async () => {
    setApptLoading(true);
    try {
      const res = await api.get<{ data: Appointment[] }>("/v1/appointments?appointmentType=SALON");
      setAppointments(res.data);
    } catch (err: any) { console.error(err); } finally { setApptLoading(false); }
  }, []);

  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    try { const res = await api.get<{ data: SalonStaff[] }>("/v1/salon/staff"); setStaff(res.data); }
    catch (err: any) { console.error(err); } finally { setStaffLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "bookings") {
      loadBookings(); loadStaff();
      api.get<{ data: CustomerOption[] }>("/v1/customers?limit=200").then((r) => setCustomers(r.data)).catch(() => setCustomers([]));
    }
    if (tab === "staff") { loadStaff(); }
  }, [tab, loadBookings, loadStaff]);

  function openBookModal() {
    loadServices(); loadStaff();
    const now = new Date(Date.now() + 3600 * 1000);
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setBookForm({ customerId: "", staffId: "", serviceId: "", startAt: iso });
    setShowBook(true);
  }

  const selectedService = services.find((s) => s.id === bookForm.serviceId);
  const selectedStaff = staff.find((s) => s.id === bookForm.staffId);

  async function createBooking() {
    if (!bookForm.customerId || !bookForm.startAt || !bookForm.serviceId) return;
    setSaving(true);
    try {
      await api.post("/v1/salon/bookings", {
        customerId: bookForm.customerId,
        staffId: bookForm.staffId || undefined,
        staffName: selectedStaff?.name,
        serviceId: bookForm.serviceId,
        serviceName: selectedService?.name,
        startAt: bookForm.startAt.replace("T", " ") + ":00",
        durationMin: selectedService?.durationMin ?? 30,
        price: selectedService?.price ?? 0,
      });
      setShowBook(false);
      showMessage("Salon booking created");
      loadBookings();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function completeBooking() {
    if (!checkout) return;
    setSaving(true);
    try {
      const res = await api.post<{ sale: any; commission: any }>(`/v1/salon/bookings/${checkout.id}/complete`, { paymentMethod: payMethod });
      showMessage(
        `Service completed — invoice ${res.sale?.invoiceNo ?? ""}, total ${currency(res.sale?.total ?? 0)}` +
        (res.commission ? `, commission ${currency(res.commission.amount)}` : ""),
      );
      setCheckout(null);
      loadBookings();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  function openCheckout(a: Appointment) {
    setCheckout(a);
    setPayMethod("CASH");
  }

  async function setApptStatus(a: Appointment, status: string) {
    try { await api.patch(`/v1/appointments/${a.id}/status`, { status }); loadBookings(); }
    catch (err: any) { alert(err.message); }
  }

  // ── Staff schedule ──
  async function loadSchedule() {
    try {
      const res = await api.get<{ data: Appointment[] }>(`/v1/appointments?appointmentType=SALON&dateFrom=${scheduleDate}&dateTo=${scheduleDate}&status=`);
      setSchedule(res.data);
    } catch (err: any) { console.error(err); }
  }
  useEffect(() => {
    if (tab === "staff") loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, scheduleDate]);

  const bookingsToday = appointments.filter((a) => a.status !== "CANCELLED");
  const active = appointments.filter((a) => ["BOOKED", "CONFIRMED", "CHECKED_IN", "IN_SERVICE"].includes(a.status));
  const revenueToday = appointments.filter((a) => a.status === "COMPLETED").reduce((s, a) => s + Number(a.price), 0);

  const selectedServiceForBook = services.find((s) => s.id === bookForm.serviceId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Salon & Spa</h1>
        <p className="mt-1 text-sm text-gray-500">Services, packages, bookings & staff commission (§11.7)</p>
      </div>

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</div>}

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {([["services", "Services", Scissors], ["packages", "Packages", Package], ["bookings", "Bookings", CalendarDays], ["staff", "Staff Schedule", Users]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === "services" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{services.length} services</p>
            <CustomButton leftIcon={<Plus size={15} />} onClick={() => setShowService(true)}>Add Service</CustomButton>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Service</th><th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Duration</th><th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Commission</th><th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {servicesLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-300" /></td></tr>
                ) : services.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No services yet — add haircuts, facials, spa treatments…</td></tr>
                ) : services.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">{s.category}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.durationMin} min</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{currency(Number(s.price))}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {s.commissionType === "NONE" ? "—" : s.commissionType === "PERCENTAGE" ? `${s.commissionValue}%` : currency(Number(s.commissionValue))}
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${s.isActive ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-500/20 text-slate-300"}`}>{s.isActive ? "ACTIVE" : "INACTIVE"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => toggleService(s)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title={s.isActive ? "Deactivate" : "Activate"}><Sparkles size={14} /></button>
                        <button onClick={() => deleteService(s)} className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "packages" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Package deals bundle services at a discount</p>
            <CustomButton leftIcon={<Plus size={15} />} onClick={openPackageModal}>New Package</CustomButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pkgLoading ? (
              <div className="col-span-full py-12 text-center"><Loader2 size={22} className="mx-auto animate-spin text-gray-300" /></div>
            ) : packages.length === 0 ? (
              <div className="col-span-full rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">No packages yet</div>
            ) : packages.map((p) => {
              const saving = p.regularTotal > 0 ? Math.round(((p.regularTotal - Number(p.price)) / p.regularTotal) * 100) : 0;
              return (
                <div key={p.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      {p.description && <p className="mt-0.5 text-xs text-gray-400">{p.description}</p>}
                    </div>
                    <button onClick={() => deletePackage(p)} className="text-gray-300 hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {p.items.map((it) => (
                      <p key={it.serviceId} className="text-xs text-gray-500">• {it.serviceName}</p>
                    ))}
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Regular: <span className="line-through tabular-nums">{currency(p.regularTotal)}</span></p>
                      <p className="text-lg font-bold text-primary-600 tabular-nums">{currency(Number(p.price))}</p>
                    </div>
                    {saving > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">Save {saving}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Upcoming today" value={String(bookingsToday.length)} icon={<CalendarDays size={16} />} color="bg-blue-50 text-blue-600" />
            <Stat label="In service" value={String(active.length)} icon={<Scissors size={16} />} color="bg-purple-50 text-purple-600" />
            <Stat label="Completed revenue" value={currency(revenueToday)} icon={<CreditCard size={16} />} color="bg-emerald-50 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Complete a service to bill the customer (sale + invoice + staff commission)</p>
            <CustomButton leftIcon={<Plus size={15} />} onClick={openBookModal}>Book Appointment</CustomButton>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Booking</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Stylist</th><th className="px-4 py-3">When</th><th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {apptLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-300" /></td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No salon bookings yet</td></tr>
                ) : appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{a.appointmentNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.customerName || "Walk-in"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{a.serviceName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{a.staffName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(a.startAt.replace(" ", "T")).toLocaleString("en-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{currency(Number(a.price))}</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGES[a.status] ?? ""}`}>{a.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {["CHECKED_IN", "IN_SERVICE", "CONFIRMED"].includes(a.status) && (
                          <button onClick={() => openCheckout(a)} className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">Complete & Bill</button>
                        )}
                        {a.status === "BOOKED" && <button onClick={() => setApptStatus(a, "CONFIRMED")} className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">Confirm</button>}
                        {["BOOKED", "CONFIRMED"].includes(a.status) && <button onClick={() => setApptStatus(a, "CANCELLED")} className="rounded p-1 text-gray-400 hover:text-rose-500" title="Cancel">✕</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CustomInput type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} containerClassName="w-44" />
              <CustomButton variant="outline" leftIcon={<RefreshCw size={15} />} onClick={loadSchedule}>Refresh</CustomButton>
            </div>
            <CustomButton variant="outline" leftIcon={<Users size={15} />} onClick={() => (window.location.href = "/hrm")}>Manage staff (HRM)</CustomButton>
          </div>
          {staffLoading ? (
            <div className="py-12 text-center"><Loader2 size={22} className="mx-auto animate-spin text-gray-300" /></div>
          ) : staff.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">No staff found — add employees under HRM first</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((s) => {
                const dayAppts = schedule.filter((a) => a.staffId === s.id);
                const busyMins = dayAppts.reduce((sum, a) => sum + (a.status === "CANCELLED" ? 0 : 30), 0);
                return (
                  <div key={s.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">{s.name[0]}</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.designationName || s.departmentName || "Staff"}</p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-gray-50 pt-2">
                      {dayAppts.length === 0 ? (
                        <p className="text-xs text-gray-400">No appointments on {scheduleDate}</p>
                      ) : (
                        <div className="space-y-1">
                          {dayAppts.map((a) => (
                            <p key={a.id} className="flex justify-between text-xs">
                              <span className="text-gray-600 tabular-nums">{a.startAt.slice(11, 16)} · {a.customerName || "Walk-in"}</span>
                              <span className={`rounded-full px-1.5 py-px text-[10px] ${STATUS_BADGES[a.status] ?? ""}`}>{a.status}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add service modal */}
      <CustomModal open={showService} onClose={() => setShowService(false)} title="Add Salon Service">
        <div className="space-y-4">
          <CustomInput label="Service name" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} placeholder="e.g. Haircut, Facial…" />
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Category" value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))} />
            <CustomInput label="Duration (min)" type="number" min={5} value={serviceForm.durationMin} onChange={(e) => setServiceForm({ ...serviceForm, durationMin: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Price (৳)" type="number" min={1} value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} />
            <CustomInput label="Cost price (৳)" type="number" min={0} value={serviceForm.costPrice} onChange={(e) => setServiceForm({ ...serviceForm, costPrice: e.target.value })} />
          </div>
          <CustomInput label="Description" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Staff commission" value={serviceForm.commissionType} onChange={(e) => setServiceForm({ ...serviceForm, commissionType: e.target.value })}
              options={[{ label: "None", value: "NONE" }, { label: "Percentage (%)", value: "PERCENTAGE" }, { label: "Fixed (৳)", value: "FIXED" }]} />
            <CustomInput label="Commission value" type="number" min={0} value={serviceForm.commissionValue} onChange={(e) => setServiceForm({ ...serviceForm, commissionValue: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowService(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={createService} disabled={!serviceForm.name || !Number(serviceForm.price)}>Add Service</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* New package modal */}
      <CustomModal open={showPackage} onClose={() => setShowPackage(false)} title="New Package">
        <div className="space-y-4">
          <CustomInput label="Package name" value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} placeholder="e.g. Bridal Package" />
          <CustomInput label="Description" value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} />
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Services in package</p>
            <div className="mb-2 flex gap-2">
              <CustomSelect value={pkgService} onChange={(e) => setPkgService(e.target.value)} placeholder="Add a service"
                options={services.filter((s) => s.isActive && !pkgForm.serviceIds.includes(s.id)).map((s) => ({ label: `${s.name} — ${currency(Number(s.price))}`, value: s.id }))} />
              <CustomButton size="sm" variant="secondary" onClick={addPkgService} disabled={!pkgService}>Add</CustomButton>
            </div>
            {pkgSelection.length > 0 && (
              <div className="space-y-1 rounded-lg border border-gray-100 p-2">
                {pkgSelection.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-2 py-1 text-sm">
                    <span className="text-gray-700">{s.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-gray-500">{currency(Number(s.price))}</span>
                      <button onClick={() => setPkgForm({ ...pkgForm, serviceIds: pkgForm.serviceIds.filter((x) => x !== s.id) })} className="text-gray-300 hover:text-rose-500">✕</button>
                    </span>
                  </div>
                ))}
                <p className="border-t border-gray-100 px-2 pt-1.5 text-xs text-gray-400">Regular total: <span className="font-semibold tabular-nums">{currency(pkgRegular)}</span></p>
              </div>
            )}
          </div>
          <CustomInput label="Package price (৳ — leave blank to default to regular total)" type="number" min={0} value={pkgForm.price} onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })} />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowPackage(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={createPackage} disabled={!pkgForm.name || pkgForm.serviceIds.length === 0}>Create Package</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Book appointment modal */}
      <CustomModal open={showBook} onClose={() => setShowBook(false)} title="Book Salon Appointment">
        <div className="space-y-4">
          <CustomSelect label="Customer" value={bookForm.customerId} onChange={(e) => setBookForm({ ...bookForm, customerId: e.target.value })} placeholder="Select customer"
            options={customers.map((c) => ({ label: `${c.name}${c.phone ? ` · ${c.phone}` : ""}`, value: c.id }))} />
          <CustomSelect label="Service" value={bookForm.serviceId} onChange={(e) => setBookForm({ ...bookForm, serviceId: e.target.value })} placeholder="Select service"
            options={services.filter((s) => s.isActive).map((s) => ({ label: `${s.name} — ${currency(Number(s.price))} (${s.durationMin} min)`, value: s.id }))} />
          {selectedServiceForBook && (
            <p className="rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-700">
              {selectedServiceForBook.name} · {selectedServiceForBook.durationMin} min · {currency(Number(selectedServiceForBook.price))}
            </p>
          )}
          <CustomSelect label="Stylist" value={bookForm.staffId} onChange={(e) => setBookForm({ ...bookForm, staffId: e.target.value })} placeholder="Any stylist"
            options={staff.map((s) => ({ label: s.name, value: s.id }))} />
          <CustomInput label="Start time" type="datetime-local" value={bookForm.startAt} onChange={(e) => setBookForm({ ...bookForm, startAt: e.target.value })} />
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            <Clock size={13} /> Booking conflicts with the stylist's other appointments are rejected automatically.
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowBook(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={createBooking} disabled={!bookForm.customerId || !bookForm.serviceId || !bookForm.startAt}>Book</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Checkout / complete service modal */}
      <CustomModal open={!!checkout} onClose={() => setCheckout(null)} title={`Complete & Bill — ${checkout?.customerName ?? ""}`}>
        {checkout && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{checkout.serviceName || "—"}</span></p>
              <p className="mt-1 flex justify-between"><span className="text-gray-500">Stylist</span><span>{checkout.staffName || "—"}</span></p>
              <p className="mt-1 flex justify-between font-bold"><span>Amount</span><span className="tabular-nums">{currency(Number(checkout.price))}</span></p>
            </div>
            <CustomSelect label="Payment method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
              options={[
                { label: "Cash", value: "CASH" }, { label: "Card", value: "CARD" },
                { label: "bKash", value: "BKASH" }, { label: "Nagad", value: "NAGAD" },
                { label: "Customer credit", value: "CREDIT" },
              ]} />
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
              Completing creates the sale + invoice + payment + accounting journal, records the stylist commission, and marks the appointment done.
            </div>
            <div className="flex justify-end gap-2">
              <CustomButton variant="outline" onClick={() => setCheckout(null)}>Cancel</CustomButton>
              <CustomButton loading={saving} onClick={completeBooking} leftIcon={<CheckCircle2 size={15} />}>Complete & Bill</CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}