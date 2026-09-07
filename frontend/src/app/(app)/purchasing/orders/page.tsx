"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2, ArrowLeft, ShoppingCart, Plus, CheckCircle, XCircle, PackageCheck,
  X, Truck, FileText, CreditCard, Search, Filter, Eye, Printer, Building2, Calendar,
  Barcode, Trash2, Package, AlertCircle, Layers, ClipboardList, Undo2, LayoutGrid,
  ListFilter, RefreshCw, ChevronRight, TrendingUp, Clock, Sparkles, Check, Send
} from "lucide-react";
import { api } from "@/lib/api";

interface PoItem {
  id: string;
  productId: string;
  qty: string | number;
  qtyReceived: string | number;
  qtyReturned: string | number;
  unitPrice: string | number;
  lineTotal: string | number;
  product?: { id: string; name: string; sku: string; barcode?: string | null };
  productName?: string;
}

interface PO {
  id: string;
  poNo: string;
  orderDate: string;
  expectedDate: string | null;
  status: string;
  subtotal: string;
  discountTotal?: string;
  taxTotal?: string;
  total: string;
  rebatePercent: string | null;
  warehouseId?: string;
  warehouseName?: string;
  supplier: { id: string; name: string; contactPerson?: string; phone?: string; email?: string };
  items: PoItem[];
  goodsReceipts?: { id: string; grnNo: string; receivedDate: string }[];
  purchaseInvoices?: { id: string; piNo: string; total: string; paidTotal: string; status: string }[];
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  costPrice: number | string;
}

