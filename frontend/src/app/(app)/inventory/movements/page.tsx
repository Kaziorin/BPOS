"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  Search,
  X,
  Package,
  Warehouse as WarehouseIcon,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  ArrowRight,
  Clock,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomInput,
  CustomDropdownSelect,
  CustomStatCard,
  CustomTable,
  CustomCard,
  type CustomTableColumn,
} from "@/components/custom";

interface Movement {
  id: string;
  movementType: string;
  qty: string;
  qtyBefore: string;
  qtyAfter: string;
  refType: string | null;
  refId: string | null;
  note: string | null;
  userId: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  warehouse: { id: string; name: string; code: string };
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

const MOVEMENT_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; isInbound: boolean }
> = {
  OPENING: {
    label: "Opening Stock",
    bg: "bg-sky-50 border-sky-200",
    text: "text-[#0369A1]",
    dot: "bg-[#0284C7]",
    isInbound: true,
  },
  PURCHASE_IN: {
    label: "Purchase In",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    isInbound: true,
  },
  SALE_OUT: {
    label: "Sale Out",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
    isInbound: false,
  },
  SALE_RETURN_IN: {
    label: "Sale Return",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    isInbound: true,
  },
  ADJUSTMENT_IN: {
    label: "Adjustment In",
    bg: "bg-teal-50 border-teal-200",
    text: "text-teal-700",
    dot: "bg-teal-500",
    isInbound: true,
  },
  ADJUSTMENT_OUT: {
    label: "Adjustment Out",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    isInbound: false,
  },
  TRANSFER_IN: {
    label: "Transfer In",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    isInbound: true,
  },
  TRANSFER_OUT: {
    label: "Transfer Out",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    isInbound: false,
  },
  WRITE_OFF: {
    label: "Write Off",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
    isInbound: false,
  },
  PRODUCTION_IN: {
    label: "Production In",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    isInbound: true,
  },
  PRODUCTION_OUT: {
    label: "Production Out",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    isInbound: false,
  },
};

