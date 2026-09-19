"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  Calendar,
  CalendarDays,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Loader2,
  User,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Scissors,
  Wrench,
  Coffee,
  Sparkles,
  Phone,
  DollarSign,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Printer,
  CalendarCheck,
  AlertCircle,
  FileText,
  Clock4,
  Tag,
  Briefcase,
  Users,
  Timer,
  Info,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  CustomModal,
  ConfirmModal,
  CustomTabs,
  CustomInput,
  CustomTextarea,
  CustomDropdownSelect,
  CustomDatePicker,
} from "@/components/custom";
import { money, dateOnly, dateTime } from "@/lib/format";

type ViewMode = "list" | "calendar" | "availability" | "services";

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
  status: "BOOKED" | "CONFIRMED" | "CHECKED_IN" | "IN_SERVICE" | "COMPLETED" | "NO_SHOW" | "CANCELLED" | string;
  notes: string | null;
  createdAt?: string;
}

interface StaffOption {
  id: string;
  name: string;
  designationName?: string | null;
  specialization?: string | null;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
  email?: string | null;
}

interface SalonService {
  id: string;
  name: string;
  category?: string;
  price: number;
  durationMin: number;
  description?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  BOOKED: {
    label: "Booked",
    bg: "bg-brand-50 border-brand-border",
    text: "text-brand-primary",
    dot: "bg-brand-primary",
    icon: Calendar,
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-brand-50 border-brand-border",
    text: "text-brand-dark",
    dot: "bg-brand-primary",
    icon: CalendarCheck,
  },
  CHECKED_IN: {
    label: "Checked In",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    icon: UserCheck,
  },
  IN_SERVICE: {
    label: "In Service",
    bg: "bg-purple-50 border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-500",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  NO_SHOW: {
    label: "No Show",
    bg: "bg-slate-100 border-slate-200",
    text: "text-slate-600",
    dot: "bg-slate-400",
    icon: UserX,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
    icon: XCircle,
  },
};

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  SALON: Scissors,
  REPAIR: Wrench,
  CONSULT: Sparkles,
  GENERAL: Coffee,
};

