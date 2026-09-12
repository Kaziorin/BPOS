"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Ticket,
  Plus,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Sparkles,
  Zap,
  Calendar,
  Layers,
  Percent,
  DollarSign,
  AlertCircle,
  ArrowLeft,
  Calculator,
  Check,
  Tag,
  Dices,
  SlidersHorizontal,
  Flame,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomStatCard, ConfirmModal } from "@/components/custom";
import { money } from "@/lib/format";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number | string;
  minAmount: number | string | null;
  maxDiscount: number | string | null;
  usageLimit: number | null;
  usageCount?: number;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  promotion?: { id: string; name: string } | null;
  createdAt?: string;
}

const COUPON_PRESETS = [
  { code: "WELCOME10", type: "PERCENTAGE", value: "10", desc: "10% off for first-time shoppers", minAmount: "500", maxDiscount: "500" },
  { code: "FLAT200", type: "FIXED", value: "200", desc: "Flat ৳200 discount on orders above ৳1,500", minAmount: "1500", maxDiscount: "" },
  { code: "VIP50", type: "PERCENTAGE", value: "50", desc: "Exclusive 50% discount for VIP loyalty members", minAmount: "2000", maxDiscount: "2000" },
  { code: "MEGA15", type: "PERCENTAGE", value: "15", desc: "15% off cart-wide promotion", minAmount: "1000", maxDiscount: "1000" },
  { code: "FREESHIP", type: "FIXED", value: "100", desc: "Delivery fee rebate (৳100 off)", minAmount: "800", maxDiscount: "" },
];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "validator" | "batch">("list");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; code: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Coupon[] }>("/coupons?limit=100");
      setCoupons(res.data || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load coupons", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // Copy code helper
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Coupon code "${code}" copied to clipboard!`);
  };

  // Toggle Active Status
  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await api.put(`/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      showToast(`Coupon "${coupon.code}" is now ${!coupon.isActive ? "Active" : "Inactive"}`);
      loadCoupons();
    } catch (err: any) {
      showToast(err.message || "Failed to update coupon status", "error");
    }
  };

  // Delete Coupon
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.del(`/coupons/${deleteConfirm.id}`);
      showToast(`Coupon code "${deleteConfirm.code}" deleted`);
      setDeleteConfirm(null);
      loadCoupons();
    } catch (err: any) {
      showToast(err.message || "Failed to delete coupon", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase());

      const today = new Date().toISOString().split("T")[0];
      const isExpired = c.validTo && c.validTo < today;
      const isExhausted = c.usageLimit !== null && (c.usageCount || 0) >= (c.usageLimit || 0);

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = c.isActive && !isExpired && !isExhausted;
      else if (statusFilter === "INACTIVE") matchesStatus = !c.isActive;
      else if (statusFilter === "EXPIRED") matchesStatus = !!isExpired;
      else if (statusFilter === "EXHAUSTED") matchesStatus = !!isExhausted;

      const matchesType = typeFilter === "ALL" || c.discountType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [coupons, search, statusFilter, typeFilter]);

  // Derived KPIs
  const activeCouponsCount = coupons.filter((c) => {
    const today = new Date().toISOString().split("T")[0];
    const isExpired = c.validTo && c.validTo < today;
    const isExhausted = c.usageLimit !== null && (c.usageCount || 0) >= (c.usageLimit || 0);
    return c.isActive && !isExpired && !isExhausted;
  }).length;

  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950 text-emerald-100 border border-emerald-700"
              : "bg-red-950 text-red-100 border border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="text-red-400" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-7 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/promotions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-white transition"
              >
                <ArrowLeft size={13} /> Promotions Hub
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-semibold text-amber-300">Coupons & Promo Codes</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Coupon Code Management
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-300 leading-relaxed">
              Generate alphanumeric coupon codes, configure single-use or multi-use thresholds, and test codes in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setTab("batch")}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            >
              <Dices size={16} className="text-purple-300" /> Batch Generator
            </button>
            <button
              onClick={() => { setEditCoupon(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:brightness-110 active:scale-95"
            >
              <Plus size={16} /> New Coupon
            </button>
            <button
              onClick={() => loadCoupons()}
              className="rounded-2xl bg-white/5 p-2.5 text-slate-300 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white"
              title="Refresh Coupons"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-5 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-xs text-slate-400">Active Coupons</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{activeCouponsCount}</span>
              <span className="text-xs text-slate-400">of {coupons.length} total</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-xs text-slate-400">Total Redemptions</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-300">{totalRedemptions}</span>
              <span className="text-xs text-slate-400">times redeemed</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-xs text-slate-400">Code Validation API</p>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-300">Live POS Validation</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-xs text-slate-400">Multi-branch Sync</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-200">Global Tenant Scope</span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1.5 shadow-inner">
        <button
          onClick={() => setTab("list")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === "list"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Ticket size={16} className={tab === "list" ? "text-indigo-600" : "text-slate-400"} />
          <span>All Coupon Codes</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
            {coupons.length}
          </span>
        </button>

        <button
          onClick={() => setTab("validator")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === "validator"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calculator size={16} className={tab === "validator" ? "text-amber-600" : "text-slate-400"} />
          <span>Test / Validate Coupon Sandbox</span>
        </button>

        <button
          onClick={() => setTab("batch")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === "batch"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Dices size={16} className={tab === "batch" ? "text-purple-600" : "text-slate-400"} />
          <span>Batch Code Generator</span>
        </button>
      </div>

      {/* ──────────────── TAB: COUPONS LIST ──────────────── */}
      {tab === "list" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search coupons by code or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="EXPIRED">Expired</option>
                <option value="EXHAUSTED">Usage Limit Exceeded</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Discount Types</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CustomTable
              columns={[
                {
                  key: "code",
                  header: "Promo Code & Notes",
                  render: (c: Coupon) => (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold rounded-lg bg-indigo-50 px-2 py-1 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                          {c.code}
                        </span>
                        <button
                          onClick={() => copyCode(c.code)}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          title="Copy Promo Code"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                      {c.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{c.description}</p>
                      )}
                    </div>
                  ),
                },
                {
                  key: "discount",
                  header: "Discount Value",
                  align: "right",
                  render: (c: Coupon) => (
                    <div className="text-right">
                      <span className="font-bold text-sm text-slate-900 tabular-nums">
                        {c.discountType === "PERCENTAGE"
                          ? `${c.discountValue}%`
                          : money(Number(c.discountValue) || 0)}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {c.discountType === "PERCENTAGE" ? "Percentage Off" : "Fixed Deduction"}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "thresholds",
                  header: "Spend & Cap",
                  render: (c: Coupon) => (
                    <div className="text-xs space-y-0.5">
                      <div className="text-slate-700">
                        Min: <span className="font-semibold">{c.minAmount ? money(Number(c.minAmount)) : "No min"}</span>
                      </div>
                      {c.maxDiscount ? (
                        <div className="text-slate-500">
                          Max Cap: <span className="font-semibold">{money(Number(c.maxDiscount))}</span>
                        </div>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "usage",
                  header: "Redemptions",
                  align: "center",
                  render: (c: Coupon) => {
                    const count = c.usageCount || 0;
                    const limit = c.usageLimit;
                    const pct = limit ? Math.min(Math.round((count / limit) * 100), 100) : 0;

                    return (
                      <div className="text-center w-28 mx-auto">
                        <span className="text-xs font-bold text-slate-800 tabular-nums">
                          {limit !== null ? `${count} / ${limit}` : `${count} (∞)`}
                        </span>
                        {limit !== null && (
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 100 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-indigo-600"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: "validity",
                  header: "Validity",
                  render: (c: Coupon) => {
                    const today = new Date().toISOString().split("T")[0];
                    const isExpired = c.validTo && c.validTo < today;

                    return (
                      <div className="text-xs text-slate-500">
                        {isExpired ? (
                          <span className="text-red-600 font-semibold">Expired {c.validTo}</span>
                        ) : c.validTo ? (
                          <span>Until {c.validTo}</span>
                        ) : (
                          <span>No expiration</span>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: "status",
                  header: "Status",
                  render: (c: Coupon) => (
                    <button
                      onClick={() => handleToggleStatus(c)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold transition hover:opacity-80 ${
                        c.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                      title="Toggle active status"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  align: "right",
                  render: (c: Coupon) => (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditCoupon(c); setShowModal(true); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Edit Coupon"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: c.id, code: c.code })}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete Coupon"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filteredCoupons}
              rowKey={(c: Coupon) => c.id}
              loading={loading}
              emptyIcon={Ticket}
              emptyMessage={search ? "No coupons found matching your search." : "No coupons created yet. Click 'New Coupon' to create one."}
            />
          </div>
        </div>
      )}

      {/* ──────────────── TAB: VALIDATOR SANDBOX ──────────────── */}
      {tab === "validator" && (
        <CouponValidatorSandbox />
      )}

      {/* ──────────────── TAB: BATCH GENERATOR ──────────────── */}
      {tab === "batch" && (
        <BatchCouponGenerator onCreated={() => { setTab("list"); loadCoupons(); }} />
      )}

      {/* ──────────────── MODAL: CREATE / EDIT COUPON ──────────────── */}
      {showModal && (
        <CouponFormModal
          coupon={editCoupon}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            showToast(editCoupon ? "Coupon updated successfully" : "Coupon created successfully");
            loadCoupons();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Coupon Code"
        message={`Are you sure you want to delete coupon code "${deleteConfirm?.code}"? Customers will no longer be able to redeem this code.`}
        type="DANGER"
        confirmText="Delete Coupon"
        loading={deleting}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// COUPON FORM MODAL
// ────────────────────────────────────────────────────────────

function CouponFormModal({
  coupon,
  onClose,
  onSaved,
}: {
  coupon: Coupon | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: coupon?.code || "",
    description: coupon?.description || "",
    discountType: coupon?.discountType || "PERCENTAGE",
    discountValue: coupon?.discountValue?.toString() || "15",
    minAmount: coupon?.minAmount?.toString() || "",
    maxDiscount: coupon?.maxDiscount?.toString() || "",
    usageLimit: coupon?.usageLimit?.toString() || "",
    validFrom: coupon?.validFrom ? coupon.validFrom.split("T")[0] : "",
    validTo: coupon?.validTo ? coupon.validTo.split("T")[0] : "",
    isActive: coupon?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "SAVE-";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, code }));
  };

  const applyPreset = (p: (typeof COUPON_PRESETS)[0]) => {
    setForm((prev) => ({
      ...prev,
      code: p.code,
      discountType: p.type,
      discountValue: p.value,
      description: p.desc,
      minAmount: p.minAmount,
      maxDiscount: p.maxDiscount,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) {
      setError("Coupon code and discount value are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue) || 0,
        minAmount: form.minAmount ? parseFloat(form.minAmount) : null,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
        isActive: form.isActive,
      };

      if (coupon) {
        await api.put(`/coupons/${coupon.id}`, payload);
      } else {
        await api.post("/coupons", payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {coupon ? "Edit Coupon" : "New Coupon Code"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Define redemption code, discount parameters, and spend ceilings.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>

        {/* Quick Presets */}
        {!coupon && (
          <div className="mt-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 p-3.5">
            <p className="text-xs font-bold text-indigo-900 flex items-center gap-1 mb-2">
              <Sparkles size={13} className="text-indigo-600" /> Popular Presets:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COUPON_PRESETS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-indigo-900 border border-indigo-300/80 shadow-xs hover:bg-indigo-100 active:scale-95 transition"
                >
                  {p.code} ({p.type === "PERCENTAGE" ? `${p.value}%` : `৳${p.value}`})
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Coupon Code *
              </label>
              <button
                type="button"
                onClick={generateRandomCode}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Sparkles size={12} /> Auto-Generate Code
              </button>
            </div>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono uppercase font-bold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. SUMMER2026"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Type *
              </label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Value *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 pl-3.5 pr-8 py-2 text-sm font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="15"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {form.discountType === "PERCENTAGE" ? "%" : "৳"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Minimum Spend (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Optional minimum spend"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Discount Cap (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Max cap amount"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valid From
              </label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valid To (Expiry)
              </label>
              <input
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Usage Limit (Total allowable checkouts)
            </label>
            <input
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Leave empty for unlimited uses"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Social media influencer promo code"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-slate-800">
                Active Coupon (Available for POS redemption)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : coupon ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// COUPON VALIDATOR SANDBOX
// ────────────────────────────────────────────────────────────

function CouponValidatorSandbox() {
  const [testCode, setTestCode] = useState("WELCOME10");
  const [testSubtotal, setTestSubtotal] = useState("2000");
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [validating, setValidating] = useState(false);

  const runValidation = async () => {
    if (!testCode.trim()) return;
    setValidating(true);
    setResult(null);
    setErrorMsg("");

    try {
      const res = await api.post<{ data: any }>("/coupons/validate", {
        code: testCode.trim().toUpperCase(),
        subtotal: parseFloat(testSubtotal) || 0,
      });
      setResult(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Coupon is invalid or not eligible.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Calculator size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Live Coupon Tester & Validator</h3>
            <p className="text-xs text-slate-500">
              Calls the backend validation engine `/api/v1/coupons/validate` to verify live checkout rules.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Coupon Code to Test
            </label>
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-base font-mono uppercase font-bold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. WELCOME10"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Simulated Cart Subtotal (৳)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={testSubtotal}
                onChange={(e) => setTestSubtotal(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 pl-4 pr-12 py-2.5 text-base font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
                placeholder="2000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                BDT
              </span>
            </div>
          </div>

          <button
            onClick={runValidation}
            disabled={validating || !testCode}
            className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Zap size={16} className={validating ? "animate-spin" : ""} />
            {validating ? "Validating with Backend..." : "Validate Coupon Code"}
          </button>
        </div>
      </div>

      <div className="lg:col-span-6 space-y-4">
        {result ? (
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 text-white shadow-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-indigo-900/80 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Validation Successful
                </p>
                <h4 className="text-xl font-bold text-white mt-0.5 font-mono">
                  {testCode}
                </h4>
              </div>
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                Valid & Eligible
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Original Cart Subtotal</span>
                <span className="font-semibold text-white tabular-nums">{money(parseFloat(testSubtotal) || 0)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Deducted Discount</span>
                <span className="font-bold text-emerald-400 tabular-nums">-{money(result.discount)}</span>
              </div>

              <div className="border-t border-indigo-900/80 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-base font-bold text-white">Final Customer Payable</span>
                  <span className="block text-xs text-slate-400">{result.message}</span>
                </div>
                <span className="text-2xl font-black text-white tabular-nums">
                  {money(Math.max((parseFloat(testSubtotal) || 0) - result.discount, 0))}
                </span>
              </div>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-red-800">
              <XCircle size={18} className="text-red-600" />
              <span>Coupon Ineligible / Invalid</span>
            </div>
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
            <Ticket size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Enter a code and click &ldquo;Validate Coupon Code&rdquo; to test.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// BATCH COUPON GENERATOR
// ────────────────────────────────────────────────────────────

function BatchCouponGenerator({ onCreated }: { onCreated: () => void }) {
  const [prefix, setPrefix] = useState("VIP");
  const [count, setCount] = useState("5");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [minAmount, setMinAmount] = useState("500");
  const [usageLimit, setUsageLimit] = useState("1");
  const [generating, setGenerating] = useState(false);
  const [createdCodes, setCreatedCodes] = useState<string[]>([]);
  const [error, setError] = useState("");

  const generateBatch = async () => {
    const numCount = parseInt(count) || 5;
    if (numCount < 1 || numCount > 50) {
      setError("Please generate between 1 and 50 coupons at a time.");
      return;
    }

    setGenerating(true);
    setError("");
    const codes: string[] = [];

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    try {
      for (let i = 0; i < numCount; i++) {
        let code = `${prefix.trim().toUpperCase()}-`;
        for (let j = 0; j < 4; j++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        await api.post("/coupons", {
          code,
          description: `Batch generated ${prefix} campaign coupon`,
          discountType,
          discountValue: parseFloat(discountValue) || 0,
          minAmount: minAmount ? parseFloat(minAmount) : null,
          usageLimit: usageLimit ? parseInt(usageLimit) : 1,
          isActive: true,
        });

        codes.push(code);
      }

      setCreatedCodes(codes);
    } catch (err: any) {
      setError(err.message || "Failed during batch coupon generation.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
          <Dices size={22} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Batch Single-Use Coupon Generator</h3>
          <p className="text-xs text-slate-500">
            Generate unique promotional vouchers for SMS marketing, email campaigns, or VIP gifts.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {createdCodes.length > 0 ? (
        <div className="space-y-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 p-5">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>Successfully Created {createdCodes.length} Unique Coupons!</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {createdCodes.map((c) => (
              <span
                key={c}
                className="font-mono text-xs font-bold rounded-lg bg-white px-2.5 py-1 text-emerald-800 border border-emerald-300 shadow-2xs"
              >
                {c}
              </span>
            ))}
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={onCreated}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
            >
              Back to Coupons List
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Code Prefix
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono font-bold focus:border-purple-500 focus:outline-none uppercase"
                placeholder="VIP"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantity of Coupons
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold focus:border-purple-500 focus:outline-none"
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-medium focus:border-purple-500 focus:outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Value
              </label>
              <input
                type="number"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold focus:border-purple-500 focus:outline-none"
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Minimum Spend (৳)
              </label>
              <input
                type="number"
                step="0.01"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Uses Per Code
              </label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
                placeholder="1"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={generateBatch}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-purple-700 active:scale-95 disabled:opacity-50"
            >
              <Dices size={16} className={generating ? "animate-spin" : ""} />
              {generating ? "Generating Unique Codes..." : `Generate ${count || 5} Promo Codes`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