const MOVEMENT_TYPE_OPTIONS = [
  { value: "ALL", label: "All Movement Types" },
  { value: "PURCHASE_IN", label: "Purchase In" },
  { value: "SALE_OUT", label: "Sale Out" },
  { value: "TRANSFER_IN", label: "Transfer In" },
  { value: "TRANSFER_OUT", label: "Transfer Out" },
  { value: "SALE_RETURN_IN", label: "Sale Return" },
  { value: "OPENING", label: "Opening Stock" },
  { value: "ADJUSTMENT_IN", label: "Adjustment In" },
  { value: "ADJUSTMENT_OUT", label: "Adjustment Out" },
  { value: "WRITE_OFF", label: "Write Off / Damage" },
  { value: "PRODUCTION_IN", label: "Production In" },
  { value: "PRODUCTION_OUT", label: "Production Out" },
];

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("ALL");
  const [movementType, setMovementType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Fetch Warehouses for filter dropdown
  useEffect(() => {
    api
      .get<{ data: Warehouse[] }>("/api/v1/warehouses")
      .then((res) => {
        setWarehouses(res.data || []);
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Movements
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (warehouseId !== "ALL") params.set("warehouseId", warehouseId);
    if (movementType !== "ALL") params.set("movementType", movementType);

    api
      .get<{ data: Movement[]; total: number }>(`/api/v1/inventory/movements?${params.toString()}`)
      .then((res) => {
        setMovements(res.data || []);
      })
      .catch(() => {
        setMovements([]);
      })
      .finally(() => setLoading(false));
  }, [warehouseId, movementType]);

  // 3. Client-side Search Filtering
  const filteredMovements = useMemo(() => {
    if (!search.trim()) return movements;
    const q = search.toLowerCase();
    return movements.filter((m) => {
      const pName = (m.product?.name || "").toLowerCase();
      const pSku = (m.product?.sku || "").toLowerCase();
      const wName = (m.warehouse?.name || "").toLowerCase();
      const refId = (m.refId || "").toLowerCase();
      const note = (m.note || "").toLowerCase();
      return (
        pName.includes(q) ||
        pSku.includes(q) ||
        wName.includes(q) ||
        refId.includes(q) ||
        note.includes(q)
      );
    });
  }, [movements, search]);

  // 4. Executive KPI Stats
  const stats = useMemo(() => {
    let inboundCount = 0;
    let outboundCount = 0;
    const uniqueWhs = new Set<string>();

    movements.forEach((m) => {
      const cfg = MOVEMENT_CONFIG[m.movementType];
      if (cfg?.isInbound) {
        inboundCount++;
      } else {
        outboundCount++;
      }
      if (m.warehouse?.name) {
        uniqueWhs.add(m.warehouse.name);
      }
    });

    return {
      total: movements.length,
      inboundCount,
      outboundCount,
      warehouseCount: uniqueWhs.size,
    };
  }, [movements]);

  // 5. Warehouse Filter Options
  const warehouseOptions = useMemo(() => {
    return [
      { value: "ALL", label: "All Warehouses" },
      ...warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` })),
    ];
  }, [warehouses]);

  // 6. Custom Table Columns (Balanced percentages = 100%)
  const columns: CustomTableColumn<Movement>[] = [
    {
      key: "date",
      header: "Date & Time",
      align: "left",
      width: "16%",
      render: (r) => {
        const d = new Date(r.createdAt);
        const isValid = !isNaN(d.getTime());
        const datePart = isValid
          ? d.toLocaleDateString("en-BD", { month: "short", day: "numeric", year: "numeric" })
          : r.createdAt;
        const timePart = isValid
          ? d.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })
          : "";

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              <Clock size={12} className="text-slate-400 shrink-0" />
              {datePart}
            </span>
            {timePart && <span className="text-[11px] text-slate-400 pl-4">{timePart}</span>}
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Movement Type",
      align: "left",
      width: "14%",
      render: (r) => {
        const cfg = MOVEMENT_CONFIG[r.movementType] || {
          label: r.movementType.replace(/_/g, " "),
          bg: "bg-slate-50 border-slate-200",
          text: "text-slate-700",
          dot: "bg-slate-400",
          isInbound: false,
        };

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold border ${cfg.bg} ${cfg.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "product",
      header: "Product / Item",
      align: "left",
      width: "22%",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80">
            <Package size={14} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-slate-900 truncate">
              {r.product?.name ?? (r as any).productName ?? "Unknown Product"}
            </p>
            <p className="font-mono text-[11px] text-slate-400 mt-0.5">
              {r.product?.sku ?? (r as any).productSku ?? "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse",
      align: "left",
      width: "14%",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <WarehouseIcon size={13} className="text-[#0284C7] shrink-0" />
          {r.warehouse?.name ?? (r as any).warehouseName ?? "Main Warehouse"}
        </span>
      ),
    },
    {
      key: "qty",
      header: "Qty Delta",
      align: "right",
      width: "10%",
      render: (r) => {
        const q = Number(r.qty);
        const isPos = q > 0;
        return (
          <span
            className={`font-mono font-black text-xs inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm ${
              isPos ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
            }`}
          >
            {isPos ? `+${q.toLocaleString()}` : q.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "beforeAfter",
      header: "Stock Transition",
      align: "right",
      width: "12%",
      render: (r) => (
        <div className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-200">
          <span className="text-slate-500">{Number(r.qtyBefore).toLocaleString()}</span>
          <ArrowRight size={11} className="text-slate-400" />
          <span className="font-bold text-slate-900">{Number(r.qtyAfter).toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: "ref",
      header: "Reference",
      align: "center",
      width: "12%",
      render: (r) => {
        const refLabel = r.refType ? r.refType.replace(/_/g, " ") : "Direct Action";
        const shortId = r.refId ? `#${r.refId.slice(-6)}` : "";

        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <FileText size={10} className="text-slate-400" />
              {refLabel} {shortId}
            </span>
            {r.note && (
              <span className="text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5" title={r.note}>
                {r.note}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Top Breadcrumb with Actions */}
      <CustomBreadcrumb
        title="Stock Movements & Audit"
        icon={<Activity size={16} className="text-[#0284C7]" />}
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Stock Movements" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/inventory/transfers">
              <CustomButton size="sm" variant="secondary" leftIcon={ArrowRightLeft}>
                Transfer Stock
              </CustomButton>
            </Link>
            <Link href="/inventory/stock">
              <CustomButton
                size="sm"
                variant="primary"
                themeColor="primary"
                leftIcon={Package}
              >
                Stock Levels
              </CustomButton>
            </Link>
          </div>
        }
      />

      {/* 2. Executive KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CustomStatCard
          label="Total Logged Movements"
          value={loading ? "—" : String(stats.total)}
          icon={Activity}
          tone="primary"
        />
        <CustomStatCard
          label="Inbound Operations"
          value={loading ? "—" : String(stats.inboundCount)}
          icon={TrendingUp}
          tone="green"
        />
        <CustomStatCard
          label="Outbound Operations"
          value={loading ? "—" : String(stats.outboundCount)}
          icon={TrendingDown}
          tone="red"
        />
        <CustomStatCard
          label="Active Warehouses"
          value={loading ? "—" : String(stats.warehouseCount)}
          icon={WarehouseIcon}
          tone="violet"
        />
      </div>

      {/* 3. MAIN UNIFIED CARD: TOOLBAR + MOVEMENTS TABLE */}
      <CustomCard
        title="Stock Movement Directory"
        icon={Activity}
        actions={
          <span className="rounded-sm bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-[#0284C7] border border-sky-200/80">
            {filteredMovements.length} Records
          </span>
        }
        bodyClassName="p-0"
      >
        {/* Card Header Toolbar: Search & Custom Dropdowns */}
        <div className="border-b border-sky-100/70 p-3.5 bg-sky-50/20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CustomInput
              placeholder="Search product name, SKU, reference..."
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              containerClassName="w-full"
              className="h-[38px] text-xs text-gray-600 placeholder:text-slate-400 shadow-2xs"
            />
            <CustomDropdownSelect
              options={warehouseOptions}
              value={warehouseId}
              onChange={setWarehouseId}
              placeholder="Filter by Warehouse..."
              containerClassName="w-full"
              className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
            />
            <CustomDropdownSelect
              options={MOVEMENT_TYPE_OPTIONS}
              value={movementType}
              onChange={setMovementType}
              placeholder="Filter by Movement Type..."
              containerClassName="w-full"
              className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
            />
          </div>
        </div>

        {/* Custom Table Component */}
        <CustomTable<Movement>
          columns={columns}
          data={filteredMovements}
          rowKey="id"
          loading={loading}
          emptyIcon={Activity}
          emptyMessage="No stock movements found matching criteria."
          pageSize={15}
          showPagination={true}
        />
      </CustomCard>
    </div>
  );
}