function TypeBadge({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type] || Coffee;
  const labels: Record<string, string> = {
    SALON: "Salon & Spa",
    REPAIR: "Repair Center",
    CONSULT: "Consultation",
    GENERAL: "General Booking",
  };

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
      <Icon size={11} className="text-brand-primary" />
      {labels[type] || type}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    bg: "bg-slate-50 border-slate-200",
    text: "text-gray-600",
    dot: "bg-slate-400",
    icon: Calendar,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold border ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<ViewMode>("list");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [staffFilter, setStaffFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Master Reference Data
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [servicesList, setServicesList] = useState<SalonService[]>([]);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmStatusData, setConfirmStatusData] = useState<{
    appt: Appointment;
    nextStatus: string;
    label: string;
  } | null>(null);

  // Form State
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    appointmentType: "SALON",
    customerId: "",
    customerName: "",
    customerPhone: "",
    staffId: "",
    serviceId: "",
    serviceName: "",
    startAt: "",
    durationMin: 30,
    price: 0,
    notes: "",
  });

  // Live Availability Slot Checker State
  const [availDate, setAvailDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [availStaffId, setAvailStaffId] = useState("");
  const [availDuration, setAvailDuration] = useState(30);
  const [availSlots, setAvailSlots] = useState<{ start: string; end: string }[]>([]);
  const [checkingSlots, setCheckingSlots] = useState(false);

  // Toast / Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load All Appointments
  const loadAppointments = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (typeFilter && typeFilter !== "ALL") p.set("appointmentType", typeFilter);
      if (statusFilter && statusFilter !== "ALL") p.set("status", statusFilter);
      if (staffFilter && staffFilter !== "ALL") p.set("staffId", staffFilter);
      if (dateFilter) {
        p.set("dateFrom", dateFilter);
        p.set("dateTo", dateFilter);
      }
      p.set("limit", "200");

      const res = await api.get<{ data: Appointment[] }>(`/v1/appointments?${p.toString()}`);
      setAppointments(res.data || []);
    } catch (err: any) {
      console.error("Error loading appointments:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, statusFilter, staffFilter, dateFilter]);

  // Initial Load
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Load Reference Lookups (Customers, Staff, Services)
  useEffect(() => {
    api
      .get<{ data: CustomerOption[] }>("/v1/customers?limit=250")
      .then((r) => setCustomers(r.data || []))
      .catch(() => setCustomers([]));

    api
      .get<{ data: StaffOption[] }>("/v1/salon/staff")
      .then((r) => {
        if (r.data && r.data.length > 0) {
          setStaffList(r.data);
          if (!availStaffId) setAvailStaffId(r.data[0].id);
        }
      })
      .catch(() => setStaffList([]));

    api
      .get<{ data: SalonService[] }>("/v1/salon/services")
      .then((r) => setServicesList(r.data || []))
      .catch(() => {
        // Fallback default services if not set up
        setServicesList([
          { id: "1", name: "Classic Haircut & Styling", category: "Hair", price: 500, durationMin: 30 },
          { id: "2", name: "Deluxe Hair Spa & Treatment", category: "Spa", price: 1500, durationMin: 60 },
          { id: "3", name: "Beard Grooming & Shave", category: "Grooming", price: 350, durationMin: 25 },
          { id: "4", name: "Facial Skin Therapy", category: "Skincare", price: 2000, durationMin: 45 },
          { id: "5", name: "Device Diagnostics & Repair", category: "Tech", price: 800, durationMin: 40 },
          { id: "6", name: "Consultation Session", category: "Consult", price: 1000, durationMin: 30 },
        ]);
      });
  }, []);

  // Quick Slot Availability Checker
  const checkAvailability = useCallback(
    async (targetDate: string, targetStaffId: string, duration: number) => {
      if (!targetDate) return;
      setCheckingSlots(true);
      try {
        const query = new URLSearchParams({
          date: targetDate,
          durationMin: String(duration || 30),
        });
        if (targetStaffId) query.set("staffId", targetStaffId);

        const res = await api.get<{ data: { start: string; end: string }[] }>(
          `/v1/appointments/availability?${query.toString()}`
        );
        setAvailSlots(res.data || []);
      } catch (err: any) {
        console.error("Availability lookup error:", err);
      } finally {
        setCheckingSlots(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeTab === "availability" && availDate) {
      checkAvailability(availDate, availStaffId, availDuration);
    }
  }, [activeTab, availDate, availStaffId, availDuration, checkAvailability]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = appointments.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = appointments.filter((a) => (a.startAt || "").slice(0, 10) === todayStr).length;
    const inServiceCount = appointments.filter((a) => a.status === "IN_SERVICE" || a.status === "CHECKED_IN").length;
    const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED" || a.status === "BOOKED").length;
    const completedRevenue = appointments
      .filter((a) => a.status === "COMPLETED")
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const cancelledNoShowCount = appointments.filter((a) => a.status === "CANCELLED" || a.status === "NO_SHOW").length;
    const completionRate = total > 0 ? Math.round((appointments.filter((a) => a.status === "COMPLETED").length / total) * 100) : 0;

    return {
      total,
      todayCount,
      inServiceCount,
      confirmedCount,
      completedRevenue,
      cancelledNoShowCount,
      completionRate,
    };
  }, [appointments]);

  // Filtered List
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchSearch =
        !search ||
        a.appointmentNo.toLowerCase().includes(search.toLowerCase()) ||
        (a.customerName && a.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (a.customerPhone && a.customerPhone.includes(search)) ||
        (a.serviceName && a.serviceName.toLowerCase().includes(search.toLowerCase())) ||
        (a.staffName && a.staffName.toLowerCase().includes(search.toLowerCase()));

      const matchType = typeFilter === "ALL" || a.appointmentType === typeFilter;
      const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
      const matchStaff = staffFilter === "ALL" || a.staffId === staffFilter;
      const matchDate = !dateFilter || (a.startAt && a.startAt.slice(0, 10) === dateFilter);

      return matchSearch && matchType && matchStatus && matchStaff && matchDate;
    });
  }, [appointments, search, typeFilter, statusFilter, staffFilter, dateFilter]);

  // Handle Quick Booking Open
  const handleOpenCreate = (prefill?: Partial<typeof form>) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const defaultStart = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setForm({
      appointmentType: prefill?.appointmentType || "SALON",
      customerId: prefill?.customerId || "",
      customerName: prefill?.customerName || "",
      customerPhone: prefill?.customerPhone || "",
      staffId: prefill?.staffId || (staffList[0]?.id || ""),
      serviceId: prefill?.serviceId || "",
      serviceName: prefill?.serviceName || "",
      startAt: prefill?.startAt || defaultStart,
      durationMin: prefill?.durationMin || 30,
      price: prefill?.price || 0,
      notes: prefill?.notes || "",
    });
    setShowCreate(true);
  };

  // Submit Booking
  const handleCreateBooking = async () => {
    if (!form.customerId && !form.customerName) {
      showFeedback("Please select or specify a customer.", "error");
      return;
    }
    if (!form.startAt) {
      showFeedback("Please select appointment date and start time.", "error");
      return;
    }

    setSaving(true);
    try {
      const staffObj = staffList.find((s) => s.id === form.staffId);
      const custObj = customers.find((c) => c.id === form.customerId);

      const formattedStart = form.startAt.includes("T")
        ? form.startAt.replace("T", " ") + (form.startAt.length === 16 ? ":00" : "")
        : form.startAt;

      await api.post("/v1/appointments", {
        appointmentType: form.appointmentType,
        customerId: form.customerId || undefined,
        customerName: custObj ? custObj.name : form.customerName || undefined,
        customerPhone: custObj ? custObj.phone : form.customerPhone || undefined,
        staffId: form.staffId || undefined,
        staffName: staffObj ? staffObj.name : undefined,
        serviceId: form.serviceId || undefined,
        serviceName: form.serviceName || undefined,
        startAt: formattedStart,
        durationMin: Number(form.durationMin) || 30,
        price: Number(form.price) || 0,
        notes: form.notes || undefined,
      });

      showFeedback("Appointment successfully booked!");
      setShowCreate(false);
      loadAppointments();
    } catch (err: any) {
      showFeedback(err?.message || "Failed to create appointment.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Status Change Logic
  const handleUpdateStatus = async (appt: Appointment, status: string) => {
    try {
      await api.patch(`/v1/appointments/${appt.id}/status`, { status });
      showFeedback(`Appointment ${appt.appointmentNo} updated to ${status}`);
      loadAppointments();
      if (selectedAppt && selectedAppt.id === appt.id) {
        setSelectedAppt({ ...selectedAppt, status });
      }
    } catch (err: any) {
      showFeedback(err?.message || "Failed to update appointment status.", "error");
    }
  };

  // Service Selector Helper
  const handleSelectService = (serviceId: string) => {
    const s = servicesList.find((item) => item.id === serviceId);
    if (s) {
      setForm((prev) => ({
        ...prev,
        serviceId: s.id,
        serviceName: s.name,
        price: s.price,
        durationMin: s.durationMin,
      }));
    } else {
      setForm((prev) => ({ ...prev, serviceId }));
    }
  };

  // Grouped Appointments for Day / Calendar View
  const appointmentsByDate = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    filteredAppointments.forEach((a) => {
      const d = (a.startAt || "").slice(0, 10) || "Unscheduled";
      if (!groups[d]) groups[d] = [];
      groups[d].push(a);
    });
    // Sort keys chronologically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAppointments]);

  // Tab definitions
  const tabs = [
    { id: "list", label: "All Appointments", icon: <CalendarDays size={16} />, badge: filteredAppointments.length },
    { id: "calendar", label: "Day Schedule Grid", icon: <Calendar size={16} /> },
    { id: "availability", label: "Staff Slot Radar", icon: <Clock4 size={16} /> },
    { id: "services", label: "Service Quick-Book", icon: <Scissors size={16} />, badge: servicesList.length },
  ];

  return (
    <div className="w-full space-y-4">
      {/* 1. TOP BREADCRUMB WITH ACTIONS */}
      <CustomBreadcrumb
        title="Appointments & Bookings"
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "Appointments" },
        ]}
        icon={<CalendarDays size={16} className="text-brand-primary" />}
        actions={
          <CustomButton
            variant="primary"
            themeColor="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => handleOpenCreate()}
          >
            New Booking
          </CustomButton>
        }
      />

      {/* 2. Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-sm border px-4 py-2.5 text-xs font-medium shadow-2xs ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 3. EXECUTIVE KPI STAT CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <CustomStatCard
          label="Total Bookings"
          value={loading ? "—" : String(stats.total)}
          icon={CalendarDays}
          tone="primary"
        />
        <CustomStatCard
          label="Today's Schedule"
          value={loading ? "—" : String(stats.todayCount)}
          icon={CalendarCheck}
          tone="blue"
        />
        <CustomStatCard
          label="Active In Service"
          value={loading ? "—" : String(stats.inServiceCount)}
          icon={Clock}
          tone="violet"
        />
        <CustomStatCard
          label="Confirmed Pipeline"
          value={loading ? "—" : String(stats.confirmedCount)}
          icon={UserCheck}
          tone="primary"
        />
        <CustomStatCard
          label="Completed Revenue"
          value={loading ? "—" : money(stats.completedRevenue)}
          icon={DollarSign}
          tone="green"
        />
        <CustomStatCard
          label="Cancelled / No-Show"
          value={loading ? "—" : String(stats.cancelledNoShowCount)}
          icon={XCircle}
          tone="red"
        />
      </div>

      {/* 4. TABS NAVIGATION */}
      <div className="flex items-center gap-3">
        <div className="overflow-x-auto min-w-0 shrink">
          <CustomTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as ViewMode)}
            themeColor="primary"
            className="w-auto border border-slate-200 bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* 5. Main Tab Content */}
      {activeTab === "list" && (
        <div className="space-y-3">
          {/* Search & Select Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <CustomInput
              leftIcon={<Search size={14} />}
              rightIcon={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                ) : null
              }
              placeholder="Search booking #, customer, staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              containerClassName="w-full"
              className="h-[38px] text-xs text-gray-600 placeholder:text-slate-400 shadow-2xs"
            />

            <CustomDropdownSelect
              options={[
                { label: "All Types", value: "ALL" },
                { label: "Salon & Spa", value: "SALON" },
                { label: "Repair", value: "REPAIR" },
                { label: "Consultation", value: "CONSULT" },
                { label: "General", value: "GENERAL" },
              ]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              placeholder="All Types"
              containerClassName="w-full"
              className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
            />

            <CustomDropdownSelect
              options={[
                { label: "All Statuses", value: "ALL" },
                { label: "Booked", value: "BOOKED" },
                { label: "Confirmed", value: "CONFIRMED" },
                { label: "Checked In", value: "CHECKED_IN" },
                { label: "In Service", value: "IN_SERVICE" },
                { label: "Completed", value: "COMPLETED" },
                { label: "No Show", value: "NO_SHOW" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="All Statuses"
              containerClassName="w-full"
              className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
            />

            <CustomDropdownSelect
              options={[
                { label: "All Staff", value: "ALL" },
                ...staffList.map((s) => ({ label: s.name, value: s.id })),
              ]}
              value={staffFilter}
              onChange={(val) => setStaffFilter(val)}
              placeholder="All Staff"
              containerClassName="w-full"
              className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
            />

            <div className="flex items-center gap-2">
              <CustomDatePicker
                value={dateFilter}
                onChange={(val) => setDateFilter(val)}
                clearable={true}
                placeholder="Filter date"
                containerClassName="w-full"
              />
              {(search || typeFilter !== "ALL" || statusFilter !== "ALL" || staffFilter !== "ALL" || dateFilter) && (
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("ALL");
                    setStatusFilter("ALL");
                    setStaffFilter("ALL");
                    setDateFilter("");
                  }}
                  className="h-[38px] shrink-0"
                  title="Clear filters"
                >
                  Clear
                </CustomButton>
              )}
            </div>
          </div>

          {/* Table */}
          <CustomTable<Appointment>
            data={filteredAppointments}
            loading={loading}
            rowKey="id"
            title="Appointments & Bookings Directory"
            icon={<CalendarDays size={16} />}
            badge={
              <span className="rounded-sm bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-primary border border-brand-border">
                {filteredAppointments.length} Records
              </span>
            }
            pageSize={12}
            showPagination={true}
            emptyMessage="No appointments matched your filter criteria."
            onRowClick={(row) => {
              setSelectedAppt(row);
              setShowDetailModal(true);
            }}
            columns={[
              {
                key: "appointmentNo",
                header: "Booking #",
                width: "140px",
                render: (row) => (
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppt(row);
                        setShowDetailModal(true);
                      }}
                      className="font-mono text-xs font-bold text-gray-600 hover:text-brand-primary transition text-left cursor-pointer"
                      title="Click to view booking"
                    >
                      {row.appointmentNo}
                    </button>
                    <TypeBadge type={row.appointmentType} />
                  </div>
                ),
              },
              {
                key: "customer",
                header: "Customer",
                width: "180px",
                render: (row) => (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0 border border-brand-border shadow-2xs">
                      {(row.customerName || "W")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-600 text-xs truncate">
                        {row.customerName || "Walk-in Guest"}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                        {row.customerPhone ? (
                          <>
                            <Phone size={10} className="text-slate-400" />
                            {row.customerPhone}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "service",
                header: "Service & Staff",
                render: (row) => (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-600 truncate">
                      {row.serviceName || "General Service"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-dark">
                        <User size={11} className="text-brand-primary" />
                        {row.staffName || "Unassigned"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                        <Timer size={11} />
                        {row.durationMin}m
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "schedule",
                header: "Schedule Date & Time",
                width: "170px",
                render: (row) => {
                  const d = new Date((row.startAt || "").replace(" ", "T"));
                  const isValid = !isNaN(d.getTime());
                  const formatted = isValid
                    ? d.toLocaleDateString("en-BD", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : row.startAt;
                  const timeStr = isValid
                    ? d.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })
                    : "";

                  return (
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                        <Calendar size={12} className="text-brand-primary" />
                        {formatted}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5">
                        <Clock size={11} className="text-slate-400" />
                        {timeStr}
                      </p>
                    </div>
                  );
                },
              },
              {
                key: "price",
                header: "Amount",
                align: "right",
                width: "110px",
                render: (row) => (
                  <span className="font-black tabular-nums text-xs sm:text-sm text-emerald-700">
                    ৳{Number(row.price || 0).toLocaleString()}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "center",
                width: "130px",
                render: (row) => <StatusPill status={row.status} />,
              },
              {
                key: "actions",
                header: "Actions",
                align: "right",
                width: "210px",
                render: (row) => (
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Workflow progression action */}
                    {row.status === "BOOKED" && (
                      <CustomButton
                        size="xs"
                        variant="primary"
                        themeColor="teal"
                        leftIcon={<CheckCircle2 size={12} />}
                        onClick={() => handleUpdateStatus(row, "CONFIRMED")}
                        title="Confirm Booking"
                      >
                        Confirm
                      </CustomButton>
                    )}
                    {row.status === "CONFIRMED" && (
                      <CustomButton
                        size="xs"
                        variant="primary"
                        themeColor="amber"
                        leftIcon={<UserCheck size={12} />}
                        onClick={() => handleUpdateStatus(row, "CHECKED_IN")}
                        title="Check-in Customer"
                      >
                        Check-in
                      </CustomButton>
                    )}
                    {row.status === "CHECKED_IN" && (
                      <CustomButton
                        size="xs"
                        variant="primary"
                        themeColor="primary"
                        leftIcon={<Clock size={12} />}
                        onClick={() => handleUpdateStatus(row, "IN_SERVICE")}
                        title="Start Service"
                      >
                        Start
                      </CustomButton>
                    )}
                    {row.status === "IN_SERVICE" && (
                      <CustomButton
                        size="xs"
                        variant="primary"
                        themeColor="emerald"
                        leftIcon={<Check size={12} />}
                        onClick={() => handleUpdateStatus(row, "COMPLETED")}
                        title="Complete Service"
                      >
                        Complete
                      </CustomButton>
                    )}

                    {/* View Details button */}
                    <CustomButton
                      size="xs"
                      variant="outline"
                      leftIcon={<Eye size={12} />}
                      onClick={() => {
                        setSelectedAppt(row);
                        setShowDetailModal(true);
                      }}
                      title="View Booking Details & Slip"
                    >
                      Details
                    </CustomButton>

                    {/* Mark No Show button */}
                    {["BOOKED", "CONFIRMED", "CHECKED_IN"].includes(row.status) && (
                      <button
                        type="button"
                        title="Mark as No Show"
                        onClick={() =>
                          setConfirmStatusData({
                            appt: row,
                            nextStatus: "NO_SHOW",
                            label: "Mark as No Show",
                          })
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition cursor-pointer shadow-2xs"
                      >
                        <UserX size={12} />
                      </button>
                    )}

                    {/* Cancel Booking button */}
                    {["BOOKED", "CONFIRMED"].includes(row.status) && (
                      <button
                        type="button"
                        title="Cancel Booking"
                        onClick={() =>
                          setConfirmStatusData({
                            appt: row,
                            nextStatus: "CANCELLED",
                            label: "Cancel Booking",
                          })
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition cursor-pointer shadow-2xs"
                      >
                        <XCircle size={12} />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            />
        </div>
      )}

      {/* 5b. Day Grid / Calendar View */}
      {activeTab === "calendar" && (
        <div className="space-y-3">
          <div className="rounded-sm border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-brand-primary" />
              <h2 className="text-xs font-bold text-brand-dark">
                Timeline & Day Schedule Ledger
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <CustomButton
                size="xs"
                variant="primary"
                themeColor="primary"
                leftIcon={Plus}
                onClick={() => handleOpenCreate()}
              >
                Quick Book
              </CustomButton>
            </div>
          </div>

          {appointmentsByDate.length === 0 ? (
            <div className="rounded-sm border border-slate-200 bg-white p-12 text-center shadow-2xs text-slate-400">
              <CalendarDays size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-xs">No appointments recorded for this timeframe.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointmentsByDate.map(([dateStr, list]) => {
                const dateObj = new Date(dateStr + "T12:00:00");
                const formattedHeading = isNaN(dateObj.getTime())
                  ? dateStr
                  : dateObj.toLocaleDateString("en-BD", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });

                return (
                  <div
                    key={dateStr}
                    className="rounded-sm border border-slate-200 bg-white shadow-2xs overflow-hidden"
                  >
                    <div className="bg-brand-50/50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-brand-primary" />
                        <span className="text-xs font-bold text-gray-600">
                          {formattedHeading}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-brand-primary bg-brand-50 border border-brand-border px-2 py-0.5 rounded-sm">
                        {list.length} booking{list.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="divide-y divide-sky-100/60">
                      {list.map((appt) => (
                        <div
                          key={appt.id}
                          className="p-3.5 hover:bg-brand-50/50/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-14 shrink-0 font-mono text-xs font-bold text-brand-primary bg-brand-50 border border-brand-border rounded-sm p-1.5 text-center">
                              {(appt.startAt || "").slice(11, 16) || "TBD"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-600 text-xs">
                                  {appt.customerName || "Walk-in Guest"}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs font-medium text-gray-600">
                                  {appt.serviceName || "Service"}
                                </span>
                                <TypeBadge type={appt.appointmentType} />
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                                <span>Booking #{appt.appointmentNo}</span>
                                <span>•</span>
                                <span>Staff: {appt.staffName || "Unassigned"}</span>
                                <span>•</span>
                                <span>Duration: {appt.durationMin}m</span>
                                <span>•</span>
                                <span className="font-bold text-gray-600">
                                  {money(Number(appt.price) || 0)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <StatusPill status={appt.status} />
                            <CustomButton
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                setSelectedAppt(appt);
                                setShowDetailModal(true);
                              }}
                            >
                              Manage
                            </CustomButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5c. Staff Slot Radar / Availability Tab */}
      {activeTab === "availability" && (
        <div className="space-y-3">
          <div className="rounded-sm border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-brand-dark flex items-center gap-2">
              <Clock4 size={15} className="text-brand-primary" />
              Live Staff Availability & Free Slot Radar
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <CustomDatePicker
                  label="Select Date"
                  value={availDate}
                  onChange={(val) => setAvailDate(val)}
                  containerClassName="w-full"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">
                  Staff Member
                </label>
                <CustomDropdownSelect
                  value={availStaffId}
                  onChange={(val) => setAvailStaffId(val)}
                  options={[
                    { label: "All / Any Staff", value: "" },
                    ...staffList.map((s) => ({
                      label: `${s.name} ${s.designationName ? `(${s.designationName})` : ""}`,
                      value: s.id,
                    })),
                  ]}
                  placeholder="All / Any Staff"
                  containerClassName="w-full"
                  className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-dark">
                  Slot Duration (Minutes)
                </label>
                <CustomDropdownSelect
                  value={String(availDuration)}
                  onChange={(val) => setAvailDuration(Number(val))}
                  options={[
                    { label: "15 Minutes", value: "15" },
                    { label: "30 Minutes (Standard)", value: "30" },
                    { label: "45 Minutes", value: "45" },
                    { label: "60 Minutes (1 Hour)", value: "60" },
                    { label: "90 Minutes", value: "90" },
                  ]}
                  placeholder="30 Minutes (Standard)"
                  containerClassName="w-full"
                  className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
                />
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <CustomButton
                size="sm"
                variant="primary"
                themeColor="primary"
                leftIcon={<RefreshCw size={13} className={checkingSlots ? "animate-spin" : ""} />}
                onClick={() => checkAvailability(availDate, availStaffId, availDuration)}
                disabled={checkingSlots}
              >
                Search Available Slots
              </CustomButton>
            </div>
          </div>

          {/* Slots Output */}
          <div className="rounded-sm border border-slate-200 bg-white shadow-2xs p-4">
            <h3 className="text-xs font-bold text-brand-dark mb-3 flex items-center justify-between">
              <span>
                Available Windows for {availDate} ({availDuration}m)
              </span>
              <span className="text-[11px] text-slate-500 font-semibold lowercase">
                {availSlots.length} open windows
              </span>
            </h3>

            {checkingSlots ? (
              <div className="py-10 text-center text-slate-400">
                <Loader2 size={22} className="animate-spin mx-auto text-brand-primary mb-2" />
                <p className="text-xs">Calculating staff availability & avoiding clashes...</p>
              </div>
            ) : availSlots.length === 0 ? (
              <div className="p-8 text-center bg-brand-50/40 rounded-sm border border-slate-200">
                <p className="text-xs font-semibold text-slate-600">
                  No free slots available for this staff on this date.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Try another staff member or choose an alternative date.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {availSlots.map((s, idx) => {
                  const startTime = s.start.slice(11, 16);
                  const endTime = s.end.slice(11, 16);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const isoTime = `${availDate}T${startTime}`;
                        handleOpenCreate({
                          startAt: isoTime,
                          staffId: availStaffId,
                          durationMin: availDuration,
                        });
                      }}
                      className="group p-2.5 rounded-sm border border-brand-border bg-brand-50/50 hover:bg-brand-primary hover:border-brand-primary transition-all text-left flex flex-col justify-between cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-mono font-bold text-brand-dark group-hover:text-white">
                          {startTime}
                        </span>
                        <Plus size={12} className="text-brand-primary group-hover:text-white" />
                      </div>
                      <span className="text-[10px] text-brand-primary/80 group-hover:text-sky-100 mt-1 font-mono">
                        to {endTime}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5d. Services Catalog Quick-Book Tab */}
      {activeTab === "services" && (
        <div className="space-y-3">
          <div className="rounded-sm border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Scissors size={16} className="text-brand-primary" />
              <h2 className="text-xs font-bold text-brand-dark">
                Service Catalog & Instant Booking
              </h2>
            </div>
            <CustomButton
              size="xs"
              variant="primary"
              themeColor="primary"
              leftIcon={<Plus size={13} />}
              onClick={() => handleOpenCreate()}
            >
              Custom Service
            </CustomButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {servicesList.map((svc) => (
              <div
                key={svc.id}
                className="rounded-sm border border-slate-200 bg-white shadow-2xs p-4 flex flex-col justify-between hover:border-brand-border transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-brand-primary bg-brand-50 border border-brand-border px-2 py-0.5 rounded-sm">
                      {svc.category || "General"}
                    </span>
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                      <Timer size={12} className="text-brand-primary" />
                      {svc.durationMin} mins
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-600 text-sm mb-1">{svc.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {svc.description || "Professional service performed by licensed technicians and specialists."}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-gray-600 [font-variant-numeric:tabular-nums]">
                    {money(Number(svc.price) || 0)}
                  </span>
                  <CustomButton
                    size="xs"
                    variant="primary"
                    themeColor="primary"
                    leftIcon={<CalendarCheck size={12} />}
                    onClick={() => {
                      handleOpenCreate({
                        serviceId: svc.id,
                        serviceName: svc.name,
                        durationMin: svc.durationMin,
                        price: svc.price,
                      });
                    }}
                  >
                    Book Now
                  </CustomButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. New Appointment Modal */}
      <CustomModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Schedule New Appointment"
        size="4xl"
        themeColor="primary"
        icon={<CalendarDays size={18} className="text-brand-primary" />}
      >
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-dark">
                Booking Type
              </label>
              <CustomDropdownSelect
                value={form.appointmentType}
                onChange={(val) => setForm({ ...form, appointmentType: val })}
                options={[
                  { label: "Salon & Spa Service", value: "SALON" },
                  { label: "Repair & Diagnostic", value: "REPAIR" },
                  { label: "Consultation", value: "CONSULT" },
                  { label: "General Appointment", value: "GENERAL" },
                ]}
                placeholder="Select Booking Type"
                containerClassName="w-full"
                className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-dark">
                Select Customer
              </label>
              <CustomDropdownSelect
                value={form.customerId || ""}
                onChange={(val) => {
                  const c = customers.find((item) => item.id === val);
                  setForm({
                    ...form,
                    customerId: val || "",
                    customerName: c ? c.name : form.customerName,
                    customerPhone: c ? c.phone || "" : form.customerPhone,
                  });
                }}
                options={[
                  { label: "-- Walk-in / Guest Customer --", value: "" },
                  ...customers.map((c) => ({
                    label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
                    value: c.id,
                  })),
                ]}
                placeholder="Select Customer (Optional)"
                containerClassName="w-full"
                className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
              />
            </div>
          </div>

          {/* If Walk-in / Unregistered customer */}
          {!form.customerId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-brand-50/40 rounded-sm border border-slate-200">
              <CustomInput
                label="Walk-in Customer Name"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="e.g. Tanvir Rahman"
                className="h-[38px] text-xs shadow-2xs"
              />
              <CustomInput
                label="Phone Number"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="e.g. 01700000000"
                className="h-[38px] text-xs shadow-2xs"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-dark">
                Service Item
              </label>
              <CustomDropdownSelect
                value={form.serviceId || ""}
                onChange={(val) => handleSelectService(val)}
                options={[
                  { label: "Select Standard Service...", value: "" },
                  ...servicesList.map((s) => ({
                    label: `${s.name} (${money(s.price)} - ${s.durationMin}m)`,
                    value: s.id,
                  })),
                ]}
                placeholder="Select Standard Service..."
                containerClassName="w-full"
                className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-dark">
                Assigned Staff Member
              </label>
              <CustomDropdownSelect
                value={form.staffId || ""}
                onChange={(val) => setForm({ ...form, staffId: val || "" })}
                options={[
                  { label: "Any Available Staff", value: "" },
                  ...staffList.map((s) => ({
                    label: `${s.name} ${s.designationName ? `(${s.designationName})` : ""}`,
                    value: s.id,
                  })),
                ]}
                placeholder="Any Available Staff"
                containerClassName="w-full"
                className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
              />
            </div>
          </div>

          <CustomInput
            label="Service Title / Description"
            value={form.serviceName}
            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
            placeholder="e.g. Hair Wash, Cut & Blowdry"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CustomDatePicker
              label="Start Date & Time"
              type="datetime-local"
              value={form.startAt}
              onChange={(val) => setForm({ ...form, startAt: val })}
            />
            <CustomInput
              label="Duration (Minutes)"
              type="number"
              min={10}
              value={String(form.durationMin)}
              onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) || 30 })}
            />
            <CustomInput
              label="Price (৳)"
              type="number"
              min={0}
              value={String(form.price)}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
            />
          </div>

          <CustomTextarea
            label="Special Notes & Preferences"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Special customer requests, allergies, or diagnostic symptoms..."
            rows={2}
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <CustomButton
              variant="danger"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              loading={saving}
              onClick={handleCreateBooking}
              leftIcon={<Check size={15} />}
            >
              Confirm Booking
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* 7. Appointment Detail & Receipt Slip Modal */}
      {selectedAppt && (
        <CustomModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Booking Details — ${selectedAppt.appointmentNo}`}
          size="xl"
          themeColor="primary"
          icon={<CalendarDays size={18} className="text-brand-primary" />}
        >
          <div className="space-y-4 py-1">
            <div className="p-4 rounded-sm border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="font-mono text-xs text-slate-400">Booking Token</span>
                  <p className="font-mono text-lg font-extrabold text-brand-primary">
                    {selectedAppt.appointmentNo}
                  </p>
                </div>
                <StatusPill status={selectedAppt.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Customer</span>
                  <p className="font-bold text-gray-600 text-xs mt-0.5">
                    {selectedAppt.customerName || "Walk-in Guest"}
                  </p>
                  {selectedAppt.customerPhone && (
                    <p className="text-slate-500 font-mono text-[11px]">{selectedAppt.customerPhone}</p>
                  )}
                </div>

                <div>
                  <span className="text-slate-400">Assigned Staff</span>
                  <p className="font-bold text-gray-600 text-xs mt-0.5">
                    {selectedAppt.staffName || "Unassigned"}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">Scheduled Time</span>
                  <p className="font-semibold text-gray-600 mt-0.5 text-xs">
                    {dateTime(selectedAppt.startAt)}
                  </p>
                  <span className="text-slate-400 text-[11px]">
                    Duration: {selectedAppt.durationMin} mins
                  </span>
                </div>

                <div>
                  <span className="text-slate-400">Total Price</span>
                  <p className="font-extrabold text-brand-primary text-base mt-0.5 [font-variant-numeric:tabular-nums]">
                    {money(Number(selectedAppt.price) || 0)}
                  </p>
                </div>
              </div>

              {selectedAppt.notes && (
                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-400">Notes & Instructions:</span>
                  <p className="text-gray-600 mt-0.5 bg-brand-50/50 p-2 rounded-sm border border-slate-200 text-xs">
                    {selectedAppt.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Transition Status Controls */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-brand-dark">
                Progress Status Workflow
              </span>
              <div className="flex flex-wrap gap-2">
                <CustomButton
                  size="xs"
                  variant={selectedAppt.status === "CONFIRMED" ? "primary" : "outline"}
                  themeColor="primary"
                  onClick={() => handleUpdateStatus(selectedAppt, "CONFIRMED")}
                >
                  Confirmed
                </CustomButton>
                <CustomButton
                  size="xs"
                  variant={selectedAppt.status === "CHECKED_IN" ? "primary" : "outline"}
                  themeColor="primary"
                  onClick={() => handleUpdateStatus(selectedAppt, "CHECKED_IN")}
                >
                  Checked In
                </CustomButton>
                <CustomButton
                  size="xs"
                  variant={selectedAppt.status === "IN_SERVICE" ? "primary" : "outline"}
                  themeColor="primary"
                  onClick={() => handleUpdateStatus(selectedAppt, "IN_SERVICE")}
                >
                  In Service
                </CustomButton>
                <CustomButton
                  size="xs"
                  variant={selectedAppt.status === "COMPLETED" ? "primary" : "outline"}
                  themeColor="primary"
                  onClick={() => handleUpdateStatus(selectedAppt, "COMPLETED")}
                >
                  Completed
                </CustomButton>
                <CustomButton
                  size="xs"
                  variant={selectedAppt.status === "CANCELLED" ? "danger" : "outline"}
                  onClick={() => handleUpdateStatus(selectedAppt, "CANCELLED")}
                >
                  Cancelled
                </CustomButton>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <CustomButton
                size="sm"
                variant="outline"
                leftIcon={<Printer size={14} />}
                onClick={() => window.print()}
              >
                Print Slip
              </CustomButton>
              <CustomButton
                variant="secondary"
                themeColor="primary"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </CustomButton>
            </div>
          </div>
        </CustomModal>
      )}

      {/* 8. Confirmation Modal for Critical Status Change */}
      {confirmStatusData && (
        <ConfirmModal
          open={!!confirmStatusData}
          onClose={() => setConfirmStatusData(null)}
          onConfirm={async () => {
            await handleUpdateStatus(confirmStatusData.appt, confirmStatusData.nextStatus);
            setConfirmStatusData(null);
          }}
          title={confirmStatusData.label}
          message={`Are you sure you want to mark appointment ${confirmStatusData.appt.appointmentNo} as ${confirmStatusData.nextStatus}? This will update floor availability and customer records.`}
          confirmText="Yes, Update"
          confirmVariant={confirmStatusData.nextStatus === "CANCELLED" ? "danger" : "primary"}
        />
      )}
    </div>
  );
}