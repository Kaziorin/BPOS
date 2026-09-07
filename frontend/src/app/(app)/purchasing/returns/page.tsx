"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2, ArrowLeft, Undo2, PackageX, Plus, Search, Filter,
  Eye, Printer, X, CheckCircle, AlertTriangle, Building2, Calendar,
  Barcode, Trash2, Package, AlertCircle, Layers, ClipboardList, ShoppingCart, PackageCheck,
  LayoutGrid, ListFilter, RefreshCw, ChevronRight, TrendingDown, Clock, Check, FileText,
  ArrowRight, CheckSquare, Square
} from "lucide-react";
import { api } from "@/lib/api";

interface ReturnItem {
  id: string;
  qty: string | number;
  unitPrice: string | number;
  lineTotal?: string | number;
  product?: { id: string; name: string; sku: string; barcode?: string | null };
  productName?: string;
  productSku?: string;
}

interface PurchaseReturn {
  id: string;
  returnNo: string;
  returnDate: string;
  status: string;
  returnType: string;
  total: string | number;
  reason: string | null;
  supplier: { id: string; name: string; phone?: string };
  warehouse?: { id: string; name: string; code?: string };
  purchaseOrder?: { id: string; poNo: string } | null;
  goodsReceipt?: { id: string; grnNo: string } | null;
  items: ReturnItem[];
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

interface POItem {
  id: string;
  productId: string;
  productName?: string;
  qty: number | string;
  qtyReceived?: number | string;
  unitPrice: number | string;
  lineTotal?: number | string;
}

interface PurchaseOrderOption {
  id: string;
  poNo: string;
  orderDate: string;
  status: string;
  total: number | string;
  supplier?: { id: string; name: string };
  warehouseId?: string;
  branchId?: string;
  items: POItem[];
}

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderOption[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // View & Filter states
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [supplierFilter, setSupplierFilter] = useState("");

  // Create Return Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // PO Search state inside modal
  const [selectedPoId, setSelectedPoId] = useState<string>("");
  const [poSearchQuery, setPoSearchQuery] = useState<string>("");
  const [showPoPicker, setShowPoPicker] = useState<boolean>(true);

  const [form, setForm] = useState({
    purchaseOrderId: "",
    supplierId: "",
    warehouseId: "",
    returnType: "CREDIT_NOTE",
    reason: "DEFECTIVE",
    customReason: "",
  });
  const [lines, setLines] = useState<{ productId: string; productName?: string; productSku?: string; qty: string; unitPrice: string; maxQty?: number; fromPo?: string }[]>([]);
  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  // View Return Slip Modal
  const [viewReturn, setViewReturn] = useState<PurchaseReturn | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [retRes, poRes, supRes, prodRes, whRes] = await Promise.all([
        api.get<{ data: PurchaseReturn[] }>("/purchasing/returns"),
        api.get<{ data: any[] }>("/purchasing/orders?limit=100").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/suppliers?limit=100").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/products?limit=200").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/warehouses?limit=100").catch(() => ({ data: [] as any[] })),
      ]);
      const rawRets = (retRes as any)?.data ?? retRes;
      setReturns(Array.isArray(rawRets) ? rawRets : (rawRets as any)?.data ?? []);

      const rawPos = (poRes as any)?.data ?? poRes;
      setPurchaseOrders(Array.isArray(rawPos) ? rawPos : (rawPos as any)?.data ?? []);

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
      setError(err.response?.data?.error || err.message || "Failed to load purchase returns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openReturnModal() {
    setSelectedPoId("");
    setPoSearchQuery("");
    setShowPoPicker(true);
    setForm({
      purchaseOrderId: "",
      supplierId: suppliers[0]?.id || "",
      warehouseId: warehouses[0]?.id || "",
      returnType: "CREDIT_NOTE",
      reason: "DEFECTIVE",
      customReason: "",
    });
    setLines([]);
    setScanInput("");
    setModalError(null);
    setShowModal(true);
  }

