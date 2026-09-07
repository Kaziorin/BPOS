"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2, ArrowLeft, ClipboardList, Plus, Send, CheckCircle, XCircle,
  ShoppingCart, X, Search, Filter, Eye, Printer, Building2, Calendar,
  Barcode, Trash2, Package, AlertCircle, TrendingUp, Clock, Check,
  ChevronRight, ArrowUpDown, LayoutGrid, ListFilter, RefreshCw, FileText,
  Boxes, Layers, Info, Sparkles, Minus, PackageCheck, Undo2
} from "lucide-react";
import { api } from "@/lib/api";

interface ReqItem {
  id?: string;
  productId: string;
  qty: string | number;
  estUnitPrice: string | number;
  product?: { id: string; name: string; sku: string; barcode?: string | null };
  productName?: string;
  sku?: string;
}

interface Requisition {
  id: string;
  prNo: string;
  requestDate: string;
  expectedDate: string | null;
  status: string;
  requestedBy: string;
  approvedBy: string | null;
  rejectionReason: string | null;
  note: string | null;
  warehouseId?: string;
  warehouseName?: string;
  items: ReqItem[];
  purchaseOrders?: { id: string; poNo: string; total: string }[];
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  costPrice: number | string;
  unit?: { name: string } | null;
}

interface WarehouseOption {
  id: string;
  name: string;
  code?: string;
  branch?: { id: string; name: string };
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string; bg: string }> = {
  DRAFT: {
    label: "Draft",
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
    bg: "bg-slate-500/10",
  },
  SUBMITTED: {
    label: "Pending Approval",
    badge: "border-amber-200 bg-amber-50/80 text-amber-800",
    dot: "bg-amber-500 animate-pulse",
    bg: "bg-amber-500/10",
  },
  APPROVED: {
    label: "Approved",
    badge: "border-emerald-200 bg-emerald-50/80 text-emerald-800",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
  },
  REJECTED: {
    label: "Rejected",
    badge: "border-rose-200 bg-rose-50/80 text-rose-800",
    dot: "bg-rose-500",
    bg: "bg-rose-500/10",
  },
  CONVERTED: {
    label: "Converted → PO",
    badge: "border-purple-200 bg-purple-50/80 text-purple-800",
    dot: "bg-purple-500",
    bg: "bg-purple-500/10",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "border-gray-200 bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
    bg: "bg-gray-400/10",
  },
};

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // View mode: Table vs Cards
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("");

  // Create PR modal state
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ warehouseId: "", expectedDate: "", note: "" });
  const [lines, setLines] = useState<{ productId: string; qty: string; estUnitPrice: string }[]>([]);
  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Reject modal state
  const [rejectingReq, setRejectingReq] = useState<Requisition | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSaving, setRejectSaving] = useState(false);

  // Convert to PO modal state
  const [convertingReq, setConvertingReq] = useState<Requisition | null>(null);
  const [convertForm, setConvertForm] = useState({ supplierId: "", warehouseId: "", expectedDate: "", rebatePercent: "0" });
  const [convertLines, setConvertLines] = useState<{ productId: string; qty: string; unitPrice: string }[]>([]);
  const [convertSaving, setConvertSaving] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  // View PR Details modal state
  const [viewReq, setViewReq] = useState<Requisition | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, supRes, prodRes, whRes] = await Promise.all([
        api.get<{ data: Requisition[] }>("/purchasing/requisitions?limit=100"),
        api.get<{ data: any[] }>("/suppliers?limit=100").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/products?limit=300").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/warehouses?limit=100").catch(() => ({ data: [] as any[] })),
      ]);

      const rawReqs = (reqRes as any)?.data ?? reqRes;
      setRequisitions(Array.isArray(rawReqs) ? rawReqs : (rawReqs as any)?.data ?? []);

      const sups = (supRes.data as any)?.data ?? supRes.data ?? [];
      setSuppliers(Array.isArray(sups) ? sups.map((s: any) => ({ id: s.id, name: s.name })) : []);

      const prods = (prodRes.data as any)?.data ?? prodRes.data ?? [];
      setProducts(Array.isArray(prods) ? prods : []);

      const whList = (whRes.data as any)?.data ?? whRes.data ?? [];
      setWarehouses(Array.isArray(whList) ? whList : []);
    } catch (err: any) {
      setError(err.message || "Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Barcode / SKU scan handler
  function handleScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = scanInput.trim().toLowerCase();
      if (!code) return;

      const matchedProd = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code) ||
          (p.sku && p.sku.toLowerCase() === code) ||
          p.name.toLowerCase().includes(code)
      );

      if (matchedProd) {
        const existingIdx = lines.findIndex((l) => l.productId === matchedProd.id);
        if (existingIdx >= 0) {
          setLines(
            lines.map((l, i) =>
              i === existingIdx ? { ...l, qty: String(Number(l.qty || 0) + 1) } : l
            )
          );
        } else {
          setLines([
            ...lines,
            {
              productId: matchedProd.id,
              qty: "1",
              estUnitPrice: String(Number(matchedProd.costPrice) || 0),
            },
          ]);
        }
        setScanInput("");
        setModalError(null);
      } else {
        setModalError(`No product found matching "${scanInput}"`);
      }
    }
  }

  function addProductToLines(prodId: string) {
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const existingIdx = lines.findIndex((l) => l.productId === prodId);
    if (existingIdx >= 0) {
      setLines(
        lines.map((l, i) =>
          i === existingIdx ? { ...l, qty: String(Number(l.qty || 0) + 1) } : l
        )
      );
    } else {
      setLines([
        ...lines,
        {
          productId: prod.id,
          qty: "1",
          estUnitPrice: String(Number(prod.costPrice) || 0),
        },
      ]);
    }
  }

  function updateLine(index: number, field: "qty" | "estUnitPrice" | "productId", val: string) {
    setLines(
      lines.map((l, i) => {
        if (i !== index) return l;
        if (field === "productId") {
          const prod = products.find((p) => p.id === val);
          return {
            ...l,
            productId: val,
            estUnitPrice: prod ? String(Number(prod.costPrice) || 0) : l.estUnitPrice,
          };
        }
        return { ...l, [field]: val };
      })
    );
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  function openCreateModal() {
    setForm({
      warehouseId: warehouses[0]?.id || "",
      expectedDate: "",
      note: "",
    });
    setLines(
      products.length > 0
        ? [{ productId: products[0].id, qty: "1", estUnitPrice: String(Number(products[0].costPrice) || 0) }]
        : []
    );
    setScanInput("");
    setModalError(null);
    setShowModal(true);
    setTimeout(() => scanInputRef.current?.focus(), 150);
  }

  async function act(id: string, action: "submit" | "approve", label: string) {
    setBusy(id + action);
    try {
      await api.post(`/purchasing/requisitions/${id}/${action}`, {});
      notify(true, label);
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingReq) return;
    setRejectSaving(true);
    try {
      await api.post(`/purchasing/requisitions/${rejectingReq.id}/reject`, {
        reason: rejectReason || "Rejected by department manager",
      });
      notify(true, `Requisition ${rejectingReq.prNo} rejected`);
      setRejectingReq(null);
      setRejectReason("");
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally {
      setRejectSaving(false);
    }
  }

  function openConvert(req: Requisition) {
    setConvertingReq(req);
    setConvertError(null);
    setConvertForm({
      supplierId: suppliers[0]?.id || "",
      warehouseId: req.warehouseId || warehouses[0]?.id || "",
      expectedDate: req.expectedDate ? req.expectedDate.split("T")[0] : "",
      rebatePercent: "0",
    });
    setConvertLines(
      (req.items || []).map((it) => ({
        productId: it.productId,
        qty: String(Number(it.qty) || 1),
        unitPrice: String(Number(it.estUnitPrice) || 0),
      }))
    );
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!convertingReq) return;
    setConvertSaving(true);
    setConvertError(null);
    try {
      const items = convertLines
        .filter((l) => l.productId && Number(l.qty) > 0)
        .map((l) => ({ productId: l.productId, qty: Number(l.qty), unitPrice: Number(l.unitPrice) }));
      if (items.length === 0) throw new Error("Please add at least one item to convert");
      if (!convertForm.supplierId) throw new Error("Please select a supplier");

      const res = await api.post<{ data: { poNo: string; id: string } }>("/purchasing/orders", {
        requisitionId: convertingReq.id,
        supplierId: convertForm.supplierId,
        warehouseId: convertForm.warehouseId || undefined,
        expectedDate: convertForm.expectedDate || undefined,
        rebatePercent: convertForm.rebatePercent ? Number(convertForm.rebatePercent) : 0,
        items,
      });

      setConvertingReq(null);
      notify(true, `PO ${(res as any)?.data?.poNo ?? "created"} generated successfully from PR!`);
      await load();
    } catch (err: any) {
      setConvertError(err.response?.data?.error || err.message);
    } finally {
      setConvertSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      const validItems = lines
        .filter((l) => l.productId && Number(l.qty) > 0)
        .map((l) => ({ productId: l.productId, qty: Number(l.qty), estUnitPrice: Number(l.estUnitPrice) || 0 }));
      if (validItems.length === 0) throw new Error("Please add at least one valid product line");
      if (!form.warehouseId) throw new Error("Please select a target warehouse");

      await api.post("/purchasing/requisitions", {
        warehouseId: form.warehouseId,
        expectedDate: form.expectedDate || undefined,
        note: form.note || undefined,
        items: validItems,
      });

      setShowModal(false);
      notify(true, "Purchase Requisition created successfully!");
      await load();
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const inputCls = "mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition";

  // KPIs
  const totalCount = requisitions.length;
  const pendingApprovalCount = requisitions.filter((r) => r.status === "SUBMITTED").length;
  const approvedCount = requisitions.filter((r) => r.status === "APPROVED").length;
  const convertedCount = requisitions.filter((r) => r.status === "CONVERTED").length;
  const totalEstVal = requisitions.reduce((s, r) => s + (r.items || []).reduce((acc, i) => acc + Number(i.qty) * Number(i.estUnitPrice), 0), 0);

  const filteredRequisitions = requisitions.filter((req) => {
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const matchesWh = !warehouseFilter || req.warehouseId === warehouseFilter;
    const matchesSearch =
      !searchTerm ||
      req.prNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.note && req.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.items && req.items.some((it) => (it.productName || it.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesStatus && matchesWh && matchesSearch;
  });

  const totalLinesCount = lines.length;
  const totalUnitsCount = lines.reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
  const grandEstTotal = lines.reduce((acc, l) => acc + (Number(l.qty) || 0) * (Number(l.estUnitPrice) || 0), 0);

  return (
    <div className="w-full space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP NAV BREADCRUMB & PURCHASING SUITE TABS                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Link href="/purchasing" className="hover:text-primary-600 transition">Purchasing Hub</Link>
            <ChevronRight size={13} className="text-gray-400" />
            <span className="text-gray-900 font-bold">Purchase Requisitions</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Purchase Requisitions</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
            Internal department procurement requests → multi-tier approval → 1-click PO conversion
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={17} className={loading ? "animate-spin text-primary-600" : ""} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 active:scale-[0.98]"
          >
            <Plus size={18} /> New Requisition
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-sm">
        {[
          { href: "/purchasing", label: "Overview", icon: Layers },
          { href: "/purchasing/requisitions", label: "Requisitions (PR)", icon: ClipboardList, active: true },
          { href: "/purchasing/orders", label: "Purchase Orders (PO)", icon: ShoppingCart },
          { href: "/purchasing/grns", label: "Goods Received (GRN)", icon: PackageCheck },
          { href: "/purchasing/returns", label: "Returns & Debit Notes", icon: Undo2 },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              tab.active
                ? "bg-primary-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`flex items-center gap-2.5 rounded-2xl border p-4 text-sm font-bold shadow-md transition animate-in fade-in slide-in-from-top-2 ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>
          {toast.ok ? <CheckCircle size={20} className="text-emerald-600 shrink-0" /> : <XCircle size={20} className="text-rose-600 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={load} className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 hover:bg-rose-200">
            Retry
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP METRIC KPI CARDS                                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Requisitions",
            value: totalCount,
            sub: `${fmt(totalEstVal)} est. value`,
            icon: ClipboardList,
            bg: "bg-blue-50 text-blue-600 border-blue-100",
            valCls: "text-gray-900",
          },
          {
            label: "Pending Approvals",
            value: pendingApprovalCount,
            sub: "Requires manager sign-off",
            icon: Clock,
            bg: "bg-amber-50 text-amber-600 border-amber-100",
            valCls: "text-amber-700",
            pulse: pendingApprovalCount > 0,
          },
          {
            label: "Approved Requisitions",
            value: approvedCount,
            sub: "Ready for PO conversion",
            icon: CheckCircle,
            bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
            valCls: "text-emerald-700",
          },
          {
            label: "Converted to PO",
            value: convertedCount,
            sub: "Official orders created",
            icon: ShoppingCart,
            bg: "bg-purple-50 text-purple-600 border-purple-100",
            valCls: "text-purple-700",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{card.label}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${card.bg}`}>
                <card.icon size={19} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-black tabular-nums tracking-tight ${card.valCls}`}>
                {loading ? "—" : card.value}
              </span>
              {card.pulse && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-medium text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. ENTERPRISE FILTER & SEARCH TOOLBAR                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3 rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative min-w-[260px] flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PR #, product, or note…"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Warehouse filter */}
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:border-primary-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} {w.code ? `(${w.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Status Pill Filters & View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1">
            {[
              { key: "ALL", label: "All" },
              { key: "SUBMITTED", label: "Pending" },
              { key: "APPROVED", label: "Approved" },
              { key: "CONVERTED", label: "Converted" },
              { key: "DRAFT", label: "Draft" },
              { key: "REJECTED", label: "Rejected" },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-xl p-1.5 transition ${viewMode === "table" ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:text-gray-700"}`}
              title="Table View"
            >
              <ListFilter size={17} />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`rounded-xl p-1.5 transition ${viewMode === "cards" ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:text-gray-700"}`}
              title="Card View"
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN DATA LISTING (TABLE OR CARDS)                                    */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 space-y-3">
          <Loader2 size={36} className="animate-spin text-primary-600" />
          <p className="text-sm font-semibold text-gray-500">Loading purchase requisitions…</p>
        </div>
      ) : filteredRequisitions.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-50 text-primary-600">
            <ClipboardList size={32} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No Purchase Requisitions Found</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {searchTerm || statusFilter !== "ALL" || warehouseFilter
              ? "No requisitions matched your current filters. Try resetting the search terms."
              : "Create an internal requisition to request stock from warehouse or generate a purchase order for suppliers."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {searchTerm || statusFilter !== "ALL" || warehouseFilter ? (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setWarehouseFilter(""); }}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            ) : null}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary-600/20 hover:bg-primary-700"
            >
              <Plus size={16} /> Create Requisition
            </button>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW (HIGH-DENSITY ENTERPRISE GRID) */
        <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-black uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">PR Number</th>
                  <th className="py-3.5 px-4">Warehouse & Request Date</th>
                  <th className="py-3.5 px-4">Requested Products</th>
                  <th className="py-3.5 px-4 text-right">Est. Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequisitions.map((req) => {
                  const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.DRAFT;
                  const items = Array.isArray(req.items) ? req.items : [];
                  const purchaseOrders = Array.isArray(req.purchaseOrders) ? req.purchaseOrders : [];
                  const total = items.reduce((s, i) => s + Number(i.qty) * Number(i.estUnitPrice), 0);
                  const whObj = warehouses.find((w) => w.id === req.warehouseId);

                  return (
                    <tr key={req.id} className="group transition hover:bg-gray-50/80">
                      {/* PR Number */}
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-mono text-xs font-bold text-blue-700">
                            PR
                          </div>
                          <div>
                            <button
                              onClick={() => setViewReq(req)}
                              className="font-mono text-sm font-black text-gray-900 hover:text-primary-600 transition"
                            >
                              {req.prNo}
                            </button>
                            {req.expectedDate && (
                              <p className="text-[11px] font-medium text-gray-400">
                                Due: {new Date(req.expectedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Warehouse & Request Date */}
                      <td className="py-4 px-4">
                        <p className="font-bold text-gray-900">{whObj?.name || req.warehouseName || "Main Warehouse"}</p>
                        <p className="text-xs text-gray-400">{new Date(req.requestDate).toLocaleDateString()}</p>
                      </td>

                      {/* Requested Products */}
                      <td className="py-4 px-4">
                        <div className="flex max-w-sm flex-wrap gap-1.5">
                          {items.slice(0, 3).map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700"
                            >
                              {it.productName || it.product?.name || "Product"} × <strong className="ml-1 text-gray-900">{Number(it.qty)}</strong>
                            </span>
                          ))}
                          {items.length > 3 && (
                            <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
                              +{items.length - 3} more
                            </span>
                          )}
                        </div>
                        {req.note && (
                          <p className="mt-1 text-[11px] italic text-gray-400 truncate max-w-xs">&quot;{req.note}&quot;</p>
                        )}
                      </td>

                      {/* Est Total */}
                      <td className="py-4 px-4 text-right font-black tabular-nums text-gray-900">
                        {fmt(total)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        {purchaseOrders.length > 0 && (
                          <span className="mt-1 block text-[10px] font-bold text-purple-700">
                            PO: {purchaseOrders.map((p) => p.poNo).join(", ")}
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === "DRAFT" && (
                            <button
                              onClick={() => act(req.id, "submit", `PR ${req.prNo} submitted for approval`)}
                              disabled={busy === req.id + "submit"}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              {busy === req.id + "submit" ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                              Submit
                            </button>
                          )}

                          {req.status === "SUBMITTED" && (
                            <>
                              <button
                                onClick={() => act(req.id, "approve", `PR ${req.prNo} approved`)}
                                disabled={busy === req.id + "approve"}
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {busy === req.id + "approve" ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}
                                Approve
                              </button>
                              <button
                                onClick={() => { setRejectingReq(req); setRejectReason(""); }}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {req.status === "APPROVED" && (
                            <button
                              onClick={() => openConvert(req)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                            >
                              <ShoppingCart size={13} /> Convert to PO
                            </button>
                          )}

                          <button
                            onClick={() => setViewReq(req)}
                            className="rounded-xl border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            title="View Voucher"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequisitions.map((req) => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.DRAFT;
            const items = Array.isArray(req.items) ? req.items : [];
            const purchaseOrders = Array.isArray(req.purchaseOrders) ? req.purchaseOrders : [];
            const total = items.reduce((s, i) => s + Number(i.qty) * Number(i.estUnitPrice), 0);
            const whObj = warehouses.find((w) => w.id === req.warehouseId);

            return (
              <div
                key={req.id}
                className="flex flex-col justify-between rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-base font-black text-gray-900">{req.prNo}</span>
                      <p className="text-xs text-gray-400">
                        {whObj?.name || req.warehouseName || "Warehouse"} · {new Date(req.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate max-w-[180px]">
                          {it.productName || it.product?.name || "Product"}
                        </span>
                        <span className="font-bold text-gray-900">
                          {Number(it.qty)} × {fmt(Number(it.estUnitPrice))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Est. Total</span>
                      <p className="text-lg font-black text-gray-900">{fmt(total)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status === "APPROVED" && (
                        <button
                          onClick={() => openConvert(req)}
                          className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                        >
                          Convert PO
                        </button>
                      )}
                      <button
                        onClick={() => setViewReq(req)}
                        className="rounded-xl border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. NEW PURCHASE REQUISITION MODAL (PRODUCTION WIDE LAYOUT)               */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setShowModal(false)}>
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-7 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-gray-900">New Purchase Requisition</h2>
                  <p className="text-xs font-medium text-gray-500">Scan barcodes or add items from catalog to create internal request</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-2xl border border-gray-200 bg-white p-2 text-gray-400 shadow-sm transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Error */}
            {modalError && (
              <div className="mx-7 mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-semibold text-rose-700">
                <AlertCircle size={18} /> {modalError}
              </div>
            )}

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="flex flex-1 flex-col overflow-y-auto p-7 space-y-6">
              {/* Top Configuration Card */}
              <div className="grid grid-cols-1 gap-5 rounded-3xl border border-gray-200/80 bg-gray-50/60 p-5 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Target Warehouse *</label>
                  <select
                    value={form.warehouseId}
                    onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                    className={inputCls}
                    required
                  >
                    <option value="">Select Warehouse…</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.code ? `(${w.code})` : ""} {w.branch?.name ? `· ${w.branch.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={form.expectedDate}
                    onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                    className={inputCls}
                  />
                  <div className="mt-1.5 flex gap-1.5">
                    {[
                      { label: "+3 Days", days: 3 },
                      { label: "+7 Days", days: 7 },
                      { label: "+14 Days", days: 14 },
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.label}
                        onClick={() => {
                          const target = new Date();
                          target.setDate(target.getDate() + d.days);
                          setForm({ ...form, expectedDate: target.toISOString().split("T")[0] });
                        }}
                        className="rounded-lg bg-white border border-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600 hover:bg-gray-100 shadow-2xs"
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Business Justification / Note</label>
                  <input
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Weekly stock replenishment"
                  />
                </div>
              </div>

              {/* Barcode Scanner & Quick Add Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Barcode size={17} className="text-primary-600" />
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-800">Scan or Quick Add Products</label>
                  </div>
                  <span className="text-xs font-medium text-gray-400">Press enter after typing to auto-add</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {/* Barcode Scanner Input */}
                  <div className="relative min-w-[280px] flex-1">
                    <Barcode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-600" />
                    <input
                      ref={scanInputRef}
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={handleScan}
                      placeholder="Scan Barcode or Type SKU & press Enter…"
                      className="w-full rounded-2xl border-2 border-primary-500/30 bg-primary-50/20 py-2.5 pl-10 pr-4 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                    />
                  </div>

                  {/* Quick Product Select Dropdown */}
                  <div className="min-w-[280px] flex-1">
                    <select
                      onChange={(e) => {
                        addProductToLines(e.target.value);
                        e.target.value = "";
                      }}
                      className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 px-3.5 text-sm font-semibold text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      defaultValue=""
                    >
                      <option value="" disabled>+ Choose product from catalog…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — ৳{Number(p.costPrice || 0).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-black uppercase tracking-wider text-gray-600">
                    <tr>
                      <th className="py-3 pl-4 pr-2 w-10">#</th>
                      <th className="py-3 px-4">Product Name & SKU</th>
                      <th className="py-3 px-4 w-44 text-center">Requisition Qty</th>
                      <th className="py-3 px-4 w-40 text-right">Est. Unit Cost (৳)</th>
                      <th className="py-3 px-4 w-44 text-right">Line Total (৳)</th>
                      <th className="py-3 pl-2 pr-4 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm font-medium text-gray-400">
                          <Package size={32} className="mx-auto mb-2 text-gray-300" />
                          No items added to this requisition yet. Use the barcode scanner or catalog selector above.
                        </td>
                      </tr>
                    ) : (
                      lines.map((line, idx) => {
                        const prod = products.find((p) => p.id === line.productId);
                        const qtyNum = Number(line.qty) || 0;
                        const priceNum = Number(line.estUnitPrice) || 0;
                        const lineTotal = qtyNum * priceNum;

                        return (
                          <tr key={idx} className="transition hover:bg-gray-50/60">
                            <td className="py-3 pl-4 pr-2 text-xs font-bold text-gray-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <select
                                value={line.productId}
                                onChange={(e) => updateLine(idx, "productId", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-900 focus:border-primary-500 focus:outline-none"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateLine(idx, "qty", String(Math.max(qtyNum - 1, 1)))}
                                  className="h-8 w-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={line.qty}
                                  onChange={(e) => updateLine(idx, "qty", e.target.value)}
                                  className="w-20 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-center text-sm font-black tabular-nums text-gray-900 focus:border-primary-500 focus:outline-none"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => updateLine(idx, "qty", String(qtyNum + 1))}
                                  className="h-8 w-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.estUnitPrice}
                                onChange={(e) => updateLine(idx, "estUnitPrice", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-right text-sm font-bold tabular-nums text-gray-900 focus:border-primary-500 focus:outline-none"
                                placeholder="0.00"
                                required
                              />
                            </td>
                            <td className="py-3 px-4 text-right font-black tabular-nums text-gray-900">
                              {fmt(lineTotal)}
                            </td>
                            <td className="py-3 pl-2 pr-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeLine(idx)}
                                className="rounded-xl p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Sticky Summary & Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/80 p-5 rounded-3xl shadow-inner">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Items</span>
                    <p className="text-base font-black text-gray-900">{totalLinesCount} lines ({totalUnitsCount} units)</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600">Est. Total Amount</span>
                    <p className="text-2xl font-black text-primary-700">{fmt(grandEstTotal)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-2xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || lines.length === 0}
                    className="flex items-center gap-2 rounded-2xl bg-primary-600 px-7 py-2.5 text-sm font-black text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <ClipboardList size={17} />}
                    Create Requisition
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CONVERT PR TO PO MODAL                                                */}
      {/* ========================================================================= */}
      {convertingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setConvertingReq(null)}>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">1-Click Convert</span>
                  <h2 className="text-xl font-black text-gray-900">PR #{convertingReq.prNo} → Purchase Order</h2>
                </div>
                <p className="text-xs font-medium text-gray-500">Select supplier and confirm negotiated purchase order prices</p>
              </div>
              <button onClick={() => setConvertingReq(null)} className="rounded-2xl border border-gray-200 p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            {convertError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-semibold text-rose-700">
                <AlertCircle size={17} className="inline mr-1.5" /> {convertError}
              </div>
            )}

            <form onSubmit={handleConvert} className="mt-5 space-y-5">
              <div className="grid grid-cols-1 gap-4 rounded-3xl border border-gray-200 bg-gray-50/60 p-5 sm:grid-cols-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Supplier *</label>
                  <select
                    value={convertForm.supplierId}
                    onChange={(e) => setConvertForm({ ...convertForm, supplierId: e.target.value })}
                    className={inputCls}
                    required
                  >
                    <option value="">Select Supplier…</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Destination Warehouse</label>
                  <select
                    value={convertForm.warehouseId}
                    onChange={(e) => setConvertForm({ ...convertForm, warehouseId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Default Warehouse</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} {w.code ? `(${w.code})` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={convertForm.expectedDate}
                    onChange={(e) => setConvertForm({ ...convertForm, expectedDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Supplier Rebate %</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={convertForm.rebatePercent}
                    onChange={(e) => setConvertForm({ ...convertForm, rebatePercent: e.target.value })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Lines Grid */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-black uppercase text-gray-600">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4 w-36 text-center">Confirmed Qty</th>
                      <th className="py-3 px-4 w-40 text-right">Negotiated Unit Price (৳)</th>
                      <th className="py-3 px-4 w-40 text-right">Line Total (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {convertLines.map((line, i) => {
                      const prod = products.find((p) => p.id === line.productId);
                      const lineTot = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
                      return (
                        <tr key={i}>
                          <td className="py-3 px-4 font-bold text-gray-900">{prod?.name || "Product"}</td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="1"
                              value={line.qty}
                              onChange={(e) => setConvertLines(convertLines.map((l, j) => j === i ? { ...l, qty: e.target.value } : l))}
                              className="w-24 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-center text-sm font-bold tabular-nums"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) => setConvertLines(convertLines.map((l, j) => j === i ? { ...l, unitPrice: e.target.value } : l))}
                              className="w-28 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-right text-sm font-bold tabular-nums"
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-black tabular-nums text-gray-900">{fmt(lineTot)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary & Actions */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                <div>
                  <span className="text-xs text-gray-500">Calculated PO Grand Total (after rebate):</span>
                  <p className="text-2xl font-black text-purple-700">
                    {fmt(convertLines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0) * (1 - (Number(convertForm.rebatePercent) || 0) / 100), 0))}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setConvertingReq(null)} className="rounded-2xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={convertSaving} className="flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-2.5 text-sm font-black text-white shadow-lg shadow-purple-600/25 hover:bg-purple-700">
                    {convertSaving && <Loader2 size={16} className="animate-spin" />} <ShoppingCart size={17} /> Confirm & Generate PO
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setRejectingReq(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">Reject Requisition {rejectingReq.prNo}</h3>
              <button onClick={() => setRejectingReq(null)} className="rounded-xl p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1 block w-full rounded-2xl border border-gray-200 p-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  placeholder="Budget limit exceeded, duplicate request, etc."
                  required
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setRejectingReq(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={rejectSaving} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                  {rejectSaving && <Loader2 size={15} className="animate-spin" />} Reject PR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Slip / Details Modal */}
      {viewReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setViewReq(null)}>
          <div id="printable-slip" className="printable-document max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 via-white to-gray-50/50 p-6 sm:p-7">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${STATUS_CONFIG[viewReq.status]?.badge}`}>
                    {STATUS_CONFIG[viewReq.status]?.label || viewReq.status}
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-gray-900">{viewReq.prNo}</span>
                  {viewReq.warehouseName && (
                    <span className="rounded-xl bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                      📍 {viewReq.warehouseName}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Created on <strong>{new Date(viewReq.requestDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</strong>
                  {viewReq.expectedDate && ` · Expected by ${new Date(viewReq.expectedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`}
                </p>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <Printer size={15} /> Print Slip
                </button>
                <button
                  onClick={() => setViewReq(null)}
                  className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-6 flex-1">
              {/* Procurement Workflow Step Tracker */}
              <div className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Requisition Lifecycle</p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { label: "1. Draft Created", done: true, current: viewReq.status === "DRAFT" },
                    { label: "2. Under Review", done: ["SUBMITTED", "APPROVED", "CONVERTED"].includes(viewReq.status), current: viewReq.status === "SUBMITTED" },
                    { label: "3. Approved", done: ["APPROVED", "CONVERTED"].includes(viewReq.status), current: viewReq.status === "APPROVED" },
                    { label: "4. PO Generated", done: viewReq.status === "CONVERTED", current: viewReq.status === "CONVERTED" },
                  ].map((st, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-2.5 border transition ${
                        st.current
                          ? "bg-primary-600 text-white font-bold border-primary-600 shadow-sm"
                          : st.done
                          ? "bg-emerald-50 text-emerald-800 font-bold border-emerald-200"
                          : "bg-white text-gray-400 border-gray-200/60 font-medium"
                      }`}
                    >
                      <span className="block text-[10px] opacity-75">{st.done && !st.current ? "✓ Done" : st.current ? "● Active" : "○ Pending"}</span>
                      {st.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2-Column Info Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Request & Location Details</p>
                  <div className="mt-2.5 space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Destination Warehouse:</span>
                      <strong className="text-gray-900">{viewReq.warehouseName || warehouses.find(w => w.id === viewReq.warehouseId)?.name || "Central Warehouse"}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Requested By:</span>
                      <strong className="text-gray-900">{viewReq.requestedBy || "Department Lead"}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Expected Delivery:</span>
                      <strong className="text-gray-900">{viewReq.expectedDate ? new Date(viewReq.expectedDate).toLocaleDateString() : "Immediate"}</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Notes & Business Justification</p>
                  <p className="mt-2.5 text-xs text-gray-700 leading-relaxed min-h-[50px] italic">
                    {viewReq.note ? `"${viewReq.note}"` : "No internal justification notes provided for this requisition."}
                  </p>
                  {viewReq.rejectionReason && (
                    <div className="mt-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-medium">
                      <strong>Rejection Reason:</strong> {viewReq.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Requested Items Table */}
              <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200/80 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Requested Product Items ({(viewReq.items || []).length})</h4>
                  <span className="text-xs font-semibold text-gray-500">
                    Total Units: {(viewReq.items || []).reduce((s, i) => s + Number(i.qty), 0)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/40 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">Product Name & SKU</th>
                        <th className="py-2.5 px-4 text-center w-28">Requested Qty</th>
                        <th className="py-2.5 px-4 text-right w-36">Est. Unit Price</th>
                        <th className="py-2.5 px-4 text-right w-36">Est. Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(viewReq.items || []).map((it, idx) => {
                        const lineTot = Number(it.qty) * Number(it.estUnitPrice);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-gray-900">{it.productName || it.product?.name || "Product Item"}</p>
                              <p className="text-[11px] font-mono text-gray-400">{it.sku || it.product?.sku || "—"}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-block rounded-xl bg-blue-50 border border-blue-200/70 px-2.5 py-1 font-bold text-blue-800">
                                {Number(it.qty)} Units
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-700">
                              {fmt(Number(it.estUnitPrice))}
                            </td>
                            <td className="py-3 px-4 text-right font-black tabular-nums text-gray-900">
                              {fmt(lineTot)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50/80 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={4} className="py-3.5 px-4 text-right font-bold text-gray-700 uppercase tracking-wider">
                          Estimated Grand Total
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-base text-primary-700 tabular-nums">
                          {fmt((viewReq.items || []).reduce((s, i) => s + Number(i.qty) * Number(i.estUnitPrice), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Linked Purchase Orders (if any) */}
              {viewReq.purchaseOrders && viewReq.purchaseOrders.length > 0 && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                  <p className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                    <ShoppingCart size={15} /> Generated Purchase Orders ({viewReq.purchaseOrders.length})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {viewReq.purchaseOrders.map((po) => (
                      <Link
                        key={po.id}
                        href="/purchasing/orders"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50"
                      >
                        <FileText size={13} /> {po.poNo} · {fmt(Number(po.total))}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 p-5 sm:px-7 rounded-b-3xl no-print">
              <div className="flex items-center gap-2">
                {viewReq.status === "DRAFT" && (
                  <button
                    onClick={() => { act(viewReq.id, "submit", "Submitted PR for approval"); setViewReq(null); }}
                    disabled={!!busy}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    <Send size={14} /> Submit for Approval
                  </button>
                )}
                {viewReq.status === "SUBMITTED" && (
                  <>
                    <button
                      onClick={() => { act(viewReq.id, "approve", "Approved Requisition"); setViewReq(null); }}
                      disabled={!!busy}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                    >
                      <CheckCircle size={14} /> Approve Requisition
                    </button>
                    <button
                      onClick={() => { setRejectingReq(viewReq); setViewReq(null); }}
                      className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </>
                )}
                {viewReq.status === "APPROVED" && (
                  <button
                    onClick={() => { openConvert(viewReq); setViewReq(null); }}
                    className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-700 transition"
                  >
                    <ShoppingCart size={14} /> Convert to Purchase Order
                  </button>
                )}
              </div>

              <button
                onClick={() => setViewReq(null)}
                className="rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
