"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  Package,
  Search,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowRightLeft,
  ClipboardList,
  Warehouse as WarehouseIcon,
  X,
  Edit,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  CustomInput,
  CustomDropdownSelect,
  CustomModal,
  type CustomTableColumn,
} from "@/components/custom";

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface StockRow {
  id: string;
  qtyOnHand: string;
  qtyReserved: string;
  avgCost: string | null;
  product: { id: string; name: string; sku: string; barcode: string | null };
  variant: { id: string; name: string; sku: string } | null;
  warehouse: { id: string; name: string; code: string };
}

function getStockStatus(avail: number) {
  if (avail <= 0) {
    return {
      label: "Out of Stock",
      bg: "bg-rose-50 border-rose-200",
      text: "text-rose-700",
      dot: "bg-rose-500",
      icon: TrendingDown,
    };
  }
  if (avail <= 5) {
    return {
      label: "Low Stock",
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
      icon: Minus,
    };
  }
  return {
    label: "In Stock",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: TrendingUp,
  };
}

export default function StockPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [rows, setRows] = useState<StockRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 25;

  // Quick Adjustment Modal State
  const [selectedRowForAdjust, setSelectedRowForAdjust] = useState<StockRow | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const openAdjustModal = (row: StockRow) => {
    setSelectedRowForAdjust(row);
    setAdjustQty(String(Number(row.qtyOnHand)));
    setAdjustNote("Inventory stock reconciliation");
  };

  const handleSaveAdjustment = async () => {
    if (!selectedRowForAdjust || !warehouseId) return;
    const qtyVal = parseFloat(adjustQty);
    if (isNaN(qtyVal) || qtyVal < 0) {
      toast.error("Please enter a valid stock quantity (0 or greater)");
      return;
    }

    setAdjusting(true);
    try {
      await api.post("/api/v1/inventory/stock/adjust", {
        productId: selectedRowForAdjust.product?.id,
        warehouseId: warehouseId,
        qty: qtyVal,
        note: adjustNote || "Manual stock adjustment",
      });
      toast.success("Stock quantity updated successfully!");
      setSelectedRowForAdjust(null);
      fetchStock();
    } catch (err: any) {
      toast.error(err.message || "Failed to update stock");
    } finally {
      setAdjusting(false);
    }
  };

  // 1. Fetch Warehouses List
  useEffect(() => {
    api
      .get<{ data: Warehouse[] }>("/api/v1/warehouses")
      .then((res) => {
        const list = res.data || [];
        setWarehouses(list);
        if (list.length > 0) {
          setWarehouseId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Stock Rows for Selected Warehouse
  const fetchStock = () => {
    if (!warehouseId) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search.trim()) params.set("search", search.trim());

    api
      .get<{ data: StockRow[]; total: number }>(
        `/api/v1/inventory/stock/${warehouseId}?${params.toString()}`
      )
      .then((res) => {
        setRows(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStock();
  }, [warehouseId, search, page]);

  // 3. Status Filtering
  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return rows;
    return rows.filter((r) => {
      const avail = Number(r.qtyOnHand) - Number(r.qtyReserved);
      if (statusFilter === "IN_STOCK") return avail > 5;
      if (statusFilter === "LOW_STOCK") return avail > 0 && avail <= 5;
      if (statusFilter === "OUT_OF_STOCK") return avail <= 0;
      return true;
    });
  }, [rows, statusFilter]);

  // 4. Quick KPI Stats
  const stats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    rows.forEach((r) => {
      const avail = Number(r.qtyOnHand) - Number(r.qtyReserved);
      if (avail <= 0) outOfStock++;
      else if (avail <= 5) lowStock++;
      else inStock++;
    });

    return { inStock, lowStock, outOfStock };
  }, [rows]);

  const columns: CustomTableColumn<StockRow>[] = [
    {
      key: "product",
      header: "Product & SKU",
      render: (r) => {
        const name = r.product?.name ?? (r as any).productName ?? "Unknown Product";
        const sku = r.variant
          ? `${r.product?.sku ?? ""} / ${r.variant.sku}`
          : (r.product?.sku ?? (r as any).productSku ?? "—");

        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-50 border border-brand-border text-brand-primary shrink-0 font-bold text-xs shadow-2xs">
              <Package size={14} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-600 text-xs truncate">{name}</p>
              <p className="font-mono text-[11px] text-slate-400 mt-0.5">{sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "warehouse",
      header: "Warehouse Location",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 font-medium">
          <WarehouseIcon size={12} className="text-brand-primary" />
          {r.warehouse?.name || "Main Warehouse"}
        </span>
      ),
    },
    {
      key: "onHand",
      header: "On Hand",
      align: "right",
      width: "110px",
      render: (r) => {
        const onHand = Math.max(0, Number(r.qtyOnHand));
        return (
          <span className="font-mono font-bold text-xs text-gray-600">
            {onHand}
          </span>
        );
      },
    },
    {
      key: "reserved",
      header: "Reserved",
      align: "right",
      width: "100px",
      render: (r) => (
        <span className="font-mono text-xs text-slate-500">
          {Math.max(0, Number(r.qtyReserved))}
        </span>
      ),
    },
    {
      key: "available",
      header: "Available Qty",
      align: "right",
      width: "120px",
      render: (r) => {
        const avail = Math.max(0, Number(r.qtyOnHand) - Number(r.qtyReserved));
        const colorClass =
          avail <= 0
            ? "text-rose-600"
            : avail <= 5
            ? "text-amber-600"
            : "text-emerald-700";

        return (
          <span className={`font-mono font-black text-xs ${colorClass}`}>
            {avail}
          </span>
        );
      },
    },
    {
      key: "avgCost",
      header: "Avg Cost",
      align: "right",
      width: "120px",
      render: (r) => (
        <span className="font-mono font-bold tabular-nums text-xs text-gray-600">
          {r.avgCost
            ? `৳${Number(r.avgCost).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "130px",
      render: (r) => {
        const avail = Number(r.qtyOnHand) - Number(r.qtyReserved);
        const cfg = getStockStatus(avail);

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold border ${cfg.bg} ${cfg.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "actions" as any,
      header: "Action",
      align: "center",
      width: "100px",
      render: (r) => (
        <CustomButton
          size="xs"
          variant="outline"
          leftIcon={Edit}
          onClick={() => openAdjustModal(r)}
          className="text-[11px] font-bold text-brand-primary border-brand-border hover:bg-brand-50 shadow-2xs"
        >
          Adjust
        </CustomButton>
      ),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header & Breadcrumb */}
      <CustomBreadcrumb
        title="Stock Levels"
        icon={<Package size={16} className="text-brand-primary" />}
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Stock Levels" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/inventory/transfers">
              <CustomButton
                size="sm"
                variant="secondary"
                leftIcon={ArrowRightLeft}
              >
                Transfer Stock
              </CustomButton>
            </Link>
            <Link href="/inventory/counts">
              <CustomButton
                size="sm"
                variant="primary"
                themeColor="primary"
                leftIcon={ClipboardList}
              >
                Physical Count
              </CustomButton>
            </Link>
          </div>
        }
      />

      {/* 2. Executive KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CustomStatCard
          label="Total Tracked SKUs"
          value={loading ? "—" : String(total)}
          icon={Package}
          tone="primary"
        />
        <CustomStatCard
          label="In Stock (Page)"
          value={loading ? "—" : String(stats.inStock)}
          icon={TrendingUp}
          tone="green"
        />
        <CustomStatCard
          label="Low Stock Alert"
          value={loading ? "—" : String(stats.lowStock)}
          icon={Minus}
          tone="amber"
        />
        <CustomStatCard
          label="Out of Stock"
          value={loading ? "—" : String(stats.outOfStock)}
          icon={TrendingDown}
          tone="red"
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CustomInput
          placeholder="Search product name, SKU..."
          leftIcon={<Search size={14} />}
          rightIcon={
            search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="text-slate-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            ) : null
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          containerClassName="w-full"
          className="h-[38px] text-xs text-gray-600 placeholder:text-slate-400 shadow-2xs"
        />

        <CustomDropdownSelect
          options={warehouses.map((w) => ({
            label: `${w.code} — ${w.name}`,
            value: w.id,
          }))}
          value={warehouseId}
          onChange={(val) => {
            setWarehouseId(val);
            setPage(1);
          }}
          placeholder="Select Warehouse"
          containerClassName="w-full"
          className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
        />

        <CustomDropdownSelect
          options={[
            { label: "All Stock Statuses", value: "ALL" },
            { label: "In Stock Only (> 5)", value: "IN_STOCK" },
            { label: "Low Stock Warning (1-5)", value: "LOW_STOCK" },
            { label: "Out of Stock (0)", value: "OUT_OF_STOCK" },
          ]}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          placeholder="Filter by Stock Status"
          containerClassName="w-full"
          className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
        />

        {(search || statusFilter !== "ALL") && (
          <div className="flex items-center">
            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setPage(1);
              }}
              className="h-[38px] text-xs"
            >
              Clear Filters
            </CustomButton>
          </div>
        )}
      </div>

      {/* 4. Warehouse Stock Ledger Table */}
      <CustomTable<StockRow>
        columns={columns}
        data={filteredRows}
        rowKey="id"
        loading={loading}
        title="Warehouse Stock Ledger"
        icon={<Package size={16} className="text-brand-primary" />}
        badge={
          <span className="rounded-sm bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-primary border border-brand-border">
            {total} Total Records
          </span>
        }
        showPagination={true}
        totalItems={total}
        currentPage={page}
        pageSize={limit}
        onPageChange={(p) => setPage(p)}
        emptyMessage="No stock records found for this warehouse."
      />

      {/* 5. Quick Stock Adjustment Modal */}
      {selectedRowForAdjust && (
        <CustomModal
          isOpen={Boolean(selectedRowForAdjust)}
          onClose={() => setSelectedRowForAdjust(null)}
          title="Adjust / Correct Stock Level"
          subtitle={`Product: ${selectedRowForAdjust.product?.name ?? "Item"} (${selectedRowForAdjust.product?.sku ?? "SKU"})`}
          size="md"
        >
          <div className="space-y-4 pt-2">
            <div className="rounded-sm bg-slate-50 border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Warehouse Location:</span>
                <span className="font-bold text-gray-700">
                  {warehouses.find((w) => w.id === warehouseId)?.name || "Main Warehouse"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Current Qty On Hand:</span>
                <span className="font-bold text-slate-700 font-mono">
                  {Number(selectedRowForAdjust.qtyOnHand)}
                </span>
              </div>
            </div>

            <div>
              <CustomInput
                label="New Corrected Stock Quantity"
                type="number"
                min="0"
                step="any"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="e.g. 50"
                helperText="Enter the actual physical count available in this warehouse"
              />
            </div>

            <div>
              <CustomInput
                label="Adjustment Reason / Note"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="e.g. Physical inventory count / Damaged stock correction"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedRowForAdjust(null)}
                disabled={adjusting}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                themeColor="primary"
                size="sm"
                loading={adjusting}
                onClick={handleSaveAdjustment}
                leftIcon={CheckCircle2}
              >
                Save Stock Adjustment
              </CustomButton>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
}