  // When a PO is selected, auto-fill supplier & warehouse, and offer items
  function handleSelectPO(po: PurchaseOrderOption) {
    setSelectedPoId(po.id);
    const targetSupId = po.supplier?.id || form.supplierId || suppliers[0]?.id || "";
    const targetWhId = po.warehouseId || form.warehouseId || warehouses[0]?.id || "";
    setForm((prev) => ({
      ...prev,
      purchaseOrderId: po.id,
      supplierId: targetSupId,
      warehouseId: targetWhId,
    }));
    notify(true, `Selected Purchase Order "${po.poNo}". You can now add products from this PO or scan direct items.`);
  }

  function handleAddAllPoItems(po: PurchaseOrderOption) {
    if (!po.items || po.items.length === 0) return;
    setLines((prev) => {
      const copy = [...prev];
      for (const item of po.items) {
        const pInfo = products.find((p) => p.id === item.productId);
        const idx = copy.findIndex((l) => l.productId === item.productId);
        const max = Number(item.qtyReceived || item.qty || 9999);
        if (idx >= 0) {
          copy[idx] = {
            ...copy[idx],
            fromPo: po.poNo,
            unitPrice: String(item.unitPrice || copy[idx].unitPrice),
            maxQty: max,
          };
        } else {
          copy.push({
            productId: item.productId,
            productName: item.productName || pInfo?.name || "Product Item",
            productSku: pInfo?.sku || "",
            qty: "1",
            unitPrice: String(item.unitPrice || pInfo?.costPrice || 0),
            maxQty: max,
            fromPo: po.poNo,
          });
        }
      }
      return copy;
    });
    notify(true, `Added ${po.items.length} items from PO "${po.poNo}" to return list`);
  }