interface WarehouseOption {
  id: string;
  name: string;
  code?: string;
  branch?: { id: string; name: string };
}

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  SUBMITTED: { label: "Submitted", cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  APPROVED: { label: "Approved", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  PARTIALLY_RECEIVED: { label: "Partial", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  RECEIVED: { label: "Received", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // View & Filter states
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");

  // Create PO modal state
  const [showPoModal, setShowPoModal] = useState(false);
  const [poSaving, setPoSaving] = useState(false);
  const [poError, setPoError] = useState<string | null>(null);
  const [poForm, setPoForm] = useState({ supplierId: "", warehouseId: "", expectedDate: "", rebatePercent: "0", note: "" });
  const [poLines, setPoLines] = useState<{ productId: string; qty: string; unitPrice: string }[]>([]);
  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Receive (GRN) modal state
  const [receivePo, setReceivePo] = useState<PO | null>(null);
  const [receiveWarehouseId, setReceiveWarehouseId] = useState("");
  const [receiveNote, setReceiveNote] = useState("");
  const [grnSaving, setGrnSaving] = useState(false);
  const [grnError, setGrnError] = useState<string | null>(null);
  const [grnLines, setGrnLines] = useState<{
    productId: string;
    qty: string;
    costPrice: string;
    batchNo: string;
    expiryDate: string;
  }[]>([]);

  // Pay supplier modal state
  const [payPo, setPayPo] = useState<PO | null>(null);
  const [payInvoiceId, setPayInvoiceId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // View PO Details modal state
  const [viewPo, setViewPo] = useState<PO | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [poRes, supRes, prdRes, whRes] = await Promise.all([
        api.get<{ data: PO[] }>("/purchasing/orders?limit=100"),
        api.get<{ data: { id: string; name: string }[] }>("/suppliers?limit=100"),
        api.get<{ data: any[] }>("/products?limit=200"),
        api.get<{ data: WarehouseOption[] }>("/warehouses?limit=100"),
      ]);
      setPos(poRes.data || []);
      setSuppliers(supRes.data || []);
      setProducts(
        (prdRes.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || "",
          barcode: p.barcode || null,
          costPrice: Number(p.costPrice || 0),
        }))
      );
      setWarehouses(whRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load purchasing orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreateModal() {
    setPoForm({
      supplierId: suppliers[0]?.id || "",
      warehouseId: warehouses[0]?.id || "",
      expectedDate: "",
      rebatePercent: "0",
      note: "",
    });
    setPoLines(
      products.slice(0, 2).map((p) => ({
        productId: p.id,
        qty: "1",
        unitPrice: String(p.costPrice || 0),
      }))
    );
    setScanInput("");
    setPoError(null);
    setShowPoModal(true);
    setTimeout(() => scanInputRef.current?.focus(), 150);
  }

  function handleScanAdd(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = scanInput.trim().toLowerCase();
      if (!code) return;

      const found = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code) ||
          (p.sku && p.sku.toLowerCase() === code) ||
          p.name.toLowerCase().includes(code)
      );

      if (found) {
        setPoLines((prev) => {
          const idx = prev.findIndex((l) => l.productId === found.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], qty: String((Number(copy[idx].qty) || 0) + 1) };
            return copy;
          } else {
            return [...prev, { productId: found.id, qty: "1", unitPrice: String(found.costPrice || 0) }];
          }
        });
        setScanInput("");
        notify(true, `Added "${found.name}" to PO items`);
      } else {
        notify(false, `Product with Barcode/SKU "${scanInput}" not found`);
      }
    }
  }

  function addQuickProduct(prodId: string) {
    const found = products.find((p) => p.id === prodId);
    if (!found) return;
    setPoLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === prodId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: String((Number(copy[idx].qty) || 0) + 1) };
        return copy;
      }
      return [...prev, { productId: found.id, qty: "1", unitPrice: String(found.costPrice || 0) }];
    });
  }

  function removePoLine(index: number) {
    setPoLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePoLine(index: number, field: "productId" | "qty" | "unitPrice", val: string) {
    setPoLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      if (field === "productId") {
        const p = products.find((x) => x.id === val);
        if (p) copy[index].unitPrice = String(p.costPrice || 0);
      }
      return copy;
    });
  }

  async function approvePo(id: string) {
    setBusy(id + "approve");
    try {
      await api.post(`/purchasing/orders/${id}/approve`, {});
      notify(true, "Purchase Order approved successfully!");
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally {
      setBusy(null);
    }
  }

  async function cancelPo(id: string) {
    if (!confirm("Are you sure you want to cancel this purchase order?")) return;
    setBusy(id + "cancel");
    try {
      await api.post(`/purchasing/orders/${id}/cancel`, {});
      notify(true, "Purchase Order cancelled");
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally {
      setBusy(null);
    }
  }

  function openReceive(po: PO) {
    setReceivePo(po);
    setReceiveWarehouseId(po.warehouseId || warehouses[0]?.id || "");
    setReceiveNote("");
    setGrnError(null);
    setGrnLines(
      (po.items || []).map((it) => {
        const unrec = Math.max(Number(it.qty) - Number(it.qtyReceived || 0), 0);
        return {
          productId: it.productId,
          qty: String(unrec),
          costPrice: String(it.unitPrice || 0),
          batchNo: `BAT-${Date.now().toString(36).toUpperCase()}`,
          expiryDate: "",
        };
      })
    );
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    if (!receivePo) return;
    setGrnSaving(true);
    setGrnError(null);
    try {
      const itemsToReceive = grnLines
        .filter((l) => Number(l.qty) > 0)
        .map((l) => ({
          productId: l.productId,
          qty: Number(l.qty),
          costPrice: Number(l.costPrice),
          batchNo: l.batchNo || undefined,
          expiryDate: l.expiryDate || undefined,
        }));

      if (itemsToReceive.length === 0) throw new Error("Please specify at least 1 item with quantity > 0");
      if (!receiveWarehouseId) throw new Error("Please select a target receiving warehouse");

      await api.post("/purchasing/grns", {
        purchaseOrderId: receivePo.id,
        supplierId: receivePo.supplier.id,
        warehouseId: receiveWarehouseId,
        note: receiveNote || undefined,
        items: itemsToReceive,
      });

      setReceivePo(null);
      notify(true, `Goods Received & Verified for PO ${receivePo.poNo}!`);
      await load();
    } catch (err: any) {
      setGrnError(err.response?.data?.error || err.message);
    } finally {
      setGrnSaving(false);
    }
  }

  function openPay(po: PO) {
    setPayPo(po);
    const firstInvoice = (po.purchaseInvoices || [])[0];
    setPayInvoiceId(firstInvoice?.id || "");
    const remaining = firstInvoice ? Math.max(Number(firstInvoice.total) - Number(firstInvoice.paidTotal || 0), 0) : Number(po.total);
    setPayAmount(String(remaining > 0 ? remaining : Number(po.total)));
    setPayMethod("CASH");
    setPayRef("");
    setPayNote("");
    setPayError(null);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payPo) return;
    setPaySaving(true);
    setPayError(null);
    try {
      if (!payInvoiceId) throw new Error("No linked purchase invoice found to pay");
      if (Number(payAmount) <= 0) throw new Error("Please enter a valid payment amount");

      await api.post(`/purchasing/invoices/${payInvoiceId}/payments`, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        reference: payRef || undefined,
        note: payNote || undefined,
      });

      setPayPo(null);
      notify(true, `Supplier payment of ৳${payAmount} recorded successfully!`);
      await load();
    } catch (err: any) {
      setPayError(err.response?.data?.error || err.message);
    } finally {
      setPaySaving(false);
    }
  }

  async function handleCreatePo(e: React.FormEvent) {
    e.preventDefault();
    setPoSaving(true);
    setPoError(null);
    try {
      const items = poLines
        .filter((l) => l.productId && Number(l.qty) > 0)
        .map((l) => ({ productId: l.productId, qty: Number(l.qty), unitPrice: Number(l.unitPrice) }));
      if (items.length === 0) throw new Error("Please add at least one valid product line");
      if (!poForm.supplierId) throw new Error("Please select a supplier");
      if (!poForm.warehouseId) throw new Error("Please select a target warehouse");

      await api.post("/purchasing/orders", {
        supplierId: poForm.supplierId,
        warehouseId: poForm.warehouseId,
        expectedDate: poForm.expectedDate || undefined,
        rebatePercent: poForm.rebatePercent ? Number(poForm.rebatePercent) : 0,
        items,
      });

      setShowPoModal(false);
      notify(true, "Purchase Order created successfully!");
      await load();
    } catch (err: any) {
      setPoError(err.response?.data?.error || err.message);
    } finally {
      setPoSaving(false);
    }
  }

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const inputCls = "mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition";

  // KPIs
  const totalCount = pos.length;
  const pendingApprovalCount = pos.filter((p) => p.status === "SUBMITTED").length;
  const activeReceivingCount = pos.filter((p) => ["APPROVED", "PARTIALLY_RECEIVED"].includes(p.status)).length;
  const completedCount = pos.filter((p) => p.status === "RECEIVED").length;
  const totalSpend = pos.reduce((acc, p) => acc + Number(p.total || 0), 0);

  const filteredPos = pos.filter((po) => {
    const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;
    const matchesSupplier = !supplierFilter || po.supplier?.id === supplierFilter;
    const matchesWarehouse = !warehouseFilter || po.warehouseId === warehouseFilter;
    const matchesSearch =
      !searchTerm ||
      po.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.supplier?.name && po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (po.items && po.items.some((it) => (it.productName || it.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesStatus && matchesSupplier && matchesWarehouse && matchesSearch;
  });

  const totalLinesCount = poLines.length;
  const totalUnitsCount = poLines.reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
  const subtotalAmount = poLines.reduce((acc, l) => acc + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  const rebatePercentNum = Number(poForm.rebatePercent) || 0;
  const rebateAmount = (subtotalAmount * rebatePercentNum) / 100;
  const grandTotal = subtotalAmount - rebateAmount;

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Link href="/purchasing" className="hover:text-primary-600 transition">Purchasing Hub</Link>
            <ChevronRight size={13} className="text-gray-400" />
            <span className="text-gray-900 font-bold">Purchase Orders</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Purchase Orders (PO)</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
            Official supplier orders → approval → receive goods (GRN) → AP invoices & payments (§10.17)
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
            <Plus size={18} /> New Purchase Order
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-sm">
        {[
          { href: "/purchasing", label: "Overview", icon: Layers },
          { href: "/purchasing/requisitions", label: "Requisitions (PR)", icon: ClipboardList },
          { href: "/purchasing/orders", label: "Purchase Orders (PO)", icon: ShoppingCart, active: true },
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
        <div className={`flex items-center gap-2 rounded-2xl border p-4 text-sm font-semibold shadow-sm transition ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {toast.ok ? <CheckCircle size={18} /> : <XCircle size={18} />} {toast.text}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          {error} <button onClick={load} className="ml-2 font-bold underline">Retry</button>
        </div>
      )}

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Orders</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{totalCount}</span>
            <span className="text-xs font-semibold text-gray-500">POs</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-medium">Total Spend: <strong className="text-gray-700">{fmt(totalSpend)}</strong></p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Awaiting Approval</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{pendingApprovalCount}</span>
            <span className="text-xs font-semibold text-amber-700">Needs Review</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Submitted by procurement</p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Awaiting Receipt</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <PackageCheck size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-violet-600">{activeReceivingCount}</span>
            <span className="text-xs font-semibold text-violet-700">GRN Ready</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Approved & in transit</p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Fulfilled (Received)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{completedCount}</span>
            <span className="text-xs font-semibold text-emerald-700">Completed</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Stock physically received</p>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
        <div className="flex min-w-[280px] flex-1 items-center gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PO #, supplier, or product name…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs sm:text-sm font-medium focus:border-primary-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs sm:text-sm font-medium focus:border-primary-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {/* Status Filter Pills & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
            {[
              { id: "ALL", label: "All" },
              { id: "SUBMITTED", label: "Submitted" },
              { id: "APPROVED", label: "Approved" },
              { id: "PARTIALLY_RECEIVED", label: "Partial" },
              { id: "RECEIVED", label: "Received" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  statusFilter === st.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/70 p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition ${viewMode === "table" ? "bg-white text-primary-600 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
              title="Table View"
            >
              <ListFilter size={16} />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`rounded-lg p-1.5 transition ${viewMode === "cards" ? "bg-white text-primary-600 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
              title="Grid Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Main Content */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : filteredPos.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ShoppingCart size={32} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No Purchase Orders Found</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Create an official purchase order for suppliers to begin receiving stock into your inventory.
          </p>
          <button onClick={openCreateModal} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700">
            <Plus size={16} /> Create First PO
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* ========================================================================= */
        /* HIGH DENSITY ENTERPRISE ERP TABLE VIEW                                    */
        /* ========================================================================= */
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">PO Number & Date</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Warehouse</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Items & Progress</th>
                  <th className="py-3.5 px-4 text-right">Amount (৳)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPos.map((po, index) => {
                  const meta = STATUS[po.status] ?? STATUS.DRAFT;
                  const items = Array.isArray(po.items) ? po.items : [];
                  const purchaseInvoices = Array.isArray(po.purchaseInvoices) ? po.purchaseInvoices : [];
                  const ordered = items.reduce((s, i) => s + Number(i.qty || 0), 0);
                  const received = items.reduce((s, i) => s + Number(i.qtyReceived || 0), 0);
                  const pct = ordered > 0 ? Math.min(Math.round((received / ordered) * 100), 100) : 0;
                  const canApprove = po.status === "SUBMITTED";
                  const canReceive = ["APPROVED", "PARTIALLY_RECEIVED"].includes(po.status);
                  const hasInvoices = purchaseInvoices.length > 0;
                  const hasUnpaidInvoice = purchaseInvoices.some((i) => i.status !== "PAID");
                  const wh = warehouses.find((w) => w.id === po.warehouseId);

                  return (
                    <tr key={po.id} className="hover:bg-gray-50/80 transition group">
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">{index + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-gray-900 group-hover:text-primary-600 transition">{po.poNo}</span>
                          {po.rebatePercent && Number(po.rebatePercent) > 0 && (
                            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                              {Number(po.rebatePercent)}% Rebate
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {new Date(po.orderDate).toLocaleDateString()}
                          {po.expectedDate && ` · Exp: ${new Date(po.expectedDate).toLocaleDateString()}`}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{po.supplier?.name || "Supplier"}</p>
                        {po.supplier?.phone && <p className="text-[11px] text-gray-400">{po.supplier.phone}</p>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-700">
                          📍 {wh ? wh.name : "Warehouse"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 mb-1">
                          <span>{received} / {ordered} units</span>
                          <span className={pct === 100 ? "text-emerald-600" : pct > 0 ? "text-amber-600" : "text-gray-400"}>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-gray-200"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {items.slice(0, 2).map((it, i) => (
                            <span key={i} className="text-[10px] text-gray-500 truncate max-w-[120px]">
                              {it.productName || it.product?.name || "Item"} ({it.qty})
                            </span>
                          ))}
                          {items.length > 2 && (
                            <span className="text-[10px] text-gray-400">+{items.length - 2} more</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <p className="font-black text-gray-900 tabular-nums text-sm">{fmt(Number(po.total))}</p>
                        {purchaseInvoices.length > 0 && (
                          <span className={`text-[10px] font-bold ${hasUnpaidInvoice ? "text-amber-600" : "text-emerald-600"}`}>
                            {hasUnpaidInvoice ? "AP Pending" : "Paid"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${meta.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewPo(po)}
                            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                            title="View Full PO Slip"
                          >
                            <Eye size={14} />
                          </button>

                          {canApprove && (
                            <button
                              onClick={() => approvePo(po.id)}
                              disabled={busy === po.id + "approve"}
                              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {busy === po.id + "approve" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve
                            </button>
                          )}

                          {canReceive && (
                            <button
                              onClick={() => openReceive(po)}
                              className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
                              title="Receive Goods (GRN)"
                            >
                              <PackageCheck size={12} /> Receive GRN
                            </button>
                          )}

                          {hasInvoices && hasUnpaidInvoice && (
                            <button
                              onClick={() => openPay(po)}
                              className="flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                              title="Pay Supplier Invoice"
                            >
                              <CreditCard size={12} /> Pay
                            </button>
                          )}
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
        /* ========================================================================= */
        /* MODERN STRUCTURED GRID CARDS VIEW                                         */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPos.map((po) => {
            const meta = STATUS[po.status] ?? STATUS.DRAFT;
            const items = Array.isArray(po.items) ? po.items : [];
            const purchaseInvoices = Array.isArray(po.purchaseInvoices) ? po.purchaseInvoices : [];
            const ordered = items.reduce((s, i) => s + Number(i.qty || 0), 0);
            const received = items.reduce((s, i) => s + Number(i.qtyReceived || 0), 0);
            const pct = ordered > 0 ? Math.min(Math.round((received / ordered) * 100), 100) : 0;
            const canApprove = po.status === "SUBMITTED";
            const canReceive = ["APPROVED", "PARTIALLY_RECEIVED"].includes(po.status);
            const hasInvoices = purchaseInvoices.length > 0;
            const hasUnpaidInvoice = purchaseInvoices.some((i) => i.status !== "PAID");
            const wh = warehouses.find((w) => w.id === po.warehouseId);

            return (
              <div key={po.id} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-gray-900">{po.poNo}</span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(po.orderDate).toLocaleDateString()} · <strong className="text-gray-700">{po.supplier?.name}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black tabular-nums text-gray-900">{fmt(Number(po.total))}</p>
                      {po.rebatePercent && Number(po.rebatePercent) > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600">{Number(po.rebatePercent)}% Rebate</span>
                      )}
                    </div>
                  </div>

                  {/* Destination Warehouse */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="rounded-lg bg-gray-100 border border-gray-200 px-2 py-0.5 font-medium">
                      📍 {wh ? wh.name : "Warehouse"}
                    </span>
                  </div>

                  {/* Receiving Progress */}
                  <div className="mt-3.5">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500">
                      <span>Received {received} of {ordered} units</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-gray-200"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Items List snippet */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="rounded-lg bg-gray-50 border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700">
                        {item.productName || item.product?.name || "Item"} ({item.qty})
                      </span>
                    ))}
                    {items.length > 3 && <span className="text-[11px] text-gray-400">+{items.length - 3} more</span>}
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <button
                    onClick={() => setViewPo(po)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary-600"
                  >
                    <Eye size={14} /> View Slip
                  </button>

                  <div className="flex items-center gap-1.5">
                    {canApprove && (
                      <button
                        onClick={() => approvePo(po.id)}
                        className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                      >
                        Approve
                      </button>
                    )}
                    {canReceive && (
                      <button
                        onClick={() => openReceive(po)}
                        className="flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
                      >
                        <PackageCheck size={13} /> Receive
                      </button>
                    )}
                    {hasInvoices && hasUnpaidInvoice && (
                      <button
                        onClick={() => openPay(po)}
                        className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                      >
                        <CreditCard size={13} /> Pay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW PURCHASE ORDER MODAL (WIDE, BARCODE SCANNER, TABULAR GRID)             */}
      {/* ========================================================================= */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setShowPoModal(false)}>
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-7 py-5">
              <div>
                <h2 className="text-xl font-black tracking-tight text-gray-900">New Purchase Order</h2>
                <p className="text-xs font-medium text-gray-500">Create an official PO for suppliers with rebate & delivery details</p>
              </div>
              <button onClick={() => setShowPoModal(false)} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Error banner */}
            {poError && (
              <div className="mx-7 mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-semibold text-rose-700">
                <AlertCircle size={18} /> {poError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreatePo} className="flex flex-1 flex-col overflow-y-auto p-7 space-y-6">
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 sm:grid-cols-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Supplier *</label>
                  <select
                    value={poForm.supplierId}
                    onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                    className={inputCls}
                    required
                  >
                    <option value="">Select Supplier…</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Target Warehouse *</label>
                  <select
                    value={poForm.warehouseId}
                    onChange={(e) => setPoForm({ ...poForm, warehouseId: e.target.value })}
                    className={inputCls}
                    required
                  >
                    <option value="">Select Warehouse…</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.code ? `(${w.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Expected Delivery</label>
                  <input
                    type="date"
                    value={poForm.expectedDate}
                    onChange={(e) => setPoForm({ ...poForm, expectedDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Rebate Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={poForm.rebatePercent}
                    onChange={(e) => setPoForm({ ...poForm, rebatePercent: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              {/* Fast Barcode & SKU Scanner Bar */}
              <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/30 p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Barcode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input
                      ref={scanInputRef}
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={handleScanAdd}
                      placeholder="Scan Barcode or Type SKU / Name & press Enter to auto-add item…"
                      className="w-full rounded-xl border border-primary-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addQuickProduct(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">+ Quick Pick Item…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {fmt(Number(p.costPrice))}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabular PO Line Items */}
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Purchase Order Line Items ({poLines.length})</h4>
                  <button
                    type="button"
                    onClick={() => setPoLines([...poLines, { productId: products[0]?.id || "", qty: "1", unitPrice: String(products[0]?.costPrice || 0) }])}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"
                  >
                    <Plus size={14} /> Add Blank Line
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/40 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">Product Item *</th>
                        <th className="py-2.5 px-4 text-center w-28">Order Qty *</th>
                        <th className="py-2.5 px-4 text-right w-36">Unit Cost (৳) *</th>
                        <th className="py-2.5 px-4 text-right w-36">Line Total (৳)</th>
                        <th className="py-2.5 px-4 text-center w-14"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {poLines.map((line, idx) => {
                        const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <select
                                value={line.productId}
                                onChange={(e) => updatePoLine(idx, "productId", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-primary-500 focus:outline-none"
                                required
                              >
                                <option value="">Select Product…</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.sku ? `(${p.sku})` : ""}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="number"
                                min="1"
                                value={line.qty}
                                onChange={(e) => updatePoLine(idx, "qty", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-xs font-black text-gray-900 focus:border-primary-500 focus:outline-none"
                                required
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.unitPrice}
                                onChange={(e) => updatePoLine(idx, "unitPrice", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-right text-xs font-semibold text-gray-900 focus:border-primary-500 focus:outline-none"
                                required
                              />
                            </td>
                            <td className="py-3 px-4 text-right font-black tabular-nums text-gray-900 text-sm">
                              {fmt(lineTotal)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => removePoLine(idx)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Sticky Financial Summary & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200/80 bg-gray-50/80 p-5">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Lines</span>
                    <p className="text-lg font-black text-gray-900">{totalLinesCount}</p>
                  </div>
                  <div className="border-l border-gray-200 pl-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Units</span>
                    <p className="text-lg font-black text-gray-900">{totalUnitsCount}</p>
                  </div>
                  {rebatePercentNum > 0 && (
                    <div className="border-l border-gray-200 pl-6">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Rebate Discount ({rebatePercentNum}%)</span>
                      <p className="text-lg font-black text-emerald-600">-{fmt(rebateAmount)}</p>
                    </div>
                  )}
                  <div className="border-l border-gray-200 pl-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Grand Total</span>
                    <p className="text-2xl font-black text-primary-700">{fmt(grandTotal)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPoModal(false)}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={poSaving}
                    className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {poSaving && <Loader2 size={16} className="animate-spin" />} Create Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GOODS RECEIVED NOTE (GRN) RECEIVING MODAL                                 */}
      {/* ========================================================================= */}
      {receivePo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setReceivePo(null)}>
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-violet-50/60 px-7 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-bold text-white">Stock Receiving</span>
                  <h2 className="text-xl font-black tracking-tight text-gray-900">Goods Receipt (GRN) for {receivePo.poNo}</h2>
                </div>
                <p className="text-xs font-medium text-gray-500">
                  Supplier: <strong>{receivePo.supplier?.name}</strong> · Total Value: <strong>{fmt(Number(receivePo.total))}</strong>
                </p>
              </div>
              <button onClick={() => setReceivePo(null)} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {grnError && (
              <div className="mx-7 mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-semibold text-rose-700">
                <AlertCircle size={18} /> {grnError}
              </div>
            )}

            <form onSubmit={handleReceive} className="flex flex-1 flex-col overflow-y-auto p-7 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Receiving Destination Warehouse *</label>
                  <select
                    value={receiveWarehouseId}
                    onChange={(e) => setReceiveWarehouseId(e.target.value)}
                    className={inputCls}
                    required
                  >
                    <option value="">Select Warehouse…</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.code ? `(${w.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Receiving Delivery Note / Remarks</label>
                  <input
                    type="text"
                    value={receiveNote}
                    onChange={(e) => setReceiveNote(e.target.value)}
                    placeholder="Challan #, truck info, condition remarks…"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Items receiving grid */}
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="py-3 px-4">Product Item</th>
                      <th className="py-3 px-4 text-center w-24">Ordered</th>
                      <th className="py-3 px-4 text-center w-24">Prev. Recv</th>
                      <th className="py-3 px-4 text-center w-28">Receive Now *</th>
                      <th className="py-3 px-4 w-36">Batch / Lot #</th>
                      <th className="py-3 px-4 w-36">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {grnLines.map((line, i) => {
                      const poItem = (receivePo.items || []).find((it) => it.productId === line.productId);
                      return (
                        <tr key={i} className="hover:bg-gray-50/60 transition">
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-900">{poItem?.productName || poItem?.product?.name || "Product"}</p>
                            <p className="text-[11px] font-mono text-gray-400">{poItem?.product?.sku || ""}</p>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-700">{Number(poItem?.qty || 0)}</td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-700">{Number(poItem?.qtyReceived || 0)}</td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max={Number(poItem?.qty || 0)}
                              value={line.qty}
                              onChange={(e) => setGrnLines(grnLines.map((l, j) => j === i ? { ...l, qty: e.target.value } : l))}
                              className="w-full rounded-xl border border-violet-300 bg-violet-50/40 px-3 py-1.5 text-center text-xs font-black text-violet-900 focus:border-violet-500 focus:outline-none"
                              required
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={line.batchNo}
                              onChange={(e) => setGrnLines(grnLines.map((l, j) => j === i ? { ...l, batchNo: e.target.value } : l))}
                              className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-mono"
                              placeholder="Batch #"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={line.expiryDate}
                              onChange={(e) => setGrnLines(grnLines.map((l, j) => j === i ? { ...l, expiryDate: e.target.value } : l))}
                              className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200/80 bg-violet-50/50 p-4">
                <span className="text-xs font-semibold text-violet-800">
                  ✓ Automatically updates warehouse inventory · ✓ Auto-creates supplier payable invoice
                </span>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setReceivePo(null)} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={grnSaving} className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-black text-white shadow-md shadow-violet-600/20 hover:bg-violet-700">
                    {grnSaving && <Loader2 size={16} className="animate-spin" />} <PackageCheck size={16} /> Confirm Receipt & Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECORD SUPPLIER PAYMENT MODAL                                             */}
      {/* ========================================================================= */}
      {payPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setPayPo(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">Record Supplier Payment</h2>
                <p className="text-xs font-medium text-gray-500">Pay supplier {payPo.supplier.name} for PO {payPo.poNo}</p>
              </div>
              <button onClick={() => setPayPo(null)} className="rounded-xl border border-gray-200 p-2 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            {payError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-semibold text-rose-700">
                <AlertCircle size={17} className="inline mr-1.5" /> {payError}
              </div>
            )}

            <form onSubmit={handlePay} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Select Purchase Invoice *</label>
                <select
                  value={payInvoiceId}
                  onChange={(e) => {
                    setPayInvoiceId(e.target.value);
                    const inv = (payPo.purchaseInvoices || []).find((i) => i.id === e.target.value);
                    if (inv) {
                      setPayAmount(String(Math.max(Number(inv.total) - Number(inv.paidTotal || 0), 0)));
                    }
                  }}
                  className={inputCls}
                  required
                >
                  {(payPo.purchaseInvoices || []).map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.piNo} — Total: {fmt(Number(inv.total))} · Paid: {fmt(Number(inv.paidTotal))} ({inv.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Payment Amount (৳) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Payment Method *</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={inputCls}>
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Transaction / Cheque Reference</label>
                <input value={payRef} onChange={(e) => setPayRef(e.target.value)} className={inputCls} placeholder="Txn ID, Cheque #, etc." />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Payment Note</label>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)} className={inputCls} placeholder="Optional payment note" />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button type="button" onClick={() => setPayPo(null)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={paySaving} className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 disabled:opacity-50">
                  {paySaving && <Loader2 size={16} className="animate-spin" />} <CreditCard size={16} /> Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW PO DETAILS & VOUCHER SLIP MODAL (WIDE ENTERPRISE DESIGN)             */}
      {/* ========================================================================= */}
      {viewPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setViewPo(null)}>
          <div id="printable-slip" className="printable-document max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 via-white to-gray-50/50 p-6 sm:p-7">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${STATUS[viewPo.status]?.cls}`}>
                    {STATUS[viewPo.status]?.label || viewPo.status}
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-gray-900">{viewPo.poNo}</span>
                  {viewPo.rebatePercent && Number(viewPo.rebatePercent) > 0 && (
                    <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      {Number(viewPo.rebatePercent)}% Rebate
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Ordered on <strong>{new Date(viewPo.orderDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</strong>
                  {viewPo.expectedDate && ` · Expected by ${new Date(viewPo.expectedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`}
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
                  onClick={() => setViewPo(null)}
                  className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-6 flex-1">
              {/* Procurement Workflow Step Tracker */}
              <div className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Order Fulfillment Lifecycle</p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { label: "1. Order Placed", done: true, current: viewPo.status === "DRAFT" || viewPo.status === "SUBMITTED" },
                    { label: "2. PO Approved", done: ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED"].includes(viewPo.status), current: viewPo.status === "APPROVED" },
                    { label: "3. GRN Received", done: ["PARTIALLY_RECEIVED", "RECEIVED"].includes(viewPo.status), current: viewPo.status === "PARTIALLY_RECEIVED" || viewPo.status === "RECEIVED" },
                    { label: "4. Invoiced & Paid", done: (viewPo.purchaseInvoices || []).some((i) => i.status === "PAID"), current: (viewPo.purchaseInvoices || []).some((i) => i.status === "PAID") },
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
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Supplier & Vendor Details</p>
                  <div className="mt-2.5 space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Supplier Name:</span>
                      <strong className="text-gray-900">{viewPo.supplier?.name || "Supplier"}</strong>
                    </div>
                    {viewPo.supplier?.phone && (
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Phone:</span>
                        <strong className="text-gray-900">{viewPo.supplier.phone}</strong>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Destination:</span>
                      <strong className="text-gray-900">{warehouses.find(w => w.id === viewPo.warehouseId)?.name || "Main Warehouse"}</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Receiving & Invoice Status</p>
                  <div className="mt-2.5 space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Goods Receipt (GRN):</span>
                      <strong className="text-gray-900">
                        {(viewPo.goodsReceipts || []).length > 0 ? (viewPo.goodsReceipts || []).map((g) => g.grnNo).join(", ") : "Not Yet Received"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Linked Invoices:</span>
                      <strong className="text-gray-900">
                        {(viewPo.purchaseInvoices || []).length > 0
                          ? (viewPo.purchaseInvoices || []).map((i) => `${i.piNo} (${i.status})`).join(", ")
                          : "Pending GRN"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchased Items Table */}
              <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200/80 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Ordered Product Items ({(viewPo.items || []).length})</h4>
                  <span className="text-xs font-semibold text-gray-500">
                    Total Units: {(viewPo.items || []).reduce((s, i) => s + Number(i.qty), 0)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/40 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">Product Name & SKU</th>
                        <th className="py-2.5 px-4 text-center w-24">Ordered</th>
                        <th className="py-2.5 px-4 text-center w-24">Received</th>
                        <th className="py-2.5 px-4 text-right w-32">Unit Price</th>
                        <th className="py-2.5 px-4 text-right w-36">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(viewPo.items || []).map((it, idx) => {
                        const lineTot = Number(it.lineTotal || (Number(it.qty) * Number(it.unitPrice)));
                        return (
                          <tr key={idx} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-gray-900">{it.productName || it.product?.name || "Product Item"}</p>
                              <p className="text-[11px] font-mono text-gray-400">{it.product?.sku || "—"}</p>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-gray-800">
                              {Number(it.qty)} Units
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block rounded-lg px-2 py-0.5 font-bold ${
                                Number(it.qtyReceived || 0) === Number(it.qty) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-700"
                              }`}>
                                {Number(it.qtyReceived || 0)} Units
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-700">
                              {fmt(Number(it.unitPrice))}
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
                        <td colSpan={5} className="py-3.5 px-4 text-right font-bold text-gray-700 uppercase tracking-wider">
                          Purchase Order Total
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-base text-primary-700 tabular-nums">
                          {fmt(Number(viewPo.total))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 p-5 sm:px-7 rounded-b-3xl no-print">
              <div className="flex items-center gap-2">
                {viewPo.status === "SUBMITTED" && (
                  <button
                    onClick={() => { approvePo(viewPo.id); setViewPo(null); }}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <CheckCircle size={14} /> Approve Purchase Order
                  </button>
                )}
                {["APPROVED", "PARTIALLY_RECEIVED"].includes(viewPo.status) && (
                  <button
                    onClick={() => { openReceive(viewPo); setViewPo(null); }}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
                  >
                    <PackageCheck size={14} /> Receive Goods (GRN)
                  </button>
                )}
                {(viewPo.purchaseInvoices || []).some((i) => i.status !== "PAID") && (
                  <button
                    onClick={() => { openPay(viewPo); setViewPo(null); }}
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                  >
                    <CreditCard size={14} /> Record Supplier Payment
                  </button>
                )}
              </div>

              <button
                onClick={() => setViewPo(null)}
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
