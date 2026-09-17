"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Warehouse as WhIcon,
  Building2,
  Layers,
  Grid3X3,
  Package,
  ArrowRightLeft,
  Sparkles,
  Boxes,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomModal,
  CustomInput,
  CustomStatCard,
  CustomTable,
  CustomDropdownSelect,
  CustomCard,
  type CustomTableColumn,
} from "@/components/custom";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string | null;
  status: "ACTIVE" | "INACTIVE";
  isLocationBased: boolean;
  branch: { id: string; name: string; code: string };
  _count: { stockRows: number; terminals: number; binCount?: number };
}

interface LocationBin {
  id: string;
  rowCode: string;
  colCode: string;
  rackCode: string;
  binCode: string;
  fullCode: string;
  name: string;
  type: string;
  maxCapacity: number | null;
  status: "ACTIVE" | "INACTIVE" | "FULL" | "LOCKED";
  totalQty?: number;
  productCount?: number;
}

interface HierarchyRack {
  rackCode: string;
  bins: LocationBin[];
}

interface HierarchyCol {
  colCode: string;
  racks: HierarchyRack[];
}

interface HierarchyRow {
  rowCode: string;
  cols: HierarchyCol[];
}

interface LocationsPayload {
  warehouse: { id: string; name: string; code: string; isLocationBased: boolean };
  totalBins: number;
  locations: LocationBin[];
  hierarchy: HierarchyRow[];
}

interface BinStockRow {
  id: string;
  binId: string;
  binCode: string;
  binName: string;
  rowCode: string;
  colCode: string;
  rackCode: string;
  productId: string;
  productName: string;
  productSku: string;
  productBarcode?: string;
  qtyOnHand: number;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");

  // Create Warehouse Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whBranchId, setWhBranchId] = useState("");
  const [whType, setWhType] = useState("BRANCH");
  const [isLocationBased, setIsLocationBased] = useState(false);
  const [creating, setCreating] = useState(false);

  // Manage Locations Drawer/Modal
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [locationData, setLocationData] = useState<LocationsPayload | null>(null);
  const [binStocks, setBinStocks] = useState<BinStockRow[]>([]);
  const [locTab, setLocTab] = useState<"grid" | "generator" | "inventory" | "single">("grid");
  const [locLoading, setLocLoading] = useState(false);

  // Bulk Generator State (4-Steps: Row, Col, Rack, Bin)
  const [genRows, setGenRows] = useState(2);
  const [genCols, setGenCols] = useState(3);
  const [genRacks, setGenRacks] = useState(4);
  const [genBins, setGenBins] = useState(2);
  const [genGenerating, setGenGenerating] = useState(false);

  // Single Bin State
  const [singleRow, setSingleRow] = useState("R01");
  const [singleCol, setSingleCol] = useState("C01");
  const [singleRack, setSingleRack] = useState("RK01");
  const [singleBin, setSingleBin] = useState("B01");
  const [singleAdding, setSingleAdding] = useState(false);

  // Bin Stock Transfer Modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveFromBin, setMoveFromBin] = useState("");
  const [moveToBin, setMoveToBin] = useState("");
  const [moveProduct, setMoveProduct] = useState("");
  const [moveQty, setMoveQty] = useState(1);
  const [moving, setMoving] = useState(false);