  function handleAddPoItemToLines(poItem: POItem, poNo: string) {
    const pInfo = products.find((p) => p.id === poItem.productId);
    const prodName = poItem.productName || pInfo?.name || "Product Item";
    const prodSku = pInfo?.sku || "";
    const max = Number(poItem.qtyReceived || poItem.qty || 9999);

    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === poItem.productId);
      if (idx >= 0) {
        const copy = [...prev];
        const nextQty = (Number(copy[idx].qty) || 0) + 1;
        copy[idx] = {
          ...copy[idx],
          qty: String(nextQty > max ? max : nextQty),
          fromPo: poNo,
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            productId: poItem.productId,
            productName: prodName,
            productSku: prodSku,
            qty: "1",
            unitPrice: String(poItem.unitPrice || pInfo?.costPrice || 0),
            maxQty: max,
            fromPo: poNo,
          },
        ];
      }
    });
    notify(true, `Added "${prodName}" to return`);
  }

  function handleUnlinkPo() {
    setSelectedPoId("");
    setForm((prev) => ({ ...prev, purchaseOrderId: "" }));
    notify(true, "Unlinked Purchase Order reference. Existing items kept.");
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
        setLines((prev) => {
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
                productName: found.name,
                productSku: found.sku,
                qty: "1",
                unitPrice: String(found.costPrice || 0),
              },
            ];
          }
        });
        setScanInput("");
        notify(true, `Added "${found.name}" to Return items`);
      } else {
        notify(false, `Product with Barcode/SKU "${scanInput}" not found`);
      }
    }
  }

  function addQuickProduct(prodId: string) {
    const found = products.find((p) => p.id === prodId);
    if (!found) return;
    setLines((prev) => {
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
          productName: found.name,
          productSku: found.sku,
          qty: "1",
          unitPrice: String(found.costPrice || 0),
        },
      ];
    });
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: "productId" | "qty" | "unitPrice", val: string) {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      if (field === "productId") {
        const p = products.find((x) => x.id === val);
        if (p) {
          copy[index].unitPrice = String(p.costPrice || 0);
          copy[index].productName = p.name;
          copy[index].productSku = p.sku;
        }
      }
      return copy;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      const items = lines
        .filter((l) => l.productId && Number(l.qty) > 0)
        .map((l) => ({ productId: l.productId, qty: Number(l.qty), unitPrice: Number(l.unitPrice) }));
      if (items.length === 0) throw new Error("Please add at least one valid product line to return");
      if (!form.supplierId) throw new Error("Please select a supplier");
      if (!form.warehouseId) throw new Error("Please select a source warehouse");

      const finalReason = form.reason === "OTHER" ? form.customReason || "Other" : form.reason;

      await api.post("/purchasing/returns", {
        purchaseOrderId: form.purchaseOrderId || undefined,
        supplierId: form.supplierId,
        warehouseId: form.warehouseId,
        returnType: form.returnType,
        reason: finalReason,
        items,
      });

      setShowModal(false);
      notify(true, "Purchase Return & Debit Note posted successfully!");
      await load();
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const inputCls = "mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition";

  // KPIs
  const totalCount = returns.length;
  const totalDebitValue = returns.reduce((acc, r) => acc + Number(r.total || 0), 0);
  const totalUnits = returns.reduce((acc, r) => acc + (r.items || []).reduce((s, i) => s + Number(i.qty), 0), 0);
  const creditNotesCount = returns.filter((r) => r.returnType === "CREDIT_NOTE").length;

  const filteredReturns = returns.filter((r) => {
    const matchesType = typeFilter === "ALL" || r.returnType === typeFilter;
    const matchesSupplier = !supplierFilter || r.supplier?.id === supplierFilter;
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      r.returnNo.toLowerCase().includes(query) ||
      (r.purchaseOrder?.poNo && r.purchaseOrder.poNo.toLowerCase().includes(query)) ||
      (r.supplier?.name && r.supplier.name.toLowerCase().includes(query)) ||
      (r.warehouse?.name && r.warehouse.name.toLowerCase().includes(query)) ||
      (r.reason && r.reason.toLowerCase().includes(query)) ||
      (r.items &&
        r.items.some(
          (it) =>
            (it.productName || it.product?.name || "").toLowerCase().includes(query) ||
            (it.productSku || it.product?.sku || "").toLowerCase().includes(query)
        ));
    return matchesType && matchesSupplier && matchesSearch;
  });

  const totalLinesCount = lines.length;
  const totalUnitsCount = lines.reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
  const totalFormDebit = lines.reduce((acc, l) => acc + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);

  // Filtered POs for Modal Search
  const filteredPosForModal = purchaseOrders.filter((po) => {
    const q = poSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      po.poNo.toLowerCase().includes(q) ||
      (po.supplier?.name && po.supplier.name.toLowerCase().includes(q)) ||
      (po.items && po.items.some((i) => (i.productName || "").toLowerCase().includes(q)))
    );
  });

  const selectedPo = purchaseOrders.find((p) => p.id === selectedPoId);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Link href="/purchasing" className="hover:text-primary-600 transition">Purchasing Hub</Link>
            <ChevronRight size={13} className="text-gray-400" />
            <span className="text-gray-900 font-bold">Purchase Returns & Debit Notes</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Purchase Returns & Debit Notes</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
            Return damaged/excess goods to vendor against Purchase Orders or standalone → reverses inventory & reduces AP payable
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={17} className={loading ? "animate-spin text-rose-600" : ""} />
          </button>
          <button
            onClick={openReturnModal}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700 active:scale-[0.98]"
          >
            <Plus size={18} /> New Purchase Return
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-sm">
        {[
          { href: "/purchasing", label: "Overview", icon: Layers },
          { href: "/purchasing/requisitions", label: "Requisitions (PR)", icon: ClipboardList },
          { href: "/purchasing/orders", label: "Purchase Orders (PO)", icon: ShoppingCart },
          { href: "/purchasing/grns", label: "Goods Received (GRN)", icon: PackageCheck },
          { href: "/purchasing/returns", label: "Returns & Debit Notes", icon: Undo2, active: true },
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
          {toast.ok ? <CheckCircle size={18} /> : <AlertTriangle size={18} />} {toast.text}
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
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Returns</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Undo2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{totalCount}</span>
            <span className="text-xs font-semibold text-gray-500">Records</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-medium">Credit Notes: <strong className="text-gray-700">{creditNotesCount}</strong></p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Debit Value</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600">−{fmt(totalDebitValue)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-medium">Deducted from supplier AP</p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Units Returned</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <PackageX size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{totalUnits}</span>
            <span className="text-xs font-semibold text-gray-500">Units</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Defective / Excess</p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Warehouses</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{warehouses.length}</span>
            <span className="text-xs font-semibold text-blue-700">Hubs</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Inventory reversal sources</p>
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
              placeholder="Search by Return #, PO #, supplier, warehouse, reason, or product name…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs sm:text-sm font-medium focus:border-rose-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Type Filter Pills & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
            {[
              { id: "ALL", label: "All Types" },
              { id: "CREDIT_NOTE", label: "Credit Note" },
              { id: "REFUND", label: "Refund" },
              { id: "REPLACEMENT", label: "Replacement" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  typeFilter === t.id ? "bg-rose-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/70 p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition ${viewMode === "table" ? "bg-white text-rose-600 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
              title="Table View"
            >
              <ListFilter size={16} />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`rounded-lg p-1.5 transition ${viewMode === "cards" ? "bg-white text-rose-600 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
              title="Grid Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-rose-500" /></div>
      ) : filteredReturns.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <PackageX size={32} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No Purchase Returns Found</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {searchTerm || supplierFilter || typeFilter !== "ALL"
              ? "No returns match your search filters. Try adjusting your query."
              : "Create a return when items are damaged, expired, or rejected during receiving."}
          </p>
          <button onClick={openReturnModal} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700">
            <Plus size={16} /> Create First Purchase Return
          </button>
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
                  <th className="py-3.5 px-4">Return # & Date</th>
                  <th className="py-3.5 px-4">Reference PO</th>
                  <th className="py-3.5 px-4">Supplier & Warehouse</th>
                  <th className="py-3.5 px-4">Type & Reason</th>
                  <th className="py-3.5 px-4">Returned Items</th>
                  <th className="py-3.5 px-4 text-right">Debit Total (৳)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReturns.map((ret, index) => {
                  const items = Array.isArray(ret.items) ? ret.items : [];
                  const totalUnits = items.reduce((s, i) => s + Number(i.qty), 0);

                  return (
                    <tr key={ret.id} className="hover:bg-rose-50/40 transition group">
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">{index + 1}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-gray-900 group-hover:text-rose-600 transition">{ret.returnNo}</span>
                        <p className="text-[11px] text-gray-400">{new Date(ret.returnDate).toLocaleDateString()}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {ret.purchaseOrder?.poNo ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/70 px-2 py-0.5 text-[11px] font-mono font-bold text-blue-700">
                            <ShoppingCart size={11} /> {ret.purchaseOrder.poNo}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Direct Return</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{ret.supplier?.name || "Supplier"}</p>
                        {ret.warehouse?.name && <p className="text-[11px] text-gray-500 flex items-center gap-1"><Building2 size={11} /> {ret.warehouse.name}</p>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                          {ret.returnType.replace("_", " ")}
                        </span>
                        {ret.reason && <p className="mt-0.5 text-[11px] text-gray-500 italic max-w-[150px] truncate">&quot;{ret.reason}&quot;</p>}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-800">{totalUnits} units returned</p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {items.slice(0, 2).map((it, i) => (
                            <span key={i} className="text-[10px] text-gray-500 truncate max-w-[140px]">
                              {it.productName || it.product?.name || "Item"} ({it.qty})
                            </span>
                          ))}
                          {items.length > 2 && <span className="text-[10px] text-gray-400">+{items.length - 2} more</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black tabular-nums text-rose-600 text-sm">
                        −{fmt(Number(ret.total))}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewReturn(ret)}
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
          {filteredReturns.map((ret) => {
            const items = Array.isArray(ret.items) ? ret.items : [];
            const totalUnits = items.reduce((s, i) => s + Number(i.qty), 0);

            return (
              <div key={ret.id} className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-gray-900">{ret.returnNo}</span>
                        <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          {ret.returnType.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(ret.returnDate).toLocaleDateString()} · <strong className="text-gray-700">{ret.supplier?.name}</strong>
                      </p>
                      {ret.purchaseOrder?.poNo && (
                        <p className="mt-1 text-[11px] font-mono text-blue-600 font-bold flex items-center gap-1">
                          <ShoppingCart size={12} /> Ref: {ret.purchaseOrder.poNo}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black tabular-nums text-rose-600">−{fmt(Number(ret.total))}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{totalUnits} units</p>
                    </div>
                  </div>

                  {ret.reason && (
                    <div className="mt-2.5 rounded-xl bg-gray-50 p-2 text-xs text-gray-600 italic">
                      &quot;{ret.reason}&quot;
                    </div>
                  )}

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
                    onClick={() => setViewReturn(ret)}
                    className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    <Eye size={14} /> View Return Slip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW PURCHASE RETURN MODAL (DUAL MODE: SEARCH BY PO # / DIRECT RETURN)      */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-2 sm:p-4 backdrop-blur-md" onClick={() => setShowModal(false)}>
          <div
            className="flex h-[92vh] max-h-[880px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-none items-center justify-between border-b border-gray-100 bg-rose-50/70 px-5 sm:px-6 py-3.5">
              <div>
                <h2 className="text-lg font-black tracking-tight text-gray-900">New Purchase Return (Debit Note)</h2>
                <p className="text-xs font-medium text-gray-500">
                  Return goods against a Purchase Order or Direct/Standalone — reverses stock & reduces AP payable
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mx-5 sm:mx-6 mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                <AlertCircle size={16} /> {modalError}
              </div>
            )}

            <form onSubmit={handleCreate} className="flex flex-1 min-h-0 flex-col p-4 sm:p-5 gap-3 overflow-hidden">
              
              {/* Compact Top Configuration Bar (1 Slim Grid Row) */}
              <div className="flex-none grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-gray-200/80 bg-gray-50/70 p-3 shadow-sm">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Supplier *</label>
                  <select
                    value={form.supplierId}
                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-white font-semibold text-gray-900 focus:border-rose-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Supplier…</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Source Warehouse *</label>
                  <select
                    value={form.warehouseId}
                    onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-white font-semibold text-gray-900 focus:border-rose-500 focus:outline-none"
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Settlement Type *</label>
                  <select
                    value={form.returnType}
                    onChange={(e) => setForm({ ...form, returnType: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-white font-semibold text-gray-900 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="CREDIT_NOTE">Credit Note (Deduct AP)</option>
                    <option value="REFUND">Direct Cash / Bank Refund</option>
                    <option value="REPLACEMENT">Item Replacement</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Return Reason *</label>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-white font-semibold text-gray-900 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="DEFECTIVE">Defective / Damaged</option>
                    <option value="EXPIRED">Expired Goods</option>
                    <option value="WRONG_ITEM">Wrong Item Received</option>
                    <option value="OVER_SUPPLIED">Over Supplied / Excess</option>
                    <option value="OTHER">Other Reason…</option>
                  </select>
                </div>
              </div>

              {form.reason === "OTHER" && (
                <div className="flex-none">
                  <input
                    type="text"
                    value={form.customReason}
                    onChange={(e) => setForm({ ...form, customReason: e.target.value })}
                    placeholder="Provide specific reason details for audit…"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-rose-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* COMPACT ITEM ADDING TOOLBAR (PO SELECTOR + FAST SCANNER / CATALOGUE PICKER) */}
              <div className="flex-none grid grid-cols-1 md:grid-cols-2 gap-2.5">
                
                {/* 1. Pull from PO Toolbar (Compact & Sleek with Search + Dropdown) */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1">
                        <ShoppingCart size={13} className="text-indigo-600" />
                        1. Pull from Purchase Order
                      </span>
                      {selectedPo && (
                        <span className="rounded-md bg-indigo-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-indigo-800">
                          {selectedPo.poNo}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPo && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAddAllPoItems(selectedPo)}
                            className="text-[10px] font-black text-indigo-700 hover:text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded transition"
                          >
                            + Add All ({(selectedPo.items || []).length})
                          </button>
                          <button
                            type="button"
                            onClick={handleUnlinkPo}
                            className="text-[10px] font-bold text-rose-600 hover:underline"
                          >
                            ✕ Unlink
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dual PO Controls: Search Input + PO Dropdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-400" />
                      <input
                        type="text"
                        value={poSearchQuery}
                        onChange={(e) => setPoSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (filteredPosForModal.length > 0) {
                              handleSelectPO(filteredPosForModal[0]);
                            }
                          }
                        }}
                        placeholder="Search PO # / Supplier..."
                        className="w-full rounded-lg border border-indigo-200 bg-white py-1.5 pl-7 pr-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <select
                      value={selectedPoId}
                      onChange={(e) => {
                        const po = purchaseOrders.find((p) => p.id === e.target.value);
                        if (po) handleSelectPO(po);
                      }}
                      className="w-full rounded-lg border border-indigo-200 bg-white py-1.5 px-2 text-xs font-bold text-gray-800 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Select PO ({filteredPosForModal.length}) --</option>
                      {filteredPosForModal.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.poNo} ({po.supplier?.name}) [{po.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* If PO selected, show a slim horizontal pill list of its items to pick individually */}
                  {selectedPo && selectedPo.items && selectedPo.items.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
                      {selectedPo.items.map((poItem, idx) => {
                        const currentLine = lines.find((l) => l.productId === poItem.productId);
                        const isAdded = !!currentLine;
                        const pName = poItem.productName || products.find((p) => p.id === poItem.productId)?.name || "Item";
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddPoItemToLines(poItem, selectedPo.poNo)}
                            className={`flex-none rounded-lg border px-2 py-1 text-[10px] font-semibold text-left transition ${
                              isAdded
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                : "bg-white border-indigo-200 text-gray-800 hover:bg-indigo-100"
                            }`}
                          >
                            <span className="font-bold truncate max-w-[130px] inline-block align-bottom">{pName}</span>
                            <span className="ml-1 font-bold text-indigo-700">{isAdded ? `(${currentLine.qty})` : "+Add"}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Direct Barcode / SKU Scan & Inventory Pick (Compact Toolbar) */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-950 flex items-center gap-1">
                      <Barcode size={13} className="text-rose-600" />
                      2. Barcode Scan & Direct Pick
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setLines([
                          ...lines,
                          {
                            productId: "",
                            productName: "",
                            productSku: "",
                            qty: "1",
                            unitPrice: "0",
                          },
                        ])
                      }
                      className="text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
                    >
                      <Plus size={11} /> Blank Line
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Barcode Scanner */}
                    <div className="relative">
                      <Barcode size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-500" />
                      <input
                        ref={scanInputRef}
                        type="text"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        onKeyDown={handleScanAdd}
                        placeholder="Scan Barcode / SKU & Enter..."
                        className="w-full rounded-lg border border-rose-200 bg-white py-1.5 pl-7 pr-2 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    {/* Quick Pick Dropdown */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addQuickProduct(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-bold text-gray-700 shadow-sm focus:border-rose-500 focus:outline-none"
                    >
                      <option value="">+ Quick Pick Item…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.sku ? `(${p.sku})` : ""} — {fmt(Number(p.costPrice))}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabular Return Items to Submit (FLEX-1, INDEPENDENT SCROLL, MAXIMUM SCREEN AREA) */}
              <div className="flex-1 min-h-[200px] flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex-none bg-gray-50/90 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Returned Product Items
                    </h4>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-700">
                      {lines.length} {lines.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLines([
                        ...lines,
                        {
                          productId: "",
                          productName: "",
                          productSku: "",
                          qty: "1",
                          unitPrice: "0",
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    <Plus size={13} /> Add Blank Line
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
                  {lines.length === 0 ? (
                    <div className="py-12 px-4 text-center text-gray-400">
                      <PackageX size={36} className="mx-auto text-gray-300" />
                      <p className="mt-2 text-sm font-semibold text-gray-600">No items added to return cart yet</p>
                      <p className="text-xs text-gray-400 mt-0.5">Select a PO above or scan barcodes directly to add return items.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-gray-50/95 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 backdrop-blur-sm">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">Product Item</th>
                          <th className="py-2.5 px-3 text-center w-36">Return Qty *</th>
                          <th className="py-2.5 px-3 text-right w-32">Unit Cost (৳) *</th>
                          <th className="py-2.5 px-3 text-right w-32">Debit Total (৳)</th>
                          <th className="py-2.5 px-3 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {lines.map((line, idx) => {
                          const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
                          const pInfo = products.find((p) => p.id === line.productId);
                          const displayName = line.productName || pInfo?.name || "";
                          const displaySku = line.productSku || pInfo?.sku || "";

                          return (
                            <tr key={idx} className="hover:bg-gray-50/70 transition">
                              <td className="py-2.5 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                              
                              <td className="py-2.5 px-3">
                                {line.productId && displayName ? (
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-gray-900">{displayName}</p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {displaySku && <span className="text-[10px] font-mono text-gray-400">SKU: {displaySku}</span>}
                                      {line.fromPo && (
                                        <span className="inline-block rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 text-[10px] font-mono font-bold text-indigo-700">
                                          Ref: {line.fromPo}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <select
                                    value={line.productId}
                                    onChange={(e) => updateLine(idx, "productId", e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 focus:border-rose-500 focus:outline-none"
                                    required
                                  >
                                    <option value="">Select Product…</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} {p.sku ? `(${p.sku})` : ""}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = Number(line.qty) || 1;
                                      if (cur > 1) updateLine(idx, "qty", String(cur - 1));
                                    }}
                                    className="px-2 py-0.5 text-gray-500 hover:text-gray-900 font-bold"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max={line.maxQty}
                                    value={line.qty}
                                    onChange={(e) => updateLine(idx, "qty", e.target.value)}
                                    className="w-12 text-center text-xs font-black text-gray-900 focus:outline-none border-x border-gray-100"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = Number(line.qty) || 0;
                                      if (!line.maxQty || cur < line.maxQty) {
                                        updateLine(idx, "qty", String(cur + 1));
                                      }
                                    }}
                                    className="px-2 py-0.5 text-gray-500 hover:text-gray-900 font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                                {line.maxQty && <p className="text-[9px] text-gray-400 mt-0.5">Max: {line.maxQty}</p>}
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={line.unitPrice}
                                  onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                                  className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs font-semibold text-gray-900 focus:border-rose-500 focus:outline-none"
                                  required
                                />
                              </td>

                              <td className="py-2.5 px-3 text-right font-black tabular-nums text-rose-600 text-xs sm:text-sm">
                                −{fmt(lineTotal)}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeLine(idx)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                  title="Remove Line"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Bottom Action & Financial Summary Bar (Fixed & Clean at modal bottom) */}
              <div className="flex-none border-t border-gray-200 bg-white pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Lines</span>
                    <p className="text-base font-black text-gray-900">{totalLinesCount}</p>
                  </div>
                  <div className="border-l border-gray-200 pl-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Units</span>
                    <p className="text-base font-black text-gray-900">{totalUnitsCount}</p>
                  </div>
                  <div className="border-l border-gray-200 pl-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Total Debit Note</span>
                    <p className="text-xl font-black text-rose-600">−{fmt(totalFormDebit)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || lines.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-black text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 disabled:opacity-50"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />} Post Purchase Return
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW RETURN DETAILS & DEBIT NOTE SLIP MODAL                                */}
      {/* ========================================================================= */}
      {viewReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-md" onClick={() => setViewReturn(null)}>
          <div id="printable-slip" className="printable-document max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-rose-50/50 via-white to-gray-50/50 p-6 sm:p-7">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-700">
                    {viewReturn.status}
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-gray-900">{viewReturn.returnNo}</span>
                  <span className="rounded-xl bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-700">
                    {viewReturn.returnType.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Issued on <strong>{new Date(viewReturn.returnDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</strong>
                  {viewReturn.purchaseOrder?.poNo && (
                    <> · Ref PO: <strong className="font-mono text-blue-600">{viewReturn.purchaseOrder.poNo}</strong></>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <Printer size={15} /> Print Debit Note
                </button>
                <button
                  onClick={() => setViewReturn(null)}
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
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Supplier & Accounting Impact</p>
                  <div className="mt-2.5 space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Supplier Name:</span>
                      <strong className="text-gray-900">{viewReturn.supplier?.name || "Supplier"}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Warehouse:</span>
                      <strong className="text-gray-900">{viewReturn.warehouse?.name || "Default Warehouse"}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Settlement Method:</span>
                      <strong className="text-gray-900">{viewReturn.returnType.replace("_", " ")}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">AP Balance Effect:</span>
                      <strong className="text-rose-600 font-bold">−{fmt(Number(viewReturn.total))} Deducted</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Return Reason & Reference</p>
                  <div className="mt-2.5 space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Reference PO:</span>
                      <strong className="text-blue-600 font-mono">{viewReturn.purchaseOrder?.poNo || "Direct Return"}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Remarks / Reason:</span>
                      <span className="text-gray-900 italic">{viewReturn.reason || "No remarks"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Returned Items Table */}
              <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200/80 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Returned Product Items ({(viewReturn.items || []).length})</h4>
                  <span className="text-xs font-semibold text-gray-500">
                    Total Units: {(viewReturn.items || []).reduce((s, i) => s + Number(i.qty), 0)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/40 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">Product Name & SKU</th>
                        <th className="py-2.5 px-4 text-center w-28">Returned Qty</th>
                        <th className="py-2.5 px-4 text-right w-36">Unit Cost</th>
                        <th className="py-2.5 px-4 text-right w-36">Debit Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(viewReturn.items || []).map((it, idx) => {
                        const lineTot = Number(it.qty) * Number(it.unitPrice);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-gray-900">{it.productName || it.product?.name || "Product Item"}</p>
                              <p className="text-[11px] font-mono text-gray-400">{it.productSku || it.product?.sku || "—"}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-block rounded-xl bg-rose-50 border border-rose-200/70 px-2.5 py-1 font-bold text-rose-800">
                                {Number(it.qty)} Units
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-700">
                              {fmt(Number(it.unitPrice))}
                            </td>
                            <td className="py-3 px-4 text-right font-black tabular-nums text-rose-600">
                              −{fmt(lineTot)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50/80 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={4} className="py-3.5 px-4 text-right font-bold text-gray-700 uppercase tracking-wider">
                          Total Debit Note Credit
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-base text-rose-600 tabular-nums">
                          −{fmt(Number(viewReturn.total))}
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
                onClick={() => setViewReturn(null)}
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
