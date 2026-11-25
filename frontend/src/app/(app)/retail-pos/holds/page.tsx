"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PauseCircle,
  PlayCircle,
  Trash2,
  ShoppingCart,
  Clock,
  Package,
  Search,
  Eye,
  RefreshCw,
  Copy,
  Check,
  LayoutGrid,
  List,
  Store,
  User,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomModal,
  ConfirmModal,
} from "@/components/custom";
import type { HeldSale, CartItem } from "../pos-types";

function formatMoney(amount: number): string {
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return dateString;
  }
}

export default function HoldsPage() {
  const router = useRouter();
  const [holds, setHolds] = useState<HeldSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [selectedHold, setSelectedHold] = useState<HeldSale | null>(null);
  const [holdToDelete, setHoldToDelete] = useState<HeldSale | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadHolds = () => {
    setLoading(true);
    api
      .get<any>("/api/v1/pos/holds")
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
        const mapped: HeldSale[] = (Array.isArray(list) ? list : []).map((h: any) => {
          let items: CartItem[] = [];
          if (h.cartSnapshot) {
            try {
              items = typeof h.cartSnapshot === "string" ? JSON.parse(h.cartSnapshot) : h.cartSnapshot;
            } catch {
              items = [];
            }
          }
          return {
            id: String(h.id),
            holdNo: h.holdNo || `#HOLD-${String(h.id).slice(0, 6).toUpperCase()}`,
            createdAt: h.createdAt || new Date().toISOString(),
            cartSnapshot: Array.isArray(items) ? items : [],
            customerId: h.customerId || null,
            note: h.note || null,
          };
        });
        setHolds(mapped);
      })
      .catch(() => setHolds([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHolds();
  }, []);

  const copyHoldNo = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalCarts = holds.length;
    let totalValue = 0;
    let totalItems = 0;

    holds.forEach((h) => {
      h.cartSnapshot.forEach((item) => {
        const qty = item.qty || 1;
        const price = item.unitPrice || 0;
        const lineTotal = item.lineTotal || qty * price;
        totalValue += lineTotal;
        totalItems += qty;
      });
    });

    const oldestHold = holds.length > 0 ? holds[holds.length - 1].createdAt : null;

    return {
      totalCarts,
      totalValue,
      totalItems,
      oldestDuration: oldestHold ? timeAgo(oldestHold) : "None",
    };
  }, [holds]);

  // Filtered holds
  const filteredHolds = useMemo(() => {
    if (!searchQuery.trim()) return holds;
    const q = searchQuery.toLowerCase().trim();
    return holds.filter((h) => {
      const matchNo = h.holdNo.toLowerCase().includes(q);
      const matchNote = h.note?.toLowerCase().includes(q) ?? false;
      const matchItem = h.cartSnapshot.some((item) => item.name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q));
      return matchNo || matchNote || matchItem;
    });
  }, [holds, searchQuery]);

  // Resume hold action
  const handleResumeHold = async (hold: HeldSale) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("bpos_general_cart", JSON.stringify(hold.cartSnapshot));
        if (hold.customerId) {
          localStorage.setItem("bpos_general_customer", hold.customerId);
        } else {
          localStorage.removeItem("bpos_general_customer");
        }
        localStorage.setItem("bpos_resume_hold_id", hold.id);
      }

      // Delete from holds table in backend so it does not remain duplicated
      await api.del(`/api/v1/pos/holds/${hold.id}`).catch(() => {});

      router.push("/retail-pos");
    } catch (err) {
      console.error("Failed to resume hold:", err);
      showToast("Failed to restore cart to POS");
    }
  };

  // Delete hold action
  const confirmDeleteHold = async () => {
    if (!holdToDelete) return;
    setDeleting(true);
    try {
      await api.del(`/api/v1/pos/holds/${holdToDelete.id}`);
      showToast(`Cart ${holdToDelete.holdNo} discarded`);
      setHoldToDelete(null);
      loadHolds();
    } catch {
      showToast("Failed to delete held cart");
    } finally {
      setDeleting(false);
    }
  };

  const getHoldTotal = (hold: HeldSale): number => {
    return hold.cartSnapshot.reduce((acc, item) => {
      const qty = item.qty || 1;
      const price = item.unitPrice || 0;
      return acc + (item.lineTotal || qty * price);
    }, 0);
  };

  const getHoldItemCount = (hold: HeldSale): number => {
    return hold.cartSnapshot.reduce((acc, item) => acc + (item.qty || 1), 0);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Top Controls ── */}
      <CustomBreadcrumb
        title="Held Sales & Parked Carts"
        description="Parked customer transactions across all POS registers — review item snapshots, calculate totals, and resume checkout instantly"
        icon={<PauseCircle size={15} />}
        items={[
          { label: "Retail", href: "/retail-pos" },
          { label: "POS Terminal", href: "/retail-pos" },
          { label: "Held Sales" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {toastMessage && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                {toastMessage}
              </span>
            )}
            <CustomButton
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={loading}
              onClick={loadHolds}
            >
              Refresh
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              icon={ShoppingCart}
              onClick={() => router.push("/retail-pos")}
            >
              Open POS Register
            </CustomButton>
          </div>
        }
      />

      {/* ── Metric Gauges (Blue Oceans Light Theme) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-sm bg-white border border-brand-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Parked Carts</span>
            <PauseCircle size={15} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-brand-dark tabular-nums">
            {metrics.totalCarts}
          </div>
          <p className="text-[11px] text-slate-400">Transactions on hold</p>
        </div>

        <div className="p-4 rounded-sm bg-white border border-brand-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Parked Value</span>
            <Store size={15} className="text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-brand-dark tabular-nums">
            {formatMoney(metrics.totalValue)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">Active merchandise value</p>
        </div>

        <div className="p-4 rounded-sm bg-white border border-brand-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Units Parked</span>
            <Package size={15} className="text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-brand-dark tabular-nums">
            {metrics.totalItems}
          </div>
          <p className="text-[11px] text-slate-400">Total items across carts</p>
        </div>

        <div className="p-4 rounded-sm bg-white border border-brand-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Oldest Parked Cart</span>
            <Clock size={15} className="text-slate-400" />
          </div>
          <div className="text-2xl font-black text-brand-dark tabular-nums">
            {metrics.oldestDuration}
          </div>
          <p className="text-[11px] text-slate-400">Age of oldest pending cart</p>
        </div>
      </div>

      {/* ── Toolbar: Search & View Modes ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-brand-border rounded-sm shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary" />
          <input
            type="text"
            placeholder="Search hold #, item name, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-sm border border-brand-border focus:outline-none focus:border-brand-primary transition text-slate-700 placeholder:text-slate-400 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="inline-flex rounded-sm border border-brand-border p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-sm transition cursor-pointer ${
                viewMode === "grid" ? "bg-white text-brand-primary shadow-2xs font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-sm transition cursor-pointer ${
                viewMode === "table" ? "bg-white text-brand-primary shadow-2xs font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Table View"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading Spinner ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-sm border border-slate-200/90 text-slate-400 gap-3">
          <RefreshCw size={24} className="animate-spin text-sky-600" />
          <p className="text-xs font-semibold">Loading parked sales...</p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && filteredHolds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-sm border border-slate-200/90 text-center p-6 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <PauseCircle size={28} />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-bold text-slate-700">No Parked Carts Found</h3>
            <p className="text-xs text-slate-400">
              {searchQuery
                ? `No held sales matching "${searchQuery}". Try clearing search.`
                : "There are currently no carts on hold. In POS register, click Hold (F8) to park active carts."}
            </p>
          </div>
          <CustomButton
            variant="primary"
            size="sm"
            icon={ShoppingCart}
            onClick={() => router.push("/retail-pos")}
          >
            Go to POS Terminal
          </CustomButton>
        </div>
      )}

      {/* ── Grid View ── */}
      {!loading && filteredHolds.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredHolds.map((h) => {
            const total = getHoldTotal(h);
            const itemCount = getHoldItemCount(h);
            const isCopied = copiedId === h.id;

            return (
              <div
                key={h.id}
                className="bg-white rounded-sm border border-brand-border p-5 shadow-2xs hover:shadow-sm hover:border-brand-primary transition flex flex-col justify-between space-y-4 group"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-brand-dark tracking-tight">
                          {h.holdNo}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyHoldNo(h.holdNo, h.id)}
                          className="text-slate-400 hover:text-brand-primary transition cursor-pointer"
                          title="Copy Hold #"
                        >
                          {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <Clock size={11} />
                        <span>{timeAgo(h.createdAt)}</span>
                        <span>&bull;</span>
                        <span>{new Date(h.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      PARKED
                    </span>
                  </div>

                  {/* Customer / Note details */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <User size={12} className="text-brand-primary shrink-0" />
                      <span className="font-medium truncate">
                        {h.customerId ? `Customer ID: ${h.customerId}` : "Walk-in Customer"}
                      </span>
                    </div>
                    {h.note && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-sm border border-slate-100">
                        <FileText size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="italic line-clamp-2">{h.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Items snapshot */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Items Breakdown</span>
                      <span>{itemCount} units</span>
                    </div>
                    <div className="space-y-1 divide-y divide-slate-100 bg-slate-50/70 p-2.5 rounded-sm border border-slate-100 text-xs">
                      {h.cartSnapshot.slice(0, 3).map((item, idx) => {
                        const lineTotal = item.lineTotal || (item.qty || 1) * (item.unitPrice || 0);
                        return (
                          <div key={idx} className="flex justify-between items-center gap-2 py-1 first:pt-0 last:pb-0">
                            <span className="font-medium text-slate-700 truncate min-w-0 flex-1" title={item.name}>
                              {item.name}
                            </span>
                            <div className="text-right tabular-nums text-slate-600 font-semibold shrink-0">
                              <span className="text-slate-400 font-normal mr-1.5 text-[11px]">×{item.qty || 1}</span>
                              {formatMoney(lineTotal)}
                            </div>
                          </div>
                        );
                      })}
                      {h.cartSnapshot.length > 3 && (
                        <p className="text-[11px] text-brand-primary font-semibold pt-1 text-center">
                          +{h.cartSnapshot.length - 3} more items in cart
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer & Actions */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Cart Amount</span>
                    <span className="text-base font-black text-brand-dark tabular-nums">
                      {formatMoney(total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CustomButton
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      icon={PlayCircle}
                      onClick={() => handleResumeHold(h)}
                    >
                      Resume in POS
                    </CustomButton>
                    <button
                      type="button"
                      onClick={() => setSelectedHold(h)}
                      className="h-9 px-3 rounded-sm border border-brand-border text-brand-dark hover:bg-brand-50 transition cursor-pointer flex items-center justify-center text-xs font-semibold"
                      title="Inspect Cart Details"
                    >
                      <Eye size={13} className="mr-1" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => setHoldToDelete(h)}
                      className="h-9 w-9 rounded-sm border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer flex items-center justify-center shrink-0"
                      title="Discard Cart"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table View ── */}
      {!loading && filteredHolds.length > 0 && viewMode === "table" && (
        <div className="bg-white rounded-sm border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Hold Reference</th>
                  <th className="py-3 px-4">Parked Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items / Snapshot</th>
                  <th className="py-3 px-4 text-right">Cart Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHolds.map((h) => {
                  const total = getHoldTotal(h);
                  const itemCount = getHoldItemCount(h);
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {h.holdNo}
                        {h.note && (
                          <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{h.note}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <div>{timeAgo(h.createdAt)}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(h.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {h.customerId ? `Customer #${h.customerId}` : "Walk-in"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{itemCount} units</span>
                        <span className="text-slate-400 ml-1">({h.cartSnapshot.length} types)</span>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {h.cartSnapshot.map((i) => i.name).join(", ")}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-800 tabular-nums">
                        {formatMoney(total)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <CustomButton
                            variant="primary"
                            size="sm"
                            icon={PlayCircle}
                            onClick={() => handleResumeHold(h)}
                          >
                            Resume
                          </CustomButton>
                          <button
                            type="button"
                            onClick={() => setSelectedHold(h)}
                            className="h-9 w-9 rounded-sm border border-brand-border text-brand-primary hover:bg-brand-50 transition cursor-pointer inline-flex items-center justify-center"
                            title="View items"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setHoldToDelete(h)}
                            className="h-9 w-9 rounded-sm border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer inline-flex items-center justify-center"
                            title="Discard"
                          >
                            <Trash2 size={14} />
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
      )}

      {/* ── Modal: View Hold Details ── */}
      <CustomModal
        isOpen={!!selectedHold}
        onClose={() => setSelectedHold(null)}
        title={`Parked Cart Details: ${selectedHold?.holdNo || ""}`}
        size="lg"
      >
        {selectedHold && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-sm border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parked Timestamp</span>
                <p className="font-semibold text-slate-800">
                  {new Date(selectedHold.createdAt).toLocaleString()} ({timeAgo(selectedHold.createdAt)})
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Customer</span>
                <p className="font-semibold text-slate-800">
                  {selectedHold.customerId ? `Customer ID: ${selectedHold.customerId}` : "Walk-in Customer"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                <span className="block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                  PARKED
                </span>
              </div>
            </div>

            {selectedHold.note && (
              <div className="p-3 bg-amber-50/50 rounded-sm border border-amber-100 text-amber-900">
                <span className="font-bold text-[11px] block mb-0.5">Cashier Note:</span>
                <p>{selectedHold.note}</p>
              </div>
            )}

            {/* Cart table */}
            <div className="border border-slate-200 rounded-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedHold.cartSnapshot.map((item, idx) => {
                    const price = item.unitPrice || 0;
                    const qty = item.qty || 1;
                    const lineTotal = item.lineTotal || price * qty;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.name}
                          {item.sku && <span className="block text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{formatMoney(price)}</td>
                        <td className="py-2.5 px-3 text-center tabular-nums font-semibold">{qty}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-black text-slate-800">
                          {formatMoney(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-500">
                      Estimated Cart Total:
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-black text-slate-900 tabular-nums">
                      {formatMoney(getHoldTotal(selectedHold))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedHold(null)}
              >
                Close
              </CustomButton>
              <CustomButton
                variant="primary"
                size="sm"
                icon={PlayCircle}
                onClick={() => {
                  setSelectedHold(null);
                  handleResumeHold(selectedHold);
                }}
              >
                Resume Cart in POS
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ── Modal: Confirm Discard ── */}
      <ConfirmModal
        isOpen={!!holdToDelete}
        onClose={() => setHoldToDelete(null)}
        onConfirm={confirmDeleteHold}
        type="DANGER"
        title="Discard Parked Cart?"
        message={`Are you sure you want to discard held cart "${holdToDelete?.holdNo}"? This action cannot be undone.`}
        confirmText="Discard Cart"
        loading={deleting}
      />
    </div>
  );
}
