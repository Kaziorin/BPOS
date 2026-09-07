"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2, ArrowLeft, PackageCheck, CheckCircle, Plus, Search, Filter,
  Eye, Printer, X, Building2, Calendar, FileText, Barcode, Trash2, Package, AlertCircle,
  Layers, ClipboardList, ShoppingCart, Undo2, LayoutGrid, ListFilter, RefreshCw,
  ChevronRight, TrendingUp, Boxes, Clock, Check
} from "lucide-react";
import { api } from "@/lib/api";

interface GrnItem {
  id: string;
  qty: string | number;
  qtyRejected?: string | number;
  costPrice: string | number;
  batchNo: string | null;
  expiryDate?: string | null;
  product?: { id: string; name: string; sku: string; barcode?: string | null };
  productName?: string;
}

interface GRN {
  id: string;
  grnNo: string;
  receivedDate: string;
  status: string;
  note: string | null;
  supplier: { id: string; name: string; phone?: string };
  warehouse: { id: string; name: string; code: string };
  purchaseOrder: { id: string; poNo: string; total?: string } | null;
  items: GrnItem[];
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

export default function GrnsPage() {
  const [grns, setGrns] = useState<GRN[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // View & Filter states
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");

  // Create Direct GRN Modal
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [directSaving, setDirectSaving] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [directForm, setDirectForm] = useState({ supplierId: "", warehouseId: "", note: "" });
  const [directLines, setDirectLines] = useState<{
    productId: string;
    qty: string;
    costPrice: string;
    batchNo: string;
    expiryDate: string;
  }[]>([]);
  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  // View GRN Slip Modal
  const [viewGrn, setViewGrn] = useState<GRN | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [grnRes, supRes, prodRes, whRes] = await Promise.all([
        api.get<{ data: GRN[] }>("/purchasing/grns?limit=100"),
        api.get<{ data: any[] }>("/suppliers?limit=100").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/products?limit=200").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/warehouses?limit=100").catch(() => ({ data: [] as any[] })),
      ]);
      const rawGrns = (grnRes as any)?.data ?? grnRes;
      setGrns(Array.isArray(rawGrns) ? rawGrns : (rawGrns as any)?.data ?? []);

      const sups = (supRes.data as any)?.data ?? supRes.data ?? [];
      setSuppliers(Array.isArray(sups) ? sups.map((s: any) => ({ id: s.id, name: s.name })) : []);

      const prods = (prodRes.data as any)?.data ?? prodRes.data ?? [];
      setProducts(
        Array.isArray(prods)
          ? prods.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku || "",
              barcode: p.barcode || null,
              costPrice: Number(p.costPrice || 0),
            }))
          : []
      );

      const whs = (whRes.data as any)?.data ?? whRes.data ?? [];
      setWarehouses(Array.isArray(whs) ? whs : []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openDirectModal() {
    setDirectForm({
      supplierId: suppliers[0]?.id || "",
      warehouseId: warehouses[0]?.id || "",
      note: "",
    });
    setDirectLines(
      products.slice(0, 2).map((p) => ({
        productId: p.id,
        qty: "1",
        costPrice: String(p.costPrice || 0),
        batchNo: `BAT-${Date.now().toString(36).toUpperCase()}`,
        expiryDate: "",
      }))
    );
    setScanInput("");
    setDirectError(null);
    setShowDirectModal(true);
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
        setDirectLines((prev) => {
          const idx = prev.findIndex((l) => l.productId === found.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], qty: String((Number(copy[idx].qty) || 0) + 1) };
            return copy;
          } else {
            return [
              ...prev,
              {
                productId: found.id,
                qty: "1",
                costPrice: String(found.costPrice || 0),
                batchNo: `BAT-${Date.now().toString(36).toUpperCase()}`,
                expiryDate: "",
              },
            ];
          }
        });
        setScanInput("");
        notify(true, `Added "${found.name}" to GRN receipt lines`);
      } else {
        notify(false, `Product with Barcode/SKU "${scanInput}" not found`);
      }
    }
  }

  function addQuickProduct(prodId: string) {
    const found = products.find((p) => p.id === prodId);
    if (!found) return;
    setDirectLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === prodId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: String((Number(copy[idx].qty) || 0) + 1) };
        return copy;
      }
      return [
        ...prev,
        {
          productId: found.id,
          qty: "1",
          costPrice: String(found.costPrice || 0),
          batchNo: `BAT-${Date.now().toString(36).toUpperCase()}`,
          expiryDate: "",
        },
      ];
    });
  }

  function removeDirectLine(index: number) {
    setDirectLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDirectLine(index: number, field: string, val: string) {
    setDirectLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      if (field === "productId") {
        const p = products.find((x) => x.id === val);
        if (p) copy[index].costPrice = String(p.costPrice || 0);
      }
      return copy;
    });
  }

  async function handleDirectGrn(e: React.FormEvent) {
    e.preventDefault();
    setDirectSaving(true);
    setDirectError(null);
    try {
      const items = directLines
        .filter((l) => l.productId && Number(l.qty) > 0)
        .map((l) => ({
          productId: l.productId,
          qty: Number(l.qty),
          costPrice: Number(l.costPrice),
          batchNo: l.batchNo || undefined,
          expiryDate: l.expiryDate || undefined,
        }));
      if (items.length === 0) throw new Error("Please add at least one item with valid quantity");
      if (!directForm.warehouseId) throw new Error("Please select a target warehouse");

      await api.post("/purchasing/grns", {
        supplierId: directForm.supplierId || undefined,
        warehouseId: directForm.warehouseId,
        note: directForm.note || undefined,
        items,
      });

      setShowDirectModal(false);
      notify(true, "Goods Received Note posted & inventory updated successfully!");
      await load();
    } catch (err: any) {
      setDirectError(err.response?.data?.error || err.message);
    } finally {
      setDirectSaving(false);
    }
  }

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const inputCls = "mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition";

  // KPIs
  const totalCount = grns.length;
  const totalReceivedCost = grns.reduce((acc, g) => acc + (g.items || []).reduce((s, i) => s + Number(i.qty) * Number(i.costPrice), 0), 0);
  const totalUnits = grns.reduce((acc, g) => acc + (g.items || []).reduce((s, i) => s + Number(i.qty), 0), 0);
  const fromPoCount = grns.filter((g) => !!g.purchaseOrder).length;

  const filteredGrns = grns.filter((g) => {
    const matchesWh = !warehouseFilter || g.warehouse?.id === warehouseFilter;
    const matchesSupplier = !supplierFilter || g.supplier?.id === supplierFilter;
    const matchesSearch =
      !searchTerm ||
      g.grnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.supplier?.name && g.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.purchaseOrder?.poNo && g.purchaseOrder.poNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.items && g.items.some((it) => (it.productName || it.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesWh && matchesSupplier && matchesSearch;
  });

  const totalLinesCount = directLines.length;
  const totalDirectUnits = directLines.reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
  const totalCostValue = directLines.reduce((acc, l) => acc + (Number(l.qty) || 0) * (Number(l.costPrice) || 0), 0);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Link href="/purchasing" className="hover:text-primary-600 transition">Purchasing Hub</Link>
            <ChevronRight size={13} className="text-gray-400" />
            <span className="text-gray-900 font-bold">Goods Received Notes (GRN)</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Goods Received (GRN)</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
            Physical stock receiving verification · updates inventory & creates supplier AP invoice (§10.17)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={17} className={loading ? "animate-spin text-violet-600" : ""} />
          </button>
          <button
            onClick={openDirectModal}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 active:scale-[0.98]"
          >
            <Plus size={18} /> New Direct GRN
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-sm">
        {[
          { href: "/purchasing", label: "Overview", icon: Layers },
          { href: "/purchasing/requisitions", label: "Requisitions (PR)", icon: ClipboardList },
          { href: "/purchasing/orders", label: "Purchase Orders (PO)", icon: ShoppingCart },
          { href: "/purchasing/grns", label: "Goods Received (GRN)", icon: PackageCheck, active: true },
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
          {toast.ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {toast.text}
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
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total GRNs</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <PackageCheck size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{totalCount}</span>
            <span className="text-xs font-semibold text-gray-500">Receipts</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-medium">From POs: <strong className="text-gray-700">{fromPoCount}</strong></p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Received Value</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600">{fmt(totalReceivedCost)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-medium">Added to warehouse inventory</p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Units Received</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Boxes size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{totalUnits}</span>
            <span className="text-xs font-semibold text-gray-500">Units</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Verified & stocked</p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Warehouses</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{warehouses.length}</span>
            <span className="text-xs font-semibold text-indigo-700">Storage Hubs</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Multi-location stock</p>
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
              placeholder="Search by GRN #, PO #, supplier, or product name…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs sm:text-sm font-medium focus:border-violet-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs sm:text-sm font-medium focus:border-violet-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} {w.code ? `(${w.code})` : ""}</option>)}
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/70 p-1">
          <button
            onClick={() => setViewMode("table")}
            className={`rounded-lg p-1.5 transition ${viewMode === "table" ? "bg-white text-violet-600 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
            title="Table View"
          >
            <ListFilter size={16} />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`rounded-lg p-1.5 transition ${viewMode === "cards" ? "bg-white text-violet-600 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
            title="Grid Card View"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-violet-500" /></div>
      ) : filteredGrns.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <PackageCheck size={32} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No Goods Received Notes (GRN) Found</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Receive goods against an approved purchase order or post a direct GRN to increase inventory.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button onClick={openDirectModal} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700">
              <Plus size={16} className="mr-1.5 inline" /> Post Direct GRN
            </button>
            <Link href="/purchasing/orders" className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Go to Purchase Orders →
            </Link>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* ========================================================================= */
        /* HIGH DENSITY ERP TABLE VIEW                                               */
        /* ========================================================================= */
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">GRN # & Date</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Receiving Warehouse</th>
                  <th className="py-3.5 px-4">Origin Reference</th>
                  <th className="py-3.5 px-4">Received Items & Batches</th>
                  <th className="py-3.5 px-4 text-right">Total Cost (৳)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGrns.map((grn, index) => {
                  const items = Array.isArray(grn.items) ? grn.items : [];
                  const total = items.reduce((s, i) => s + Number(i.qty) * Number(i.costPrice), 0);
                  const totalUnits = items.reduce((s, i) => s + Number(i.qty), 0);

                  return (
                    <tr key={grn.id} className="hover:bg-gray-50/80 transition group">
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">{index + 1}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-gray-900 group-hover:text-violet-600 transition">{grn.grnNo}</span>
                        <p className="text-[11px] text-gray-400">{new Date(grn.receivedDate).toLocaleDateString()}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{grn.supplier?.name || "Direct Vendor"}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-700">
                          📍 {grn.warehouse?.name || "Warehouse"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {grn.purchaseOrder ? (
                          <Link href="/purchasing/orders" className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100">
                            PO #{grn.purchaseOrder.poNo}
                          </Link>
                        ) : (
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                            Direct Inward
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-800">{totalUnits} units across {items.length} lines</p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {items.slice(0, 2).map((it, i) => (
                            <span key={i} className="text-[10px] text-gray-500 truncate max-w-[140px]">
                              {it.productName || it.product?.name || "Item"} ({it.qty})
                            </span>
                          ))}
                          {items.length > 2 && <span className="text-[10px] text-gray-400">+{items.length - 2} more</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black tabular-nums text-gray-900 text-sm">
                        {fmt(total)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewGrn(grn)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                        >
                          <Eye size={13} /> View Slip
                        </button>
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
          {filteredGrns.map((grn) => {
            const items = Array.isArray(grn.items) ? grn.items : [];
            const total = items.reduce((s, i) => s + Number(i.qty) * Number(i.costPrice), 0);
            const totalUnits = items.reduce((s, i) => s + Number(i.qty), 0);

            return (
              <div key={grn.id} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-gray-900">{grn.grnNo}</span>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {grn.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(grn.receivedDate).toLocaleDateString()} · <strong className="text-gray-700">{grn.supplier?.name || "Direct Vendor"}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black tabular-nums text-gray-900">{fmt(total)}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{totalUnits} units</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                    <span className="rounded-lg bg-gray-100 border border-gray-200 px-2 py-0.5 font-medium">
                      📍 {grn.warehouse?.name || "Warehouse"}
                    </span>
                    {grn.purchaseOrder && (
                      <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        PO #{grn.purchaseOrder.poNo}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="rounded-lg bg-gray-50 border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700">
                        {item.productName || item.product?.name || "Item"} × {item.qty}
                      </span>
                    ))}
                    {items.length > 3 && <span className="text-[11px] text-gray-400">+{items.length - 3} more</span>}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3">
                  <button
                    onClick={() => setViewGrn(grn)}
                    className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700"
                  >
                    <Eye size={14} /> View Receipt Slip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIRECT GRN MODAL (WIDE, BARCODE SCANNER, TABULAR GRID)                     */}
      {/* ========================================================================= */}
      {showDirectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setShowDirectModal(false)}>
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-violet-50/70 px-7 py-5">
              <div>
                <h2 className="text-xl font-black tracking-tight text-gray-900">Direct Goods Received Note (GRN)</h2>
                <p className="text-xs font-medium text-gray-500">Receive stock directly into warehouse without prior purchase order</p>
              </div>
              <button onClick={() => setShowDirectModal(false)} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {directError && (
              <div className="mx-7 mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-semibold text-rose-700">
                <AlertCircle size={18} /> {directError}
              </div>
            )}

            <form onSubmit={handleDirectGrn} className="flex flex-1 flex-col overflow-y-auto p-7 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Supplier (Optional)</label>
                  <select
                    value={directForm.supplierId}
                    onChange={(e) => setDirectForm({ ...directForm, supplierId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Direct / Walk-in Supplier…</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Target Warehouse *</label>
                  <select
                    value={directForm.warehouseId}
                    onChange={(e) => setDirectForm({ ...directForm, warehouseId: e.target.value })}
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
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Challan / Receiving Remarks</label>
                  <input
                    type="text"
                    value={directForm.note}
                    onChange={(e) => setDirectForm({ ...directForm, note: e.target.value })}
                    placeholder="Challan #, delivery note…"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Fast Barcode & SKU Scanner Bar */}
              <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/30 p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Barcode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-500" />
                    <input
                      ref={scanInputRef}
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={handleScanAdd}
                      placeholder="Scan Barcode or Type SKU / Name & press Enter to auto-add item…"
                      className="w-full rounded-xl border border-violet-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
                      className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 shadow-sm focus:border-violet-500 focus:outline-none"
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

              {/* Tabular Direct GRN Lines */}
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Received Product Line Items ({directLines.length})</h4>
                  <button
                    type="button"
                    onClick={() => setDirectLines([...directLines, {
                      productId: products[0]?.id || "",
                      qty: "1",
                      costPrice: String(products[0]?.costPrice || 0),
                      batchNo: `BAT-${Date.now().toString(36).toUpperCase()}`,
                      expiryDate: ""
                    }])}
                    className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700"
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
                        <th className="py-2.5 px-4 text-center w-24">Qty *</th>
                        <th className="py-2.5 px-4 text-right w-32">Unit Cost (৳) *</th>
                        <th className="py-2.5 px-4 w-32">Batch #</th>
                        <th className="py-2.5 px-4 w-32">Expiry Date</th>
                        <th className="py-2.5 px-4 text-right w-32">Total Cost</th>
                        <th className="py-2.5 px-4 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {directLines.map((line, idx) => {
                        const lineTotal = (Number(line.qty) || 0) * (Number(line.costPrice) || 0);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <select
                                value={line.productId}
                                onChange={(e) => updateDirectLine(idx, "productId", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-violet-500 focus:outline-none"
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
                                onChange={(e) => updateDirectLine(idx, "qty", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-center text-xs font-black text-gray-900 focus:border-violet-500 focus:outline-none"
                                required
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.costPrice}
                                onChange={(e) => updateDirectLine(idx, "costPrice", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-right text-xs font-semibold text-gray-900 focus:border-violet-500 focus:outline-none"
                                required
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={line.batchNo}
                                onChange={(e) => updateDirectLine(idx, "batchNo", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs font-mono"
                                placeholder="Batch #"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="date"
                                value={line.expiryDate}
                                onChange={(e) => updateDirectLine(idx, "expiryDate", e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs"
                              />
                            </td>
                            <td className="py-3 px-4 text-right font-black tabular-nums text-gray-900 text-sm">
                              {fmt(lineTotal)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeDirectLine(idx)}
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
                    <p className="text-lg font-black text-gray-900">{totalDirectUnits}</p>
                  </div>
                  <div className="border-l border-gray-200 pl-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Grand Received Cost</span>
                    <p className="text-2xl font-black text-violet-700">{fmt(totalCostValue)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDirectModal(false)}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={directSaving}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700 disabled:opacity-50"
                  >
                    {directSaving && <Loader2 size={16} className="animate-spin" />} Confirm & Post Direct GRN
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW GRN DETAILS & RECEIPT SLIP MODAL (WIDE ENTERPRISE DESIGN)            */}
      {/* ========================================================================= */}
      {viewGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setViewGrn(null)}>
          <div id="printable-slip" className="printable-document max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 via-white to-gray-50/50 p-6 sm:p-7">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
                    {viewGrn.status}
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-gray-900">{viewGrn.grnNo}</span>
                  {viewGrn.purchaseOrder && (
                    <span className="rounded-xl bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                      PO #{viewGrn.purchaseOrder.poNo}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Received & Inwarded on <strong>{new Date(viewGrn.receivedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <Printer size={15} /> Print Receipt Slip
                </button>
                <button
                  onClick={() => setViewGrn(null)}
                  className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-6 flex-1">
              {/* 2-Column Info Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Warehouse & Supplier Details</p>
                  <div className="mt-2.5 space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Receiving Warehouse:</span>
                      <strong className="text-gray-900">{viewGrn.warehouse?.name || "Main Warehouse"}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Supplier:</span>
                      <strong className="text-gray-900">{viewGrn.supplier?.name || "Direct Vendor"}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Stock Status:</span>
                      <strong className="text-emerald-600 font-bold">✓ Added to On-hand Inventory</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Receiving Notes & Challan</p>
                  <p className="mt-2.5 text-xs text-gray-700 leading-relaxed min-h-[50px] italic">
                    {viewGrn.note ? `"${viewGrn.note}"` : "No special challan notes recorded on receipt."}
                  </p>
                </div>
              </div>

              {/* Received Items Table */}
              <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200/80 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Inwarded Product Items ({(viewGrn.items || []).length})</h4>
                  <span className="text-xs font-semibold text-gray-500">
                    Total Units: {(viewGrn.items || []).reduce((s, i) => s + Number(i.qty), 0)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/40 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">Product Name & SKU</th>
                        <th className="py-2.5 px-4 text-center w-28">Received Qty</th>
                        <th className="py-2.5 px-4 w-32">Batch / Lot #</th>
                        <th className="py-2.5 px-4 text-right w-32">Unit Cost</th>
                        <th className="py-2.5 px-4 text-right w-36">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(viewGrn.items || []).map((it, idx) => {
                        const lineTot = Number(it.qty) * Number(it.costPrice);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-gray-900">{it.productName || it.product?.name || "Product Item"}</p>
                              <p className="text-[11px] font-mono text-gray-400">{it.product?.sku || "—"}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-block rounded-xl bg-violet-50 border border-violet-200/70 px-2.5 py-1 font-bold text-violet-800">
                                {Number(it.qty)} Units
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs text-gray-600">{it.batchNo || "—"}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-700">
                              {fmt(Number(it.costPrice))}
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
                          Total Received Value
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-base text-violet-700 tabular-nums">
                          {fmt((viewGrn.items || []).reduce((s, i) => s + Number(i.qty) * Number(i.costPrice), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50/80 p-5 sm:px-7 rounded-b-3xl no-print">
              <button
                onClick={() => setViewGrn(null)}
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
