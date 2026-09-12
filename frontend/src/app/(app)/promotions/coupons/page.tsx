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
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  ConfirmModal,
} from "@/components/custom";
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
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast(`Coupon code "${code}" copied to clipboard! 📋`);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await api.put(`/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      showToast(`Coupon "${coupon.code}" is now ${!coupon.isActive ? "Active" : "Inactive"}`);
      loadCoupons();
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.del(`/coupons/${deleteConfirm.id}`);
      showToast(`Coupon "${deleteConfirm.code}" deleted successfully`);
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

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = c.isActive && !isExpired;
      else if (statusFilter === "INACTIVE") matchesStatus = !c.isActive;
      else if (statusFilter === "EXPIRED") matchesStatus = !!isExpired;

      const matchesType = typeFilter === "ALL" || c.discountType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [coupons, search, statusFilter, typeFilter]);

  // Derived Stats
  const activeCouponsCount = coupons.filter((c) => {
    const today = new Date().toISOString().split("T")[0];
    return c.isActive && (!c.validTo || c.validTo >= today);
  }).length;

  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-slate-900 text-white border border-slate-700"
              : "bg-red-600 text-white border border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="text-white" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Reusable Application Breadcrumb Header */}
      <CustomBreadcrumb
        title="Coupon Codes & Vouchers"
        icon={<Ticket size={20} />}
        items={[
          { label: "Sales", href: "/sales" },
          { label: "Promotions", href: "/promotions" },
          { label: "Coupons" },
        ]}
        description="Generate alphanumeric coupon codes, configure single-use or multi-use thresholds, and test codes in real time."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/promotions">
              <CustomButton
                size="sm"
                variant="outline"
                leftIcon={<Tag size={14} />}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                All Campaigns
              </CustomButton>
            </Link>
            <CustomButton
              size="sm"
              variant="outline"
              leftIcon={<Dices size={14} />}
              onClick={() => setTab("batch")}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Batch Generator
            </CustomButton>
            <CustomButton
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setEditCoupon(null);
                setShowModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              New Coupon
            </CustomButton>
            <button
              onClick={() => loadCoupons()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Refresh Coupons"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CustomStatCard
          label="Active Coupons"
          value={`${activeCouponsCount} / ${coupons.length}`}
          icon={Ticket}
          tone="primary"
        />
        <CustomStatCard
          label="Total Redemptions"
          value={String(totalRedemptions)}
          icon={Sparkles}
          tone="amber"
        />
        <CustomStatCard
          label="POS Validation API"
          value="Live Endpoint"
          icon={Zap}
          tone="green"
        />
        <CustomStatCard
          label="Discount Modes"
          value="Fixed & Percentage"
          icon={Percent}
          tone="blue"
        />
      </div>

      {/* Tab Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTab("list")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === "list"
                ? "bg-teal-50 text-teal-700 border border-teal-200 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Ticket size={14} className={tab === "list" ? "text-teal-600" : "text-slate-400"} />
            <span>All Coupon Codes</span>
            <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
              {coupons.length}
            </span>
          </button>
          <button
            onClick={() => setTab("validator")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === "validator"
                ? "bg-teal-50 text-teal-700 border border-teal-200 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Calculator size={14} className={tab === "validator" ? "text-teal-600" : "text-slate-400"} />
            <span>Live POS Coupon Tester</span>
          </button>
          <button
            onClick={() => setTab("batch")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === "batch"
                ? "bg-teal-50 text-teal-700 border border-teal-200 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Dices size={14} className={tab === "batch" ? "text-teal-600" : "text-slate-400"} />
            <span>Batch Code Generator</span>
          </button>
        </div>
      </div>

      {/* ──────────────── TAB: LIST ──────────────── */}
      {tab === "list" && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search coupons by code or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
                <option value="EXPIRED">Expired Only</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              >
                <option value="ALL">All Discount Types</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs">
            <CustomTable
              columns={[
                {
                  key: "code",
                  header: "Coupon Code",
                  render: (c: Coupon) => (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 tracking-wider">
                        {c.code}
                      </span>
                      <button
                        onClick={() => copyCode(c.code)}
                        className="p-1 text-slate-400 hover:text-teal-600 transition"
                        title="Copy code"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  ),
                },
                {
                  key: "description",
                  header: "Description / Promotion",
                  render: (c: Coupon) => (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        {c.description || "Direct coupon code"}
                      </p>
                      {c.promotion && (
                        <p className="text-[11px] text-teal-700">
                          Linked: {c.promotion.name}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  key: "discount",
                  header: "Benefit",
                  align: "right",
                  render: (c: Coupon) => (
                    <span className="font-bold text-teal-700 text-xs tabular-nums">
                      {c.discountType === "PERCENTAGE"
                        ? `${c.discountValue}% OFF`
                        : money(Number(c.discountValue) || 0)}
                    </span>
                  ),
                },
                {
                  key: "thresholds",
                  header: "Spend & Cap",
                  render: (c: Coupon) => (
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p>Min: {c.minAmount ? money(Number(c.minAmount)) : "None"}</p>
                      {c.maxDiscount ? (
                        <p className="text-slate-400">Cap: {money(Number(c.maxDiscount))}</p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "usage",
                  header: "Redemptions",
                  align: "center",
                  render: (c: Coupon) => (
                    <span className="text-xs font-medium text-slate-700">
                      <strong className="text-slate-900">{c.usageCount || 0}</strong>
                      <span className="text-slate-400"> / {c.usageLimit ? c.usageLimit : "∞"}</span>
                    </span>
                  ),
                },
                {
                  key: "validity",
                  header: "Valid Through",
                  render: (c: Coupon) => (
                    <span className="text-xs text-slate-500">
                      {c.validTo ? c.validTo : "No Expiry"}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  align: "center",
                  render: (c: Coupon) => (
                    <button
                      onClick={() => handleToggleStatus(c)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition hover:opacity-80 ${
                        c.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  align: "center",
                  render: (c: Coupon) => (
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditCoupon(c);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"
                        title="Edit Coupon"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: c.id, code: c.code })}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Delete Coupon"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filteredCoupons}
              rowKey={(c: Coupon) => c.id}
              loading={loading}
              emptyIcon={Ticket}
              emptyMessage="No coupon codes match your filter criteria."
            />
          </div>
        </div>
      )}

      {/* ──────────────── TAB: VALIDATOR TESTER ──────────────── */}
      {tab === "validator" && (
        <CouponValidatorTester onApplied={() => {}} />
      )}

      {/* ──────────────── TAB: BATCH GENERATOR ──────────────── */}
      {tab === "batch" && (
        <BatchCouponGenerator
          onCreated={() => {
            loadCoupons();
            setTab("list");
            showToast("Batch single-use promo codes generated successfully! 🎉");
          }}
        />
      )}

      {/* ──────────────── MODAL: CREATE / EDIT ──────────────── */}
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Coupon Code"
        message={`Are you sure you want to delete coupon "${deleteConfirm?.code}"? Shoppers will no longer be able to redeem this code at POS checkout.`}
        type="DANGER"
        confirmText="Delete Coupon"
        loading={deleting}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// COUPON FORM MODAL
// ───────────────────────────────────────────────────────────

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
    discountValue: coupon?.discountValue?.toString() || "10",
    minAmount: coupon?.minAmount?.toString() || "",
    maxDiscount: coupon?.maxDiscount?.toString() || "",
    usageLimit: coupon?.usageLimit?.toString() || "",
    validFrom: coupon?.validFrom ? coupon.validFrom.split("T")[0] : "",
    validTo: coupon?.validTo ? coupon.validTo.split("T")[0] : "",
    isActive: coupon?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applyPreset = (preset: (typeof COUPON_PRESETS)[0]) => {
    setForm((prev) => ({
      ...prev,
      code: preset.code,
      discountType: preset.type,
      discountValue: preset.value,
      description: preset.desc,
      minAmount: preset.minAmount,
      maxDiscount: preset.maxDiscount,
    }));
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, code: res }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) {
      setError("Please provide a coupon code and discount value.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-700">
              {coupon ? "Edit Coupon Code" : "New Coupon Code"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure promo code, discount mode, spend thresholds, and expiry.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XCircle size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        {!coupon && (
          <div className="mt-3 rounded-md bg-teal-50/60 border border-teal-200/60 p-3">
            <p className="text-xs font-bold text-teal-900 flex items-center gap-1 mb-2">
              <Sparkles size={13} className="text-teal-600" /> Fast Setup Presets:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COUPON_PRESETS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-teal-800 border border-teal-200 shadow-2xs hover:bg-teal-100 transition font-mono"
                >
                  {p.code} ({p.value}{p.type === "PERCENTAGE" ? "%" : "৳"})
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-4 space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Coupon Code *
              </label>
              <button
                type="button"
                onClick={generateRandomCode}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Sparkles size={12} /> Auto-Generate
              </button>
            </div>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition uppercase"
              placeholder="e.g. SUMMER2026"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Discount Type *
              </label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                  className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-3 pr-7 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
                  placeholder="10"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {form.discountType === "PERCENTAGE" ? "%" : "৳"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Min. Order Spend (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
                placeholder="Optional min spend"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Discount Cap (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
                placeholder="Optional cap"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Valid From
              </label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Valid To (Expiry)
              </label>
              <input
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Usage Limit (Total checkouts)
            </label>
            <input
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              placeholder="Leave blank for unlimited"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              placeholder="e.g. 10% discount for first-time website & POS customers"
            />
          </div>

          <div className="rounded-md bg-slate-50 p-2.5 border border-slate-200">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Active & Redeemable at Checkout
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              size="sm"
              loading={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              {coupon ? "Update Coupon" : "Create Coupon"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// LIVE POS VALIDATOR TESTER
// ────────────────────────────────────────────────────────────

function CouponValidatorTester({ onApplied }: { onApplied?: () => void }) {
  const [code, setCode] = useState("WELCOME10");
  const [subtotal, setSubtotal] = useState("2000");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setTesting(true);
    setResult(null);

    try {
      const res: any = await api.post("/coupons/validate", {
        code: code.trim().toUpperCase(),
        cartSubtotal: parseFloat(subtotal) || 0,
      });
      setResult(res?.data || res);
    } catch (err: any) {
      setResult({
        valid: false,
        message: err.message || "Failed to reach validator API",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-6 bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-600 border border-teal-100">
            <Calculator size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-700">Live POS Checkout Validation</h3>
            <p className="text-[11px] text-slate-500">
              Query backend endpoint: <code>POST /api/v1/coupons/validate</code>
            </p>
          </div>
        </div>

        <form onSubmit={testValidation} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Enter Coupon Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition uppercase"
              placeholder="e.g. WELCOME10"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Simulated Cart Subtotal (৳)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition tabular-nums"
              placeholder="2000"
            />
          </div>

          <CustomButton
            type="submit"
            size="sm"
            loading={testing}
            leftIcon={<Zap size={14} />}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
          >
            Validate & Compute Discount
          </CustomButton>
        </form>
      </div>

      <div className="lg:col-span-6 bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              API Response
            </p>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
              {result ? (result.valid ? "Coupon Approved" : "Coupon Rejected") : "Awaiting Code Input"}
            </h4>
          </div>
          {result && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                result.valid
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.valid ? "STATUS: VALID" : "STATUS: INVALID"}
            </span>
          )}
        </div>

        {result ? (
          <div className="space-y-3">
            <div
              className={`p-3 rounded-md text-xs font-medium flex items-center gap-2 ${
                result.valid
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {result.valid ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-red-600" />}
              <span>{result.message}</span>
            </div>

            {result.valid && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Cart Subtotal</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {money(parseFloat(subtotal) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount Applied</span>
                  <span className="font-bold text-teal-700 tabular-nums">
                    -{money(result.discount || 0)}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Final Payable Total</span>
                  <span className="text-base font-black text-teal-700 tabular-nums">
                    {money(result.finalTotal || 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Submit a coupon code and cart total on the left to test backend validation rules.
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
  const [prefix, setPrefix] = useState("PROMO");
  const [count, setCount] = useState("5");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [minAmount, setMinAmount] = useState("1000");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const submitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError("");

    try {
      const numCount = parseInt(count) || 1;
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

      for (let i = 0; i < numCount; i++) {
        let randomSuffix = "";
        for (let j = 0; j < 5; j++) {
          randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const generatedCode = `${prefix.trim().toUpperCase()}-${randomSuffix}`;

        await api.post("/coupons", {
          code: generatedCode,
          description: `Batch promo (${prefix.trim().toUpperCase()})`,
          discountType,
          discountValue: parseFloat(discountValue) || 0,
          minAmount: minAmount ? parseFloat(minAmount) : null,
          usageLimit: 1, // Single-use promo codes
          isActive: true,
        });
      }

      onCreated();
    } catch (err: any) {
      setError(err.message || "Failed to generate batch coupons.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-md border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-600 border border-teal-100">
          <Dices size={16} />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-700">Batch Single-Use Coupon Generator</h3>
          <p className="text-[11px] text-slate-500">
            Generate unique alphanumeric voucher codes for flyer distribution or SMS campaigns.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submitBatch} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Code Prefix
            </label>
            <input
              type="text"
              required
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition uppercase"
              placeholder="PROMO"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Quantity of Codes
            </label>
            <input
              type="number"
              min="1"
              max="50"
              required
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              placeholder="5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Discount Type
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (৳)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Discount Value
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              placeholder="10"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Min. Order Spend (৳)
          </label>
          <input
            type="number"
            step="0.01"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            placeholder="1000"
          />
        </div>

        <div className="flex justify-end pt-2">
          <CustomButton
            type="submit"
            size="sm"
            loading={generating}
            leftIcon={<Dices size={14} />}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
          >
            Generate {count} Single-Use Vouchers
          </CustomButton>
        </div>
      </form>
    </div>
  );
}