  function loadWarehouses() {
    setLoading(true);
    Promise.all([
      api.get<{ data: Warehouse[] }>("/api/v1/warehouses"),
      api.get<{ data: Branch[] }>("/api/v1/branches").catch(() => ({ data: [] })),
    ])
      .then(([whRes, brRes]) => {
        setWarehouses(whRes.data || []);
        setBranches(brRes.data || []);
        if (brRes.data?.[0]?.id) {
          setWhBranchId(brRes.data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadWarehouses();
  }, []);

  async function handleCreateWarehouse() {
    if (!whName.trim()) return alert("Please enter warehouse name");
    setCreating(true);
    try {
      await api.post("/api/v1/warehouses", {
        branchId: whBranchId,
        name: whName.trim(),
        code: whCode.trim() || undefined,
        type: whType,
        isLocationBased,
      });
      setShowCreateModal(false);
      setWhName("");
      setWhCode("");
      setIsLocationBased(false);
      loadWarehouses();
    } catch (e: any) {
      alert(e.message || "Failed to create warehouse");
    } finally {
      setCreating(false);
    }
  }

  async function openLocationManager(wh: Warehouse) {
    setSelectedWarehouse(wh);
    setLocTab("grid");
    setLocLoading(true);
    try {
      const [locRes, stockRes] = await Promise.all([
        api.get<{ data: LocationsPayload }>(`/api/v1/warehouses/${wh.id}/locations`),
        api.get<{ data: BinStockRow[] }>(`/api/v1/warehouses/${wh.id}/bin-stocks`).catch(() => ({ data: [] })),
      ]);
      setLocationData(locRes.data);
      setBinStocks(stockRes.data || []);
    } catch (e: any) {
      alert(e.message || "Failed to load locations");
    } finally {
      setLocLoading(false);
    }
  }

  async function reloadLocations(whId: string) {
    setLocLoading(true);
    try {
      const [locRes, stockRes] = await Promise.all([
        api.get<{ data: LocationsPayload }>(`/api/v1/warehouses/${whId}/locations`),
        api.get<{ data: BinStockRow[] }>(`/api/v1/warehouses/${whId}/bin-stocks`).catch(() => ({ data: [] })),
      ]);
      setLocationData(locRes.data);
      setBinStocks(stockRes.data || []);
      loadWarehouses();
    } catch (e: any) {
      console.error(e);
    } finally {
      setLocLoading(false);
    }
  }

  async function handleBulkGenerate() {
    if (!selectedWarehouse) return;
    setGenGenerating(true);
    try {
      const res = await api.post<{ data: any }>(`/api/v1/warehouses/${selectedWarehouse.id}/locations/bulk-generate`, {
        rows: { prefix: "R", count: genRows, pad: 2 },
        cols: { prefix: "C", count: genCols, pad: 2 },
        racks: { prefix: "RK", count: genRacks, pad: 2 },
        bins: { prefix: "B", count: genBins, pad: 2 },
      });
      alert(res.data?.message || "Locations generated successfully!");
      setLocTab("grid");
      reloadLocations(selectedWarehouse.id);
    } catch (e: any) {
      alert(e.message || "Generation failed");
    } finally {
      setGenGenerating(false);
    }
  }

  async function handleAddSingleBin() {
    if (!selectedWarehouse) return;
    setSingleAdding(true);
    try {
      await api.post(`/api/v1/warehouses/${selectedWarehouse.id}/locations`, {
        rowCode: singleRow.trim(),
        colCode: singleCol.trim(),
        rackCode: singleRack.trim(),
        binCode: singleBin.trim(),
      });
      setLocTab("grid");
      reloadLocations(selectedWarehouse.id);
    } catch (e: any) {
      alert(e.message || "Failed to add bin");
    } finally {
      setSingleAdding(false);
    }
  }

  async function handleDeleteBin(binId: string) {
    if (!selectedWarehouse) return;
    if (!confirm("Are you sure you want to delete this bin location?")) return;
    try {
      await api.del(`/api/v1/warehouses/${selectedWarehouse.id}/locations/${binId}`);
      reloadLocations(selectedWarehouse.id);
    } catch (e: any) {
      alert(e.message || "Cannot delete bin");
    }
  }

  async function handleMoveStock() {
    if (!selectedWarehouse) return;
    if (!moveFromBin || !moveToBin || !moveProduct || moveQty <= 0) {
      return alert("Please fill in all move parameters");
    }
    setMoving(true);
    try {
      await api.post(`/api/v1/warehouses/${selectedWarehouse.id}/bin-stocks/transfer`, {
        fromBinId: moveFromBin,
        toBinId: moveToBin,
        productId: moveProduct,
        qty: Number(moveQty),
      });
      setShowMoveModal(false);
      setMoveFromBin("");
      setMoveToBin("");
      setMoveProduct("");
      reloadLocations(selectedWarehouse.id);
    } catch (e: any) {
      alert(e.message || "Stock transfer failed");
    } finally {
      setMoving(false);
    }
  }

  // Statistics
  const stats = useMemo(() => {
    const totalWh = warehouses.length;
    const locationEnabled = warehouses.filter((w) => w.isLocationBased).length;
    const totalBins = warehouses.reduce((acc, w) => acc + (w._count?.binCount || 0), 0);
    const totalSkus = warehouses.reduce((acc, w) => acc + (w._count?.stockRows || 0), 0);
    return { totalWh, locationEnabled, totalBins, totalSkus };
  }, [warehouses]);

  // Filtered warehouses
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = wh.name.toLowerCase().includes(q);
        const matchCode = wh.code.toLowerCase().includes(q);
        const matchBranch = wh.branch?.name?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchBranch) return false;
      }
      if (typeFilter !== "ALL" && wh.type !== typeFilter) return false;
      if (locationFilter === "LOCATION_BASED" && !wh.isLocationBased) return false;
      if (locationFilter === "STANDARD" && wh.isLocationBased) return false;
      return true;
    });
  }, [warehouses, search, typeFilter, locationFilter]);

  // Dropdown options
  const branchOptions = useMemo(() => {
    return branches.map((b) => ({
      value: b.id,
      label: `${b.name} (${b.code})`,
    }));
  }, [branches]);

  const warehouseTypeOptions = [
    { value: "BRANCH", label: "Branch On-Premise Store" },
    { value: "CENTRAL", label: "Central Distribution Warehouse" },
    { value: "RETAIL", label: "Retail Shelf & Display" },
    { value: "COLD_STORAGE", label: "Cold Storage / Refrigerated" },
    { value: "TRANSIT", label: "In-Transit Holding Hub" },
  ];

  const typeFilterOptions = [
    { value: "ALL", label: "All Warehouse Types" },
    ...warehouseTypeOptions,
  ];

  const locationFilterOptions = [
    { value: "ALL", label: "All Storage Types" },
    { value: "LOCATION_BASED", label: "4-Tier Bin Enabled" },
    { value: "STANDARD", label: "Standard Hubs" },
  ];

  // Table Columns
  const columns: CustomTableColumn<Warehouse>[] = [
    {
      key: "code",
      header: "Code",
      align: "left",
      width: "11%",
      render: (w) => (
        <span className="font-mono font-bold text-xs text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded-sm border border-sky-200/80">
          {w.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Warehouse Name",
      align: "left",
      width: "22%",
      render: (w) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-sky-50 border border-sky-200/80 text-[#0284C7]">
            <WhIcon size={15} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-xs text-slate-900 truncate">{w.name}</div>
            {w.isLocationBased ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#0284C7] font-medium">
                <Layers size={11} /> 4-Tier Bin Enabled
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Standard Hub</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "branch",
      header: "Branch Outlet",
      align: "left",
      width: "14%",
      render: (w) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Building2 size={13} className="text-slate-400 shrink-0" />
          <span>{w.branch?.name || "Unassigned"}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      align: "center",
      width: "10%",
      render: (w) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {w.type || "BRANCH"}
        </span>
      ),
    },
    {
      key: "locations",
      header: "Storage Hierarchy",
      align: "center",
      width: "14%",
      render: (w) =>
        w.isLocationBased ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[11px] font-bold bg-sky-50 border border-sky-200 text-[#0369A1]">
            <Layers size={11} className="text-[#0284C7]" />
            {w._count?.binCount || 0} Bins
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
            Standard (No Bins)
          </span>
        ),
    },
    {
      key: "inventory",
      header: "Inventory SKUs",
      align: "center",
      width: "10%",
      render: (w) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Package size={13} className="text-slate-400" />
          <span className="font-mono font-bold text-slate-800">{w._count?.stockRows || 0}</span> SKUs
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "8%",
      render: (w) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold border ${
            w.status === "ACTIVE"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              w.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          {w.status === "ACTIVE" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "11%",
      render: (w) => (
        <div className="flex items-center justify-end gap-2">
          {w.isLocationBased ? (
            <CustomButton
              size="sm"
              variant="outline"
              onClick={() => openLocationManager(w)}
              leftIcon={Grid3X3}
            >
              Manage Bins
            </CustomButton>
          ) : (
            <span className="text-xs text-slate-300 font-mono pr-4">—</span>
          )}
        </div>
      ),
    },
  ];

  // Bin Stock Table Columns
  const binStockColumns: CustomTableColumn<BinStockRow>[] = [
    {
      key: "binCode",
      header: "Bin Code",
      align: "left",
      width: "140px",
      render: (st) => (
        <span className="font-mono font-bold text-xs text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded-sm border border-sky-200/80">
          {st.binCode}
        </span>
      ),
    },
    {
      key: "product",
      header: "Product Name",
      align: "left",
      render: (st) => (
        <span className="font-semibold text-xs text-slate-900">{st.productName}</span>
      ),
    },
    {
      key: "sku",
      header: "SKU / Barcode",
      align: "left",
      width: "170px",
      render: (st) => (
        <span className="font-mono text-xs text-slate-500">
          {st.productSku || st.productBarcode || "—"}
        </span>
      ),
    },
    {
      key: "qty",
      header: "Quantity in Bin",
      align: "right",
      width: "150px",
      render: (st) => (
        <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
          {Number(st.qtyOnHand).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header & Breadcrumb */}
      <CustomBreadcrumb
        title="Warehouses & Locations"
        icon={<WhIcon size={16} className="text-[#0284C7]" />}
        breadcrumbs={[
          { label: "Operations", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Warehouses" },
        ]}
        actions={
          <CustomButton
            size="sm"
            variant="primary"
            themeColor="primary"
            leftIcon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Add Warehouse
          </CustomButton>
        }
      />

      {/* 2. Executive Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CustomStatCard
          label="Total Warehouses"
          value={loading ? "—" : String(stats.totalWh)}
          icon={WhIcon}
          tone="primary"
        />
        <CustomStatCard
          label="Location-Enabled Hubs"
          value={loading ? "—" : String(stats.locationEnabled)}
          icon={Grid3X3}
          tone="blue"
        />
        <CustomStatCard
          label="Total Bin Locations"
          value={loading ? "—" : String(stats.totalBins)}
          icon={Layers}
          tone="violet"
        />
        <CustomStatCard
          label="Tracked Stock SKUs"
          value={loading ? "—" : String(stats.totalSkus)}
          icon={Package}
          tone="green"
        />
      </div>

      {/* 3. MAIN UNIFIED CARD: TOOLBAR + WAREHOUSES TABLE */}
      <CustomCard
        title="Warehouse & Storage Directory"
        icon={WhIcon}
        actions={
          <span className="rounded-sm bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-[#0284C7] border border-sky-200/80">
            {filteredWarehouses.length} Warehouses
          </span>
        }
        bodyClassName="p-0"
      >
        {/* Card Header Toolbar: Search & Filters */}
        <div className="border-b border-sky-100/70 p-3.5 bg-sky-50/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <CustomInput
              placeholder="Search warehouse name, code, or branch..."
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
              options={typeFilterOptions}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="Filter by Type..."
              containerClassName="w-full"
              className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
            />
            <CustomDropdownSelect
              options={locationFilterOptions}
              value={locationFilter}
              onChange={setLocationFilter}
              placeholder="Filter by Storage Hierarchy..."
              containerClassName="w-full"
              className="h-[38px] text-xs font-medium text-gray-600 shadow-2xs"
            />
          </div>
        </div>

        {/* Warehouses Table */}
        <CustomTable<Warehouse>
          columns={columns}
          data={filteredWarehouses}
          rowKey="id"
          loading={loading}
          emptyMessage="No warehouses found matching current criteria."
          pageSize={10}
          showPagination={true}
        />
      </CustomCard>

      {/* 5. CREATE WAREHOUSE MODAL */}
      <CustomModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Warehouse"
        size="2xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CustomInput
              label="Warehouse Name *"
              placeholder="e.g. Central Hub / Store Room 1"
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
            />
            <CustomInput
              label="Warehouse Code (Optional)"
              placeholder="e.g. WH-DHK-01"
              value={whCode}
              onChange={(e) => setWhCode(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Branch Outlet <span className="text-red-500">*</span>
              </label>
              <CustomDropdownSelect
                options={branchOptions}
                value={whBranchId}
                onChange={setWhBranchId}
                placeholder="Select Branch..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Warehouse Type
              </label>
              <CustomDropdownSelect
                options={warehouseTypeOptions}
                value={whType}
                onChange={setWhType}
                placeholder="Select Warehouse Type..."
              />
            </div>
          </div>

          {/* Location-based checkbox feature */}
          <div className="rounded-sm border border-sky-100 bg-sky-50/40 p-3.5 transition-all">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isLocationBased}
                onChange={(e) => setIsLocationBased(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0284C7] focus:ring-[#0284C7] accent-[#0284C7]"
              />
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-semibold text-slate-900">
                  Enable Location-Based Warehouse (Row, Col, Rack, Bin)
                </span>
                <p className="text-[11px] text-slate-500">
                  If enabled, products in this warehouse can be assigned and tracked by a 4-tier bin hierarchy
                  (e.g. <span className="font-mono text-[#0284C7] font-bold">R01-C01-RK01-B01</span>). You can generate all bins in 1-click.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <CustomButton variant="danger" onClick={() => setShowCreateModal(false)}>
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              themeColor="primary"
              loading={creating}
              onClick={handleCreateWarehouse}
            >
              Create Warehouse
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* 6. MANAGE LOCATIONS / BINS MODAL */}
      {selectedWarehouse && (
        <CustomModal
          open={!!selectedWarehouse}
          onClose={() => setSelectedWarehouse(null)}
          title={`Location Management — ${selectedWarehouse.name} (${selectedWarehouse.code})`}
          size="6xl"
        >
          <div className="space-y-5">
            {/* Top Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setLocTab("grid")}
                className={`flex items-center gap-2 rounded-sm px-3.5 py-2 text-xs transition-all ${
                  locTab === "grid"
                    ? "bg-sky-50 text-[#0284C7] font-bold border border-sky-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent font-medium"
                }`}
              >
                <Grid3X3 size={15} className={locTab === "grid" ? "text-[#0284C7]" : "text-slate-400"} />
                <span>Hierarchy & Bin Grid</span>
                <span className="rounded-sm bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-[#0369A1]">
                  {locationData?.totalBins || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLocTab("inventory")}
                className={`flex items-center gap-2 rounded-sm px-3.5 py-2 text-xs transition-all ${
                  locTab === "inventory"
                    ? "bg-sky-50 text-[#0284C7] font-bold border border-sky-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent font-medium"
                }`}
              >
                <Boxes size={15} className={locTab === "inventory" ? "text-[#0284C7]" : "text-slate-400"} />
                <span>Bin Product Inventory</span>
                <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                  {binStocks.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLocTab("generator")}
                className={`flex items-center gap-2 rounded-sm px-3.5 py-2 text-xs transition-all ${
                  locTab === "generator"
                    ? "bg-sky-50 text-[#0284C7] font-bold border border-sky-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent font-medium"
                }`}
              >
                <Sparkles size={15} className={locTab === "generator" ? "text-[#0284C7]" : "text-slate-400"} />
                <span>1-Click Bulk Generator</span>
              </button>
              <button
                type="button"
                onClick={() => setLocTab("single")}
                className={`flex items-center gap-2 rounded-sm px-3.5 py-2 text-xs transition-all ${
                  locTab === "single"
                    ? "bg-sky-50 text-[#0284C7] font-bold border border-sky-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent font-medium"
                }`}
              >
                <Plus size={15} className={locTab === "single" ? "text-[#0284C7]" : "text-slate-400"} />
                <span>Add Single Bin</span>
              </button>
            </div>

            {locLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#0284C7] mb-3" />
                <p className="text-xs text-slate-500 font-medium">Loading warehouse locations...</p>
              </div>
            ) : (
              <>
                {/* TAB 1: 4-TIER HIERARCHY / GRID VIEW */}
                {locTab === "grid" && (
                  <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
                    {locationData?.hierarchy && locationData.hierarchy.length > 0 ? (
                      locationData.hierarchy.map((row) => (
                        <div key={row.rowCode} className="rounded-sm border border-slate-200 bg-slate-50/70 p-4 shadow-2xs">
                          {/* Row Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <span className="flex items-center gap-1.5 rounded-sm bg-[#0284C7] px-2.5 py-1 font-mono text-xs font-bold text-white shadow-2xs">
                                <Layers size={13} />
                                Row / Aisle: {row.rowCode}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {row.cols.length} Column{row.cols.length > 1 ? "s" : ""}
                              </span>
                            </div>
                            <span className="rounded-sm bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
                              {row.cols.reduce((acc, c) => acc + c.racks.reduce((rAcc, rk) => rAcc + rk.bins.length, 0), 0)} Bins in Row
                            </span>
                          </div>

                          {/* Columns Grid */}
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {row.cols.map((col) => (
                              <div key={col.colCode} className="rounded-sm border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col justify-between">
                                <div>
                                  {/* Column Header */}
                                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-[#0284C7]" />
                                      Column / Bay: <span className="font-mono text-[#0284C7] font-extrabold">{col.colCode}</span>
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-400">
                                      {col.racks.length} Rack{col.racks.length > 1 ? "s" : ""}
                                    </span>
                                  </div>

                                  {/* Racks List */}
                                  <div className="space-y-2.5">
                                    {col.racks.map((rack) => (
                                      <div key={rack.rackCode} className="rounded-sm bg-slate-50/80 p-2.5 border border-slate-200">
                                        <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <span className="rounded-sm bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 font-semibold">
                                              Rack: {rack.rackCode}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-slate-400 font-medium">
                                            {rack.bins.length} Bin{rack.bins.length > 1 ? "s" : ""}
                                          </span>
                                        </div>

                                        {/* Bins Grid */}
                                        <div className="grid grid-cols-2 gap-2">
                                          {rack.bins.map((bin) => {
                                            const qty = Number(bin.totalQty || 0);
                                            const isOccupied = qty > 0;
                                            return (
                                              <div
                                                key={bin.id}
                                                className={`group relative rounded-sm border p-2 transition-all ${
                                                  isOccupied
                                                    ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 shadow-2xs"
                                                    : "border-slate-200 bg-white hover:border-[#0284C7] hover:shadow-2xs"
                                                }`}
                                              >
                                                <div className="flex items-start justify-between">
                                                  <div className="font-mono text-xs font-bold text-slate-900">
                                                    {bin.binCode}
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteBin(bin.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-0.5 rounded-sm hover:bg-red-50"
                                                    title="Delete this bin location"
                                                  >
                                                    <Trash2 size={12} />
                                                  </button>
                                                </div>

                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={bin.fullCode}>
                                                  {bin.fullCode}
                                                </div>

                                                <div className="mt-1.5 flex items-center justify-between">
                                                  <span
                                                    className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${
                                                      isOccupied
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-slate-100 text-slate-500"
                                                    }`}
                                                  >
                                                    <Package size={10} />
                                                    {qty} Qty
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-sm border-2 border-dashed border-slate-200 py-16 text-center bg-slate-50/50">
                        <Layers size={36} className="mx-auto text-slate-300 mb-2.5" />
                        <h3 className="text-sm font-bold text-slate-800">No Bin Locations Configured Yet</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                          This location-based warehouse needs bins setup. You can generate all Rows, Columns, Racks, and Bins in 1 click!
                        </p>
                        <CustomButton
                          size="sm"
                          variant="primary"
                          themeColor="primary"
                          onClick={() => setLocTab("generator")}
                          leftIcon={Sparkles}
                        >
                          Open 1-Click Bulk Generator
                        </CustomButton>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: BIN INVENTORY */}
                {locTab === "inventory" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Products currently placed inside specific bin locations in this warehouse.
                      </p>
                      {binStocks.length > 0 && (
                        <CustomButton
                          size="sm"
                          variant="primary"
                          themeColor="primary"
                          onClick={() => setShowMoveModal(true)}
                          leftIcon={ArrowRightLeft}
                        >
                          Move Stock Between Bins
                        </CustomButton>
                      )}
                    </div>

                    <CustomTable<BinStockRow>
                      columns={binStockColumns}
                      data={binStocks}
                      rowKey="id"
                      emptyMessage="No products placed in bins yet."
                      pageSize={10}
                      showPagination={true}
                    />
                  </div>
                )}

                {/* TAB 3: 1-CLICK BULK GENERATOR */}
                {locTab === "generator" && (
                  <div className="space-y-4 rounded-sm border border-sky-100 bg-sky-50/20 p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-[#0284C7]" />
                      <h3 className="text-sm font-bold text-slate-900">4-Tier Grid Location Generator</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Configure your grid dimensions. The generator will create all Row × Column × Rack × Bin combinations automatically.
                    </p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
                      <CustomInput
                        label="1. Rows / Aisles"
                        type="number"
                        min={1}
                        max={50}
                        value={genRows}
                        onChange={(e) => setGenRows(Number(e.target.value))}
                        helperText="Prefix: R01, R02..."
                      />
                      <CustomInput
                        label="2. Columns / Bays"
                        type="number"
                        min={1}
                        max={50}
                        value={genCols}
                        onChange={(e) => setGenCols(Number(e.target.value))}
                        helperText="Prefix: C01, C02..."
                      />
                      <CustomInput
                        label="3. Racks / Levels"
                        type="number"
                        min={1}
                        max={50}
                        value={genRacks}
                        onChange={(e) => setGenRacks(Number(e.target.value))}
                        helperText="Prefix: RK01, RK02..."
                      />
                      <CustomInput
                        label="4. Bins per Rack"
                        type="number"
                        min={1}
                        max={50}
                        value={genBins}
                        onChange={(e) => setGenBins(Number(e.target.value))}
                        helperText="Prefix: B01, B02..."
                      />
                    </div>

                    <div className="rounded-sm bg-white p-3 border border-sky-200/80 text-xs">
                      <div className="flex items-center justify-between font-medium text-slate-700">
                        <span>Total Bins to Generate:</span>
                        <span className="font-bold text-[#0284C7] text-sm">
                          {genRows * genCols * genRacks * genBins} Bins
                        </span>
                      </div>
                      <div className="mt-1 text-slate-400 font-mono text-[11px]">
                        Sample Bin Code: R01-C01-RK01-B01
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <CustomButton
                        variant="primary"
                        themeColor="primary"
                        loading={genGenerating}
                        onClick={handleBulkGenerate}
                        leftIcon={Sparkles}
                      >
                        Generate {genRows * genCols * genRacks * genBins} Bin Locations
                      </CustomButton>
                    </div>
                  </div>
                )}

                {/* TAB 4: ADD SINGLE BIN */}
                {locTab === "single" && (
                  <div className="space-y-4 rounded-sm border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-slate-900">Add Single Custom Bin</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <CustomInput
                        label="Row Code"
                        placeholder="R01"
                        value={singleRow}
                        onChange={(e) => setSingleRow(e.target.value)}
                      />
                      <CustomInput
                        label="Column Code"
                        placeholder="C01"
                        value={singleCol}
                        onChange={(e) => setSingleCol(e.target.value)}
                      />
                      <CustomInput
                        label="Rack Code"
                        placeholder="RK01"
                        value={singleRack}
                        onChange={(e) => setSingleRack(e.target.value)}
                      />
                      <CustomInput
                        label="Bin Code"
                        placeholder="B01"
                        value={singleBin}
                        onChange={(e) => setSingleBin(e.target.value)}
                      />
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Generated Code: {singleRow.trim()}-{singleCol.trim()}-{singleRack.trim()}-{singleBin.trim()}
                    </div>
                    <div className="flex justify-end pt-2">
                      <CustomButton
                        variant="primary"
                        themeColor="primary"
                        loading={singleAdding}
                        onClick={handleAddSingleBin}
                        leftIcon={Plus}
                      >
                        Save Bin Location
                      </CustomButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CustomModal>
      )}

      {/* 7. INTERNAL BIN TO BIN MOVE MODAL */}
      {showMoveModal && selectedWarehouse && (
        <CustomModal
          open={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          title="Move Stock Between Bins"
          size="lg"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Stock Item to Move <span className="text-red-500">*</span>
              </label>
              <CustomDropdownSelect
                options={binStocks.map((st) => ({
                  value: `${st.productId}__${st.binId}`,
                  label: `${st.productName} (In: ${st.binCode}, Avail: ${st.qtyOnHand})`,
                }))}
                value={moveProduct ? `${moveProduct}__${moveFromBin}` : ""}
                onChange={(val) => {
                  const parts = val.split("__");
                  setMoveProduct(parts[0] || "");
                  if (parts[1]) setMoveFromBin(parts[1]);
                }}
                placeholder="Select Stock Item..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  From Source Bin <span className="text-red-500">*</span>
                </label>
                <CustomDropdownSelect
                  options={(locationData?.locations || []).map((l) => ({
                    value: l.id,
                    label: l.fullCode,
                  }))}
                  value={moveFromBin}
                  onChange={setMoveFromBin}
                  placeholder="Select Source Bin..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  To Destination Bin <span className="text-red-500">*</span>
                </label>
                <CustomDropdownSelect
                  options={(locationData?.locations || [])
                    .filter((l) => l.id !== moveFromBin)
                    .map((l) => ({
                      value: l.id,
                      label: l.fullCode,
                    }))}
                  value={moveToBin}
                  onChange={setMoveToBin}
                  placeholder="Select Destination Bin..."
                />
              </div>
            </div>

            <CustomInput
              label="Quantity to Move *"
              type="number"
              min={1}
              value={moveQty}
              onChange={(e) => setMoveQty(Number(e.target.value))}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <CustomButton variant="danger" onClick={() => setShowMoveModal(false)}>
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                themeColor="primary"
                loading={moving}
                onClick={handleMoveStock}
              >
                Confirm Internal Transfer
              </CustomButton>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
}